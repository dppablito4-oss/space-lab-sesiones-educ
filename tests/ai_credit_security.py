from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/202609210002_ai_credits.sql"
ROUTERS = [
    ROOT / "supabase/functions/openai-router/index.ts",
    ROOT / "supabase/functions/gemini-router/index.ts",
    ROOT / "supabase/functions/deepseek-router/index.ts",
]


def main() -> None:
    sql = MIGRATION.read_text(encoding="utf-8")
    bootstrap = (ROOT / "database_setup.sql").read_text(encoding="utf-8")
    for table in ("ai_plans", "ai_action_costs", "ai_credit_wallets", "ai_usage"):
        assert f"public.{table}" in sql
        assert f"public.{table}" in bootstrap
    for action, cost in (
        ("generate_session", 5),
        ("generate_criteria", 1),
        ("refine_text", 1),
        ("pedagogy_brief", 1),
        ("summarize_brief", 1),
        ("chatbot", 1),
    ):
        assert f"('{action}', {cost}, TRUE)" in sql

    assert "FOR UPDATE" in sql
    assert "UNIQUE (user_id, request_id)" in sql
    assert "INTERVAL '15 minutes'" in sql
    assert "requests_per_minute" in sql
    assert "daily_credit_limit" in sql
    assert "GRANT EXECUTE ON FUNCTION public.reserve_ai_credits" in sql
    assert "GRANT EXECUTE ON FUNCTION public.reserve_ai_credits" in bootstrap

    for router in ROUTERS:
        source = router.read_text(encoding="utf-8")
        assert "reserveAiCredits" in source
        assert "completeAiUsage" in source
        assert "refundAiUsage" in source
        assert "rawData" not in source
        assert "details:" not in source
        assert '"Access-Control-Allow-Origin": "*"' not in source

    frontend = "\n".join(
        path.read_text(encoding="utf-8")
        for path in (ROOT / "js").rglob("*.js")
    )
    assert "generate_session = 5" not in frontend
    assert "actionCosts" not in frontend
    assert "p_credits" not in frontend

    print("ai_credit_security.py: OK")


if __name__ == "__main__":
    main()
