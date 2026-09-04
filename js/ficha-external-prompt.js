/*
 * Ficha externa (provisional)
 *
 * No genera imágenes ni realiza llamadas a IA. Solo transforma la sesión
 * actual en un prompt que el docente puede copiar y usar en una IA externa.
 */
; (function () {
    'use strict';

    const MAX_CONTEXT_CHARS = 3600;

    function cleanText(value) {
        const raw = String(value || '');
        if (typeof document === 'undefined') {
            return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        const container = document.createElement('div');
        container.innerHTML = raw;
        return (container.textContent || container.innerText || '').replace(/\s+/g, ' ').trim();
    }

    function limit(value, length) {
        const text = cleanText(value);
        return text.length > length ? `${text.slice(0, length - 1).trim()}…` : text;
    }

    function collectActivities(session) {
        const ficha = session?.fichaTrabajo || {};
        const direct = cleanText(ficha.actividades || ficha.contenido || '');
        if (direct) return limit(direct, 1500);

        const momentos = session?.momentos || {};
        const blocks = ['inicio', 'desarrollo', 'cierre']
            .flatMap(key => {
                const moment = momentos[key] || {};
                const processes = Array.isArray(moment.procesos) ? moment.procesos : [];
                return processes.map(process => cleanText(process?.contenido?.value || process?.contenido || process?.descripcion || ''));
            })
            .filter(Boolean);
        return limit(blocks.join(' '), 1500);
    }

    function buildPrompt(session) {
        const metadata = session?.metadata || {};
        const proposito = session?.proposito || {};
        const ficha = session?.fichaTrabajo || {};
        const titulo = cleanText(ficha.titulo || metadata.titulo || 'Ficha de aprendizaje');
        const grado = cleanText([metadata.grado, metadata.seccion, metadata.nivel].filter(Boolean).join(' '));
        const competencia = cleanText(proposito.competencia || metadata.competencia || '');
        const desempeno = cleanText(proposito.desempeno || metadata.desempeno || '');
        const propositoTexto = cleanText(ficha.indicaciones || proposito.proposito || desempeno || competencia);
        const activities = collectActivities(session);
        const context = limit([
            `Tema de la sesión: ${titulo}.`,
            grado && `Grado/nivel: ${grado}.`,
            competencia && `Competencia: ${competencia}.`,
            propositoTexto && `Propósito: ${propositoTexto}.`,
            activities && `Actividades y situación de referencia: ${activities}`
        ].filter(Boolean).join('\n'), MAX_CONTEXT_CHARS);

        return `Crea una ficha didáctica escolar en español basada exclusivamente en esta sesión:\n\n${context}\n\nFORMATO Y COMPOSICIÓN:\n- Una sola página vertical tipo A4, proporción 1:1.414, preparada para impresión (referencia: 2480 × 3508 px a 300 dpi).\n- Fondo blanco, alto contraste, márgenes amplios y bordes finos en azul agua y verde suave.\n- Estilo escolar peruano limpio, moderno y profesional; usa íconos educativos discretos relacionados con el tema.\n- No incluyas logotipos, marcas de agua, nombres de instituciones ni contenido ajeno a la sesión.\n\nCONTENIDO OBLIGATORIO:\n- Título visible: “${titulo}”.\n- Una indicación breve para el estudiante.\n- Máximo tres actividades, en orden progresivo: comprender, resolver y reflexionar/proponer.\n- Incluye espacios amplios para respuestas escritas, operaciones o una tabla cuando sea pertinente.\n- Ajusta el nivel de dificultad al grado indicado.\n- Usa solamente español y revisa ortografía, tildes, números y signos.\n\nREGLAS DE TEXTO:\n- Todo texto visible debe ser nítido, grande y legible al imprimir.\n- Escribe únicamente los textos necesarios para resolver la ficha; evita párrafos largos.\n- No inventes datos, preguntas, competencias ni otra situación problemática.\n- No agregues explicaciones sobre el diseño fuera de la ficha.\n\nEntrega la imagen final completa de la ficha.`;
    }

    function ensureUI() {
        if (document.getElementById('external-ficha-prompt-modal')) return;

        const style = document.createElement('style');
        style.textContent = `
            .external-ficha-modal { position: fixed; inset: 0; z-index: 10020; display: grid; place-items: center; padding: 20px; background: rgba(4, 9, 20, .72); }
            .external-ficha-modal.hidden { display: none; }
            .external-ficha-card { width: min(720px, 100%); max-height: min(790px, calc(100vh - 40px)); overflow: auto; border: 1px solid var(--color-border, #31415d); border-radius: 12px; background: var(--color-card-surface, #101827); color: var(--color-foreground, #f5f7fb); padding: 20px; box-shadow: 0 24px 70px rgba(0,0,0,.45); }
            .external-ficha-card h3 { margin: 0 34px 6px 0; font-size: 1rem; }
            .external-ficha-card p { margin: 0 0 12px; font-size: .78rem; line-height: 1.45; color: var(--color-muted-foreground, #b1bac9); }
            .external-ficha-close { position: absolute; right: 14px; top: 12px; border: 0; background: transparent; color: inherit; font-size: 1.4rem; cursor: pointer; }
            .external-ficha-card-inner { position: relative; }
            .external-ficha-text { width: 100%; min-height: 340px; box-sizing: border-box; resize: vertical; padding: 11px; border: 1px solid var(--color-border, #31415d); border-radius: 7px; background: rgba(0,0,0,.18); color: inherit; font: 12px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace; }
            .external-ficha-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
            .external-ficha-btn { border: 1px solid var(--color-border, #31415d); border-radius: 6px; padding: 8px 12px; cursor: pointer; font-weight: 650; background: transparent; color: inherit; }
            .external-ficha-btn.primary { background: var(--color-primary, #0ea5e9); border-color: var(--color-primary, #0ea5e9); color: #fff; }
        `;
        document.head.appendChild(style);

        const modal = document.createElement('div');
        modal.id = 'external-ficha-prompt-modal';
        modal.className = 'external-ficha-modal hidden no-print';
        modal.innerHTML = `
            <div class="external-ficha-card" role="dialog" aria-modal="true" aria-labelledby="external-ficha-title">
                <div class="external-ficha-card-inner">
                    <button type="button" class="external-ficha-close" aria-label="Cerrar">×</button>
                    <h3 id="external-ficha-title">Crea una ficha visual en una IA externa</h3>
                    <p>La sesión ya fue sintetizada. Copia este texto y pégalo en GPT Image, ChatGPT Images u otra herramienta de imágenes. Esta sugerencia no genera imágenes ni consume créditos dentro de Space Lab.</p>
                    <textarea id="external-ficha-prompt-text" class="external-ficha-text" readonly aria-label="Prompt para ficha visual"></textarea>
                    <div class="external-ficha-actions">
                        <button type="button" class="external-ficha-btn" data-external-ficha-close>Ahora no</button>
                        <button type="button" class="external-ficha-btn primary" id="btn-copy-external-ficha-prompt">Copiar prompt</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);

        const close = () => modal.classList.add('hidden');
        modal.querySelector('.external-ficha-close').addEventListener('click', close);
        modal.querySelector('[data-external-ficha-close]').addEventListener('click', close);
        modal.addEventListener('click', event => { if (event.target === modal) close(); });
        modal.querySelector('#btn-copy-external-ficha-prompt').addEventListener('click', async () => {
            const prompt = modal.querySelector('#external-ficha-prompt-text');
            try {
                await navigator.clipboard.writeText(prompt.value);
                if (window.Toast) Toast.success('Prompt copiado. Pégalo en tu IA de imágenes.');
            } catch {
                prompt.focus();
                prompt.select();
                document.execCommand('copy');
                if (window.Toast) Toast.success('Prompt copiado. Pégalo en tu IA de imágenes.');
            }
        });
    }

    function showSuggestion(session) {
        if (!session || typeof document === 'undefined') return;
        ensureUI();
        const modal = document.getElementById('external-ficha-prompt-modal');
        modal.querySelector('#external-ficha-prompt-text').value = buildPrompt(session);
        modal.classList.remove('hidden');
    }

    window.ExternalFichaPrompt = { buildPrompt, showSuggestion };
    window.addEventListener('spacelab:session-generated', event => showSuggestion(event.detail?.session));
})();
