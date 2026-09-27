/** Canonical methodology codes and display labels, including read compatibility. */
const SpaceLabMethodologyCodes = (() => {
    'use strict';
    const LEGACY_ALIASES = Object.freeze({ abp: 'project_based_learning' });
    const DISPLAY_NAMES = Object.freeze({
        project_based_learning: 'Aprendizaje Basado en Proyectos',
        problem_based_learning: 'Aprendizaje Basado en Problemas',
        challenge_based_learning: 'Aprendizaje Basado en Retos',
        game_based_learning: 'Aprendizaje Basado en Juegos'
    });
    function normalizeMethodologyCode(value) {
        if (value === null || value === undefined) return '';
        const code = String(value).trim();
        return LEGACY_ALIASES[code] || code;
    }
    function getMethodologyDisplayName(value) {
        const code = normalizeMethodologyCode(value);
        return DISPLAY_NAMES[code] || code;
    }
    return { LEGACY_ALIASES, DISPLAY_NAMES, normalizeMethodologyCode, getMethodologyDisplayName };
})();
if (typeof window !== 'undefined') window.SpaceLabMethodologyCodes = SpaceLabMethodologyCodes;
if (typeof module !== 'undefined' && module.exports) module.exports = SpaceLabMethodologyCodes;
