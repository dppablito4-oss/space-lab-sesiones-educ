const PRODUCTION_ORIGIN = "https://sesiones.sypablitodp.site";
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const allowedOrigin = origin && (origin === PRODUCTION_ORIGIN || LOCAL_ORIGIN.test(origin))
    ? origin
    : PRODUCTION_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Expose-Headers": "X-Request-Id, X-Prompt-Version, X-AI-Credits-Remaining, X-AI-Provider, X-AI-Model, X-AI-Route-Reason, X-AI-Attempt-Id, X-AI-Fallback-Count",
    "Vary": "Origin",
  };
}

export function preflightResponse(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response("ok", { headers: corsHeaders(req) }) : null;
}

export function jsonResponse(
  req: Request,
  payload: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json", ...extraHeaders },
  });
}
