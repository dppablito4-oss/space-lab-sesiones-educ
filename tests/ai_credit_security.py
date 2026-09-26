from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/202609210002_ai_credits.sql"
ADMIN_MIGRATION = ROOT / "supabase/migrations/202609250001_admin_credit_management.sql"
SAAS_HARDENING_MIGRATION = ROOT / "supabase/migrations/202609260005_saas_security_hardening.sql"
GATEWAY_MIGRATION = ROOT / "supabase/migrations/202609260006_ai_gateway_routing_telemetry.sql"
GATEWAY_IDEMPOTENCY_MIGRATION = ROOT / "supabase/migrations/202609260007_ai_gateway_idempotency.sql"
ROUTERS = [
    ROOT / "supabase/functions/openai-router/index.ts",
    ROOT / "supabase/functions/gemini-router/index.ts",
    ROOT / "supabase/functions/deepseek-router/index.ts",
]


def main() -> None:
    sql = MIGRATION.read_text(encoding="utf-8")
    admin_sql = ADMIN_MIGRATION.read_text(encoding="utf-8")
    hardening_sql = SAAS_HARDENING_MIGRATION.read_text(encoding="utf-8")
    gateway_sql = GATEWAY_MIGRATION.read_text(encoding="utf-8")
    gateway_idempotency_sql = GATEWAY_IDEMPOTENCY_MIGRATION.read_text(encoding="utf-8")
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

    for source in (admin_sql, bootstrap):
        assert "public.admin_list_ai_credit_accounts" in source
        assert "public.admin_set_ai_credits" in source
        assert "NOT public.is_admin()" in source
        assert "SECURITY DEFINER" in source
        assert "AI_CREDITS_ADMIN_UPDATE" in source
        assert "p_balance > 1000000" in source
        assert "GRANT EXECUTE ON FUNCTION public.admin_set_ai_credits" in source

    assert "FROM PUBLIC, anon, authenticated" in hardening_sql
    assert "TO service_role" in hardening_sql
    assert "CREATE OR REPLACE FUNCTION public.get_user_entitlements()" in hardening_sql
    entitlement_function = hardening_sql.split(
        "CREATE OR REPLACE FUNCTION public.get_user_entitlements()", 1
    )[1].split("$$;", 1)[0]
    assert "INSERT INTO public.subscriptions" not in entitlement_function
    assert "UPDATE public.subscriptions" not in entitlement_function
    assert "v_plan_code TEXT := 'free'" in entitlement_function
    assert "s.current_period_end IS NULL" in entitlement_function
    assert "source_type, granted_credits, remaining_credits" in hardening_sql
    assert "'adjustment'" in hardening_sql
    assert "ADD COLUMN IF NOT EXISTS requested_quality" in gateway_sql
    assert "ADD COLUMN IF NOT EXISTS route_reason" in gateway_sql
    assert "CREATE OR REPLACE FUNCTION public.record_ai_route" in gateway_sql
    assert "WHERE user_id = v_user_id" in gateway_sql
    assert "GRANT EXECUTE ON FUNCTION public.record_ai_route" in gateway_sql
    assert "CONSTRAINT uq_ai_gateway_user_request UNIQUE (user_id, request_id)" in gateway_idempotency_sql
    assert "CREATE OR REPLACE FUNCTION public.begin_ai_gateway_request" in gateway_idempotency_sql
    assert "ON CONFLICT (user_id, request_id) DO NOTHING" in gateway_idempotency_sql
    assert "CREATE OR REPLACE FUNCTION public.finish_ai_gateway_request" in gateway_idempotency_sql
    assert "AND status = 'processing'" in gateway_idempotency_sql
    assert "WHERE user_id = v_user_id" in gateway_idempotency_sql

    admin_frontend = (ROOT / "js/admin.js").read_text(encoding="utf-8")
    assert ".rpc('admin_list_ai_credit_accounts'" in admin_frontend
    assert ".rpc('admin_set_ai_credits'" in admin_frontend
    assert ".from('ai_credit_wallets').update" not in admin_frontend.replace("\n", "")

    for router in ROUTERS:
        source = router.read_text(encoding="utf-8")
        assert "reserveAiCredits" in source
        assert "completeAiUsage" in source
        assert "refundAiUsage" in source
        assert "rawData" not in source
        assert "details:" not in source
        assert '"Access-Control-Allow-Origin": "*"' not in source

    gateway = (ROOT / "supabase/functions/ai-gateway/index.ts").read_text(encoding="utf-8")
    assert "getAuthenticatedContext" in gateway
    assert "decideAiRoute" in gateway
    assert "record_ai_route" in gateway
    assert "begin_ai_gateway_request" in gateway
    assert "finish_ai_gateway_request" in gateway
    assert "AI_GLOBAL_ENABLED" in gateway

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
