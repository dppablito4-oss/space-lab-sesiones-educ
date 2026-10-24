/** Optional, read-only discovery. Older gateways safely offer automatic routing only. */
window.SpaceLabAiAvailability = (() => {
    'use strict';
    let version = 0, last = null;
    const select = () => document.getElementById('select-ai-provider');
    async function refresh() {
        const token = ++version;
        last = null;
        for (const option of select().options) {
            option.disabled = option.value !== 'automatic';
            option.hidden = option.disabled && !option.selected;
        }
        document.getElementById('ai-availability-status').textContent = 'Disponibilidad por verificar';
        try {
            const user = await window.SupabaseClient?.getCurrentUser?.();
            if (!user) return;
            const result = await window.SupabaseClient.invokeFunction('ai-gateway', {action:'capabilities', requestId:crypto.randomUUID()});
            if (token !== version || !Array.isArray(result?.qualities)) return;
            last = result.qualities;
            for (const option of select().options) {
                option.disabled = !last.includes(option.value);
                option.hidden = option.disabled && !option.selected;
            }
            document.getElementById('ai-availability-status').textContent = last.length ? 'Opciones verificadas' : 'Sin opciones disponibles';
            document.getElementById('ai-availability-help').textContent = 'Opciones según tu cuenta y la configuración del gateway. Los límites y créditos se comprueban al generar.';
        } catch {
            if (token !== version) return;
            document.getElementById('ai-availability-help').textContent = 'No se pudo verificar la disponibilidad. Puedes usar Automático; el gateway comprobará los permisos y créditos al generar.';
        }
    }
    async function validate() {
        await refresh();
        const quality = select().value;
        if (last ? last.includes(quality) : quality === 'automatic') return true;
        window.Toast?.warning('La calidad seleccionada no está disponible o no pudo verificarse. Revisa Copiloto y elige una opción disponible.');
        return false;
    }
    function init() {
        select().addEventListener('focus', refresh);
        window.addEventListener('spacelab:account-changed', refresh);
        window.addEventListener('spacelab:session-loaded', refresh);
        refresh();
    }
    return {init, refresh, validate};
})();
