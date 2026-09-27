const assert = require('node:assert/strict');
const Generator = require('../js/planning/planning-map-generator.js');
const fixture = require('../data/pedagogy/fixtures/secondary_math_project_unit.v2.json');
const pedagogical = require('../data/pedagogy/pedagogical/secondary-cycle-vi.json');
const didactic = require('../data/pedagogy/didactics/secondary/cycle-vi/mathematics/quantity.json');
const methodology = require('../data/pedagogy/methodologies/project_based_learning.json');

const REQUEST_ID = '896a0f93-1234-4abc-8def-1234567890ab';
const input = {
    planningType: 'unit', level: 'secondary', cycle: 'VI', grade: '2', areas: ['Matemática'],
    duration: { value: 3, unit: 'weeks' },
    teacherContext: fixture.administrativeContext,
    learnerContext: fixture.learnerContext,
    significantSituationInput: fixture.significantSituation,
    methodology: { code: methodology.code },
    curriculumReferences: fixture.curriculumMap,
    profiles: { pedagogical, didactic, methodology }
};

const request = Generator.createRequest(input, REQUEST_ID);
assert.equal(request.action, 'planning.map.generate');
assert.equal(request.requestId, REQUEST_ID);
assert.notEqual(request.input, input, 'the gateway request must not retain mutable input');

const parsed = Generator.parseResponse(JSON.stringify(fixture), input);
assert.equal(parsed.schemaVersion, '2.0');
assert.equal(parsed.status, 'draft', 'AI output must always start as draft');
assert.equal(parsed.revision, 1);

assert.throws(() => Generator.createRequest({ ...input, profiles: { ...input.profiles, didactic: null } }), error => error.code === 'INVALID_INPUT');
assert.throws(() => Generator.createRequest({ ...input, methodology: { code: 'missing' } }), error => error.code === 'METHODOLOGY_NOT_FOUND');
assert.throws(() => Generator.parseResponse('{broken', input), error => error.code === 'INVALID_PROVIDER_JSON');
assert.throws(() => Generator.parseResponse('```json\n{}\n```', input), error => error.code === 'INVALID_PROVIDER_JSON');

const invented = structuredClone(fixture);
invented.curriculumMap[0].competency.officialName = 'Competencia inventada';
assert.throws(() => Generator.parseResponse(invented, input), error => error.code === 'INVALID_CURRICULUM_REFERENCES');
const inventedPerformance = structuredClone(fixture);
inventedPerformance.curriculumMap[0].performances[0].description = 'Desempeño inventado';
assert.throws(() => Generator.parseResponse(inventedPerformance, input), error => error.code === 'INVALID_CURRICULUM_REFERENCES');
const incomplete = structuredClone(fixture);
incomplete.drivingQuestion = '';
assert.throws(() => Generator.parseResponse(incomplete, input), error => error.code === 'INVALID_PLANNING_MAP' && error.details.length > 0);

(async () => {
    let invocation;
    const generated = await Generator.generate(input, {
        requestId: REQUEST_ID,
        invoke: async (name, body) => { invocation = { name, body }; return JSON.stringify(fixture); }
    });
    assert.equal(invocation.name, 'ai-gateway');
    assert.equal(invocation.body.requestId, REQUEST_ID, 'idempotency key must reach the gateway');
    assert.equal(generated.container.status, 'draft');

    for (const code of ['DAILY_LIMIT_REACHED', 'ENTITLEMENT_DENIED']) {
        await assert.rejects(
            Generator.generate(input, { requestId: REQUEST_ID, invoke: async () => { throw Object.assign(new Error(code), { code }); } }),
            error => error.code === code
        );
    }
    console.log('planning-map-generation.test.js: OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
