const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const PlanningContainerV2 = require('../js/planning/planning-container-v2.js');

const ROOT = path.join(__dirname, '..');
const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const fixture = read('data/pedagogy/fixtures/secondary_math_project_unit.v2.json');
const projectProfile = read('data/pedagogy/methodologies/project_based_learning.json');
const challengeProfile = read('data/pedagogy/methodologies/challenge_based_learning.json');

const result = PlanningContainerV2.validate(fixture, { forReview: true, methodologyProfile: projectProfile });
assert.deepEqual(result.errors, []);
assert.deepEqual(result.warnings, []);
assert.deepEqual(result.suggestions, []);
assert.equal(fixture.identity.planningType, 'unit');
assert.equal(fixture.methodologyConfig.primary.code, 'project_based_learning');

const draft = PlanningContainerV2.createDraft({ id: 'plan-empty-draft' }, '2026-09-26T23:00:00.000Z');
assert.equal(PlanningContainerV2.validate(draft).valid, true, 'Un borrador incompleto debe poder guardarse.');
const reviewResult = PlanningContainerV2.validate(draft, { forReview: true });
assert.equal(reviewResult.valid, false);
assert.ok(reviewResult.errors.some(item => item.code === 'review_required'));

const withoutProduct = structuredClone(fixture);
withoutProduct.finalProduct = null;
const softResult = PlanningContainerV2.validate(withoutProduct, { methodologyProfile: projectProfile });
assert.equal(softResult.valid, true, 'Una recomendación metodológica no debe bloquear al docente.');
assert.ok(softResult.warnings.some(item => item.code === 'project-final-product'));

const asChallenge = structuredClone(fixture);
asChallenge.methodologyConfig.primary = {
    profileId: challengeProfile.id,
    profileVersion: challengeProfile.profileVersion,
    code: challengeProfile.code
};
const challengeResult = PlanningContainerV2.validate(asChallenge, { methodologyProfile: challengeProfile });
assert.equal(challengeResult.valid, true);
assert.ok(challengeResult.warnings.some(item => item.code === 'challenge-implementation'));
assert.ok(challengeResult.warnings.some(item => item.code === 'challenge-action-item'));

const brokenReference = structuredClone(fixture);
brokenReference.sequence[0].criterionRefs.push('criterion-unknown');
assert.equal(PlanningContainerV2.validate(brokenReference).valid, false);

const snapshot = PlanningContainerV2.createInheritedContextSnapshot(fixture, 'session-01', '2026-09-26T23:05:00.000Z');
assert.equal(snapshot.schemaVersion, '2.0');
assert.equal(snapshot.precedingSequence.length, 0);
assert.equal(snapshot.followingSequence.length, 2);
assert.equal(snapshot.curriculumMap.length, 1);
assert.equal(Object.isFrozen(snapshot), true);

const linked = PlanningContainerV2.createLinkedSessionLink(fixture, 'session-01', '2026-09-26T23:05:00.000Z');
assert.equal(linked.linkVersion, '2.0');
assert.equal(linked.sequenceItemId, 'session-01');
assert.equal(PlanningContainerV2.validateSessionLink(linked).valid, true);
const sessionData = { schemaVersion: '1.0', metadata: { titulo: 'Sesión vinculada' } };
const envelope = PlanningContainerV2.attachSessionLink({ id: 'session-linked-001', data: sessionData }, linked);
assert.deepEqual(envelope.data, sessionData, 'El vínculo no debe contaminar SessionDocumentV1.');
assert.throws(() => PlanningContainerV2.attachSessionLink(
    { id: 'session-broken', data: sessionData }, { ...linked, planningRevision: 99 }
), /snapshot/);

const revised = PlanningContainerV2.revise(fixture, {
    purpose: { summary: 'Propósito ajustado por la docente.' }
}, '2026-09-26T23:10:00.000Z');
assert.equal(revised.revision, 2);
assert.equal(revised.purpose.what, fixture.purpose.what, 'La revisión debe fusionar objetos anidados.');
assert.notEqual(revised.purpose.summary, fixture.purpose.summary);
assert.equal(snapshot.purpose.summary, fixture.purpose.summary, 'El snapshot anterior debe permanecer inmutable.');

const migration = fs.readFileSync(path.join(ROOT, 'supabase/migrations/202609260013_planning_container_v2.sql'), 'utf8');
assert.match(migration, /schema_version IN \('1\.0', '2\.0'\)/);
assert.doesNotMatch(migration, /DROP TABLE/);

console.log('planning-container-v2.test.js: OK');
