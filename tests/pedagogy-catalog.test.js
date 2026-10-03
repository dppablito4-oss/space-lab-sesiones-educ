const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Validator = require('../js/pedagogy/catalog-validator.js');

const ROOT = path.resolve(__dirname, '..');
const PEDAGOGY_ROOT = path.join(ROOT, 'data', 'pedagogy');
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(PEDAGOGY_ROOT, relativePath), 'utf8'));
const catalog = readJson('catalog.json');
const entries = [
    ...catalog.pedagogicalProfiles,
    ...catalog.curriculumProfiles,
    ...catalog.didacticProfiles,
    ...catalog.methodologyProfiles,
    ...catalog.legacyProfiles
];
const profilesByPath = Object.fromEntries(entries.map(entry => [entry.path, readJson(entry.path)]));

const result = Validator.validateCatalog(catalog, profilesByPath);
assert.deepEqual(result.errors, []);
assert.equal(result.valid, true);
assert.equal(catalog.schemaVersion, '2.0');
assert.ok(catalog.pedagogicalProfiles.some(entry => entry.id === 'secondary-cycle-vi'));
assert.ok(catalog.pedagogicalProfiles.some(entry => entry.id === 'secondary-cycle-vii'));
assert.equal(catalog.curriculumProfiles.length, 14);
assert.equal(catalog.didacticProfiles.length, 14);
for (const cycle of ['vi', 'vii']) {
    for (const comp of ['quantity', 'regularity', 'shape', 'data-uncertainty']) {
        assert.ok(catalog.curriculumProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-mathematics-${comp}-curriculum`), `Missing curriculum profile for ${cycle}/${comp}`);
        assert.ok(catalog.didacticProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-mathematics-${comp}`), `Missing didactic profile for ${cycle}/${comp}`);
    }
    for (const comp of ['oral', 'reading', 'writing']) {
        assert.ok(catalog.curriculumProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-communication-${comp}-curriculum`), `Missing curriculum profile for ${cycle}/${comp}`);
        assert.ok(catalog.didacticProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-communication-${comp}`), `Missing didactic profile for ${cycle}/${comp}`);
    }
}
assert.equal(catalog.methodologyProfiles.length, 5);
assert.ok(catalog.legacyProfiles.every(entry => entry.status === 'archived'));
assert.ok(!catalog.pedagogicalProfiles.some(entry => entry.id.includes('.')));

const missing = structuredClone(profilesByPath);
delete missing[catalog.pedagogicalProfiles[0].path];
assert.equal(Validator.validateCatalog(catalog, missing).valid, false);

const duplicate = structuredClone(catalog);
duplicate.didacticProfiles[0].id = duplicate.pedagogicalProfiles[0].id;
assert.ok(Validator.validateCatalog(duplicate, profilesByPath).errors.some(error => error.includes('duplicado')));

const legacySources = readJson('sources.json');
const sourceResult = Validator.validateSources(legacySources);
assert.equal(sourceResult.valid, true);
for (const entry of catalog.curriculumProfiles) {
    const validation = Validator.validateCurriculumProfile(profilesByPath[entry.path], sourceResult.sourceIds);
    assert.deepEqual(validation.errors, [], entry.id);
    assert.equal(validation.valid, true, entry.id);
}
const legacy = profilesByPath['secondary/cycle-vi/mathematics/quantity.json'];
assert.equal(Validator.validateProfile(legacy, sourceResult.sourceIds).valid, true);

console.log('pedagogy-catalog.test.js: OK');
