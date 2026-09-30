/** Builds and validates planning.map.generate requests without persisting AI output. */
const PlanningMapGenerator = (() => {
    'use strict';
    const core = typeof module !== 'undefined' && module.exports
        ? require('./planning-container-v2.js') : window.PlanningContainerV2;
    const TYPES = new Set(['unit', 'project', 'learning_experience']);
    const clone = value => JSON.parse(JSON.stringify(value));

    class PlanningMapError extends Error {
        constructor(code, message, details = []) {
            super(message); this.name = 'PlanningMapError'; this.code = code; this.details = details;
        }
    }

    function object(value, field) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new PlanningMapError('INVALID_INPUT', `${field} debe ser un objeto.`);
        }
        return value;
    }

    function validateInput(input) {
        object(input, 'input');
        if (!TYPES.has(input.planningType)) throw new PlanningMapError('INVALID_INPUT', 'Tipo de planificación no válido.');
        for (const key of ['level', 'cycle', 'grade']) {
            if (typeof input[key] !== 'string' || !input[key].trim()) throw new PlanningMapError('INVALID_INPUT', `${key} es obligatorio.`);
        }
        if (!Array.isArray(input.areas) || input.areas.length === 0) throw new PlanningMapError('INVALID_INPUT', 'Se requiere al menos un área curricular.');
        object(input.duration, 'duration');
        if (!Number.isInteger(input.duration.value) || input.duration.value < 1) throw new PlanningMapError('INVALID_INPUT', 'La duración debe ser positiva.');
        for (const key of ['teacherContext', 'learnerContext', 'significantSituationInput', 'methodology', 'profiles']) object(input[key], key);
        for (const key of ['pedagogical', 'curriculum', 'didactic', 'methodology']) {
            const profile = object(input.profiles[key], `profiles.${key}`);
            if (!profile.id || !profile.profileVersion) throw new PlanningMapError('PROFILE_NOT_FOUND', `No existe un perfil ${key} versionado.`);
        }
        if (input.methodology.code !== input.profiles.methodology.code) {
            throw new PlanningMapError('METHODOLOGY_NOT_FOUND', 'La metodología no coincide con el perfil resuelto.');
        }
        if (!Array.isArray(input.curriculumReferences) || input.curriculumReferences.length === 0) {
            throw new PlanningMapError('CURRICULUM_NOT_FOUND', 'No hay referencias curriculares resueltas.');
        }
        for (const key of ['area', 'competency', 'standard']) object(input[key], key);
        for (const key of ['capacities', 'performances', 'curricularSourceRefs']) {
            if (!Array.isArray(input[key]) || input[key].length === 0) throw new PlanningMapError('CURRICULUM_NOT_FOUND', `${key} no contiene currículo resuelto para el grado.`);
        }
        return input;
    }

    function createRequest(input, requestId = globalThis.crypto.randomUUID(), quality = 'automatic') {
        validateInput(input);
        return { action: 'planning.map.generate', requestId, quality, input: clone(input) };
    }

    function parseJson(payload) {
        let value = payload;
        if (value && typeof value === 'object' && !Array.isArray(value) && 'data' in value) value = value.data;
        for (let depth = 0; depth < 2 && typeof value === 'string'; depth += 1) {
            if (/```/.test(value)) throw new PlanningMapError('INVALID_PROVIDER_JSON', 'La IA devolvió Markdown en lugar de JSON.');
            try { value = JSON.parse(value); }
            catch (_error) { throw new PlanningMapError('INVALID_PROVIDER_JSON', 'La IA devolvió JSON inválido.'); }
        }
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new PlanningMapError('INVALID_PROVIDER_JSON', 'La IA no devolvió un objeto JSON.');
        }
        return clone(value);
    }

    function assertTrustedCurriculum(container, references) {
        if (container.curriculumMap.length !== references.length) {
            throw new PlanningMapError('INVALID_CURRICULUM_REFERENCES', 'La IA alteró la cantidad de referencias curriculares.');
        }
        references.forEach((trusted, index) => {
            const generated = container.curriculumMap[index];
            const same = generated.id === trusted.id
                && generated.area?.id === trusted.area?.id
                && generated.area?.officialName === trusted.area?.officialName
                && generated.competency?.id === trusted.competency?.id
                && generated.competency?.officialName === trusted.competency?.officialName
                && JSON.stringify(generated.capacities) === JSON.stringify(trusted.capacities)
                && JSON.stringify(generated.standard) === JSON.stringify(trusted.standard)
                && JSON.stringify(generated.performances) === JSON.stringify(trusted.performances)
                && JSON.stringify(generated.curricularSourceRefs) === JSON.stringify(trusted.curricularSourceRefs);
            if (!same) throw new PlanningMapError('INVALID_CURRICULUM_REFERENCES', `La IA alteró la referencia curricular ${index + 1}.`);
        });
    }

    function parseResponse(payload, input) {
        validateInput(input);
        const container = parseJson(payload);
        container.status = 'draft';
        container.revision = 1;
        assertTrustedCurriculum(container, input.curriculumReferences);
        const result = core.validate(container, {
            forReview: true,
            pedagogicalProfile: input.profiles.pedagogical,
            methodologyProfile: input.profiles.methodology
        });
        if (!result.valid) throw new PlanningMapError('INVALID_PLANNING_MAP', 'La propuesta de IA no cumple PlanningContainer 2.0.', result.errors);
        return container;
    }

    async function generate(input, options = {}) {
        if (typeof options.invoke !== 'function') throw new PlanningMapError('GATEWAY_UNAVAILABLE', 'AI Gateway no está disponible.');
        const request = createRequest(input, options.requestId, options.quality);
        try {
            const response = await options.invoke('ai-gateway', request);
            return { requestId: request.requestId, container: parseResponse(response, input) };
        } catch (error) {
            if (error instanceof PlanningMapError) throw error;
            const code = error?.code || 'PLANNING_MAP_GENERATION_FAILED';
            throw new PlanningMapError(code, error?.message || 'No se pudo generar el mapa de planificación.');
        }
    }

    return { PlanningMapError, validateInput, createRequest, parseResponse, generate };
})();
if (typeof window !== 'undefined') window.PlanningMapGenerator = PlanningMapGenerator;
if (typeof module !== 'undefined' && module.exports) module.exports = PlanningMapGenerator;
