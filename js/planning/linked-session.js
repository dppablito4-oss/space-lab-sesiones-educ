/** Bridges a reviewed PlanningContainer 2.0 with the existing session editor. */
const PlanningLinkedSession = (() => {
    'use strict';
    const core = typeof module !== 'undefined' && module.exports
        ? require('./planning-container-v2.js') : window.PlanningContainerV2;
    const repositoryModule = typeof module !== 'undefined' && module.exports
        ? require('./planning-repository.js') : window.PlanningRepository;
    const clone = value => JSON.parse(JSON.stringify(value));
    const LEVELS = { secondary: 'SECUNDARIA', primary: 'PRIMARIA', initial: 'INICIAL' };
    const DOCUMENT_STATUSES = new Set(['draft', 'reviewed', 'approved', 'archived']);
    let repository = null;

    function assertReviewed(container) {
        if (!container || !core.validate(container).valid) {
            throw new TypeError('No se puede generar una sesión desde una planificación inválida.');
        }
        if (container.status !== 'reviewed') {
            throw new Error('Solo una planificación revisada puede generar sesiones vinculadas.');
        }
        return container;
    }

    function humanNames(values, ids) {
        const allowed = new Set(Array.isArray(ids) ? ids : []);
        const filterById = Array.isArray(ids);
        return (Array.isArray(values) ? values : [])
            .filter(value => !filterById || allowed.has(value.id))
            .map(value => value.officialName || value.description || value.label || value.title || '')
            .filter(Boolean);
    }

    function assertEligibleItem(container, sequenceItemId) {
        const item = container.sequence.find(entry => entry.id === sequenceItemId);
        if (!item || item.type !== 'session' || item.status !== 'planned' || item.linkedDocumentRef !== null) {
            throw new Error('Esta actividad no puede generar una sesión vinculada.');
        }
        return item;
    }

    function buildGenerationMetadata(container, sequenceItemId, capturedAt) {
        assertReviewed(container);
        assertEligibleItem(container, sequenceItemId);
        const link = core.createLinkedSessionLink(container, sequenceItemId, capturedAt);
        const snapshot = link.inheritedContextSnapshot;
        const item = snapshot.sequenceItem;
        const maps = snapshot.curriculumMap || [];
        const competencies = maps.map(entry => entry.competency?.officialName).filter(Boolean);
        const capacities = maps.flatMap(entry => humanNames(entry.capacities, item.capacityRefs));
        const performances = maps.flatMap(entry => humanNames(entry.performances));
        const approaches = (snapshot.transversalElements || []).map(entry => entry.name).filter(Boolean);
        const administration = snapshot.administrativeContext || {};
        const identity = snapshot.identity || {};
        const duration = item.duration?.value ? `${item.duration.value} minutos` : '';
        return Object.freeze({
            link,
            metadata: Object.freeze({
                institucion: administration.institution || '',
                dre: administration.dre || '',
                ugel: administration.ugel || '',
                docente: administration.teacher || '',
                director: administration.director || '',
                fecha: item.date || '',
                nivel: LEVELS[identity.level] || String(identity.level || '').toUpperCase(),
                grado: identity.grade ? (identity.level === 'initial' ? `${identity.grade} años` : `${identity.grade}°`) : '',
                seccion: (administration.sections || []).join(', '),
                area: maps.map(entry => entry.area?.officialName).filter(Boolean).join(' / '),
                numero_sesion: String(item.index),
                duracion: duration,
                unidad: identity.title || '',
                titulo: item.title || '',
                competencia: competencies.join('; '),
                capacidad: capacities.join('; '),
                desempeno: performances.join('; '),
                enfoque: approaches[0] || '',
                enfoque2: approaches[1] || '',
                methodology: snapshot.methodologyConfig?.primary?.code || '',
                inheritedContextSnapshot: snapshot
            })
        });
    }

    function getRepository() {
        repository ||= repositoryModule.create({ validator: core });
        return repository;
    }

    function prepare(containerId, sequenceItemId, capturedAt) {
        const container = getRepository().get(containerId);
        if (!container) throw new Error('No se encontró la planificación solicitada.');
        return buildGenerationMetadata(container, sequenceItemId, capturedAt);
    }

    function attachGeneratedSession(session, link) {
        if (!session?.id) throw new TypeError('La sesión generada requiere un id estable.');
        const envelope = core.attachSessionLink({ id: session.id, data: clone(session) }, link);
        return { ...envelope.data, planning: envelope.planning };
    }

    function sessionReference(session) {
        if (!session || typeof session.id !== 'string' || !session.id.trim()) throw new TypeError('La sesión requiere un id estable.');
        const schemaVersion = typeof session.schemaVersion === 'string' && session.schemaVersion.trim() ? session.schemaVersion : '1.0';
        const revision = Number.isInteger(session.revision) && session.revision >= 1 ? session.revision : 1;
        const status = DOCUMENT_STATUSES.has(session.status) ? session.status : 'draft';
        return { id: session.id, schemaVersion, revision, status };
    }

    function recordGeneratedSession(link, session, updatedAt = new Date().toISOString()) {
        const validation = core.validateSessionLink(link);
        if (!validation.valid || link.mode !== 'linked') throw new TypeError('El vínculo de sesión no es válido.');
        const reference = sessionReference(session);
        const repo = getRepository();
        const container = repo.get(link.planningContainerId);
        assertReviewed(container);
        if (container.revision !== link.planningRevision) {
            throw new Error('La planificación cambió después de capturar el contexto de la sesión.');
        }
        const item = container.sequence.find(entry => entry.id === link.sequenceItemId);
        if (!item || item.index !== link.sequenceIndex) throw new Error('La sesión ya no coincide con la secuencia revisada.');
        if (item.linkedDocumentRef?.id === reference.id && item.status === 'generated') return container;
        if (item.type !== 'session' || item.status !== 'planned' || item.linkedDocumentRef !== null) {
            throw new Error('La planificación cambió y esta actividad ya no puede vincularse.');
        }
        const updated = clone(container);
        const target = updated.sequence.find(entry => entry.id === link.sequenceItemId);
        target.linkedDocumentRef = reference;
        target.status = 'generated';
        updated.audit.updatedAt = updatedAt;
        if (!core.validate(updated).valid) throw new TypeError('No se pudo actualizar la secuencia vinculada.');
        repo.save(updated);
        return updated;
    }

    async function sync() {
        return getRepository().sync();
    }

    return { assertReviewed, assertEligibleItem, buildGenerationMetadata, prepare, attachGeneratedSession, sessionReference, recordGeneratedSession, sync };
})();

if (typeof window !== 'undefined') window.PlanningLinkedSession = PlanningLinkedSession;
if (typeof module !== 'undefined' && module.exports) module.exports = PlanningLinkedSession;
