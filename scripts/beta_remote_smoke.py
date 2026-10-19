"""Explicit production smoke: temporary accounts, no emails, optional small AI call.

Requires an authenticated Supabase CLI. Credentials stay in memory. Only the
accounts created by this execution are removed in finally; no existing users
or documents are used. Run manually, never as an automatic CI job.
"""
import argparse
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import uuid


ROOT = Path(__file__).resolve().parents[1]
PROJECT = "koptglmifwpzrfzvipnm"
BASE = f"https://{PROJECT}.supabase.co"


def service_key():
    command = "npx.cmd" if os.name == "nt" else "npx"
    result = subprocess.run(
        [command, "--yes", "supabase", "projects", "api-keys", "--project-ref", PROJECT,
         "--reveal", "--output-format", "json"],
        capture_output=True, text=True, encoding="utf-8", check=True, timeout=45,
    )
    keys = json.loads(result.stdout)["keys"]
    return next(item["api_key"] for item in keys if item.get("name") == "service_role")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--with-ai", action="store_true", help="Make one short real generation, consuming provider credits")
    args = parser.parse_args()
    source = (ROOT / "js/supabase-client.js").read_text(encoding="utf-8")
    public_key = re.search(r"const SUPABASE_KEY = '([^']+)'", source).group(1)
    admin_key = service_key()
    users = []
    report = {"project": PROJECT, "checks": [], "cleanup": [], "ai_requested": args.with_ai}

    def call(method, path, payload=None, token=None, admin=False):
        headers = {"apikey": admin_key if admin else public_key, "Content-Type": "application/json",
                   "Origin": "https://sesiones.sypablitodp.site", "Prefer": "return=representation"}
        if admin or token:
            headers["Authorization"] = f"Bearer {admin_key if admin else token}"
        request = Request(BASE + path, method=method, headers=headers,
                          data=json.dumps(payload).encode() if payload is not None else None)
        try:
            response = urlopen(request, timeout=135)
        except HTTPError as error:
            response = error
        with response:
            raw = response.read()
            try:
                body = json.loads(raw) if raw else None
            except ValueError:
                body = None
            return response.status, body, response.headers

    def check(name, condition):
        report["checks"].append({"check": name, "passed": bool(condition)})
        print(("PASS " if condition else "FAIL ") + name, flush=True)
        if not condition:
            raise AssertionError(name)

    def wallet(token):
        status, rows, _ = call("GET", "/rest/v1/ai_credit_wallets?select=balance", token=token)
        check("wallet accessible to its owner", status == 200 and len(rows) == 1)
        return rows[0]["balance"]

    try:
        for function in ["ai-gateway", "openai-router", "gemini-router", "deepseek-router", "pablito-mailer"]:
            status, _, _ = call("POST", "/functions/v1/" + function, {})
            check(function + " rejects unauthenticated POST", status == 401)
        status, _, _ = call("GET", "/functions/v1/pablito-mailer")
        check("mailer rejects GET instead of server error", status in (401, 405))

        for _ in range(2):
            password = secrets.token_urlsafe(32)
            email = f"beta-smoke-{uuid.uuid4()}@example.invalid"
            status, user, _ = call("POST", "/auth/v1/admin/users",
                                   {"email": email, "password": password, "email_confirm": True}, admin=True)
            check("temporary account created without confirmation email", status in (200, 201) and bool(user.get("id")))
            fixture = {"id": user["id"], "token": None}
            users.append(fixture)
            status, session, _ = call("POST", "/auth/v1/token?grant_type=password", {"email": email, "password": password})
            check("password sign-in works", status == 200 and bool(session.get("access_token")))
            fixture["token"] = session["access_token"]

        a, b = users
        session_id = "beta-smoke-" + str(uuid.uuid4())
        status, _, _ = call("POST", "/rest/v1/sesiones",
                            {"id": session_id, "user_id": a["id"], "titulo": "Synthetic beta smoke"}, token=a["token"])
        check("owner can save a session", status == 201)
        status, rows, _ = call("GET", f"/rest/v1/sesiones?select=id&id=eq.{session_id}", token=b["token"])
        check("second account cannot read session", status == 200 and rows == [])
        status, _, _ = call("PATCH", f"/rest/v1/sesiones?id=eq.{session_id}", {"user_id": b["id"]}, token=a["token"])
        check("session owner cannot be reassigned", status == 403)
        status, _, _ = call("PATCH", f"/rest/v1/profiles?id=eq.{a['id']}", {"role": "admin"}, token=a["token"])
        check("profile privilege escalation blocked", status in (400, 403))
        status, _, _ = call("POST", "/functions/v1/pablito-mailer",
                            {"action": "GET_SMTP_CONFIG", "payload": {}}, token=a["token"])
        check("normal account cannot read SMTP configuration", status == 403)

        plan = json.loads((ROOT / "data/pedagogy/fixtures/secondary_math_project_unit.v2.json").read_text(encoding="utf-8"))
        plan["id"] = "beta-smoke-" + str(uuid.uuid4())
        plan["identity"]["title"] = "Synthetic beta planning"
        status, _, _ = call("POST", "/rest/v1/planning_containers", {
            "id": plan["id"], "user_id": a["id"], "schema_version": plan["schemaVersion"],
            "revision": plan["revision"], "status": plan["status"], "title": "Synthetic beta planning",
            "planning_type": plan["identity"]["planningType"], "education_level": plan["identity"]["level"],
            "container_data": plan,
        }, token=a["token"])
        check("owner can save canonical planning", status == 201)
        status, rows, _ = call("GET", f"/rest/v1/planning_containers?select=id&id=eq.{plan['id']}", token=b["token"])
        check("second account cannot read planning", status == 200 and rows == [])

        if args.with_ai:
            before = wallet(a["token"])
            payload = {"requestId": str(uuid.uuid4()), "action": "refine_text", "quality": "automatic",
                       "input": {"text": "Los estudiantes comparan cantidades.",
                                 "instruction": "Mejora la claridad en una sola oración de máximo doce palabras."}}
            status, reply, headers = call("POST", "/functions/v1/ai-gateway", payload, token=a["token"])
            report["ai"] = {"status": status, "provider": headers.get("X-AI-Provider"),
                            "model": headers.get("X-AI-Model"), "fallback_count": headers.get("X-AI-Fallback-Count"),
                            "error_code": reply.get("code") if isinstance(reply, dict) else None}
            check("real AI gateway generation works", status == 200 and isinstance(reply, str) and bool(reply.strip()))
            after = wallet(a["token"])
            status, usage, _ = call("GET", "/rest/v1/ai_usage?select=credits,status", token=a["token"])
            check("real usage charged exactly once", status == 200 and before - after == sum(row["credits"] for row in usage if row["status"] == "success") and after < before)
            status, _, _ = call("POST", "/functions/v1/ai-gateway", payload, token=a["token"])
            check("duplicate gateway request rejected", status == 409)
            check("duplicate request does not consume credits", wallet(a["token"]) == after)
            report["ai"]["charged_credits"] = before - after
    finally:
        for user in users:
            if user["token"]:
                call("POST", "/auth/v1/logout?scope=global", token=user["token"])
            status, _, _ = call("DELETE", "/auth/v1/admin/users/" + user["id"], admin=True)
            report["cleanup"].append({"id": user["id"], "deleted": status in (200, 204)})
            print("Temporary account cleanup:", "OK" if status in (200, 204) else "FAILED", flush=True)
        path = ROOT / "artifacts/beta-readiness/remote-smoke.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        if any(not result["deleted"] for result in report["cleanup"]):
            raise RuntimeError("Temporary-account cleanup requires follow-up; see the report (no credentials stored).")


if __name__ == "__main__":
    main()
