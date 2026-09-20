import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuthenticatedUser } from "../_shared/auth.ts";
import { buildPromptRequest, type BuiltPrompt } from "../_shared/prompt-builder.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    // Leer la API Key de los secretos configurados en Supabase
    const apiKey = Deno.env.get("API-KEY-DEEPSEEK") || Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "La variable API-KEY-DEEPSEEK no está configurada en los Secretos de Supabase." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Llamada a la API de DeepSeek (es compatible con OpenAI API)
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat", // DeepSeek-V3
        messages: [
          { role: "system", content: aiRequest.systemPrompt },
          { role: "user", content: aiRequest.userPrompt }
        ],
        temperature: 0.7,
        max_tokens: aiRequest.maxOutputTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API Error:", errorText);
      return new Response(
        JSON.stringify({ error: `DeepSeek API returned error: ${response.status}`, details: errorText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    // Retornamos la respuesta de la IA directamente en formato texto/JSON
    return new Response(
      JSON.stringify(reply),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": aiRequest.requestId, "X-Prompt-Version": aiRequest.promptVersion },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error en Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
