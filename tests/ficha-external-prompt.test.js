const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const listeners = new Map();
const window = {
    addEventListener: (name, callback) => listeners.set(name, callback)
};
const context = vm.createContext({ window });
vm.runInContext(fs.readFileSync('js/ficha-external-prompt.js', 'utf8'), context);

const prompt = context.window.ExternalFichaPrompt.buildPrompt({
    metadata: { titulo: 'Optimizamos el consumo de agua', grado: '3.º', nivel: 'Secundaria' },
    proposito: { competencia: 'Resuelve problemas de cantidad' },
    fichaTrabajo: {
        indicaciones: 'Calcula y compara el consumo de agua.',
        actividades: '<p>Una familia deja abierto el caño durante cinco minutos.</p>'
    }
});

assert.match(prompt, /2480 × 3508 px/);
assert.match(prompt, /Optimizamos el consumo de agua/);
assert.match(prompt, /Una familia deja abierto el caño durante cinco minutos/);
assert.match(prompt, /No inventes datos/);
console.log('ficha-external-prompt.test.js: OK');
