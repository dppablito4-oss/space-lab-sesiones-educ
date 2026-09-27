const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Validator = require('../js/pedagogy/methodology-catalog-validator.js');

const PEDAGOGY_ROOT = path.join(__dirname, '..', 'data', 'pedagogy');
const read = file => JSON.parse(fs.readFileSync(path.join(PEDAGOGY_ROOT, file), 'utf8'));
const sources = read('methodologies/sources.json');
const sourcesResult = Validator.validateSources(sources);
assert.deepEqual(sourcesResult.errors, []);

const catalog = read('catalog.json');
const profiles = Object.fromEntries(catalog.methodologyProfiles.map(entry => [entry.path, read(entry.path)]));
const result = Validator.validateCatalog(catalog, profiles, sourcesResult.sourceIds);
assert.deepEqual(result.errors, []);
assert.equal(fs.existsSync(path.join(PEDAGOGY_ROOT, 'methodologies', 'catalog.json')), false);

const project = profiles['methodologies/project_based_learning.json'];
assert.equal(project.code, 'project_based_learning');
assert.deepEqual(project.suitableScopes, [{ level: 'secondary', cycles: ['VI'] }]);
assert.ok(project.fieldRules.some(rule => rule.path === 'finalProduct'));
const projectSourceId = 'minedu-project-based-learning-2022';
assert.deepEqual(project.provenance.sourceRefs, [projectSourceId]);
const projectSource = sources.sources.find(source => source.id === projectSourceId);
assert.ok(projectSource);
assert.match(projectSource.title, /proyectos/i);
assert.match(projectSource.url, /aprendizaje-basado-en-proyectos\.pdf$/);

const invalidLevel = structuredClone(project);
invalidLevel.suitableScopes = [{ level: 'unknown', cycles: ['VI'] }];
assert.equal(Validator.validateProfile(invalidLevel, sourcesResult.sourceIds).valid, false);
const duplicateCycles = structuredClone(project);
duplicateCycles.suitableScopes = [{ level: 'secondary', cycles: ['VI', 'VI'] }];
assert.ok(Validator.validateProfile(duplicateCycles, sourcesResult.sourceIds).errors.some(error => error.includes('duplicados')));
const duplicateScopes = structuredClone(project);
duplicateScopes.suitableScopes.push(structuredClone(duplicateScopes.suitableScopes[0]));
assert.ok(Validator.validateProfile(duplicateScopes, sourcesResult.sourceIds).errors.some(error => error.includes('duplicado')));

const ambiguous = structuredClone(project);
ambiguous.code = 'abp';
assert.equal(Validator.validateProfile(ambiguous, sourcesResult.sourceIds).valid, false);
assert.ok(Object.values(profiles).every(profile => profile.fieldRules.every(rule => rule.severity !== 'error')));

console.log('methodology-catalog.test.js: OK');
