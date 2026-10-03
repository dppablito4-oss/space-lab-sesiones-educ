const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ContextResolver = require('../js/pedagogy/context-resolver.js');
const PlanningContainerV2 = require('../js/planning/planning-container-v2.js');
const PlanningWizard = require('../js/planning/planning-wizard.js');

const ROOT = path.join(__dirname, '..');
const readJson = relPath => JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));

const catalog = readJson('data/pedagogy/catalog.json');
const catalogs = {
    pedagogicalProfiles: catalog.pedagogicalProfiles.map(e => readJson(path.join('data/pedagogy', e.path))),
    curriculumProfiles: catalog.curriculumProfiles.map(e => readJson(path.join('data/pedagogy', e.path))),
    didacticProfiles: catalog.didacticProfiles.map(e => readJson(path.join('data/pedagogy', e.path))),
    methodologyProfiles: catalog.methodologyProfiles.map(e => readJson(path.join('data/pedagogy', e.path)))
};

const grades = [1, 2, 3, 4, 5];
const socialCompetencies = [
    'constructs-historical-interpretations',
    'manages-space-environment',
    'manages-economic-resources'
];
const dpccCompetencies = [
    'builds-identity',
    'coexists-participates-democratically'
];

// 1. Matrix test: 5 grades × 3 CC.SS. competencies = 15 combinations
let resolvedSocial = 0;
for (const grade of grades) {
    const expectedCycle = grade <= 2 ? 'VI' : 'VII';
    for (const competency of socialCompetencies) {
        const result = ContextResolver.resolve({
            level: 'secondary',
            grade,
            area: 'social-sciences',
            competency,
            planningType: 'unit',
            methodology: 'project_based_learning'
        }, catalogs);

        assert.equal(result.resolved, true, `Failed resolving CC.SS. ${competency} for grade ${grade}`);
        assert.equal(result.errors.length, 0);

        const ctx = result.context.curriculumContext;
        assert.equal(ctx.cycle, expectedCycle);
        assert.equal(ctx.grade, String(grade));
        assert.equal(ctx.area.id, 'social-sciences');
        assert.equal(ctx.competency.id, competency);

        assert.ok(ctx.standard && ctx.standard.description.length > 50);
        assert.equal(ctx.standard.sourceRef, 'minedu-secondary-curriculum-2016');

        assert.ok(Array.isArray(ctx.performances) && ctx.performances.length >= 4);
        for (const perf of ctx.performances) {
            assert.ok(perf.id.startsWith(`grade-${grade}-`), `Performance ${perf.id} leaked into grade ${grade}`);
            assert.ok(perf.description && perf.description.length > 20);
        }

        const didactic = catalogs.didacticProfiles.find(d =>
            d.scope.level === 'secondary' &&
            d.scope.cycle === expectedCycle &&
            d.scope.area.id === 'social-sciences' &&
            d.scope.competency.id === competency
        );
        assert.ok(didactic, `Didactic profile missing for ${expectedCycle} / social-sciences / ${competency}`);
        assert.equal(didactic.status, 'pilot');
        assert.ok(didactic.recommendedStrategies.length >= 3);

        resolvedSocial++;
    }
}
assert.equal(resolvedSocial, 15);
console.log('  ✓ 15 combinations (5 grades × 3 competencies) verified in Ciencias Sociales matrix');

// 2. Matrix test: 5 grades × 2 DPCC competencies = 10 combinations
let resolvedDpcc = 0;
for (const grade of grades) {
    const expectedCycle = grade <= 2 ? 'VI' : 'VII';
    for (const competency of dpccCompetencies) {
        const result = ContextResolver.resolve({
            level: 'secondary',
            grade,
            area: 'dpcc',
            competency,
            planningType: 'unit',
            methodology: 'project_based_learning'
        }, catalogs);

        assert.equal(result.resolved, true, `Failed resolving DPCC ${competency} for grade ${grade}`);
        assert.equal(result.errors.length, 0);

        const ctx = result.context.curriculumContext;
        assert.equal(ctx.cycle, expectedCycle);
        assert.equal(ctx.grade, String(grade));
        assert.equal(ctx.area.id, 'dpcc');
        assert.equal(ctx.competency.id, competency);

        assert.ok(ctx.standard && ctx.standard.description.length > 50);
        assert.equal(ctx.standard.sourceRef, 'minedu-secondary-curriculum-2016');

        assert.ok(Array.isArray(ctx.performances) && ctx.performances.length >= 4);
        for (const perf of ctx.performances) {
            assert.ok(perf.id.startsWith(`grade-${grade}-`), `Performance ${perf.id} leaked into grade ${grade}`);
            assert.ok(perf.description && perf.description.length > 20);
        }

        const didactic = catalogs.didacticProfiles.find(d =>
            d.scope.level === 'secondary' &&
            d.scope.cycle === expectedCycle &&
            d.scope.area.id === 'dpcc' &&
            d.scope.competency.id === competency
        );
        assert.ok(didactic, `Didactic profile missing for ${expectedCycle} / dpcc / ${competency}`);
        assert.equal(didactic.status, 'pilot');
        assert.ok(didactic.recommendedStrategies.length >= 3);

        resolvedDpcc++;
    }
}
assert.equal(resolvedDpcc, 10);
console.log('  ✓ 10 combinations (5 grades × 2 competencies) verified in DPCC matrix');

// 3. Planning units generation for CC.SS. and DPCC
const testCases = [
    { area: 'social-sciences', grade: 2, cycle: 'VI', competency: 'constructs-historical-interpretations', title: 'Unidad Historia 2.º' },
    { area: 'social-sciences', grade: 4, cycle: 'VII', competency: 'manages-space-environment', title: 'Unidad Espacio y Ambiente 4.º' },
    { area: 'social-sciences', grade: 5, cycle: 'VII', competency: 'manages-economic-resources', title: 'Unidad Economía 5.º' },
    { area: 'dpcc', grade: 1, cycle: 'VI', competency: 'builds-identity', title: 'Unidad Identidad 1.º' },
    { area: 'dpcc', grade: 3, cycle: 'VII', competency: 'coexists-participates-democratically', title: 'Unidad Convivencia 3.º' }
];

for (const tc of testCases) {
    const draft = PlanningWizard.create('unit', `unit-test-${tc.competency}-${tc.grade}`, tc.grade);
    draft.identity.title = tc.title;
    draft.identity.duration = { value: 4, unit: 'weeks' };
    draft.significantSituation = {
        context: 'Estudiantes debaten sobre identidad, memoria ciudadana y gestión territorial.',
        problemOrOpportunity: 'Promover la convivencia democrática y el desarrollo sostenible.'
    };
    draft.drivingQuestion = '¿Cómo aportamos desde nuestra comunidad a un país más justo y sostenible?';
    draft.purpose = { summary: 'Construir ciudadanía activa, conciencia histórica y gestión ambiental responsable.' };

    const resolved = PlanningWizard.setCurriculumCompetency(draft, tc.competency, catalogs);
    assert.equal(resolved.curriculum.competency.id, tc.competency);
    assert.equal(draft.curriculumMap.length, 1);
    assert.equal(draft.curriculumMap[0].competency.id, tc.competency);

    draft.curriculumMap[0].criteria = [{ id: 'crit-soc-1', description: 'Criterio de evaluación social o cívico' }];
    draft.curriculumMap[0].expectedEvidence = [{ id: 'evid-soc-1', description: 'Ensayo reflexivo o proyecto participativo' }];
    draft.methodologyConfig.primary = { profileId: 'project-based-learning', profileVersion: '2026.1', code: 'project_based_learning' };

    PlanningWizard.addSession(draft);
    draft.sequence[0].title = 'Sesión deliberativa';
    draft.sequence[0].duration = { value: 90, unit: 'minutes' };

    const val = PlanningContainerV2.validate(draft, {
        forReview: true,
        pedagogicalProfile: resolved.pedagogical,
        methodologyProfile: resolved.methodologies.find(m => m.code === 'project_based_learning')
    });
    assert.equal(val.valid, true, `Validation failed for ${tc.title}: ${JSON.stringify(val.errors)}`);
}
console.log('  ✓ Planning units generated and validated for Historia, Geografía, Economía, Identidad y Convivencia');

// 4. Curricular isolation in buildGenerationInput
for (const comp of [...socialCompetencies, ...dpccCompetencies]) {
    const isSocial = socialCompetencies.includes(comp);
    const draft = PlanningWizard.create('unit', `unit-iso-${comp}`, '4');
    draft.identity.duration = { value: 3, unit: 'weeks' };
    draft.significantSituation = { context: 'Contexto social', problemOrOpportunity: 'Desafío social' };
    draft.drivingQuestion = '¿Pregunta social?';
    draft.purpose = { summary: 'Propósito social' };
    draft.methodologyConfig.primary = { profileId: 'project-based-learning', profileVersion: '2026.1', code: 'project_based_learning' };

    const resolved = PlanningWizard.setCurriculumCompetency(draft, comp, catalogs);
    draft.curriculumMap[0].criteria = [{ id: 'c1', description: 'Criterio' }];
    PlanningWizard.addSession(draft);

    const input = PlanningWizard.buildGenerationInput(draft, resolved);
    assert.equal(input.areas[0], isSocial ? 'Ciencias Sociales' : 'Desarrollo Personal, Ciudadanía y Cívica');
    assert.equal(input.competency.id, comp);
}
console.log('  ✓ Generation input curricular isolation verified for all 5 CC.SS. and DPCC competencies');

// 5. Linked session snapshot integrity
const unitDraft = PlanningWizard.create('unit', 'unit-history-linked-test', '4');
unitDraft.identity.title = 'Unidad 4.º Reconstrucción Nacional';
unitDraft.identity.duration = { value: 4, unit: 'weeks' };
unitDraft.significantSituation = { context: 'Guerra del Pacífico y reconstrucción', problemOrOpportunity: 'Análisis de fuentes' };
unitDraft.drivingQuestion = '¿Qué lecciones nos deja la historia republicana?';
unitDraft.purpose = { summary: 'Analizar críticamente el proceso de reconstrucción nacional' };
unitDraft.methodologyConfig.primary = { profileId: 'project-based-learning', profileVersion: '2026.1', code: 'project_based_learning' };

const resolvedHist = PlanningWizard.setCurriculumCompetency(unitDraft, 'constructs-historical-interpretations', catalogs);
unitDraft.curriculumMap[0].criteria = [{ id: 'crit-hist-4', description: 'Contrasta fuentes historiográficas' }];
PlanningWizard.addSession(unitDraft);
unitDraft.sequence[0].title = 'Sesión 1: Las consecuencias de la guerra';
unitDraft.sequence[0].duration = { value: 90, unit: 'minutes' };

const reviewedUnit = PlanningWizard.prepareReview(unitDraft, null, {
    pedagogicalProfile: resolvedHist.pedagogical,
    methodologyProfile: resolvedHist.methodologies.find(m => m.code === 'project_based_learning')
});
assert.equal(reviewedUnit.status, 'reviewed');

const link = PlanningContainerV2.createLinkedSessionLink(reviewedUnit, reviewedUnit.sequence[0].id);
assert.equal(link.mode, 'linked');
assert.equal(link.inheritedContextSnapshot.curriculumMap[0].area.id, 'social-sciences');
assert.equal(link.inheritedContextSnapshot.curriculumMap[0].competency.id, 'constructs-historical-interpretations');
assert.ok(link.inheritedContextSnapshot.curriculumMap[0].standard.description.includes('Jerarquiza múltiples causas'));
assert.ok(link.inheritedContextSnapshot.curriculumMap[0].performances.some(p => p.id === 'grade-4-interpret-sources-history'));
console.log('  ✓ Linked session snapshots preserve exact Ciencias Sociales curricular metadata');

console.log('secondary-social-sciences-dpcc-full.test.js: OK');
