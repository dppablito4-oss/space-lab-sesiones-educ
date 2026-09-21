import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthenticatedContext } from "../_shared/auth.ts";
import { preflightResponse, jsonResponse } from "../_shared/cors.ts";
import { providerErrorResponse, configurationErrorResponse, internalErrorResponse } from "../_shared/ai-errors.ts";
import { AiCreditError, completeAiUsage, creditErrorPayload, refundAiUsage, reserveAiCredits } from "../_shared/ai-credits.ts";
import { buildPromptRequest, type BuiltPrompt } from "../_shared/prompt-builder.ts";

const MODEL_NAME = "deepseek-chat";

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

    let reservation;
    try {
      reservation = await reserveAiCredits(auth.client, {
        requestId: aiRequest.requestId,
        action: aiRequest.action,
        provider: "deepseek",
        model: MODEL_NAME,
      });
    } catch (error) {
      if (error instanceof AiCreditError) {
        return jsonResponse(req, creditErrorPayload(error, aiRequest.requestId), error.status);
      }
      throw error;
    }

    try {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            { role: "system", content: aiRequest.systemPrompt },
            { role: "user", content: aiRequest.userPrompt },
          ],
          temperature: 0.7,
          max_tokens: aiRequest.maxOutputTokens,
        }),
      });

      if (!response.ok) {
        console.error(`DeepSeek API Error (${response.status}):`, await response.text());
        throw new Error("PROVIDER_ERROR");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;
      if (typeof reply !== "string" || !reply) throw new Error("EMPTY_PROVIDER_RESPONSE");

      const balance = await completeAiUsage(auth.client, aiRequest.requestId, {
        input: data.usage?.prompt_tokens,
        output: data.usage?.completion_tokens,
      });

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
