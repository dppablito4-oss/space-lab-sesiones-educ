const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Validator = require('../js/pedagogy/catalog-validator.js');

const ROOT = path.resolve(__dirname, '..');
const PEDAGOGY_ROOT = path.join(ROOT, 'data', 'pedagogy');
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(PEDAGOGY_ROOT, relativePath), 'utf8'));

const sources = readJson('sources.json');
const sourceResult = Validator.validateSources(sources);
assert.deepEqual(sourceResult.errors, []);
assert.equal(sourceResult.valid, true);

const catalog = readJson('catalog.json');
const profilesByPath = Object.fromEntries(catalog.profiles.map(entry => [entry.path, readJson(entry.path)]));
const catalogResult = Validator.validateCatalog(catalog, profilesByPath);
assert.deepEqual(catalogResult.errors, []);
assert.equal(catalogResult.valid, true);

for (const entry of catalog.profiles) {
    const profile = profilesByPath[entry.path];
    const result = Validator.validateProfile(profile, sourceResult.sourceIds);
    assert.deepEqual(result.errors, [], `${entry.id}: ${result.errors.join('; ')}`);
    assert.equal(result.valid, true);
    assert.equal(profile.didacticProfile.sequencePolicy, 'adaptive');
    assert.equal(profile.didacticProfile.stepsAreMandatory, false);
    assert.ok(profile.didacticProfile.strategies.every(strategy => strategy.mode === 'recommended'));
}

const curriculum = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'competencias.json'), 'utf8'));
const pilot = profilesByPath['secondary/cycle-vi/mathematics/quantity.json'];
const mathematics = curriculum.areas[pilot.scope.area.officialName];
assert.ok(mathematics, 'El área piloto debe existir en el catálogo CNEB actual.');
const competency = mathematics.competencias.find(item => item.nombre === pilot.scope.competency.officialName);
assert.ok(competency, 'La competencia piloto debe existir en el catálogo CNEB actual.');
assert.deepEqual(
    pilot.scope.competency.capacities.map(item => item.officialName),
    competency.capacidades,
    'Las capacidades normativas no deben divergir del catálogo existente.',
);

const mandatoryCopy = structuredClone(pilot);
mandatoryCopy.didacticProfile.stepsAreMandatory = true;
const mandatoryResult = Validator.validateProfile(mandatoryCopy, sourceResult.sourceIds);
assert.equal(mandatoryResult.valid, false);
assert.ok(mandatoryResult.errors.some(error => error.includes('stepsAreMandatory')));

const unknownSourceCopy = structuredClone(pilot);
unknownSourceCopy.provenance.guidanceSourceRefs.push('fuente-inventada');
const sourceReferenceResult = Validator.validateProfile(unknownSourceCopy, sourceResult.sourceIds);
assert.equal(sourceReferenceResult.valid, false);
assert.ok(sourceReferenceResult.errors.some(error => error.includes('fuente-inventada')));

console.log('pedagogy-catalog.test.js: OK');
