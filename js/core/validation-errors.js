/** Converts legacy string and structured validation errors into readable text. */
const SpaceLabValidationErrors = (() => {
    'use strict';
    function formatValidationErrors(errors = []) {
        if (!Array.isArray(errors)) return '';
        return errors.map(error => {
            if (typeof error === 'string') return error;
            if (error && typeof error.message === 'string') return error.path ? `${error.path}: ${error.message}` : error.message;
            if (error === null || error === undefined) return '';
            try {
                const serialized = JSON.stringify(error);
                return serialized === '{}' ? String(error) : serialized;
            } catch {
                return String(error);
            }
        }).filter(Boolean).join(' ');
    }
    return { formatValidationErrors };
})();
if (typeof window !== 'undefined') window.SpaceLabValidationErrors = SpaceLabValidationErrors;
if (typeof module !== 'undefined' && module.exports) module.exports = SpaceLabValidationErrors;
