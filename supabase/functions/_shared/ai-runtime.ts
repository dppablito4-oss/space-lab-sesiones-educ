import { jsonResponse } from "./cors.ts";

type ReadEnv = (name: string) => string | undefined;

export function providerTimeoutMs(readEnv: ReadEnv = (name) => Deno.env.get(name)): number {
  const configured = Number(readEnv("AI_PROVIDER_TIMEOUT_MS"));
  return Number.isFinite(configured) && configured >= 1000 && configured <= 60000
    ? configured : 45000;
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
