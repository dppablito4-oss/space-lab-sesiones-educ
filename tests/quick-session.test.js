const assert = require('node:assert/strict');
const fs = require('node:fs');
const model = require('../js/components/quick-session-model.js');
const base = {nivel:'INICIAL', grado:'5 años', area:'Matemática', titulo:'Contamos semillas', duracion:'45 min'};
assert.deepEqual(model.validate(base), []);
assert.deepEqual(model.validate({...base,nivel:'PRIMARIA',grado:'2°'}), []);
for (const [nivel, grado] of [['INICIAL','2°'], ['PRIMARIA','5 años'], ['SECUNDARIA','6°']]) {
    assert.ok(model.validate({...base,nivel,grado}).some(e => e.id === 'input-grado'));
}
for (const duracion of ['', '0', '-20', '1 hora', '90abc']) assert.ok(model.validate({...base,duracion}).some(e => e.id === 'input-duracion'));
assert.deepEqual(model.grades('PRIMARIA'), ['1°','2°','3°','4°','5°','6°']);
assert.match(model.coherence(base, []).warnings.join(' '), /No hay cobertura curricular/);
const p = JSON.parse(fs.readFileSync('data/pedagogy/curriculum/secondary/cycle-vi/mathematics/quantity.json'));
const coherent = {...base,competencia:p.competency.officialName,capacidad:p.capacities[0].officialName,desempeno:'Seleccionado por el docente',criterio:'Explica su estrategia'};
assert.equal(model.coherence(coherent,[p]).matching.length,1);
assert.ok(!model.coherence(coherent,[p]).warnings.some(w => w.includes('capacidades:')));
assert.ok(model.coherence({...coherent,capacidad:'Capacidad no registrada'},[p]).warnings.some(w => w.includes('capacidades:')));
assert.ok(model.coherence(coherent,[p]).warnings.some(w => w.includes('piloto')));
console.log('quick-session.test.js: OK');
