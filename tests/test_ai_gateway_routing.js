const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('supabase/functions/_shared/ai-routing.ts', 'utf8')
    .replace(/export type .*?;\n/g, '')
    .replace(/export interface [\s\S]*?\n}\n/g, '')
    .replace(/: Record<[^>]+>/g, '')
    .replace(/: AiQuality/g, '')
    .replace(/: AiProvider/g, '')
    .replace(/: AiRouteDecision/g, '')
    .replace(/: AiRoutingInput/g, '')
    .replace(/: string/g, '')
    .replace(/: boolean/g, '')
    .replace(/legacyModel\?/g, 'legacyModel')
    .replace(/: unknown/g, '')
    .replace(/ as Record<string, unknown>/g, '')
    .replace(/export /g, '');

const exportsForTest = {};
new Function(
    'exports',
    `${source}\nexports.normalizeQuality = normalizeQuality; exports.decideAiRoute = decideAiRoute; exports.fallbackRoute = fallbackRoute;`,
)(exportsForTest);

const { normalizeQuality, decideAiRoute, fallbackRoute } = exportsForTest;

assert.equal(normalizeQuality('automatic'), 'automatic');
assert.equal(normalizeQuality(undefined, 'deepseek-chat'), 'balanced');
assert.equal(normalizeQuality('client-invented-model'), 'automatic');

assert.deepEqual(
    decideAiRoute({ action: 'generate_session', quality: 'automatic', input: {} }),
    {
        quality: 'automatic', provider: 'openai', functionName: 'openai-router',
        model: 'gpt-6-luna', reason: 'automatic_default',
    },
);
assert.equal(decideAiRoute({ action: 'generate_session', quality: 'fast', input: {} }).provider, 'gemini');
assert.equal(decideAiRoute({ action: 'generate_session', quality: 'balanced', input: {} }).provider, 'deepseek');
assert.equal(decideAiRoute({ action: 'generate_session', quality: 'max_quality', input: {} }).model, 'gpt-5.6-terra');

const attachmentRoute = decideAiRoute({
    action: 'generate_session',
    quality: 'balanced',
    input: { sourceFile: { type: 'image/png', base64: 'abc' } },
});
assert.equal(attachmentRoute.provider, 'gemini');
assert.equal(attachmentRoute.reason, 'attachment_multimodal');

const pedagogyRoute = decideAiRoute({ action: 'pedagogy_brief', quality: 'automatic', input: {} });
assert.equal(pedagogyRoute.provider, 'gemini');
assert.equal(pedagogyRoute.reason, 'lightweight_pedagogy_action');

assert.equal(fallbackRoute('deepseek', 'balanced').provider, 'openai');
assert.equal(fallbackRoute('openai', 'automatic').provider, 'gemini');

const gateway = fs.readFileSync('supabase/functions/ai-gateway/index.ts', 'utf8');
assert.match(gateway, /getAuthenticatedContext/);
assert.match(gateway, /AI_GLOBAL_ENABLED/);
assert.match(gateway, /PROVIDER_\$\{provider\.toUpperCase\(\)\}_ENABLED/);
assert.match(gateway, /record_ai_route/);
assert.match(gateway, /decision\.functionName/);

console.log('test_ai_gateway_routing.js: OK');
