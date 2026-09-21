import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { jsonResponse } from "./cors.ts";

export async function getAuthenticatedContext(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse(req, { error: "Debes iniciar sesión para usar el servicio de IA.", code: "AUTH_REQUIRED" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Faltan SUPABASE_URL o SUPABASE_ANON_KEY en el entorno.");
    return jsonResponse(req, { error: "El servicio de autenticación no está configurado.", code: "AUTH_UNAVAILABLE" }, 500);
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await client.auth.getUser();

  if (error || !user) {
    return jsonResponse(req, { error: "Sesión inválida o vencida.", code: "INVALID_SESSION" }, 401);
  }

  return { user, client };
}

export async function requireAuthenticatedUser(req: Request): Promise<Response | null> {
  const result = await getAuthenticatedContext(req);
  return result instanceof Response ? result : null;
}
