/**
 * Catálogo canónico de modelos de IA, mapeo de modos y cálculo de costo real en USD.
 * Fuente de verdad técnica para enrutamiento y telemetría económica de Space Lab.
 */

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export interface ModelMetadata {
  provider: "openai" | "gemini" | "deepseek";
  apiModel: string;
  displayName: string;
  qualityTier: "fast" | "balanced" | "max_quality";
  pricing: ModelPricing;
}

export const CURRENT_COST_VERSION = "2026-09";

/**
 * Precios oficiales aproximados por millón de tokens (USD) a septiembre de 2026.
 */
export const MODEL_CATALOG: Record<string, ModelMetadata> = {
  "gpt-4o-mini": {
    provider: "openai",
    apiModel: "gpt-4o-mini",
    displayName: "GPT-6 Luna (Principal / Ultra Rápido)",
    qualityTier: "fast",
    pricing: { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  },
  "gpt-4o": {
    provider: "openai",
    apiModel: "gpt-4o",
    displayName: "GPT-5.6 Terra (Avanzado y Curricular)",
    qualityTier: "max_quality",
    pricing: { inputPerMillion: 2.50, outputPerMillion: 10.00 },
  },
  "gemini-2.0-flash": {
    provider: "gemini",
    apiModel: "gemini-2.0-flash",
    displayName: "Gemini 2.5 Flash (Multimodal Nativo)",
    qualityTier: "fast",
    pricing: { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  },
  "deepseek-chat": {
    provider: "deepseek",
    apiModel: "deepseek-chat",
    displayName: "DeepSeek Chat V3 (Conversacional)",
    qualityTier: "balanced",
    pricing: { inputPerMillion: 0.14, outputPerMillion: 0.28 },
  },
  "deepseek-reasoner": {
    provider: "deepseek",
    apiModel: "deepseek-reasoner",
    displayName: "DeepSeek R1 (Razonamiento Pedagógico)",
    qualityTier: "max_quality",
    pricing: { inputPerMillion: 0.55, outputPerMillion: 2.19 },
  },
};

/**
 * Mapeo de identificadores recibidos del cliente (5 modelos activos + alias legacy)
 * hacia el modelo canónico real de la API.
 */
export const MODEL_ALIAS_MAP: Record<string, string> = {
  // Modelos activos
  "gpt-6-luna": "gpt-4o-mini",
  "gpt-5.6-terra": "gpt-4o",
  "gemini-2.5-flash": "gemini-2.0-flash",
  "deepseek-chat": "deepseek-chat",
  "deepseek-reasoner": "deepseek-reasoner",

  // Alias y variantes DeepSeek
  "deepseek-v3": "deepseek-chat",
  "deepseek-r1": "deepseek-reasoner",

  // Alias legacy OpenAI (reservados o diferidos)
  "gpt-5.6-luna": "gpt-4o",
  "gpt-6-astra": "gpt-4o",
  "gpt-6-sol": "gpt-4o",
  "gpt-5.4-mini": "gpt-4o-mini",
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-4o": "gpt-4o",

  // Alias Gemini
  "gemini-2.0-flash": "gemini-2.0-flash",

  // Modos comerciales de calidad
  "fast": "gpt-4o-mini",
  "balanced": "deepseek-chat",
  "max_quality": "gpt-4o",
  "automatic": "gpt-4o-mini",
};

/**
 * Resuelve el modelo real de la API a partir de un identificador o modo.
 */
export function resolveApiModel(requestedModelOrMode: string, defaultModel = "gpt-4o-mini"): string {
  const normalized = (requestedModelOrMode || "").trim().toLowerCase();
  return MODEL_ALIAS_MAP[normalized] || defaultModel;
}

/**
 * Calcula el costo real en USD basado en el consumo de tokens y el precio del modelo.
 * Devuelve un número redondeado a 6 decimales.
 */
export function calculateProviderCostUsd(
  apiModel: string,
  inputTokens: number = 0,
  outputTokens: number = 0,
): number {
  const meta = MODEL_CATALOG[apiModel] || MODEL_CATALOG["gpt-4o-mini"];
  const inputCost = (Math.max(0, inputTokens) / 1_000_000) * meta.pricing.inputPerMillion;
  const outputCost = (Math.max(0, outputTokens) / 1_000_000) * meta.pricing.outputPerMillion;
  const total = inputCost + outputCost;
  return Math.round(total * 1_000_000) / 1_000_000;
}
