/** Export and local-engine controller. Keeps SessionDocument payload behavior unchanged. */
window.SpaceLabExportController = (() => {
    'use strict';

    function create(dependencies) {
        const {
            state: AppState,
            dom: DOM,
            parseMinutes,
            saveCurrentState
        } = dependencies;

        function handlePrint() {
            if (!AppState.currentSession) {
                Toast.warning('Genera una sesión primero');
                return;
            }
        
            // Save before printing
            saveCurrentState();
        
            window.print();
        }
        
        // ─── PDF GUIDE MODAL (replaces old html2pdf flow) ───
        
        function showPdfGuide() {
            if (!AppState.currentSession) {
                Toast.warning('Genera una sesión primero');
                return;
            }
            const modal = document.getElementById('pdf-guide-modal');
            if (modal) modal.classList.remove('hidden');
        }
        
        function closePdfGuide() {
            const modal = document.getElementById('pdf-guide-modal');
            if (modal) modal.classList.add('hidden');
        }
        
        function showEngineModal() {
            const modal = document.getElementById('engine-required-modal');
            if (modal) modal.classList.remove('hidden');
        }
        
        function closeEngineModal() {
            const modal = document.getElementById('engine-required-modal');
            if (modal) modal.classList.add('hidden');
        }
        
        function updateBackendUI() {
            const btn = document.getElementById('btn-download-engine');
            if (!btn) return;
        
            if (AppState.backendOnline) {
                btn.removeAttribute('href');
                btn.removeAttribute('target');
                btn.classList.add('btn-connected');
                btn.title = 'Motor de Exportación Local Conectado';
        
                const iconUse = btn.querySelector('svg use');
                if (iconUse) iconUse.setAttribute('href', '#icon-check');
        
                const label = btn.querySelector('.btn-label');
                if (label) label.textContent = 'Motor Activo';
            } else {
                btn.href = 'https://descargas.sypablitodp.site';
                btn.setAttribute('target', '_blank');
                btn.classList.remove('btn-connected');
                btn.title = 'Descargar Motor de Exportación Local (.exe)';
        
                const iconUse = btn.querySelector('svg use');
                if (iconUse) iconUse.setAttribute('href', '#icon-download');
        
                const label = btn.querySelector('.btn-label');
                if (label) label.textContent = 'Descargar Motor';
            }
        }
        
        let lastBackendState = null;
        async function checkBackendStatus() {
            const token = localStorage.getItem('connection_token');
            const status = await window.LocalExportClient.getStatus(token);
            AppState.backendRunning = status.running;
            AppState.backendOnline = status.online;
        
            if (!status.running) {
                if (lastBackendState !== false) {
                    console.log('[INFO] El motor de exportación local está apagado o inaccesible.');
                    lastBackendState = false;
                }
                updateBackendUI();
                return;
            }
        
            if (!status.online) {
                if (lastBackendState !== false) {
                    console.log(status.reason === 'missing-token'
                        ? '[INFO] El motor local está encendido, pero no hay token de conexión en localStorage.'
                        : '[INFO] El motor local está encendido, pero el token guardado no es válido o expiró.');
                    lastBackendState = false;
                }
                updateBackendUI();
                return;
            }
        
            if (lastBackendState !== true) {
                console.log('[OK] Enlace seguro con el motor de exportación en Python confirmado.');
                lastBackendState = true;
            }
            updateBackendUI();
        }
        
        function getFormDataJSON() {
            if (!AppState.currentSession) return null;
        
            // SessionDocument v1 ya es la fuente de verdad. No reconstruirlo desde
            // textContent: eso elimina HTML, títulos e identidad de los procesos.
            if (window.SessionExport && AppState.currentSession.schemaVersion === '1.0') {
                const textAlumnos = document.getElementById('textarea-alumnos')?.value || '';
                const alumnos = textAlumnos.split('\n').map(line => line.trim()).filter(Boolean);
                const currentMetadata = AppState.currentSession.metadata || {};
                const canonicalPayload = SessionExport.buildCanonicalPayload(AppState.currentSession, {
                    metadata: {
                        institucion: DOM.inputInstitucion.value || currentMetadata.institucion || '',
                        dre: DOM.inputDre.value || currentMetadata.dre || '',
                        ugel: DOM.inputUgel.value || currentMetadata.ugel || '',
                        docente: DOM.inputDocente.value || currentMetadata.docente || '',
                        director: DOM.inputDirector.value || currentMetadata.director || '',
                        fecha: DOM.inputFecha.value || currentMetadata.fecha || '',
                        nivel: DOM.inputNivel.value || currentMetadata.nivel || '',
                        numeroSesion: DOM.inputNumeroSesion.value || currentMetadata.numeroSesion || '',
                        grado: DOM.inputGrado.value || currentMetadata.grado || '',
                        seccion: DOM.inputSeccion.value || currentMetadata.seccion || '',
                        area: DOM.inputArea.value || currentMetadata.area || '',
                        duracionMinutos: parseMinutes(DOM.inputDuracion.value) || currentMetadata.duracionMinutos || 90,
                        unidad: DOM.inputUnidad.value || currentMetadata.unidad || '',
                        titulo: DOM.inputTitulo.value || currentMetadata.titulo || ''
                    },
                    alumnos: alumnos.length > 0 ? alumnos : (AppState.currentSession.listaCotejo?.alumnos || []),
                    presentation: DocumentPresentation.normalize(AppState.currentSession.presentation || AppState.currentSession.design || {}),
                    token: localStorage.getItem('connection_token') || ''
                });
                if (canonicalPayload) return canonicalPayload;
            }
        
            // 1. Recopilar Logos
            const logos = [];
            const logoImgs = DOM.sessionSheet.querySelectorAll('.official-logo-img');
            logoImgs.forEach((img, index) => {
                logos.push({
                    url: img.getAttribute('src') || ''
                });
            });
            const logoLeft = logos[0]?.url || '';
            const logoRegional = logos[1]?.url || '';
        
            // Parse metadata directly from the A4 sheet if present, to sync user edits
            const sheetMetadata = {};
            if (DOM.sessionSheet) {
                const cells = DOM.sessionSheet.querySelectorAll('td');
                cells.forEach((cell, idx) => {
                    const text = cell.textContent.trim().replace(/:$/, '').toLowerCase();
                    const nextCell = cells[idx + 1];
                    if (nextCell) {
                        const val = nextCell.textContent.trim();
                        if (text === 'institución educativa' || text === 'institucion educativa') {
                            sheetMetadata.institucion = val;
                            DOM.inputInstitucion.value = val;
                        } else if (text === 'docente' || text === 'practicante / docente' || text === 'practicante' || text === 'practicante / docente:') {
                            sheetMetadata.docente = val;
                            DOM.inputDocente.value = val;
                        } else if (text === 'director') {
                            sheetMetadata.director = val;
                            DOM.inputDirector.value = val;
                        } else if (text === 'nivel') {
                            sheetMetadata.nivel = val;
                            DOM.inputNivel.value = val;
                        } else if (text === 'grado' || text === 'grado y sección' || text === 'grado y seccion') {
                            if (text.includes('sección') || text.includes('seccion')) {
                                const parts = val.split(/\s+/);
                                sheetMetadata.grado = parts[0] || '';
                                sheetMetadata.seccion = parts.slice(1).join(' ') || '';
                                DOM.inputGrado.value = parts[0] || '';
                                DOM.inputSeccion.value = parts.slice(1).join(' ') || '';
                            } else {
                                sheetMetadata.grado = val;
                                DOM.inputGrado.value = val;
                            }
                        } else if (text === 'sección' || text === 'seccion') {
                            sheetMetadata.seccion = val;
                            DOM.inputSeccion.value = val;
                        } else if (text === 'fecha') {
                            sheetMetadata.fecha = val;
                            DOM.inputFecha.value = val;
                        } else if (text === 'área' || text === 'area') {
                            sheetMetadata.area = val;
                            DOM.inputArea.value = val;
                        } else if (text === 'duración' || text === 'duracion' || text === 'duración (min)' || text === 'duracion (min)' || text === 'tiempo aprox.') {
                            const cleanVal = val.replace(/minutos|min/gi, '').trim();
                            sheetMetadata.duracion = cleanVal;
                            DOM.inputDuracion.value = cleanVal;
                        } else if (text === 'unidad' || text === 'unidad / proyecto' || text === 'unidad/proyecto' || text === 'unidad / proyecto:') {
                            sheetMetadata.unidad = val;
                            DOM.inputUnidad.value = val;
                        }
                    }
                });
        
                // Extraer DRE, UGEL y Título
                const dreEl = DOM.sessionSheet.querySelector('[data-key="dre"]') || DOM.sessionSheet.querySelector('.header-text-dre');
                if (dreEl) {
                    const val = dreEl.textContent.trim().replace(/^DRE\s+/i, '');
                    sheetMetadata.dre = val;
                    DOM.inputDre.value = val;
                }
                const ugelEl = DOM.sessionSheet.querySelector('[data-key="ugel"]') || DOM.sessionSheet.querySelector('.header-text-ugel');
                if (ugelEl) {
                    const val = ugelEl.textContent.trim().replace(/^UGEL\s+/i, '');
                    sheetMetadata.ugel = val;
                    DOM.inputUgel.value = val;
                }
        
                const titleBarEl = DOM.sessionSheet.querySelector('.session-title-bar-official span');
                if (titleBarEl) {
                    const match = titleBarEl.textContent.match(/N°\s*(\d+)/i);
                    if (match) {
                        sheetMetadata.numero_sesion = match[1];
                        DOM.inputNumeroSesion.value = match[1];
                    }
                }
        
                // Extraer Título de la Sesión desde subSections (antiguo) o pc-table (nuevo)
                const pcTable = DOM.sessionSheet.querySelector('.pc-table');
                if (pcTable) {
                    const tds = pcTable.querySelectorAll('td');
                    tds.forEach((td, idx) => {
                        const text = td.textContent.trim().toLowerCase().replace(/:$/, '');
                        const valEl = tds[idx + 1];
                        if (valEl) {
                            const val = valEl.textContent.trim();
                            if (text === 'título de la sesión' || text === 'titulo de la sesion') {
                                sheetMetadata.titulo = val;
                                DOM.inputTitulo.value = val;
                            }
                        }
                    });
                } else {
                    const subSections = DOM.sessionSheet.querySelectorAll('.subsection-title-bar');
                    subSections.forEach(bar => {
                        const text = bar.textContent.trim().toLowerCase();
                        const contentBox = bar.nextElementSibling;
                        if (contentBox && contentBox.classList.contains('subsection-content-box')) {
                            const val = contentBox.textContent.trim();
                            if (text.includes('título de la sesión') || text.includes('titulo de la sesion')) {
                                sheetMetadata.titulo = val;
                                DOM.inputTitulo.value = val;
                            }
                        }
                    });
                }
            }
        
            // 2. Extraer Metadatos (usando los datos extraídos de la hoja o la barra lateral)
            const metadata = {
                institucion: sheetMetadata.institucion || DOM.inputInstitucion.value || '',
                dre: sheetMetadata.dre || DOM.inputDre.value || '',
                ugel: sheetMetadata.ugel || DOM.inputUgel.value || '',
                docente: sheetMetadata.docente || DOM.inputDocente.value || '',
                director: sheetMetadata.director || DOM.inputDirector.value || '',
                fecha: sheetMetadata.fecha || DOM.inputFecha.value || '',
                nivel: sheetMetadata.nivel || DOM.inputNivel.value || 'SECUNDARIA',
                numero_sesion: sheetMetadata.numero_sesion || DOM.inputNumeroSesion.value || '',
                grado: sheetMetadata.grado || DOM.inputGrado.value || '',
                seccion: sheetMetadata.seccion || DOM.inputSeccion.value || '',
                area: sheetMetadata.area || DOM.inputArea.value || '',
                duracion: sheetMetadata.duracion || DOM.inputDuracion.value || '',
                unidad: sheetMetadata.unidad || DOM.inputUnidad.value || '',
                titulo: sheetMetadata.titulo || DOM.inputTitulo.value || '',
                logo_left_url: logoLeft,
                logo_regional_url: logoRegional
            };
        
            // 3. Extraer Propósitos de Aprendizaje
            const template = DOM.selectTemplate ? DOM.selectTemplate.value : (AppState.currentSession?.template || 'estandar');
            let competencia = DOM.inputCompetencia.value || '';
            let estandar = '';
            let desempeno = '';
            let capacidades = [];
            let criterios = [];
            let producto_evidencia = '';
            let instrumento = '';
            let sheetPropositoTexto = '';
            let sheetConocimientos = '';
        
            if (template === 'inicial') {
                // --- PARSER INICIAL ---
                // 1. Propósito de Aprendizaje (text)
                const propDivs = Array.from(DOM.sessionSheet.querySelectorAll('div'));
                const propDiv = propDivs.find(d => d.textContent.includes('PROPÓSITO DE APRENDIZAJE'));
                if (propDiv) {
                    const span = propDiv.querySelector('span');
                    if (span) sheetPropositoTexto = span.textContent.trim();
                }
        
                // 2. Tabla de Propósitos
                const contentTable = DOM.sessionSheet.querySelector('table.content-table');
                if (contentTable) {
                    const rows = contentTable.querySelectorAll('tbody > tr');
                    if (rows.length > 0) {
                        const cells = rows[0].querySelectorAll('td');
                        if (cells.length >= 5) {
                            // Columna 0: Área / Competencia / Capacidades
                            const compDiv = cells[0].querySelector('div[style*="font-size:8.5pt"]');
                            if (compDiv) {
                                competencia = compDiv.textContent.replace(/[“”"]/g, '').trim();
                            }
                            const ulsCap = cells[0].querySelectorAll('ul li');
                            capacidades = Array.from(ulsCap).map(li => li.textContent.trim());
        
                            // Columna 1: Estándar
                            estandar = cells[1].textContent.trim();
        
                            // Columna 2: Desempeño del Grado
                            desempeno = cells[2].textContent.trim();
        
                            // Columna 3: Criterios de Evaluación
                            const ulsCrit = cells[3].querySelectorAll('ul li');
                            criterios = Array.from(ulsCrit).map(li => li.textContent.trim());
        
                            // Columna 4: Evidencia / Instrumento
                            const spans = cells[4].querySelectorAll('span');
                            if (spans.length >= 2) {
                                producto_evidencia = spans[0].textContent.trim();
                                instrumento = spans[1].textContent.trim();
                            } else {
                                const rawText = cells[4].textContent.trim();
                                const parts = rawText.split(/Inst\.:/i);
                                producto_evidencia = parts[0].replace(/Evidencia:/i, '').trim();
                                instrumento = parts[1] || 'Lista de Cotejo';
                            }
                        }
                    }
                }
            } else if (template === 'estandar') {
                // --- PARSER ESTÁNDAR ---
                // 1. Competencia y Estándar
                const tables = DOM.sessionSheet.querySelectorAll('table.content-table');
                const compEstTable = Array.from(tables).find(t => !t.classList.contains('propositos-table') && !t.classList.contains('ct-table') && t.querySelectorAll('tr').length === 2);
                if (compEstTable) {
                    const tds = compEstTable.querySelectorAll('td');
                    if (tds[1]) competencia = tds[1].textContent.trim();
                    if (tds[3]) estandar = tds[3].textContent.trim();
                }
        
                // 2. Tabla de Propósitos (propositos-table)
                const matrizTable = DOM.sessionSheet.querySelector('.propositos-table');
                if (matrizTable) {
                    const rows = matrizTable.querySelectorAll('tbody > tr');
                    if (rows.length > 0) {
                        const cells = rows[0].querySelectorAll('td');
                        if (cells.length >= 5) {
                            const ulsCap = cells[1].querySelectorAll('ul.session-list li, ul li');
                            capacidades = Array.from(ulsCap).map(li => li.textContent.trim());
        
                            const ulsCrit = cells[2].querySelectorAll('ul.session-list li, ul li');
                            criterios = Array.from(ulsCrit).map(li => li.textContent.trim());
        
                            producto_evidencia = cells[3].textContent.trim();
                            instrumento = cells[4].textContent.trim();
                        }
                    }
                }
        
                // 3. Propósito Texto & Conocimientos (pc-table)
                const pcTable = DOM.sessionSheet.querySelector('.pc-table');
                if (pcTable) {
                    const tds = pcTable.querySelectorAll('td');
                    tds.forEach((td, idx) => {
                        const text = td.textContent.trim().toLowerCase().replace(/:$/, '');
                        const valEl = tds[idx + 1];
                        if (valEl) {
                            const val = valEl.textContent.trim();
                            if (text === 'propósito de la sesión' || text === 'proposito de la sesion') {
                                sheetPropositoTexto = val;
                            } else if (text === 'conocimientos') {
                                sheetConocimientos = val;
                            }
                        }
                    });
                }
            } else {
                // --- PARSER LABORATORIO Y REFUERZO ---
                const tables = DOM.sessionSheet.querySelectorAll('table.content-table');
                const propTable = Array.from(tables).find(t => t.querySelectorAll('tr').length === 3 && t.querySelector('th'));
                if (propTable) {
                    const rows = propTable.querySelectorAll('tr');
                    competencia = rows[0].querySelector('td')?.textContent.trim() || '';
                    const capVal = rows[1].querySelector('td')?.textContent.trim() || '';
                    if (template === 'laboratorio') {
                        capacidades = [capVal];
                    }
                    const desVal = rows[2].querySelector('td')?.textContent.trim() || '';
                    if (template === 'laboratorio') {
                        criterios = [desVal];
                    } else {
                        producto_evidencia = desVal;
                    }
                }
        
                // Subsections fallback/extra
                const subSections = DOM.sessionSheet.querySelectorAll('.subsection-title-bar');
                subSections.forEach(bar => {
                    const text = bar.textContent.trim().toLowerCase();
                    const contentBox = bar.nextElementSibling;
                    if (contentBox && contentBox.classList.contains('subsection-content-box')) {
                        const val = contentBox.textContent.trim();
                        if (text.includes('propósito de la sesión') || text.includes('proposito de la sesion') || text.includes('diagnóstico') || text.includes('diagnostico')) {
                            sheetPropositoTexto = val;
                        } else if (text.includes('conocimientos') || text.includes('materiales')) {
                            sheetConocimientos = val;
                        }
                    }
                });
            }
        
            const proposito = {
                proposito_texto: sheetPropositoTexto || AppState.currentSession.proposito?.proposito_texto || '',
                conocimientos: sheetConocimientos || AppState.currentSession.proposito?.conocimientos || '',
                competencia,
                estandar,
                desempeno: desempeno || AppState.currentSession.proposito?.desempeno || '',
                capacidades,
                criterios,
                producto_evidencia,
                instrumento
            };
        
            // 4. Competencias Transversales
            let competencias_transversales = [];
            const ctTable = DOM.sessionSheet.querySelector('.ct-table');
            if (ctTable) {
                const rows = ctTable.querySelectorAll('tbody > tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        const ct_titulo = cells[0].textContent.trim();
                        const ct_desempenos = Array.from(cells[1].querySelectorAll('ul.session-list li, ul li')).map(li => li.textContent.trim());
                        competencias_transversales.push({
                            titulo: ct_titulo,
                            desempenos: ct_desempenos
                        });
                    }
                });
            }
            if (competencias_transversales.length === 0 && AppState.currentSession?.competencias_transversales?.length > 0) {
                competencias_transversales = AppState.currentSession.competencias_transversales;
            }
        
            // 5. Enfoques Transversales
            let enfoques_transversales = [];
            const enfTable = Array.from(DOM.sessionSheet.querySelectorAll('table.content-table')).find(t => {
                const th = t.querySelector('th');
                return th && th.textContent.includes('ENFOQUES TRANSVERSALES');
            });
            if (enfTable) {
                const rows = enfTable.querySelectorAll('tbody > tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3) {
                        enfoques_transversales.push({
                            nombre: cells[0].textContent.trim(),
                            valor: cells[1].textContent.trim(),
                            actitudes: cells[2].textContent.trim()
                        });
                    }
                });
            }
            if (enfoques_transversales.length === 0 && AppState.currentSession?.enfoques_transversales?.length > 0) {
                enfoques_transversales = AppState.currentSession.enfoques_transversales;
            }
        
            // 6. Recursos
            let enlaces = '';
            let materiales = '';
            let refuerzo = '';
            const recTable = Array.from(DOM.sessionSheet.querySelectorAll('table.content-table')).find(t => {
                const td = t.querySelector('td');
                return td && td.textContent.includes('Páginas de Texto');
            });
            if (recTable) {
                const rows = recTable.querySelectorAll('tr');
                if (rows[0] && rows[0].querySelectorAll('td')[1]) enlaces = rows[0].querySelectorAll('td')[1].textContent.trim();
                if (rows[1] && rows[1].querySelectorAll('td')[1]) materiales = rows[1].querySelectorAll('td')[1].textContent.trim();
                if (rows[2] && rows[2].querySelectorAll('td')[1]) refuerzo = rows[2].querySelectorAll('td')[1].textContent.trim();
            }
        
            const recursos = {
                enlaces: enlaces || AppState.currentSession?.recursos?.enlaces || '',
                materiales: materiales || AppState.currentSession?.recursos?.materiales || '',
                refuerzo: refuerzo || AppState.currentSession?.recursos?.refuerzo || ''
            };
        
            // 7. Momentos Didácticos
            let inicio_tiempo = '';
            let inicio_actividades = [];
            let desarrollo_tiempo = '';
            let desarrollo_procesos = [];
            let cierre_tiempo = '';
            let cierre_metacognicion = [];
            let cierre_evaluacion = [];
            let cierre_extension = [];
        
            const momTable = DOM.sessionSheet.querySelector('.momentos-table');
            if (momTable) {
                const rows = Array.from(momTable.querySelectorAll('tbody > tr'));
        
                let currentMoment = 'inicio';
                let inicioRows = [];
                let desarrolloRows = [];
                let cierreRows = [];
        
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length > 1) {
                        const labelText = cells[0].textContent.toUpperCase();
                        if (labelText.includes('INICIO')) {
                            currentMoment = 'inicio';
                        } else if (labelText.includes('DESARROLLO')) {
                            currentMoment = 'desarrollo';
                        } else if (labelText.includes('CIERRE')) {
                            currentMoment = 'cierre';
                        }
                    }
        
                    if (currentMoment === 'inicio') {
                        inicioRows.push(row);
                    } else if (currentMoment === 'desarrollo') {
                        desarrolloRows.push(row);
                    } else if (currentMoment === 'cierre') {
                        cierreRows.push(row);
                    }
                });
        
                // --- INICIO ---
                if (inicioRows[0]) {
                    const cellMom = inicioRows[0].querySelectorAll('td')[0];
                    if (cellMom) {
                        const timeMatch = cellMom.textContent.match(/TIEMPO:\s*(\d+)/i);
                        if (timeMatch) inicio_tiempo = timeMatch[1];
                    }
                }
                inicioRows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    const cellAct = (cells.length === 3) ? cells[1] : cells[0];
                    if (cellAct) {
                        const ps = Array.from(cellAct.querySelectorAll('p')).map(p => p.textContent.trim()).filter(t => t.length > 0);
                        if (ps.length > 0) {
                            inicio_actividades.push(...ps);
                        } else {
                            const rawText = cellAct.textContent.trim();
                            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                            inicio_actividades.push(...lines);
                        }
                    }
                });
        
                // --- DESARROLLO ---
                if (desarrolloRows[0]) {
                    const cellMom = desarrolloRows[0].querySelectorAll('td')[0];
                    if (cellMom) {
                        const timeMatch = cellMom.textContent.match(/TIEMPO:\s*(\d+)/i);
                        if (timeMatch) desarrollo_tiempo = timeMatch[1];
                    }
                }
                desarrolloRows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    const cellAct = (cells.length === 3) ? cells[1] : cells[0];
                    if (cellAct) {
                        const titleEl = cellAct.querySelector('.proceso-titulo') || cellAct.querySelector('strong');
                        const titulo = titleEl ? titleEl.textContent.trim() : 'Proceso Didáctico';
        
                        let contenido = Array.from(cellAct.querySelectorAll('p')).map(p => p.textContent.trim()).filter(t => t !== titulo && t.length > 0);
                        if (contenido.length === 0) {
                            const rawText = cellAct.textContent.trim();
                            contenido = rawText.split('\n').map(l => l.trim()).filter(t => t !== titulo && t.length > 0);
                        }
        
                        desarrollo_procesos.push({
                            clave: titulo.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                            titulo: titulo,
                            contenido: contenido
                        });
                    }
                });
        
                // --- CIERRE ---
                if (cierreRows[0]) {
                    const cellMom = cierreRows[0].querySelectorAll('td')[0];
                    const cellAct = (cierreRows[0].querySelectorAll('td').length === 3) ? cierreRows[0].querySelectorAll('td')[1] : cierreRows[0].querySelectorAll('td')[0];
                    if (cellMom) {
                        const timeMatch = cellMom.textContent.match(/TIEMPO:\s*(\d+)/i);
                        if (timeMatch) cierre_tiempo = timeMatch[1];
                    }
                    if (cellAct) {
                        const uls = cellAct.querySelectorAll('ul.session-list, ul');
                        if (uls.length >= 3) {
                            if (uls[0]) cierre_metacognicion = Array.from(uls[0].querySelectorAll('li')).map(li => li.textContent.trim());
                            if (uls[1]) cierre_evaluacion = Array.from(uls[1].querySelectorAll('li')).map(li => li.textContent.trim());
                            if (uls[2]) cierre_extension = Array.from(uls[2].querySelectorAll('li')).map(li => li.textContent.trim());
                        } else {
                            const rawText = cellAct.textContent.trim();
                            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                            let currentSection = 'metacognicion';
                            lines.forEach(line => {
                                const lLower = line.toLowerCase();
                                if (lLower.includes('metacognición') || lLower.includes('metacognicion')) {
                                    currentSection = 'metacognicion';
                                    const rest = line.replace(/^[•\-\s]*metacognici[oó]n:\s*/i, '').trim();
                                    if (rest) cierre_metacognicion.push(rest);
                                } else if (lLower.includes('evaluación formativa') || lLower.includes('evaluacion formativa') || lLower.includes('evaluación')) {
                                    currentSection = 'evaluacion';
                                    const rest = line.replace(/^[•\-\s]*evaluaci[oó]n[^:]*:\s*/i, '').trim();
                                    if (rest) cierre_evaluacion.push(rest);
                                } else if (lLower.includes('extensión') || lLower.includes('extension')) {
                                    currentSection = 'extension';
                                    const rest = line.replace(/^[•\-\s]*extensi[oó]n[^:]*:\s*/i, '').trim();
                                    if (rest) cierre_extension.push(rest);
                                } else if (line.length > 0) {
                                    const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
                                    if (cleanLine) {
                                        if (currentSection === 'metacognicion') cierre_metacognicion.push(cleanLine);
                                        else if (currentSection === 'evaluacion') cierre_evaluacion.push(cleanLine);
                                        else if (currentSection === 'extension') cierre_extension.push(cleanLine);
                                    }
                                }
                            });
                            if (cierre_metacognicion.length === 0 && cierre_evaluacion.length === 0 && cierre_extension.length === 0 && rawText.length > 0) {
                                cierre_metacognicion = lines.filter(l => l.length > 0);
                            }
                        }
                    }
                }
            }
        
            const fallbackMom = AppState.currentSession?.momentos || {};
            const momentos = {
                inicio: {
                    tiempo_total: inicio_tiempo || fallbackMom.inicio?.tiempo_total || '',
                    actividades: inicio_actividades.length > 0 ? inicio_actividades : (fallbackMom.inicio?.actividades || [])
                },
                desarrollo: {
                    tiempo_total: desarrollo_tiempo || fallbackMom.desarrollo?.tiempo_total || '',
                    procesos: desarrollo_procesos.length > 0 ? desarrollo_procesos : (fallbackMom.desarrollo?.procesos || [])
                },
                cierre: {
                    tiempo_total: cierre_tiempo || fallbackMom.cierre?.tiempo_total || '',
                    metacognicion: cierre_metacognicion.length > 0 ? cierre_metacognicion : (fallbackMom.cierre?.metacognicion || []),
                    evaluacion: cierre_evaluacion.length > 0 ? cierre_evaluacion : (fallbackMom.cierre?.evaluacion || []),
                    extension: cierre_extension.length > 0 ? cierre_extension : (fallbackMom.cierre?.extension || [])
                }
            };
        
            // 8. Ficha de Trabajo
            let ficha_trabajo = null;
            const fichaTituloEl = DOM.sessionSheet.querySelector('[data-key="ficha_titulo"]');
            const fichaIndicacionesEl = DOM.sessionSheet.querySelector('[data-key="ficha_indicaciones"]');
            const fichaActividadesEl = DOM.sessionSheet.querySelector('[data-key="ficha_actividades"]');
        
            if (fichaTituloEl && fichaActividadesEl) {
                ficha_trabajo = {
                    titulo: fichaTituloEl.textContent.trim(),
                    indicaciones: fichaIndicacionesEl ? fichaIndicacionesEl.textContent.replace('Indicaciones:', '').trim() : '',
                    actividades: fichaActividadesEl.textContent.trim()
                };
            } else if (AppState.currentSession?.ficha_trabajo) {
                ficha_trabajo = AppState.currentSession.ficha_trabajo;
            }
        
            // 9. Juego Libre en los Sectores (Educación Inicial)
            let juego_libre_sectores = null;
            const jlsTable = DOM.sessionSheet.querySelector('.jls-table');
            if (jlsTable) {
                const jlsRows = jlsTable.querySelectorAll('tbody > tr');
                const jlsKeys = ['planificacion', 'organizacion', 'ejecucion', 'orden', 'socializacion', 'representacion'];
                juego_libre_sectores = {};
                jlsRows.forEach((row, idx) => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2 && jlsKeys[idx]) {
                        juego_libre_sectores[jlsKeys[idx]] = cells[1].textContent.trim();
                    }
                });
            } else if (AppState.currentSession && AppState.currentSession.juego_libre_sectores) {
                juego_libre_sectores = AppState.currentSession.juego_libre_sectores;
            }
        
            // 10. Alumnos
            const textAlumnos = document.getElementById('textarea-alumnos')?.value || '';
            let alumnosList = textAlumnos.split('\n').map(line => line.trim()).filter(Boolean);
            if (alumnosList.length === 0 && Array.isArray(AppState.currentSession?.alumnos) && AppState.currentSession.alumnos.length > 0) {
                alumnosList = AppState.currentSession.alumnos;
            }
        
            const legacyPayload = {
                metadata,
                proposito,
                competencias_transversales,
                enfoques_transversales,
                recursos,
                momentos,
                ficha_trabajo,
                juego_libre_sectores,
                alumnos: alumnosList,
                presentation: DocumentPresentation.normalize(AppState.currentSession.presentation || AppState.currentSession.design || {}),
                token: localStorage.getItem('connection_token') || ''
            };
        
            if (window.AiCopilot && typeof AiCopilot.toV1 === 'function') {
                const { document, valid } = AiCopilot.toV1(legacyPayload, {
                    ...metadata,
                    numeroSesion: metadata.numero_sesion,
                    duracionMinutos: parseMinutes(metadata.duracion) || 90
                });
                if (valid) {
                    document.listaCotejo = { ...document.listaCotejo, alumnos: alumnosList };
                    document.presentation = legacyPayload.presentation;
                    return { ...document, token: legacyPayload.token };
                }
            }
        
            return legacyPayload;
        }
        
        async function exportarAPDFBackend() {
            if (!AppState.currentSession) {
                Toast.warning('Genera una sesión primero');
                return;
            }
        
            saveCurrentState();
            Loader.show('Generando PDF oficial con el motor local...');
        
            try {
                const sessionPayload = getFormDataJSON();
                const titulo = sessionPayload.metadata.titulo || 'Sesion-de-Aprendizaje';
        
                const blob = await window.LocalExportClient.exportDocument('pdf', sessionPayload);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${titulo.replace(/[^a-zA-Z0-9-_\s]/g, '')}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
        
                Toast.success('¡PDF exportado con éxito!');
            } catch (error) {
                console.error('[PDF Export Local] Error:', error);
                Toast.error('Error al exportar PDF con motor local: ' + error.message);
            } finally {
                Loader.hide();
            }
        }
        
        async function exportarAWordBackend() {
            if (!AppState.currentSession) {
                Toast.warning('Genera una sesión primero');
                return;
            }
        
            saveCurrentState();
            Loader.show('Generando archivo de Word (.docx) nativo...');
        
            try {
                const sessionPayload = getFormDataJSON();
                const titulo = sessionPayload.metadata.titulo || 'Sesion-de-Aprendizaje';
        
                const blob = await window.LocalExportClient.exportDocument('docx', sessionPayload);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${titulo.replace(/[^a-zA-Z0-9-_\s]/g, '')}.docx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
        
                Toast.success('¡Word (.docx) exportado con éxito!');
            } catch (error) {
                console.error('[Word Export Local] Error:', error);
                Toast.error('Error al exportar Word con motor local: ' + error.message);
            } finally {
                Loader.hide();
            }
        }
        
        async function handleExportWord() {
            if (!AppState.currentSession) {
                Toast.warning('No hay ninguna sesión activa para exportar.');
                return;
            }
        
            if (AppState.backendOnline) {
                await exportarAWordBackend();
                return;
            }
        
            showEngineModal();
        }
        
        function checkTimeBalance() {
            if (!AppState.currentSession) return;
        
            // 1. Get planned duration
            const totalDurationText = DOM.inputDuracion ? DOM.inputDuracion.value : '';
            const plannedMinutes = parseMinutes(totalDurationText || AppState.currentSession.metadata?.duracion);
        
            if (plannedMinutes <= 0) {
                hideTimeBalanceWarning();
                return;
            }
        
            // 2. Sum minutes of the moments in the sheet
            let parsedSum = 0;
        
            // For Estandar template (.momento-time)
            const timeElements = DOM.sessionSheet.querySelectorAll('.momento-time');
            timeElements.forEach(el => {
                const txt = el.textContent || '';
                const cleaned = txt.replace(/TIEMPO\s*:\s*/i, '');
                parsedSum += parseMinutes(cleaned);
            });
        
            // For Laboratorio/Refuerzo templates (.time-cell)
            const cellElements = DOM.sessionSheet.querySelectorAll('.time-cell');
            cellElements.forEach(el => {
                const txt = el.textContent || '';
                parsedSum += parseMinutes(txt);
            });
        
            if (parsedSum === 0) {
                hideTimeBalanceWarning();
                return;
            }
        
            // 3. Compare
            if (parsedSum !== plannedMinutes) {
                showTimeBalanceWarning(`La suma de los momentos da ${parsedSum} min, pero tu sesión está planificada para ${plannedMinutes} min.`);
            } else {
                hideTimeBalanceWarning();
            }
        }
        
        function showTimeBalanceWarning(message) {
            const banner = document.getElementById('time-balance-warning');
            const bannerText = document.getElementById('time-balance-warning-text');
            if (banner && bannerText) {
                bannerText.textContent = message;
                banner.style.display = 'flex';
                banner.classList.remove('hidden');
            }
        }
        
        function hideTimeBalanceWarning() {
            const banner = document.getElementById('time-balance-warning');
            if (banner) {
                banner.style.display = 'none';
                banner.classList.add('hidden');
            }
        }
        
        
        return {
            handlePrint,
            showPdfGuide,
            closePdfGuide,
            showEngineModal,
            closeEngineModal,
            updateBackendUI,
            checkBackendStatus,
            getFormDataJSON,
            exportarAPDFBackend,
            exportarAWordBackend,
            handleExportWord,
            checkTimeBalance,
            showTimeBalanceWarning,
            hideTimeBalanceWarning
        };
    }

    return { create };
})();
