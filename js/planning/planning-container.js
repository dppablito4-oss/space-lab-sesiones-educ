/** PlanningContainer v1: local domain contract, revisions and session snapshots. */
const PlanningContainer = (() => {
    'use strict';

    const LEVELS = new Set(['initial', 'primary', 'secondary']);
    const TYPES = new Set(['learning_experience', 'unit', 'project', 'context']);
    const STATUSES = new Set(['draft', 'reviewed', 'archived']);
    const ENTRY_KINDS = new Set(['session', 'initial_activity', 'milestone']);
    const ENTRY_STATUSES = new Set(['planned', 'generated', 'completed']);
    const DURATION_UNITS = new Set(['days', 'weeks', 'sessions']);
    const INITIAL_ACTIVITY_TYPES = new Set([
        'psychomotor_workshop', 'graphic_plastic_workshop', 'music_workshop',
        'free_play', 'story_activity', 'sensory_activity',
        'exploration_activity', 'closure_activity'
    ]);
    const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    const isText = value => typeof value === 'string' && value.trim().length > 0;
    const clone = value => JSON.parse(JSON.stringify(value));

    function deepFreeze(value) {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
        Object.freeze(value);
        Object.values(value).forEach(deepFreeze);
        return value;
    }

    function validateReference(reference, path, errors) {
        if (!isObject(reference) || !ID.test(reference.id || '') || !isText(reference.officialName)) {
            errors.push(`${path} requiere id estable y officialName.`);
        }
    }

    function validate(container) {
        const errors = [];
        if (!isObject(container)) return { valid: false, errors: ['PlanningContainer debe ser un objeto.'] };
        if (container.schemaVersion !== '1.0') errors.push('schemaVersion debe ser "1.0".');
        if (!ID.test(container.id || '')) errors.push('id debe ser estable y usar kebab-case.');
        if (!Number.isInteger(container.revision) || container.revision < 1) errors.push('revision debe ser un entero positivo.');
        if (!STATUSES.has(container.status)) errors.push('status no es reconocido.');

        const identity = container.identity;
        if (!isObject(identity)) errors.push('identity es requerido.');
        else {
            if (!isText(identity.title)) errors.push('identity.title es requerido.');
            if (!TYPES.has(identity.planningType)) errors.push('identity.planningType no es reconocido.');
            if (!LEVELS.has(identity.level)) errors.push('identity.level no es reconocido.');
            if (!isText(identity.cycle)) errors.push('identity.cycle es requerido.');
            if (identity.grade !== null && typeof identity.grade !== 'string') errors.push('identity.grade debe ser texto o null.');
            if (identity.age !== null && (!Number.isInteger(identity.age) || identity.age < 0)) errors.push('identity.age debe ser entero o null.');
            if (!isObject(identity.duration) || !Number.isInteger(identity.duration.value) || identity.duration.value < 1 || !DURATION_UNITS.has(identity.duration.unit)) {
                errors.push('identity.duration requiere value positivo y unit reconocida.');
            }
        }

        const context = container.context;
        if (!isObject(context)) errors.push('context es requerido.');
        else {
            for (const key of ['institution', 'teacher', 'classroom', 'students', 'diagnosis', 'localContext']) {
                if (typeof context[key] !== 'string') errors.push(`context.${key} debe ser texto.`);
            }
            if (!Array.isArray(context.interests) || context.interests.some(item => !isText(item))) {
                errors.push('context.interests debe ser una lista de textos.');
            }
        }

        const areaIds = new Set();
        const competencyIds = new Set();
        if (!Array.isArray(container.curriculumAreas) || container.curriculumAreas.length === 0) {
            errors.push('curriculumAreas debe contener al menos un área.');
        } else {
            container.curriculumAreas.forEach((group, areaIndex) => {
                validateReference(group?.area, `curriculumAreas[${areaIndex}].area`, errors);
                if (group?.area?.id) {
                    if (areaIds.has(group.area.id)) errors.push(`Área duplicada: "${group.area.id}".`);
                    areaIds.add(group.area.id);
                }
                if (!Array.isArray(group?.competencies) || group.competencies.length === 0) {
                    errors.push(`curriculumAreas[${areaIndex}].competencies no puede estar vacío.`);
                    return;
                }
                group.competencies.forEach((competency, competencyIndex) => {
                    validateReference(competency, `curriculumAreas[${areaIndex}].competencies[${competencyIndex}]`, errors);
                    if (!Array.isArray(competency?.capacityRefs)) errors.push(`La competencia "${competency?.id || ''}" requiere capacityRefs.`);
                    if (competency?.id) competencyIds.add(competency.id);
                });
            });
        }

        if (!isObject(container.significantSituation) || !isText(container.significantSituation.description) || !isText(container.significantSituation.challenge)) {
            errors.push('significantSituation requiere description y challenge.');
        }
        if (!isObject(container.learningPurpose) || !isText(container.learningPurpose.summary) || !Array.isArray(container.learningPurpose.transversalApproaches)) {
            errors.push('learningPurpose requiere summary y transversalApproaches.');
        }
        if (!isObject(container.assessment) || ['criteria', 'evidence', 'products', 'instruments'].some(key => !Array.isArray(container.assessment[key]))) {
            errors.push('assessment requiere listas de criteria, evidence, products e instruments.');
        }

        const entryIds = new Set();
        const indexes = new Set();
        if (!Array.isArray(container.sequence) || container.sequence.length === 0) {
            errors.push('sequence debe contener al menos un elemento.');
        } else {
            container.sequence.forEach((entry, arrayIndex) => {
                const path = `sequence[${arrayIndex}]`;
                if (!ID.test(entry?.id || '')) errors.push(`${path}.id no es válido.`);
                if (entryIds.has(entry?.id)) errors.push(`${path}.id está duplicado.`);
                entryIds.add(entry?.id);
                if (!Number.isInteger(entry?.index) || entry.index < 1) errors.push(`${path}.index no es válido.`);
                if (indexes.has(entry?.index)) errors.push(`${path}.index está duplicado.`);
                indexes.add(entry?.index);
                if (!ENTRY_KINDS.has(entry?.kind)) errors.push(`${path}.kind no es reconocido.`);
                if (!isText(entry?.title) || !isText(entry?.purpose)) errors.push(`${path} requiere title y purpose.`);
                if (!ENTRY_STATUSES.has(entry?.status)) errors.push(`${path}.status no es reconocido.`);
                if (entry?.areaRef !== null && !areaIds.has(entry?.areaRef)) errors.push(`${path}.areaRef no existe en curriculumAreas.`);
                if (!Array.isArray(entry?.competencyRefs) || entry.competencyRefs.some(ref => !competencyIds.has(ref))) {
                    errors.push(`${path}.competencyRefs contiene referencias desconocidas.`);
                }
                if (entry?.kind === 'initial_activity' && !INITIAL_ACTIVITY_TYPES.has(entry.activityType)) {
                    errors.push(`${path}.activityType es requerido para initial_activity.`);
                }
                if (entry?.kind !== 'initial_activity' && entry?.activityType !== null) {
                    errors.push(`${path}.activityType solo aplica a initial_activity.`);
                }
                if (identity?.level !== 'initial' && entry?.kind === 'initial_activity') {
                    errors.push(`${path}.kind initial_activity solo aplica a Inicial.`);
                }
            });
            const ordered = [...indexes].sort((a, b) => a - b);
            if (ordered.some((value, index) => value !== index + 1)) errors.push('sequence.index debe ser continuo y comenzar en 1.');
        }

        if (!isObject(container.audit) || !isText(container.audit.createdAt) || !isText(container.audit.updatedAt)
            || Number.isNaN(Date.parse(container.audit.createdAt)) || Number.isNaN(Date.parse(container.audit.updatedAt))) {
            errors.push('audit requiere createdAt y updatedAt en formato de fecha válido.');
        }
        return { valid: errors.length === 0, errors };
    }

    function assertValid(container) {
        const result = validate(container);
        if (!result.valid) throw new TypeError(`PlanningContainer inválido: ${result.errors.join(' ')}`);
        return container;
    }

    function createDraft(input, now = new Date().toISOString()) {
        const draft = clone(input);
        draft.schemaVersion = '1.0';
        draft.revision = 1;
        draft.status = 'draft';
        draft.audit = { createdAt: now, updatedAt: now };
        return assertValid(draft);
    }

    function revise(container, changes, now = new Date().toISOString()) {
        assertValid(container);
        if (container.status === 'archived') throw new Error('Una planificación archivada no puede revisarse.');
        const next = { ...clone(container), ...clone(changes || {}) };
        next.id = container.id;
        next.schemaVersion = '1.0';
        next.revision = container.revision + 1;
        next.audit = { createdAt: container.audit.createdAt, updatedAt: now };
        return assertValid(next);
    }

    function createStandaloneLink() {
        return deepFreeze({
            mode: 'standalone', planningContainerId: null, planningRevision: null,
            sequenceEntryId: null, sequenceIndex: null, inheritedContextSnapshot: null
        });
    }

    function createInheritedContextSnapshot(container, sequenceEntryId, capturedAt = new Date().toISOString()) {
        assertValid(container);
        const entry = container.sequence.find(item => item.id === sequenceEntryId);
        if (!entry) throw new Error(`No existe sequenceEntryId "${sequenceEntryId}".`);
        return deepFreeze(clone({
            schemaVersion: '1.0', planningContainerId: container.id,
            planningRevision: container.revision, sequenceEntryId: entry.id,
            sequenceIndex: entry.index, capturedAt,
            identity: container.identity, context: container.context,
            curriculumAreas: container.curriculumAreas,
            significantSituation: container.significantSituation,
            learningPurpose: container.learningPurpose,
            assessment: container.assessment,
            sequenceEntry: entry,
            precedingSequence: container.sequence
                .filter(item => item.index < entry.index)
                .map(item => ({ id: item.id, index: item.index, title: item.title, purpose: item.purpose, status: item.status }))
        }));
    }

    function createLinkedSessionLink(container, sequenceEntryId, capturedAt) {
        const snapshot = createInheritedContextSnapshot(container, sequenceEntryId, capturedAt);
        return deepFreeze({
            mode: 'linked', planningContainerId: container.id,
            planningRevision: container.revision, sequenceEntryId,
            sequenceIndex: snapshot.sequenceIndex, inheritedContextSnapshot: snapshot
        });
    }

    function validateSessionLink(link) {
        const errors = [];
        if (!isObject(link) || !['standalone', 'linked'].includes(link.mode)) {
            return { valid: false, errors: ['El vínculo de planificación no es válido.'] };
        }
        const linkedFields = ['planningContainerId', 'planningRevision', 'sequenceEntryId', 'sequenceIndex', 'inheritedContextSnapshot'];
        if (link.mode === 'standalone') {
            if (linkedFields.some(field => link[field] !== null)) errors.push('Un vínculo standalone no puede contener referencias de planificación.');
        } else {
            const snapshot = link.inheritedContextSnapshot;
            if (!ID.test(link.planningContainerId || '') || !ID.test(link.sequenceEntryId || '')) errors.push('El vínculo linked requiere identificadores estables.');
            if (!Number.isInteger(link.planningRevision) || link.planningRevision < 1 || !Number.isInteger(link.sequenceIndex) || link.sequenceIndex < 1) {
                errors.push('El vínculo linked requiere revisión e índice positivos.');
            }
            if (!isObject(snapshot)
                || snapshot.planningContainerId !== link.planningContainerId
                || snapshot.planningRevision !== link.planningRevision
                || snapshot.sequenceEntryId !== link.sequenceEntryId
                || snapshot.sequenceIndex !== link.sequenceIndex) {
                errors.push('El snapshot heredado no coincide con el vínculo linked.');
            }
        }
        return { valid: errors.length === 0, errors };
    }

    function attachSessionLink(sessionEnvelope, planningLink) {
        if (!isObject(sessionEnvelope) || !isText(sessionEnvelope.id)) throw new TypeError('La sesión requiere id.');
        const linkResult = validateSessionLink(planningLink);
        if (!linkResult.valid) throw new TypeError(linkResult.errors.join(' '));
        return { ...clone(sessionEnvelope), planning: clone(planningLink) };
    }

    return {
        validate, validateSessionLink, createDraft, revise, createStandaloneLink,
        createInheritedContextSnapshot, createLinkedSessionLink, attachSessionLink
    };
})();

if (typeof window !== 'undefined') window.PlanningContainer = PlanningContainer;
if (typeof module !== 'undefined' && module.exports) module.exports = PlanningContainer;
