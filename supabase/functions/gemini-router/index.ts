import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuthenticatedUser } from "../_shared/auth.ts";
import { buildPromptRequest, type BuiltPrompt } from "../_shared/prompt-builder.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_SOURCE_BASE64_CHARS = 4 * 1024 * 1024;

serve(async (req) => {
  // Manejo de preflight CORS
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
    const sourceFile = aiRequest.sourceFile;

    // Leer la API Key de los secretos configurados en Supabase
    const apiKey = Deno.env.get("API-KEY-GEMINI") || Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "La variable API-KEY-GEMINI no está configurada en los Secretos de Supabase." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Construir partes del contenido
    const parts: any[] = [{ text: aiRequest.userPrompt }];

    // Si hay archivo multimodal adjunto (PDF, imagen, audio)
    if (sourceFile && typeof sourceFile.base64 === "string" && sourceFile.base64.length <= MAX_SOURCE_BASE64_CHARS && sourceFile.type) {
      parts.push({
        inlineData: {
          mimeType: sourceFile.type,
          data: sourceFile.base64
        }
      });
    }

    const requestBody: any = {
      contents: [{ parts }],
      generationConfig: {
        maxOutputTokens: aiRequest.maxOutputTokens
      }
    };
    if (aiRequest.expectsJson) requestBody.generationConfig.responseMimeType = "application/json";

    requestBody.systemInstruction = { parts: [{ text: aiRequest.systemPrompt }] };

    const modelName = "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`[Gemini Router] Enviando petición a modelo ${modelName}...`);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return new Response(
        JSON.stringify({ error: `Gemini API returned error: ${response.status}`, details: errorText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      return new Response(
        JSON.stringify({ error: "Gemini API no devolvió contenido.", rawData: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Retornamos la respuesta de la IA en formato JSON
    return new Response(
      JSON.stringify(replyText),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": aiRequest.requestId, "X-Prompt-Version": aiRequest.promptVersion },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error en Edge Function gemini-router:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
