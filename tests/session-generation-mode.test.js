const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/controllers/ai-controller.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: 'ai-controller.js' });
const Generation = sandbox.window.SpaceLabAiController;

const snapshot = { schemaVersion: '2.0', identity: { title: 'Unidad vinculada' } };
const linked = { mode: 'linked', planningContainerId: 'plan-01', sequenceItemId: 'session-02', inheritedContextSnapshot: snapshot };
const standaloneLink = { mode: 'standalone', planningContainerId: null, inheritedContextSnapshot: null };

assert.equal(Generation.generationPlanningContext(null, null).link, null);
assert.equal(Generation.generationPlanningContext({ planning: standaloneLink }, null).link, null);
assert.equal(Generation.generationPlanningContext({ planning: linked }, null).link, linked);
assert.equal(Generation.generationPlanningContext({ planning: standaloneLink }, linked).link, linked);

const standaloneRequest = {
    nivel: 'SECUNDARIA', grado: '2', area: 'Matemática', titulo: 'Comparamos', unidad: 'MI UNIDAD MANUAL'
};
Object.assign(standaloneRequest, Generation.generationPlanningContext(null, null).requestMetadata);
for (const key of ['inheritedContextSnapshot', 'planningContext', 'planningContainerId', 'sequenceItemId']) {
    assert.equal(Object.hasOwn(standaloneRequest, key), false, `standalone no debe incluir ${key}`);
}

const linkedRequest = { unidad: 'Unidad vinculada', ...Generation.generationPlanningContext(null, linked).requestMetadata };
assert.equal(linkedRequest.inheritedContextSnapshot, snapshot);

console.log('session-generation-mode.test.js: OK');
