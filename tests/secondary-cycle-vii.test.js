const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Resolver = require('../js/pedagogy/context-resolver.js');
const Wizard = require('../js/planning/planning-wizard.js');
const Generator = require('../js/planning/planning-map-generator.js');
const Core = require('../js/planning/planning-container-v2.js');
const Linked = require('../js/planning/linked-session.js');

const ROOT = path.join(__dirname, '..');
const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const catalogs = {
    pedagogicalProfiles: [
        read('data/pedagogy/pedagogical/secondary-cycle-vi.json'),
        read('data/pedagogy/pedagogical/secondary-cycle-vii.json')
    ],
    curriculumProfiles: [
        read('data/pedagogy/curriculum/secondary/cycle-vi/mathematics/quantity.json'),
        read('data/pedagogy/curriculum/secondary/cycle-vii/mathematics/quantity.json')
    ],
    didacticProfiles: [
        read('data/pedagogy/didactics/secondary/cycle-vi/mathematics/quantity.json'),
        read('data/pedagogy/didactics/secondary/cycle-vii/mathematics/quantity.json')
    ],
    methodologyProfiles: [read('data/pedagogy/methodologies/custom.json')]
};

function completeUnit(grade) {
    const draft = Wizard.create('unit', `cycle-vii-grade-${grade}`, grade);
    const profiles = Wizard.resolvePlanningProfiles({ ...draft.identity, methodology: 'custom' }, catalogs);
    draft.identity.title = `Unidad ${grade}.º`;
    draft.identity.duration = { value: 3, unit: 'weeks' };
    draft.significantSituation.context = 'La comunidad compara alternativas para tomar una decisión responsable.';
    draft.significantSituation.problemOrOpportunity = 'Se deben modelar cantidades y justificar la alternativa elegida.';
    draft.drivingQuestion = '¿Qué alternativa conviene y cómo podemos demostrarlo?';
    draft.purpose.summary = 'Resolver problemas de cantidad y sustentar decisiones.';
    draft.methodologyConfig.primary = {
        profileId: profiles.methodologies[0].id,
        profileVersion: profiles.methodologies[0].profileVersion,
        code: profiles.methodologies[0].code
    };
    draft.methodologyConfig.custom = { name: 'Resolución colaborativa', phases: [] };
    Wizard.addCurriculum(draft, profiles.didactic, profiles.curriculum);
    draft.curriculumMap[0].criteria = [{ id: `criterion-grade-${grade}`, description: 'Modela, resuelve y justifica su decisión.' }];
    Wizard.addSession(draft);
    const reviewed = Wizard.prepareReview(draft, null, {
        pedagogicalProfile: profiles.pedagogical,
        methodologyProfile: profiles.methodologies[0]
    });
    return { reviewed, profiles };
}

const performances = {};
for (const grade of ['3', '4', '5']) {
    const { reviewed } = completeUnit(grade);
    assert.equal(reviewed.identity.cycle, 'VII');
    assert.equal(reviewed.status, 'reviewed');
    assert.equal(Core.validate(reviewed, { forReview: true }).valid, true);
    performances[grade] = reviewed.curriculumMap[0].performances.map(item => item.id);
    assert.ok(performances[grade].every(id => id.startsWith(`grade-${grade}-`)));
}
assert.notDeepEqual(performances['3'], performances['4']);
assert.notDeepEqual(performances['4'], performances['5']);

const { reviewed: gradeFour, profiles: gradeFourProfiles } = completeUnit('4');
const input = Wizard.buildGenerationInput(gradeFour, gradeFourProfiles);
const request = Generator.createRequest(input, '896a0f93-1234-4abc-8def-1234567890ab');
assert.equal(request.input.cycle, 'VII');
assert.equal(request.input.grade, '4');
assert.ok(request.input.performances.every(item => item.id.startsWith('grade-4-')));
assert.doesNotMatch(JSON.stringify(request.input), /grade-(1|2|3|5)-/);

const { reviewed: gradeFive } = completeUnit('5');
const linked = Linked.buildGenerationMetadata(gradeFive, gradeFive.sequence[0].id, '2026-09-30T00:00:00.000Z');
const snapshot = linked.link.inheritedContextSnapshot;
assert.equal(snapshot.identity.level, 'secondary');
assert.equal(snapshot.identity.cycle, 'VII');
assert.equal(snapshot.identity.grade, '5');
assert.ok(snapshot.curriculumMap[0].standard.description);
assert.ok(snapshot.curriculumMap[0].performances.every(item => item.id.startsWith('grade-5-')));
assert.deepEqual(snapshot.curriculumMap[0].curricularSourceRefs, ['minedu-secondary-curriculum-2016']);

const missingCurriculum = structuredClone(catalogs);
missingCurriculum.curriculumProfiles = missingCurriculum.curriculumProfiles.filter(profile => profile.scope.cycle !== 'VII');
const unresolved = Resolver.resolve({
    level: 'secondary', grade: '4', area: 'mathematics', competency: 'solves-quantity-problems',
    planningType: 'unit', methodology: 'custom'
}, missingCurriculum);
assert.equal(unresolved.resolved, false);
assert.ok(unresolved.errors.some(error => error.code === 'curriculum_profile_not_found'));

console.log('secondary-cycle-vii.test.js: OK');
