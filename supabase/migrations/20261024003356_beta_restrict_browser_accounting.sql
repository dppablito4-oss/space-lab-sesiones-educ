-- Stage 2: apply after ai-gateway and all provider routers use run_ai_accounting.
BEGIN;
REVOKE ALL ON FUNCTION public.reserve_ai_credits(UUID, TEXT, TEXT, TEXT),
    public.complete_ai_usage(UUID, INTEGER, INTEGER, TEXT, NUMERIC, INTEGER),
    public.refund_ai_usage(UUID), public.record_ai_route(UUID, TEXT, TEXT),
    public.begin_ai_gateway_request(UUID, TEXT, TEXT, TEXT, TEXT, TEXT),
    public.finish_ai_gateway_request(UUID, TEXT, TEXT, TEXT, JSONB, INTEGER, TEXT)
FROM PUBLIC, anon, authenticated;
COMMIT;
