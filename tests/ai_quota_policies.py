import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/202609260009_ai_quota_policies.sql"

EXPECTED_POLICIES = {
    "free": (5, 15, 1),
    "beta_teacher": (20, 100, 4),
    "teacher": (10, 60, 2),
    "pro": (20, 200, 4),
}


def main() -> None:
    sql = MIGRATION.read_text(encoding="utf-8")

    assert "CREATE TABLE IF NOT EXISTS public.ai_quota_policies" in sql
    assert "REFERENCES public.subscription_plans(code)" in sql
    assert "plan_code TEXT NOT NULL UNIQUE" in sql
    assert "max_concurrent_requests INTEGER NOT NULL" in sql
    assert "FROM public.ai_plans AS legacy" in sql
    assert "COMMENT ON TABLE public.ai_plans" in sql
    assert "COMMENT ON COLUMN public.ai_credit_wallets.plan_id" in sql
    assert "DROP TABLE" not in sql.upper()
    assert "DROP COLUMN" not in sql.upper()

    rows = re.findall(
        r"\('([^']+)',\s*(\d+),\s*(\d+),\s*(\d+),\s*TRUE\)", sql
    )
    actual = {
        plan: (int(requests), int(daily), int(concurrent))
        for plan, requests, daily, concurrent in rows
    }
    assert actual == EXPECTED_POLICIES

    function_sql = sql.split(
        "CREATE OR REPLACE FUNCTION public.reserve_ai_credits", 1
    )[1].split("$$;", 1)[0]
    assert "FROM public.subscriptions AS subscription" in function_sql
    assert "subscription.status IN ('trialing', 'active')" in function_sql
    assert "subscription.current_period_end IS NULL" in function_sql
    assert "subscription.current_period_end >" in function_sql
    assert "v_plan_code := COALESCE(v_plan_code, 'free')" in function_sql
    assert "FROM public.ai_quota_policies" in function_sql
    assert "v_policy.requests_per_minute" in function_sql
    assert "v_policy.daily_credit_limit" in function_sql
    assert "v_policy.max_concurrent_requests" in function_sql
    assert "'CONCURRENT_LIMIT_REACHED'" in function_sql
    assert "'planId', v_plan_code" in function_sql
    assert "v_wallet.plan_id" not in function_sql
    assert "WHERE id = 'free'" in function_sql

    print("ai_quota_policies.py: OK")


if __name__ == "__main__":
    main()
