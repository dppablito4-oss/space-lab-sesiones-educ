-- Stage 1: deploy before the Edge Functions switch to server-only accounting.
-- Stage 2 revokes browser access after all routers have been verified.
BEGIN;

CREATE OR REPLACE FUNCTION public.run_ai_accounting(
    p_user_id UUID,
    p_operation TEXT,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_claims TEXT := current_setting('request.jwt.claims', true);
    v_result JSONB;
BEGIN
    IF COALESCE(v_claims, '{}')::jsonb->>'role' IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Backend accounting only' USING ERRCODE = '42501';
    END IF;
    IF p_user_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = p_user_id
    ) THEN
        RETURN jsonb_build_object('ok', false, 'code', 'AUTH_REQUIRED');
    END IF;

    -- Existing atomic routines use auth.uid(). Scope it to the identity the
    -- server verified, and restore it even when validation/accounting fails.
    PERFORM set_config('request.jwt.claims', jsonb_build_object(
        'sub', p_user_id, 'role', 'authenticated')::text, true);
    BEGIN
        CASE p_operation
            WHEN 'reserve_ai_credits' THEN
                v_result := public.reserve_ai_credits((p_payload->>'p_request_id')::uuid,
                    p_payload->>'p_action', p_payload->>'p_provider', p_payload->>'p_model');
            WHEN 'complete_ai_usage' THEN
                v_result := public.complete_ai_usage((p_payload->>'p_request_id')::uuid,
                    (p_payload->>'p_input_tokens')::integer, (p_payload->>'p_output_tokens')::integer,
                    p_payload->>'p_provider_model', (p_payload->>'p_cost_usd')::numeric,
                    (p_payload->>'p_latency_ms')::integer);
            WHEN 'refund_ai_usage' THEN
                v_result := public.refund_ai_usage((p_payload->>'p_request_id')::uuid);
            WHEN 'record_ai_route' THEN
                v_result := public.record_ai_route((p_payload->>'p_request_id')::uuid,
                    p_payload->>'p_requested_quality', p_payload->>'p_route_reason');
            WHEN 'begin_ai_gateway_request' THEN
                v_result := public.begin_ai_gateway_request((p_payload->>'p_request_id')::uuid,
                    p_payload->>'p_action', p_payload->>'p_requested_quality',
                    p_payload->>'p_primary_provider', p_payload->>'p_primary_model', p_payload->>'p_route_reason');
            WHEN 'finish_ai_gateway_request' THEN
                v_result := public.finish_ai_gateway_request((p_payload->>'p_request_id')::uuid,
                    p_payload->>'p_status', p_payload->>'p_final_provider', p_payload->>'p_final_model',
                    p_payload->'p_attempts', (p_payload->>'p_response_status')::integer, p_payload->>'p_error_code');
            ELSE
                RAISE EXCEPTION 'Unknown accounting operation' USING ERRCODE = '22023';
        END CASE;
    EXCEPTION WHEN OTHERS THEN
        PERFORM set_config('request.jwt.claims', COALESCE(v_claims, ''), true);
        RAISE;
    END;
    PERFORM set_config('request.jwt.claims', COALESCE(v_claims, ''), true);
    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.run_ai_accounting(UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_ai_accounting(UUID, TEXT, JSONB) TO service_role;
-- Make permissions explicit for the invoker wrapper; user RLS remains unchanged.
GRANT EXECUTE ON FUNCTION public.reserve_ai_credits(UUID, TEXT, TEXT, TEXT),
    public.complete_ai_usage(UUID, INTEGER, INTEGER, TEXT, NUMERIC, INTEGER),
    public.refund_ai_usage(UUID), public.record_ai_route(UUID, TEXT, TEXT),
    public.begin_ai_gateway_request(UUID, TEXT, TEXT, TEXT, TEXT, TEXT),
    public.finish_ai_gateway_request(UUID, TEXT, TEXT, TEXT, JSONB, INTEGER, TEXT)
TO service_role;

COMMIT;
