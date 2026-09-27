const assert = require('node:assert/strict');
const fixture = require('../data/pedagogy/fixtures/secondary_math_project_unit.v2.json');
const sessionDocument = require('./fixtures/secundaria-matematica-polya.v1.json');
const PlanningContainerV2 = require('../js/planning/planning-container-v2.js');
const PlanningRepository = require('../js/planning/planning-repository.js');
const SessionValidator = require('../js/ai/session-validator.js');
const SessionExport = require('../js/ai/session-export.js');

const values = new Map();
global.localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
};
const PlanningLinkedSession = require('../js/planning/linked-session.js');

const draft = structuredClone(fixture);
draft.status = 'draft';
assert.throws(
    () => PlanningLinkedSession.buildGenerationMetadata(draft, 'session-01'),
    /planificación revisada/i
);

const capturedAt = '2026-09-27T20:00:00.000Z';
const prepared = PlanningLinkedSession.buildGenerationMetadata(fixture, 'session-02', capturedAt);
assert.equal(prepared.link.planningContainerId, fixture.id);
assert.equal(prepared.link.planningRevision, fixture.revision);
assert.equal(prepared.link.sequenceItemId, 'session-02');
assert.equal(prepared.link.inheritedContextSnapshot.capturedAt, capturedAt);
assert.equal(prepared.metadata.numero_sesion, '2');
assert.equal(prepared.metadata.grado, '2°');
assert.equal(prepared.metadata.titulo, 'Comparamos el costo real');
assert.equal(prepared.metadata.area, 'Matemática');
assert.match(prepared.metadata.competencia, /Resuelve problemas de cantidad/);
assert.match(prepared.metadata.capacidad, /estrategias y procedimientos/);
assert.equal(prepared.metadata.methodology, 'project_based_learning');
assert.equal(prepared.metadata.inheritedContextSnapshot.curriculumMap.length, 1);
assert.equal(prepared.metadata.inheritedContextSnapshot.precedingSequence.length, 1);
assert.equal(prepared.metadata.inheritedContextSnapshot.followingSequence.length, 1);
assert.equal(Object.isFrozen(prepared.link.inheritedContextSnapshot), true);

for (const type of ['activity', 'workshop', 'game']) {
    const ineligible = structuredClone(fixture);
    ineligible.sequence[0].type = type;
    assert.throws(() => PlanningLinkedSession.buildGenerationMetadata(ineligible, 'session-01'), /no puede generar/);
}
for (const status of ['generated', 'completed']) {
    const ineligible = structuredClone(fixture);
    ineligible.sequence[0].status = status;
    assert.throws(() => PlanningLinkedSession.buildGenerationMetadata(ineligible, 'session-01'), /no puede generar/);
}
const alreadyLinked = structuredClone(fixture);
alreadyLinked.sequence[0].linkedDocumentRef = { id: 'existing-session', schemaVersion: '1.0', revision: 1, status: 'draft' };
assert.throws(() => PlanningLinkedSession.buildGenerationMetadata(alreadyLinked, 'session-01'), /no puede generar/);

const storedSession = PlanningLinkedSession.attachGeneratedSession(
    { ...structuredClone(sessionDocument), id: 'linked-session-002', template: 'estandar' },
    prepared.link
);
assert.equal(SessionValidator.validate(storedSession).valid, true, 'SessionDocument v1 debe seguir siendo válido.');
assert.equal(storedSession.planning.sequenceItemId, 'session-02');
assert.equal(SessionExport.buildCanonicalPayload(storedSession).planning, undefined);
assert.deepEqual(
    Object.fromEntries(Object.keys(sessionDocument).map(key => [key, storedSession[key]])),
    sessionDocument,
    'El vínculo no debe modificar los campos de SessionDocument v1.'
);

const repository = PlanningRepository.create({
    validator: PlanningContainerV2,
    storage: global.localStorage,
    now: () => capturedAt
});
repository.save(structuredClone(fixture));
const updated = PlanningLinkedSession.recordGeneratedSession(prepared.link, storedSession, '2026-09-27T20:05:00.000Z');
assert.equal(updated.status, 'reviewed');
assert.equal(updated.revision, fixture.revision, 'El enlace operativo no crea una revisión pedagógica nueva.');
assert.equal(updated.sequence[1].status, 'generated');
assert.deepEqual(updated.sequence[1].linkedDocumentRef, {
    id: storedSession.id, schemaVersion: '1.0', revision: 1, status: 'draft'
});
assert.equal(repository.get(fixture.id).sequence[1].linkedDocumentRef.id, storedSession.id);
assert.equal(storedSession.planning.inheritedContextSnapshot.capturedAt, capturedAt);
const completedAfterSnapshot = structuredClone(fixture);
completedAfterSnapshot.sequence[1].status = 'completed';
repository.save(completedAfterSnapshot);
assert.throws(() => PlanningLinkedSession.recordGeneratedSession(prepared.link, storedSession), /cambió/);
assert.equal(repository.get(fixture.id).sequence[1].status, 'completed', 'No debe sobrescribir un planning que cambió.');

const standalone = PlanningContainerV2.createStandaloneLink();
assert.equal(PlanningContainerV2.validateSessionLink(standalone).valid, true);
assert.equal(standalone.inheritedContextSnapshot, null);

console.log('linked-session.test.js: OK');
