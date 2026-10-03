/** Composes independent pedagogical, didactic and methodology profiles. */
const PedagogicalContextResolver = (() => {
    'use strict';
    const clone = value => JSON.parse(JSON.stringify(value));
    const freeze = value => {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
        Object.freeze(value); Object.values(value).forEach(freeze); return value;
    };
    const ref = profile => ({ id: profile.id, profileVersion: profile.profileVersion, status: profile.status });
    const SECONDARY_CYCLES = Object.freeze({ '1': 'VI', '2': 'VI', '3': 'VII', '4': 'VII', '5': 'VII' });

    function resolveSecondaryCycle(grade) {
        const normalized = grade === null || grade === undefined ? '' : String(grade).trim();
        const cycle = SECONDARY_CYCLES[normalized];
        if (!cycle) {
            const error = new RangeError('El grado de secundaria debe estar entre 1 y 5.');
            error.code = 'invalid_secondary_grade';
            throw error;
        }
        return cycle;
    }

    function isMethodologySuitable(profile, level, cycle) {
        return Array.isArray(profile?.suitableScopes) && profile.suitableScopes.some(scope =>
            scope?.level === level && Array.isArray(scope.cycles) && scope.cycles.includes(cycle)
        );
    }

    function resolve(input, catalogs) {
        const errors = [];
        const warnings = [];
        let cycle = input?.cycle;
        if (input?.level === 'secondary') {
            try { cycle = resolveSecondaryCycle(input.grade); }
            catch (error) {
                return { resolved: false, errors: [{ code: error.code, message: error.message }], warnings, context: null };
            }
            if (input.cycle && input.cycle !== cycle) {
                return { resolved: false, errors: [{ code: 'cycle_grade_mismatch', message: `El grado ${input.grade} corresponde al ciclo ${cycle}.` }], warnings, context: null };
            }
        }
        const pedagogical = (catalogs?.pedagogicalProfiles || []).find(profile =>
            profile.scope.level === input.level
            && profile.scope.cycle === cycle
            && (profile.scope.grades.length === 0 || profile.scope.grades.includes(String(input.grade)))
        );
        const matchesArea = (areaObj, target) => {
            if (!areaObj || !target) return false;
            const t = String(target).trim().toLowerCase();
            return areaObj.id.toLowerCase() === t || areaObj.officialName.toLowerCase() === t;
        };
        const matchesCompetency = (comp, target) => {
            if (!comp || !target) return false;
            const t = String(target).trim();
            return comp.id === t || comp.alias === t || comp.officialName === t
                || comp.id === `solves-${t}-problems` || comp.id === t.replace(/^solves-/, '').replace(/-problems$/, '');
        };
        const curriculum = (catalogs?.curriculumProfiles || []).find(profile =>
            profile.scope.level === input.level
            && profile.scope.cycle === cycle
            && profile.scope.grades.includes(String(input.grade))
            && matchesArea(profile.scope.area, input.area)
            && matchesCompetency(profile.competency, input.competency)
        );
        const didactic = (catalogs?.didacticProfiles || []).find(profile =>
            profile.scope.level === input.level
            && profile.scope.cycle === cycle
            && matchesArea(profile.scope.area, input.area)
            && matchesCompetency(profile.scope.competency, input.competency)
        );
        const methodology = (catalogs?.methodologyProfiles || []).find(profile => profile.code === input.methodology);

        if (!pedagogical) errors.push({ code: 'pedagogical_profile_not_found', message: 'No existe un perfil para el nivel, ciclo y grado.' });
        if (!curriculum || !Array.isArray(curriculum.performancesByGrade?.[String(input.grade)])) {
            errors.push({ code: 'curriculum_profile_not_found', message: 'No existe currículo oficial para el nivel, ciclo, área, competencia y grado seleccionados.' });
        }
        if (!didactic) errors.push({ code: 'didactic_profile_not_found', message: 'No existe un perfil para el área y competencia.' });
        if (!methodology) errors.push({ code: 'methodology_profile_not_found', message: 'No existe el perfil metodológico solicitado.' });
        if (errors.length > 0) return { resolved: false, errors, warnings, context: null };

        if (!pedagogical.allowedPlanningTypes.includes(input.planningType)) {
            warnings.push({ code: 'planning_type_not_recommended', message: 'El tipo de planificación no está recomendado actualmente por el perfil pedagógico.' });
        }
        if (!isMethodologySuitable(methodology, input.level, cycle)) {
            warnings.push({ code: 'methodology_scope_not_recommended', message: 'La metodología no está recomendada actualmente para este nivel y ciclo.' });
        }
        for (const profile of [pedagogical, curriculum, didactic, methodology]) {
            if (profile.status !== 'reviewed') warnings.push({ code: 'profile_requires_review', profileId: profile.id, message: `El perfil ${profile.id} todavía es piloto.` });
        }

        const context = freeze(clone({
            curriculumContext: {
                level: input.level, cycle, grade: String(input.grade),
                area: curriculum.scope.area, competency: curriculum.competency,
                capacities: curriculum.capacities,
                standard: curriculum.standard,
                performances: curriculum.performancesByGrade[String(input.grade)],
                curricularSourceRefs: curriculum.provenance.sourceRefs
            },
            planningType: input.planningType,
            profiles: {
                pedagogical: ref(pedagogical), curriculum: ref(curriculum), didactic: ref(didactic), methodology: ref(methodology)
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

    return { resolve, resolveSecondaryCycle, isMethodologySuitable };
})();

if (typeof window !== 'undefined') window.PedagogicalContextResolver = PedagogicalContextResolver;
if (typeof module !== 'undefined' && module.exports) module.exports = PedagogicalContextResolver;
