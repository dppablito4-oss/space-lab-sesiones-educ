/** PlanningContainer 2.0: V3 planning map, soft pedagogy rules and immutable links. */
const PlanningContainerV2 = (() => {
    'use strict';

    const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const LEVELS = new Set(['initial', 'primary', 'secondary']);
    const TYPES = new Set(['unit', 'project', 'learning_experience', 'context']);
    const STATUSES = new Set(['draft', 'reviewed', 'archived']);
    const ITEM_TYPES = new Set(['session', 'activity', 'workshop', 'game', 'exploration', 'investigation', 'field_activity', 'presentation', 'reflection', 'challenge_action']);
    const METHODOLOGIES = new Set(['project_based_learning', 'problem_based_learning', 'challenge_based_learning', 'game_based_learning', 'custom']);
    const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    const isText = value => typeof value === 'string' && value.trim().length > 0;
    const clone = value => JSON.parse(JSON.stringify(value));

    function deepMerge(base, patch) {
        if (!isObject(base) || !isObject(patch)) return clone(patch);
        const result = clone(base);
        Object.entries(patch).forEach(([key, value]) => {
            result[key] = isObject(value) && isObject(result[key]) ? deepMerge(result[key], value) : clone(value);
        });
        return result;
    }

    function deepFreeze(value) {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
        Object.freeze(value);
        Object.values(value).forEach(deepFreeze);
        return value;
    }

    function issue(code, path, message) { return { code, path, message }; }
    function addDuplicateErrors(items, path, errors) {
        const ids = new Set();
        items.forEach((item, index) => {
            if (!ID.test(item?.id || '')) errors.push(issue('invalid_id', `${path}[${index}].id`, 'El identificador no es válido.'));
            else if (ids.has(item.id)) errors.push(issue('duplicate_id', `${path}[${index}].id`, `El identificador "${item.id}" está duplicado.`));
            ids.add(item?.id);
        });
        return ids;
    }

    function getPath(value, path) {
        return path.split('.').reduce((current, key) => current?.[key], value);
    }

    function hasValue(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
    }

    function ruleTriggered(container, rule) {
        if (rule.operator === 'always') return true;
        if (rule.operator === 'non_empty') return !hasValue(getPath(container, rule.path));
        if (rule.operator === 'sequence_type_present') return !container.sequence.some(item => item.type === rule.value);
        if (rule.operator === 'milestone_phase_present') return !container.milestones.some(item => item.phase === rule.value);
        if (rule.operator === 'milestone_partial_product_present') return !container.milestones.some(item => item.partialProduct);
        return false;
    }

    function applyMethodologyRules(container, profile, errors, warnings, suggestions) {
        if (!profile) return;
        const primary = container.methodologyConfig?.primary;
        if (!primary || primary.profileId !== profile.id || primary.profileVersion !== profile.profileVersion || primary.code !== profile.code) {
            errors.push(issue('methodology_profile_mismatch', 'methodologyConfig.primary', 'La referencia no coincide con el MethodologyProfile proporcionado.'));
            return;
        }
        if (!profile.suitableLevels.includes(container.identity.level)) {
            warnings.push(issue('methodology_level', 'methodologyConfig.primary', `La metodología no está recomendada actualmente para ${container.identity.level}.`));
        }
        [...profile.fieldRules, ...profile.sequenceRules].forEach(rule => {
            if (!ruleTriggered(container, rule)) return;
            const target = rule.severity === 'warning' ? warnings : suggestions;
            target.push(issue(rule.id, rule.path, rule.message));
        });
    }

    function validate(container, options = {}) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        if (!isObject(container)) return { valid: false, errors: [issue('invalid_document', '', 'PlanningContainer debe ser un objeto.')], warnings, suggestions };
        if (container.schemaVersion !== '2.0') errors.push(issue('schema_version', 'schemaVersion', 'schemaVersion debe ser "2.0".'));
        if (!ID.test(container.id || '')) errors.push(issue('invalid_id', 'id', 'id debe ser un identificador estable.'));
        if (!Number.isInteger(container.revision) || container.revision < 1) errors.push(issue('invalid_revision', 'revision', 'revision debe ser positiva.'));
        if (!STATUSES.has(container.status)) errors.push(issue('invalid_status', 'status', 'status no es reconocido.'));

        const identity = container.identity;
        if (!isObject(identity)) errors.push(issue('required', 'identity', 'identity es requerido.'));
        else {
            if (!TYPES.has(identity.planningType)) errors.push(issue('invalid_type', 'identity.planningType', 'Tipo de planificación no reconocido.'));
            if (!LEVELS.has(identity.level)) errors.push(issue('invalid_level', 'identity.level', 'Nivel no reconocido.'));
            if (!isObject(identity.duration) || !Number.isInteger(identity.duration.value) || identity.duration.value < 0) errors.push(issue('invalid_duration', 'identity.duration', 'Duración inválida.'));
            if (identity.startDate && identity.endDate && identity.endDate < identity.startDate) errors.push(issue('invalid_date_range', 'identity.endDate', 'La fecha final no puede preceder a la inicial.'));
        }
        for (const key of ['administrativeContext', 'learnerContext', 'significantSituation', 'purpose', 'methodologyConfig', 'assessmentPlan', 'audit']) {
            if (!isObject(container[key])) errors.push(issue('required', key, `${key} es requerido.`));
        }
        for (const key of ['curriculumMap', 'transversalElements', 'milestones', 'sequence', 'resources', 'bibliography']) {
            if (!Array.isArray(container[key])) errors.push(issue('required_list', key, `${key} debe ser una lista.`));
        }
        if (errors.some(item => ['required', 'required_list'].includes(item.code))) return { valid: false, errors, warnings, suggestions };

        const primary = container.methodologyConfig.primary;
        if (primary !== null && (!isObject(primary) || !ID.test(primary.profileId || '') || !METHODOLOGIES.has(primary.code))) {
            errors.push(issue('invalid_methodology', 'methodologyConfig.primary', 'La metodología principal no es válida.'));
        }
        if (primary?.code === 'custom' && !isObject(container.methodologyConfig.custom)) {
            errors.push(issue('custom_config_required', 'methodologyConfig.custom', 'La metodología custom requiere configuración propia.'));
        }

        const curriculumIds = addDuplicateErrors(container.curriculumMap, 'curriculumMap', errors);
        const competencyIds = new Set();
        const capacityIds = new Set();
        const criterionIds = new Set();
        container.curriculumMap.forEach((entry, index) => {
            if (!ID.test(entry?.area?.id || '') || !isText(entry?.area?.officialName)) errors.push(issue('invalid_area', `curriculumMap[${index}].area`, 'Referencia de área inválida.'));
            if (!ID.test(entry?.competency?.id || '') || !isText(entry?.competency?.officialName)) errors.push(issue('invalid_competency', `curriculumMap[${index}].competency`, 'Referencia de competencia inválida.'));
            if (entry?.competency?.id) competencyIds.add(entry.competency.id);
            if (!Array.isArray(entry?.capacities) || !Array.isArray(entry?.criteria) || !Array.isArray(entry?.expectedEvidence)) {
                errors.push(issue('invalid_curriculum_map', `curriculumMap[${index}]`, 'Capacidades, criterios y evidencias deben ser listas.'));
                return;
            }
            entry.capacities.forEach(capacity => capacityIds.add(capacity.id));
            entry.criteria.forEach(criterion => criterionIds.add(criterion.id));
        });

        const milestoneIds = addDuplicateErrors(container.milestones, 'milestones', errors);
        const sequenceIds = addDuplicateErrors(container.sequence, 'sequence', errors);
        const indexes = new Set();
        container.sequence.forEach((item, index) => {
            const path = `sequence[${index}]`;
            if (!Number.isInteger(item?.index) || item.index < 1 || indexes.has(item.index)) errors.push(issue('invalid_sequence_index', `${path}.index`, 'El índice debe ser positivo y único.'));
            indexes.add(item?.index);
            if (!ITEM_TYPES.has(item?.type)) errors.push(issue('invalid_sequence_type', `${path}.type`, 'Tipo de elemento no reconocido.'));
            if (item?.milestoneId !== null && !milestoneIds.has(item.milestoneId)) errors.push(issue('unknown_milestone', `${path}.milestoneId`, 'El hito referenciado no existe.'));
            for (const [key, allowed] of [['curriculumMapRefs', curriculumIds], ['competencyRefs', competencyIds], ['capacityRefs', capacityIds], ['criterionRefs', criterionIds]]) {
                if (!Array.isArray(item?.[key]) || item[key].some(ref => !allowed.has(ref))) errors.push(issue('unknown_reference', `${path}.${key}`, 'Contiene referencias desconocidas.'));
            }
        });
        const ordered = [...indexes].sort((a, b) => a - b);
        if (ordered.some((value, index) => value !== index + 1)) errors.push(issue('sequence_gap', 'sequence', 'Los índices deben ser continuos y comenzar en 1.'));
        container.milestones.forEach((milestone, index) => {
            if (!Array.isArray(milestone?.sequenceItemIds) || milestone.sequenceItemIds.some(ref => !sequenceIds.has(ref))) errors.push(issue('unknown_sequence_item', `milestones[${index}].sequenceItemIds`, 'El hito referencia elementos inexistentes.'));
        });
        if (container.finalProduct && (!Array.isArray(container.finalProduct.criterionRefs) || container.finalProduct.criterionRefs.some(ref => !criterionIds.has(ref)))) {
            errors.push(issue('unknown_criterion', 'finalProduct.criterionRefs', 'El producto final contiene criterios desconocidos.'));
        }

        const requireComplete = options.forReview === true || container.status === 'reviewed';
        if (requireComplete) {
            const requiredValues = [
                ['identity.title', identity?.title], ['identity.cycle', identity?.cycle],
                ['significantSituation.context', container.significantSituation.context],
                ['significantSituation.problemOrOpportunity', container.significantSituation.problemOrOpportunity],
                ['drivingQuestion', container.drivingQuestion], ['purpose.summary', container.purpose.summary]
            ];
            requiredValues.forEach(([path, value]) => { if (!isText(value)) errors.push(issue('review_required', path, 'Este campo es necesario para revisar la planificación.')); });
            if (!Number.isInteger(identity?.duration?.value) || identity.duration.value < 1) errors.push(issue('review_required', 'identity.duration', 'Define una duración positiva.'));
            if (!primary) errors.push(issue('review_required', 'methodologyConfig.primary', 'Selecciona una metodología principal.'));
            if (container.curriculumMap.length === 0) errors.push(issue('review_required', 'curriculumMap', 'Agrega al menos una relación curricular.'));
            if (container.sequence.length === 0) errors.push(issue('review_required', 'sequence', 'Agrega al menos un elemento de secuencia.'));
            if (criterionIds.size === 0) errors.push(issue('review_required', 'curriculumMap.criteria', 'Agrega criterios de evaluación.'));
        }

        applyMethodologyRules(container, options.methodologyProfile, errors, warnings, suggestions);
        return { valid: errors.length === 0, errors, warnings, suggestions };
    }

    function emptyDraft(id, now) {
        return {
            schemaVersion: '2.0', id, revision: 1, status: 'draft',
            identity: { title: '', planningType: 'unit', level: 'secondary', cycle: '', grade: null, age: null, startDate: null, endDate: null, duration: { value: 0, unit: 'weeks' } },
            administrativeContext: { institution: '', dre: '', ugel: '', teacher: '', director: '', sections: [] },
            learnerContext: { students: '', diagnosis: '', interests: [], localContext: '' },
            significantSituation: { context: '', problemOrOpportunity: '', affectedActors: [], relevance: '', studentRole: '', expectedResponse: '' },
            drivingQuestion: '', purpose: { summary: '', what: '', why: '', context: '' },
            methodologyConfig: { primary: null, supportingStrategies: [], custom: null, challenge: null },
            curriculumMap: [], transversalElements: [], finalProduct: null, milestones: [], sequence: [],
            assessmentPlan: { formativeAssessment: '', feedbackApproach: '', selfAssessment: '', peerAssessment: '', teacherAssessment: '', recommendedInstruments: [] },
            resources: [], bibliography: [], audit: { createdAt: now, updatedAt: now }
        };
    }

    function createDraft(input, now = new Date().toISOString()) {
        if (!ID.test(input?.id || '')) throw new TypeError('createDraft requiere un id estable.');
        const draft = deepMerge(emptyDraft(input.id, now), input);
        draft.schemaVersion = '2.0'; draft.id = input.id; draft.revision = 1; draft.status = 'draft';
        draft.audit = { createdAt: now, updatedAt: now };
        const result = validate(draft);
        if (!result.valid) throw new TypeError(`PlanningContainer 2.0 inválido: ${result.errors.map(item => item.message).join(' ')}`);
        return draft;
    }

    function revise(container, changes, now = new Date().toISOString(), options = {}) {
        const current = validate(container);
        if (!current.valid) throw new TypeError('No se puede revisar un PlanningContainer inválido.');
        if (container.status === 'archived') throw new Error('Una planificación archivada no puede revisarse.');
        const next = deepMerge(container, changes || {});
        next.schemaVersion = '2.0'; next.id = container.id; next.revision = container.revision + 1;
        next.audit = { createdAt: container.audit.createdAt, updatedAt: now };
        const result = validate(next, options);
        if (!result.valid) throw new TypeError(`Revisión inválida: ${result.errors.map(item => item.message).join(' ')}`);
        return next;
    }

    function createInheritedContextSnapshot(container, sequenceItemId, capturedAt = new Date().toISOString()) {
        const result = validate(container);
        if (!result.valid) throw new TypeError('No se puede vincular una planificación inválida.');
        const item = container.sequence.find(entry => entry.id === sequenceItemId);
        if (!item) throw new Error(`No existe sequenceItemId "${sequenceItemId}".`);
        const milestone = item.milestoneId ? container.milestones.find(entry => entry.id === item.milestoneId) : null;
        const refs = new Set(item.curriculumMapRefs);
        return deepFreeze(clone({
            schemaVersion: '2.0', planningContainerId: container.id, planningRevision: container.revision,
            sequenceItemId: item.id, sequenceIndex: item.index, capturedAt,
            identity: container.identity, administrativeContext: container.administrativeContext,
            learnerContext: container.learnerContext, significantSituation: container.significantSituation,
            drivingQuestion: container.drivingQuestion, purpose: container.purpose,
            methodologyConfig: container.methodologyConfig,
            curriculumMap: container.curriculumMap.filter(entry => refs.has(entry.id)),
            transversalElements: container.transversalElements, finalProduct: container.finalProduct,
            milestone, sequenceItem: item, assessmentPlan: container.assessmentPlan,
            precedingSequence: container.sequence.filter(entry => entry.index < item.index).map(sequenceSummary),
            followingSequence: container.sequence.filter(entry => entry.index > item.index).map(sequenceSummary)
        }));
    }

    function sequenceSummary(item) {
        return { id: item.id, index: item.index, type: item.type, title: item.title, milestoneId: item.milestoneId, status: item.status };
    }

    function createLinkedSessionLink(container, sequenceItemId, capturedAt) {
        const snapshot = createInheritedContextSnapshot(container, sequenceItemId, capturedAt);
        return deepFreeze({
            linkVersion: '2.0', mode: 'linked', planningContainerId: container.id,
            planningRevision: container.revision, sequenceItemId,
            sequenceIndex: snapshot.sequenceIndex, inheritedContextSnapshot: snapshot
        });
    }

    function createStandaloneLink() {
        return deepFreeze({ linkVersion: '2.0', mode: 'standalone', planningContainerId: null, planningRevision: null, sequenceItemId: null, sequenceIndex: null, inheritedContextSnapshot: null });
    }

    function validateSessionLink(link) {
        const errors = [];
        if (!isObject(link) || link.linkVersion !== '2.0' || !['standalone', 'linked'].includes(link.mode)) {
            return { valid: false, errors: [issue('invalid_link', '', 'El vínculo 2.0 no es válido.')] };
        }
        const fields = ['planningContainerId', 'planningRevision', 'sequenceItemId', 'sequenceIndex', 'inheritedContextSnapshot'];
        if (link.mode === 'standalone') {
            if (fields.some(field => link[field] !== null)) errors.push(issue('invalid_standalone_link', '', 'Un vínculo standalone no puede contener referencias.'));
        } else {
            const snapshot = link.inheritedContextSnapshot;
            if (!ID.test(link.planningContainerId || '') || !ID.test(link.sequenceItemId || '')) errors.push(issue('invalid_link_id', '', 'El vínculo requiere identificadores estables.'));
            if (!Number.isInteger(link.planningRevision) || link.planningRevision < 1 || !Number.isInteger(link.sequenceIndex) || link.sequenceIndex < 1) errors.push(issue('invalid_link_revision', '', 'El vínculo requiere revisión e índice positivos.'));
            if (!isObject(snapshot)
                || snapshot.planningContainerId !== link.planningContainerId
                || snapshot.planningRevision !== link.planningRevision
                || snapshot.sequenceItemId !== link.sequenceItemId
                || snapshot.sequenceIndex !== link.sequenceIndex) {
                errors.push(issue('snapshot_mismatch', 'inheritedContextSnapshot', 'El snapshot no coincide con el vínculo.'));
            }
        }
        return { valid: errors.length === 0, errors };
    }

    function attachSessionLink(sessionEnvelope, link) {
        if (!isObject(sessionEnvelope) || !isText(sessionEnvelope.id)) throw new TypeError('La sesión requiere id.');
        const result = validateSessionLink(link);
        if (!result.valid) throw new TypeError(result.errors.map(item => item.message).join(' '));
        return { ...clone(sessionEnvelope), planning: clone(link) };
    }

    return { validate, validateSessionLink, createDraft, revise, createInheritedContextSnapshot, createLinkedSessionLink, createStandaloneLink, attachSessionLink };
})();

if (typeof window !== 'undefined') window.PlanningContainerV2 = PlanningContainerV2;
if (typeof module !== 'undefined' && module.exports) module.exports = PlanningContainerV2;
