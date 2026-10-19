import {
  AiCreditError,
  completeAiUsage,
  creditErrorPayload,
  refundAiUsage,
  reserveAiCredits,
  type RpcClient,
} from "../supabase/functions/_shared/ai-credits.ts";
import { corsHeaders, preflightResponse } from "../supabase/functions/_shared/cors.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function clientWith(results: Array<{ data: unknown; error: unknown }>, calls: Array<Record<string, unknown>>): RpcClient {
  return {
    async rpc(name, args) {
      calls.push({ name, args });
      return results.shift() || { data: null, error: new Error("missing mock") };
    },
  };
}

Deno.test("reserveAiCredits uses only action/request/provider/model and returns server balance", async () => {
  const calls: Array<Record<string, unknown>> = [];
  const client = clientWith([{ data: { ok: true, credits: 5, balance: 25, planId: "free" }, error: null }], calls);
  const reservation = await reserveAiCredits(client, {
    requestId: "00000000-0000-4000-8000-000000000001",
    action: "generate_session",
    provider: "openai",
    model: "gpt-test",
  });
  assert(reservation.credits === 5 && reservation.balance === 25, "server result not preserved");
  const args = calls[0].args as Record<string, unknown>;
  assert(!("credits" in args) && !("cost" in args), "client must never send a cost");
});

Deno.test("credit errors normalize insufficient balance and duplicate request", async () => {
  for (const [code, status] of [["INSUFFICIENT_CREDITS", 402], ["DUPLICATE_REQUEST", 409]] as const) {
    const client = clientWith([{ data: { ok: false, code, balance: 0 }, error: null }], []);
    try {
      await reserveAiCredits(client, { requestId: crypto.randomUUID(), action: "chatbot", provider: "openai", model: "x" });
      throw new Error("expected credit error");
    } catch (error) {
      assert(error instanceof AiCreditError, "expected AiCreditError");
      assert(error.code === code && error.status === status, "wrong normalized error");
      const payload = creditErrorPayload(error, "request-id");
      assert(payload.code === code && !("details" in payload), "payload leaked details");
    }
  }
});

Deno.test("complete and refund use idempotent server RPCs", async () => {
  const calls: Array<Record<string, unknown>> = [];
  const client = clientWith([
    { data: { ok: true, code: "COMPLETED", balance: 24 }, error: null },
    { data: { ok: true, code: "ALREADY_REFUNDED", balance: 25 }, error: null },
  ], calls);
  const requestId = crypto.randomUUID();
  const balance = await completeAiUsage(client, requestId, { input: 10, output: 20 });
  await refundAiUsage(client, requestId);
  assert(balance === 24, "completion balance missing");
  assert(calls[0].name === "complete_ai_usage" && calls[1].name === "refund_ai_usage", "wrong RPC sequence");
});

Deno.test("CORS permits production and local development without wildcard", () => {
  const prod = corsHeaders(new Request("https://edge.test", { headers: { Origin: "https://sesiones.sypablitodp.site" } }));
  const local = corsHeaders(new Request("https://edge.test", { headers: { Origin: "http://localhost:5173" } }));
  const unknown = corsHeaders(new Request("https://edge.test", { headers: { Origin: "https://evil.example" } }));
  assert(prod["Access-Control-Allow-Origin"] === "https://sesiones.sypablitodp.site", "production CORS failed");
  assert(local["Access-Control-Allow-Origin"] === "http://localhost:5173", "localhost CORS failed");
  assert(unknown["Access-Control-Allow-Origin"] !== "*" && unknown["Access-Control-Allow-Origin"] !== "https://evil.example", "unknown origin allowed");
});

Deno.test("preflight supports SDK trace headers and records blocked origins without credentials", () => {
  const response = preflightResponse(new Request("https://edge.test/functions/v1/ai-gateway", {
    method: "OPTIONS", headers: {
      Origin: "https://sesiones.sypablitodp.site",
      "Access-Control-Request-Headers": "authorization, content-type, traceparent, tracestate, baggage, x-retry-count",
    },
  }));
  assert(response?.status === 200, "preflight response required");
  for (const header of ["traceparent", "tracestate", "baggage", "x-retry-count"]) {
    assert(response.headers.get("Access-Control-Allow-Headers")?.includes(header), "browser must be able to send SDK headers");
  }
  const previousWarn = console.warn;
  const logged: unknown[][] = [];
  console.warn = (...args: unknown[]) => { logged.push(args); };
  try {
    const blocked = preflightResponse(new Request("https://edge.test/functions/v1/ai-gateway?private=query", {
      method: "OPTIONS", headers: {
        Origin: "https://unconfigured.example", Authorization: "Bearer PRIVATE-TEST-TOKEN",
        "Access-Control-Request-Headers": "authorization, x-unsupported",
      },
    }));
    assert(blocked?.headers.get("Access-Control-Allow-Origin") !== "https://unconfigured.example", "unknown origin remains blocked");
    const diagnostic = JSON.stringify(logged);
    assert(diagnostic.includes("unconfigured.example") && diagnostic.includes("x-unsupported"), "support needs the origin and rejected header names");
    assert(!diagnostic.includes("PRIVATE-TEST-TOKEN") && !diagnostic.includes("private=query"), "diagnostic must not contain tokens or URL queries");
  } finally {
    console.warn = previousWarn;
  }
});
