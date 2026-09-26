import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthenticatedContext } from "../_shared/auth.ts";
import { preflightResponse, jsonResponse } from "../_shared/cors.ts";
import { providerErrorResponse, configurationErrorResponse, internalErrorResponse, entitlementErrorResponse } from "../_shared/ai-errors.ts";
import { AiCreditError, completeAiUsage, creditErrorPayload, refundAiUsage, reserveAiCredits } from "../_shared/ai-credits.ts";
import { buildPromptRequest, type BuiltPrompt } from "../_shared/prompt-builder.ts";
import { calculateProviderCostUsd } from "../_shared/model-catalog.ts";
import { checkFeatureEntitlements, getRequiredFeatureKeys } from "../_shared/entitlements.ts";

serve(async (req) => {
  const preflight = preflightResponse(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return jsonResponse(req, { error: "Método no permitido.", code: "METHOD_NOT_ALLOWED" }, 405);

  const auth = await getAuthenticatedContext(req);
  if (auth instanceof Response) return auth;

  let aiRequest: BuiltPrompt | null = null;
  try {
    const payload = await req.json();
    try {
      aiRequest = buildPromptRequest(payload);
    } catch (error) {
      return jsonResponse(req, {
        error: error instanceof Error ? error.message : "Solicitud de IA inválida.",
        code: "INVALID_AI_REQUEST",
      }, 400);
    }

    const apiKey = Deno.env.get("API-KEY-DEEPSEEK") || Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) {
      console.error("Falta DEEPSEEK_API_KEY en el entorno.");
      return configurationErrorResponse(req, aiRequest.requestId);
    }

    // Resolver si se solicita deepseek-reasoner (R1) o deepseek-chat (V3)
    const rawModel = payload && typeof payload === "object" ? (payload as Record<string, unknown>).model : undefined;
    const selectedModel = typeof rawModel === "string" && (rawModel.includes("reasoner") || rawModel.includes("r1"))
      ? "deepseek-reasoner"
      : "deepseek-chat";

    // Verificación de Entitlements (en modo SHADOW para beta)
    const hasAttachment = Boolean(aiRequest.sourceFile);
    const modelQuality = selectedModel === "deepseek-reasoner" ? "max_quality" : "balanced";
    const featureKeys = getRequiredFeatureKeys(aiRequest.action, {
      hasAttachment,
      modelQuality,
    });

    const entitlement = await checkFeatureEntitlements(auth.client, featureKeys, {
      userId: auth.user.id,
      requestId: aiRequest.requestId,
    });

    if (!entitlement.allowed) {
      return entitlementErrorResponse(req, aiRequest.requestId, entitlement.featureKey, entitlement.plan);
    }

    let reservation;
    try {
      reservation = await reserveAiCredits(auth.client, {
        requestId: aiRequest.requestId,
        action: aiRequest.action,
        provider: "deepseek",
        model: selectedModel,
      });
    } catch (error) {
      if (error instanceof AiCreditError) {
        return jsonResponse(req, creditErrorPayload(error, aiRequest.requestId), error.status);
      }
      throw error;
    }

    try {
      const startTime = Date.now();
      const requestPayload: Record<string, unknown> = {
        model: selectedModel,
        messages: [
          { role: "system", content: aiRequest.systemPrompt },
          { role: "user", content: aiRequest.userPrompt },
        ],
        max_tokens: aiRequest.maxOutputTokens,
      };

      // Nota: DeepSeek Reasoner (R1) no admite el parámetro temperature en su API oficial
      if (selectedModel === "deepseek-chat") {
        requestPayload.temperature = 0.7;
      }

      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify(requestPayload),
      });
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        console.error(`DeepSeek API Error (${response.status}):`, await response.text());
        throw new Error("PROVIDER_ERROR");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;
      if (typeof reply !== "string" || !reply) throw new Error("EMPTY_PROVIDER_RESPONSE");

      const inputTokens = data.usage?.prompt_tokens ?? 0;
      const outputTokens = data.usage?.completion_tokens ?? 0;
      const costUsd = calculateProviderCostUsd(selectedModel, inputTokens, outputTokens);

      const balance = await completeAiUsage(
        auth.client,
        aiRequest.requestId,
        {
          input: inputTokens,
          output: outputTokens,
        },
        {
          providerModel: selectedModel,
          costUsd,
          latencyMs,
        },
      );

      return jsonResponse(req, reply, 200, {
        "X-Request-Id": aiRequest.requestId,
        "X-Prompt-Version": aiRequest.promptVersion,
        "X-AI-Credits-Remaining": String(balance ?? reservation.balance),
      });
    } catch (error) {
      console.error("DeepSeek provider invocation failed:", error);
      await refundAiUsage(auth.client, aiRequest.requestId);
      return providerErrorResponse(req, aiRequest.requestId);
    }
  } catch (error) {
    console.error("Error en Edge Function deepseek-router:", error);
    return internalErrorResponse(req, aiRequest?.requestId);
  }
});
