/** Shared, side-effect-free helpers used by the editor and administration UI. */
const SpaceLabUtils = (() => {
    'use strict';

    function parseMinutes(value) {
        if (!value) return 0;
        const clean = String(value).toLowerCase().trim();
        const hoursMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:hora|h)/);
        if (hoursMatch) return Math.round(parseFloat(hoursMatch[1]) * 45);

        const numbers = clean.match(/\d+/g);
        return numbers ? numbers.reduce((sum, number) => sum + parseInt(number, 10), 0) : 0;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }

    function formatDate(isoString, locale = 'es-PE') {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return String(isoString);
        return date.toLocaleDateString(locale, {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let index = 0; index < bytes.byteLength; index += 1) {
            binary += String.fromCharCode(bytes[index]);
        }
        return globalThis.btoa(binary);
    }

    function getBinaryMimeFallback(fileName) {
        const lower = String(fileName || '').toLowerCase();
        if (lower.endsWith('.pdf')) return 'application/pdf';
        if (lower.endsWith('.png')) return 'image/png';
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
        if (lower.endsWith('.webp')) return 'image/webp';
        if (lower.endsWith('.mp3')) return 'audio/mpeg';
        if (lower.endsWith('.wav')) return 'audio/wav';
        return 'application/octet-stream';
    }

    return { parseMinutes, escapeHtml, escapeAttribute, formatDate, arrayBufferToBase64, getBinaryMimeFallback };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SpaceLabUtils;
if (typeof window !== 'undefined') window.SpaceLabUtils = SpaceLabUtils;
