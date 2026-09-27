/** Composes independent pedagogical, didactic and methodology profiles. */
const PedagogicalContextResolver = (() => {
    'use strict';
    const clone = value => JSON.parse(JSON.stringify(value));
    const freeze = value => {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
        Object.freeze(value); Object.values(value).forEach(freeze); return value;
    };
    const ref = profile => ({ id: profile.id, profileVersion: profile.profileVersion, status: profile.status });

    function isMethodologySuitable(profile, level, cycle) {
        return Array.isArray(profile?.suitableScopes) && profile.suitableScopes.some(scope =>
            scope?.level === level && Array.isArray(scope.cycles) && scope.cycles.includes(cycle)
        );
    }

    function resolve(input, catalogs) {
        const errors = [];
        const warnings = [];
        const pedagogical = (catalogs?.pedagogicalProfiles || []).find(profile =>
            profile.scope.level === input.level
            && profile.scope.cycle === input.cycle
            && (profile.scope.grades.length === 0 || profile.scope.grades.includes(String(input.grade)))
        );
        const didactic = (catalogs?.didacticProfiles || []).find(profile =>
            profile.scope.level === input.level
            && profile.scope.cycle === input.cycle
            && profile.scope.area.id === input.area
            && profile.scope.competency.id === input.competency
        );
        const methodology = (catalogs?.methodologyProfiles || []).find(profile => profile.code === input.methodology);

        if (!pedagogical) errors.push({ code: 'pedagogical_profile_not_found', message: 'No existe un perfil para el nivel, ciclo y grado.' });
        if (!didactic) errors.push({ code: 'didactic_profile_not_found', message: 'No existe un perfil para el área y competencia.' });
        if (!methodology) errors.push({ code: 'methodology_profile_not_found', message: 'No existe el perfil metodológico solicitado.' });
        if (errors.length > 0) return { resolved: false, errors, warnings, context: null };

        if (!pedagogical.allowedPlanningTypes.includes(input.planningType)) {
            warnings.push({ code: 'planning_type_not_recommended', message: 'El tipo de planificación no está recomendado actualmente por el perfil pedagógico.' });
        }
        if (!isMethodologySuitable(methodology, input.level, input.cycle)) {
            warnings.push({ code: 'methodology_scope_not_recommended', message: 'La metodología no está recomendada actualmente para este nivel y ciclo.' });
        }
        for (const profile of [pedagogical, didactic, methodology]) {
            if (profile.status !== 'reviewed') warnings.push({ code: 'profile_requires_review', profileId: profile.id, message: `El perfil ${profile.id} todavía es piloto.` });
        }

        const context = freeze(clone({
            curriculumContext: {
                level: input.level, cycle: input.cycle, grade: String(input.grade),
                area: didactic.scope.area, competency: didactic.scope.competency,
                capacities: didactic.scope.capacities,
                curricularSourceRefs: didactic.provenance.sourceRefs
            },
            planningType: input.planningType,
            profiles: {
                pedagogical: ref(pedagogical), didactic: ref(didactic), methodology: ref(methodology)
            },
            pedagogicalGuidance: {
                activityCharacteristics: pedagogical.activityCharacteristics,
                recommendedStructure: pedagogical.recommendedStructure,
                assessmentCharacteristics: pedagogical.assessmentCharacteristics,
                promptRules: pedagogical.promptRules
            },
            didacticGuidance: {
                approach: didactic.approach,
                recommendedStrategies: didactic.recommendedStrategies,
                assessmentRecommendations: didactic.assessmentRecommendations,
                promptRules: didactic.promptRules
            },
            methodologyGuidance: {
                code: methodology.code,
                recommendedPhases: methodology.recommendedPhases,
                fieldRules: methodology.fieldRules,
                sequenceRules: methodology.sequenceRules,
                assessmentRecommendations: methodology.assessmentRecommendations,
                promptRules: methodology.promptRules
            }
        }));
        return { resolved: true, errors, warnings, context };
    }

    return { resolve, isMethodologySuitable };
})();

if (typeof window !== 'undefined') window.PedagogicalContextResolver = PedagogicalContextResolver;
if (typeof module !== 'undefined' && module.exports) module.exports = PedagogicalContextResolver;
