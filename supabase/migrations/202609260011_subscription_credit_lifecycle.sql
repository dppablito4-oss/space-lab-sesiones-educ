-- Conecta el ciclo comercial de una suscripcion con grants contables idempotentes.

CREATE TABLE IF NOT EXISTS public.subscription_credit_policies (
    plan_code TEXT PRIMARY KEY
        REFERENCES public.subscription_plans(code) ON DELETE CASCADE,
    credits_per_cycle INTEGER NOT NULL CHECK (credits_per_cycle >= 0),
    expires_with_cycle BOOLEAN NOT NULL DEFAULT TRUE,
    rollover_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    max_rollover INTEGER NOT NULL DEFAULT 0 CHECK (max_rollover >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT subscription_credit_rollover_consistent CHECK (
        rollover_allowed = TRUE OR max_rollover = 0
    )
);

-- Valores iniciales ajustables antes de habilitar billing real.
INSERT INTO public.subscription_credit_policies (
    plan_code,
    credits_per_cycle,
    expires_with_cycle,
    rollover_allowed,
    max_rollover,
    active
)
VALUES
    ('free', 30, FALSE, FALSE, 0, TRUE),
    ('beta_teacher', 100, FALSE, FALSE, 0, TRUE),
    ('teacher', 150, TRUE, FALSE, 0, TRUE),
    ('pro', 400, TRUE, FALSE, 0, TRUE)
ON CONFLICT (plan_code) DO UPDATE SET
    credits_per_cycle = EXCLUDED.credits_per_cycle,
    expires_with_cycle = EXCLUDED.expires_with_cycle,
    rollover_allowed = EXCLUDED.rollover_allowed,
    max_rollover = EXCLUDED.max_rollover,
    active = EXCLUDED.active,
    updated_at = timezone('utc'::text, now());

-- source_id identifica de forma determinista una suscripcion y su ciclo.
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_grants_subscription_cycle
    ON public.credit_grants (source_type, source_id)
    WHERE source_type = 'subscription' AND source_id IS NOT NULL;

ALTER TABLE public.subscription_credit_policies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_credit_policies FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.subscription_credit_policies TO service_role;

CREATE OR REPLACE FUNCTION public.issue_subscription_cycle_credits(
    p_subscription_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_subscription public.subscriptions%ROWTYPE;
    v_policy public.subscription_credit_policies%ROWTYPE;
    v_source_id TEXT;
    v_expires_at TIMESTAMPTZ;
    v_grant_id UUID;
    v_grant_created BOOLEAN := FALSE;
    v_balance INTEGER := 0;
BEGIN
    IF p_subscription_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_SUBSCRIPTION_ID');
    END IF;

    SELECT * INTO v_subscription
    FROM public.subscriptions
    WHERE id = p_subscription_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'SUBSCRIPTION_NOT_FOUND');
    END IF;

    IF v_subscription.status NOT IN ('trialing', 'active') THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'SUBSCRIPTION_INACTIVE',
            'status', v_subscription.status
        );
    END IF;

    IF v_subscription.current_period_end IS NOT NULL
       AND v_subscription.current_period_end <= timezone('utc'::text, now()) THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'SUBSCRIPTION_EXPIRED');
    END IF;

    SELECT * INTO v_policy
    FROM public.subscription_credit_policies
    WHERE plan_code = v_subscription.plan_code
      AND active = TRUE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'CREDIT_POLICY_NOT_FOUND',
            'plan', v_subscription.plan_code
        );
    END IF;

    IF v_policy.credits_per_cycle <= 0 THEN
        RETURN jsonb_build_object(
            'ok', TRUE,
            'code', 'NO_CYCLE_CREDITS',
            'plan', v_subscription.plan_code
        );
    END IF;

    IF v_policy.expires_with_cycle AND v_subscription.current_period_end IS NULL THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'PERIOD_END_REQUIRED',
            'plan', v_subscription.plan_code
        );
    END IF;

    v_source_id := v_subscription.id::text || ':' || to_char(
        v_subscription.current_period_start AT TIME ZONE 'UTC',
        'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
    );
    v_expires_at := CASE
        WHEN v_policy.expires_with_cycle THEN v_subscription.current_period_end
        ELSE NULL
    END;

    INSERT INTO public.credit_grants (
        user_id,
        source_type,
        source_id,
        granted_credits,
        remaining_credits,
        starts_at,
        expires_at,
        priority,
        metadata
    )
    VALUES (
        v_subscription.user_id,
        'subscription',
        v_source_id,
        v_policy.credits_per_cycle,
        v_policy.credits_per_cycle,
        v_subscription.current_period_start,
        v_expires_at,
        20,
        jsonb_build_object(
            'subscription_id', v_subscription.id,
            'plan_code', v_subscription.plan_code,
            'period_start', v_subscription.current_period_start,
            'period_end', v_subscription.current_period_end
        )
    )
    ON CONFLICT (source_type, source_id)
        WHERE source_type = 'subscription' AND source_id IS NOT NULL
    DO NOTHING
    RETURNING id INTO v_grant_id;

    v_grant_created := v_grant_id IS NOT NULL;

    IF NOT v_grant_created THEN
        SELECT id INTO v_grant_id
        FROM public.credit_grants
        WHERE source_type = 'subscription'
          AND source_id = v_source_id;
    END IF;

    -- El wallet es solo un snapshot de todos los grants vigentes. Prepago y
    -- promociones se conservan y mantienen su propia expiracion.
    SELECT COALESCE(SUM(remaining_credits), 0)::INTEGER
    INTO v_balance
    FROM public.credit_grants
    WHERE user_id = v_subscription.user_id
      AND remaining_credits > 0
      AND starts_at <= timezone('utc'::text, now())
      AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()));

    INSERT INTO public.ai_credit_wallets (user_id, plan_id, balance)
    VALUES (v_subscription.user_id, 'free', v_balance)
    ON CONFLICT (user_id) DO UPDATE SET
        balance = EXCLUDED.balance,
        updated_at = timezone('utc'::text, now());

    IF v_grant_created THEN
        INSERT INTO public.credit_ledger (
            user_id,
            grant_id,
            event_type,
            credits_delta,
            balance_after,
            reason
        )
        VALUES (
            v_subscription.user_id,
            v_grant_id,
            'grant',
            v_policy.credits_per_cycle,
            v_balance,
            format(
                'Creditos de suscripcion %s para ciclo %s',
                v_subscription.plan_code,
                v_subscription.current_period_start
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'code', CASE WHEN v_grant_created THEN 'CYCLE_GRANT_CREATED' ELSE 'CYCLE_GRANT_EXISTS' END,
        'grantId', v_grant_id,
        'plan', v_subscription.plan_code,
        'credits', v_policy.credits_per_cycle,
        'balance', v_balance,
        'periodStart', v_subscription.current_period_start,
        'periodEnd', v_subscription.current_period_end
    );
END;
$$;

REVOKE ALL ON FUNCTION public.issue_subscription_cycle_credits(UUID)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_subscription_cycle_credits(UUID)
TO service_role;

CREATE OR REPLACE FUNCTION public.trigger_subscription_cycle_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF NEW.status IN ('trialing', 'active') THEN
        PERFORM public.issue_subscription_cycle_credits(NEW.id);
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_subscription_cycle_credits()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_subscription_cycle_credits ON public.subscriptions;
CREATE TRIGGER on_subscription_cycle_credits
    AFTER INSERT OR UPDATE OF plan_code, status, current_period_start, current_period_end
    ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_subscription_cycle_credits();

-- Transicion segura: emitir el ciclo vigente de planes pagados. Para beta/free
-- solo se emite si el usuario aun no tiene un grant beta o de suscripcion.
DO $$
DECLARE
    v_subscription RECORD;
BEGIN
    FOR v_subscription IN
        SELECT subscription.id
        FROM public.subscriptions AS subscription
        WHERE subscription.status IN ('trialing', 'active')
          AND (
              subscription.current_period_end IS NULL
              OR subscription.current_period_end > timezone('utc'::text, now())
          )
          AND (
              subscription.plan_code IN ('teacher', 'pro')
              OR NOT EXISTS (
                  SELECT 1
                  FROM public.credit_grants AS existing_grant
                  WHERE existing_grant.user_id = subscription.user_id
                    AND existing_grant.source_type IN ('beta', 'subscription')
                    AND existing_grant.remaining_credits > 0
                    AND existing_grant.starts_at <= timezone('utc'::text, now())
                    AND (
                        existing_grant.expires_at IS NULL
                        OR existing_grant.expires_at > timezone('utc'::text, now())
                    )
              )
          )
    LOOP
        PERFORM public.issue_subscription_cycle_credits(v_subscription.id);
    END LOOP;
END;
$$;
