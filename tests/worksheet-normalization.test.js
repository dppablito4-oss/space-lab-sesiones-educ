const assert = require('node:assert/strict');
const Adapter = require('../js/ai/session-adapter.js');
const fixture = structuredClone(require('./fixtures/secundaria-matematica-polya.v1.json'));
fixture.fichaTrabajo = {
    titulo: 'Investigamos el agua',
    instrucciones: 'Registren datos reales.',
    secciones: [{ nombre: 'Mediciones', campos: ['Calcula $\\frac{3}{4}$ litros.', '<script>unsafe</script>'] }]
};
const result = Adapter.adaptLegacyToV1(fixture).document.fichaTrabajo;
assert.equal(result.indicaciones, 'Registren datos reales.');
assert.match(result.actividades, /Mediciones/);
assert.ok(result.actividades.includes('$\\frac{3}{4}$'));
assert.ok(result.actividades.includes('&lt;script&gt;'));
assert.ok(!result.actividades.includes('<script>'));
console.log('worksheet-normalization.test.js: OK');
