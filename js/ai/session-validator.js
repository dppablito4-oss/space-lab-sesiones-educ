/**
 * SessionValidator — Validador de SessionDocument v1 para el frontend.
 *
 * Valida documentos contra el contrato canónico sin dependencias externas.
 * No modifica el documento, solo reporta errores.
 *
 * Uso:
 *   const result = SessionValidator.validate(doc);
 *   if (!result.valid) console.error(result.errors);
 */
const SessionValidator = (() => {
    'use strict';

    const SCHEMA_VERSION = '1.0';

    // IDs de procesos pedagógicos reconocidos (no obligatorios, pero sirven para warnings)
    const KNOWN_PROCESS_IDS = new Set([
        // Inicio
        'motivacion', 'saberes_previos', 'problematizacion', 'proposito_organizacion',
        // Desarrollo (Polya)
        'familiarizacion', 'busqueda_estrategias', 'socializacion', 'formalizacion',
        'formalizacion_reflexion',
        'planteamiento_otros_problemas',
        // Desarrollo (ERCA)
        'experiencia', 'reflexion', 'conceptualizacion', 'aplicacion',
        // Desarrollo (Indagación)
        'planteamiento_problema', 'formulacion_hipotesis', 'elaboracion_plan',
        'recojo_datos', 'analisis_resultados', 'evaluacion_comunicacion',
        'diseno_estrategias', 'generacion_analisis_datos', 'estructuracion_comunicacion',
        // Desarrollo (ABP, aula invertida y cooperativo)
        'lanzamiento', 'indagacion', 'desarrollo_producto', 'difusion_evaluacion',
        'conexion_externa', 'aplicacion_guiada', 'consolidacion_retroalimentacion',
        'organizacion_roles', 'interdependencia_positiva', 'interaccion_promotora',
        'autoevaluacion_grupal',
        // Desarrollo (genérico)
        'proceso_didactico', 'actividad',
        // Cierre
        'metacognicion', 'evaluacion', 'evaluacion_formativa', 'extension',
    ]);

    const VALID_LEVELS = new Set(['INICIAL', 'PRIMARIA', 'SECUNDARIA', '']);
    const VALID_FORMATS = new Set(['html', 'text']);

    /**
     * @typedef {Object} ValidationResult
     * @property {boolean} valid
     * @property {string[]} errors  - Errores que impiden el procesamiento.
     * @property {string[]} warnings - Advertencias que no impiden el procesamiento.
     */

    /**
     * Valida un objeto contra el contrato SessionDocument v1.
     * @param {Object} doc - Documento a validar.
     * @returns {ValidationResult}
     */
    function validate(doc) {
        const errors = [];
        const warnings = [];

        if (!doc || typeof doc !== 'object') {
            return { valid: false, errors: ['El documento es nulo o no es un objeto.'], warnings };
        }

        // schemaVersion
        if (doc.schemaVersion !== SCHEMA_VERSION) {
            errors.push(`schemaVersion debe ser "${SCHEMA_VERSION}", recibido: "${doc.schemaVersion}".`);
        }

        // metadata
        if (!doc.metadata || typeof doc.metadata !== 'object') {
            errors.push('metadata es requerido y debe ser un objeto.');
        } else {
            _validateMetadata(doc.metadata, errors, warnings);
        }

        // proposito
        if (!doc.proposito || typeof doc.proposito !== 'object') {
            errors.push('proposito es requerido y debe ser un objeto.');
        } else {
            _validateProposito(doc.proposito, errors, warnings);
        }

        // competenciasTransversales
        if (doc.competenciasTransversales !== undefined) {
            if (!Array.isArray(doc.competenciasTransversales)) {
                errors.push('competenciasTransversales debe ser un array.');
            } else {
                doc.competenciasTransversales.forEach((ct, i) => {
                    if (!ct.titulo) warnings.push(`competenciasTransversales[${i}].titulo está vacío.`);
                });
            }
        }

        // enfoquesTransversales
        if (doc.enfoquesTransversales !== undefined) {
            if (!Array.isArray(doc.enfoquesTransversales)) {
                errors.push('enfoquesTransversales debe ser un array.');
            } else {
                doc.enfoquesTransversales.forEach((et, i) => {
                    if (!et.nombre) warnings.push(`enfoquesTransversales[${i}].nombre está vacío.`);
                });
            }
        }

        // momentos
        if (!doc.momentos || typeof doc.momentos !== 'object') {
            errors.push('momentos es requerido y debe ser un objeto.');
        } else {
            _validateMomentos(doc.momentos, errors, warnings);
        }

        // evaluacion (no debe eliminarse)
        if (doc.evaluacion !== undefined && typeof doc.evaluacion !== 'object') {
            errors.push('evaluacion debe ser un objeto si está presente.');
        }

        if (doc.presentation !== undefined) {
            const p = doc.presentation;
            if (!p || typeof p !== 'object' || Array.isArray(p)) {
                errors.push('presentation debe ser un objeto.');
            } else {
                ['primaryColor', 'accentColor', 'headerBackground'].forEach(key => {
                    if (p[key] !== undefined && !/^#[0-9A-F]{6}$/i.test(p[key])) {
                        errors.push(`presentation.${key} debe usar formato #RRGGBB.`);
                    }
                });
                if (p.fontSizePt !== undefined && (typeof p.fontSizePt !== 'number' || p.fontSizePt < 8 || p.fontSizePt > 12)) {
                    errors.push('presentation.fontSizePt debe estar entre 8 y 12.');
                }
                if (p.lineHeight !== undefined && (typeof p.lineHeight !== 'number' || p.lineHeight < 1 || p.lineHeight > 1.8)) {
                    errors.push('presentation.lineHeight debe estar entre 1 y 1.8.');
                }
            }
        }

        // fichaTrabajo
        if (doc.fichaTrabajo !== undefined && doc.fichaTrabajo !== null) {
            if (typeof doc.fichaTrabajo !== 'object') {
                errors.push('fichaTrabajo debe ser un objeto o null.');
            }
        }

        // juegoLibreSectores
        if (doc.juegoLibreSectores !== undefined && doc.juegoLibreSectores !== null) {
            if (typeof doc.juegoLibreSectores !== 'object') {
                errors.push('juegoLibreSectores debe ser un objeto o null.');
            }
        }

        // listaCotejo
        if (doc.listaCotejo !== undefined) {
            if (typeof doc.listaCotejo !== 'object') {
                errors.push('listaCotejo debe ser un objeto.');
            } else {
                if (doc.listaCotejo.alumnos && !Array.isArray(doc.listaCotejo.alumnos)) {
                    errors.push('listaCotejo.alumnos debe ser un array.');
                }
                if (doc.listaCotejo.criterios && !Array.isArray(doc.listaCotejo.criterios)) {
                    errors.push('listaCotejo.criterios debe ser un array.');
                }
            }
        }

        // Campos desconocidos de nivel superior
        const knownTopLevel = new Set([
            'schemaVersion', 'metadata', 'proposito', 'competenciasTransversales',
            'enfoquesTransversales', 'recursos', 'momentos', 'evaluacion',
            'fichaTrabajo', 'juegoLibreSectores', 'listaCotejo', 'presentation'
        ]);
        Object.keys(doc).forEach(key => {
            if (!knownTopLevel.has(key)) {
                warnings.push(`Campo de nivel superior no reconocido: "${key}".`);
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    // ── Validadores internos ──

    function _validateMetadata(m, errors, warnings) {
        if (typeof m.duracionMinutos !== 'undefined') {
            if (typeof m.duracionMinutos !== 'number' || m.duracionMinutos < 1) {
                errors.push('metadata.duracionMinutos debe ser un entero >= 1.');
            }
        }
        if (m.nivel && !VALID_LEVELS.has(m.nivel.toUpperCase())) {
            warnings.push(`metadata.nivel "${m.nivel}" no es un nivel reconocido (INICIAL|PRIMARIA|SECUNDARIA).`);
        }
        if (!m.titulo) {
            warnings.push('metadata.titulo está vacío.');
        }
    }

    function _validateProposito(p, errors, warnings) {
        if (p.capacidades && !Array.isArray(p.capacidades)) {
            errors.push('proposito.capacidades debe ser un array.');
        }
        if (p.criterios && !Array.isArray(p.criterios)) {
            errors.push('proposito.criterios debe ser un array.');
        }
        if (!p.competencia) {
            warnings.push('proposito.competencia está vacío.');
        }
    }

    function _validateMomentos(momentos, errors, warnings) {
        ['inicio', 'desarrollo', 'cierre'].forEach(key => {
            if (!momentos[key] || typeof momentos[key] !== 'object') {
                errors.push(`momentos.${key} es requerido y debe ser un objeto.`);
                return;
            }
            const m = momentos[key];

            if (typeof m.tiempoMinutos !== 'undefined') {
                if (typeof m.tiempoMinutos !== 'number' || m.tiempoMinutos < 0) {
                    errors.push(`momentos.${key}.tiempoMinutos debe ser un entero >= 0.`);
                }
            }

            if (!m.procesos || !Array.isArray(m.procesos)) {
                errors.push(`momentos.${key}.procesos es requerido y debe ser un array.`);
                return;
            }

            m.procesos.forEach((proc, i) => {
                _validateProcess(proc, `momentos.${key}.procesos[${i}]`, errors, warnings);
            });
        });

        // Validar suma de tiempos
        if (momentos.inicio && momentos.desarrollo && momentos.cierre) {
            const total = (momentos.inicio.tiempoMinutos || 0) +
                          (momentos.desarrollo.tiempoMinutos || 0) +
                          (momentos.cierre.tiempoMinutos || 0);
            if (total > 0 && momentos.inicio.tiempoMinutos !== undefined) {
                // Solo validar si al menos un tiempo fue especificado
                // No es error, es warning informativo
            }
        }
    }

    function _validateProcess(proc, path, errors, warnings) {
        if (!proc || typeof proc !== 'object') {
            errors.push(`${path} debe ser un objeto.`);
            return;
        }
        if (!proc.id || typeof proc.id !== 'string') {
            errors.push(`${path}.id es requerido y debe ser un string.`);
        } else if (!KNOWN_PROCESS_IDS.has(proc.id)) {
            warnings.push(`${path}.id "${proc.id}" no es un ID de proceso reconocido.`);
        }
        if (!proc.titulo || typeof proc.titulo !== 'string') {
            errors.push(`${path}.titulo es requerido y debe ser un string.`);
        }
        if (!proc.contenido || typeof proc.contenido !== 'object') {
            errors.push(`${path}.contenido es requerido y debe ser un objeto RichContent.`);
        } else {
            if (!VALID_FORMATS.has(proc.contenido.format)) {
                errors.push(`${path}.contenido.format debe ser "html" o "text", recibido: "${proc.contenido.format}".`);
            }
            if (typeof proc.contenido.value !== 'string') {
                errors.push(`${path}.contenido.value debe ser un string.`);
            }
        }
    }

    /**
     * Control de calidad exclusivo para respuestas recién generadas por IA.
     * El validador estructural sigue aceptando borradores/importaciones parciales;
     * este control evita presentar y exportar una sesión pobre como terminada.
     */
    function validateGeneratedContent(doc) {
        const structural = validate(doc);
        const errors = [...structural.errors];
        const warnings = [...structural.warnings];

        if (!structural.valid) return { valid: false, errors, warnings };

        const requiredText = [
            ['metadata.titulo', doc.metadata?.titulo],
            ['proposito.competencia', doc.proposito?.competencia],
            ['proposito.desempeno', doc.proposito?.desempeno],
            ['proposito.evidencia', doc.proposito?.evidencia]
        ];
        requiredText.forEach(([path, value]) => {
            if (!String(value || '').trim()) errors.push(`${path} no puede quedar vacío en una sesión generada.`);
        });

        if ((doc.proposito?.capacidades || []).filter(Boolean).length < 2) {
            errors.push('La sesión generada debe incluir al menos 2 capacidades pertinentes.');
        }
        if ((doc.proposito?.criterios || []).filter(Boolean).length < 3) {
            errors.push('La sesión generada debe incluir al menos 3 criterios observables.');
        }

        const minimumProcesses = { inicio: 4, desarrollo: 3, cierre: 3 };
        let totalChars = 0;
        Object.entries(minimumProcesses).forEach(([moment, minimum]) => {
            const processes = doc.momentos?.[moment]?.procesos || [];
            if (processes.length < minimum) {
                errors.push(`momentos.${moment} debe incluir al menos ${minimum} procesos desarrollados.`);
            }
            processes.forEach((process, index) => {
                const plain = String(process?.contenido?.value || '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/&nbsp;|&#160;/gi, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                totalChars += plain.length;
                if (plain.length < 80 || /^(\.\.\.|pendiente|por completar)$/i.test(plain)) {
                    errors.push(`momentos.${moment}.procesos[${index}] tiene contenido insuficiente.`);
                }
            });
        });
        if (totalChars < 1800) {
            errors.push('La sesión generada es demasiado breve; debe desarrollar acciones, preguntas y dinámicas concretas.');
        }

        return { valid: errors.length === 0, errors, warnings };
    }

    // ── API pública ──
    return {
        validate,
        validateGeneratedContent,
        SCHEMA_VERSION,
        KNOWN_PROCESS_IDS
    };
})();

// Export para uso en Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionValidator;
}
