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
        read('data/pedagogy/curriculum/secondary/cycle-vi/mathematics/regularity.json'),
        read('data/pedagogy/curriculum/secondary/cycle-vi/mathematics/shape.json'),
        read('data/pedagogy/curriculum/secondary/cycle-vi/mathematics/data-uncertainty.json'),
        read('data/pedagogy/curriculum/secondary/cycle-vii/mathematics/quantity.json'),
        read('data/pedagogy/curriculum/secondary/cycle-vii/mathematics/regularity.json'),
        read('data/pedagogy/curriculum/secondary/cycle-vii/mathematics/shape.json'),
        read('data/pedagogy/curriculum/secondary/cycle-vii/mathematics/data-uncertainty.json')
    ],
    didacticProfiles: [
        read('data/pedagogy/didactics/secondary/cycle-vi/mathematics/quantity.json'),
        read('data/pedagogy/didactics/secondary/cycle-vi/mathematics/regularity.json'),
        read('data/pedagogy/didactics/secondary/cycle-vi/mathematics/shape.json'),
        read('data/pedagogy/didactics/secondary/cycle-vi/mathematics/data-uncertainty.json'),
        read('data/pedagogy/didactics/secondary/cycle-vii/mathematics/quantity.json'),
        read('data/pedagogy/didactics/secondary/cycle-vii/mathematics/regularity.json'),
        read('data/pedagogy/didactics/secondary/cycle-vii/mathematics/shape.json'),
        read('data/pedagogy/didactics/secondary/cycle-vii/mathematics/data-uncertainty.json')
    ],
    methodologyProfiles: [
        read('data/pedagogy/methodologies/project_based_learning.json'),
        read('data/pedagogy/methodologies/custom.json')
    ]
};

const GRADES = ['1', '2', '3', '4', '5'];
const COMPETENCIES = ['quantity', 'regularity', 'shape', 'data-uncertainty'];
const EXPECTED_CYCLE = { '1': 'VI', '2': 'VI', '3': 'VII', '4': 'VII', '5': 'VII' };
const CANONICAL_IDS = {
    quantity: 'solves-quantity-problems',
    regularity: 'solves-regularity-problems',
    shape: 'solves-shape-problems',
    'data-uncertainty': 'solves-data-uncertainty-problems'
};

// =========================================================================
// 1. Matrix test: 5 grades x 4 competencies = 20 combinations
// =========================================================================
const standardsByCycle = {};
const performancesByGradeComp = {};

for (const comp of COMPETENCIES) {
    standardsByCycle[comp] = {};
    performancesByGradeComp[comp] = {};

    for (const grade of GRADES) {
        const expectedCycle = EXPECTED_CYCLE[grade];

        // Resolve using alias
        const resAlias = Resolver.resolve({
            level: 'secondary', grade,
            area: 'mathematics', competency: comp,
            planningType: 'unit', methodology: 'project_based_learning'
        }, catalogs);

        assert.equal(resAlias.resolved, true, `Failed resolving ${grade}/${comp} via alias`);
        assert.equal(resAlias.context.curriculumContext.cycle, expectedCycle);
        assert.equal(resAlias.context.curriculumContext.grade, grade);
        assert.equal(resAlias.context.curriculumContext.area.id, 'mathematics');
        assert.equal(resAlias.context.curriculumContext.competency.id, CANONICAL_IDS[comp]);
        assert.equal(resAlias.context.curriculumContext.capacities.length, 4);

        // Resolve using canonical ID
        const resCanon = Resolver.resolve({
            level: 'secondary', grade,
            area: 'mathematics', competency: CANONICAL_IDS[comp],
            planningType: 'unit', methodology: 'project_based_learning'
        }, catalogs);

        assert.equal(resCanon.resolved, true, `Failed resolving ${grade}/${comp} via canonical ID`);
        assert.deepEqual(resAlias.context.curriculumContext, resCanon.context.curriculumContext);

        // Check standard
        const standardDesc = resAlias.context.curriculumContext.standard.description;
        assert.ok(standardDesc.length > 50, `Standard for ${grade}/${comp} must be descriptive`);
        standardsByCycle[comp][expectedCycle] = standardDesc;

        // Check performances
        const perfs = resAlias.context.curriculumContext.performances;
        assert.equal(perfs.length, 4, `Grade ${grade} competency ${comp} must have exactly 4 performances`);
        assert.ok(perfs.every(p => p.id.startsWith(`grade-${grade}-`)), `All performances must match grade-${grade}-*`);
        assert.ok(perfs.every(p => p.description && p.description.length > 30), 'Performances must be detailed');

        performancesByGradeComp[comp][grade] = perfs.map(p => p.id);
    }

    // Verify standards differ between Cycle VI and Cycle VII
    assert.notEqual(standardsByCycle[comp]['VI'], standardsByCycle[comp]['VII'], `Cycle VI and VII standards for ${comp} must differ`);

    // Verify grade-specific performances do not collide between distinct grades
    assert.notDeepEqual(performancesByGradeComp[comp]['1'], performancesByGradeComp[comp]['2']);
    assert.notDeepEqual(performancesByGradeComp[comp]['3'], performancesByGradeComp[comp]['4']);
    assert.notDeepEqual(performancesByGradeComp[comp]['4'], performancesByGradeComp[comp]['5']);
}

console.log('  ✓ 20 combinations (5 grades × 4 competencies) verified in matrix');

// =========================================================================
// 2. Strict error rejection: No fallback to quantity on missing profiles
// =========================================================================
const catalogWithoutShapeVII = structuredClone(catalogs);
catalogWithoutShapeVII.curriculumProfiles = catalogWithoutShapeVII.curriculumProfiles.filter(
    p => !(p.scope.cycle === 'VII' && p.competency.id === 'solves-shape-problems')
);

const missingShapeRes = Resolver.resolve({
    level: 'secondary', grade: '4',
    area: 'mathematics', competency: 'shape',
    planningType: 'unit', methodology: 'project_based_learning'
}, catalogWithoutShapeVII);

assert.equal(missingShapeRes.resolved, false);
assert.ok(missingShapeRes.errors.some(e => e.code === 'curriculum_profile_not_found'));
assert.equal(missingShapeRes.context, null);

console.log('  ✓ Missing competency profile rejects without fallback to quantity');

// =========================================================================
// 3. Planning Wizard end-to-end with all 4 competencies
// =========================================================================
function buildFullPlan(grade, compKey) {
    const draft = Wizard.create('unit', `unit-${compKey}-grade-${grade}`, grade);
    const compId = CANONICAL_IDS[compKey];
    const profiles = Wizard.resolvePlanningProfiles({
        ...draft.identity,
        competency: compId,
        methodology: 'custom'
    }, catalogs);

    draft.identity.title = `Unidad ${compKey} ${grade}.º`;
    draft.identity.duration = { value: 4, unit: 'weeks' };
    draft.significantSituation.context = `Contexto para ${compKey} en ${grade}.º secundaria.`;
    draft.significantSituation.problemOrOpportunity = `Desafío matemático sobre ${compKey}.`;
    draft.drivingQuestion = `¿Cómo resolver el reto con ${compKey}?`;
    draft.purpose.summary = `Desarrollar la competencia ${compKey}.`;
    draft.methodologyConfig.primary = {
        profileId: profiles.methodologies.find(m => m.code === 'custom').id,
        profileVersion: profiles.methodologies.find(m => m.code === 'custom').profileVersion,
        code: 'custom'
    };
    draft.methodologyConfig.custom = { name: 'Resolución de problemas contextualizados', phases: [] };

    Wizard.addCurriculum(draft, profiles.didactic, profiles.curriculum);
    draft.curriculumMap[0].criteria = [{ id: `crit-${compKey}-${grade}`, description: `Demuestra dominio en ${compKey}.` }];
    Wizard.addSession(draft);

    const reviewed = Wizard.prepareReview(draft, null, {
        pedagogicalProfile: profiles.pedagogical,
        methodologyProfile: profiles.methodologies.find(m => m.code === 'custom')
    });

    return { reviewed, profiles };
}

// Plan 1: Cantidad en 1.º (Ciclo VI)
const planCantidad = buildFullPlan('1', 'quantity');
assert.equal(planCantidad.reviewed.status, 'reviewed');
assert.equal(planCantidad.reviewed.identity.cycle, 'VI');
assert.equal(planCantidad.reviewed.curriculumMap[0].competency.id, CANONICAL_IDS.quantity);
assert.ok(Core.validate(planCantidad.reviewed, { forReview: true }).valid);

// Plan 2: Regularidad en 2.º (Ciclo VI)
const planRegularidad = buildFullPlan('2', 'regularity');
assert.equal(planRegularidad.reviewed.status, 'reviewed');
assert.equal(planRegularidad.reviewed.identity.cycle, 'VI');
assert.equal(planRegularidad.reviewed.curriculumMap[0].competency.id, CANONICAL_IDS.regularity);
assert.ok(Core.validate(planRegularidad.reviewed, { forReview: true }).valid);

// Plan 3: Forma en 4.º (Ciclo VII)
const planForma = buildFullPlan('4', 'shape');
assert.equal(planForma.reviewed.status, 'reviewed');
assert.equal(planForma.reviewed.identity.cycle, 'VII');
assert.equal(planForma.reviewed.curriculumMap[0].competency.id, CANONICAL_IDS.shape);
assert.ok(Core.validate(planForma.reviewed, { forReview: true }).valid);

// Plan 4: Datos en 5.º (Ciclo VII)
const planDatos = buildFullPlan('5', 'data-uncertainty');
assert.equal(planDatos.reviewed.status, 'reviewed');
assert.equal(planDatos.reviewed.identity.cycle, 'VII');
assert.equal(planDatos.reviewed.curriculumMap[0].competency.id, CANONICAL_IDS['data-uncertainty']);
assert.ok(Core.validate(planDatos.reviewed, { forReview: true }).valid);

console.log('  ✓ Planning units generated for Cantidad, Regularidad, Forma and Datos');

// =========================================================================
// 4. Generation input isolation: each competency receives only its slice
// =========================================================================
for (const comp of COMPETENCIES) {
    const grade = comp === 'quantity' || comp === 'regularity' ? '2' : '4';
    const { reviewed, profiles } = buildFullPlan(grade, comp);
    const input = Wizard.buildGenerationInput(reviewed, profiles);
    const req = Generator.createRequest(input, `req-${comp}`);

    assert.equal(req.input.competency.id, CANONICAL_IDS[comp]);
    assert.equal(req.input.capacities.length, 4);
    assert.ok(req.input.performances.every(p => p.id.startsWith(`grade-${grade}-`)));

    // Ensure no contamination from other competencies
    for (const other of COMPETENCIES) {
        if (other !== comp) {
            assert.doesNotMatch(JSON.stringify(req.input.competency), new RegExp(CANONICAL_IDS[other]));
        }
    }
}

console.log('  ✓ Generation input curricular isolation verified for all 4 competencies');

// =========================================================================
// 5. Linked session snapshot preservation
// =========================================================================
// Case A: 2.º Regularidad -> linked session
const linkedReg = Linked.buildGenerationMetadata(planRegularidad.reviewed, planRegularidad.reviewed.sequence[0].id, '2026-10-02T18:00:00.000Z');
assert.equal(linkedReg.metadata.competencia, 'Resuelve problemas de regularidad, equivalencia y cambio');
assert.equal(linkedReg.metadata.nivel, 'SECUNDARIA');
assert.equal(linkedReg.metadata.grado, '2°');
assert.ok(linkedReg.metadata.capacidad.includes('Traduce datos y condiciones'));
assert.deepEqual(linkedReg.link.inheritedContextSnapshot.curriculumMap[0].curricularSourceRefs, ['minedu-secondary-curriculum-2016']);

// Case B: 4.º Forma -> linked session
const linkedShape = Linked.buildGenerationMetadata(planForma.reviewed, planForma.reviewed.sequence[0].id, '2026-10-02T18:00:00.000Z');
assert.equal(linkedShape.metadata.competencia, 'Resuelve problemas de forma, movimiento y localización');
assert.equal(linkedShape.metadata.grado, '4°');
assert.ok(linkedShape.metadata.capacidad.includes('Modela objetos con formas geométricas'));
assert.deepEqual(linkedShape.link.inheritedContextSnapshot.curriculumMap[0].curricularSourceRefs, ['minedu-secondary-curriculum-2016']);

// Case C: 5.º Datos -> linked session
const linkedDatos = Linked.buildGenerationMetadata(planDatos.reviewed, planDatos.reviewed.sequence[0].id, '2026-10-02T18:00:00.000Z');
assert.equal(linkedDatos.metadata.competencia, 'Resuelve problemas de gestión de datos e incertidumbre');
assert.equal(linkedDatos.metadata.grado, '5°');
assert.ok(linkedDatos.metadata.capacidad.includes('Representa datos con gráficos'));
assert.deepEqual(linkedDatos.link.inheritedContextSnapshot.curriculumMap[0].curricularSourceRefs, ['minedu-secondary-curriculum-2016']);

console.log('  ✓ Linked session snapshots preserve exact curricular metadata for all competencies');

// =========================================================================
// 6. Interactive switching in PlanningWizard (setCurriculumCompetency)
// =========================================================================
const switchDraft = Wizard.create('unit', 'unit-switch', '2');
Wizard.setCurriculumCompetency(switchDraft, 'solves-quantity-problems', catalogs);
assert.equal(switchDraft.curriculumMap[0].competency.id, 'solves-quantity-problems');
assert.ok(switchDraft.curriculumMap[0].standard.description.includes('relaciones entre cantidades'));

// Switch to Regularidad
Wizard.setCurriculumCompetency(switchDraft, 'solves-regularity-problems', catalogs);
assert.equal(switchDraft.curriculumMap[0].competency.id, 'solves-regularity-problems');
assert.ok(switchDraft.curriculumMap[0].standard.description.includes('interpretar cambios constantes o regularidades'));

// Switch to Forma
Wizard.setCurriculumCompetency(switchDraft, 'solves-shape-problems', catalogs);
assert.equal(switchDraft.curriculumMap[0].competency.id, 'solves-shape-problems');
assert.ok(switchDraft.curriculumMap[0].standard.description.includes('modela características de objetos mediante prismas'));

// Switch to Datos
Wizard.setCurriculumCompetency(switchDraft, 'solves-data-uncertainty-problems', catalogs);
assert.equal(switchDraft.curriculumMap[0].competency.id, 'solves-data-uncertainty-problems');
assert.ok(switchDraft.curriculumMap[0].standard.description.includes('plantea temas de estudio'));

console.log('  ✓ Interactive switching between competencies in PlanningWizard verified');

console.log('secondary-mathematics-full.test.js: OK');
