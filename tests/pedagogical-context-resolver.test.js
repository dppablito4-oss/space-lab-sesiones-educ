const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Resolver = require('../js/pedagogy/context-resolver.js');

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
    methodologyProfiles: [
        read('data/pedagogy/methodologies/project_based_learning.json'),
        read('data/pedagogy/methodologies/game_based_learning.json')
    ]
};

const result = Resolver.resolve({
    level: 'secondary', cycle: 'VI', grade: 2,
    area: 'mathematics', competency: 'solves-quantity-problems',
    planningType: 'unit', methodology: 'project_based_learning'
}, catalogs);
assert.equal(result.resolved, true);
assert.deepEqual(result.errors, []);
assert.equal(result.context.profiles.pedagogical.id, 'secondary-cycle-vi');
assert.equal(result.context.profiles.didactic.id, 'secondary-cycle-vi-mathematics-quantity');
assert.equal(result.context.profiles.methodology.id, 'project-based-learning');
assert.equal(result.context.curriculumContext.capacities.length, 4);
assert.ok(result.context.curriculumContext.standard.description);
assert.equal(result.context.curriculumContext.performances.length, 4);
assert.equal(Object.isFrozen(result.context), true);
assert.equal(result.warnings.filter(item => item.code === 'profile_requires_review').length, 4);

for (const [grade, cycle] of [[1, 'VI'], [2, 'VI'], [3, 'VII'], [4, 'VII'], [5, 'VII']]) {
    assert.equal(Resolver.resolveSecondaryCycle(grade), cycle);
    const resolved = Resolver.resolve({
        level: 'secondary', grade,
        area: 'mathematics', competency: 'solves-quantity-problems',
        planningType: 'unit', methodology: 'project_based_learning'
    }, catalogs);
    assert.equal(resolved.resolved, true, `grade ${grade}`);
    assert.equal(resolved.context.curriculumContext.cycle, cycle);
    assert.ok(resolved.context.curriculumContext.performances.every(item => item.id.startsWith(`grade-${grade}-`)));
}
for (const grade of [6, 0, null]) {
    assert.throws(() => Resolver.resolveSecondaryCycle(grade), error => error.code === 'invalid_secondary_grade');
}

const mismatched = Resolver.resolve({
    level: 'secondary', cycle: 'VI', grade: 4,
    area: 'mathematics', competency: 'solves-quantity-problems',
    planningType: 'unit', methodology: 'project_based_learning'
}, catalogs);
assert.equal(mismatched.resolved, false);
assert.ok(mismatched.errors.some(item => item.code === 'cycle_grade_mismatch'));

const noCurriculum = structuredClone(catalogs);
noCurriculum.curriculumProfiles = noCurriculum.curriculumProfiles.filter(profile => profile.scope.cycle !== 'VII');
const missing = Resolver.resolve({
    level: 'secondary', grade: 4,
    area: 'mathematics', competency: 'solves-quantity-problems',
    planningType: 'unit', methodology: 'project_based_learning'
}, noCurriculum);
assert.equal(missing.resolved, false);
assert.ok(missing.errors.some(item => item.code === 'curriculum_profile_not_found'));

const project = catalogs.methodologyProfiles[0];
assert.equal(Resolver.isMethodologySuitable(project, 'secondary', 'VI'), true);
const withCycleVII = structuredClone(project);
withCycleVII.suitableScopes[0].cycles.push('VII');
assert.equal(Resolver.isMethodologySuitable(withCycleVII, 'secondary', 'VII'), true);

function catalogsForInitial(cycle, methodology) {
    const pedagogical = structuredClone(catalogs.pedagogicalProfiles[0]);
    pedagogical.id = `initial-cycle-${cycle.toLowerCase()}`;
    pedagogical.scope = { level: 'initial', cycle, grades: ['5'], ages: [] };
    const didactic = structuredClone(catalogs.didacticProfiles[0]);
    didactic.id = `initial-cycle-${cycle.toLowerCase()}-mathematics-quantity`;
    didactic.scope.level = 'initial';
    didactic.scope.cycle = cycle;
    const curriculum = structuredClone(catalogs.curriculumProfiles[0]);
    curriculum.id = `initial-cycle-${cycle.toLowerCase()}-mathematics-quantity-curriculum`;
    curriculum.scope = { ...curriculum.scope, level: 'initial', cycle, grades: ['5'] };
    curriculum.performancesByGrade = { '5': curriculum.performancesByGrade['1'] };
    return { pedagogicalProfiles: [pedagogical], curriculumProfiles: [curriculum], didacticProfiles: [didactic], methodologyProfiles: [methodology] };
}

const initialInput = {
    level: 'initial', cycle: 'I', grade: 5,
    area: 'mathematics', competency: 'solves-quantity-problems',
    planningType: 'unit', methodology: 'project_based_learning'
};
const initialI = Resolver.resolve(initialInput, catalogsForInitial('I', project));
assert.equal(initialI.resolved, true);
assert.ok(initialI.warnings.some(item => item.code === 'methodology_scope_not_recommended'));

const initialMethodology = structuredClone(project);
initialMethodology.suitableScopes = [{ level: 'initial', cycles: ['II'] }];
const initialII = Resolver.resolve({ ...initialInput, cycle: 'II' }, catalogsForInitial('II', initialMethodology));
assert.equal(initialII.resolved, true);
assert.equal(initialII.warnings.some(item => item.code === 'methodology_scope_not_recommended'), false);

console.log('pedagogical-context-resolver.test.js: OK');
