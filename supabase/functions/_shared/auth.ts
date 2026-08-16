import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const jsonHeaders = { "Content-Type": "application/json" };

export async function requireAuthenticatedUser(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Debes iniciar sesión para usar el servicio de IA." }),
      { status: 401, headers: jsonHeaders },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Faltan SUPABASE_URL o SUPABASE_ANON_KEY en el entorno.");
    return new Response(
      JSON.stringify({ error: "El servicio de autenticación no está configurado." }),
      { status: 500, headers: jsonHeaders },
    );
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await client.auth.getUser();

  if (error || !user) {
    return new Response(
      JSON.stringify({ error: "Sesión inválida o vencida." }),
      { status: 401, headers: jsonHeaders },
    );
  }

  return null;
}
