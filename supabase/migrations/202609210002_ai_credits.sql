-- Stable Core V1: server-authoritative AI credit accounting.

CREATE TABLE IF NOT EXISTS public.ai_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    monthly_credits INTEGER NOT NULL CHECK (monthly_credits >= 0),
    daily_credit_limit INTEGER NOT NULL CHECK (daily_credit_limit > 0),
    requests_per_minute INTEGER NOT NULL CHECK (requests_per_minute > 0),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.ai_plans (id, name, monthly_credits, daily_credit_limit, requests_per_minute, enabled)
VALUES ('free', 'Free', 30, 15, 5, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    monthly_credits = EXCLUDED.monthly_credits,
    daily_credit_limit = EXCLUDED.daily_credit_limit,
    requests_per_minute = EXCLUDED.requests_per_minute,
    enabled = EXCLUDED.enabled,
    updated_at = timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.ai_action_costs (
    action TEXT PRIMARY KEY,
    credits INTEGER NOT NULL CHECK (credits > 0),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.ai_action_costs (action, credits, enabled) VALUES
    ('generate_session', 5, TRUE),
    ('generate_criteria', 1, TRUE),
    ('refine_text', 1, TRUE),
    ('pedagogy_brief', 1, TRUE),
    ('summarize_brief', 1, TRUE),
    ('chatbot', 1, TRUE)
ON CONFLICT (action) DO UPDATE SET
    credits = EXCLUDED.credits,
    enabled = EXCLUDED.enabled,
    updated_at = timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.ai_credit_wallets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL DEFAULT 'free' REFERENCES public.ai_plans(id),
    balance INTEGER NOT NULL DEFAULT 30 CHECK (balance >= 0),
    cycle_started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id UUID NOT NULL,
    action TEXT NOT NULL REFERENCES public.ai_action_costs(action),
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    credits INTEGER NOT NULL CHECK (credits >= 0),
    status TEXT NOT NULL CHECK (status IN ('reserved', 'success', 'refunded', 'rejected')),
    input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
    output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created
    ON public.ai_usage (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_reserved_created
    ON public.ai_usage (status, created_at)
    WHERE status = 'reserved';

ALTER TABLE public.ai_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own AI wallet" ON public.ai_credit_wallets;
CREATE POLICY "Users can read their own AI wallet"
    ON public.ai_credit_wallets FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own AI usage" ON public.ai_usage;
CREATE POLICY "Users can read their own AI usage"
    ON public.ai_usage FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

REVOKE ALL ON public.ai_plans, public.ai_action_costs, public.ai_credit_wallets, public.ai_usage FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.ai_credit_wallets, public.ai_usage FROM authenticated;
GRANT SELECT ON public.ai_credit_wallets, public.ai_usage TO authenticated;

CREATE OR REPLACE FUNCTION public.create_ai_wallet_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_monthly_credits INTEGER;
BEGIN
    SELECT monthly_credits INTO v_monthly_credits
    FROM public.ai_plans WHERE id = 'free' AND enabled = TRUE;

    INSERT INTO public.ai_credit_wallets (user_id, plan_id, balance)
    VALUES (NEW.id, 'free', COALESCE(v_monthly_credits, 30))
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_ai_wallet ON auth.users;
CREATE TRIGGER on_auth_user_ai_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_ai_wallet_for_user();

INSERT INTO public.ai_credit_wallets (user_id, plan_id, balance)
SELECT users.id, 'free', plans.monthly_credits
FROM auth.users AS users
CROSS JOIN public.ai_plans AS plans
WHERE plans.id = 'free'
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.reserve_ai_credits(
    p_request_id UUID,
    p_action TEXT,
    p_provider TEXT,
    p_model TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_wallet public.ai_credit_wallets%ROWTYPE;
    v_plan public.ai_plans%ROWTYPE;
    v_cost INTEGER;
    v_recent_requests INTEGER;
    v_daily_credits INTEGER;
    v_stale_refund INTEGER;
    v_existing_status TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'AUTH_REQUIRED');
    END IF;
    IF p_request_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_REQUEST_ID');
    END IF;

    SELECT * INTO v_wallet
    FROM public.ai_credit_wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.ai_credit_wallets (user_id, plan_id, balance)
        SELECT v_user_id, id, monthly_credits FROM public.ai_plans WHERE id = 'free'
        ON CONFLICT (user_id) DO NOTHING;
        SELECT * INTO v_wallet
        FROM public.ai_credit_wallets
        WHERE user_id = v_user_id
        FOR UPDATE;
    END IF;

    SELECT * INTO v_plan FROM public.ai_plans WHERE id = v_wallet.plan_id;
    IF NOT FOUND OR NOT v_plan.enabled THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'PLAN_DISABLED');
    END IF;

    SELECT status INTO v_existing_status
    FROM public.ai_usage
    WHERE user_id = v_user_id AND request_id = p_request_id;
    IF FOUND THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'DUPLICATE_REQUEST',
            'status', v_existing_status,
            'balance', v_wallet.balance
        );
    END IF;

    IF v_wallet.cycle_started_at + INTERVAL '1 month' <= timezone('utc', now()) THEN
        UPDATE public.ai_usage
        SET status = 'refunded', completed_at = timezone('utc', now())
        WHERE user_id = v_user_id AND status = 'reserved';

        UPDATE public.ai_credit_wallets
        SET balance = v_plan.monthly_credits,
            cycle_started_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE user_id = v_user_id
        RETURNING * INTO v_wallet;
    ELSE
        WITH stale AS (
            UPDATE public.ai_usage
            SET status = 'refunded', completed_at = timezone('utc', now())
            WHERE user_id = v_user_id
              AND status = 'reserved'
              AND created_at < timezone('utc', now()) - INTERVAL '15 minutes'
            RETURNING credits
        )
        SELECT COALESCE(sum(credits), 0)::INTEGER INTO v_stale_refund FROM stale;

        IF v_stale_refund > 0 THEN
            UPDATE public.ai_credit_wallets
            SET balance = LEAST(v_plan.monthly_credits, balance + v_stale_refund),
                updated_at = timezone('utc', now())
            WHERE user_id = v_user_id
            RETURNING * INTO v_wallet;
        END IF;
    END IF;

    SELECT credits INTO v_cost
    FROM public.ai_action_costs
    WHERE action = p_action AND enabled = TRUE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'UNKNOWN_ACTION', 'balance', v_wallet.balance);
    END IF;

    SELECT count(*)::INTEGER INTO v_recent_requests
    FROM public.ai_usage
    WHERE user_id = v_user_id
      AND created_at >= timezone('utc', now()) - INTERVAL '1 minute';
    IF v_recent_requests >= v_plan.requests_per_minute THEN
        INSERT INTO public.ai_usage (user_id, request_id, action, provider, model, credits, status, completed_at)
        VALUES (v_user_id, p_request_id, p_action, p_provider, p_model, v_cost, 'rejected', timezone('utc', now()));
        RETURN jsonb_build_object('ok', FALSE, 'code', 'RATE_LIMITED', 'balance', v_wallet.balance);
    END IF;

    SELECT COALESCE(sum(credits), 0)::INTEGER INTO v_daily_credits
    FROM public.ai_usage
    WHERE user_id = v_user_id
      AND status IN ('reserved', 'success')
      AND created_at >= date_trunc('day', timezone('utc', now()));
    IF v_daily_credits + v_cost > v_plan.daily_credit_limit THEN
        INSERT INTO public.ai_usage (user_id, request_id, action, provider, model, credits, status, completed_at)
        VALUES (v_user_id, p_request_id, p_action, p_provider, p_model, v_cost, 'rejected', timezone('utc', now()));
        RETURN jsonb_build_object('ok', FALSE, 'code', 'DAILY_LIMIT_REACHED', 'balance', v_wallet.balance);
    END IF;

    IF v_wallet.balance < v_cost THEN
        INSERT INTO public.ai_usage (user_id, request_id, action, provider, model, credits, status, completed_at)
        VALUES (v_user_id, p_request_id, p_action, p_provider, p_model, v_cost, 'rejected', timezone('utc', now()));
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INSUFFICIENT_CREDITS', 'balance', v_wallet.balance, 'required', v_cost);
    END IF;

    UPDATE public.ai_credit_wallets
    SET balance = balance - v_cost, updated_at = timezone('utc', now())
    WHERE user_id = v_user_id
    RETURNING * INTO v_wallet;

    INSERT INTO public.ai_usage (user_id, request_id, action, provider, model, credits, status)
    VALUES (v_user_id, p_request_id, p_action, p_provider, p_model, v_cost, 'reserved');

    RETURN jsonb_build_object(
        'ok', TRUE,
        'code', 'RESERVED',
        'credits', v_cost,
        'balance', v_wallet.balance,
        'planId', v_wallet.plan_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_ai_usage(
    p_request_id UUID,
    p_input_tokens INTEGER DEFAULT NULL,
    p_output_tokens INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_usage public.ai_usage%ROWTYPE;
    v_balance INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'AUTH_REQUIRED');
    END IF;

    SELECT * INTO v_usage FROM public.ai_usage
    WHERE user_id = v_user_id AND request_id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'USAGE_NOT_FOUND');
    END IF;
    IF v_usage.status = 'success' THEN
        SELECT balance INTO v_balance FROM public.ai_credit_wallets WHERE user_id = v_user_id;
        RETURN jsonb_build_object('ok', TRUE, 'code', 'ALREADY_COMPLETED', 'balance', v_balance);
    END IF;
    IF v_usage.status <> 'reserved' THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_USAGE_STATE', 'status', v_usage.status);
    END IF;

    UPDATE public.ai_usage
    SET status = 'success',
        input_tokens = CASE
            WHEN p_input_tokens IS NULL THEN NULL
            ELSE GREATEST(p_input_tokens, 0)
        END,
        output_tokens = CASE
            WHEN p_output_tokens IS NULL THEN NULL
            ELSE GREATEST(p_output_tokens, 0)
        END,
        completed_at = timezone('utc', now())
    WHERE id = v_usage.id;
    SELECT balance INTO v_balance FROM public.ai_credit_wallets WHERE user_id = v_user_id;
    RETURN jsonb_build_object('ok', TRUE, 'code', 'COMPLETED', 'balance', v_balance);
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_ai_usage(p_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_usage public.ai_usage%ROWTYPE;
    v_wallet public.ai_credit_wallets%ROWTYPE;
    v_monthly_credits INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'AUTH_REQUIRED');
    END IF;

    SELECT * INTO v_wallet FROM public.ai_credit_wallets
    WHERE user_id = v_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'WALLET_NOT_FOUND');
    END IF;

    SELECT * INTO v_usage FROM public.ai_usage
    WHERE user_id = v_user_id AND request_id = p_request_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'USAGE_NOT_FOUND');
    END IF;
    IF v_usage.status = 'refunded' THEN
        RETURN jsonb_build_object('ok', TRUE, 'code', 'ALREADY_REFUNDED', 'balance', v_wallet.balance);
    END IF;
    IF v_usage.status <> 'reserved' THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_USAGE_STATE', 'status', v_usage.status);
    END IF;

    SELECT monthly_credits INTO v_monthly_credits FROM public.ai_plans WHERE id = v_wallet.plan_id;
    UPDATE public.ai_credit_wallets
    SET balance = LEAST(v_monthly_credits, balance + v_usage.credits),
        updated_at = timezone('utc', now())
    WHERE user_id = v_user_id
    RETURNING * INTO v_wallet;

    UPDATE public.ai_usage
    SET status = 'refunded', completed_at = timezone('utc', now())
    WHERE id = v_usage.id;

    RETURN jsonb_build_object('ok', TRUE, 'code', 'REFUNDED', 'balance', v_wallet.balance);
END;
$$;

REVOKE ALL ON FUNCTION public.create_ai_wallet_for_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_ai_credits(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_ai_usage(UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.refund_ai_usage(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_ai_credits(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_ai_usage(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_ai_usage(UUID) TO authenticated;
