import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthenticatedContext } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse, preflightResponse } from "../_shared/cors.ts";
import { decideAiRoute, fallbackRoute, type AiProvider, type AiRoutingInput } from "../_shared/ai-routing.ts";

function providerEnabled(provider: AiProvider): boolean {
  return Deno.env.get(`PROVIDER_${provider.toUpperCase()}_ENABLED`) !== "false";
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

  let decision = decideAiRoute(payload);
  if (!providerEnabled(decision.provider)) {
    decision = fallbackRoute(decision.provider, decision.quality);
  }
  if (!providerEnabled(decision.provider)) {
    return jsonResponse(req, { error: "No hay proveedores de IA disponibles.", code: "NO_PROVIDER_AVAILABLE" }, 503);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    return jsonResponse(req, { error: "El gateway de IA no está configurado.", code: "GATEWAY_UNAVAILABLE" }, 500);
  }

  const authorization = req.headers.get("Authorization") || "";
  const apiKey = req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  const routedPayload = {
    ...payload,
    quality: decision.quality,
    model: decision.model,
  };

  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/${decision.functionName}`, {
      method: "POST",
      headers: {
        "Authorization": authorization,
        "apikey": apiKey,
        "Content-Type": "application/json",
        "X-AI-Gateway": "v1",
      },
      body: JSON.stringify(routedPayload),
    });

    const requestId = typeof payload.requestId === "string" ? payload.requestId : null;
    if (requestId) {
      const { error } = await auth.client.rpc("record_ai_route", {
        p_request_id: requestId,
        p_requested_quality: decision.quality,
        p_route_reason: decision.reason,
      });
      if (error) console.warn("[AI Gateway] No se pudo registrar la ruta:", error);
    }

    const responseHeaders: Record<string, string> = {
      ...corsHeaders(req),
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      "X-AI-Provider": decision.provider,
      "X-AI-Model": decision.model,
      "X-AI-Route-Reason": decision.reason,
    };
    for (const header of ["X-Request-Id", "X-Prompt-Version", "X-AI-Credits-Remaining"]) {
      const value = upstream.headers.get(header);
      if (value) responseHeaders[header] = value;
    }

    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[AI Gateway] Falló el router interno:", error);
    return jsonResponse(req, { error: "No se pudo contactar al proveedor de IA.", code: "GATEWAY_PROVIDER_ERROR" }, 502);
  }
});
