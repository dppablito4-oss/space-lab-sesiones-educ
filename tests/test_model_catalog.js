const assert = require('node:assert/strict');
const fs = require('node:fs');

// Cargar y evaluar model-catalog transpiled o como módulo JS
const source = fs.readFileSync('supabase/functions/_shared/model-catalog.ts', 'utf8')
  .replace(/\r\n?/g, '\n')
  .replace(/export interface [\s\S]*?\n}\n/g, '')
  .replace(/: string = 0/g, ' = 0')
  .replace(/: number = 0/g, ' = 0')
  .replace(/: string/g, '')
  .replace(/: number/g, '')
  .replace(/: ModelMetadata/g, '')
  .replace(/: Record<string, ModelMetadata>/g, '')
  .replace(/: Record<string, string>/g, '')
  .replace(/export /g, '');

const evalContext = {};
const fn = new Function('exports', `${source}\nexports.resolveApiModel = resolveApiModel; exports.calculateProviderCostUsd = calculateProviderCostUsd; exports.MODEL_CATALOG = MODEL_CATALOG; exports.MODEL_ALIAS_MAP = MODEL_ALIAS_MAP;`);
fn(evalContext);

const { resolveApiModel, calculateProviderCostUsd, MODEL_CATALOG, MODEL_ALIAS_MAP } = evalContext;

console.log('=== TEST MODEL CATALOG & ACTIVE MODELS ===');

// 1. Test resolución de los modelos canónicos
assert.equal(resolveApiModel('gpt-6-luna'), 'gpt-6-luna');
assert.equal(resolveApiModel('gpt-6.1-sol'), 'gpt-6.1-sol');
assert.equal(resolveApiModel('gpt-6-sol'), 'gpt-6.1-sol');
assert.equal(resolveApiModel('gemini-2.5-flash'), 'gemini-2.5-flash');
assert.equal(resolveApiModel('deepseek-chat'), 'deepseek-chat');
assert.equal(resolveApiModel('deepseek-v3'), 'deepseek-chat');
assert.equal(resolveApiModel('deepseek-reasoner'), 'deepseek-reasoner');
assert.equal(resolveApiModel('deepseek-r1'), 'deepseek-reasoner');
console.log('  ✓ Invocación directa de los modelos canónicos OK');

// 2. Test aliases legacy y modos de calidad
assert.equal(resolveApiModel('gpt-6-astra'), 'gpt-6.1-sol');
assert.equal(resolveApiModel('gpt-5.6-terra'), 'gpt-6.1-sol');
assert.equal(resolveApiModel('gpt-5.6-luna'), 'gpt-6.1-sol');
assert.equal(resolveApiModel('gpt-5.4-mini'), 'gpt-6-luna');
assert.equal(resolveApiModel('fast'), 'gpt-6-luna');
assert.equal(resolveApiModel('max_quality'), 'gpt-6.1-sol');
assert.equal(resolveApiModel('automatic'), 'gpt-6-luna');
console.log('  ✓ Preservación de aliases y modos comerciales OK');

// 3. Test cálculo de costo en USD
// gpt-6-luna: input 0.15/M, output 0.60/M
const costLuna = calculateProviderCostUsd('gpt-6-luna', 10000, 2000);
assert.equal(costLuna, 0.0027);

// gpt-6.1-sol: input 2.00/M, output 10.00/M
const costSol = calculateProviderCostUsd('gpt-6.1-sol', 10000, 2000);
assert.equal(costSol, 0.04);

// deepseek-reasoner (DeepSeek R1): input 0.55/M, output 2.19/M
// 10,000 input = 0.0055, 2,000 output = 0.00438, total = 0.00988
const costR1 = calculateProviderCostUsd('deepseek-reasoner', 10000, 2000);
assert.equal(costR1, 0.00988);

console.log('  ✓ Cálculo de costo exacto en USD para los modelos OK');
console.log('>>> TODOS LOS TESTS DE MODEL CATALOG PASARON EXITOSAMENTE <<<');
