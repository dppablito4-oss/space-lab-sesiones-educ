-- Fases 3-5: hardening de suscripciones, entitlements y credit grants.
-- Esta migración es incremental: no modifica migraciones ya aplicadas.

-- 1. Un grant solo puede ser emitido desde backend privilegiado.
REVOKE ALL ON FUNCTION public.add_credit_grant(UUID, TEXT, INTEGER, TIMESTAMPTZ, TEXT)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_credit_grant(UUID, TEXT, INTEGER, TIMESTAMPTZ, TEXT)
TO service_role;

-- 2. Consultar entitlements nunca crea ni reactiva una suscripción.
-- Los usuarios sin una suscripción vigente reciben el plan free.
CREATE OR REPLACE FUNCTION public.get_user_entitlements()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_plan_code TEXT := 'free';
    v_features JSONB;
BEGIN
    IF v_user_id IS NOT NULL THEN
        SELECT s.plan_code
        INTO v_plan_code
        FROM public.subscriptions AS s
        JOIN public.subscription_plans AS p ON p.code = s.plan_code
        WHERE s.user_id = v_user_id
          AND s.status IN ('trialing', 'active')
          AND (s.current_period_end IS NULL OR s.current_period_end > timezone('utc'::text, now()))
          AND p.active = TRUE
        ORDER BY s.updated_at DESC
        LIMIT 1;

        v_plan_code := COALESCE(v_plan_code, 'free');
    END IF;

    SELECT jsonb_object_agg(feature_key, enabled)
    INTO v_features
    FROM public.plan_entitlements
    WHERE plan_code = v_plan_code;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'plan', CASE WHEN v_user_id IS NULL THEN 'anonymous' ELSE v_plan_code END,
        'features', COALESCE(v_features, '{}'::jsonb)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_entitlements() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_entitlements() TO authenticated, service_role;

-- 3. El ajuste administrativo mantiene wallet, grants y ledger sincronizados.
CREATE OR REPLACE FUNCTION public.admin_set_ai_credits(
    p_user_id UUID,
    p_balance INTEGER,
    p_reason TEXT DEFAULT 'Actualización manual desde Panel Maestro'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_old_balance INTEGER := 0;
    v_delta INTEGER;
    v_to_remove INTEGER;
    v_remove INTEGER;
    v_grant RECORD;
    v_grant_id UUID;
    v_target_email TEXT;
    v_reason TEXT := left(COALESCE(NULLIF(trim(p_reason), ''), 'Actualización manual'), 300);
BEGIN
    IF v_admin_id IS NULL OR NOT public.is_admin() THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'ADMIN_REQUIRED');
    END IF;
    IF p_user_id IS NULL OR p_balance IS NULL OR p_balance < 0 OR p_balance > 1000000 THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_CREDIT_BALANCE');
    END IF;

    SELECT email INTO v_target_email FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'USER_NOT_FOUND');
    END IF;

    -- Mismo lock que reserve_ai_credits: serializa ajustes y consumos por usuario.
    PERFORM 1 FROM public.ai_credit_wallets WHERE user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        INSERT INTO public.ai_credit_wallets (user_id, plan_id, balance)
        VALUES (p_user_id, 'free', 0)
        ON CONFLICT (user_id) DO NOTHING;
        PERFORM 1 FROM public.ai_credit_wallets WHERE user_id = p_user_id FOR UPDATE;
    END IF;

    SELECT COALESCE(SUM(remaining_credits), 0)::INTEGER
    INTO v_old_balance
    FROM public.credit_grants
    WHERE user_id = p_user_id
      AND remaining_credits > 0
      AND starts_at <= timezone('utc'::text, now())
      AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()));

    v_delta := p_balance - v_old_balance;

    IF v_delta > 0 THEN
        INSERT INTO public.credit_grants (
            user_id, source_type, granted_credits, remaining_credits, priority, metadata
        )
        VALUES (
            p_user_id, 'admin', v_delta, v_delta, 50,
            jsonb_build_object('reason', v_reason, 'granted_by', v_admin_id)
        )
        RETURNING id INTO v_grant_id;

        INSERT INTO public.credit_ledger (
            user_id, grant_id, event_type, credits_delta, balance_after, reason
        )
        VALUES (p_user_id, v_grant_id, 'adjustment', v_delta, p_balance, v_reason);
    ELSIF v_delta < 0 THEN
        v_to_remove := abs(v_delta);

        FOR v_grant IN
            SELECT id, remaining_credits
            FROM public.credit_grants
            WHERE user_id = p_user_id
              AND remaining_credits > 0
              AND starts_at <= timezone('utc'::text, now())
              AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()))
            ORDER BY priority ASC, expires_at ASC NULLS LAST, created_at ASC
            FOR UPDATE
        LOOP
            EXIT WHEN v_to_remove <= 0;
            v_remove := LEAST(v_grant.remaining_credits, v_to_remove);

            UPDATE public.credit_grants
            SET remaining_credits = remaining_credits - v_remove,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_grant.id;

            INSERT INTO public.credit_ledger (
                user_id, grant_id, event_type, credits_delta, balance_after, reason
            )
            VALUES (p_user_id, v_grant.id, 'adjustment', -v_remove, p_balance, v_reason);

            v_to_remove := v_to_remove - v_remove;
        END LOOP;
    END IF;

    UPDATE public.ai_credit_wallets
    SET balance = p_balance, updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id;

    INSERT INTO public.security_logs (user_id, action, details)
    VALUES (
        v_admin_id,
        'AI_CREDITS_ADMIN_UPDATE',
        format('Cuenta %s (%s): %s -> %s créditos. %s',
            p_user_id, v_target_email, v_old_balance, p_balance, v_reason)
    );

    RETURN jsonb_build_object(
        'ok', TRUE,
        'code', 'CREDITS_UPDATED',
        'userId', p_user_id,
        'previousBalance', v_old_balance,
        'balance', p_balance
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_ai_credits(UUID, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_ai_credits(UUID, INTEGER, TEXT) TO authenticated;
