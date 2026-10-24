/** Optional, read-only discovery. Older gateways safely offer automatic routing only. */
window.SpaceLabAiAvailability = (() => {
    'use strict';
    let version = 0, last = null;
    const select = () => document.getElementById('select-ai-provider');
    function restrictOptions(qualities) {
        for (const option of select().options) {
            option.disabled = !qualities.includes(option.value);
            option.hidden = option.disabled && !option.selected;
        }
    }
    async function refresh() {
        const token = ++version;
        last = null;
        restrictOptions(['automatic']);
        document.getElementById('ai-availability-status').textContent = 'Disponibilidad por verificar';
        document.getElementById('ai-availability-help').textContent = 'Comprobando las opciones de tu cuenta…';
        try {
            const user = await window.SupabaseClient?.getCurrentUser?.();
            if (token !== version) return false;
            if (!user) {
                document.getElementById('ai-availability-status').textContent = 'Inicia sesión para consultar opciones';
                document.getElementById('ai-availability-help').textContent = 'Para generar necesitas una cuenta con créditos disponibles.';
                return true;
            }
            const result = await window.SupabaseClient.invokeFunction('ai-gateway', {action:'capabilities', requestId:crypto.randomUUID()});
            if (token !== version) return false;
            if (!Array.isArray(result?.qualities)) throw new Error('Invalid capabilities response');
            last = result.qualities.filter(value => ['automatic','fast','balanced','max_quality'].includes(value));
            restrictOptions(last);
            document.getElementById('ai-availability-status').textContent = last.length ? 'Opciones verificadas' : 'Sin opciones disponibles';
            document.getElementById('ai-availability-help').textContent = 'Opciones según tu cuenta y la configuración del gateway. Los límites y créditos se comprueban al generar.';
        } catch {
            if (token !== version) return false;
            document.getElementById('ai-availability-help').textContent = 'No se pudo verificar la disponibilidad. Puedes usar Automático; el gateway comprobará los permisos y créditos al generar.';
        }
        return true;
    }
    async function validate() {
        if (!await refresh()) return false;
        const quality = select().value;
        if (last ? last.includes(quality) : quality === 'automatic') return true;
        window.Toast?.warning('La calidad seleccionada no está disponible o no pudo verificarse. Revisa Copiloto y elige una opción disponible.');
        return false;
    }
    function init() {
        select().addEventListener('focus', () => { if (last === null) refresh(); });
        window.addEventListener('spacelab:account-changed', refresh);
        window.addEventListener('spacelab:session-loaded', refresh);
        refresh();
    }
    return {init, refresh, validate};
})();
