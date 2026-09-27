const assert = require('node:assert/strict');
const PlanningView = require('../js/planning/planning-view.js');
const fixture = require('../data/pedagogy/fixtures/secondary_math_project_unit.v2.json');
const methodology = require('../data/pedagogy/methodologies/project_based_learning.json');

const draft = structuredClone(fixture);
draft.status = 'draft';
draft.revision = 4;
const draftHtml = PlanningView.render(draft, { methodologyProfile: methodology });
assert.match(draftHtml, /Unidad de aprendizaje/);
assert.match(draftHtml, /Tomamos decisiones financieras responsables/);
assert.match(draftHtml, /Estado: Borrador/);
assert.match(draftHtml, /Revisión 4/);
assert.match(draftHtml, /Secundaria · Ciclo VI · 2\.º/);

const reviewedHtml = PlanningView.render(fixture, { methodologyProfile: methodology });
assert.match(reviewedHtml, /Estado: Revisada/);
assert.match(reviewedHtml, /Revisión 1/);
assert.match(reviewedHtml, /Situación significativa/);
assert.match(reviewedHtml, /Pregunta retadora/);
assert.match(reviewedHtml, /Propósito de aprendizaje/);
assert.match(reviewedHtml, /Propósitos curriculares/);
assert.match(reviewedHtml, /Matemática/);
assert.match(reviewedHtml, /Resuelve problemas de cantidad/);
assert.match(reviewedHtml, /Traduce cantidades a expresiones numéricas/);
assert.match(reviewedHtml, /Aprendizaje Basado en Proyectos/);
assert.doesNotMatch(reviewedHtml, /project_based_learning/);
assert.match(reviewedHtml, /Guía para comparar promociones y pagos/);
assert.match(reviewedHtml, /Fase 1/);
assert.match(reviewedHtml, /Reconocemos y analizamos promociones/);
assert.match(reviewedHtml, /Semana 1/);
assert.match(reviewedHtml, /Estado: Revisada/);
assert.match(reviewedHtml, />Planeada</);

const unordered = structuredClone(fixture);
unordered.sequence.reverse();
const orderedHtml = PlanningView.render(unordered, { methodologyProfile: methodology });
assert.ok(orderedHtml.indexOf('¿Qué dicen realmente las promociones?') < orderedHtml.indexOf('Comparamos el costo real'));
assert.ok(orderedHtml.indexOf('Comparamos el costo real') < orderedHtml.indexOf('Presentamos recomendaciones responsables'));

const sparse = structuredClone(draft);
sparse.significantSituation.relevance = '';
sparse.significantSituation.studentRole = '';
sparse.significantSituation.expectedResponse = '';
sparse.finalProduct = null;
sparse.milestones = [];
sparse.sequence = [];
const sparseHtml = PlanningView.render(sparse, { methodologyProfile: methodology });
assert.doesNotMatch(sparseHtml, /Relevancia|Rol de los estudiantes|Respuesta esperada|Producto final/);
assert.doesNotMatch(sparseHtml, /undefined|null/);

for (const internalId of ['map-quantity', 'criterion-model', 'milestone-research', 'session-01']) {
    assert.doesNotMatch(reviewedHtml, new RegExp(internalId), `No debe mostrarse el ID interno ${internalId}.`);
}
assert.doesNotMatch(reviewedHtml, /Generar sesión|linkedDocumentRef|curriculumMapRefs/);
assert.match(reviewedHtml, /data-planning-view-action="edit"/);
assert.match(reviewedHtml, /data-planning-view-action="back"/);
console.log('planning-view.test.js: OK');
