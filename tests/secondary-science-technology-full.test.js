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
const scienceCompetencies = [
    'inquires-scientific-methods',
    'explains-physical-world',
    'designs-technological-solutions'
];

// 1. Matrix test: 5 grades × 3 competencies = 15 combinations
let resolvedCount = 0;
for (const grade of grades) {
    const expectedCycle = grade <= 2 ? 'VI' : 'VII';
    for (const competency of scienceCompetencies) {
        const result = ContextResolver.resolve({
            level: 'secondary',
            grade,
            area: 'science-technology',
            competency,
            planningType: 'unit',
            methodology: 'project_based_learning'
        }, catalogs);

        assert.equal(result.resolved, true, `Failed resolving Ciencia y Tecnología ${competency} for grade ${grade}`);
        assert.equal(result.errors.length, 0);

        const ctx = result.context.curriculumContext;
        assert.equal(ctx.cycle, expectedCycle, `Expected cycle ${expectedCycle} for grade ${grade}`);
        assert.equal(ctx.grade, String(grade));
        assert.equal(ctx.area.id, 'science-technology');
        assert.equal(ctx.competency.id, competency);

        // Standard verification
        assert.ok(ctx.standard && ctx.standard.description.length > 50, 'Standard description missing');
        assert.equal(ctx.standard.sourceRef, 'minedu-secondary-curriculum-2016');

        // Performances verification: must belong strictly to this grade
        assert.ok(Array.isArray(ctx.performances) && ctx.performances.length >= 4, `Performances missing for grade ${grade}`);
        for (const perf of ctx.performances) {
            assert.ok(perf.id.startsWith(`grade-${grade}-`), `Performance ${perf.id} leaked into grade ${grade}`);
            assert.ok(perf.description && perf.description.length > 20);
        }

        // Didactic profile verification
        const didactic = catalogs.didacticProfiles.find(d =>
            d.scope.level === 'secondary' &&
            d.scope.cycle === expectedCycle &&
            d.scope.area.id === 'science-technology' &&
            d.scope.competency.id === competency
        );
        assert.ok(didactic, `Didactic profile missing for ${expectedCycle} / science-technology / ${competency}`);
        assert.equal(didactic.status, 'pilot');
        assert.ok(didactic.approach.includes('Indagación') || didactic.approach.includes('Diseño'));
        assert.ok(didactic.recommendedStrategies.length >= 3);

        resolvedCount++;
    }
}
assert.equal(resolvedCount, 15, 'Must resolve exactly 15 combinations (5 grades × 3 competencies)');
console.log('  ✓ 15 combinations (5 grades × 3 competencies) verified in Ciencia y Tecnología matrix');

// 2. No cross-competency or cross-area fallback: missing competency profile must fail
const missingResult = ContextResolver.resolve({
    level: 'secondary',
    grade: 3,
    area: 'science-technology',
    competency: 'non-existent-science-competency',
    planningType: 'unit',
    methodology: 'project_based_learning'
}, catalogs);
assert.equal(missingResult.resolved, false);
assert.ok(missingResult.errors.some(e => e.code === 'curriculum_profile_not_found'));
assert.ok(missingResult.errors.some(e => e.code === 'didactic_profile_not_found'));
console.log('  ✓ Missing competency profile rejects without fallback');

// 3. Create Planning units for each of the 3 Ciencia y Tecnología competencies
const testCases = [
    { grade: 1, cycle: 'VI', competency: 'inquires-scientific-methods', title: 'Unidad Indagación 1.º' },
    { grade: 3, cycle: 'VII', competency: 'explains-physical-world', title: 'Unidad Explica Mundo Físico 3.º' },
    { grade: 5, cycle: 'VII', competency: 'designs-technological-solutions', title: 'Unidad Soluciones Tecnológicas 5.º' }
];

for (const tc of testCases) {
    const draft = PlanningWizard.create('unit', `unit-cyt-${tc.competency}-${tc.grade}`, tc.grade);
    draft.identity.title = tc.title;
    draft.identity.duration = { value: 4, unit: 'weeks' };
    draft.significantSituation = {
        context: 'Estudiantes investigan el impacto de la contaminación del agua en los ecosistemas locales.',
        problemOrOpportunity: 'Diseñar alternativas científicas y tecnológicas para mitigar la polución.'
    };
    draft.drivingQuestion = '¿Cómo podemos aplicar el método científico o diseñar prototipos para descontaminar el agua?';
    draft.purpose = { summary: 'Construir conocimientos científicos y proponer soluciones tecnológicas contextualizadas.' };

    const resolved = PlanningWizard.setCurriculumCompetency(draft, tc.competency, catalogs);
    assert.equal(resolved.curriculum.competency.id, tc.competency);
    assert.equal(draft.curriculumMap.length, 1);
    assert.equal(draft.curriculumMap[0].competency.id, tc.competency);

    draft.curriculumMap[0].criteria = [
        { id: 'crit-cyt-1', description: 'Criterio científico o tecnológico fundamental' }
    ];
    draft.curriculumMap[0].expectedEvidence = [
        { id: 'evid-cyt-1', description: 'Informe de indagación o prototipo funcional' }
    ];

    draft.methodologyConfig.primary = {
        profileId: 'problem-based-learning',
        profileVersion: '2026.1',
        code: 'problem_based_learning'
    };

    PlanningWizard.addSession(draft);
    draft.sequence[0].title = 'Sesión diagnóstica e indagatoria';
    draft.sequence[0].duration = { value: 90, unit: 'minutes' };

    const val = PlanningContainerV2.validate(draft, {
        forReview: true,
        pedagogicalProfile: resolved.pedagogical,
        methodologyProfile: resolved.methodologies.find(m => m.code === 'problem_based_learning')
    });
    assert.equal(val.valid, true, `Validation failed for ${tc.title}: ${JSON.stringify(val.errors)}`);
}
console.log('  ✓ Planning units generated and validated for Indagación, Explica y Diseña');

// 4. Curricular isolation in buildGenerationInput
for (const comp of scienceCompetencies) {
    const draft = PlanningWizard.create('unit', `unit-iso-${comp}`, '4');
    draft.identity.duration = { value: 3, unit: 'weeks' };
    draft.significantSituation = { context: 'Contexto de prueba CyT', problemOrOpportunity: 'Desafío de prueba CyT' };
    draft.drivingQuestion = '¿Pregunta de prueba CyT?';
    draft.purpose = { summary: 'Propósito de prueba CyT' };
    draft.methodologyConfig.primary = { profileId: 'problem-based-learning', profileVersion: '2026.1', code: 'problem_based_learning' };

    const resolved = PlanningWizard.setCurriculumCompetency(draft, comp, catalogs);
    draft.curriculumMap[0].criteria = [{ id: 'c1', description: 'Criterio' }];
    PlanningWizard.addSession(draft);

    const input = PlanningWizard.buildGenerationInput(draft, resolved);
    assert.equal(input.areas[0], 'Ciencia y Tecnología');
    assert.equal(input.competency.id, comp);

    // Other competencies must NOT be present in capacities or performances
    const otherCompetencies = scienceCompetencies.filter(c => c !== comp);
    for (const other of otherCompetencies) {
        const otherCurriculum = catalogs.curriculumProfiles.find(p => p.scope.cycle === 'VII' && p.competency.id === other);
        if (otherCurriculum) {
            for (const otherCap of otherCurriculum.capacities) {
                assert.ok(!input.capacities.some(c => c.id === otherCap.id),
                    `Capacity ${otherCap.id} leaked into ${comp}`);
            }
        }
    }
}
console.log('  ✓ Generation input curricular isolation verified for all 3 Ciencia y Tecnología competencies');

// 5. Linked session snapshot integrity
const unitDraft = PlanningWizard.create('unit', 'unit-cyt-linked-test', '4');
unitDraft.identity.title = 'Unidad 4.º Genética y Biotecnología';
unitDraft.identity.duration = { value: 4, unit: 'weeks' };
unitDraft.significantSituation = { context: 'Debate sobre transgénicos', problemOrOpportunity: 'Toma de postura informada' };
unitDraft.drivingQuestion = '¿Cuáles son las implicancias de la edición genética?';
unitDraft.purpose = { summary: 'Comprender la función del ADN y argumentar sobre biotecnología' };
unitDraft.methodologyConfig.primary = { profileId: 'problem-based-learning', profileVersion: '2026.1', code: 'problem_based_learning' };

const resolvedExplain = PlanningWizard.setCurriculumCompetency(unitDraft, 'explains-physical-world', catalogs);
unitDraft.curriculumMap[0].criteria = [{ id: 'crit-gen-4', description: 'Explica la función de los genes y evalúa impactos' }];
PlanningWizard.addSession(unitDraft);
unitDraft.sequence[0].title = 'Sesión 1: Estructura del ADN y replicación celular';
unitDraft.sequence[0].duration = { value: 90, unit: 'minutes' };

const reviewedUnit = PlanningWizard.prepareReview(unitDraft, null, {
    pedagogicalProfile: resolvedExplain.pedagogical,
    methodologyProfile: resolvedExplain.methodologies.find(m => m.code === 'problem_based_learning')
});
assert.equal(reviewedUnit.status, 'reviewed');

const link = PlanningContainerV2.createLinkedSessionLink(reviewedUnit, reviewedUnit.sequence[0].id);
assert.equal(link.mode, 'linked');
assert.equal(link.inheritedContextSnapshot.curriculumMap[0].area.id, 'science-technology');
assert.equal(link.inheritedContextSnapshot.curriculumMap[0].competency.id, 'explains-physical-world');
assert.ok(link.inheritedContextSnapshot.curriculumMap[0].standard.description.includes('información genética'));
assert.ok(link.inheritedContextSnapshot.curriculumMap[0].performances.some(p => p.id === 'grade-4-explain-genetics'));
console.log('  ✓ Linked session snapshots preserve exact Ciencia y Tecnología curricular metadata');

console.log('secondary-science-technology-full.test.js: OK');
