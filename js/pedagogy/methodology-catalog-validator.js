/** Validates declarative MethodologyProfile catalogs without runtime dependencies. */
const MethodologyCatalogValidator = (() => {
    'use strict';

    const CODES = new Set([
        'project_based_learning', 'problem_based_learning',
        'challenge_based_learning', 'game_based_learning', 'custom'
    ]);
    const LEVELS = new Set(['initial', 'primary', 'secondary']);
    const STATUSES = new Set(['draft', 'pilot', 'reviewed', 'archived']);
    const SEVERITIES = new Set(['warning', 'suggestion']);
    const OPERATORS = new Set(['non_empty', 'sequence_type_present', 'milestone_phase_present', 'milestone_partial_product_present', 'always']);
    const HOSTS = new Set([
        'minedu.gob.pe', 'www.minedu.gob.pe', 'repositorio.minedu.gob.pe', 'descargas.intef.es',
        'intef.es', 'www.challengebasedlearning.org'
    ]);
    const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    const isText = value => typeof value === 'string' && value.trim().length > 0;

    function validateSources(registry) {
        const errors = [];
        const sourceIds = new Set();
        if (!isObject(registry) || registry.schemaVersion !== '1.0') errors.push('sources.schemaVersion debe ser "1.0".');
        if (!Array.isArray(registry?.sources)) return { valid: false, errors: [...errors, 'sources debe ser una lista.'], sourceIds };
        registry.sources.forEach((source, index) => {
            const path = `sources[${index}]`;
            if (!ID.test(source?.id || '') || sourceIds.has(source.id)) errors.push(`${path}.id no es válido o está duplicado.`);
            else sourceIds.add(source.id);
            if (!isText(source?.title) || !isText(source?.publisher)) errors.push(`${path} requiere title y publisher.`);
            if (source?.year !== null && !Number.isInteger(source?.year)) errors.push(`${path}.year debe ser entero o null si no está publicado.`);
            try {
                const url = new URL(source.url);
                if (url.protocol !== 'https:' || !HOSTS.has(url.hostname)) errors.push(`${path}.url no pertenece a una fuente admitida.`);
            } catch { errors.push(`${path}.url no es válida.`); }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(source?.accessedAt || '')) errors.push(`${path}.accessedAt debe usar YYYY-MM-DD.`);
        });
        return { valid: errors.length === 0, errors, sourceIds };
    }

    function validateRules(rules, path, errors) {
        if (!Array.isArray(rules)) {
            errors.push(`${path} debe ser una lista.`);
            return;
        }
        const ids = new Set();
        rules.forEach((rule, index) => {
            const rulePath = `${path}[${index}]`;
            if (!ID.test(rule?.id || '') || ids.has(rule.id)) errors.push(`${rulePath}.id no es válido o está duplicado.`);
            else ids.add(rule.id);
            if (!isText(rule?.path) || !isText(rule?.message)) errors.push(`${rulePath} requiere path y message.`);
            if (!OPERATORS.has(rule?.operator)) errors.push(`${rulePath}.operator no es reconocido.`);
            if (['sequence_type_present', 'milestone_phase_present'].includes(rule?.operator) && !isText(rule?.value)) {
                errors.push(`${rulePath}.value es requerido por el operador.`);
            }
            if (!SEVERITIES.has(rule?.severity)) errors.push(`${rulePath}.severity no es reconocida.`);
        });
    }

    function validateProfile(profile, sourceIds = new Set()) {
        const errors = [];
        const warnings = [];
        if (!isObject(profile)) return { valid: false, errors: ['El perfil debe ser un objeto.'], warnings };
        if (profile.schemaVersion !== '1.0') errors.push('schemaVersion debe ser "1.0".');
        if (!/^\d{4}\.\d+$/.test(profile.profileVersion || '')) errors.push('profileVersion debe usar YYYY.N.');
        if (!ID.test(profile.id || '')) errors.push('id no es válido.');
        if (!CODES.has(profile.code)) errors.push('code no es reconocido.');
        if (!isText(profile.displayName) || !isText(profile.description)) errors.push('displayName y description son requeridos.');
        if (!STATUSES.has(profile.status)) errors.push('status no es reconocido.');
        if (!Array.isArray(profile.suitableScopes) || profile.suitableScopes.length === 0) {
            errors.push('suitableScopes debe contener al menos un alcance.');
        } else {
            const scopeKeys = new Set();
            profile.suitableScopes.forEach((scope, index) => {
                const path = `suitableScopes[${index}]`;
                if (!isObject(scope) || !LEVELS.has(scope.level)) errors.push(`${path}.level no es reconocido.`);
                if (!Array.isArray(scope?.cycles) || scope.cycles.length === 0 || scope.cycles.some(cycle => !isText(cycle))) {
                    errors.push(`${path}.cycles debe contener ciclos válidos.`);
                    return;
                }
                if (new Set(scope.cycles).size !== scope.cycles.length) errors.push(`${path}.cycles contiene duplicados.`);
                const key = `${scope.level}:${[...scope.cycles].sort().join(',')}`;
                if (scopeKeys.has(key)) errors.push(`${path} está duplicado.`);
                scopeKeys.add(key);
            });
        }
        if (!Array.isArray(profile.recommendedPhases)) errors.push('recommendedPhases debe ser una lista.');
        else {
            const phaseIds = new Set();
            profile.recommendedPhases.forEach((phase, index) => {
                if (!ID.test(phase?.id || '') || phaseIds.has(phase.id)) errors.push(`recommendedPhases[${index}].id no es válido o está duplicado.`);
                else phaseIds.add(phase.id);
                if (!isText(phase?.label) || !isText(phase?.purpose) || phase?.mode !== 'recommended') errors.push(`recommendedPhases[${index}] no es una recomendación válida.`);
            });
        }
        validateRules(profile.fieldRules, 'fieldRules', errors);
        validateRules(profile.sequenceRules, 'sequenceRules', errors);
        if (!Array.isArray(profile.assessmentRecommendations)) errors.push('assessmentRecommendations debe ser una lista.');
        if (!isObject(profile.promptRules)
            || !Array.isArray(profile.promptRules.prioritize) || profile.promptRules.prioritize.length === 0
            || !Array.isArray(profile.promptRules.avoid) || profile.promptRules.avoid.length === 0) {
            errors.push('promptRules requiere prioritize y avoid.');
        }
        if (!isObject(profile.provenance) || !Array.isArray(profile.provenance.sourceRefs) || !isText(profile.provenance.reviewNote)) {
            errors.push('provenance requiere sourceRefs y reviewNote.');
        } else {
            profile.provenance.sourceRefs.forEach(ref => {
                if (!sourceIds.has(ref)) errors.push(`provenance contiene una fuente desconocida: "${ref}".`);
            });
        }
        if (profile.code !== 'custom' && profile.recommendedPhases.length === 0) errors.push('Una metodología predefinida requiere fases recomendadas.');
        if (profile.status !== 'reviewed') warnings.push('El perfil requiere revisión pedagógica humana antes de marcarse como reviewed.');
        return { valid: errors.length === 0, errors, warnings };
    }

    function validateCatalog(catalog, profilesByPath, sourceIds) {
        const errors = [];
        const ids = new Set();
        const codes = new Set();
        if (catalog?.schemaVersion !== '1.0' || !Array.isArray(catalog?.profiles)) return { valid: false, errors: ['El catálogo no es válido.'] };
        catalog.profiles.forEach((entry, index) => {
            if (!ID.test(entry?.id || '') || ids.has(entry.id)) errors.push(`profiles[${index}].id no es válido o está duplicado.`);
            ids.add(entry.id);
            if (!/^[a-z0-9_]+\.json$/.test(entry?.path || '')) errors.push(`profiles[${index}].path no es seguro.`);
            const profile = profilesByPath[entry.path];
            if (!profile) errors.push(`No existe ${entry.path}.`);
            else {
                if (profile.id !== entry.id) errors.push(`${entry.path} no coincide con el id del catálogo.`);
                if (codes.has(profile.code)) errors.push(`code duplicado: ${profile.code}.`);
                codes.add(profile.code);
                errors.push(...validateProfile(profile, sourceIds).errors.map(error => `${entry.path}: ${error}`));
            }
        });
        return { valid: errors.length === 0, errors };
    }

    function validateRootCatalog(catalog, profilesByPath, sourceIds) {
        const errors = [];
        const ids = new Set();
        const codes = new Set();
        if (catalog?.schemaVersion !== '2.0' || !Array.isArray(catalog?.methodologyProfiles)) {
            return { valid: false, errors: ['El catálogo raíz no es válido.'] };
        }
        catalog.methodologyProfiles.forEach((entry, index) => {
            const path = `methodologyProfiles[${index}]`;
            if (!ID.test(entry?.id || '') || ids.has(entry.id)) errors.push(`${path}.id no es válido o está duplicado.`);
            ids.add(entry.id);
            if (!/^methodologies\/[a-z0-9_]+\.json$/.test(entry?.path || '') || entry.path.includes('..')) errors.push(`${path}.path no es seguro.`);
            const profile = profilesByPath[entry.path];
            if (!profile) errors.push(`No existe ${entry.path}.`);
            else {
                if (profile.id !== entry.id) errors.push(`${entry.path} no coincide con el id del catálogo.`);
                if (codes.has(profile.code)) errors.push(`code duplicado: ${profile.code}.`);
                codes.add(profile.code);
                errors.push(...validateProfile(profile, sourceIds).errors.map(error => `${entry.path}: ${error}`));
            }
        });
        return { valid: errors.length === 0, errors };
    }

    return { validateSources, validateProfile, validateCatalog: validateRootCatalog };
})();

if (typeof window !== 'undefined') window.MethodologyCatalogValidator = MethodologyCatalogValidator;
if (typeof module !== 'undefined' && module.exports) module.exports = MethodologyCatalogValidator;
