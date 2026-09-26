/**
 * Entitlements y control de capacidades comerciales.
 * Opera en shadow por defecto; enforcement debe fallar cerrado.
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
  deniedFeatures: string[];
  verificationFailed: boolean;
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

/** Conserva el contrato singular para consumidores legacy. */
export function getRequiredFeatureKey(
  action: string,
  options: RequiredFeatureOptions = {},
): string {
  return getRequiredFeatureKeys(action, options)[0];
}

/**
 * Devuelve todas las capacidades necesarias. Los atributos adicionales de una
 * solicitud no reemplazan al permiso base de la acción.
 */
export function getRequiredFeatureKeys(
  action: string,
  options: RequiredFeatureOptions = {},
): string[] {
  const required: string[] = [];

  switch (action) {
    case "chatbot":
      required.push("ai.chat");
      break;
    case "generate_session":
    case "generate_criteria":
    case "pedagogy_brief":
    case "summarize_brief":
    case "refine_text":
    default:
      required.push("session.generate");
  }

  if (options.hasAttachment) required.push("ai.attach_file");
  if (options.modelQuality === "max_quality") required.push("ai.quality_max");
  if (options.modelQuality === "balanced") required.push("ai.quality_balanced");

  return Array.from(new Set(required));
}

/** Conserva el contrato singular para consumidores legacy. */
export async function checkFeatureEntitlement(
  client: EntitlementRpcClient,
  featureKey: string,
  options: CheckEntitlementOptions = {},
): Promise<EntitlementCheckResult> {
  return checkFeatureEntitlements(client, [featureKey], options);
}

/**
 * Valida todas las capacidades con una sola lectura del RPC. Shadow permite y
 * audita; enforcement bloquea también ante errores o respuestas incompletas.
 */
export async function checkFeatureEntitlements(
  client: EntitlementRpcClient,
  featureKeys: string[],
  options: CheckEntitlementOptions = {},
): Promise<EntitlementCheckResult> {
  const required = Array.from(new Set(featureKeys.filter(Boolean)));
  const primaryFeature = required[0] || "session.generate";
  const enforce = options.enforce ?? (Deno.env.get("BILLING_ENFORCEMENT") === "true");

  try {
    const { data, error } = await client.rpc("get_user_entitlements");

    if (error || !data || typeof data !== "object") {
      console.warn(`[Entitlements] No se pudieron verificar '${required.join(", ")}':`, error);
      return {
        allowed: !enforce,
        wouldBlock: true,
        plan: "unknown",
        featureKey: primaryFeature,
        deniedFeatures: required,
        verificationFailed: true,
      };
    }

    const result = data as UserEntitlementsResult;
    if (result.ok !== true || !result.features || typeof result.features !== "object" || Array.isArray(result.features)) {
      console.warn(`[Entitlements] Respuesta inválida al verificar '${required.join(", ")}'.`);
      return {
        allowed: !enforce,
        wouldBlock: true,
        plan: result.plan || "unknown",
        featureKey: primaryFeature,
        deniedFeatures: required,
        verificationFailed: true,
      };
    }
    const plan = result.plan || "unknown";
    const features = result.features;
    const deniedFeatures = required.filter((featureKey) => features[featureKey] !== true);

    if (deniedFeatures.length > 0) {
      console.warn(`[Entitlements SHADOW] WOULD_BLOCK user: ${options.userId || "anon"}, plan: ${plan}, features: ${deniedFeatures.join(",")}, requestId: ${options.requestId || "n/a"}`);
      return {
        allowed: !enforce,
        wouldBlock: true,
        plan,
        featureKey: deniedFeatures[0],
        deniedFeatures,
        verificationFailed: false,
      };
    }

    return {
      allowed: true,
      wouldBlock: false,
      plan,
      featureKey: primaryFeature,
      deniedFeatures: [],
      verificationFailed: false,
    };
  } catch (error) {
    console.error(`[Entitlements] Error verificando '${required.join(", ")}':`, error);
    return {
      allowed: !enforce,
      wouldBlock: true,
      plan: "unknown",
      featureKey: primaryFeature,
      deniedFeatures: required,
      verificationFailed: true,
    };
  }
}
