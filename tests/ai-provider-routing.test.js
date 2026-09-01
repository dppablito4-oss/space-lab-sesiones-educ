const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const store = new Map();
const localStorage = {
    get length() { return store.size; },
    key(index) { return [...store.keys()][index] || null; },
    getItem(key) { return store.get(key) || null; },
    setItem(key, value) { store.set(key, String(value)); }
};

const calls = [];
const SupabaseClient = {
    client: {},
    getCurrentUser: async () => ({ id: 'test-user' }),
    invokeFunction: async (functionName, body) => {
        calls.push({ functionName, body });
        return '<li>OK</li>';
    }
};

const context = vm.createContext({
    console,
    localStorage,
    SupabaseClient,
    window: { localStorage, SupabaseClient, location: { origin: 'https://example.test' } },
    fetch: async () => {
        throw new Error('The browser must not call an AI provider directly');
    }
});

vm.runInContext(`${fs.readFileSync('js/ai-copilot.js', 'utf8')}\nglobalThis.AiCopilotForTest = AiCopilot;`, context);
const ai = context.AiCopilotForTest;

async function expectProvider(provider, expectedFunction, expectedModel) {
    calls.length = 0;
    ai.setProvider(provider);
    await ai.generateCriterios('Competencia', 'Tema', '5', 'Matemática');
    assert.equal(calls.length, 1, `${provider} should make one Edge Function request`);
    assert.equal(calls[0].functionName, expectedFunction);
    assert.equal(calls[0].body.model, expectedModel);
}

(async () => {
    await expectProvider('openai-gpt-5.4-mini', 'openai-router', 'gpt-5.4-mini');
    await expectProvider('gemini-2.5-flash', 'gemini-router', 'gemini-2.5-flash');
    await expectProvider('deepseek-v3', 'deepseek-router', 'deepseek-chat');

    const browserAiSource = ['js/ai-copilot.js', 'js/chatbot.js', 'js/pedagogy-brief.js']
        .map(file => fs.readFileSync(file, 'utf8'))
        .join('\n');
    assert.doesNotMatch(browserAiSource, /showConfigPrompt|Ingresa tu API Key/);
    assert.doesNotMatch(
        browserAiSource,
        /openrouter\.ai|api\.openai\.com|api\.deepseek\.com|generativelanguage\.googleapis\.com/,
        'AI provider endpoints must exist only inside Supabase Edge Functions'
    );

    const openaiRouterSource = fs.readFileSync('supabase/functions/openai-router/index.ts', 'utf8');
    assert.doesNotMatch(
        openaiRouterSource,
        /temperature\s*:/,
        'OpenAI models that only support the default temperature must not receive an override'
    );
    assert.doesNotMatch(browserAiSource, /consulta con DeepSeek/);
    console.log('ai-provider-routing.test.js: OK');
})().catch(error => {
    console.error(error);
    process.exit(1);
});
