/**
 * SessionAdapter — Convierte formato legacy de IA a SessionDocument v1.
 *
 * ESTE ES EL ÚNICO LUGAR donde se transforma el formato antiguo al contrato v1.
 * Cuando la IA produzca v1 directamente, este adapter será compatibilidad legacy.
 *
 * Reglas:
 *   - NUNCA descartar campos silenciosamente.
 *   - Los campos no reconocidos se registran como warnings.
 *   - El resultado siempre debe ser validable por SessionValidator.
 *
 * Uso:
 *   const { document, warnings } = SessionAdapter.adaptLegacyToV1(rawAiOutput, metadata);
 */
const SessionAdapter = (() => {
    'use strict';

    // ── Utilidades ──

    function _str(v) {
        if (v === null || v === undefined) return '';
        if (typeof v === 'string') return v.trim();
        if (Array.isArray(v)) return v.map(x => String(x).trim()).join('\n');
        return String(v).trim();
    }

    function _arr(v) {
        if (Array.isArray(v)) return v.map(x => _str(x)).filter(Boolean);
        if (typeof v === 'string') return v.split('\n').map(s => s.trim()).filter(Boolean);
        return [];
    }

    function _int(v, fallback = 0) {
        if (typeof v === 'number') return Math.round(v);
        if (typeof v === 'string') {
            const n = parseInt(v.replace(/[^\d]/g, ''), 10);
            return isNaN(n) ? fallback : n;
        }
        return fallback;
    }

    /**
     * Convierte un string o HTML a un RichContent object.
     */
    function _richContent(v) {
        const s = _str(v);
        // If it contains HTML tags, mark as html; else text
        const isHtml = /<[a-z][\s\S]*>/i.test(s);
        return { format: isHtml ? 'html' : 'text', value: s };
    }

    /**
     * Humaniza una clave de proceso: "proceso_1_familiarizacion" → "Familiarización"
     */
    function _humanizeKey(key) {
        const parts = key.split('_');
        const cleaned = parts
            .filter(p => !/^\d+$/.test(p) && !['proceso', 'paso'].includes(p.toLowerCase()))
            .map(p => p.charAt(0).toUpperCase() + p.slice(1))
            .join(' ');
        return cleaned || key.replace(/_/g, ' ');
    }

    /**
     * Derive process ID from a key like "proceso_1_familiarizacion"
     */
    function _deriveProcessId(key) {
        return key
            .replace(/^(proceso|paso)_\d+_?/i, '')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '') || key;
    }

    // ── Adapter principal ──

    /**
     * Adapta la salida legacy de la IA al contrato SessionDocument v1.
     *
     * @param {Object} raw - JSON crudo devuelto por la IA (o el legacy normalizer JS).
     * @param {Object} [formMeta] - Metadata del formulario del docente (institucion, dre, etc.)
     * @returns {{ document: Object, warnings: string[] }}
     */
    function adaptLegacyToV1(raw, formMeta = {}) {
        const warnings = [];

        if (!raw || typeof raw !== 'object') {
            return { document: { schemaVersion: '1.0', metadata: {}, proposito: {}, momentos: { inicio: { procesos: [] }, desarrollo: { procesos: [] }, cierre: { procesos: [] } } }, warnings: ['Input vacío o inválido.'] };
        }

        // Si ya es v1, devolver directamente
        if (raw.schemaVersion === '1.0') {
            return { document: raw, warnings: [] };
        }

        const doc = { schemaVersion: '1.0' };

        // ── 1. Metadata ──
        const rawMeta = raw.metadata || {};
        doc.metadata = {
            institucion:    _str(formMeta.institucion || rawMeta.institucion),
            dre:            _str(formMeta.dre || rawMeta.dre),
            ugel:           _str(formMeta.ugel || rawMeta.ugel),
            docente:        _str(formMeta.docente || rawMeta.docente),
            director:       _str(formMeta.director || rawMeta.director),
            fecha:          _str(formMeta.fecha || rawMeta.fecha),
            nivel:          _str(formMeta.nivel || rawMeta.nivel),
            grado:          _str(formMeta.grado || rawMeta.grado),
            seccion:        _str(formMeta.seccion || rawMeta.seccion),
            area:           _str(formMeta.area || rawMeta.area),
            numeroSesion:   _str(formMeta.numero_sesion || rawMeta.numero_sesion || rawMeta.numeroSesion),
            duracionMinutos: _int(formMeta.duracion || rawMeta.duracion || rawMeta.duracionMinutos, 90),
            unidad:         _str(formMeta.unidad || rawMeta.unidad),
            titulo:         _str(formMeta.titulo || rawMeta.titulo || raw.titulo_sesion_retador || raw.titulo_sesion),
            logos: {
                institucional: rawMeta.logo_left_url || rawMeta.logo_institucional || null,
                regional:      rawMeta.logo_regional_url || rawMeta.logo_regional || null
            }
        };

        // ── 2. Propósito ──
        const rawP = raw.proposito || raw.propositos || raw.proposito_aprendizaje || {};
        doc.proposito = {
            texto:        _str(rawP.proposito_texto || rawP.proposito || rawP.proposito_sesion || rawP.texto),
            competencia:  _str(rawP.competencia),
            capacidades:  _arr(rawP.capacidades || rawP.capacidad),
            estandar:     _str(rawP.estandar || rawP.estandar_aprendizaje),
            desempeno:    _str(rawP.desempeno || rawP.desempeño || rawP.desempeno_grado),
            conocimientos: _str(rawP.conocimientos || rawP.contenido || rawP.temas),
            criterios:    _arr(rawP.criterios || rawP.criterios_evaluacion || rawP.criterio_evaluacion),
            evidencia:    _str(rawP.producto_evidencia || rawP.evidencia || rawP.producto),
            instrumento:  _str(rawP.instrumento || rawP.instrumento_evaluacion)
        };

        // ── 3. Competencias Transversales ──
        const rawCT = raw.competencias_transversales || raw.competenciasTransversales;
        doc.competenciasTransversales = [];
        if (rawCT && typeof rawCT === 'object' && !Array.isArray(rawCT)) {
            // Legacy format: { tic: [...], autonoma: [...] }
            const ticItems = rawCT.tic || rawCT.TIC || [];
            const autonomaItems = rawCT.autonoma || rawCT.gestiona_aprendizaje || [];
            if (ticItems.length > 0 || (typeof ticItems === 'string' && ticItems)) {
                doc.competenciasTransversales.push({
                    titulo: 'Se desenvuelve en los entornos virtuales generados por las TIC',
                    desempenos: _arr(ticItems)
                });
            }
            if (autonomaItems.length > 0 || (typeof autonomaItems === 'string' && autonomaItems)) {
                doc.competenciasTransversales.push({
                    titulo: 'Gestiona su aprendizaje de manera autónoma',
                    desempenos: _arr(autonomaItems)
                });
            }
        } else if (Array.isArray(rawCT)) {
            // Already array format
            rawCT.forEach(ct => {
                if (ct && typeof ct === 'object') {
                    doc.competenciasTransversales.push({
                        titulo: _str(ct.titulo || ct.nombre || ct.competencia || 'Competencia Transversal'),
                        desempenos: _arr(ct.desempenos || ct.desempeños || ct.criterios)
                    });
                }
            });
        }

        // ── 4. Enfoques Transversales ──
        const rawEnf = raw.enfoques || raw.enfoques_transversales || raw.enfoquesTransversales || [];
        doc.enfoquesTransversales = [];
        if (Array.isArray(rawEnf)) {
            rawEnf.forEach(e => {
                if (e && typeof e === 'object') {
                    doc.enfoquesTransversales.push({
                        nombre:   _str(e.nombre || e.enfoque || e.titulo),
                        valor:    _str(e.valor || e.valores),
                        actitudes: _str(e.actitudes || e.actitud || e.acciones_observables)
                    });
                }
            });
        }

        // ── 5. Recursos ──
        const rawR = raw.recursos || {};
        doc.recursos = {
            enlaces:    _str(rawR.enlaces || rawR.paginas_consulta || rawR.paginas_de_consulta || rawR.referencias || rawR.bibliografia),
            materiales: _str(rawR.materiales || rawR.recursos || rawR.materiales_y_recursos),
            refuerzo:   _str(rawR.refuerzo || rawR.actividades_refuerzo || rawR.actividades_de_refuerzo || rawR.refuerzo_escolar)
        };

        // ── 6. Momentos ──
        const rawMom = raw.momentos || raw.secuencia_didactica || {};
        doc.momentos = {
            inicio:     _adaptInicio(rawMom.inicio || rawMom.introduccion, warnings),
            desarrollo: _adaptDesarrollo(rawMom.desarrollo || rawMom.proceso, warnings),
            cierre:     _adaptCierre(rawMom.cierre || rawMom.conclusion, warnings)
        };

        // ── 7. Evaluación (NUNCA eliminar) ──
        const rawEval = raw.evaluacion || {};
        doc.evaluacion = {
            criterioConsolidado: _str(rawEval.criterio || rawEval.criterio_consolidado || rawEval.criterioConsolidado),
            evidencia:           _str(rawEval.evidencia || rawEval.producto || doc.proposito.evidencia),
            instrumento:         _str(rawEval.instrumento || doc.proposito.instrumento)
        };

        // ── 8. Ficha de trabajo ──
        const rawFicha = raw.ficha_trabajo || raw.fichaTrabajo;
        if (rawFicha && typeof rawFicha === 'object') {
            doc.fichaTrabajo = {
                titulo:       _str(rawFicha.titulo || rawFicha.actividad || rawFicha.nombre),
                indicaciones: _str(rawFicha.indicaciones || rawFicha.instrucciones),
                actividades:  _str(rawFicha.actividades || rawFicha.contenido || rawFicha.ejercicios)
            };
        } else {
            doc.fichaTrabajo = null;
        }

        // ── 9. Juego Libre en los Sectores ──
        const rawJLS = raw.juego_libre_sectores || raw.juegoLibreSectores || raw.juego_libre;
        if (rawJLS && typeof rawJLS === 'object') {
            doc.juegoLibreSectores = {
                planificacion:  _str(rawJLS.planificacion || rawJLS.planificación),
                organizacion:   _str(rawJLS.organizacion || rawJLS.organización),
                ejecucion:      _str(rawJLS.ejecucion || rawJLS.ejecución),
                orden:          _str(rawJLS.orden),
                socializacion:  _str(rawJLS.socializacion || rawJLS.socialización),
                representacion: _str(rawJLS.representacion || rawJLS.representación)
            };
        } else {
            doc.juegoLibreSectores = null;
        }

        // ── 10. Lista de Cotejo ──
        const rawAlumnos = raw.alumnos || raw.estudiantes || raw.lista_alumnos || [];
        doc.listaCotejo = {
            alumnos: _arr(rawAlumnos),
            criterios: doc.proposito.criterios.length > 0
                ? [...doc.proposito.criterios]
                : []
        };

        // ── 11. Detectar campos no mapeados ──
        const knownTopKeys = new Set([
            'metadata', 'proposito', 'propositos', 'proposito_aprendizaje',
            'competencias_transversales', 'competenciasTransversales',
            'enfoques', 'enfoques_transversales', 'enfoquesTransversales',
            'recursos', 'momentos', 'secuencia_didactica',
            'evaluacion', 'ficha_trabajo', 'fichaTrabajo',
            'juego_libre_sectores', 'juegoLibreSectores', 'juego_libre',
            'alumnos', 'estudiantes', 'lista_alumnos',
            'titulo_sesion_retador', 'titulo_sesion',
            'token', 'schemaVersion'
        ]);
        Object.keys(raw).forEach(key => {
            if (!knownTopKeys.has(key)) {
                warnings.push(`[LEGACY ADAPTER] Campo no reconocido: "${key}"`);
            }
        });

        return { document: doc, warnings };
    }

    // ── Adaptadores de Momentos ──

    function _adaptInicio(rawInicio, warnings) {
        const result = { tiempoMinutos: 15, procesos: [] };
        if (!rawInicio || typeof rawInicio !== 'object') return result;

        // Tiempo
        result.tiempoMinutos = _int(rawInicio.tiempo_total || rawInicio.tiempo || rawInicio.tiempoMinutos, 15);

        // Si ya tiene procesos v1
        if (Array.isArray(rawInicio.procesos) && rawInicio.procesos.length > 0 &&
            rawInicio.procesos[0].id && rawInicio.procesos[0].contenido) {
            result.procesos = rawInicio.procesos;
            return result;
        }

        // Si tiene actividades como array (formato getFormDataJSON)
        if (Array.isArray(rawInicio.actividades) && rawInicio.actividades.length > 0) {
            result.procesos = [{
                id: 'actividad',
                orden: 1,
                titulo: 'Actividades de inicio',
                contenido: _richContent(rawInicio.actividades.map(a => `<p>${a}</p>`).join(''))
            }];
            return result;
        }

        // Legacy sub-momentos de la IA: motivacion, saberes_previos, etc.
        const subKeys = [
            { key: 'motivacion',            id: 'motivacion',            titulo: 'Motivación' },
            { key: 'saberes_previos',       id: 'saberes_previos',       titulo: 'Saberes previos' },
            { key: 'problematizacion',      id: 'problematizacion',      titulo: 'Problematización' },
            { key: 'proposito_organizacion', id: 'proposito_organizacion', titulo: 'Propósito y organización' }
        ];

        let orden = 1;
        subKeys.forEach(({ key, id, titulo }) => {
            const val = rawInicio[key];
            if (val && _str(val)) {
                result.procesos.push({
                    id,
                    orden: orden++,
                    titulo,
                    contenido: _richContent(val)
                });
            }
        });

        // Si no se encontró nada, intentar con actividades como string
        if (result.procesos.length === 0 && rawInicio.actividades) {
            result.procesos = [{
                id: 'actividad',
                orden: 1,
                titulo: 'Actividades de inicio',
                contenido: _richContent(rawInicio.actividades)
            }];
        }

        return result;
    }

    function _adaptDesarrollo(rawDesarrollo, warnings) {
        const result = { tiempoMinutos: 65, procesos: [] };
        if (!rawDesarrollo || typeof rawDesarrollo !== 'object') return result;

        // Tiempo
        result.tiempoMinutos = _int(rawDesarrollo.tiempo_total || rawDesarrollo.tiempo || rawDesarrollo.tiempoMinutos, 65);

        // Si ya tiene procesos v1
        if (Array.isArray(rawDesarrollo.procesos) && rawDesarrollo.procesos.length > 0) {
            // Check if they are already v1 format (with id and contenido object)
            if (rawDesarrollo.procesos[0].id && rawDesarrollo.procesos[0].contenido &&
                typeof rawDesarrollo.procesos[0].contenido === 'object') {
                result.procesos = rawDesarrollo.procesos;
                return result;
            }

            // Frontend format: { clave, titulo, contenido: string[] }
            rawDesarrollo.procesos.forEach((pr, idx) => {
                const contenidoArr = Array.isArray(pr.contenido) ? pr.contenido : [_str(pr.contenido)];
                result.procesos.push({
                    id: _str(pr.clave) || `proceso_${idx + 1}`,
                    orden: idx + 1,
                    titulo: _str(pr.titulo) || `Proceso ${idx + 1}`,
                    contenido: _richContent(contenidoArr.map(c => `<p>${c}</p>`).join(''))
                });
            });
            return result;
        }

        // Legacy flat keys: proceso_1_familiarizacion, proceso_2_busqueda, etc.
        const processKeys = Object.keys(rawDesarrollo)
            .filter(k => /^(proceso|paso)_\d+/i.test(k))
            .sort((a, b) => {
                const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
                const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
                return numA - numB;
            });

        processKeys.forEach((key, idx) => {
            const val = rawDesarrollo[key];
            result.procesos.push({
                id: _deriveProcessId(key),
                orden: idx + 1,
                titulo: _humanizeKey(key),
                contenido: _richContent(val)
            });
        });

        if (result.procesos.length === 0 && rawDesarrollo.actividades) {
            result.procesos = [{
                id: 'actividad',
                orden: 1,
                titulo: 'Proceso didáctico',
                contenido: _richContent(rawDesarrollo.actividades)
            }];
        }

        return result;
    }

    function _adaptCierre(rawCierre, warnings) {
        const result = { tiempoMinutos: 10, procesos: [] };
        if (!rawCierre || typeof rawCierre !== 'object') return result;

        // Tiempo
        result.tiempoMinutos = _int(rawCierre.tiempo_total || rawCierre.tiempo || rawCierre.tiempoMinutos, 10);

        // Si ya tiene procesos v1
        if (Array.isArray(rawCierre.procesos) && rawCierre.procesos.length > 0 &&
            rawCierre.procesos[0].id && rawCierre.procesos[0].contenido) {
            result.procesos = rawCierre.procesos;
            return result;
        }

        let orden = 1;

        // Structured cierre: metacognicion, evaluacion, extension as separate fields
        if (rawCierre.metacognicion || rawCierre.evaluacion || rawCierre.extension) {
            if (rawCierre.metacognicion) {
                const items = _arr(rawCierre.metacognicion);
                if (items.length > 0) {
                    result.procesos.push({
                        id: 'metacognicion',
                        orden: orden++,
                        titulo: 'Metacognición',
                        contenido: _richContent('<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>')
                    });
                }
            }
            if (rawCierre.evaluacion) {
                const items = _arr(rawCierre.evaluacion);
                if (items.length > 0) {
                    result.procesos.push({
                        id: 'evaluacion',
                        orden: orden++,
                        titulo: 'Evaluación formativa',
                        contenido: _richContent(items.map(i => `<p>${i}</p>`).join(''))
                    });
                }
            }
            if (rawCierre.extension) {
                const items = _arr(rawCierre.extension);
                if (items.length > 0) {
                    result.procesos.push({
                        id: 'extension',
                        orden: orden++,
                        titulo: 'Extensión',
                        contenido: _richContent(items.map(i => `<p>${i}</p>`).join(''))
                    });
                }
            }
        }

        // Fallback: cierre.actividades as a single text blob
        if (result.procesos.length === 0 && rawCierre.actividades) {
            const text = _str(rawCierre.actividades);
            // Try to split by sections
            const sections = _splitCierreText(text);
            if (sections.metacognicion.length > 0) {
                result.procesos.push({
                    id: 'metacognicion', orden: orden++, titulo: 'Metacognición',
                    contenido: _richContent('<ul>' + sections.metacognicion.map(i => `<li>${i}</li>`).join('') + '</ul>')
                });
            }
            if (sections.evaluacion.length > 0) {
                result.procesos.push({
                    id: 'evaluacion', orden: orden++, titulo: 'Evaluación formativa',
                    contenido: _richContent(sections.evaluacion.map(i => `<p>${i}</p>`).join(''))
                });
            }
            if (sections.extension.length > 0) {
                result.procesos.push({
                    id: 'extension', orden: orden++, titulo: 'Extensión',
                    contenido: _richContent(sections.extension.map(i => `<p>${i}</p>`).join(''))
                });
            }
            // If splitting didn't work, keep everything
            if (result.procesos.length === 0) {
                result.procesos.push({
                    id: 'metacognicion', orden: 1, titulo: 'Cierre',
                    contenido: _richContent(text)
                });
            }
        }

        return result;
    }

    /**
     * Split a cierre text blob into metacognicion, evaluacion, extension sections.
     * Mirrors the logic in backend/main.py _split_cierre_actividades.
     */
    function _splitCierreText(text) {
        const meta = [], evalu = [], ext = [];
        let current = meta;

        text.split('\n').forEach(line => {
            line = line.trim();
            if (!line) return;
            const ll = line.toLowerCase();

            if (ll.includes('metacognici')) {
                current = meta;
            } else if (ll.includes('evaluaci')) {
                current = evalu;
            } else if (ll.includes('extensi') || ll.includes('tarea') || ll.includes('casa')) {
                current = ext;
            }

            const clean = line.replace(/^[•\-\*\d\.\)]+\s*/, '').trim();
            if (clean) current.push(clean);
        });

        return { metacognicion: meta, evaluacion: evalu, extension: ext };
    }

    // ── API pública ──
    return {
        adaptLegacyToV1
    };
})();

// Export para Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionAdapter;
}
