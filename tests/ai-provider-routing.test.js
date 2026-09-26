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
let invokeResponse = '<li>OK</li>';
const SupabaseClient = {
    client: {},
    getCurrentUser: async () => ({ id: 'test-user' }),
    invokeFunction: async (functionName, body) => {
        calls.push({ functionName, body });
        return invokeResponse;
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
    assert.equal(calls[0].body.action, 'generate_criteria');
    assert.match(calls[0].body.requestId, /^[0-9a-f-]{36}$/i);
    assert.deepEqual(JSON.parse(JSON.stringify(calls[0].body.input)), {
        competencia: 'Competencia', tema: 'Tema', grado: '5', area: 'Matemática'
    });
    assert.equal(calls[0].body.systemPrompt, undefined);
    assert.equal(calls[0].body.prompt, undefined);
}

(async () => {
    await expectProvider('openai-gpt-6-luna', 'openai-router', 'gpt-6-luna');
    await expectProvider('openai-gpt-6-astra', 'openai-router', 'gpt-6-astra');
    await expectProvider('openai-gpt-6-sol', 'openai-router', 'gpt-6-sol');
    await expectProvider('openai-gpt-5.6-luna', 'openai-router', 'gpt-5.6-luna');
    await expectProvider('openai-gpt-5.4-mini', 'openai-router', 'gpt-5.4-mini');
    await expectProvider('gemini-2.5-flash', 'gemini-router', 'gemini-2.5-flash');
    await expectProvider('deepseek-v3', 'deepseek-router', 'deepseek-chat');

    invokeResponse = {
        schemaVersion: '1.0',
        metadata: { titulo: 'Prueba canónica' },
        momentos: {
            inicio: { tiempoMinutos: 15, procesos: [] },
            desarrollo: {
                tiempoMinutos: 65,
                procesos: [{
                    id: 'proceso_didactico',
                    orden: 1,
                    titulo: 'Desarrollo',
                    contenido: { format: 'html', value: '<p>Actividad</p>' }
                }]
            },
            cierre: { tiempoMinutos: 10, procesos: [] }
        }
    };
    const generated = await ai.generateSession({
        area: 'Matemática',
        titulo: 'Prueba canónica',
        methodology: 'polya',
        ai_provider: 'openai-gpt-5.6-luna'
    });
    assert.ok(Array.isArray(generated.momentos.desarrollo.procesos));
    assert.equal(generated.momentos.desarrollo.procesos.length, 1);
    assert.equal(generated.momentos.desarrollo.proceso_1_procesos, undefined);
    const generationCall = calls.at(-1);
    assert.equal(generationCall.body.action, 'generate_session');
    assert.equal(generationCall.body.systemPrompt, undefined);
    assert.equal(generationCall.body.prompt, undefined);
    assert.equal(generationCall.body.input.metadata.methodology, 'polya');
    assert.equal(generationCall.body.input.metadata.sourceFile, undefined);

    await ai.generateSession({
        area: 'Matemática',
        titulo: 'Situación seleccionada',
        ai_provider: 'openai-gpt-5.6-luna',
        sourceFile: {
            name: 'casos.pdf',
            type: 'application/pdf',
            textContent: '--- PÁGINA 1 --- Caso uno. --- PÁGINA 2 --- Caso dos.'
        },
        sourceInstruction: 'Toma como situación central el caso de la página 2.'
    });
    const sourceGuidanceCall = calls.at(-1);
    assert.equal(sourceGuidanceCall.body.input.metadata.sourceInstruction, 'Toma como situación central el caso de la página 2.');
    assert.equal(sourceGuidanceCall.body.input.sourceFile.name, 'casos.pdf');
    assert.match(sourceGuidanceCall.body.input.sourceFile.textContent, /PÁGINA 2/);

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
    assert.match(
        openaiRouterSource,
        /response_format\s*=\s*\{\s*type:\s*["']json_object["']\s*\}/,
        'OpenAI session generation must request JSON mode'
    );
    assert.match(
        openaiRouterSource,
        /finish_reason\s*===\s*["']length["']/,
        'Truncated OpenAI responses must be rejected before reaching the browser'
    );
    assert.doesNotMatch(
        openaiRouterSource,
        /temperature\s*:/,
        'OpenAI models that only support the default temperature must not receive an override'
    );
    assert.doesNotMatch(browserAiSource, /consulta con DeepSeek/);
    assert.doesNotMatch(browserAiSource, /systemPrompt/);
    assert.doesNotMatch(browserAiSource, /\bprompt\s*:/, 'The browser must use structured action inputs');
    for (const action of ['generate_session', 'generate_criteria', 'refine_text', 'pedagogy_brief', 'summarize_brief', 'chatbot']) {
        assert.match(browserAiSource, new RegExp(action), `Missing structured action: ${action}`);
    }
    console.log('ai-provider-routing.test.js: OK');
})().catch(error => {
    console.error(error);
    process.exit(1);
});
