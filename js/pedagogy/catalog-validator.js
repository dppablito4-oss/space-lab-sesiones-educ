/** Validates versioned PedagogicalProfile records without runtime dependencies. */
const PedagogyCatalogValidator = (() => {
    'use strict';

    const LEVELS = new Set(['initial', 'primary', 'secondary']);
    const STATUSES = new Set(['draft', 'pilot', 'reviewed', 'archived']);
    const PLANNING_TYPES = new Set(['learning_experience', 'unit', 'project', 'context']);
    const DOCUMENT_KINDS = new Set([
        'session_document_v1',
        'initial_activity_document_v1',
        'context_planning_document_v1'
    ]);
    const SOURCE_KINDS = new Set(['normative_curriculum', 'official_guidance']);
    const OFFICIAL_SOURCE_HOSTS = new Set(['minedu.gob.pe', 'www.minedu.gob.pe', 'repositorio.minedu.gob.pe']);
    const STABLE_ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
    const KEBAB_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    function isObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function validateSources(registry) {
        const errors = [];
        if (!isObject(registry) || registry.schemaVersion !== '1.0') {
            errors.push('sources.schemaVersion debe ser "1.0".');
        }
        if (!Array.isArray(registry?.sources) || registry.sources.length === 0) {
            errors.push('sources debe contener al menos una fuente oficial.');
            return { valid: false, errors, sourceIds: new Set() };
        }

        const sourceIds = new Set();
        registry.sources.forEach((source, index) => {
            const path = `sources[${index}]`;
            if (!isObject(source)) {
                errors.push(`${path} debe ser un objeto.`);
                return;
            }
            if (!KEBAB_ID.test(source.id || '')) errors.push(`${path}.id debe ser un identificador estable.`);
            if (sourceIds.has(source.id)) errors.push(`${path}.id está duplicado: "${source.id}".`);
            sourceIds.add(source.id);
            if (!source.title || !source.publisher) errors.push(`${path} requiere title y publisher.`);
            if (!Number.isInteger(source.year) || source.year < 2000) errors.push(`${path}.year no es válido.`);
            if (!SOURCE_KINDS.has(source.sourceKind)) errors.push(`${path}.sourceKind no es reconocido.`);
            try {
                const url = new URL(source.url);
                if (url.protocol !== 'https:' || !OFFICIAL_SOURCE_HOSTS.has(url.hostname)) {
                    errors.push(`${path}.url debe apuntar por HTTPS a un dominio oficial de MINEDU.`);
                }
            } catch {
                errors.push(`${path}.url no es una URL válida.`);
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedAt || '')) {
                errors.push(`${path}.accessedAt debe usar YYYY-MM-DD.`);
            }
        });
        return { valid: errors.length === 0, errors, sourceIds };
    }

    function validateCurriculumReference(reference, path, errors) {
        if (!isObject(reference)) {
            errors.push(`${path} debe ser un objeto.`);
            return;
        }
        if (!KEBAB_ID.test(reference.id || '')) errors.push(`${path}.id debe usar kebab-case.`);
        if (!reference.officialName || typeof reference.officialName !== 'string') {
            errors.push(`${path}.officialName es requerido.`);
        }
    }

    function validateSourceRefs(refs, path, sourceIds, errors) {
        if (!Array.isArray(refs) || refs.length === 0) {
            errors.push(`${path} debe contener referencias de fuente.`);
            return;
        }
        refs.forEach(ref => {
            if (!sourceIds.has(ref)) errors.push(`${path} contiene una fuente desconocida: "${ref}".`);
        });
    }

    function validateRecommendations(group, path, sourceIds, errors) {
        if (!isObject(group) || group.classification !== 'space_lab_recommendation') {
            errors.push(`${path}.classification debe ser "space_lab_recommendation".`);
            return;
        }
        if (!Array.isArray(group.recommendations) || group.recommendations.length === 0) {
            errors.push(`${path}.recommendations no puede estar vacío.`);
        } else {
            group.recommendations.forEach((item, index) => {
                const itemPath = `${path}.recommendations[${index}]`;
                if (!isObject(item) || !KEBAB_ID.test(item.id || '')) errors.push(`${itemPath}.id no es válido.`);
                if (!item?.label || !item?.purpose) errors.push(`${itemPath} requiere label y purpose.`);
                if (item?.mode !== 'recommended') errors.push(`${itemPath}.mode debe ser "recommended".`);
            });
        }
        validateSourceRefs(group.sourceRefs, `${path}.sourceRefs`, sourceIds, errors);
    }

    function validateProfile(profile, sourceIds = new Set()) {
        const errors = [];
        const warnings = [];
        if (!isObject(profile)) return { valid: false, errors: ['El perfil debe ser un objeto.'], warnings };
        if (profile.schemaVersion !== '1.0') errors.push('schemaVersion debe ser "1.0".');
        if (!/^\d{4}\.\d+$/.test(profile.profileVersion || '')) errors.push('profileVersion debe usar YYYY.N.');
        if (!STABLE_ID.test(profile.id || '')) errors.push('id debe ser estable y usar minúsculas.');
        if (!STATUSES.has(profile.status)) errors.push('status no es reconocido.');

        const scope = profile.scope;
        if (!isObject(scope)) {
            errors.push('scope es requerido.');
        } else {
            if (!LEVELS.has(scope.level)) errors.push('scope.level no es reconocido.');
            if (!scope.cycle) errors.push('scope.cycle es requerido.');
            if (!Array.isArray(scope.grades) || scope.grades.length === 0) errors.push('scope.grades no puede estar vacío.');
            validateCurriculumReference(scope.area, 'scope.area', errors);
            validateCurriculumReference(scope.competency, 'scope.competency', errors);
            if (!Array.isArray(scope.competency?.capacities) || scope.competency.capacities.length === 0) {
                errors.push('scope.competency.capacities no puede estar vacío.');
            } else {
                scope.competency.capacities.forEach((capacity, index) => {
                    validateCurriculumReference(capacity, `scope.competency.capacities[${index}]`, errors);
                });
            }
        }

        const planning = profile.planning;
        if (!isObject(planning)) {
            errors.push('planning es requerido.');
        } else {
            if (!Array.isArray(planning.allowedTypes) || planning.allowedTypes.length === 0) {
                errors.push('planning.allowedTypes no puede estar vacío.');
            } else if (planning.allowedTypes.some(type => !PLANNING_TYPES.has(type))) {
                errors.push('planning.allowedTypes contiene un tipo no reconocido.');
            }
            if (!DOCUMENT_KINDS.has(planning.sequenceDocumentKind)) {
                errors.push('planning.sequenceDocumentKind no es reconocido.');
            }
            if (typeof planning.supportsMultipleAreas !== 'boolean') {
                errors.push('planning.supportsMultipleAreas debe ser booleano.');
            }
        }

        validateRecommendations(profile.pedagogicalProcessProfile, 'pedagogicalProcessProfile', sourceIds, errors);
        validateRecommendations(profile.assessmentProfile, 'assessmentProfile', sourceIds, errors);

        const didactic = profile.didacticProfile;
        if (!isObject(didactic)) {
            errors.push('didacticProfile es requerido.');
        } else {
            if (!didactic.approach) errors.push('didacticProfile.approach es requerido.');
            if (didactic.sequencePolicy !== 'adaptive') errors.push('didacticProfile.sequencePolicy debe ser "adaptive".');
            if (didactic.stepsAreMandatory !== false) errors.push('didacticProfile.stepsAreMandatory debe ser false.');
            validateRecommendations({
                classification: 'space_lab_recommendation',
                recommendations: didactic.strategies,
                sourceRefs: didactic.sourceRefs
            }, 'didacticProfile', sourceIds, errors);
        }

        const promptRules = profile.promptRules;
        if (!isObject(promptRules) || promptRules.classification !== 'space_lab_recommendation') {
            errors.push('promptRules debe declarar clasificación interna.');
        } else {
            for (const key of ['prioritize', 'avoid']) {
                if (!Array.isArray(promptRules[key]) || promptRules[key].length === 0) {
                    errors.push(`promptRules.${key} no puede estar vacío.`);
                }
            }
        }

        const provenance = profile.provenance;
        if (!isObject(provenance)) {
            errors.push('provenance es requerido.');
        } else {
            validateSourceRefs(provenance.curriculumSourceRefs, 'provenance.curriculumSourceRefs', sourceIds, errors);
            validateSourceRefs(provenance.guidanceSourceRefs, 'provenance.guidanceSourceRefs', sourceIds, errors);
            if (!provenance.reviewNote) errors.push('provenance.reviewNote es requerido.');
        }

        if (profile.status !== 'reviewed') {
            warnings.push('El perfil todavía requiere revisión pedagógica humana.');
        }
        return { valid: errors.length === 0, errors, warnings };
    }

    function validateCatalog(catalog, profilesByPath) {
        const errors = [];
        if (!isObject(catalog) || catalog.schemaVersion !== '1.0') errors.push('catalog.schemaVersion debe ser "1.0".');
        if (!Array.isArray(catalog?.profiles) || catalog.profiles.length === 0) {
            errors.push('catalog.profiles no puede estar vacío.');
            return { valid: false, errors };
        }
        const ids = new Set();
        catalog.profiles.forEach((entry, index) => {
            const path = `catalog.profiles[${index}]`;
            if (!STABLE_ID.test(entry.id || '')) errors.push(`${path}.id no es válido.`);
            if (ids.has(entry.id)) errors.push(`${path}.id está duplicado.`);
            ids.add(entry.id);
            if (!/^[a-z0-9/-]+\.json$/.test(entry.path || '') || entry.path.includes('..')) {
                errors.push(`${path}.path no es seguro.`);
            }
            const profile = profilesByPath[entry.path];
            if (!profile) errors.push(`${path}.path no existe: "${entry.path}".`);
            else if (profile.id !== entry.id) errors.push(`${path}.id no coincide con el perfil.`);
        });
        return { valid: errors.length === 0, errors };
    }

    return { validateSources, validateProfile, validateCatalog };
})();

if (typeof window !== 'undefined') window.PedagogyCatalogValidator = PedagogyCatalogValidator;
if (typeof module !== 'undefined' && module.exports) module.exports = PedagogyCatalogValidator;
