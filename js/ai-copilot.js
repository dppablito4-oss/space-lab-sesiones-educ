/* ═══════════════════════════════════════════════════
   AI COPILOT — Integración con IA
   Adaptado de pablitoexpo GlobalAiCopilot + mibitacora SpaceCopilot
   ═══════════════════════════════════════════════════ */

const AiCopilot = (() => {

    // ─── CONFIGURACIÓN ───
    const CONFIG = {
        // Provider credentials are held only by Supabase Edge Functions.
        model: 'openai-gpt-6-luna'
    };

    const PROVIDERS = {
        'openai-gpt-6-luna': { router: 'openai-router', kind: 'openai', model: 'gpt-6-luna' },
        'openai-gpt-5.6-terra': { router: 'openai-router', kind: 'openai', model: 'gpt-5.6-terra' },
        'gemini-2.5-flash': { router: 'gemini-router', kind: 'gemini', model: 'gemini-2.5-flash' },
        'deepseek-chat': { router: 'deepseek-router', kind: 'deepseek', model: 'deepseek-chat' },
        'deepseek-reasoner': { router: 'deepseek-router', kind: 'deepseek', model: 'deepseek-reasoner' },
        // Aliases para compatibilidad
        'deepseek-v3': { router: 'deepseek-router', kind: 'deepseek', model: 'deepseek-chat' },
        'deepseek-r1': { router: 'deepseek-router', kind: 'deepseek', model: 'deepseek-reasoner' },
        'openai-gpt-6-astra': { router: 'openai-router', kind: 'openai', model: 'gpt-6-astra' },
        'openai-gpt-6-sol': { router: 'openai-router', kind: 'openai', model: 'gpt-6-sol' },
        'openai-gpt-5.6-luna': { router: 'openai-router', kind: 'openai', model: 'gpt-5.6-luna' },
        'openai-gpt-5.4-mini': { router: 'openai-router', kind: 'openai', model: 'gpt-5.4-mini' }
    };

    function resolveProvider(provider) {
        const aliases = {
            openai: 'openai-gpt-6-luna',
            gemini: 'gemini-2.5-flash',
            deepseek: 'deepseek-chat',
            'deepseek-v3': 'deepseek-chat',
            'deepseek-r1': 'deepseek-reasoner'
        };
        return PROVIDERS[aliases[provider] || provider] || PROVIDERS['openai-gpt-6-luna'];
    }

    async function hasAuthenticatedUser() {
        if (!window.SupabaseClient || !SupabaseClient.client) return false;
        try { return Boolean(await SupabaseClient.getCurrentUser()); } catch { return false; }
    }

    function prepareSourceFile(sourceFile, provider) {
        if (!sourceFile) return null;
        const base = { name: sourceFile.name || 'archivo-adjunto', type: sourceFile.type || 'application/octet-stream' };
        const maxBase64Chars = 4 * 1024 * 1024;

        if (provider.kind === 'gemini' && sourceFile.base64) {
            if (sourceFile.base64.length > maxBase64Chars) throw new Error('El archivo adjunto supera el límite permitido para IA.');
            return { ...base, base64: sourceFile.base64 };
        }
        if (sourceFile.textContent) return { ...base, textContent: String(sourceFile.textContent).slice(0, 30000) };
        if (base.type.startsWith('image/') && sourceFile.base64) {
            if (sourceFile.base64.length > maxBase64Chars) throw new Error('La imagen adjunta supera el límite permitido para IA.');
            return { ...base, base64: sourceFile.base64 };
        }
        return null;
    }

    /**
     * Set API configuration
     */
    function configure({ model } = {}) {
        if (model) CONFIG.model = model;

        // Persist config (without sensitive keys shown)
        localStorage.setItem('spacelab_ai_config', JSON.stringify({
            model: CONFIG.model
        }));
    }

    function setProvider(provider) {
        CONFIG.model = provider;
    }

    /**
     * Load saved config
     */
    function loadConfig() {
        try {
            const saved = localStorage.getItem('spacelab_ai_config');
            if (saved) {
                const c = JSON.parse(saved);
                CONFIG.model = c.model || CONFIG.model;
                localStorage.setItem('spacelab_ai_config', JSON.stringify({ model: CONFIG.model }));
            }
        } catch { /* ignore */ }
    }

    // ─── CONTRATO DE SOLICITUDES IA ───
    function createRequestId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
            const value = Math.floor(Math.random() * 16);
            return (char === 'x' ? value : (value & 0x3) | 0x8).toString(16);
        });
    }

    async function generateSession(metadata) {
        if (await hasAuthenticatedUser()) {
            try {
                const provider = resolveProvider(metadata.ai_provider);
                const functionName = provider.router;
                const selectedModel = provider.model;
                const sourceFile = prepareSourceFile(metadata.sourceFile, provider);

                console.log(`[AI] Llamando a Edge Function ${functionName} con modelo ${selectedModel}...`);
                const { sourceFile: _sourceFile, ai_provider: _aiProvider, ...metadataInput } = metadata;
                let data;
                try {
                    data = await SupabaseClient.invokeFunction(functionName, {
                        action: 'generate_session',
                        requestId: createRequestId(),
                        model: selectedModel,
                        input: {
                            metadata: metadataInput,
                            sourceFile
                        }
                    });
                } catch (fnErr) {
                    if (functionName === 'openai-router' && (fnErr.message?.includes('Modelo no permitido') || fnErr.message?.includes('MODEL_NOT_ALLOWED'))) {
                        console.warn('[AI] Fallback automático a gpt-5.4-mini en openai-router...');
                        data = await SupabaseClient.invokeFunction('openai-router', {
                            action: 'generate_session',
                            requestId: createRequestId(),
                            model: 'gpt-5.4-mini',
                            input: {
                                metadata: metadataInput,
                                sourceFile
                            }
                        });
                    } else {
                        throw fnErr;
                    }
                }

                // Si la función retorna un string de JSON
                let resultObj = data;
                if (typeof data === 'string') {
                    resultObj = parseAIResponse(data);
                } else if (data && typeof data === 'object') {
                    // Si ya viene como objeto parsed
                    resultObj = normalizeSessionData(deepCleanStrings(data));
                }

                if (resultObj) {
                    return resultObj;
                }
            } catch (err) {
                console.error('[AI] Error en Edge Function:', err);
                throw err;
            }
        }

        throw new Error('Debes iniciar sesión para generar contenido con IA.');
    }

    /**
     * Parse and clean AI response
     */
    function parseAIResponse(rawContent) {
        // Clean common AI response artifacts
        let cleaned = rawContent
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .replace(/^\s*[\r\n]+/, '')
            .replace(/[\r\n]+\s*$/, '')
            .trim();

        // Try to extract JSON if wrapped in text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }

        try {
            const parsed = JSON.parse(cleaned);

            // Clean excessive newlines from all string values
            return normalizeSessionData(deepCleanStrings(parsed));
        } catch {
            console.error('[AI] Failed to parse JSON:', cleaned);
            throw new Error('La IA devolvió una respuesta con formato incorrecto. Intenta de nuevo.');
        }
    }

    /**
     * Recursively clean strings in an object
     */
    function deepCleanStrings(obj) {
        if (typeof obj === 'string') {
            return obj
                .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
                .replace(/^\s+|\s+$/g, '')   // Trim
                .replace(/•\s*/g, '• ');     // Normalize bullet points
        }
        if (Array.isArray(obj)) {
            return obj.map(deepCleanStrings);
        }
        if (obj && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = deepCleanStrings(value);
            }
            return result;
        }
        return obj;
    }

    /**
     * Normalize dynamic session keys (e.g. momentos.desarrollo proceso_X_ keys)
     * Also handles AI-specific formats:
     * - titulo_sesion_retador → metadata.titulo
     * - competencias_transversales as object {tic, autonoma} → keep for templates
     * - enfoques (short key) → enfoques (already handled by templates.js)
     * - recursos.paginas_consulta → recursos.paginas_consulta (kept for web view)
     * - momentos.inicio sub-moments (motivacion, saberes_previos, etc.)
     * - momentos.cierre.actividades text → kept as-is for web rendering
     */
    function normalizeSessionData(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        // 1. Map titulo_sesion_retador to metadata.titulo if missing
        if (obj.titulo_sesion_retador && !obj.metadata?.titulo) {
            if (!obj.metadata) obj.metadata = {};
            obj.metadata.titulo = obj.titulo_sesion_retador;
        }

        // 2. Map 'enfoques' shorthand to top-level (templates.js reads data.enfoques)
        if (obj.enfoques && !Array.isArray(obj.enfoques_transversales)) {
            // Keep as 'enfoques' for templates.js which reads data.enfoques
        }

        // 3. Normalize competencias_transversales
        //    AI sends: { tic: [...], autonoma: [...] }
        //    Templates.js reads: { tic: [...], autonoma: [...] } — same format, keep as-is
        //    No conversion needed for frontend, backend handles its own conversion

        // 4. Map recursos keys for frontend compatibility
        if (obj.recursos && typeof obj.recursos === 'object') {
            if (obj.recursos.paginas_consulta && !obj.recursos.enlaces) {
                obj.recursos.enlaces = obj.recursos.paginas_consulta;
            }
            if (obj.recursos.actividades_refuerzo && !obj.recursos.refuerzo) {
                obj.recursos.refuerzo = obj.recursos.actividades_refuerzo;
            }
        }

        // 5. Normalize desarrollo process keys
        if (obj.momentos && obj.momentos.desarrollo && typeof obj.momentos.desarrollo === 'object') {
            const desarrollo = obj.momentos.desarrollo;

            // SessionDocument v1 already uses an ordered `procesos` array.
            // Legacy normalization must never rename or discard that array.
            if (Array.isArray(desarrollo.procesos)) {
                return obj;
            }

            const newDesarrollo = {};
            let index = 1;

            // Copy standard non-process keys
            if (desarrollo.tiempo_total) newDesarrollo.tiempo_total = desarrollo.tiempo_total;
            if (desarrollo.actividades) newDesarrollo.actividades = desarrollo.actividades;

            // Identify and sort process/step keys
            const otherKeys = Object.keys(desarrollo).filter(k => k !== 'tiempo_total' && k !== 'actividades');

            otherKeys.sort((a, b) => {
                const numA = parseInt(a.replace(/^\D+/g, ''), 10);
                const numB = parseInt(b.replace(/^\D+/g, ''), 10);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }
                return a.localeCompare(b);
            });

            // Normalize keys to 'proceso_X_[name]' format
            otherKeys.forEach(key => {
                const val = desarrollo[key];
                const cleanKey = key
                    .replace(/^(proceso|paso)_\d+_/, '')
                    .replace(/^(proceso|paso)_/, '');

                const standardKey = `proceso_${index}_${cleanKey}`;
                newDesarrollo[standardKey] = val;
                index++;
            });

            obj.momentos.desarrollo = newDesarrollo;
        }

        return obj;
    }

    /**
     * Run a supported action through an authenticated Supabase Edge Function.
     */
    async function runAction(action, input) {
        const provider = resolveProvider(CONFIG.model);
        if (await hasAuthenticatedUser()) {
            const functionName = provider.router;
            console.log('[AI Helper] Invoking edge function ' + functionName + ' for ' + action + '...');
            let data;
            try {
                data = await SupabaseClient.invokeFunction(functionName, {
                    action,
                    requestId: createRequestId(),
                    model: provider.model,
                    input
                });
            } catch (fnErr) {
                if (functionName === 'openai-router' && (fnErr.message?.includes('Modelo no permitido') || fnErr.message?.includes('MODEL_NOT_ALLOWED'))) {
                    console.warn('[AI Helper] Fallback automático a gpt-5.4-mini en openai-router...');
                    data = await SupabaseClient.invokeFunction('openai-router', {
                        action,
                        requestId: createRequestId(),
                        model: 'gpt-5.4-mini',
                        input
                    });
                } else {
                    throw fnErr;
                }
            }

            let text = data;
            if (data && typeof data === 'object') {
                text = data.choices?.[0]?.message?.content || data.content || JSON.stringify(data);
            }
            if (text) return text;
            throw new Error('La función de IA no devolvió contenido.');
        }
        throw new Error('Debes iniciar sesión para usar las funciones de IA.');
    }

    async function generateCriterios(competencia, tema, grado, area) {
        const result = await runAction('generate_criteria', { competencia, tema, grado, area });
        return result.trim().replace(/^```html|```$/g, '');
    }

    async function improveText(text, instruction) {
        const result = await runAction('refine_text', { text, instruction });
        return result.trim();
    }

    // ── SessionDocument v1 facade ──
    /**
     * Convierte datos legacy (salida IA o formulario) a SessionDocument v1.
     * @param {Object} legacyData - JSON legacy de la sesión.
     * @param {Object} [formMeta] - Metadata adicional del formulario del docente.
     * @returns {{ document: Object, warnings: string[], valid: boolean, errors: string[] }}
     */
    function toV1(legacyData, formMeta = {}) {
        if (typeof SessionAdapter === 'undefined') {
            console.warn('[AiCopilot] SessionAdapter no cargado, devolviendo datos sin adaptar.');
            return { document: legacyData, warnings: ['SessionAdapter no disponible'], valid: false, errors: ['SessionAdapter no cargado'] };
        }
        const { document, warnings } = SessionAdapter.adaptLegacyToV1(legacyData, formMeta);

        // Validar si SessionValidator está disponible
        let valid = true, errors = [];
        if (typeof SessionValidator !== 'undefined') {
            const result = SessionValidator.validate(document);
            valid = result.valid;
            errors = result.errors;
            if (result.warnings.length > 0) {
                warnings.push(...result.warnings);
            }
        }

        if (warnings.length > 0) {
            console.log('[AiCopilot] toV1 warnings:', warnings);
        }
        if (!valid) {
            console.warn('[AiCopilot] toV1 validation errors:', errors);
        }

        return { document, warnings, valid, errors };
    }

    // Initialize
    loadConfig();

    return {
        generateSession,
        configure,
        setProvider,
        loadConfig,
        generateCriterios,
        improveText,
        toV1
    };
})();

window.AiCopilot = AiCopilot;
