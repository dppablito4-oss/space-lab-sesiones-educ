/** Small read-only AI credit indicator. PostgreSQL remains the source of truth. */
window.SpaceLabAiCreditUi = (() => {
    'use strict';

    let initialized = false;
    let currentPlanCode = null;

    const PLAN_LABELS = {
        free: 'Gratuito',
        beta_teacher: 'Docente Beta',
        teacher: 'Docente Plus',
        pro: 'Docente Pro'
    };

    function render(wallet, planCode) {
        const indicator = document.getElementById('ai-credit-indicator');
        const headerCredits = document.getElementById('header-user-credits');
        const headerPlan = document.getElementById('header-user-plan');

        if (planCode !== undefined) currentPlanCode = planCode;
        const planDisplay = PLAN_LABELS[currentPlanCode] || 'Plan docente';
        if (headerPlan) headerPlan.textContent = planDisplay;

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
    }

    async function refresh() {
        if (!window.SupabaseClient?.getAiCreditBalance) return render(null, null);
        try {
            const [wallet, commercialPlan] = await Promise.all([
                window.SupabaseClient.getAiCreditBalance().catch(error => {
                    console.warn('[AI Credits] No se pudo consultar el saldo:', error);
                    return null;
                }),
                (window.SupabaseClient.getCommercialPlan?.(true) ?? Promise.resolve(null)).catch(error => {
                    console.warn('[AI Credits] No se pudo consultar el plan comercial:', error);
                    return null;
                })
            ]);
            render(wallet, commercialPlan);
        } catch (error) {
            console.warn('[AI Credits] No se pudo actualizar el resumen:', error);
            render(null, null);
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
