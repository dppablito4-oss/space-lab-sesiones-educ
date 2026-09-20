/* Space Lab application theme: light, dark, or operating-system preference. */
(function initThemeManager() {
    'use strict';

    const STORAGE_KEY = 'spacelab_theme_preference';
    const VALID_PREFERENCES = new Set(['system', 'light', 'dark']);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

    function readPreference() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return VALID_PREFERENCES.has(saved) ? saved : 'system';
        } catch {
            return 'system';
        }
    }

    function resolveTheme(preference) {
        return preference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preference;
    }

    function applyTheme(preference, persist = false) {
        const normalized = VALID_PREFERENCES.has(preference) ? preference : 'system';
        const resolved = resolveTheme(normalized);
        document.documentElement.dataset.themePreference = normalized;
        document.documentElement.dataset.theme = resolved;
        document.documentElement.style.colorScheme = resolved;

        if (persist) {
            try { localStorage.setItem(STORAGE_KEY, normalized); } catch { /* Storage can be unavailable. */ }
        }

        const selector = document.getElementById('theme-preference');
        if (selector && selector.value !== normalized) selector.value = normalized;
        window.dispatchEvent(new CustomEvent('spacelab:themechange', {
            detail: { preference: normalized, theme: resolved }
        }));
    }

    function bindThemeControl() {
        const selector = document.getElementById('theme-preference');
        if (!selector) return;
        selector.value = readPreference();
        selector.addEventListener('change', () => applyTheme(selector.value, true));
    }

    applyTheme(readPreference());
    systemTheme.addEventListener('change', () => {
        if (readPreference() === 'system') applyTheme('system');
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindThemeControl, { once: true });
    } else {
        bindThemeControl();
    }

    window.SpaceLabTheme = Object.freeze({
        getPreference: readPreference,
        setPreference: (preference) => applyTheme(preference, true),
        getResolvedTheme: () => document.documentElement.dataset.theme || resolveTheme(readPreference())
    });
})();
