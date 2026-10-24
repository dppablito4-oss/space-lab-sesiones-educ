import type { RpcClient } from "./ai-credits.ts";

/** Bind accounting identity to the user verified by Auth, never request JSON. */
export function serverAccounting(client: RpcClient, verifiedUserId: string): RpcClient {
  return {
    rpc(operation, payload) {
      return client.rpc("run_ai_accounting", {
        p_user_id: verifiedUserId,
        p_operation: operation,
        p_payload: payload,
      });
    },
  };
}
