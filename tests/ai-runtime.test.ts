import { aiAvailabilityResponse, fetchWithTimeout, providerTimeoutMs } from "../supabase/functions/_shared/ai-runtime.ts";

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
