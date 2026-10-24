import { serverAccounting } from "../supabase/functions/_shared/server-accounting.ts";

Deno.test("server accounting binds the verified Auth identity outside caller payload", async () => {
  let received: unknown;
  const client = serverAccounting({
    rpc(name, args) {
      received = { name, args };
      return Promise.resolve({ data: { ok: true }, error: null });
    },
  }, "verified-user");
  const result = await client.rpc("refund_ai_usage", {
    p_request_id: "request", p_user_id: "forged-user", p_operation: "forged-operation",
  });
  const call = received as { name: string; args: Record<string, unknown> };
  if (call.name !== "run_ai_accounting" || call.args.p_user_id !== "verified-user" ||
      call.args.p_operation !== "refund_ai_usage" || !result.data) {
    throw new Error("Caller must not choose the trusted accounting identity or RPC");
  }
});
