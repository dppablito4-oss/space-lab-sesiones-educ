/** Small read-only AI credit indicator. PostgreSQL remains the source of truth. */
window.SpaceLabAiCreditUi = (() => {
    'use strict';

    let initialized = false;

    function render(wallet) {
        const indicator = document.getElementById('ai-credit-indicator');
        if (!indicator) return;
        if (!wallet) {
            indicator.hidden = true;
            indicator.textContent = 'IA · -- créditos';
            return;
        }
        indicator.hidden = false;
        indicator.textContent = `IA · ${wallet.balance} créditos`;
        indicator.title = `Plan ${wallet.planId || 'free'} · saldo disponible`;
    }

    async function refresh() {
        if (!window.SupabaseClient?.refreshAiCreditBalance) return render(null);
        try {
            render(await window.SupabaseClient.refreshAiCreditBalance());
        } catch (error) {
            console.warn('[AI Credits] No se pudo consultar el saldo:', error);
            render(null);
        }
    }

    function init() {
        if (initialized) return;
        initialized = true;
        window.addEventListener('spacelab:aicredits', event => render(event.detail));
        window.SupabaseClient?.client?.auth?.onAuthStateChange?.(() => refresh());
        refresh();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    return { init, refresh, render };
})();
