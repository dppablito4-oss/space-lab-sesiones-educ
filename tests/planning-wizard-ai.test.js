const assert = require('node:assert/strict');
const Wizard = require('../js/planning/planning-wizard.js');
const Generator = require('../js/planning/planning-map-generator.js');
const fixture = require('../data/pedagogy/fixtures/secondary_math_project_unit.v2.json');
const pedagogical = require('../data/pedagogy/pedagogical/secondary-cycle-vi.json');
const didactic = require('../data/pedagogy/didactics/secondary/cycle-vi/mathematics/quantity.json');
const methodology = require('../data/pedagogy/methodologies/project_based_learning.json');

const profiles = { pedagogical, didactic, methodologies: [methodology] };
const incomplete = Wizard.create('project', 'plan-ai-incomplete');
const blocked = Wizard.generationReadiness(incomplete, profiles);
assert.equal(blocked.ready, false, 'La generación debe bloquearse sin contexto mínimo.');
assert.ok(blocked.missing.includes('duración'));
assert.ok(blocked.missing.includes('área y competencia'));
assert.ok(blocked.missing.includes('metodología'));

const draft = Wizard.create('project', 'plan-ai-ready');
draft.identity.duration = { value: 3, unit: 'weeks' };
draft.curriculumMap = structuredClone(fixture.curriculumMap);
draft.methodologyConfig.primary = {
    profileId: methodology.id,
    profileVersion: methodology.profileVersion,
    code: methodology.code
};
assert.equal(Wizard.generationReadiness(draft, profiles).ready, true);
const input = Wizard.buildGenerationInput(draft, profiles);
assert.equal(input.planningType, 'project');
assert.equal(input.areas[0], 'Matemática');
assert.equal(input.profiles.methodology.code, methodology.code);
assert.equal(Generator.validateInput(input), input, 'El wizard usa el contrato existente del generador.');
assert.equal(Wizard.hasMeaningfulManualContent(draft), false, 'El contexto técnico mínimo no cuenta como contenido manual significativo.');
draft.significantSituation.context = 'Contexto escrito por el docente.';
assert.equal(Wizard.hasMeaningfulManualContent(draft), true);

const original = structuredClone(draft);
const gatewayCalls = [];
const invoke = async (functionName, body) => {
    gatewayCalls.push({ functionName, body });
    return structuredClone(fixture);
};

(async () => {
    const first = await Wizard.generateProposal(draft, profiles, invoke);
    assert.equal(gatewayCalls[0].functionName, 'ai-gateway');
    assert.equal(gatewayCalls[0].body.action, 'planning.map.generate');
    assert.equal(gatewayCalls[0].body.quality, 'automatic');
    assert.equal(first.container.status, 'draft');
    assert.equal(draft.identity.title, original.identity.title, 'Generar no reemplaza el borrador antes de aceptar.');

    const second = await Wizard.generateProposal(draft, profiles, invoke);
    assert.notEqual(first.requestId, second.requestId, 'Regenerar debe crear una solicitud nueva.');

    const accepted = Wizard.acceptGeneratedProposal(draft, first.container);
    assert.equal(accepted.status, 'draft');
    assert.notEqual(accepted.status, 'reviewed');
    assert.equal(accepted.id, draft.id, 'Aceptar conserva la identidad del borrador actual.');
    assert.equal(accepted.revision, draft.revision, 'Aceptar no persiste ni incrementa la revisión.');

    const failedDraft = structuredClone(draft);
    await assert.rejects(
        Wizard.generateProposal(draft, profiles, async () => {
            throw Object.assign(new Error('Proveedor temporalmente no disponible.'), { code: 'PROVIDER_ERROR' });
        }),
        error => error.code === 'PROVIDER_ERROR'
    );
    assert.deepEqual(draft, failedDraft, 'Un error de generación no destruye el borrador actual.');

    const expectedMessages = {
        INVALID_INPUT: 'contexto mínimo',
        PROFILE_NOT_FOUND: 'perfil pedagógico',
        METHODOLOGY_NOT_FOUND: 'metodología',
        CURRICULUM_NOT_FOUND: 'contexto curricular',
        INVALID_PROVIDER_JSON: 'respuesta incompleta',
        INVALID_CURRICULUM_REFERENCES: 'referencias curriculares protegidas',
        INVALID_PLANNING_MAP: 'estructura pedagógica',
        ENTITLEMENT_DENIED: 'plan actual',
        QUOTA_EXCEEDED: 'cuota disponible',
        RATE_LIMITED: 'demasiadas solicitudes',
        PROVIDER_ERROR: 'proveedor de IA',
        GATEWAY_UNAVAILABLE: 'conectar con el servicio'
    };
    for (const [code, text] of Object.entries(expectedMessages)) {
        assert.match(Wizard.formatAiError({ code }), new RegExp(text, 'i'));
    }
    assert.match(Wizard.formatAiError(new Error('Failed to fetch')), /conectar con el servicio/i);
    assert.match(Wizard.formatAiError({ code: 'PLANNING_MAP_GENERATION_FAILED', message: 'Quota exceeded' }), /cuota disponible/i);
    assert.doesNotMatch(Wizard.formatAiError({ code: 'PROVIDER_ERROR' }), /\[object Object\]|stack/i);
    console.log('planning-wizard-ai.test.js: OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
