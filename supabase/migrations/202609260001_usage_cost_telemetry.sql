-- Migración: 202609260001_usage_cost_telemetry.sql
-- Fase 2 de Refactor SaaS: Telemetría de costo real en USD, latencia y modelo del proveedor

-- 1. Extender ai_usage para registrar la economía real de cada solicitud
ALTER TABLE public.ai_usage ADD COLUMN IF NOT EXISTS provider_model TEXT DEFAULT NULL;
ALTER TABLE public.ai_usage ADD COLUMN IF NOT EXISTS provider_cost_usd NUMERIC(10, 6) DEFAULT 0;
ALTER TABLE public.ai_usage ADD COLUMN IF NOT EXISTS cost_version TEXT DEFAULT '2026-09';
ALTER TABLE public.ai_usage ADD COLUMN IF NOT EXISTS latency_ms INTEGER DEFAULT NULL;
ALTER TABLE public.ai_usage ADD COLUMN IF NOT EXISTS error_code TEXT DEFAULT NULL;
ALTER TABLE public.ai_usage ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- 2. Actualizar función complete_ai_usage de forma 100% retrocompatible
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
    RETURN jsonb_build_object('ok', TRUE, 'balance', v_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.complete_ai_usage(UUID, INTEGER, INTEGER, TEXT, NUMERIC, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_ai_usage(UUID, INTEGER, INTEGER, TEXT, NUMERIC, INTEGER) TO authenticated;
