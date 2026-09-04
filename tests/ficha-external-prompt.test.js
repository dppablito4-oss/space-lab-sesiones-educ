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

// Test de variantes de dificultad
const promptInicio = context.window.ExternalFichaPrompt.buildPrompt({
    metadata: { titulo: 'Medimos longitudes', grado: '2°', nivel: 'Primaria' },
    proposito: { competencia: 'Resuelve problemas de forma y movimiento' }
}, { dificultad: 'inicio' });
assert.match(promptInicio, /INICIO \/ BÁSICO/);
assert.match(promptInicio, /EDUCACIÓN PRIMARIA/);

const promptExperto = context.window.ExternalFichaPrompt.buildPrompt({
    metadata: { titulo: 'Ecuaciones cuadráticas', grado: '4°', nivel: 'Secundaria' },
    proposito: { competencia: 'Resuelve problemas de regularidad' }
}, { dificultad: 'experto' });
assert.match(promptExperto, /EXPERTO \/ DESAFÍO/);
assert.match(promptExperto, /EDUCACIÓN SECUNDARIA/);

// Test de variantes de problemática
const promptAlternativa = context.window.ExternalFichaPrompt.buildPrompt({
    metadata: { titulo: 'Consumo responsable', grado: '5°', nivel: 'Primaria' },
    enfoquesTransversales: [{ nombre: 'Enfoque ambiental' }]
}, { variante: 'alternativa' });
assert.match(promptAlternativa, /SITUACIÓN PROBLEMÁTICA ALTERNATIVA/);
assert.match(promptAlternativa, /Enfoque ambiental/);

const promptRefuerzo = context.window.ExternalFichaPrompt.buildPrompt({
    metadata: { titulo: 'Los sentidos', grado: '4 años', nivel: 'Inicial' }
}, { variante: 'refuerzo' });
assert.match(promptRefuerzo, /REFUERZO ESCOLAR/);
assert.match(promptRefuerzo, /EDUCACIÓN INICIAL/);

// Test de validación cuando no hay sesión generada
assert.equal(context.window.ExternalFichaPrompt.buildPrompt(null), 'Primero genera la sesión');
assert.equal(context.window.ExternalFichaPrompt.buildPrompt({}), 'Primero genera la sesión');
assert.equal(context.window.ExternalFichaPrompt.updateApartado(null), 'Primero genera la sesión');

console.log('ficha-external-prompt.test.js: OK');


