-- Separa el plan comercial de los limites tecnicos de IA.
-- ai_plans y ai_credit_wallets.plan_id permanecen temporalmente como legacy.

CREATE TABLE IF NOT EXISTS public.ai_quota_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_code TEXT NOT NULL UNIQUE
        REFERENCES public.subscription_plans(code) ON DELETE CASCADE,
    requests_per_minute INTEGER NOT NULL CHECK (requests_per_minute > 0),
    daily_credit_limit INTEGER NOT NULL CHECK (daily_credit_limit > 0),
    max_concurrent_requests INTEGER NOT NULL DEFAULT 1
        CHECK (max_concurrent_requests > 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Valores iniciales conservadores. Los limites de cualquier ai_plans homonimo
-- se copian despues para no perder configuracion tecnica existente.
INSERT INTO public.ai_quota_policies (
    plan_code,
    requests_per_minute,
    daily_credit_limit,
    max_concurrent_requests,
    active
)
VALUES
    ('free', 5, 15, 1, TRUE),
    ('beta_teacher', 20, 100, 4, TRUE),
    ('teacher', 10, 60, 2, TRUE),
    ('pro', 20, 200, 4, TRUE)
ON CONFLICT (plan_code) DO UPDATE SET
    requests_per_minute = EXCLUDED.requests_per_minute,
    daily_credit_limit = EXCLUDED.daily_credit_limit,
    max_concurrent_requests = EXCLUDED.max_concurrent_requests,
    active = EXCLUDED.active,
    updated_at = timezone('utc'::text, now());

UPDATE public.ai_quota_policies AS quota
SET requests_per_minute = legacy.requests_per_minute,
    daily_credit_limit = legacy.daily_credit_limit,
    active = legacy.enabled,
    updated_at = timezone('utc'::text, now())
FROM public.ai_plans AS legacy
WHERE legacy.id = quota.plan_code;

COMMENT ON TABLE public.ai_plans IS
    'LEGACY: conservar temporalmente para wallet/bootstrap; no usar como plan comercial ni politica de cuota.';
COMMENT ON COLUMN public.ai_credit_wallets.plan_id IS
    'LEGACY: identificador tecnico del wallet; no representa el plan comercial del usuario.';

ALTER TABLE public.ai_quota_policies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_quota_policies FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ai_quota_policies TO service_role;

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
    v_plan_code TEXT := 'free';
    v_policy public.ai_quota_policies%ROWTYPE;
    v_cost INTEGER;
    v_recent_requests INTEGER;
    v_concurrent_requests INTEGER;
    v_daily_credits INTEGER;
    v_existing_status TEXT;
    v_stale_record RECORD;
    v_stale_ledger RECORD;
    v_remaining_needed INTEGER;
    v_grant RECORD;
    v_deduct_amount INTEGER;
    v_total_available_grants INTEGER := 0;
    v_new_balance INTEGER := 0;
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
        SELECT v_user_id, id, monthly_credits
        FROM public.ai_plans
        WHERE id = 'free'
        ON CONFLICT (user_id) DO NOTHING;

        SELECT * INTO v_wallet
        FROM public.ai_credit_wallets
        WHERE user_id = v_user_id
        FOR UPDATE;
    END IF;

    -- El plan comercial se resuelve desde subscriptions, nunca desde el wallet.
    SELECT subscription.plan_code
    INTO v_plan_code
    FROM public.subscriptions AS subscription
    JOIN public.subscription_plans AS plan ON plan.code = subscription.plan_code
    WHERE subscription.user_id = v_user_id
      AND subscription.status IN ('trialing', 'active')
      AND (
          subscription.current_period_end IS NULL
          OR subscription.current_period_end > timezone('utc'::text, now())
      )
      AND plan.active = TRUE
    ORDER BY subscription.updated_at DESC
    LIMIT 1;

    v_plan_code := COALESCE(v_plan_code, 'free');

    SELECT * INTO v_policy
    FROM public.ai_quota_policies
    WHERE plan_code = v_plan_code
      AND active = TRUE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'PLAN_DISABLED',
            'planId', v_plan_code
        );
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

    -- Libera reservas obsoletas antes de comprobar concurrencia.
    FOR v_stale_record IN
        SELECT id, request_id, credits
        FROM public.ai_usage
        WHERE user_id = v_user_id
          AND status = 'reserved'
          AND created_at < timezone('utc'::text, now()) - INTERVAL '15 minutes'
        FOR UPDATE
    LOOP
        FOR v_stale_ledger IN
            SELECT grant_id, abs(credits_delta) AS refund_credits
            FROM public.credit_ledger
            WHERE user_id = v_user_id
              AND request_id = v_stale_record.request_id
              AND event_type = 'reserve'
              AND credits_delta < 0
        LOOP
            IF v_stale_ledger.grant_id IS NOT NULL THEN
                UPDATE public.credit_grants
                SET remaining_credits = remaining_credits + v_stale_ledger.refund_credits,
                    updated_at = timezone('utc'::text, now())
                WHERE id = v_stale_ledger.grant_id;
            END IF;

            INSERT INTO public.credit_ledger (
                user_id, request_id, grant_id, event_type,
                credits_delta, balance_after, reason
            )
            VALUES (
                v_user_id,
                v_stale_record.request_id,
                v_stale_ledger.grant_id,
                'refund',
                v_stale_ledger.refund_credits,
                v_wallet.balance,
                'Expiracion automatica de reserva obsoleta (>15 min)'
            );
        END LOOP;

        UPDATE public.ai_usage
        SET status = 'refunded', completed_at = timezone('utc'::text, now())
        WHERE id = v_stale_record.id;
    END LOOP;

    SELECT credits INTO v_cost
    FROM public.ai_action_costs
    WHERE action = p_action AND enabled = TRUE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'UNKNOWN_ACTION',
            'balance', v_wallet.balance
        );
    END IF;

    SELECT count(*)::INTEGER INTO v_recent_requests
    FROM public.ai_usage
    WHERE user_id = v_user_id
      AND created_at >= timezone('utc'::text, now()) - INTERVAL '1 minute';
    IF v_recent_requests >= v_policy.requests_per_minute THEN
        INSERT INTO public.ai_usage (
            user_id, request_id, action, provider, model, credits, status, completed_at
        )
        VALUES (
            v_user_id, p_request_id, p_action, p_provider, p_model,
            v_cost, 'rejected', timezone('utc'::text, now())
        );
        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'RATE_LIMITED',
            'balance', v_wallet.balance
        );
    END IF;

    SELECT count(*)::INTEGER INTO v_concurrent_requests
    FROM public.ai_usage
    WHERE user_id = v_user_id
      AND status = 'reserved';
    IF v_concurrent_requests >= v_policy.max_concurrent_requests THEN
        INSERT INTO public.ai_usage (
            user_id, request_id, action, provider, model, credits, status, completed_at
        )
        VALUES (
            v_user_id, p_request_id, p_action, p_provider, p_model,
            v_cost, 'rejected', timezone('utc'::text, now())
        );
        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'CONCURRENT_LIMIT_REACHED',
            'balance', v_wallet.balance
        );
    END IF;

    SELECT COALESCE(sum(credits), 0)::INTEGER INTO v_daily_credits
    FROM public.ai_usage
    WHERE user_id = v_user_id
      AND status IN ('reserved', 'success')
      AND created_at >= date_trunc('day', timezone('utc'::text, now()));
    IF v_daily_credits + v_cost > v_policy.daily_credit_limit THEN
        INSERT INTO public.ai_usage (
            user_id, request_id, action, provider, model, credits, status, completed_at
        )
        VALUES (
            v_user_id, p_request_id, p_action, p_provider, p_model,
            v_cost, 'rejected', timezone('utc'::text, now())
        );
        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'DAILY_LIMIT_REACHED',
            'balance', v_wallet.balance
        );
    END IF;

    SELECT COALESCE(SUM(remaining_credits), 0) INTO v_total_available_grants
    FROM public.credit_grants
    WHERE user_id = v_user_id
      AND remaining_credits > 0
      AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()));

    IF v_total_available_grants = 0 AND v_wallet.balance > 0 THEN
        INSERT INTO public.credit_grants (
            user_id, source_type, granted_credits, remaining_credits, priority, metadata
        )
        VALUES (
            v_user_id, 'beta', v_wallet.balance, v_wallet.balance,
            50, '{"auto_migrated": true}'::jsonb
        );
        v_total_available_grants := v_wallet.balance;
    END IF;

    IF v_total_available_grants < v_cost THEN
        INSERT INTO public.ai_usage (
            user_id, request_id, action, provider, model, credits, status, completed_at
        )
        VALUES (
            v_user_id, p_request_id, p_action, p_provider, p_model,
            v_cost, 'rejected', timezone('utc'::text, now())
        );
        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'INSUFFICIENT_CREDITS',
            'balance', v_total_available_grants,
            'required', v_cost
        );
    END IF;

    v_remaining_needed := v_cost;

    FOR v_grant IN
        SELECT id, remaining_credits
        FROM public.credit_grants
        WHERE user_id = v_user_id
          AND remaining_credits > 0
          AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()))
        ORDER BY priority ASC, expires_at ASC NULLS LAST, created_at ASC
        FOR UPDATE
    LOOP
        EXIT WHEN v_remaining_needed <= 0;
        v_deduct_amount := LEAST(v_grant.remaining_credits, v_remaining_needed);

        UPDATE public.credit_grants
        SET remaining_credits = remaining_credits - v_deduct_amount,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_grant.id;

        v_remaining_needed := v_remaining_needed - v_deduct_amount;

        INSERT INTO public.credit_ledger (
            user_id, request_id, grant_id, event_type,
            credits_delta, balance_after, reason
        )
        VALUES (
            v_user_id,
            p_request_id,
            v_grant.id,
            'reserve',
            -v_deduct_amount,
            v_total_available_grants - (v_cost - v_remaining_needed),
            'Reserva de creditos para ' || p_action
        );
    END LOOP;

    SELECT COALESCE(SUM(remaining_credits), 0) INTO v_new_balance
    FROM public.credit_grants
    WHERE user_id = v_user_id
      AND remaining_credits > 0
      AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()));

    UPDATE public.ai_credit_wallets
    SET balance = v_new_balance,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = v_user_id;

    UPDATE public.credit_ledger
    SET balance_after = v_new_balance
    WHERE user_id = v_user_id
      AND request_id = p_request_id
      AND event_type = 'reserve';

    INSERT INTO public.ai_usage (
        user_id, request_id, action, provider, model, credits, status
    )
    VALUES (
        v_user_id, p_request_id, p_action, p_provider, p_model, v_cost, 'reserved'
    );

    RETURN jsonb_build_object(
        'ok', TRUE,
        'code', 'RESERVED',
        'credits', v_cost,
        'balance', v_new_balance,
        'planId', v_plan_code
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_ai_credits(UUID, TEXT, TEXT, TEXT)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_ai_credits(UUID, TEXT, TEXT, TEXT)
TO authenticated;
