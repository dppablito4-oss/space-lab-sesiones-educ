/** AI interaction controller. Provider routing and SessionDocument behavior stay unchanged. */
window.SpaceLabAiController = (() => {
    'use strict';

    function create(dependencies) {
        const {
            state: AppState,
            dom: DOM,
            query: $,
            parseMinutes,
            arrayBufferToBase64,
            getBinaryMimeFallback,
            getFormData,
            renderSession,
            saveCurrentState,
            checkTimeBalance
        } = dependencies;

        function handleOpenPedagogyBrief() {
            if (!window.PedagogyBrief) return;
        
            const formData = getFormData();
            if (!formData.metadata.area && !formData.metadata.titulo) {
                Toast.warning('Llena al menos el Área Curricular y el Título de la sesión antes de afinar el enfoque.');
                return;
            }
        
            PedagogyBrief.open({
                area: formData.metadata.area || '',
                titulo: formData.metadata.titulo || '',
                grado: formData.metadata.grado || '',
                methodology: DOM.selectMethodology ? DOM.selectMethodology.value : '',
                sourceFile: AppState.sourceFileData || null
            });
        }
        
        async function handleGenerateAI() {
            // Intercept: Check user authentication
            const user = await SupabaseClient.getCurrentUser();
            if (!user) {
                Toast.warning('Debes crear una cuenta para generar sesiones con IA');
                if (window.AuthUi && typeof window.AuthUi.openRegister === 'function') {
                    window.AuthUi.openRegister();
                }
                return;
            }
        
            const formData = getFormData();
        
            // Validate minimum data
            if (!AppState.sourceFileData && !formData.metadata.area && !formData.metadata.titulo) {
                Toast.warning('Llena al menos el Área Curricular, el Título de la sesión o sube un archivo de referencia.');
                return;
            }
        
            Loader.show('Generando sesión con IA...');
        
            try {
                const generationRequest = {
                    ...formData.metadata,
                    ...formData.proposito,
                    template: DOM.selectTemplate.value,
                    sourceFile: AppState.sourceFileData,
                    sourceInstruction: DOM.inputSourceInstruction ? DOM.inputSourceInstruction.value.trim() : '',
                    pedagogyBrief: (window.PedagogyBrief ? PedagogyBrief.getSummary() : null)
                };
        
                // Normalize at the AI boundary so the web and DOCX builders share
                // exactly one SessionDocument v1 contract.
                const formMeta = {
                    ...formData.metadata,
                    numeroSesion: formData.metadata.numero_sesion,
                    duracionMinutos: parseMinutes(formData.metadata.duracion) || 90
                };
                let aiData;
                let canonical;
                let qualityErrors = [];
                for (let attempt = 0; attempt < 2; attempt += 1) {
                    aiData = await AiCopilot.generateSession({
                        ...generationRequest,
                        qualityFeedback: attempt === 1 ? qualityErrors : undefined
                    });
                    const normalized = AiCopilot.toV1(aiData, formMeta);
                    if (!normalized.valid) {
                        qualityErrors = normalized.errors;
                    } else {
                        canonical = normalized.document;
                        const generatedMetadata = canonical.metadata || {};
                        canonical.metadata = {
                            ...generatedMetadata,
                            institucion: formData.metadata.institucion || generatedMetadata.institucion || '',
                            dre: formData.metadata.dre || generatedMetadata.dre || '',
                            ugel: formData.metadata.ugel || generatedMetadata.ugel || '',
                            docente: formData.metadata.docente || generatedMetadata.docente || '',
                            director: formData.metadata.director || generatedMetadata.director || '',
                            fecha: formData.metadata.fecha || generatedMetadata.fecha || '',
                            nivel: formData.metadata.nivel || generatedMetadata.nivel || '',
                            grado: formData.metadata.grado || generatedMetadata.grado || '',
                            seccion: formData.metadata.seccion || generatedMetadata.seccion || '',
                            area: formData.metadata.area || generatedMetadata.area || '',
                            numeroSesion: formData.metadata.numero_sesion || generatedMetadata.numeroSesion || '',
                            duracionMinutos: parseMinutes(formData.metadata.duracion) || generatedMetadata.duracionMinutos || 90,
                            unidad: formData.metadata.unidad || generatedMetadata.unidad || '',
                            titulo: formData.metadata.titulo || generatedMetadata.titulo || '',
                            logos: {
                                institucional: formData.metadata.logo_left_url || generatedMetadata.logos?.institucional || null,
                                regional: formData.metadata.logo_regional_url || generatedMetadata.logos?.regional || null
                            }
                        };
                        canonical.listaCotejo = { ...canonical.listaCotejo, alumnos: formData.alumnos };
                        const quality = SessionValidator.validateGeneratedContent(canonical);
                        qualityErrors = quality.errors;
                        if (quality.valid) break;
                    }
                    canonical = null;
                }
                if (!canonical) {
                    throw new Error(`La IA devolvió contenido incompleto después de reintentarlo: ${qualityErrors.join('; ')}`);
                }
        
                const session = {
                    id: AppState.currentSession?.id || Storage.generateId(),
                    template: DOM.selectTemplate.value,
                    ...canonical,
                    presentation: formData.presentation,
                    createdAt: AppState.currentSession?.createdAt || new Date().toISOString()
                };
        
                AppState.currentSession = session;
        
                DOM.inputTitulo.value = canonical.metadata.titulo || '';
                DOM.inputCompetencia.value = canonical.proposito.competencia || '';
                DOM.inputCapacidad.value = (canonical.proposito.capacidades || []).join('; ');
                DOM.inputDesempeno.value = canonical.proposito.desempeno || '';
        
                DOM.inputEnfoque.value = canonical.enfoquesTransversales?.[0]?.nombre || '';
                DOM.inputEnfoque2.value = canonical.enfoquesTransversales?.[1]?.nombre || '';
        
                renderSession(session);
                Loader.hide();
                Toast.success('¡Sesión generada con IA exitosamente!');
                window.dispatchEvent(new CustomEvent('spacelab:session-generated', { detail: { session } }));
            } catch (error) {
                Loader.hide();
        
                Toast.error(`Error: ${error.message}`);
            }
        }
        
        // ═══════════════════════════════════════
        // SESSION RENDERING
        // ═══════════════════════════════════════
        
        async function handleAiRubrica() {
            // Intercept: Check user authentication
            const user = await SupabaseClient.getCurrentUser();
            if (!user) {
                Toast.warning('Debes crear una cuenta para usar el asistente de evaluación con IA');
                if (window.AuthUi && typeof window.AuthUi.openRegister === 'function') {
                    window.AuthUi.openRegister();
                }
                return;
            }
        
            // Search for target cell inside sheet
            let criteriaTarget = DOM.sessionSheet.querySelector('.propositos-table td:nth-child(3)');
            if (!criteriaTarget) {
                const tables = DOM.sessionSheet.querySelectorAll('table');
                for (const table of tables) {
                    const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.toLowerCase());
                    const criteriaColIndex = headers.findIndex(h => h.includes('criterios'));
                    if (criteriaColIndex !== -1) {
                        criteriaTarget = table.querySelector(`tbody tr td:nth-child(${criteriaColIndex + 1})`);
                        if (criteriaTarget) break;
                    }
                }
            }
        
            if (!criteriaTarget) {
                Toast.warning('No se pudo encontrar la columna "Criterios de Evaluación" en la hoja actual.');
                return;
            }
        
            Loader.show('Generando criterios de evaluación con IA...');
        
            try {
                const formData = getFormData();
                const competencia = formData.proposito?.competencia || DOM.inputCompetencia.value || '';
                const tema = formData.metadata?.titulo || DOM.inputTitulo.value || '';
                const grado = formData.metadata?.grado || DOM.inputGrado.value || '';
                const area = formData.metadata?.area || DOM.inputArea.value || '';
        
                const listItemsHtml = await AiCopilot.generateCriterios(competencia, tema, grado, area);
                const safeListItemsHtml = window.SpaceLabSanitizer
                    ? SpaceLabSanitizer.sanitizeCriteria(listItemsHtml)
                    : '';
        
                // Wrap in ul.session-list
                criteriaTarget.innerHTML = `<ul class="session-list">${safeListItemsHtml}</ul>`;
        
                saveCurrentState();
                checkTimeBalance();
                Loader.hide();
                Toast.success('Criterios de evaluación generados con éxito');
            } catch (error) {
                Loader.hide();
                Toast.error('Error al generar criterios: ' + error.message);
            }
        }
        
        async function handleAiImproveText() {
            // Intercept: Check user authentication
            const user = await SupabaseClient.getCurrentUser();
            if (!user) {
                Toast.warning('Debes crear una cuenta para refinar texto con IA');
                if (window.AuthUi && typeof window.AuthUi.openRegister === 'function') {
                    window.AuthUi.openRegister();
                }
                return;
            }
        
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
        
            if (!selectedText) {
                Toast.warning('Selecciona primero un fragmento de texto en la hoja para mejorar su redacción.');
                return;
            }
        
            // Store selection range and text globally in AppState
            AppState.selectionRange = selection.getRangeAt(0).cloneRange();
            AppState.selectedText = selectedText;
        
            // Open Refine Text Modal
            const modal = document.getElementById('refine-text-modal');
            const preview = document.getElementById('refine-text-preview');
            const customInput = document.getElementById('input-refine-custom');
            const optBtns = document.querySelectorAll('.refine-opt-btn');
        
            if (modal) {
                if (preview) preview.textContent = selectedText;
                if (customInput) customInput.value = '';
        
                // Set first option active by default
                optBtns.forEach((btn, index) => {
                    if (index === 0) btn.classList.add('active');
                    else btn.classList.remove('active');
                });
        
                modal.classList.remove('hidden');
            }
        }
        
        // ═══════════════════════════════════════
        // SAVE / LOAD
        // ═══════════════════════════════════════
        
        function handleAiProviderChange() {
            const fileGroup = $('.source-file-group');
            const badge = DOM.modelCapabilitiesBadge || $('#model-capabilities-badge');
            const dropzoneText = DOM.sourceFileDropzone ? DOM.sourceFileDropzone.querySelector('.text') : null;
            const provider = DOM.selectAiProvider ? DOM.selectAiProvider.value : 'openai-gpt-5.6-luna';
            if (window.AiCopilot && typeof AiCopilot.setProvider === 'function') {
                AiCopilot.setProvider(provider);
            }
        
            if (fileGroup) {
                fileGroup.classList.remove('hidden');
            }
        
            if (badge) {
                const fileIcon = '<svg class="ui-icon badge-icon" aria-hidden="true"><use href="#icon-file"></use></svg>';
                const textIcon = '<svg class="ui-icon badge-icon" aria-hidden="true"><use href="#icon-edit"></use></svg>';
                if (provider === 'openai-gpt-5.6-luna') {
                    badge.className = 'model-capabilities-badge';
                    badge.innerHTML = `${fileIcon}<span class="badge-text"><strong>GPT-5.6 Luna:</strong> Admite archivos de referencia (PDF, imágenes y textos).</span>`;
                    if (dropzoneText) dropzoneText.textContent = 'Haz clic o arrastra un archivo aquí (PDF, imagen o texto)';
                    if (DOM.sourceFileDropzone) DOM.sourceFileDropzone.classList.remove('disabled-dropzone');
                } else if (provider === 'openai-gpt-5.4-mini') {
                    badge.className = 'model-capabilities-badge';
                    badge.innerHTML = `${fileIcon}<span class="badge-text"><strong>GPT-5.4 Mini:</strong> Admite archivos de referencia (PDF, imágenes y textos).</span>`;
                    if (dropzoneText) dropzoneText.textContent = 'Haz clic o arrastra un archivo aquí (PDF, imagen o texto)';
                    if (DOM.sourceFileDropzone) DOM.sourceFileDropzone.classList.remove('disabled-dropzone');
                } else if (provider === 'gemini-2.5-flash') {
                    badge.className = 'model-capabilities-badge';
                    badge.innerHTML = `${fileIcon}<span class="badge-text"><strong>Gemini 2.5 Flash:</strong> Multimodal nativo (PDF, imágenes, audio y textos).</span>`;
                    if (dropzoneText) dropzoneText.textContent = 'Haz clic o arrastra un archivo aquí (PDF, imagen, audio o texto)';
                    if (DOM.sourceFileDropzone) DOM.sourceFileDropzone.classList.remove('disabled-dropzone');
                } else if (provider === 'deepseek-v3') {
                    badge.className = 'model-capabilities-badge badge-no-files';
                    badge.innerHTML = `${textIcon}<span class="badge-text"><strong>DeepSeek V3:</strong> Solo admite texto (los archivos adjuntos no serán procesados).</span>`;
                    if (dropzoneText) dropzoneText.textContent = 'DeepSeek V3 procesa solo texto. Cambia a GPT-5.6 o Gemini para adjuntar archivos.';
                    if (DOM.sourceFileDropzone) DOM.sourceFileDropzone.classList.add('disabled-dropzone');
                }
            }
        }
        
        function handleSourceFileSelect(e) {
            if (e.target.files && e.target.files.length > 0) {
                processSourceFile(e.target.files[0]);
            }
        }
        
        function processSourceFile(file) {
            if (!file) return;
        
            // Base64 expands the payload by roughly one third. Keep the final Edge
            // Function request below provider and gateway limits.
            const maxSizeBytes = 3 * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                Toast.warning('El archivo excede el tamaño límite de 8 MB.');
                DOM.inputSourceFile.value = '';
                return;
            }
        
            const fileName = file.name;
            const fileType = file.type;
        
            // Determine if it's a text file
            const textExtensions = ['.txt', '.csv', '.json', '.md', '.xml', '.html', '.css', '.js'];
            const isTextExtension = textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
            const isTextType = fileType.startsWith('text/') || isTextExtension;
        
            if (isTextType) {
                Loader.show('Leyendo archivo de texto...');
                const reader = new FileReader();
                reader.onload = function (e) {
                    Loader.hide();
                    const content = String(e.target.result || '').slice(0, 30000);
                    AppState.sourceFileData = {
                        name: fileName,
                        type: fileType || 'text/plain',
                        textContent: content,
                        base64: null
                    };
                    showSourceFileInfo(fileName);
                };
                reader.onerror = function () {
                    Loader.hide();
                    Toast.error('Error al leer el archivo de texto.');
                };
                reader.readAsText(file);
            } else if (fileName.toLowerCase().endsWith('.pdf')) {
                Loader.show('Procesando PDF, extrayendo texto e imágenes...');
                const reader = new FileReader();
                reader.onload = async function (e) {
                    try {
                        const arrayBuffer = e.target.result;
                        // Obtener base64
                        const base64Data = arrayBufferToBase64(arrayBuffer);
        
                        // Extraer texto usando pdfjs
                        const extractedText = await window.DocumentSourceProcessor.extractText(arrayBuffer);
        
                        // Renderizar páginas como imágenes para visión multimodal (máximo 4 páginas)
                        let renderedImages = [];
                        try {
                            renderedImages = await window.DocumentSourceProcessor.renderImages(arrayBuffer, 4);
                        } catch (renderErr) {
                            console.error('[PDF Render Warning] No se pudieron renderizar las páginas del PDF como imágenes:', renderErr);
                        }
        
                        AppState.sourceFileData = {
                            name: fileName,
                            type: 'application/pdf',
                            textContent: extractedText,
                            base64: base64Data,
                            images: renderedImages
                        };
                        Loader.hide();
                        showSourceFileInfo(fileName);
                    } catch (err) {
                        Loader.hide();
                        console.error('[PDF Extraction Error]', err);
                        Toast.warning('No se pudo extraer el texto del PDF de forma nativa. Se cargará solo como archivo de referencia.');
        
                        // Fallback a solo base64 si falla la extracción
                        const arrayBuffer = e.target.result;
                        const base64Data = arrayBufferToBase64(arrayBuffer);
                        AppState.sourceFileData = {
                            name: fileName,
                            type: 'application/pdf',
                            textContent: null,
                            base64: base64Data,
                            images: []
                        };
                        showSourceFileInfo(fileName);
                    }
                };
                reader.onerror = function () {
                    Loader.hide();
                    Toast.error('Error al leer el archivo PDF.');
                };
                reader.readAsArrayBuffer(file);
            } else {
                // It's a binary file (image, audio, etc.)
                Loader.show('Cargando archivo multimedia...');
                const reader = new FileReader();
                reader.onload = function (e) {
                    Loader.hide();
                    const dataUrl = e.target.result;
                    // Strip metadata from data URL
                    const base64Data = dataUrl.split(',')[1];
                    const mimeType = fileType || getBinaryMimeFallback(fileName);
        
                    // Si es imagen, la inyectamos en el array de imágenes
                    const images = mimeType.startsWith('image/') ? [{ base64: base64Data, type: mimeType }] : [];
        
                    AppState.sourceFileData = {
                        name: fileName,
                        type: mimeType,
                        textContent: null,
                        base64: base64Data,
                        images: images
                    };
                    showSourceFileInfo(fileName);
                };
                reader.onerror = function () {
                    Loader.hide();
                    Toast.error('Error al procesar el archivo multimedia.');
                };
                reader.readAsDataURL(file);
            }
        }
        
        function showSourceFileInfo(name) {
            DOM.sourceFileNameText.textContent = name;
            DOM.sourceFileInfo.classList.remove('hidden');
            DOM.sourceFileDropzone.classList.add('hidden');
            if (DOM.sourceFileGuidance) DOM.sourceFileGuidance.classList.remove('hidden');
            Toast.success('Archivo cargado correctamente');
        }
        
        function handleRemoveSourceFile() {
            AppState.sourceFileData = null;
            DOM.inputSourceFile.value = '';
            DOM.sourceFileNameText.textContent = '';
            DOM.sourceFileInfo.classList.add('hidden');
            DOM.sourceFileDropzone.classList.remove('hidden');
            if (DOM.inputSourceInstruction) DOM.inputSourceInstruction.value = '';
            if (DOM.sourceFileGuidance) DOM.sourceFileGuidance.classList.add('hidden');
            Toast.success('Archivo de referencia removido');
        }
        
        // ═══════════════════════════════════════
        // UTILITIES
        // ═══════════════════════════════════════
        
        function initRefineTextModal() {
            const modal = document.getElementById('refine-text-modal');
            if (!modal) return;
        
            const closeBtn = document.getElementById('btn-close-refine-modal');
            const cancelBtn = document.getElementById('btn-refine-cancel');
            const submitBtn = document.getElementById('btn-refine-submit');
            const customInput = document.getElementById('input-refine-custom');
            const optBtns = document.querySelectorAll('.refine-opt-btn');
        
            const closeModal = () => {
                modal.classList.add('hidden');
                AppState.selectionRange = null;
                AppState.selectedText = '';
            };
        
            [closeBtn, cancelBtn].forEach(btn => {
                if (btn) btn.addEventListener('click', closeModal);
            });
        
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        
            optBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    optBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if (customInput) customInput.value = '';
                });
            });
        
            if (customInput) {
                customInput.addEventListener('focus', () => {
                    optBtns.forEach(b => b.classList.remove('active'));
                });
            }
        
            if (submitBtn) {
                submitBtn.addEventListener('click', async () => {
                    const range = AppState.selectionRange;
                    const text = AppState.selectedText;
        
                    if (!text || !range) {
                        Toast.warning('Se perdió la selección del texto original.');
                        closeModal();
                        return;
                    }
        
                    let instruction = '';
                    const customText = customInput ? customInput.value.trim() : '';
                    if (customText) {
                        instruction = customText;
                    } else {
                        const activeOpt = document.querySelector('.refine-opt-btn.active');
                        if (activeOpt) {
                            instruction = activeOpt.dataset.instruction;
                        } else {
                            Toast.warning('Por favor selecciona una opción o escribe una instrucción.');
                            return;
                        }
                    }
        
                    closeModal();
                    Loader.show('Refinando redacción con IA...');
        
                    try {
                        const resultText = await AiCopilot.improveText(text, instruction);
        
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
        
                        range.deleteContents();
        
                        const container = document.createElement('span');
                        container.innerHTML = window.SpaceLabSanitizer
                            ? SpaceLabSanitizer.sanitizeFragment(resultText)
                            : '';
                        range.insertNode(container);
        
                        sel.removeAllRanges();
                        const newRange = document.createRange();
                        newRange.selectNode(container);
                        sel.addRange(newRange);
        
                        saveCurrentState();
                        checkTimeBalance();
                        Loader.hide();
                        Toast.success('Texto refinado correctamente por la IA');
                    } catch (error) {
                        Loader.hide();
                        console.error('[AI Refinement] Error:', error);
                        Toast.error('Error al refinar texto: ' + error.message);
                    }
                });
            }
        }
        
        
        return {
            handleOpenPedagogyBrief,
            handleGenerateAI,
            handleAiRubrica,
            handleAiImproveText,
            handleAiProviderChange,
            handleSourceFileSelect,
            processSourceFile,
            showSourceFileInfo,
            handleRemoveSourceFile,
            initRefineTextModal
        };
    }

    return { create };
})();
