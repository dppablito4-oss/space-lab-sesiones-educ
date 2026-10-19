const PRODUCTION_ORIGIN = "https://sesiones.sypablitodp.site";
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage";

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const allowedOrigin = origin && (origin === PRODUCTION_ORIGIN || LOCAL_ORIGIN.test(origin))
    ? origin
    : PRODUCTION_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Expose-Headers": "X-Request-Id, X-Prompt-Version, X-AI-Credits-Remaining, X-AI-Provider, X-AI-Model, X-AI-Route-Reason, X-AI-Attempt-Id, X-AI-Fallback-Count",
    "Vary": "Origin",
  };
}

export function preflightResponse(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  const headers = corsHeaders(req);
  const origin = req.headers.get("Origin");
  const requestedHeaders = (req.headers.get("Access-Control-Request-Headers") || "")
    .toLowerCase().split(",").map(name => name.trim()).filter(name => /^[a-z0-9-]+$/.test(name));
  const allowed = new Set(ALLOWED_HEADERS.split(", "));
  const rejectedHeaders = requestedHeaders.filter(name => !allowed.has(name));
  if ((origin && headers["Access-Control-Allow-Origin"] !== origin) || rejectedHeaders.length) {
    // Header names and Origin only: never log Authorization, API keys or request bodies.
    console.warn("[AI CORS] Preflight no permitido por el navegador.", {
      origin, path: new URL(req.url).pathname, rejectedHeaders,
    });
  }
  return new Response("ok", { headers });
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
