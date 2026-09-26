import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE_MIGRATION = ROOT / "supabase/migrations/202609260002_subscription_entitlements.sql"
HARDENING_MIGRATION = ROOT / "supabase/migrations/202609260005_saas_security_hardening.sql"
PLAN_MIGRATION = ROOT / "supabase/migrations/202609260008_complete_plan_entitlements.sql"

FEATURES = (
    "session.generate",
    "session.save",
    "session.export_docx",
    "session.export_pdf",
    "ai.chat",
    "ai.attach_file",
    "ai.quality_balanced",
    "ai.quality_max",
    "planning.unit",
    "planning.experience",
    "custom.templates",
)

EXPECTED = {
    "free": (True, True, True, True, True, False, False, False, False, False, False),
    "beta_teacher": (True,) * len(FEATURES),
    "teacher": (True, True, True, True, True, True, True, False, False, False, True),
    "pro": (True,) * len(FEATURES),
}


def entitlement_rows(sql: str) -> dict[tuple[str, str], bool]:
    rows = re.findall(
        r"\('([^']+)',\s*'([^']+)',\s*(TRUE|FALSE)\)",
        sql,
        flags=re.IGNORECASE,
    )
    return {(plan, feature): enabled.upper() == "TRUE" for plan, feature, enabled in rows}


def main() -> None:
    base_sql = BASE_MIGRATION.read_text(encoding="utf-8")
    plan_sql = PLAN_MIGRATION.read_text(encoding="utf-8")
    hardening_sql = HARDENING_MIGRATION.read_text(encoding="utf-8")
    rows = entitlement_rows(base_sql) | entitlement_rows(plan_sql)

    for plan, expected_values in EXPECTED.items():
        actual = tuple(rows[(plan, feature)] for feature in FEATURES)
        assert actual == expected_values, f"Matriz incorrecta para {plan}: {actual}"

    assert set(re.findall(r"\('([^']+)',\s*'[^']+',\s*(?:TRUE|FALSE)\)", plan_sql)) == {
        "teacher",
        "pro",
    }
    assert "ON CONFLICT (plan_code, feature_key) DO UPDATE" in plan_sql
    assert "SET enabled = EXCLUDED.enabled" in plan_sql
    assert "BILLING_ENFORCEMENT" not in plan_sql.replace(
        "-- Completa la matriz comercial antes de activar BILLING_ENFORCEMENT.", ""
    )

    function_sql = hardening_sql.split(
        "CREATE OR REPLACE FUNCTION public.get_user_entitlements()", 1
    )[1].split("$$;", 1)[0]
    assert "v_plan_code TEXT := 'free'" in function_sql
    assert "s.status IN ('trialing', 'active')" in function_sql
    assert "s.current_period_end IS NULL" in function_sql
    assert "s.current_period_end >" in function_sql
    assert "v_plan_code := COALESCE(v_plan_code, 'free')" in function_sql
    assert "'canceled'" not in function_sql
    assert "'expired'" not in function_sql
    assert "INSERT INTO public.subscriptions" not in function_sql
    assert "UPDATE public.subscriptions" not in function_sql

    print("plan_entitlements.py: OK")


if __name__ == "__main__":
    main()
