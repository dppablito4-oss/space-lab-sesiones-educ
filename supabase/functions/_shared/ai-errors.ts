import { jsonResponse } from "./cors.ts";

export function providerErrorResponse(req: Request, requestId: string): Response {
  return jsonResponse(req, {
    error: "El proveedor de IA no pudo completar la solicitud.",
    code: "PROVIDER_ERROR",
    requestId,
  }, 502);
}

export function internalErrorResponse(req: Request, requestId?: string): Response {
  return jsonResponse(req, {
    error: "El servicio de IA no pudo procesar la solicitud.",
    code: "INTERNAL_ERROR",
    ...(requestId ? { requestId } : {}),
  }, 500);
}

export function configurationErrorResponse(req: Request, requestId: string): Response {
  return jsonResponse(req, {
    error: "El proveedor de IA no está configurado temporalmente.",
    code: "PROVIDER_UNAVAILABLE",
    requestId,
  }, 503);
}
