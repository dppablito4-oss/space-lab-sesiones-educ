-- Fase 6: telemetría del AI Gateway sin romper los routers legacy.

ALTER TABLE public.ai_usage
    ADD COLUMN IF NOT EXISTS requested_quality TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS route_reason TEXT DEFAULT NULL;

CREATE OR REPLACE FUNCTION public.record_ai_route(
    p_request_id UUID,
    p_requested_quality TEXT,
    p_route_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_updated INTEGER := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'AUTH_REQUIRED');
    END IF;
    IF p_request_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_REQUEST_ID');
    END IF;
    IF p_requested_quality NOT IN ('automatic', 'fast', 'balanced', 'max_quality') THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_QUALITY');
    END IF;

    UPDATE public.ai_usage
    SET requested_quality = p_requested_quality,
        route_reason = left(COALESCE(NULLIF(trim(p_route_reason), ''), 'unspecified'), 120)
    WHERE user_id = v_user_id
      AND request_id = p_request_id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN jsonb_build_object(
        'ok', v_updated = 1,
        'code', CASE WHEN v_updated = 1 THEN 'ROUTE_RECORDED' ELSE 'USAGE_NOT_FOUND' END
    );
END;
$$;

REVOKE ALL ON FUNCTION public.record_ai_route(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_ai_route(UUID, TEXT, TEXT) TO authenticated, service_role;
