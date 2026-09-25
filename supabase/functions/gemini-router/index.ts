import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthenticatedContext } from "../_shared/auth.ts";
import { preflightResponse, jsonResponse } from "../_shared/cors.ts";
import { providerErrorResponse, configurationErrorResponse, internalErrorResponse } from "../_shared/ai-errors.ts";
import { AiCreditError, completeAiUsage, creditErrorPayload, refundAiUsage, reserveAiCredits } from "../_shared/ai-credits.ts";
import { buildPromptRequest, type BuiltPrompt } from "../_shared/prompt-builder.ts";

const MODEL_NAME = "gemini-2.5-flash";
const MAX_SOURCE_BASE64_CHARS = 4 * 1024 * 1024;

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

    const apiKey = Deno.env.get("API-KEY-GEMINI") || Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("Falta GEMINI_API_KEY en el entorno.");
      return configurationErrorResponse(req, aiRequest.requestId);
    }

    let reservation;
    try {
      reservation = await reserveAiCredits(auth.client, {
        requestId: aiRequest.requestId,
        action: aiRequest.action,
        provider: "gemini",
        model: MODEL_NAME,
      });
    } catch (error) {
      if (error instanceof AiCreditError) {
        return jsonResponse(req, creditErrorPayload(error, aiRequest.requestId), error.status);
      }
      throw error;
    }

    try {
      const parts: Array<Record<string, unknown>> = [{ text: aiRequest.userPrompt }];
      const sourceFile = aiRequest.sourceFile;
      if (sourceFile?.base64 && sourceFile.base64.length <= MAX_SOURCE_BASE64_CHARS && sourceFile.type) {
        parts.push({ inlineData: { mimeType: sourceFile.type, data: sourceFile.base64 } });
      }

      const generationConfig: Record<string, unknown> = { maxOutputTokens: aiRequest.maxOutputTokens };
      if (aiRequest.expectsJson) generationConfig.responseMimeType = "application/json";
      const requestBody = {
        contents: [{ parts }],
        generationConfig,
        systemInstruction: { parts: [{ text: aiRequest.systemPrompt }] },
      };

      const GEMINI_API_MODEL = "gemini-2.0-flash";
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_API_MODEL}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error(`Gemini API Error (${response.status}):`, await response.text());
        throw new Error("PROVIDER_ERROR");
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof reply !== "string" || !reply) throw new Error("EMPTY_PROVIDER_RESPONSE");

      const balance = await completeAiUsage(auth.client, aiRequest.requestId, {
        input: data.usageMetadata?.promptTokenCount,
        output: data.usageMetadata?.candidatesTokenCount,
      });

      return jsonResponse(req, reply, 200, {
        "X-Request-Id": aiRequest.requestId,
        "X-Prompt-Version": aiRequest.promptVersion,
        "X-AI-Credits-Remaining": String(balance ?? reservation.balance),
      });
    } catch (error) {
      console.error("Gemini provider invocation failed:", error);
      await refundAiUsage(auth.client, aiRequest.requestId);
      return providerErrorResponse(req, aiRequest.requestId);
    }
  } catch (error) {
    console.error("Error en Edge Function gemini-router:", error);
    return internalErrorResponse(req, aiRequest?.requestId);
  }
});
