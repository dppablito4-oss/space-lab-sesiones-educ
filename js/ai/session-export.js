/**
 * SessionExport — prepara el SessionDocument v1 para los renderizadores.
 *
 * La sesión canónica es la fuente de verdad. Este módulo solo sincroniza
 * campos explícitos del formulario y nunca reconstruye procesos desde
 * textContent, por lo que conserva HTML, títulos, orden y metodología.
 */
const SessionExport = (() => {
    'use strict';

    const ROOT_FIELDS = [
        'schemaVersion', 'metadata', 'proposito', 'competenciasTransversales',
        'enfoquesTransversales', 'recursos', 'momentos', 'evaluacion',
        'fichaTrabajo', 'juegoLibreSectores', 'listaCotejo', 'presentation'
    ];

    function clone(value) {
        return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
    }

    function buildCanonicalPayload(session, updates = {}) {
        if (!session || session.schemaVersion !== '1.0' || !session.momentos) return null;

        const payload = {};
        ROOT_FIELDS.forEach(field => {
            if (Object.prototype.hasOwnProperty.call(session, field)) {
                payload[field] = clone(session[field]);
            }
        });

        payload.schemaVersion = '1.0';
        payload.metadata = { ...(payload.metadata || {}), ...(updates.metadata || {}) };
        payload.listaCotejo = {
            ...(payload.listaCotejo || {}),
            alumnos: Array.isArray(updates.alumnos)
                ? clone(updates.alumnos)
                : clone(payload.listaCotejo?.alumnos || [])
        };
        if (updates.presentation) payload.presentation = clone(updates.presentation);
        if (updates.token) payload.token = String(updates.token);
        return payload;
    }

    return { buildCanonicalPayload };
})();

if (typeof window !== 'undefined') {
    window.SessionExport = SessionExport;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionExport;
}
