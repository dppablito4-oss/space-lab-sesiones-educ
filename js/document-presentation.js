/** Shared visual contract for the web preview and native Word renderer. */
const DocumentPresentation = (() => {
    'use strict';

    const PRESETS = Object.freeze({
        minedu: Object.freeze({ preset: 'minedu', primaryColor: '#000000', accentColor: '#C0392B', headerBackground: '#BDD6EE', fontFamily: 'Arial', fontSizePt: 10, cellPadding: 'standard', lineHeight: 1.15 }),
        institucional: Object.freeze({ preset: 'institucional', primaryColor: '#1E3A5F', accentColor: '#2563EB', headerBackground: '#DBEAFE', fontFamily: 'Arial', fontSizePt: 10, cellPadding: 'standard', lineHeight: 1.25 }),
        moderno: Object.freeze({ preset: 'moderno', primaryColor: '#334155', accentColor: '#0F766E', headerBackground: '#CCFBF1', fontFamily: 'Calibri', fontSizePt: 10, cellPadding: 'comfortable', lineHeight: 1.3 }),
        clasico: Object.freeze({ preset: 'clasico', primaryColor: '#1F2937', accentColor: '#7F1D1D', headerBackground: '#F3F4F6', fontFamily: 'Georgia', fontSizePt: 10, cellPadding: 'comfortable', lineHeight: 1.3 }),
        accesible: Object.freeze({ preset: 'accesible', primaryColor: '#111827', accentColor: '#0E7490', headerBackground: '#CFFAFE', fontFamily: 'Arial', fontSizePt: 11, cellPadding: 'spacious', lineHeight: 1.5 })
    });
    const FONTS = new Set(['Arial', 'Calibri', 'Georgia', 'Times New Roman', 'Courier New']);
    const PADDINGS = new Set(['compact', 'standard', 'comfortable', 'spacious']);
    const CSS_PADDING = Object.freeze({ compact: '2px 4px', standard: '4px 6px', comfortable: '6px 8px', spacious: '8px 10px' });

    function color(value, fallback) {
        const normalized = String(value || '').trim().toUpperCase();
        return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : fallback;
    }

    function legacyFont(value) {
        const raw = String(value || '').replace(/["']/g, '').split(',')[0].trim();
        if (raw === 'Space Grotesk') return 'Calibri';
        return FONTS.has(raw) ? raw : 'Arial';
    }

    function legacyPadding(value) {
        if (PADDINGS.has(value)) return value;
        const px = parseInt(String(value || ''), 10);
        if (px <= 2) return 'compact';
        if (px >= 8) return 'spacious';
        if (px >= 6) return 'comfortable';
        return 'standard';
    }

    function normalize(input = {}) {
        const preset = PRESETS[input.preset] ? input.preset : 'minedu';
        const base = PRESETS[preset];
        const fontSize = Number(input.fontSizePt ?? parseFloat(input.fontSize));
        const lineHeight = Number(input.lineHeight);
        return {
            preset,
            primaryColor: color(input.primaryColor || input.themeColor, base.primaryColor),
            accentColor: color(input.accentColor, base.accentColor),
            headerBackground: color(input.headerBackground || input.headerBg, base.headerBackground),
            fontFamily: legacyFont(input.fontFamily || base.fontFamily),
            fontSizePt: Number.isFinite(fontSize) ? Math.min(12, Math.max(8, fontSize)) : base.fontSizePt,
            cellPadding: legacyPadding(input.cellPadding || input.padding || base.cellPadding),
            lineHeight: Number.isFinite(lineHeight) ? Math.min(1.8, Math.max(1, lineHeight)) : base.lineHeight
        };
    }

    function preset(name) {
        return normalize(PRESETS[name] || PRESETS.minedu);
    }

    function blendWithWhite(hex, whiteRatio) {
        const clean = color(hex, '#000000').slice(1);
        const ratio = Math.max(0, Math.min(1, whiteRatio));
        return `#${[0, 2, 4].map(i => {
            const channel = parseInt(clean.slice(i, i + 2), 16);
            return Math.round(channel * (1 - ratio) + 255 * ratio).toString(16).padStart(2, '0');
        }).join('')}`.toUpperCase();
    }

    function toCss(presentation) {
        const p = normalize(presentation);
        const families = {
            Arial: 'Arial, sans-serif',
            Calibri: 'Calibri, Arial, sans-serif',
            Georgia: 'Georgia, serif',
            'Times New Roman': "'Times New Roman', serif",
            'Courier New': "'Courier New', monospace"
        };
        return {
            primaryColor: p.primaryColor,
            accentColor: p.accentColor,
            headerBackground: p.headerBackground,
            fontFamily: families[p.fontFamily],
            fontSize: `${p.fontSizePt}pt`,
            padding: CSS_PADDING[p.cellPadding],
            lineHeight: String(p.lineHeight),
            accentSoft: blendWithWhite(p.accentColor, 0.78),
            valueBackground: blendWithWhite(p.primaryColor, 0.94)
        };
    }

    return { PRESETS, normalize, preset, toCss, blendWithWhite };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = DocumentPresentation;
if (typeof window !== 'undefined') window.DocumentPresentation = DocumentPresentation;
