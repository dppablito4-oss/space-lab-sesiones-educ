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

const remainingCourses = [
    {
        areaId: 'work-education',
        areaOfficialName: 'Educación para el Trabajo',
        competencies: ['manages-entrepreneurship-projects']
    },
    {
        areaId: 'english',
        areaOfficialName: 'Inglés como Lengua Extranjera',
        competencies: [
            'communicates-orally-english',
            'reads-texts-english',
            'writes-texts-english'
        ]
    },
    {
        areaId: 'arts-culture',
        areaOfficialName: 'Arte y Cultura',
        competencies: [
            'appreciates-artistic-manifestations',
            'creates-artistic-projects'
        ]
    },
    {
        areaId: 'physical-education',
        areaOfficialName: 'Educación Física',
        competencies: [
            'moves-autonomously',
            'assumes-healthy-life',
            'interacts-sociomotor-skills'
        ]
    },
    {
        areaId: 'religious-education',
        areaOfficialName: 'Educación Religiosa',
        competencies: [
            'builds-religious-identity',
            'experiences-encounter-god'
        ]
    }
];

// 1. Matrix test: 55 combinations (5 grades × 11 competencies across 5 remaining areas)
let resolvedTotal = 0;
for (const course of remainingCourses) {
    let resolvedCourse = 0;
    for (const grade of grades) {
        const expectedCycle = grade <= 2 ? 'VI' : 'VII';
        for (const competency of course.competencies) {
            const result = ContextResolver.resolve({
                level: 'secondary',
                grade,
                area: course.areaId,
                competency,
                planningType: 'unit',
                methodology: 'project_based_learning'
            }, catalogs);

            assert.equal(result.resolved, true, `Failed resolving ${course.areaId} ${competency} for grade ${grade}: ${JSON.stringify(result.errors)}`);
            assert.equal(result.errors.length, 0);

            const ctx = result.context.curriculumContext;
            assert.equal(ctx.cycle, expectedCycle);
            assert.equal(ctx.grade, String(grade));
            assert.equal(ctx.area.id, course.areaId);
            assert.equal(ctx.area.officialName, course.areaOfficialName);
            assert.equal(ctx.competency.id, competency);

            assert.ok(ctx.standard && ctx.standard.description.length > 50);
            assert.equal(ctx.standard.sourceRef, 'minedu-secondary-curriculum-2016');

            assert.ok(Array.isArray(ctx.performances) && ctx.performances.length >= 2, `Not enough performances for ${competency} G${grade}`);
            for (const perf of ctx.performances) {
                assert.ok(perf.id.startsWith(`grade-${grade}-`), `Performance ${perf.id} leaked into grade ${grade}`);
                assert.ok(perf.description && perf.description.length > 20);
            }

            const didactic = catalogs.didacticProfiles.find(d =>
                d.scope.level === 'secondary' &&
                d.scope.cycle === expectedCycle &&
                d.scope.area.id === course.areaId &&
                d.scope.competency.id === competency
            );
            assert.ok(didactic, `Didactic profile missing for ${expectedCycle} / ${course.areaId} / ${competency}`);
            assert.equal(didactic.status, 'pilot');
            assert.ok(didactic.recommendedStrategies.length >= 3);

            resolvedCourse++;
            resolvedTotal++;
        }
    }
    console.log(`  ✓ ${course.areaOfficialName}: ${resolvedCourse} combinations (5 grades × ${course.competencies.length} comp) verified`);
}
assert.equal(resolvedTotal, 55);
console.log('  ✓ Total: 55 combinations verified across all 5 remaining secondary courses');

// 2. Planning units generation for each of the 5 remaining areas
const sampleUnits = [
    {
        area: 'work-education',
        grade: 3,
        competency: 'manages-entrepreneurship-projects',
        title: 'Unidad EPT 3.º: Modelo de Emprendimiento Sostenible',
        context: 'Estudiantes diseñan un prototipo comercial para reducir residuos sólidos en la comunidad.',
        driving: '¿Cómo podemos crear un emprendimiento rentable y ecológico en nuestro distrito?'
    },
    {
        area: 'english',
        grade: 2,
        competency: 'communicates-orally-english',
        title: 'Unidad Inglés 2.º: Global Citizens & Cultural Diversity',
        context: 'Students participate in simulated international forums to describe Peruvian customs.',
        driving: 'How can we share our cultural heritage with English speakers worldwide?'
    },
    {
        area: 'arts-culture',
        grade: 4,
        competency: 'creates-artistic-projects',
        title: 'Unidad Arte 4.º: Murales Comunitarios e Identidad',
        context: 'Estudiantes investigan lenguajes visuales tradicionales y crean murales escolares.',
        driving: '¿De qué manera el arte urbano expresa la memoria y diversidad de nuestra región?'
    },
    {
        area: 'physical-education',
        grade: 1,
        competency: 'assumes-healthy-life',
        title: 'Unidad Ed. Física 1.º: Hábitos Activos y Postura Saludable',
        context: 'Estudiantes evalúan su condición física y diseñan rutinas diarias de activación.',
        driving: '¿Cómo contribuye el ejercicio regular a nuestro bienestar físico y emocional?'
    },
    {
        area: 'religious-education',
        grade: 5,
        competency: 'experiences-encounter-god',
        title: 'Unidad Religión 5.º: Ética Social y Proyecto de Vida',
        context: 'Estudiantes deliberan sobre dilemas éticos contemporáneos y compromiso solidario.',
        driving: '¿Cómo orientamos nuestro proyecto de vida hacia el bien común y la trascendencia?'
    }
];

for (const sample of sampleUnits) {
    const draft = PlanningWizard.create('unit', `unit-test-${sample.competency}-${sample.grade}`, sample.grade);
    draft.identity.title = sample.title;
    draft.identity.duration = { value: 4, unit: 'weeks' };
    draft.significantSituation = {
        context: sample.context,
        problemOrOpportunity: 'Desarrollo de competencias y servicio solidario.'
    };
    draft.drivingQuestion = sample.driving;
    draft.purpose = { summary: 'Fortalecer aprendizajes significativos y acción comunitaria.' };

    const resolved = PlanningWizard.setCurriculumCompetency(draft, sample.competency, catalogs);
    assert.equal(resolved.curriculum.competency.id, sample.competency);
    assert.equal(draft.curriculumMap.length, 1);
    assert.equal(draft.curriculumMap[0].competency.id, sample.competency);

    draft.curriculumMap[0].criteria = [{ id: `crit-${sample.area}-1`, description: 'Criterio específico de evaluación formativa' }];
    draft.curriculumMap[0].expectedEvidence = [{ id: `evid-${sample.area}-1`, description: 'Evidencia tangible o desempeño observable' }];
    draft.methodologyConfig.primary = { profileId: 'project-based-learning', profileVersion: '2026.1', code: 'project_based_learning' };

    PlanningWizard.addSession(draft);
    draft.sequence[0].title = 'Sesión diagnóstica y formativa';
    draft.sequence[0].duration = { value: 90, unit: 'minutes' };

    const val = PlanningContainerV2.validate(draft, {
        forReview: true,
        pedagogicalProfile: resolved.pedagogical,
        methodologyProfile: resolved.methodologies.find(m => m.code === 'project_based_learning')
    });
    assert.equal(val.valid, true, `Validation failed for ${sample.title}: ${JSON.stringify(val.errors)}`);
}
console.log('  ✓ Planning units generated and validated for EPT, Inglés, Arte, Ed. Física y Religión');

// 3. Curricular isolation in buildGenerationInput across all 11 competencies
const allRemainingCompetencies = remainingCourses.flatMap(c => c.competencies.map(comp => ({ comp, areaName: c.areaOfficialName })));
for (const { comp, areaName } of allRemainingCompetencies) {
    const draft = PlanningWizard.create('unit', `unit-iso-${comp}`, '3');
    draft.identity.duration = { value: 3, unit: 'weeks' };
    draft.significantSituation = { context: 'Contexto de prueba', problemOrOpportunity: 'Desafío curricular' };
    draft.drivingQuestion = '¿Pregunta pedagógica?';
    draft.purpose = { summary: 'Propósito de aprendizaje' };
    draft.methodologyConfig.primary = { profileId: 'project-based-learning', profileVersion: '2026.1', code: 'project_based_learning' };

    const resolved = PlanningWizard.setCurriculumCompetency(draft, comp, catalogs);
    draft.curriculumMap[0].criteria = [{ id: 'c1', description: 'Criterio de aislamiento' }];
    PlanningWizard.addSession(draft);

    const input = PlanningWizard.buildGenerationInput(draft, resolved);
    assert.equal(input.areas[0], areaName, `Mismatch in area name for competency ${comp}`);
    assert.equal(input.competency.id, comp, `Mismatch in competency id for ${comp}`);
}
console.log('  ✓ Curricular isolation verified in buildGenerationInput for all 11 remaining competencies');

// 4. Linked session snapshot integrity for EPT
const eptUnitDraft = PlanningWizard.create('unit', 'unit-ept-linked-test', '3');
eptUnitDraft.identity.title = 'Unidad EPT 3.º Producción y Mercado';
eptUnitDraft.identity.duration = { value: 4, unit: 'weeks' };
eptUnitDraft.significantSituation = { context: 'Emprendimiento juvenil', problemOrOpportunity: 'Plan de negocio' };
eptUnitDraft.drivingQuestion = '¿Cómo validamos la viabilidad financiera de una idea de negocio?';
eptUnitDraft.purpose = { summary: 'Gestionar un proyecto de emprendimiento con propuesta de valor' };
eptUnitDraft.methodologyConfig.primary = { profileId: 'project-based-learning', profileVersion: '2026.1', code: 'project_based_learning' };

const resolvedEpt = PlanningWizard.setCurriculumCompetency(eptUnitDraft, 'manages-entrepreneurship-projects', catalogs);
eptUnitDraft.curriculumMap[0].criteria = [{ id: 'crit-ept-3', description: 'Formula propuestas de valor y evalúa viabilidad técnica' }];
PlanningWizard.addSession(eptUnitDraft);
eptUnitDraft.sequence[0].title = 'Sesión 1: Propuesta de Valor Canvas';
eptUnitDraft.sequence[0].duration = { value: 90, unit: 'minutes' };

const reviewedUnit = PlanningWizard.prepareReview(eptUnitDraft, null, {
    pedagogicalProfile: resolvedEpt.pedagogical,
    methodologyProfile: resolvedEpt.methodologies.find(m => m.code === 'project_based_learning')
});
assert.equal(reviewedUnit.status, 'reviewed');

const link = PlanningContainerV2.createLinkedSessionLink(reviewedUnit, reviewedUnit.sequence[0].id);
assert.equal(link.mode, 'linked');
assert.equal(link.inheritedContextSnapshot.curriculumMap[0].area.id, 'work-education');
assert.equal(link.inheritedContextSnapshot.curriculumMap[0].competency.id, 'manages-entrepreneurship-projects');
assert.ok(link.inheritedContextSnapshot.curriculumMap[0].standard.description.includes('Gestiona proyectos de emprendimiento'));
assert.ok(link.inheritedContextSnapshot.curriculumMap[0].performances.some(p => p.id === 'grade-3-value-proposal-ept'));
console.log('  ✓ Linked session snapshots preserve exact EPT curricular metadata and performances');

console.log('secondary-remaining-courses-full.test.js: OK');
