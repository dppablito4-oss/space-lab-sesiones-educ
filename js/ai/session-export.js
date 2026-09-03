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

    function logoUrl(item) {
        if (typeof item === 'string') return item || null;
        if (!item || typeof item !== 'object') return null;
        for (const key of ['url', 'src', 'data', 'value']) {
            const candidate = item[key];
            if (typeof candidate === 'string' && candidate) return candidate;
            if (candidate && typeof candidate === 'object') {
                const nested = candidate.url || candidate.src;
                if (typeof nested === 'string' && nested) return nested;
            }
        }
        return null;
    }

    function normalizeLogos(logos) {
        if (Array.isArray(logos)) {
            const normalized = { institucional: null, regional: null };
            const unassigned = [];
            logos.forEach(item => {
                const url = logoUrl(item);
                if (!url) return;
                const id = String(item && typeof item === 'object' ? item.id || '' : '').toLowerCase();
                if (/(left|institucional|marca)/.test(id)) normalized.institucional = url;
                else if (/(right|regional|ugel|dre)/.test(id)) normalized.regional = url;
                else unassigned.push(url);
            });
            ['institucional', 'regional'].forEach(key => {
                if (!normalized[key] && unassigned.length) normalized[key] = unassigned.shift();
            });
            return normalized;
        }

        if (logos && typeof logos === 'object') {
            return {
                institucional: logoUrl(logos.institucional || logos.logo_left_url || logos.logo_institucional || logos.left),
                regional: logoUrl(logos.regional || logos.logo_regional_url || logos.logo_regional || logos.right)
            };
        }
        return { institucional: null, regional: null };
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
        payload.metadata.logos = normalizeLogos(payload.metadata.logos);
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
