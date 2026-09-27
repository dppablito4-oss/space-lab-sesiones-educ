const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Validator = require('../js/pedagogy/methodology-catalog-validator.js');

const ROOT = path.join(__dirname, '..', 'data', 'pedagogy', 'methodologies');
const read = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const sourcesResult = Validator.validateSources(read('sources.json'));
assert.deepEqual(sourcesResult.errors, []);

const catalog = read('catalog.json');
const profiles = Object.fromEntries(catalog.profiles.map(entry => [entry.path, read(entry.path)]));
const result = Validator.validateCatalog(catalog, profiles, sourcesResult.sourceIds);
assert.deepEqual(result.errors, []);

assert.equal(profiles['project_based_learning.json'].code, 'project_based_learning');
assert.ok(profiles['project_based_learning.json'].fieldRules.some(rule => rule.path === 'finalProduct'));
assert.deepEqual(
    profiles['challenge_based_learning.json'].recommendedPhases.map(phase => phase.id),
    ['engage', 'investigate', 'act']
);
assert.equal(profiles['custom.json'].recommendedPhases.length, 0);
assert.ok(Object.values(profiles).every(profile => profile.fieldRules.every(rule => rule.severity !== 'error')));

const ambiguous = structuredClone(profiles['project_based_learning.json']);
ambiguous.code = 'abp';
assert.equal(Validator.validateProfile(ambiguous, sourcesResult.sourceIds).valid, false);

console.log('methodology-catalog.test.js: OK');
