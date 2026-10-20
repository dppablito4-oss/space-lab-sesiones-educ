const assert = require('node:assert/strict');
const Templates = require('../js/templates.js');
const Validator = require('../js/ai/session-validator.js');
const SessionExport = require('../js/ai/session-export.js');
const Adapter = require('../js/ai/session-adapter.js');
const LinkedSession = require('../js/planning/linked-session.js');
const fixture = require('./fixtures/secundaria-matematica-polya.v1.json');
const unitFixture = require('../data/pedagogy/fixtures/secondary_math_project_unit.v2.json');
const clone = value => JSON.parse(JSON.stringify(value));

const selected = {competencia: 'Competencia elegida', capacidad: 'Capacidad uno; Capacidad dos', desempeno: 'Desempeño elegido por el docente', methodology: 'polya'};
const incomplete = clone(fixture);
delete incomplete.proposito.desempeno;
const repaired = Adapter.adaptLegacyToV1(incomplete, selected).document;
assert.equal(repaired.proposito.desempeno, selected.desempeno, 'Recuperar el desempeño seleccionado cuando la IA lo omite');
assert.equal(repaired.proposito.competencia, selected.competencia, 'No reemplazar la competencia del docente');
assert.deepEqual(repaired.proposito.capacidades, ['Capacidad uno', 'Capacidad dos']);
assert.equal(repaired.metadata.methodology, 'polya');
const describedCriteria = clone(fixture);
describedCriteria.listaCotejo = {alumnos: [], criterios: [{descripcion: 'Explica y verifica el resultado'}]};
assert.deepEqual(Adapter.adaptLegacyToV1(describedCriteria).document.listaCotejo.criterios, ['Explica y verifica el resultado']);
assert.deepEqual(SessionExport.buildCanonicalPayload(describedCriteria).listaCotejo.criterios, ['Explica y verifica el resultado']);

const document = clone(fixture);
for (const moment of Object.values(document.momentos)) {
    for (const process of moment.procesos) {
        process.contenido.value += '<p>Los estudiantes registran sus estrategias en la ficha y contrastan su respuesta con los criterios de evaluación del aula.</p>';
    }
}

assert.equal(Validator.validateGeneratedContent(document).valid, true, 'El ejemplo completo debe superar la calidad de generación');
const wrongOpening = clone(document);
wrongOpening.momentos.inicio.procesos[0].id = 'actividad_generica';
assert.equal(Validator.validateGeneratedContent(wrongOpening).valid, false, 'Cuatro bloques genéricos no sustituyen la motivación');
assert.equal(Validator.validate(wrongOpening).valid, true, 'Las sesiones antiguas o importadas siguen siendo editables');
const wrongClosing = clone(document);
wrongClosing.momentos.cierre.procesos[0].id = 'actividad_generica';
assert.equal(Validator.validateGeneratedContent(wrongClosing).valid, false, 'El cierre requiere metacognición explícita');
const wrongTime = clone(document);
wrongTime.metadata.duracionMinutos = 45;
assert.equal(Validator.validateGeneratedContent(wrongTime).valid, false, 'La secuencia debe respetar la duración solicitada');
const wrongMethod = clone(document);
wrongMethod.momentos.desarrollo.procesos[3].id = 'actividad_generica';
assert.equal(Validator.validateGeneratedContent(wrongMethod, {methodology: 'polya'}).valid, false, 'No omitir formalización en una sesión Polya');
assert.equal(Validator.validateGeneratedContent(document, {methodology: 'project_based_learning', area: 'Matemática', inheritedContextSnapshot: {}}).valid, true, 'El proyecto conserva la didáctica matemática');
document.metadata.methodology = 'polya';
assert.equal(SessionExport.buildCanonicalPayload(document).metadata.methodology, 'polya', 'Conservar el método al guardar/exportar');

const varied = clone(document);
varied.momentos.inicio.procesos[0].id = 'reto_inicial';
varied.momentos.inicio.procesos[0].titulo = 'Motivación: exploramos el mercado';
varied.momentos.desarrollo.procesos[0].titulo = 'Familiarización: analizamos los precios';
varied.momentos.cierre.procesos[0].titulo = 'Metacognición: explicamos lo aprendido';
for (const moment of Object.values(varied.momentos)) moment.procesos.reverse();
const original = JSON.stringify(varied);
for (const template of ['estandar', 'inicial', 'laboratorio', 'refuerzo']) {
    const html = Templates.render(template, varied, false);
    for (const title of ['Motivación: exploramos el mercado', 'Familiarización: analizamos los precios', 'Metacognición: explicamos lo aprendido']) {
        assert.ok(html.includes(title), `${template} conserva el título «${title}»`);
    }
    assert.ok(html.indexOf('Motivación: exploramos el mercado') < html.indexOf('Saberes previos'), `${template} respeta orden del inicio`);
    assert.ok(html.indexOf('Familiarización: analizamos los precios') < html.indexOf('Búsqueda y ejecución de estrategias'), `${template} respeta orden del método`);
    assert.ok(!html.includes('Motivación (5 min)'), 'No inventar tiempos parciales ajenos al documento');
}
assert.equal(JSON.stringify(varied), original, 'Renderizar no modifica los procesos guardados');

for (const planningType of ['unit', 'learning_experience']) {
    const container = clone(unitFixture);
    container.identity.planningType = planningType;
    const item = container.sequence.find(entry => entry.type === 'session' && entry.status === 'planned');
    const generation = LinkedSession.buildGenerationMetadata(container, item.id, '2026-10-20T22:00:00.000Z');
    const linked = LinkedSession.attachGeneratedSession({ ...clone(varied), id: `session-${planningType}` }, generation.link);
    const payload = SessionExport.buildCanonicalPayload(linked);
    assert.deepEqual(payload.momentos, varied.momentos, `${planningType} exporta los mismos procesos que una sesión individual`);
    const html = Templates.render('estandar', linked, false);
    assert.ok(html.includes('Motivación: exploramos el mercado') && html.includes('Familiarización: analizamos los precios'), `${planningType} mantiene la secuencia completa`);
}
console.log('session-structure.test.js: OK (secuencia, métodos, tiempos, unidades y experiencias)');
