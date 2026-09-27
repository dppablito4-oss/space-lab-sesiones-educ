const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const PlanningContainer = require('../js/planning/planning-container.js');
const PlanningContainerV2 = require('../js/planning/planning-container-v2.js');
const PlanningRepository = require('../js/planning/planning-repository.js');

function memoryStorage() {
    const values = new Map();
    return {
        getItem: key => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: key => values.delete(key)
    };
}

function validContainer(id = 'plan-prueba-001') {
    return PlanningContainer.createDraft({
        id,
        identity: {
            title: 'Plan piloto', planningType: 'unit', level: 'secondary',
            cycle: 'VI', grade: '1', age: null, duration: { value: 2, unit: 'weeks' }
        },
        context: {
            institution: '', teacher: '', classroom: '', students: '', diagnosis: '',
            interests: [], localContext: ''
        },
        curriculumAreas: [{
            area: { id: 'matematica', officialName: 'Matemática' },
            competencies: [{
                id: 'resuelve-problemas-de-cantidad',
                officialName: 'Resuelve problemas de cantidad', capacityRefs: []
            }]
        }],
        significantSituation: { description: 'Situación de prueba.', challenge: '¿Cómo la resolvemos?' },
        learningPurpose: { summary: 'Aprender resolviendo.', transversalApproaches: [] },
        assessment: { criteria: [], evidence: [], products: [], instruments: [] },
        sequence: [{
            id: 'sesion-01', index: 1, kind: 'session', activityType: null,
            title: 'Primera sesión', areaRef: 'matematica',
            competencyRefs: ['resuelve-problemas-de-cantidad'], purpose: 'Resolver.',
            status: 'planned', generatedDocumentId: null
        }]
    }, '2026-09-26T20:00:00.000Z');
}

(async () => {
    const storage = memoryStorage();
    let currentTime = '2026-09-26T20:01:00.000Z';
    const uploads = [];
    let cloudRecords = [];
    const cloud = {
        async getCurrentUser() { return { id: 'user-1' }; },
        async getPlanningRecordsCloud() { return structuredClone(cloudRecords); },
        async savePlanningRecordCloud(record) { uploads.push(structuredClone(record)); }
    };
    const repository = PlanningRepository.create({
        storage, validator: PlanningContainer, cloud, now: () => currentTime
    });

    const original = validContainer();
    repository.save(original);
    original.identity.title = 'Mutación externa';
    assert.equal(repository.get('plan-prueba-001').identity.title, 'Plan piloto');
    assert.equal(repository.list().length, 1);

    let result = await repository.sync();
    assert.deepEqual(result, { synced: true, uploaded: 1, downloaded: 0, rejected: 0, records: 1 });
    assert.equal(uploads[0].containerData.id, 'plan-prueba-001');
    assert.equal(repository.readAll(true)[0].synced, true);

    const remoteRevision = PlanningContainer.revise(validContainer(), {
        identity: {
            ...validContainer().identity,
            title: 'Título desde la nube'
        }
    }, '2026-09-26T20:02:00.000Z');
    cloudRecords = [{
        id: remoteRevision.id,
        revision: remoteRevision.revision,
        status: remoteRevision.status,
        title: remoteRevision.identity.title,
        planningType: remoteRevision.identity.planningType,
        level: remoteRevision.identity.level,
        containerData: remoteRevision,
        lastSaved: '2026-09-26T20:03:00.000Z',
        deletedAt: null,
        synced: true
    }];
    result = await repository.sync();
    assert.equal(result.downloaded, 1);
    assert.equal(repository.get(remoteRevision.id).identity.title, 'Título desde la nube');

    currentTime = '2026-09-26T20:04:00.000Z';
    assert.equal(repository.remove(remoteRevision.id), true);
    assert.equal(repository.get(remoteRevision.id), null);
    assert.equal(repository.readAll(true)[0].deletedAt, currentTime);
    await repository.sync();
    assert.equal(uploads.at(-1).deletedAt, currentTime, 'El tombstone local debe sincronizarse.');

    cloudRecords = [];
    await repository.sync();
    assert.equal(repository.readAll(true).length, 0, 'Un registro purgado en nube no debe resucitar.');

    cloudRecords = [{ id: 'plan-corrupto', containerData: { schemaVersion: '0' }, lastSaved: '2026-09-26T21:00:00.000Z' }];
    result = await repository.sync();
    assert.equal(result.rejected, 1);
    assert.equal(repository.get('plan-corrupto'), null);

    const anonymous = PlanningRepository.create({
        storage: memoryStorage(), validator: PlanningContainer,
        cloud: {
            async getCurrentUser() { return null; },
            async getPlanningRecordsCloud() { throw new Error('No debe consultar la nube sin autenticación.'); },
            async savePlanningRecordCloud() { throw new Error('No debe guardar en la nube sin autenticación.'); }
        }
    });
    anonymous.save(validContainer('plan-anonimo-001'));
    assert.equal((await anonymous.sync()).reason, 'authentication_required');

    const v2Storage = memoryStorage();
    const v2Repository = PlanningRepository.create({ storage: v2Storage, validator: PlanningContainerV2 });
    const v2Fixture = JSON.parse(fs.readFileSync(
        path.join(__dirname, '..', 'data', 'pedagogy', 'fixtures', 'secondary_math_project_unit.v2.json'),
        'utf8'
    ));
    v2Repository.save(v2Fixture);
    assert.equal(v2Repository.readAll(true)[0].schemaVersion, '2.0');
    assert.equal(v2Repository.get(v2Fixture.id).methodologyConfig.primary.code, 'project_based_learning');

    const migration = fs.readFileSync(
        path.join(__dirname, '..', 'supabase', 'migrations', '202609260012_planning_containers.sql'),
        'utf8'
    );
    assert.match(migration, /ALTER TABLE public\.planning_containers ENABLE ROW LEVEL SECURITY/);
    assert.match(migration, /auth\.uid\(\) = user_id/g);
    assert.match(migration, /REVOKE ALL ON public\.planning_containers FROM PUBLIC, anon/);
    assert.match(migration, /PRIMARY KEY \(user_id, id\)/);

    console.log('planning-repository.test.js: OK');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
