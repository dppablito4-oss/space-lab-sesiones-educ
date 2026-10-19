import { jsonResponse } from "./cors.ts";

type ReadEnv = (name: string) => string | undefined;

export function providerTimeoutMs(readEnv: ReadEnv = (name) => Deno.env.get(name), action = ""): number {
  const document = action === "generate_session" || action === "planning.map.generate";
  const configured = Number(readEnv(document ? "AI_DOCUMENT_TIMEOUT_MS" : "AI_PROVIDER_TIMEOUT_MS"));
  return Number.isFinite(configured) && configured >= 1000 && configured <= (document ? 100000 : 60000)
    ? configured : document ? 90000 : 45000;
}

/** Leave time for accounting and a CORS response before the hosted 150 s idle limit. */
export function gatewayAttemptTimeoutMs(action: string, elapsedMs: number, readEnv?: ReadEnv): number | null {
  const remaining = 125000 - Math.max(0, elapsedMs) - 10000;
  return remaining < 1000 ? null : Math.min(providerTimeoutMs(readEnv, action), remaining);
}

/** An internal gateway cap may shorten a provider call; it can never extend it. */
export function providerRequestTimeoutMs(req: Request, action: string, readEnv?: ReadEnv): number {
  const maximum = providerTimeoutMs(readEnv, action);
  const cap = Number(req.headers.get("X-AI-Timeout-Ms"));
  return Number.isFinite(cap) && cap >= 1000 ? Math.min(maximum, cap) : maximum;
}

export function isAiTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

/** Applied at every public entry point, including direct legacy router calls. */
export function aiAvailabilityResponse(
  req: Request,
  provider: string,
  readEnv: ReadEnv = (name) => Deno.env.get(name),
): Response | null {
  if (readEnv("AI_GLOBAL_ENABLED") === "false") {
    return jsonResponse(req, { error: "El servicio de IA está temporalmente deshabilitado.", code: "AI_DISABLED" }, 503);
  }
  if (readEnv(`PROVIDER_${provider.toUpperCase()}_ENABLED`) === "false") {
    return jsonResponse(req, { error: "Este proveedor de IA está temporalmente deshabilitado.", code: "PROVIDER_DISABLED" }, 503);
  }
  return null;
}

export function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit,
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  return fetchImpl(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}
