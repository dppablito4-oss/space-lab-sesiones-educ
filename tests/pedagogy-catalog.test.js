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
assert.equal(catalog.curriculumProfiles.length, 52);
assert.equal(catalog.didacticProfiles.length, 52);
for (const cycle of ['vi', 'vii']) {
    for (const comp of ['quantity', 'regularity', 'shape', 'data-uncertainty']) {
        assert.ok(catalog.curriculumProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-mathematics-${comp}-curriculum`), `Missing curriculum profile for ${cycle}/${comp}`);
        assert.ok(catalog.didacticProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-mathematics-${comp}`), `Missing didactic profile for ${cycle}/${comp}`);
    }
    for (const comp of ['oral', 'reading', 'writing']) {
        assert.ok(catalog.curriculumProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-communication-${comp}-curriculum`), `Missing curriculum profile for ${cycle}/${comp}`);
        assert.ok(catalog.didacticProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-communication-${comp}`), `Missing didactic profile for ${cycle}/${comp}`);
    }
    for (const comp of ['inquiry', 'physical-world', 'technological-solution']) {
        assert.ok(catalog.curriculumProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-science-technology-${comp}-curriculum`), `Missing curriculum profile for ${cycle}/${comp}`);
        assert.ok(catalog.didacticProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-science-technology-${comp}`), `Missing didactic profile for ${cycle}/${comp}`);
    }
    for (const comp of ['history', 'geography-environment', 'economy']) {
        assert.ok(catalog.curriculumProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-social-sciences-${comp}-curriculum`), `Missing curriculum profile for ${cycle}/${comp}`);
        assert.ok(catalog.didacticProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-social-sciences-${comp}`), `Missing didactic profile for ${cycle}/${comp}`);
    }
    for (const comp of ['identity', 'citizenship']) {
        assert.ok(catalog.curriculumProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-dpcc-${comp}-curriculum`), `Missing curriculum profile for ${cycle}/${comp}`);
        assert.ok(catalog.didacticProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-dpcc-${comp}`), `Missing didactic profile for ${cycle}/${comp}`);
    }
    for (const comp of ['entrepreneurship']) {
        assert.ok(catalog.curriculumProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-work-education-${comp}-curriculum`), `Missing curriculum profile for ${cycle}/${comp}`);
        assert.ok(catalog.didacticProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-work-education-${comp}`), `Missing didactic profile for ${cycle}/${comp}`);
    }
    for (const comp of ['oral', 'reading', 'writing']) {
        assert.ok(catalog.curriculumProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-english-${comp}-curriculum`), `Missing curriculum profile for ${cycle}/${comp}`);
        assert.ok(catalog.didacticProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-english-${comp}`), `Missing didactic profile for ${cycle}/${comp}`);
    }
    for (const comp of ['appreciation', 'creation']) {
        assert.ok(catalog.curriculumProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-arts-culture-${comp}-curriculum`), `Missing curriculum profile for ${cycle}/${comp}`);
        assert.ok(catalog.didacticProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-arts-culture-${comp}`), `Missing didactic profile for ${cycle}/${comp}`);
    }
    for (const comp of ['motor', 'healthy', 'sociomotor']) {
        assert.ok(catalog.curriculumProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-physical-education-${comp}-curriculum`), `Missing curriculum profile for ${cycle}/${comp}`);
        assert.ok(catalog.didacticProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-physical-education-${comp}`), `Missing didactic profile for ${cycle}/${comp}`);
    }
    for (const comp of ['identity', 'encounter']) {
        assert.ok(catalog.curriculumProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-religious-education-${comp}-curriculum`), `Missing curriculum profile for ${cycle}/${comp}`);
        assert.ok(catalog.didacticProfiles.some(entry => entry.id === `secondary-cycle-${cycle}-religious-education-${comp}`), `Missing didactic profile for ${cycle}/${comp}`);
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
