const assert = require('node:assert/strict');
const PlanningView = require('../js/planning/planning-view.js');
const fixture = require('../data/pedagogy/fixtures/secondary_math_project_unit.v2.json');

const reviewed = structuredClone(fixture);
const planned = reviewed.sequence[0];
assert.deepEqual(PlanningView.sequenceAction(reviewed, planned), {
    kind: 'generate', label: 'Generar sesión'
});

const draft = structuredClone(reviewed);
draft.status = 'draft';
assert.equal(PlanningView.sequenceAction(draft, draft.sequence[0]).kind, 'draft');

const generated = structuredClone(reviewed);
generated.sequence[0].status = 'generated';
generated.sequence[0].linkedDocumentRef = {
    id: 'linked-session-01', schemaVersion: '1.0', revision: 1, status: 'draft'
};
assert.deepEqual(PlanningView.sequenceAction(generated, generated.sequence[0], () => true), {
    kind: 'open', label: 'Abrir sesión', sessionId: 'linked-session-01'
});
assert.equal(PlanningView.sequenceAction(generated, generated.sequence[0], () => false).kind, 'missing');

const standalone = { id: 'standalone-session', schemaVersion: '1.0' };
assert.equal(standalone.planning, undefined);
const linked = {
    id: 'linked-session-01', schemaVersion: '1.0',
    planning: {
        mode: 'linked', planningContainerId: reviewed.id,
        sequenceItemId: planned.id, sequenceIndex: planned.index
    }
};
assert.equal(linked.planning.planningContainerId, reviewed.id);
assert.equal(linked.planning.sequenceItemId, 'session-01');

console.log('planning-navigation.test.js: OK');
