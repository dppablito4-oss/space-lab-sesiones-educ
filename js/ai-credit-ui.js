/** Small read-only AI credit indicator. PostgreSQL remains the source of truth. */
window.SpaceLabAiCreditUi = (() => {
    'use strict';

    let initialized = false;

    function render(wallet) {
        const indicator = document.getElementById('ai-credit-indicator');
        const headerCredits = document.getElementById('header-user-credits');
        const headerPlan = document.getElementById('header-user-plan');

        if (!wallet) {
            if (indicator) {
                indicator.hidden = true;
                indicator.textContent = 'IA · -- créditos';
            }
            if (headerCredits) {
                headerCredits.innerHTML = '-- créditos IA';
            }
            return;
        }

        const balance = Number(wallet.balance) || 0;
        const planId = wallet.planId || 'beta_teacher';
        const planDisplay = planId === 'beta_teacher' ? 'Docente Beta' :
                            planId === 'pro' ? 'Docente Pro' :
                            planId === 'teacher' ? 'Docente Plus' : 'Plan Free';

        const headerBadge = document.getElementById('header-user-badge');
        if (indicator) {
            // Si el badge superior izquierdo está presente y activo, ocultar el indicador duplicado de la derecha
            indicator.hidden = !!(headerBadge && !headerBadge.hidden);
            indicator.textContent = `IA · ${balance} créditos`;
            indicator.title = `Plan ${planDisplay} · saldo disponible`;
        }
        if (headerCredits) {
            headerCredits.innerHTML = `<strong>${balance}</strong> créditos IA disponibles`;
            headerCredits.parentElement.title = `Plan ${planDisplay} · ${balance} créditos disponibles`;
        }
        if (headerPlan) {
            headerPlan.textContent = planDisplay;
        }
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
