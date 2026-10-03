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
const communicationCompetencies = [
    'communicates-orally',
    'reads-texts',
    'writes-texts'
];

// 1. Matrix test: 5 grades × 3 competencies = 15 combinations
let resolvedCount = 0;
for (const grade of grades) {
    const expectedCycle = grade <= 2 ? 'VI' : 'VII';
    for (const competency of communicationCompetencies) {
        const result = ContextResolver.resolve({
            level: 'secondary',
            grade,
            area: 'communication',
            competency,
            planningType: 'unit',
            methodology: 'project_based_learning'
        }, catalogs);

        assert.equal(result.resolved, true, `Failed resolving Comunicación ${competency} for grade ${grade}`);
        assert.equal(result.errors.length, 0);

        const ctx = result.context.curriculumContext;
        assert.equal(ctx.cycle, expectedCycle, `Expected cycle ${expectedCycle} for grade ${grade}`);
        assert.equal(ctx.grade, String(grade));
        assert.equal(ctx.area.id, 'communication');
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
            d.scope.area.id === 'communication' &&
            d.scope.competency.id === competency
        );
        assert.ok(didactic, `Didactic profile missing for ${expectedCycle} / communication / ${competency}`);
        assert.equal(didactic.status, 'pilot');
        assert.equal(didactic.approach, 'Enfoque comunicativo');
        assert.ok(didactic.recommendedStrategies.length >= 3);

        resolvedCount++;
    }
}
assert.equal(resolvedCount, 15, 'Must resolve exactly 15 combinations (5 grades × 3 competencies)');
console.log('  ✓ 15 combinations (5 grades × 3 competencies) verified in Comunicación matrix');

// 2. No cross-competency or cross-area fallback: missing competency profile must fail
const missingResult = ContextResolver.resolve({
    level: 'secondary',
    grade: 3,
    area: 'communication',
    competency: 'non-existent-communication-competency',
    planningType: 'unit',
    methodology: 'project_based_learning'
}, catalogs);
assert.equal(missingResult.resolved, false);
assert.ok(missingResult.errors.some(e => e.code === 'curriculum_profile_not_found'));
assert.ok(missingResult.errors.some(e => e.code === 'didactic_profile_not_found'));
console.log('  ✓ Missing competency profile rejects without fallback');

// 3. Create Planning units for each of the 3 Comunicación competencies
const testCases = [
    { grade: 1, cycle: 'VI', competency: 'communicates-orally', title: 'Unidad Oral 1.º' },
    { grade: 3, cycle: 'VII', competency: 'reads-texts', title: 'Unidad Lectura 3.º' },
    { grade: 5, cycle: 'VII', competency: 'writes-texts', title: 'Unidad Escritura 5.º' }
];

for (const tc of testCases) {
    const draft = PlanningWizard.create('unit', `unit-com-${tc.competency}-${tc.grade}`, tc.grade);
    draft.identity.title = tc.title;
    draft.identity.duration = { value: 4, unit: 'weeks' };
    draft.significantSituation = {
        context: 'Estudiantes dialogan y analizan problemáticas de su localidad.',
        problemOrOpportunity: 'Desarrollar habilidades comunicativas y de pensamiento crítico.'
    };
    draft.drivingQuestion = '¿De qué manera podemos hacer escuchar nuestra voz fundamentada?';
    draft.purpose = { summary: 'Promover el pensamiento crítico y la deliberación fundamentada.' };

    const resolved = PlanningWizard.setCurriculumCompetency(draft, tc.competency, catalogs);
    assert.equal(resolved.curriculum.competency.id, tc.competency);
    assert.equal(draft.curriculumMap.length, 1);
    assert.equal(draft.curriculumMap[0].competency.id, tc.competency);

    draft.curriculumMap[0].criteria = [
        { id: 'crit-com-1', description: 'Criterio comunicativo fundamental' }
    ];
    draft.curriculumMap[0].expectedEvidence = [
        { id: 'evid-com-1', description: 'Evidencia comunicativa observable' }
    ];

    draft.methodologyConfig.primary = {
        profileId: 'project-based-learning',
        profileVersion: '2026.1',
        code: 'project_based_learning'
    };

    PlanningWizard.addSession(draft);
    draft.sequence[0].title = 'Sesión diagnóstica de comunicación';
    draft.sequence[0].duration = { value: 90, unit: 'minutes' };

    const val = PlanningContainerV2.validate(draft, {
        forReview: true,
        pedagogicalProfile: resolved.pedagogical,
        methodologyProfile: resolved.methodologies.find(m => m.code === 'project_based_learning')
    });
    assert.equal(val.valid, true, `Validation failed for ${tc.title}: ${JSON.stringify(val.errors)}`);
}
console.log('  ✓ Planning units generated and validated for Oral, Lectura and Escritura');

// 4. Curricular isolation in buildGenerationInput
for (const comp of communicationCompetencies) {
    const draft = PlanningWizard.create('unit', `unit-iso-${comp}`, '4');
    draft.identity.duration = { value: 3, unit: 'weeks' };
    draft.significantSituation = { context: 'Contexto de prueba', problemOrOpportunity: 'Desafío de prueba' };
    draft.drivingQuestion = '¿Pregunta de prueba?';
    draft.purpose = { summary: 'Propósito de prueba' };
    draft.methodologyConfig.primary = { profileId: 'project-based-learning', profileVersion: '2026.1', code: 'project_based_learning' };

    const resolved = PlanningWizard.setCurriculumCompetency(draft, comp, catalogs);
    draft.curriculumMap[0].criteria = [{ id: 'c1', description: 'Criterio' }];
    PlanningWizard.addSession(draft);

    const input = PlanningWizard.buildGenerationInput(draft, resolved);
    assert.equal(input.areas[0], 'Comunicación');
    assert.equal(input.competency.id, comp);

    // Other competencies must NOT be present in capacities or performances
    const otherCompetencies = communicationCompetencies.filter(c => c !== comp);
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
console.log('  ✓ Generation input curricular isolation verified for all 3 Comunicación competencies');

// 5. Linked session snapshot integrity
const unitDraft = PlanningWizard.create('unit', 'unit-com-linked-test', '4');
unitDraft.identity.title = 'Unidad 4.º Lectura Crítica';
unitDraft.identity.duration = { value: 4, unit: 'weeks' };
unitDraft.significantSituation = { context: 'Lectura de ensayos', problemOrOpportunity: 'Análisis crítico' };
unitDraft.drivingQuestion = '¿Cómo evaluar la validez de los argumentos?';
unitDraft.purpose = { summary: 'Fortalecer el juicio crítico y la comprensión de ensayos' };
unitDraft.methodologyConfig.primary = { profileId: 'project-based-learning', profileVersion: '2026.1', code: 'project_based_learning' };

const resolvedRead = PlanningWizard.setCurriculumCompetency(unitDraft, 'reads-texts', catalogs);
unitDraft.curriculumMap[0].criteria = [{ id: 'crit-reading-4', description: 'Evalúa la validez de argumentos' }];
PlanningWizard.addSession(unitDraft);
unitDraft.sequence[0].title = 'Sesión 1: Identificación de tesis y premisas';
unitDraft.sequence[0].duration = { value: 90, unit: 'minutes' };

const reviewedUnit = PlanningWizard.prepareReview(unitDraft, null, {
    pedagogicalProfile: resolvedRead.pedagogical,
    methodologyProfile: resolvedRead.methodologies.find(m => m.code === 'project_based_learning')
});
assert.equal(reviewedUnit.status, 'reviewed');

const link = PlanningContainerV2.createLinkedSessionLink(reviewedUnit, reviewedUnit.sequence[0].id);
assert.equal(link.mode, 'linked');
assert.equal(link.inheritedContextSnapshot.curriculumMap[0].area.id, 'communication');
assert.equal(link.inheritedContextSnapshot.curriculumMap[0].competency.id, 'reads-texts');
assert.ok(link.inheritedContextSnapshot.curriculumMap[0].standard.description.includes('relaciones de poder'));
assert.ok(link.inheritedContextSnapshot.curriculumMap[0].performances.some(p => p.id === 'grade-4-infer-reading'));
console.log('  ✓ Linked session snapshots preserve exact Comunicación curricular metadata');

console.log('secondary-communication-full.test.js: OK');
