/** Offline-first persistence and cloud reconciliation for PlanningContainer v1. */
const PlanningRepository = (() => {
    'use strict';

    const STORAGE_KEY = 'spacelab_planning_containers';
    const clone = value => JSON.parse(JSON.stringify(value));
    const timestamp = value => {
        const parsed = Date.parse(value || '');
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    function createRecord(container, lastSaved, synced = false) {
        return {
            id: container.id,
            schemaVersion: container.schemaVersion,
            revision: container.revision,
            status: container.status,
            title: container.identity.title,
            planningType: container.identity.planningType,
            level: container.identity.level,
            containerData: clone(container),
            lastSaved,
            deletedAt: null,
            synced
        };
    }

    function create(options = {}) {
        const storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
        const validator = options.validator
            || (typeof PlanningContainerV2 !== 'undefined' ? PlanningContainerV2 : null)
            || (typeof PlanningContainer !== 'undefined' ? PlanningContainer : null);
        const cloud = options.cloud || (typeof window !== 'undefined' ? window.SupabaseClient : null);
        const now = options.now || (() => new Date().toISOString());
        if (!storage) throw new Error('PlanningRepository requiere almacenamiento local.');
        if (!validator || typeof validator.validate !== 'function') throw new Error('PlanningRepository requiere PlanningContainer.');

        function readAll(includeDeleted = false) {
            try {
                const records = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
                if (!Array.isArray(records)) return [];
                return clone(includeDeleted ? records : records.filter(record => !record.deletedAt));
            } catch (error) {
                console.error('[PlanningRepository] No se pudo leer el almacenamiento local:', error);
                return [];
            }
        }

        function writeAll(records) {
            storage.setItem(STORAGE_KEY, JSON.stringify(records));
        }

        function list() {
            return readAll(false)
                .sort((left, right) => timestamp(right.lastSaved) - timestamp(left.lastSaved))
                .map(record => clone(record.containerData));
        }

        function get(id) {
            const record = readAll(false).find(item => item.id === id);
            return record ? clone(record.containerData) : null;
        }

        function save(container) {
            const result = validator.validate(container);
            if (!result.valid) throw new TypeError(`PlanningContainer inválido: ${result.errors.join(' ')}`);
            const records = readAll(true);
            const index = records.findIndex(item => item.id === container.id);
            const record = createRecord(container, now(), false);
            if (index >= 0) records[index] = record;
            else records.unshift(record);
            writeAll(records);
            return clone(container);
        }

        function remove(id) {
            const records = readAll(true);
            const index = records.findIndex(item => item.id === id);
            if (index < 0) return false;
            const removedAt = now();
            records[index] = { ...records[index], deletedAt: removedAt, lastSaved: removedAt, synced: false };
            writeAll(records);
            return true;
        }

        async function sync() {
            if (!cloud || typeof cloud.getPlanningRecordsCloud !== 'function' || typeof cloud.savePlanningRecordCloud !== 'function') {
                return { synced: false, reason: 'cloud_unavailable', records: readAll(false).length };
            }
            if (typeof cloud.getCurrentUser === 'function' && !await cloud.getCurrentUser()) {
                return { synced: false, reason: 'authentication_required', records: readAll(false).length };
            }

            const localRecords = readAll(true);
            const receivedCloudRecords = await cloud.getPlanningRecordsCloud();
            const cloudRecords = receivedCloudRecords.filter(record => {
                const result = validator.validate(record?.containerData);
                if (!result.valid) {
                    console.warn(`[PlanningRepository] Se ignoró el registro remoto inválido "${record?.id || 'sin-id'}".`);
                    return false;
                }
                return true;
            });
            const localById = new Map(localRecords.map(record => [record.id, record]));
            const cloudById = new Map(cloudRecords.map(record => [record.id, record]));
            const ids = new Set([...localById.keys(), ...cloudById.keys()]);
            const reconciled = [];
            let uploaded = 0;
            let downloaded = 0;

            for (const id of ids) {
                const localRecord = localById.get(id);
                const cloudRecord = cloudById.get(id);
                let winner;
                if (!localRecord) {
                    winner = { ...clone(cloudRecord), synced: true };
                    downloaded += 1;
                } else if (!cloudRecord) {
                    if (localRecord.synced) {
                        // Un registro previamente sincronizado que desaparece de la nube
                        // fue purgado por una operación administrativa. No se resucita.
                        continue;
                    }
                    winner = clone(localRecord);
                    await cloud.savePlanningRecordCloud(winner);
                    winner.synced = true;
                    uploaded += 1;
                } else if (timestamp(cloudRecord.lastSaved) > timestamp(localRecord.lastSaved)) {
                    winner = { ...clone(cloudRecord), synced: true };
                    downloaded += 1;
                } else {
                    winner = clone(localRecord);
                    if (!localRecord.synced || timestamp(localRecord.lastSaved) > timestamp(cloudRecord.lastSaved)) {
                        await cloud.savePlanningRecordCloud(winner);
                        uploaded += 1;
                    }
                    winner.synced = true;
                }
                reconciled.push(winner);
            }

            reconciled.sort((left, right) => timestamp(right.lastSaved) - timestamp(left.lastSaved));
            writeAll(reconciled);
            return {
                synced: true, uploaded, downloaded,
                rejected: receivedCloudRecords.length - cloudRecords.length,
                records: reconciled.filter(record => !record.deletedAt).length
            };
        }

        return { list, get, save, remove, sync, readAll: includeDeleted => readAll(Boolean(includeDeleted)) };
    }

    return { STORAGE_KEY, create };
})();

if (typeof window !== 'undefined') window.PlanningRepository = PlanningRepository;
if (typeof module !== 'undefined' && module.exports) module.exports = PlanningRepository;
