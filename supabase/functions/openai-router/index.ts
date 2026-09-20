import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuthenticatedUser } from "../_shared/auth.ts";
import { buildPromptRequest, type BuiltPrompt } from "../_shared/prompt-builder.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_MODELS = new Set(["gpt-5.6-luna", "gpt-5.4-mini"]);
const MAX_SOURCE_CHARS = 30_000;
const MAX_IMAGE_BASE64_CHARS = 4 * 1024 * 1024;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido." }), { status: 405, headers: corsHeaders });
  }

  const authError = await requireAuthenticatedUser(req);
  if (authError) {
    authError.headers.set("Access-Control-Allow-Origin", "*");
    return authError;
  }

  try {
    const payload = await req.json();
    let aiRequest: BuiltPrompt;
    try {
      aiRequest = buildPromptRequest(payload);
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Solicitud de IA inválida." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }
    const model = payload && typeof payload === "object" ? (payload as Record<string, unknown>).model : undefined;

    // Leer la API Key de los secretos configurados en Supabase
    const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("API_KEY_OPENAI");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "La variable OPENAI_API_KEY no está configurada en los Secretos de Supabase." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Construir contenido del mensaje de usuario
    const sourceFile = aiRequest.sourceFile;
    let userMessageContent: any = aiRequest.userPrompt;
    if (sourceFile) {
      if (typeof sourceFile.textContent === "string") {
        // The prompt builder already places text references inside the user prompt.
        userMessageContent = aiRequest.userPrompt.slice(0, MAX_SOURCE_CHARS * 2);
      } else if (typeof sourceFile.base64 === "string" && sourceFile.base64.length <= MAX_IMAGE_BASE64_CHARS && sourceFile.type?.startsWith("image/")) {
        userMessageContent = [
          { type: "text", text: aiRequest.userPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${sourceFile.type};base64,${sourceFile.base64}`
            }
          }
        ];
      }
    }

    const selectedModel = typeof model === "string" ? model : "gpt-5.6-luna";
    if (!ALLOWED_MODELS.has(selectedModel)) {
      return new Response(JSON.stringify({ error: "Modelo no permitido." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Llamada directa a la API oficial de OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: aiRequest.systemPrompt },
          { role: "user", content: userMessageContent }
        ],
        max_completion_tokens: aiRequest.maxOutputTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error:", errorText);
      let providerMessage = `OpenAI rechazó la solicitud (${response.status}).`;
      try {
        const errorPayload = JSON.parse(errorText);
        if (typeof errorPayload?.error?.message === "string") {
          providerMessage = errorPayload.error.message;
        }
      } catch {
        // Keep provider responses in server logs without exposing raw payloads to the browser.
      }
      return new Response(
        JSON.stringify({ error: providerMessage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify(reply),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": aiRequest.requestId, "X-Prompt-Version": aiRequest.promptVersion },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error en Edge Function openai-router:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
