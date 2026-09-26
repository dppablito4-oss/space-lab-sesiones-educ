import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthenticatedContext } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse, preflightResponse } from "../_shared/cors.ts";
import {
  decideAiRoute,
  fallbackRoute,
  shouldFallbackStatus,
  type AiProvider,
  type AiRouteDecision,
  type AiRoutingInput,
} from "../_shared/ai-routing.ts";

interface GatewayAttempt {
  requestId: string;
  provider: AiProvider;
  model: string;
  reason: string;
  status: number;
  latencyMs: number;
  error?: string;
}

interface RpcResult {
  ok?: boolean;
  code?: string;
  status?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function providerEnabled(provider: AiProvider): boolean {
  return Deno.env.get(`PROVIDER_${provider.toUpperCase()}_ENABLED`) !== "false";
}

function asRpcResult(data: unknown): RpcResult {
  return data && typeof data === "object" ? data as RpcResult : {};
}

function routeCandidates(primary: AiRouteDecision): AiRouteDecision[] {
  const candidates: AiRouteDecision[] = [];
  if (providerEnabled(primary.provider)) candidates.push(primary);

  const backup = fallbackRoute(primary.provider, primary.quality);
  if (providerEnabled(backup.provider) && !candidates.some((route) => route.provider === backup.provider)) {
    candidates.push({
      ...backup,
      reason: candidates.length > 0 ? `runtime_fallback_from_${primary.provider}` : backup.reason,
    });
  }
  return candidates;
}

function responseErrorCode(body: Uint8Array, contentType: string): string | null {
  if (!contentType.includes("application/json")) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(body));
    return parsed && typeof parsed === "object" && typeof parsed.code === "string" ? parsed.code : null;
  } catch {
    return null;
  }
}

function publicResponseBody(body: Uint8Array, contentType: string, requestId: string): Uint8Array {
  if (!contentType.includes("application/json")) return body;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(body));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !("requestId" in parsed)) return body;
    return new TextEncoder().encode(JSON.stringify({ ...parsed, requestId }));
  } catch {
    return body;
  }
}

serve(async (req) => {
  const preflight = preflightResponse(req);
  if (preflight) return preflight;
  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Método no permitido.", code: "METHOD_NOT_ALLOWED" }, 405);
  }
  if (Deno.env.get("AI_GLOBAL_ENABLED") === "false") {
    return jsonResponse(req, { error: "El servicio de IA está temporalmente deshabilitado.", code: "AI_DISABLED" }, 503);
  }

  const auth = await getAuthenticatedContext(req);
  if (auth instanceof Response) return auth;

  let payload: AiRoutingInput & Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(req, { error: "Solicitud JSON inválida.", code: "INVALID_JSON" }, 400);
  }

  const requestId = typeof payload.requestId === "string" ? payload.requestId : "";
  const action = typeof payload.action === "string" ? payload.action.trim() : "";
  if (!UUID_PATTERN.test(requestId) || !action) {
    return jsonResponse(req, { error: "Solicitud de IA inválida.", code: "INVALID_AI_REQUEST" }, 400);
  }

  const primary = decideAiRoute(payload);
  const candidates = routeCandidates(primary);
  if (candidates.length === 0) {
    return jsonResponse(req, { error: "No hay proveedores de IA disponibles.", code: "NO_PROVIDER_AVAILABLE" }, 503);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    return jsonResponse(req, { error: "El gateway de IA no está configurado.", code: "GATEWAY_UNAVAILABLE" }, 500);
  }

  const { data: beginData, error: beginError } = await auth.client.rpc("begin_ai_gateway_request", {
    p_request_id: requestId,
    p_action: action,
    p_requested_quality: primary.quality,
    p_primary_provider: candidates[0].provider,
    p_primary_model: candidates[0].model,
    p_route_reason: candidates[0].reason,
  });
  const beginResult = asRpcResult(beginData);
  if (beginError) {
    console.error("[AI Gateway] No se pudo iniciar la solicitud:", beginError);
    return jsonResponse(req, { error: "No se pudo iniciar la solicitud de IA.", code: "GATEWAY_STATE_UNAVAILABLE" }, 500);
  }
  if (!beginResult.ok) {
    const duplicate = beginResult.code === "DUPLICATE_REQUEST";
    return jsonResponse(req, {
      error: duplicate ? "Esta solicitud ya fue recibida." : "La solicitud de IA no es válida.",
      code: beginResult.code || "GATEWAY_REQUEST_REJECTED",
      status: beginResult.status,
      requestId,
    }, duplicate ? 409 : 400);
  }

  const authorization = req.headers.get("Authorization") || "";
  const apiKey = req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  const attempts: GatewayAttempt[] = [];
  let finalResponse: Response | null = null;
  let finalDecision = candidates[0];
  let finalAttemptId = "";

  for (let index = 0; index < candidates.length; index += 1) {
    const decision = candidates[index];
    const attemptRequestId = crypto.randomUUID();
    const startedAt = Date.now();
    finalDecision = decision;
    finalAttemptId = attemptRequestId;

    try {
      const upstream = await fetch(`${supabaseUrl}/functions/v1/${decision.functionName}`, {
        method: "POST",
        headers: {
          "Authorization": authorization,
          "apikey": apiKey,
          "Content-Type": "application/json",
          "X-AI-Gateway": "v1",
          "X-AI-Parent-Request-Id": requestId,
        },
        body: JSON.stringify({
          ...payload,
          requestId: attemptRequestId,
          quality: decision.quality,
          model: decision.model,
        }),
      });

      attempts.push({
        requestId: attemptRequestId,
        provider: decision.provider,
        model: decision.model,
        reason: decision.reason,
        status: upstream.status,
        latencyMs: Date.now() - startedAt,
      });

      const { error } = await auth.client.rpc("record_ai_route", {
        p_request_id: attemptRequestId,
        p_requested_quality: decision.quality,
        p_route_reason: decision.reason,
      });
      if (error) console.warn("[AI Gateway] No se pudo registrar la ruta del intento:", error);

      finalResponse = upstream;
      const canRetry = shouldFallbackStatus(upstream.status) && index < candidates.length - 1;
      if (!canRetry) break;

      await upstream.arrayBuffer();
      console.warn(`[AI Gateway] Fallback ${decision.provider} -> ${candidates[index + 1].provider}`);
    } catch (error) {
      attempts.push({
        requestId: attemptRequestId,
        provider: decision.provider,
        model: decision.model,
        reason: decision.reason,
        status: 0,
        latencyMs: Date.now() - startedAt,
        error: "NETWORK_ERROR",
      });
      console.error(`[AI Gateway] Falló ${decision.provider}:`, error);
      if (index === candidates.length - 1) finalResponse = null;
    }
  }

  let responseStatus = finalResponse?.status || 502;
  let contentType = finalResponse?.headers.get("Content-Type") || "application/json";
  let responseBody = finalResponse
    ? new Uint8Array(await finalResponse.arrayBuffer())
    : new TextEncoder().encode(JSON.stringify({
      error: "No se pudo contactar al proveedor de IA.",
      code: "GATEWAY_PROVIDER_ERROR",
      requestId,
    }));
  const errorCode = responseErrorCode(responseBody, contentType) ||
    (responseStatus >= 500 ? "GATEWAY_PROVIDER_ERROR" : null);
  const gatewayStatus = responseStatus >= 200 && responseStatus < 300
    ? "success"
    : (responseStatus >= 500 ? "failed" : "rejected");

  const { error: finishError } = await auth.client.rpc("finish_ai_gateway_request", {
    p_request_id: requestId,
    p_status: gatewayStatus,
    p_final_provider: finalDecision.provider,
    p_final_model: finalDecision.model,
    p_attempts: attempts,
    p_response_status: responseStatus,
    p_error_code: errorCode,
  });
  if (finishError) console.error("[AI Gateway] No se pudo cerrar la solicitud:", finishError);

  responseBody = publicResponseBody(responseBody, contentType, requestId);
  const responseHeaders: Record<string, string> = {
    ...corsHeaders(req),
    "Content-Type": contentType,
    "X-Request-Id": requestId,
    "X-AI-Attempt-Id": finalAttemptId,
    "X-AI-Provider": finalDecision.provider,
    "X-AI-Model": finalDecision.model,
    "X-AI-Route-Reason": finalDecision.reason,
    "X-AI-Fallback-Count": String(Math.max(0, attempts.length - 1)),
  };
  for (const header of ["X-Prompt-Version", "X-AI-Credits-Remaining"]) {
    const value = finalResponse?.headers.get(header);
    if (value) responseHeaders[header] = value;
  }

  return new Response(responseBody, { status: responseStatus, headers: responseHeaders });
});
