/**
 * Módulo de Entitlements y Control de Capacidades Comerciales (Fase 4 SaaS)
 * Opera en modo SHADOW por defecto (BILLING_ENFORCEMENT=false) para no bloquear
 * a ningún docente evaluador mientras audita con telemetría económica.
 */

export interface UserEntitlementsResult {
  ok: boolean;
  plan: string;
  features: Record<string, boolean>;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  wouldBlock: boolean;
  plan: string;
  featureKey: string;
}

export interface EntitlementRpcClient {
  rpc(name: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
}

export interface RequiredFeatureOptions {
  hasAttachment?: boolean;
  modelQuality?: string;
}

export interface CheckEntitlementOptions {
  userId?: string;
  requestId?: string;
  enforce?: boolean;
}

/**
 * Resuelve la clave de permiso (feature_key) requerida según la acción y atributos de la petición.
 */
export function getRequiredFeatureKey(
  action: string,
  options: RequiredFeatureOptions = {}
): string {
  if (options.hasAttachment) {
    return "ai.attach_file";
  }
  if (options.modelQuality === "max_quality") {
    return "ai.quality_max";
  }
  if (options.modelQuality === "balanced") {
    return "ai.quality_balanced";
  }
  switch (action) {
    case "generate_session":
    case "generate_criteria":
      return "session.generate";
    case "chatbot":
      return "ai.chat";
    case "pedagogy_brief":
    case "summarize_brief":
    case "refine_text":
      return "session.generate";
    default:
      return "session.generate";
  }
}

/**
 * Consulta y valida el entitlement del usuario llamando al RPC get_user_entitlements().
 * En modo SHADOW (por defecto), si una característica no estuviera habilitada, se
 * registra como WOULD_BLOCK pero se permite continuar sin interrumpir al docente.
 */
export async function checkFeatureEntitlement(
  client: EntitlementRpcClient,
  featureKey: string,
  options: CheckEntitlementOptions = {}
): Promise<EntitlementCheckResult> {
  try {
    const { data, error } = await client.rpc("get_user_entitlements");

    if (error || !data || typeof data !== "object") {
      console.warn(`[Entitlements] Advertencia: No se pudo verificar el entitlement para '${featureKey}':`, error);
      return { allowed: true, wouldBlock: false, plan: "unknown", featureKey };
    }

    const result = data as UserEntitlementsResult;
    const plan = result.plan || "unknown";
    const features = result.features || {};
    const isEnabled = features[featureKey] !== false; // Solo bloquea si explícitamente es false

    if (!isEnabled) {
      console.warn(`[Entitlements SHADOW] WOULD_BLOCK user: ${options.userId || "anon"}, plan: ${plan}, feature: ${featureKey}, requestId: ${options.requestId || "n/a"}`);

      // Enforce solo si la variable de entorno BILLING_ENFORCEMENT=true está activa
      const enforce = options.enforce ?? (Deno.env.get("BILLING_ENFORCEMENT") === "true");
      if (enforce) {
        return { allowed: false, wouldBlock: true, plan, featureKey };
      }

      // En modo SHADOW: se permite la ejecución para la beta
      return { allowed: true, wouldBlock: true, plan, featureKey };
    }

    return { allowed: true, wouldBlock: false, plan, featureKey };
  } catch (err) {
    console.error(`[Entitlements] Error inesperado evaluando feature '${featureKey}':`, err);
    return { allowed: true, wouldBlock: false, plan: "unknown", featureKey };
  }
}
