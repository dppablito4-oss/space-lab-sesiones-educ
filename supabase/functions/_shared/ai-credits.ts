export interface RpcClient {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
}

export interface CreditReservation {
  credits: number;
  balance: number;
  planId: string;
}

interface CreditRpcResult {
  ok?: boolean;
  code?: string;
  credits?: number;
  balance?: number;
  planId?: string;
  required?: number;
  status?: string;
}

const PUBLIC_ERRORS: Record<string, { message: string; status: number }> = {
  AUTH_REQUIRED: { message: "Debes iniciar sesión para usar el servicio de IA.", status: 401 },
  INVALID_REQUEST_ID: { message: "El identificador de la solicitud no es válido.", status: 400 },
  DUPLICATE_REQUEST: { message: "Esta solicitud de IA ya fue procesada.", status: 409 },
  UNKNOWN_ACTION: { message: "La acción de IA solicitada no está permitida.", status: 400 },
  RATE_LIMITED: { message: "Has realizado demasiadas solicitudes. Inténtalo nuevamente en un minuto.", status: 429 },
  DAILY_LIMIT_REACHED: { message: "Alcanzaste el límite diario de créditos de IA.", status: 429 },
  INSUFFICIENT_CREDITS: { message: "No tienes créditos suficientes para esta operación.", status: 402 },
  PLAN_DISABLED: { message: "Tu plan de IA no está disponible temporalmente.", status: 403 },
};

export class AiCreditError extends Error {
  code: string;
  status: number;
  balance?: number;

  constructor(code: string, balance?: number) {
    const publicError = PUBLIC_ERRORS[code] || { message: "No se pudo validar el consumo de créditos.", status: 500 };
    super(publicError.message);
    this.name = "AiCreditError";
    this.code = code;
    this.status = publicError.status;
    this.balance = balance;
  }
}

function asResult(data: unknown): CreditRpcResult {
  return data && typeof data === "object" ? data as CreditRpcResult : {};
}

export async function reserveAiCredits(
  client: RpcClient,
  input: { requestId: string; action: string; provider: string; model: string },
): Promise<CreditReservation> {
  const { data, error } = await client.rpc("reserve_ai_credits", {
    p_request_id: input.requestId,
    p_action: input.action,
    p_provider: input.provider,
    p_model: input.model,
  });
  if (error) {
    console.error("[AI Credits] No se pudo reservar:", error);
    throw new AiCreditError("ACCOUNTING_UNAVAILABLE");
  }
  const result = asResult(data);
  if (!result.ok) throw new AiCreditError(result.code || "ACCOUNTING_UNAVAILABLE", result.balance);
  return {
    credits: Number(result.credits) || 0,
    balance: Number(result.balance) || 0,
    planId: String(result.planId || "free"),
  };
}

export async function completeAiUsage(
  client: RpcClient,
  requestId: string,
  tokens: { input?: number | null; output?: number | null } = {},
): Promise<number | null> {
  const { data, error } = await client.rpc("complete_ai_usage", {
    p_request_id: requestId,
    p_input_tokens: tokens.input ?? null,
    p_output_tokens: tokens.output ?? null,
  });
  if (error) {
    console.error("[AI Credits] No se pudo completar el consumo:", error);
    throw new AiCreditError("ACCOUNTING_UNAVAILABLE");
  }
  const result = asResult(data);
  if (!result.ok) throw new AiCreditError(result.code || "ACCOUNTING_UNAVAILABLE", result.balance);
  return typeof result.balance === "number" ? result.balance : null;
}

export async function refundAiUsage(client: RpcClient, requestId: string): Promise<void> {
  const { data, error } = await client.rpc("refund_ai_usage", { p_request_id: requestId });
  const result = asResult(data);
  if (error || !result.ok) {
    console.error("[AI Credits] No se pudo devolver inmediatamente la reserva:", error || result.code);
  }
}

export function creditErrorPayload(error: AiCreditError, requestId: string): Record<string, unknown> {
  return {
    error: error.message,
    code: error.code,
    requestId,
    ...(typeof error.balance === "number" ? { balance: error.balance } : {}),
  };
}
