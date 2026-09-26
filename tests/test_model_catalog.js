const assert = require('node:assert/strict');
const fs = require('node:fs');

// Cargar y evaluar model-catalog transpiled o como módulo JS
const source = fs.readFileSync('supabase/functions/_shared/model-catalog.ts', 'utf8')
  // Quitar anotaciones de tipos de TypeScript para evaluarlo en Node.js
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

console.log('=== TEST MODEL CATALOG & COST CALCULATION ===');

// 1. Test resolución de alias
assert.equal(resolveApiModel('gpt-6-luna'), 'gpt-4o-mini');
assert.equal(resolveApiModel('gpt-6-astra'), 'gpt-4o');
assert.equal(resolveApiModel('gemini-2.5-flash'), 'gemini-2.0-flash');
assert.equal(resolveApiModel('deepseek-v3'), 'deepseek-chat');
assert.equal(resolveApiModel('automatic'), 'gpt-4o-mini');
assert.equal(resolveApiModel('max_quality'), 'gpt-4o');
console.log('  ✓ Resolución de alias y modos OK');

// 2. Test cálculo de costo en USD
// gpt-4o-mini: input 0.15/M, output 0.60/M
// 10,000 input tokens = $0.0015
// 2,000 output tokens = $0.0012
// Total = $0.002700
const costMini = calculateProviderCostUsd('gpt-4o-mini', 10000, 2000);
assert.equal(costMini, 0.0027);

// gpt-4o: input 2.50/M, output 10.00/M
// 10,000 input = $0.025
// 2,000 output = $0.020
// Total = $0.045
const cost4o = calculateProviderCostUsd('gpt-4o', 10000, 2000);
assert.equal(cost4o, 0.045);

console.log('  ✓ Cálculo de costo exacto en USD OK');
console.log('>>> TODOS LOS TESTS DE MODEL CATALOG PASARON EXITOSAMENTE <<<');
