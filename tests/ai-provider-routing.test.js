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
const context = vm.createContext({
    console,
    localStorage,
    window: { localStorage, location: { origin: 'https://example.test' } },
    fetch: async (url, options) => {
        calls.push({ url, body: JSON.parse(options.body) });
        return { ok: true, json: async () => ({ choices: [{ message: { content: '<li>OK</li>' } }] }) };
    }
});

vm.runInContext(`${fs.readFileSync('js/ai-copilot.js', 'utf8')}\nglobalThis.AiCopilotForTest = AiCopilot;`, context);
const ai = context.AiCopilotForTest;

async function expectProvider(provider, expectedModel) {
    calls.length = 0;
    ai.configure({ apiKey: 'sk-or-test-key-1234567890' });
    ai.setProvider(provider);
    await ai.generateCriterios('Competencia', 'Tema', '5', 'Matemática');
    assert.equal(calls.length, 1, `${provider} should make one request`);
    assert.match(calls[0].url, /openrouter\.ai/, `${provider} should use OpenRouter for an OpenRouter key`);
    assert.equal(calls[0].body.model, expectedModel);
}

(async () => {
    await expectProvider('openai-gpt-5.4-mini', 'openai/gpt-5.4-mini');
    await expectProvider('gemini-2.5-flash', 'google/gemini-2.5-flash');
    await expectProvider('deepseek-v3', 'deepseek/deepseek-chat');
    console.log('ai-provider-routing.test.js: OK');
})().catch(error => {
    console.error(error);
    process.exit(1);
});
