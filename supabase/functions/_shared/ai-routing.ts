export type AiQuality = "automatic" | "fast" | "balanced" | "max_quality";
export type AiProvider = "openai" | "gemini" | "deepseek";

export interface AiRouteDecision {
  quality: AiQuality;
  provider: AiProvider;
  functionName: "openai-router" | "gemini-router" | "deepseek-router";
  model: string;
  reason: string;
}

export interface AiRoutingInput {
  action?: unknown;
  quality?: unknown;
  model?: unknown;
  input?: unknown;
}

const LEGACY_QUALITY: Record<string, AiQuality> = {
  automatic: "automatic",
  fast: "fast",
  balanced: "balanced",
  max_quality: "max_quality",
  "openai-gpt-6-luna": "automatic",
  "gpt-6-luna": "automatic",
  "gemini-2.5-flash": "fast",
  "deepseek-chat": "balanced",
  "deepseek-v3": "balanced",
  "openai-gpt-5.6-terra": "max_quality",
  "gpt-5.6-terra": "max_quality",
  "openai-gpt-5.6-luna": "max_quality",
  "openai-gpt-6-astra": "max_quality",
  "openai-gpt-6-sol": "max_quality",
  "deepseek-reasoner": "max_quality",
  "deepseek-r1": "max_quality",
};

function normalizedString(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeQuality(quality: unknown, legacyModel?: unknown): AiQuality {
  return LEGACY_QUALITY[normalizedString(quality)] ||
    LEGACY_QUALITY[normalizedString(legacyModel)] ||
    "automatic";
}

export function requestHasAttachment(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;
  const sourceFile = (input as Record<string, unknown>).sourceFile;
  return Boolean(sourceFile && typeof sourceFile === "object");
}

export function decideAiRoute(payload: AiRoutingInput): AiRouteDecision {
  const quality = normalizeQuality(payload.quality, payload.model);
  const action = normalizedString(payload.action);
  const hasAttachment = requestHasAttachment(payload.input);

  if (hasAttachment && quality !== "max_quality") {
    return {
      quality,
      provider: "gemini",
      functionName: "gemini-router",
      model: "gemini-2.5-flash",
      reason: "attachment_multimodal",
    };
  }

  if ((action === "pedagogy_brief" || action === "summarize_brief") && quality === "automatic") {
    return {
      quality,
      provider: "gemini",
      functionName: "gemini-router",
      model: "gemini-2.5-flash",
      reason: "lightweight_pedagogy_action",
    };
  }

  if (quality === "fast") {
    return {
      quality,
      provider: "gemini",
      functionName: "gemini-router",
      model: "gemini-2.5-flash",
      reason: "quality_fast",
    };
  }

  if (quality === "balanced") {
    return {
      quality,
      provider: "deepseek",
      functionName: "deepseek-router",
      model: "deepseek-chat",
      reason: "quality_balanced",
    };
  }

  if (quality === "max_quality") {
    return {
      quality,
      provider: "openai",
      functionName: "openai-router",
      model: "gpt-5.6-terra",
      reason: hasAttachment ? "attachment_max_quality" : "quality_max",
    };
  }

  return {
    quality,
    provider: "openai",
    functionName: "openai-router",
    model: "gpt-6-luna",
    reason: action === "chatbot" ? "automatic_chat" : "automatic_default",
  };
}

export function fallbackRoute(disabledProvider: AiProvider, quality: AiQuality): AiRouteDecision {
  if (disabledProvider !== "openai") {
    return {
      quality,
      provider: "openai",
      functionName: "openai-router",
      model: quality === "max_quality" ? "gpt-5.6-terra" : "gpt-6-luna",
      reason: `provider_${disabledProvider}_disabled`,
    };
  }
  return {
    quality,
    provider: "gemini",
    functionName: "gemini-router",
    model: "gemini-2.5-flash",
    reason: "provider_openai_disabled",
  };
}

export function shouldFallbackStatus(status: number): boolean {
  return status === 500 || status === 502 || status === 503 || status === 504;
}
