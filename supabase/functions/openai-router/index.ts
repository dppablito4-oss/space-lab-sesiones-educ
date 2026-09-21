import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthenticatedContext } from "../_shared/auth.ts";
import { preflightResponse, jsonResponse } from "../_shared/cors.ts";
import { providerErrorResponse, configurationErrorResponse, internalErrorResponse } from "../_shared/ai-errors.ts";
import { AiCreditError, completeAiUsage, creditErrorPayload, refundAiUsage, reserveAiCredits } from "../_shared/ai-credits.ts";
import { buildPromptRequest, type BuiltPrompt } from "../_shared/prompt-builder.ts";

const ALLOWED_MODELS = new Set(["gpt-5.6-luna", "gpt-5.4-mini"]);
const MAX_SOURCE_CHARS = 30_000;
const MAX_IMAGE_BASE64_CHARS = 4 * 1024 * 1024;

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

    const rawModel = payload && typeof payload === "object" ? (payload as Record<string, unknown>).model : undefined;
    const selectedModel = typeof rawModel === "string" ? rawModel : "gpt-5.6-luna";
    if (!ALLOWED_MODELS.has(selectedModel)) {
      return jsonResponse(req, { error: "Modelo no permitido.", code: "MODEL_NOT_ALLOWED", requestId: aiRequest.requestId }, 400);
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("API_KEY_OPENAI");
    if (!apiKey) {
      console.error("Falta OPENAI_API_KEY en el entorno.");
      return configurationErrorResponse(req, aiRequest.requestId);
    }

    let reservation;
    try {
      reservation = await reserveAiCredits(auth.client, {
        requestId: aiRequest.requestId,
        action: aiRequest.action,
        provider: "openai",
        model: selectedModel,
      });
    } catch (error) {
      if (error instanceof AiCreditError) {
        return jsonResponse(req, creditErrorPayload(error, aiRequest.requestId), error.status);
      }
      throw error;
    }

    try {
      const sourceFile = aiRequest.sourceFile;
      let userMessageContent: unknown = aiRequest.userPrompt;
      if (sourceFile?.textContent) {
        userMessageContent = aiRequest.userPrompt.slice(0, MAX_SOURCE_CHARS * 2);
      } else if (sourceFile?.base64 && sourceFile.base64.length <= MAX_IMAGE_BASE64_CHARS && sourceFile.type.startsWith("image/")) {
        userMessageContent = [
          { type: "text", text: aiRequest.userPrompt },
          { type: "image_url", image_url: { url: `data:${sourceFile.type};base64,${sourceFile.base64}` } },
        ];
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: aiRequest.systemPrompt },
            { role: "user", content: userMessageContent },
          ],
          max_completion_tokens: aiRequest.maxOutputTokens,
        }),
      });

      if (!response.ok) {
        console.error(`OpenAI API Error (${response.status}):`, await response.text());
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
      console.error("OpenAI provider invocation failed:", error);
      await refundAiUsage(auth.client, aiRequest.requestId);
      return providerErrorResponse(req, aiRequest.requestId);
    }
  } catch (error) {
    console.error("Error en Edge Function openai-router:", error);
    return internalErrorResponse(req, aiRequest?.requestId);
  }
});
