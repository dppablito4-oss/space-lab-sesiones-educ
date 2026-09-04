/*
 * Ficha externa para Space Lab
 *
 * Transforma la sesión actual en un prompt educativo estructurado para
 * herramientas de IA externas (ChatGPT Images, GPT Image, Midjourney, etc.).
 * Soporta variantes de nivel (Inicio, Avanzado, Experto) y variantes contextuales
 * manteniendo intacta la sesión oficial de aprendizaje.
 */
; (function () {
    'use strict';

    const MAX_CONTEXT_CHARS = 3600;
    let _lastSession = null;

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

    function extractEnfoques(session) {
        const rawEnfoques = session?.enfoquesTransversales || session?.enfoques || session?.enfoques_transversales;
        if (Array.isArray(rawEnfoques) && rawEnfoques.length > 0) {
            const list = rawEnfoques.map(e => {
                if (typeof e === 'string') return e;
                return e?.nombre || e?.enfoque || '';
            }).filter(Boolean);
            if (list.length > 0) return cleanText(list.join(', '));
        }

        if (typeof document !== 'undefined') {
            const enf1 = document.getElementById('input-enfoque')?.value?.trim();
            const enf2 = document.getElementById('input-enfoque2')?.value?.trim();
            const fromDom = [enf1, enf2].filter(Boolean);
            if (fromDom.length > 0) return cleanText(fromDom.join(', '));
        }

        return '';
    }

    function hasSession(session) {
        if (session !== undefined) {
            if (!session || typeof session !== 'object') return false;
            return Boolean(session.momentos || session.proposito || session.metadata?.titulo || session.metadata?.area);
        }
        if (_lastSession && typeof _lastSession === 'object') {
            if (_lastSession.momentos || _lastSession.proposito || _lastSession.metadata?.titulo || _lastSession.metadata?.area) {
                return true;
            }
        }
        if (typeof window !== 'undefined' && typeof window.getCurrentSession === 'function') {
            const current = window.getCurrentSession();
            if (current && typeof current === 'object') {
                if (current.momentos || current.proposito || current.metadata?.titulo || current.metadata?.area) {
                    return true;
                }
            }
        }
        return false;
    }

    function resolveSession(session) {
        if (session !== undefined) {
            if (!session || typeof session !== 'object') return null;
            if (session.momentos || session.proposito || session.metadata?.titulo || session.metadata?.area) {
                return session;
            }
            return null;
        }
        if (_lastSession && typeof _lastSession === 'object') {
            if (_lastSession.momentos || _lastSession.proposito || _lastSession.metadata?.titulo || _lastSession.metadata?.area) {
                return _lastSession;
            }
        }
        if (typeof window !== 'undefined' && typeof window.getCurrentSession === 'function') {
            const current = window.getCurrentSession();
            if (current && typeof current === 'object') {
                if (current.momentos || current.proposito || current.metadata?.titulo || current.metadata?.area) {
                    return current;
                }
            }
        }
        return null;
    }

    function getDificultadDirective(dificultad) {
        switch (dificultad) {
            case 'inicio':
                return {
                    label: 'Nivel Inicio / Básico',
                    text: 'NIVEL DE DIFICULTAD: INICIO / BÁSICO (Andamiaje y comprensión guiada).\n- Diseña actividades accesibles con andamiaje pedagógico paso a paso y ejemplos modelo.\n- Incluye pistas visuales, esquemas con inicios de respuesta y vocabulario directo.\n- Prioriza que el estudiante logre comprender la noción central sin frustración.'
                };
            case 'experto':
                return {
                    label: 'Nivel Experto / Desafío',
                    text: 'NIVEL DE DIFICULTAD: EXPERTO / DESAFÍO COGNITIVO (Olimpiada y análisis crítico).\n- Plantea situaciones problemáticas no rutinarias de alta demanda cognitiva.\n- Incluye análisis de datos o gráficos complejos, detección y justificación de errores típicos.\n- Exige preguntas abiertas de argumentación profunda, transferencia interdisciplinar y propuestas creativas.'
                };
            case 'avanzado':
            default:
                return {
                    label: 'Nivel Avanzado / Estándar',
                    text: 'NIVEL DE DIFICULTAD: AVANZADO / ESTÁNDAR (Aplicación autónoma).\n- Actividades que exigen resolución independiente y aplicación directa a situaciones reales.\n- Requiere justificar procedimientos, contrastar resultados y demostrar dominio de la competencia.'
                };
        }
    }

    function getVarianteDirective(variante) {
        switch (variante) {
            case 'alternativa':
                return 'TIPO DE VARIANTE: SITUACIÓN PROBLEMÁTICA ALTERNATIVA.\n- Mantén la misma competencia, tema y propósito curricular, pero plantea una NUEVA SITUACIÓN COTIDIANA con DATOS NUMÉRICOS, NARRATIVA O PERSONAJES DIFERENTES a la sesión original.\n- Diseña esta ficha para evaluar si el estudiante es capaz de transferir lo aprendido a un contexto distinto.';
            case 'refuerzo':
                return 'TIPO DE VARIANTE: REFUERZO ESCOLAR Y NIVELACIÓN.\n- Estructura la ficha en 3 momentos de práctica guiada: 1) Recordar el concepto clave (mini-organizador), 2) Resolver un caso guiado paso a paso, 3) Práctica individual para afianzar el aprendizaje.';
            case 'reto':
                return 'TIPO DE VARIANTE: RETO PROFUNDO Y EXTENSIÓN.\n- Plantea un desafío integrador o mini-proyecto de investigación escolar para estudiantes destacados que requiera sintetizar múltiples habilidades y formular conclusiones propias.';
            case 'estandar':
            default:
                return 'TIPO DE VARIANTE: APLICACIÓN FIEL DE LA SESIÓN.\n- Utiliza directamente los datos, situación de referencia y conceptos centrales trabajados en la sesión de clase.';
        }
    }

    function getNivelEduDirective(nivelEdu, grado) {
        const nivelNorm = (nivelEdu || '').toUpperCase();
        if (nivelNorm.includes('SECUNDARIA')) {
            return 'ADAPTACIÓN PEDAGÓGICA PARA EDUCACIÓN SECUNDARIA:\n- Formato formal y académico, vocabulario disciplinar preciso.\n- Cuadrículas para operaciones analíticas, tablas de datos formales y espacio para argumentación crítica.\n- Problemas contextualizados en ciencia, comunidad, economía o ciudadanía.';
        }
        if (nivelNorm.includes('INICIAL') || (grado && grado.includes('años'))) {
            return 'ADAPTACIÓN PEDAGÓGICA PARA EDUCACIÓN INICIAL (3 A 5 AÑOS):\n- Composición súper visual, lúdica y atractiva para niños pequeños.\n- Dibujos grandes para colorear o delinear, consignas ultra breves para el docente o padre.\n- Espacio para estampar huellas, trazar líneas o encerrar en círculos. Sin párrafos de texto denso.';
        }
        if (nivelNorm.includes('PRIMARIA') || (grado && (grado.includes('Primaria') || grado.includes('Grado')))) {
            return 'ADAPTACIÓN PEDAGÓGICA PARA EDUCACIÓN PRIMARIA:\n- Letra grande y legible, enunciados breves con vocabulario amigable.\n- Recuadros cuadriculados o líneas guía para respuestas, tablas sencillas y organizadores gráficos.\n- Situaciones basadas en el entorno escolar, el juego o la familia.';
        }
        return 'ADAPTACIÓN PEDAGÓGICA PARA EDUCACIÓN SECUNDARIA:\n- Formato formal y académico, vocabulario disciplinar preciso.\n- Cuadrículas para operaciones analíticas, tablas de datos formales y espacio para argumentación crítica.\n- Problemas contextualizados en ciencia, comunidad, economía o ciudadanía.';
    }

    function buildPrompt(session, options = {}) {
        const activeSession = resolveSession(session);
        if (!activeSession) {
            return 'Primero genera la sesión';
        }
        const metadata = activeSession?.metadata || {};
        const proposito = activeSession?.proposito || {};
        const ficha = activeSession?.fichaTrabajo || {};

        const titulo = cleanText(ficha.titulo || metadata.titulo || 'Ficha de aprendizaje');
        const grado = cleanText([metadata.grado, metadata.seccion, metadata.nivel].filter(Boolean).join(' '));
        const nivelEdu = cleanText(metadata.nivel || '');
        const competencia = cleanText(proposito.competencia || metadata.competencia || '');
        const desempeno = cleanText(proposito.desempeno || metadata.desempeno || '');
        const propositoTexto = cleanText(ficha.indicaciones || proposito.proposito || desempeno || competencia);
        const enfoquesTexto = extractEnfoques(activeSession);
        const activities = collectActivities(activeSession);

        const dificultad = options.dificultad || (typeof document !== 'undefined' && document.getElementById('select-ficha-nivel')?.value) || 'avanzado';
        const variante = options.variante || (typeof document !== 'undefined' && document.getElementById('select-ficha-variante')?.value) || 'estandar';

        const difInfo = getDificultadDirective(dificultad);
        const varInfo = getVarianteDirective(variante);
        const eduInfo = getNivelEduDirective(nivelEdu, grado);

        const context = limit([
            `Tema de la sesión: ${titulo}.`,
            grado && `Grado/nivel: ${grado}.`,
            competencia && `Competencia: ${competencia}.`,
            propositoTexto && `Propósito: ${propositoTexto}.`,
            enfoquesTexto && `Enfoque(s) transversal(es): ${enfoquesTexto}.`,
            activities && `Actividades y situación de referencia: ${activities}`
        ].filter(Boolean).join('\n'), MAX_CONTEXT_CHARS);

        return `Crea una ficha didáctica escolar en español basada exclusivamente en esta sesión:\n\n${context}\n\n${eduInfo}\n\n${difInfo.text}\n\n${varInfo}\n\nFORMATO Y COMPOSICIÓN:\n- Una sola página vertical tipo A4, proporción 1:1.414, preparada para impresión (referencia: 2480 × 3508 px a 300 dpi).\n- Fondo blanco, alto contraste, márgenes amplios y bordes finos en azul agua y verde suave.\n- Estilo escolar peruano limpio, moderno y profesional; usa íconos educativos discretos relacionados con el tema.\n- No incluyas logotipos, marcas de agua, nombres de instituciones ni contenido ajeno a la sesión.\n\nCONTENIDO OBLIGATORIO:\n- Título visible: “${titulo}” — ${difInfo.label}.\n- Una indicación breve para el estudiante.\n- Máximo tres actividades, en orden progresivo: comprender, resolver y reflexionar/proponer.\n- Incluye espacios amplios para respuestas escritas, operaciones o una tabla cuando sea pertinente.\n- Ajusta el nivel de dificultad al grado indicado.\n- Usa solamente español y revisa ortografía, tildes, números y signos.\n\nREGLAS DE TEXTO:\n- Todo texto visible debe ser nítido, grande y legible al imprimir.\n- Escribe únicamente los textos necesarios para resolver la ficha; evita párrafos largos.\n- No inventes datos, preguntas, competencias ni otra situación problemática ajena a las directivas indicadas.\n- No agregues explicaciones sobre el diseño fuera de la ficha.\n\nEntrega la imagen final completa de la ficha.`;
    }

    function copyToClipboard(text, successMessage = 'Prompt copiado. Pégalo en tu IA de imágenes.') {
        if (!text) return;
        const fallbackCopy = () => {
            const temp = document.createElement('textarea');
            temp.value = text;
            temp.style.position = 'fixed';
            temp.style.opacity = '0';
            document.body.appendChild(temp);
            temp.focus();
            temp.select();
            try {
                document.execCommand('copy');
                if (window.Toast) Toast.success(successMessage);
            } catch {
                if (window.Toast) Toast.info('Selecciona y copia el texto del cuadro');
            }
            document.body.removeChild(temp);
        };

        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    if (window.Toast) Toast.success(successMessage);
                })
                .catch(() => fallbackCopy());
        } else {
            fallbackCopy();
        }
    }

    function updateApartado(session, options = {}) {
        if (typeof document === 'undefined') return 'Primero genera la sesión';
        if (session && typeof session === 'object' && (session.momentos || session.proposito || session.metadata?.titulo || session.metadata?.area)) {
            _lastSession = session;
        }

        const selNivel = document.getElementById('select-ficha-nivel');
        const selVariante = document.getElementById('select-ficha-variante');
        const txtApartado = document.getElementById('input-ficha-prompt');

        if (!hasSession(session)) {
            if (txtApartado) txtApartado.value = 'Primero genera la sesión';
            return 'Primero genera la sesión';
        }

        const opt = {
            dificultad: options.dificultad || selNivel?.value || 'avanzado',
            variante: options.variante || selVariante?.value || 'estandar'
        };

        const activeSession = resolveSession(session);
        const prompt = buildPrompt(activeSession, opt);

        if (txtApartado) {
            txtApartado.value = prompt;
        }

        const modalText = document.getElementById('external-ficha-prompt-text');
        if (modalText) {
            modalText.value = prompt;
        }

        return prompt;
    }

    function ensureUI() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('external-ficha-prompt-modal')) return;

        const style = document.createElement('style');
        style.textContent = `
            .external-ficha-modal { position: fixed; inset: 0; z-index: 10020; display: grid; place-items: center; padding: 20px; background: rgba(4, 9, 20, .75); backdrop-filter: blur(4px); }
            .external-ficha-modal.hidden { display: none; }
            .external-ficha-card { width: min(760px, 100%); max-height: min(840px, calc(100vh - 40px)); overflow: auto; border: 1px solid var(--color-border, #31415d); border-radius: 12px; background: var(--color-card-surface, #101827); color: var(--color-foreground, #f5f7fb); padding: 22px; box-shadow: 0 24px 70px rgba(0,0,0,.5); }
            .external-ficha-card h3 { margin: 0 34px 6px 0; font-size: 1.05rem; font-weight: 700; color: #fff; }
            .external-ficha-card p { margin: 0 0 12px; font-size: .8rem; line-height: 1.45; color: var(--color-muted-foreground, #b1bac9); }
            .external-ficha-close { position: absolute; right: 14px; top: 12px; border: 0; background: transparent; color: inherit; font-size: 1.4rem; cursor: pointer; }
            .external-ficha-card-inner { position: relative; }
            .external-ficha-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
            .external-ficha-controls label { display: block; font-size: 0.72rem; font-weight: 600; margin-bottom: 4px; color: #94a3b8; }
            .external-ficha-controls select { width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--color-border, #31415d); background: rgba(0,0,0,0.3); color: #fff; font-size: 0.76rem; }
            .external-ficha-text { width: 100%; min-height: 320px; box-sizing: border-box; resize: vertical; padding: 12px; border: 1px solid var(--color-border, #31415d); border-radius: 7px; background: rgba(0,0,0,.25); color: inherit; font: 12px/1.45 ui-monospace, SFMono-Regular, Consolas, monospace; }
            .external-ficha-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
            .external-ficha-btn { border: 1px solid var(--color-border, #31415d); border-radius: 6px; padding: 8px 14px; cursor: pointer; font-weight: 650; font-size: 0.8rem; background: transparent; color: inherit; }
            .external-ficha-btn.primary { background: var(--color-primary, #0ea5e9); border-color: var(--color-primary, #0ea5e9); color: #fff; }
            .external-ficha-btn.primary:hover { background: #0284c7; }
        `;
        document.head.appendChild(style);

        const modal = document.createElement('div');
        modal.id = 'external-ficha-prompt-modal';
        modal.className = 'external-ficha-modal hidden no-print';
        modal.innerHTML = `
            <div class="external-ficha-card" role="dialog" aria-modal="true" aria-labelledby="external-ficha-title">
                <div class="external-ficha-card-inner">
                    <button type="button" class="external-ficha-close" aria-label="Cerrar">×</button>
                    <h3 id="external-ficha-title">Ficha Didáctica — Prompt para IA Externa</h3>
                    <p>La sesión ha sido procesada. Copia este prompt especializado y pégalo en <strong>ChatGPT Images, GPT Image, Midjourney o DALL-E</strong> para obtener la ficha lista para imprimir. Puedes generar variantes de nivel o situaciones alternativas:</p>
                    
                    <div class="external-ficha-controls">
                        <div>
                            <label for="select-modal-ficha-nivel">Nivel de Dificultad</label>
                            <select id="select-modal-ficha-nivel">
                                <option value="inicio">Inicio / Básico (Andamiaje)</option>
                                <option value="avanzado" selected>Avanzado / Estándar</option>
                                <option value="experto">Experto / Desafío</option>
                            </select>
                        </div>
                        <div>
                            <label for="select-modal-ficha-variante">Tipo de Variante</label>
                            <select id="select-modal-ficha-variante">
                                <option value="estandar" selected>Datos de la sesión</option>
                                <option value="alternativa">Situación alternativa</option>
                                <option value="refuerzo">Refuerzo guiado</option>
                                <option value="reto">Reto / Extensión</option>
                            </select>
                        </div>
                    </div>

                    <textarea id="external-ficha-prompt-text" class="external-ficha-text" readonly aria-label="Prompt para ficha visual"></textarea>
                    <div class="external-ficha-actions">
                        <button type="button" class="external-ficha-btn" data-external-ficha-close>Cerrar</button>
                        <button type="button" class="external-ficha-btn primary" id="btn-copy-external-ficha-prompt">Copiar prompt</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);

        const close = () => modal.classList.add('hidden');
        modal.querySelector('.external-ficha-close').addEventListener('click', close);
        modal.querySelector('[data-external-ficha-close]').addEventListener('click', close);
        modal.addEventListener('click', event => { if (event.target === modal) close(); });

        const modalNivel = modal.querySelector('#select-modal-ficha-nivel');
        const modalVariante = modal.querySelector('#select-modal-ficha-variante');

        const onModalChange = () => {
            if (!hasSession(_lastSession)) {
                if (window.Toast) Toast.warning('Primero genera la sesión');
                return;
            }
            const prompt = updateApartado(_lastSession, {
                dificultad: modalNivel.value,
                variante: modalVariante.value
            });
            const selNivel = document.getElementById('select-ficha-nivel');
            const selVariante = document.getElementById('select-ficha-variante');
            if (selNivel) selNivel.value = modalNivel.value;
            if (selVariante) selVariante.value = modalVariante.value;
            modal.querySelector('#external-ficha-prompt-text').value = prompt;
        };

        modalNivel.addEventListener('change', onModalChange);
        modalVariante.addEventListener('change', onModalChange);

        modal.querySelector('#btn-copy-external-ficha-prompt').addEventListener('click', () => {
            if (!hasSession(_lastSession)) {
                if (window.Toast) Toast.warning('Primero genera la sesión');
                return;
            }
            const prompt = modal.querySelector('#external-ficha-prompt-text');
            copyToClipboard(prompt.value);
        });
    }

    function showSuggestion(session, options = {}) {
        if (typeof document === 'undefined') return;
        if (session && typeof session === 'object' && (session.momentos || session.proposito || session.metadata?.titulo || session.metadata?.area)) {
            _lastSession = session;
        }

        if (!hasSession(session)) {
            const txt = document.getElementById('input-ficha-prompt');
            if (txt) txt.value = 'Primero genera la sesión';
            if (window.Toast) Toast.warning('Primero genera la sesión');
            return;
        }

        ensureUI();

        const selNivel = document.getElementById('select-ficha-nivel');
        const selVariante = document.getElementById('select-ficha-variante');
        const opt = {
            dificultad: options.dificultad || selNivel?.value || 'avanzado',
            variante: options.variante || selVariante?.value || 'estandar'
        };

        const modal = document.getElementById('external-ficha-prompt-modal');
        if (modal) {
            const modalNivel = modal.querySelector('#select-modal-ficha-nivel');
            const modalVariante = modal.querySelector('#select-modal-ficha-variante');
            if (modalNivel) modalNivel.value = opt.dificultad;
            if (modalVariante) modalVariante.value = opt.variante;
        }

        const activeSession = resolveSession(session);
        const prompt = updateApartado(activeSession, opt);
        if (modal) {
            modal.querySelector('#external-ficha-prompt-text').value = prompt;
            modal.classList.remove('hidden');
        }
    }

    function initApartadoListeners() {
        if (typeof document === 'undefined') return;

        const selNivel = document.getElementById('select-ficha-nivel');
        const selVariante = document.getElementById('select-ficha-variante');
        const btnTrigger = document.getElementById('btn-trigger-ficha-prompt');
        const btnCopy = document.getElementById('btn-copy-ficha-prompt');
        const btnModal = document.getElementById('btn-modal-ficha-prompt');
        const btnToolbar = document.getElementById('btn-toolbar-ficha-prompt');

        const onChange = () => {
            if (!hasSession()) {
                const txt = document.getElementById('input-ficha-prompt');
                if (txt) txt.value = 'Primero genera la sesión';
                return;
            }
            updateApartado();
        };

        if (selNivel) selNivel.addEventListener('change', onChange);
        if (selVariante) selVariante.addEventListener('change', onChange);

        if (btnTrigger) {
            btnTrigger.addEventListener('click', () => {
                if (!hasSession()) {
                    const txt = document.getElementById('input-ficha-prompt');
                    if (txt) txt.value = 'Primero genera la sesión';
                    if (window.Toast) Toast.warning('Primero genera la sesión');
                    return;
                }
                const prompt = updateApartado();
                if (window.Toast) Toast.success('Prompt de ficha actualizado');
                const txt = document.getElementById('input-ficha-prompt');
                if (txt) {
                    txt.focus();
                    txt.select();
                }
            });
        }

        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                if (!hasSession()) {
                    const txt = document.getElementById('input-ficha-prompt');
                    if (txt) txt.value = 'Primero genera la sesión';
                    if (window.Toast) Toast.warning('Primero genera la sesión');
                    return;
                }
                const txt = document.getElementById('input-ficha-prompt');
                const text = (txt && txt.value && txt.value !== 'Primero genera la sesión')
                    ? txt.value
                    : updateApartado();
                copyToClipboard(text);
            });
        }

        if (btnModal) {
            btnModal.addEventListener('click', () => {
                if (!hasSession()) {
                    const txt = document.getElementById('input-ficha-prompt');
                    if (txt) txt.value = 'Primero genera la sesión';
                    if (window.Toast) Toast.warning('Primero genera la sesión');
                    return;
                }
                showSuggestion();
            });
        }

        if (btnToolbar) {
            btnToolbar.addEventListener('click', () => {
                if (!hasSession()) {
                    const txt = document.getElementById('input-ficha-prompt');
                    if (txt) txt.value = 'Primero genera la sesión';
                    if (window.Toast) Toast.warning('Primero genera la sesión');
                    return;
                }
                showSuggestion();
            });
        }
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                ensureUI();
                initApartadoListeners();
            });
        } else {
            ensureUI();
            initApartadoListeners();
        }
    }

    window.ExternalFichaPrompt = {
        buildPrompt,
        showSuggestion,
        updateApartado,
        copyToClipboard,
        getPrompt: () => buildPrompt(_lastSession)
    };

    // Al terminar cada sesión: devuelve y actualiza el prompt de la ficha para la IA
    window.addEventListener('spacelab:session-generated', event => {
        const session = event.detail?.session;
        if (session) {
            _lastSession = session;
            updateApartado(session);
            showSuggestion(session);
        }
    });

    window.addEventListener('spacelab:session-loaded', event => {
        const session = event.detail?.session;
        if (session) {
            _lastSession = session;
            updateApartado(session);
        }
    });
})();

