/** Explicit allowlist for profile fields editable by a normal user. */
const SpaceLabProfileFields = (() => {
    'use strict';

    const EDITABLE_FIELDS = Object.freeze([
        'username',
        'institucion',
        'dre',
        'ugel',
        'docente',
        'director',
        'nivel'
    ]);

    function sanitizeUpdate(profileData) {
        if (!profileData || typeof profileData !== 'object' || Array.isArray(profileData)) return {};
        const sanitized = {};
        for (const field of EDITABLE_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(profileData, field) && profileData[field] !== undefined) {
                sanitized[field] = profileData[field];
            }
        }
        return sanitized;
    }

    return { EDITABLE_FIELDS, sanitizeUpdate };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SpaceLabProfileFields;
if (typeof window !== 'undefined') window.SpaceLabProfileFields = SpaceLabProfileFields;
