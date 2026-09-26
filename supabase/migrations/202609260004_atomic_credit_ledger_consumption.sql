-- Migración: 202609260004_atomic_credit_ledger_consumption.sql
-- Fase 5 de Refactor SaaS: Conexión atómica de reservas y liquidación con credit_grants y credit_ledger.
-- Garantiza que cada débito, confirmación y reembolso sea trazable en el ledger contable sin alterar el contrato del cliente.

-- 1. Actualizar reserve_ai_credits para consumir desde credit_grants y auditar en credit_ledger
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
    v_existing_status TEXT;
    
    -- Variables para expiración de reservas obsoletas
    v_stale_record RECORD;
    v_stale_ledger RECORD;
    
    -- Variables para consumo de credit_grants
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

    -- Bloqueo atómico de la billetera rápida
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

    -- Detección de duplicado / idempotencia
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

    -- Limpieza de reservas obsoletas (> 15 minutos en estado 'reserved')
    FOR v_stale_record IN
        SELECT id, request_id, credits
        FROM public.ai_usage
        WHERE user_id = v_user_id
          AND status = 'reserved'
          AND created_at < timezone('utc', now()) - INTERVAL '15 minutes'
        FOR UPDATE
    LOOP
        -- Revertir créditos a los grants originales de cada reserva obsoleta
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
                    updated_at = timezone('utc', now())
                WHERE id = v_stale_ledger.grant_id;
            END IF;

            INSERT INTO public.credit_ledger (
                user_id, request_id, grant_id, event_type, credits_delta, balance_after, reason
            )
            VALUES (
                v_user_id,
                v_stale_record.request_id,
                v_stale_ledger.grant_id,
                'refund',
                v_stale_ledger.refund_credits,
                v_wallet.balance,
                'Expiración automática de reserva obsoleta (>15 min)'
            );
        END LOOP;

        UPDATE public.ai_usage
        SET status = 'refunded', completed_at = timezone('utc', now())
        WHERE id = v_stale_record.id;
    END LOOP;

    -- Costo de la acción
    SELECT credits INTO v_cost
    FROM public.ai_action_costs
    WHERE action = p_action AND enabled = TRUE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'UNKNOWN_ACTION', 'balance', v_wallet.balance);
    END IF;

    -- Rate limiting por minuto
    SELECT count(*)::INTEGER INTO v_recent_requests
    FROM public.ai_usage
    WHERE user_id = v_user_id
      AND created_at >= timezone('utc', now()) - INTERVAL '1 minute';
    IF v_recent_requests >= v_plan.requests_per_minute THEN
        INSERT INTO public.ai_usage (user_id, request_id, action, provider, model, credits, status, completed_at)
        VALUES (v_user_id, p_request_id, p_action, p_provider, p_model, v_cost, 'rejected', timezone('utc', now()));
        RETURN jsonb_build_object('ok', FALSE, 'code', 'RATE_LIMITED', 'balance', v_wallet.balance);
    END IF;

    -- Límite diario de créditos
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

    -- Calcular saldo total vigente disponible en credit_grants
    SELECT COALESCE(SUM(remaining_credits), 0) INTO v_total_available_grants
    FROM public.credit_grants
    WHERE user_id = v_user_id
      AND remaining_credits > 0
      AND (expires_at IS NULL OR expires_at > timezone('utc', now()));

    -- Auto-seed de grant si el usuario tiene saldo en wallet pero aún no tiene fila en grants
    IF v_total_available_grants = 0 AND v_wallet.balance > 0 THEN
        INSERT INTO public.credit_grants (user_id, source_type, granted_credits, remaining_credits, priority, metadata)
        VALUES (v_user_id, 'beta', v_wallet.balance, v_wallet.balance, 50, '{"auto_migrated": true}'::jsonb);
        v_total_available_grants := v_wallet.balance;
    END IF;

    -- Comprobación de saldo suficiente
    IF v_total_available_grants < v_cost THEN
        INSERT INTO public.ai_usage (user_id, request_id, action, provider, model, credits, status, completed_at)
        VALUES (v_user_id, p_request_id, p_action, p_provider, p_model, v_cost, 'rejected', timezone('utc', now()));
        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'INSUFFICIENT_CREDITS',
            'balance', v_total_available_grants,
            'required', v_cost
        );
    END IF;

    -- Descontar créditos grant por grant en orden de prioridad y vencimiento
    v_remaining_needed := v_cost;

    FOR v_grant IN
        SELECT id, remaining_credits
        FROM public.credit_grants
        WHERE user_id = v_user_id
          AND remaining_credits > 0
          AND (expires_at IS NULL OR expires_at > timezone('utc', now()))
        ORDER BY priority ASC, expires_at ASC NULLS LAST, created_at ASC
        FOR UPDATE
    LOOP
        EXIT WHEN v_remaining_needed <= 0;

        v_deduct_amount := LEAST(v_grant.remaining_credits, v_remaining_needed);

        UPDATE public.credit_grants
        SET remaining_credits = remaining_credits - v_deduct_amount,
            updated_at = timezone('utc', now())
        WHERE id = v_grant.id;

        v_remaining_needed := v_remaining_needed - v_deduct_amount;

        -- Registrar asiento en el libro contable credit_ledger
        INSERT INTO public.credit_ledger (
            user_id, request_id, grant_id, event_type, credits_delta, balance_after, reason
        )
        VALUES (
            v_user_id,
            p_request_id,
            v_grant.id,
            'reserve',
            -v_deduct_amount,
            (v_total_available_grants - (v_cost - v_remaining_needed)),
            'Reserva de créditos para ' || p_action
        );
    END LOOP;

    -- Calcular nuevo balance consolidado
    SELECT COALESCE(SUM(remaining_credits), 0) INTO v_new_balance
    FROM public.credit_grants
    WHERE user_id = v_user_id
      AND remaining_credits > 0
      AND (expires_at IS NULL OR expires_at > timezone('utc', now()));

    -- Actualizar balance de consulta rápida en ai_credit_wallets
    UPDATE public.ai_credit_wallets
    SET balance = v_new_balance,
        updated_at = timezone('utc', now())
    WHERE user_id = v_user_id;

    -- Actualizar balance_after definitivo en las filas de reserva de esta petición
    UPDATE public.credit_ledger
    SET balance_after = v_new_balance
    WHERE user_id = v_user_id AND request_id = p_request_id AND event_type = 'reserve';

    -- Registrar solicitud en ai_usage como reservada
    INSERT INTO public.ai_usage (user_id, request_id, action, provider, model, credits, status)
    VALUES (v_user_id, p_request_id, p_action, p_provider, p_model, v_cost, 'reserved');

    RETURN jsonb_build_object(
        'ok', TRUE,
        'code', 'RESERVED',
        'credits', v_cost,
        'balance', v_new_balance,
        'planId', v_wallet.plan_id
    );
END;
$$;

-- 2. Actualizar complete_ai_usage para auditar la confirmación de gasto en credit_ledger
CREATE OR REPLACE FUNCTION public.complete_ai_usage(
    p_request_id UUID,
    p_input_tokens INTEGER DEFAULT NULL,
    p_output_tokens INTEGER DEFAULT NULL,
    p_provider_model TEXT DEFAULT NULL,
    p_cost_usd NUMERIC DEFAULT NULL,
    p_latency_ms INTEGER DEFAULT NULL
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
        RETURN jsonb_build_object('ok', TRUE, 'balance', v_balance, 'status', 'already_completed');
    END IF;

    IF v_usage.status <> 'reserved' THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_USAGE_STATE', 'status', v_usage.status);
    END IF;

    -- Actualizar estado a exitoso y registrar telemetría completa
    UPDATE public.ai_usage
    SET status = 'success',
        input_tokens = COALESCE(p_input_tokens, input_tokens),
        output_tokens = COALESCE(p_output_tokens, output_tokens),
        provider_model = COALESCE(p_provider_model, provider_model),
        provider_cost_usd = COALESCE(p_cost_usd, provider_cost_usd, 0),
        latency_ms = COALESCE(p_latency_ms, latency_ms),
        completed_at = timezone('utc'::text, now())
    WHERE id = v_usage.id;

    SELECT balance INTO v_balance FROM public.ai_credit_wallets WHERE user_id = v_user_id;

    -- Registrar evento spend en el ledger (confirmación formal del consumo)
    INSERT INTO public.credit_ledger (
        user_id, request_id, event_type, credits_delta, balance_after, reason
    )
    VALUES (
        v_user_id,
        p_request_id,
        'spend',
        0, -- El débito de balance ya ocurrió en la reserva
        COALESCE(v_balance, 0),
        'Consumo completado: ' || v_usage.action || ' (' || COALESCE(p_provider_model, v_usage.model) || ')'
    );

    RETURN jsonb_build_object('ok', TRUE, 'balance', v_balance);
END;
$$;

-- 3. Actualizar refund_ai_usage para restituir créditos a los grants originales y asentar en el ledger
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
    v_ledger_entry RECORD;
    v_new_balance INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'AUTH_REQUIRED');
    END IF;

    SELECT * INTO v_wallet FROM public.ai_credit_wallets
    WHERE user_id = v_user_id FOR UPDATE;

    SELECT * INTO v_usage FROM public.ai_usage
    WHERE user_id = v_user_id AND request_id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'USAGE_NOT_FOUND');
    END IF;

    IF v_usage.status = 'refunded' THEN
        SELECT COALESCE(SUM(remaining_credits), 0) INTO v_new_balance
        FROM public.credit_grants
        WHERE user_id = v_user_id
          AND remaining_credits > 0
          AND (expires_at IS NULL OR expires_at > timezone('utc', now()));
        RETURN jsonb_build_object('ok', TRUE, 'code', 'ALREADY_REFUNDED', 'balance', v_new_balance);
    END IF;

    IF v_usage.status <> 'reserved' THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_USAGE_STATE', 'status', v_usage.status);
    END IF;

    -- Restituir créditos grant por grant según los asientos de reserva del ledger
    FOR v_ledger_entry IN
        SELECT grant_id, abs(credits_delta) AS refund_amount
        FROM public.credit_ledger
        WHERE user_id = v_user_id
          AND request_id = p_request_id
          AND event_type = 'reserve'
          AND credits_delta < 0
    LOOP
        IF v_ledger_entry.grant_id IS NOT NULL THEN
            UPDATE public.credit_grants
            SET remaining_credits = remaining_credits + v_ledger_entry.refund_amount,
                updated_at = timezone('utc', now())
            WHERE id = v_ledger_entry.grant_id;
        END IF;

        -- Registrar asiento de reembolso
        INSERT INTO public.credit_ledger (
            user_id, request_id, grant_id, event_type, credits_delta, balance_after, reason
        )
        VALUES (
            v_user_id,
            p_request_id,
            v_ledger_entry.grant_id,
            'refund',
            v_ledger_entry.refund_amount,
            0, -- se actualiza abajo
            'Reembolso por fallo en solicitud ' || v_usage.action
        );
    END LOOP;

    -- Recalcular saldo total consolidado
    SELECT COALESCE(SUM(remaining_credits), 0) INTO v_new_balance
    FROM public.credit_grants
    WHERE user_id = v_user_id
      AND remaining_credits > 0
      AND (expires_at IS NULL OR expires_at > timezone('utc', now()));

    -- Actualizar balance_after definitivo en las filas de reembolso
    UPDATE public.credit_ledger
    SET balance_after = v_new_balance
    WHERE user_id = v_user_id AND request_id = p_request_id AND event_type = 'refund';

    -- Actualizar billetera rápida de usuario
    UPDATE public.ai_credit_wallets
    SET balance = v_new_balance,
        updated_at = timezone('utc', now())
    WHERE user_id = v_user_id;

    -- Marcar registro de uso como reembolsado
    UPDATE public.ai_usage
    SET status = 'refunded', completed_at = timezone('utc', now())
    WHERE id = v_usage.id;

    RETURN jsonb_build_object('ok', TRUE, 'code', 'REFUNDED', 'balance', v_new_balance);
END;
$$;

-- 4. Permisos de ejecución para clientes autenticados
REVOKE ALL ON FUNCTION public.reserve_ai_credits(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_ai_usage(UUID, INTEGER, INTEGER, TEXT, NUMERIC, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.refund_ai_usage(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.reserve_ai_credits(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_ai_usage(UUID, INTEGER, INTEGER, TEXT, NUMERIC, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_ai_usage(UUID) TO authenticated;
