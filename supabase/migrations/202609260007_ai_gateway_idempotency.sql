-- Fase 6.1: idempotencia y trazabilidad de intentos del AI Gateway.

CREATE TABLE IF NOT EXISTS public.ai_gateway_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id UUID NOT NULL,
    action TEXT NOT NULL,
    requested_quality TEXT NOT NULL CHECK (requested_quality IN ('automatic', 'fast', 'balanced', 'max_quality')),
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'success', 'failed', 'rejected')),
    primary_provider TEXT DEFAULT NULL,
    primary_model TEXT DEFAULT NULL,
    final_provider TEXT DEFAULT NULL,
    final_model TEXT DEFAULT NULL,
    route_reason TEXT DEFAULT NULL,
    attempts JSONB NOT NULL DEFAULT '[]'::jsonb,
    response_status INTEGER DEFAULT NULL,
    error_code TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT uq_ai_gateway_user_request UNIQUE (user_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_gateway_requests_user_created
    ON public.ai_gateway_requests (user_id, created_at DESC);

ALTER TABLE public.ai_gateway_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus solicitudes de gateway" ON public.ai_gateway_requests;
CREATE POLICY "Usuarios ven sus solicitudes de gateway"
    ON public.ai_gateway_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.begin_ai_gateway_request(
    p_request_id UUID,
    p_action TEXT,
    p_requested_quality TEXT,
    p_primary_provider TEXT,
    p_primary_model TEXT,
    p_route_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_id UUID;
    v_existing_status TEXT;
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
    IF COALESCE(trim(p_action), '') = '' THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_ACTION');
    END IF;

    INSERT INTO public.ai_gateway_requests (
        user_id, request_id, action, requested_quality,
        primary_provider, primary_model, route_reason
    )
    VALUES (
        v_user_id, p_request_id, left(trim(p_action), 80), p_requested_quality,
        left(p_primary_provider, 30), left(p_primary_model, 100), left(p_route_reason, 120)
    )
    ON CONFLICT (user_id, request_id) DO NOTHING
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
        SELECT status INTO v_existing_status
        FROM public.ai_gateway_requests
        WHERE user_id = v_user_id AND request_id = p_request_id;

        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'DUPLICATE_REQUEST',
            'status', COALESCE(v_existing_status, 'unknown')
        );
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'code', 'GATEWAY_REQUEST_STARTED');
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_ai_gateway_request(
    p_request_id UUID,
    p_status TEXT,
    p_final_provider TEXT,
    p_final_model TEXT,
    p_attempts JSONB,
    p_response_status INTEGER,
    p_error_code TEXT DEFAULT NULL
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
    IF p_status NOT IN ('success', 'failed', 'rejected') THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_GATEWAY_STATUS');
    END IF;
    IF jsonb_typeof(COALESCE(p_attempts, '[]'::jsonb)) <> 'array' THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_ATTEMPTS');
    END IF;

    UPDATE public.ai_gateway_requests
    SET status = p_status,
        final_provider = left(p_final_provider, 30),
        final_model = left(p_final_model, 100),
        attempts = COALESCE(p_attempts, '[]'::jsonb),
        response_status = p_response_status,
        error_code = left(p_error_code, 80),
        updated_at = timezone('utc'::text, now()),
        completed_at = timezone('utc'::text, now())
    WHERE user_id = v_user_id
      AND request_id = p_request_id
      AND status = 'processing';

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN jsonb_build_object(
        'ok', v_updated = 1,
        'code', CASE WHEN v_updated = 1 THEN 'GATEWAY_REQUEST_FINISHED' ELSE 'GATEWAY_REQUEST_NOT_PROCESSING' END
    );
END;
$$;

REVOKE ALL ON FUNCTION public.begin_ai_gateway_request(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finish_ai_gateway_request(UUID, TEXT, TEXT, TEXT, JSONB, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.begin_ai_gateway_request(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finish_ai_gateway_request(UUID, TEXT, TEXT, TEXT, JSONB, INTEGER, TEXT) TO authenticated, service_role;
