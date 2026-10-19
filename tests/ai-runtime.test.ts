import { aiAvailabilityResponse, fetchWithTimeout, gatewayAttemptTimeoutMs, isAiTimeout, providerRequestTimeoutMs, providerTimeoutMs } from "../supabase/functions/_shared/ai-runtime.ts";
import { providerTimeoutResponse } from "../supabase/functions/_shared/ai-errors.ts";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

Deno.test("global and provider switches reject direct calls before spending credits", async () => {
  const req = new Request("https://example.test", { method: "POST" });
  for (const provider of ["openai", "gemini", "deepseek"]) {
    const global = aiAvailabilityResponse(req, provider, name => name === "AI_GLOBAL_ENABLED" ? "false" : undefined);
    assert(global?.status === 503, "global switch must cover every provider");
    assert((await global.json()).code === "AI_DISABLED", "public global error");
    const disabled = aiAvailabilityResponse(req, provider, name => name === `PROVIDER_${provider.toUpperCase()}_ENABLED` ? "false" : undefined);
    assert(disabled?.status === 503, "direct disabled-provider call must be rejected");
    assert(aiAvailabilityResponse(req, provider, () => undefined) === null, "enabled default");
  }
});

Deno.test("provider deadline is bounded and a stalled request is aborted", async () => {
  assert(providerTimeoutMs(() => undefined) === 45000, "default deadline");
  assert(providerTimeoutMs(() => "60000") === 60000, "configured deadline");
  for (const invalid of ["NaN", "0", "-1", "9999999"]) {
    assert(providerTimeoutMs(() => invalid) === 45000, "invalid config must not remove the deadline");
  }
  let aborted = false;
  const stalled: typeof fetch = (_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => { aborted = true; reject(init.signal?.reason); }, { once: true });
  });
  try {
    await fetchWithTimeout("https://example.test", { method: "POST" }, 5, stalled);
    throw new Error("request did not time out");
  } catch (error) {
    assert(aborted && error instanceof DOMException && error.name === "TimeoutError", "must abort the actual request");
  }
});

Deno.test("document generation has a bounded longer deadline and fallback shares the request budget", () => {
  const empty = () => undefined;
  assert(providerTimeoutMs(empty, "generate_session") === 90000, "full sessions need more time than short refinements");
  assert(providerTimeoutMs(empty, "planning.map.generate") === 90000, "planning document deadline");
  assert(providerTimeoutMs(empty, "refine_text") === 45000, "short actions retain their deadline");
  assert(providerTimeoutMs(() => "999999", "generate_session") === 90000, "a setting cannot remove the bound");
  assert(gatewayAttemptTimeoutMs("generate_session", 0, empty) === 90000, "primary generation budget");
  assert(gatewayAttemptTimeoutMs("generate_session", 90000, empty) === 25000, "fallback cannot restart a full generation budget");
  assert(gatewayAttemptTimeoutMs("generate_session", 114001, empty) === null, "leave room for accounting and a response");
  const request = (cap: string) => new Request("https://example.test", { headers: { "X-AI-Timeout-Ms": cap } });
  assert(providerRequestTimeoutMs(request("25000"), "generate_session", empty) === 25000, "router honors the remaining budget");
  assert(providerRequestTimeoutMs(request("999999"), "generate_session", empty) === 90000, "caller cannot extend a provider deadline");
  assert(providerRequestTimeoutMs(request("NaN"), "generate_session", empty) === 90000, "invalid cap cannot disable timeout");
});

Deno.test("timeout responses remain readable by the browser and distinguish deadline from other failures", async () => {
  assert(isAiTimeout(new DOMException("Expired", "TimeoutError")), "recognize native fetch timeout");
  assert(!isAiTimeout(new Error("Bad JSON")), "other errors keep their own classification");
  const req = new Request("https://example.test", { headers: { Origin: "http://localhost:5500" } });
  const response = providerTimeoutResponse(req, "request-test");
  assert(response.status === 504, "timeout status");
  assert(response.headers.get("Access-Control-Allow-Origin") === "http://localhost:5500", "error must retain CORS");
  const body = await response.json();
  assert(body.code === "AI_PROVIDER_TIMEOUT" && body.requestId === "request-test", "support can distinguish and trace timeout failures");
});
