/* ═══════════════════════════════════════════════════
   APP.JS — Main Application Logic
   Space Lab — Sesiones Educativas
   ═══════════════════════════════════════════════════ */

; (function () {
    'use strict';

    if (!window.SpaceLabUtils || !window.LocalExportClient || !window.DocumentSourceProcessor
        || !window.SpaceLabExportController || !window.SpaceLabAiController
        || !window.SpaceLabWorkflowController || !window.SpaceLabStudentsController
        || !window.SpaceLabSessionController || !window.SpaceLabDesignController) {
        throw new Error('No se cargaron los módulos base de Space Lab.');
    }
    const {
        parseMinutes,
        escapeHtml: escHTML,
        formatDate,
        arrayBufferToBase64,
        getBinaryMimeFallback
    } = window.SpaceLabUtils;

    // ─── APP STATE ───
    const AppState = {
        currentSession: null,
        editMode: true,
        previewMode: false,
        sidebarOpen: false,
        sourceFileData: null, // Stores { name, type, base64, textContent }
        activeLogoTarget: null, // Stores target logo id: 'header-logo-left' or 'header-logo-regional'
        activeTableCell: null, // Stores currently active/focused table cell
        zoomScale: 1.0, // Custom zoom level for the sheet (1.0 = 100%)
        undoStack: [],
        redoStack: [],
        completedWorkflowTabs: new Set(),
        backendOnline: false,
        backendRunning: false
    };

    // ─── DOM REFERENCES ───
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const DOM = {
        // Sections
        sidebar: $('#sidebar'),
        workflowRail: $('#workflow-rail'),
        emptyState: $('#empty-state'),
        printPreview: $('#print-preview'),
        sessionSheet: $('#session-sheet'),
        previewArea: $('#preview-area'),
        // Buttons
        btnGenerate: $('#btn-generate'),
        btnToggleEdit: $('#btn-toggle-edit'),
        btnPreview: $('#btn-preview'),
        btnExportPdf: $('#btn-export-pdf'),
        btnDownloadEngine: $('#btn-download-engine'),
        btnSave: $('#btn-save'),
        btnSaveAs: $('#btn-save-as'),
        btnLoad: $('#btn-load'),
        btnNew: $('#btn-new'),
        btnCleanFormat: $('#btn-clean-format'),
        btnCloseSession: $('#btn-close-session'),
        btnMenuMobile: $('#btn-menu-mobile'),
        btnToggleRail: $('#btn-toggle-rail'),
        btnCloseSidebar: $('#btn-close-sidebar'),
        btnCloseLoad: $('#btn-close-load'),
        btnSaveDefaults: $('#btn-save-defaults'),
        // Form
        form: $('#session-form'),
        selectTemplate: $('#select-template'),
        selectMethodology: $('#select-methodology'),
        selectAiProvider: $('#select-ai-provider'),
        modelCapabilitiesBadge: $('#model-capabilities-badge'),
        inputInstitucion: $('#input-institucion'),
        inputDre: $('#input-dre'),
        inputUgel: $('#input-ugel'),
        inputDocente: $('#input-docente'),
        inputDirector: $('#input-director'),
        inputFecha: $('#input-fecha'),
        inputNivel: $('#input-nivel'),
        inputNumeroSesion: $('#input-numero-sesion'),
        inputGrado: $('#input-grado'),
        inputSeccion: $('#input-seccion'),
        inputArea: $('#input-area'),
        inputDuracion: $('#input-duracion'),
        inputUnidad: $('#input-unidad'),
        inputTitulo: $('#input-titulo'),
        inputCompetencia: $('#input-competencia'),
        inputCapacidad: $('#input-capacidad'),
        inputDesempeno: $('#input-desempeno'),
        inputEnfoque: $('#input-enfoque'),
        inputEnfoque2: $('#input-enfoque2'),
        // CNEB Dropdowns
        selectCnebCompetencia: $('#select-cneb-competencia'),
        selectCnebCapacidad: $('#select-cneb-capacidad'),
        selectCnebEnfoque: $('#select-cneb-enfoque'),
        selectCnebEnfoque2: $('#select-cneb-enfoque2'),
        // Import/Export
        btnExportJson: $('#btn-export-json'),
        btnImportJson: $('#btn-import-json'),
        inputImportFile: $('#input-import-file'),
        // Logo Upload & Gallery
        inputUploadLogo: $('#input-upload-logo'),
        btnTriggerUploadLogo: $('#btn-trigger-upload-logo'),
        btnRefreshLogos: $('#btn-refresh-logos'),
        logosContainer: $('#logos-container'),
        // Design customization controls
        designColor: $('#input-design-theme-color'),
        designColorHex: $('#input-design-theme-color-hex'),
        designPreset: $('#select-design-preset'),
        designAccentColor: $('#input-design-accent-color'),
        designFontFamily: $('#select-design-font-family'),
        designFontSize: $('#select-design-font-size'),
        designPadding: $('#select-design-padding'),
        designLineHeight: $('#select-design-line-height'),
        designHeaderBg: $('#select-design-header-bg'),
        // Ribbon customizer controls
        ribbonColor: $('#ribbon-theme-color'),
        ribbonFontFamily: $('#ribbon-font-family'),
        ribbonFontSize: $('#ribbon-font-size'),
        ribbonPadding: $('#ribbon-padding'),
        ribbonLineHeight: $('#ribbon-line-height'),
        ribbonHeaderBg: $('#ribbon-header-bg'),
        btnRibbonAddLogo: $('#btn-ribbon-add-logo'),
        // Ribbon Text formatting manual controls
        btnFormatUndo: $('#btn-format-undo'),
        btnFormatRedo: $('#btn-format-redo'),
        btnFormatForeColor: $('#btn-format-forecolor'),
        btnFormatBackColor: $('#btn-format-backcolor'),
        btnFormatAlignLeft: $('#btn-format-align-left'),
        btnFormatAlignCenter: $('#btn-format-align-center'),
        btnFormatAlignRight: $('#btn-format-align-right'),
        btnFormatAlignJustify: $('#btn-format-align-justify'),
        btnTableRowInsert: $('#btn-table-row-insert'),
        btnTableRowDelete: $('#btn-table-row-delete'),
        // Source File Upload
        inputSourceFile: $('#input-source-file'),
        sourceFileDropzone: $('#source-file-dropzone'),
        sourceFileInfo: $('#source-file-info'),
        sourceFileNameText: $('#source-file-name-text'),
        btnRemoveSourceFile: $('#btn-remove-source-file'),
        sourceFileGuidance: $('#source-file-guidance'),
        inputSourceInstruction: $('#input-source-instruction'),
        // Other
        editModeBadge: $('#edit-mode-badge'),
        savedList: $('#saved-list'),
        loadModal: $('#load-modal'),
        loadList: $('#load-list'),
        saveIndicator: $('#save-indicator'),
        spaceBg: $('#space-bg')
    };

    const {
        syncSessionContextTitle,
        updateWorkflowUi,
        activateWorkflowTab
    } = window.SpaceLabWorkflowController.create({
        state: AppState,
        dom: DOM,
        query: $,
        queryAll: $$,
        openSidebar
    });

    function init() {
        // Set today's date as default
        DOM.inputFecha.valueAsDate = new Date();

        // Bind all events
        bindEvents();
        updateWorkflowUi('tab-ai');
        syncSessionContextTitle();

        // Sync AI provider UI
        handleAiProviderChange();

        // Initialize space background
        initSpaceBackground();

        // Setup auto-save
        Storage.setupAutoSave(() => {
            saveCurrentState();
        });

        // Listen for form inputs to auto-save metadata changes
        DOM.form.addEventListener('input', () => {
            syncSessionContextTitle();
            if (AppState.currentSession) {
                const data = getFormData();
                AppState.currentSession.metadata = {
                    ...AppState.currentSession.metadata,
                    institucion: data.metadata.institucion || '',
                    dre: data.metadata.dre || '',
                    ugel: data.metadata.ugel || '',
                    docente: data.metadata.docente || '',
                    director: data.metadata.director || '',
                    fecha: data.metadata.fecha || '',
                    nivel: data.metadata.nivel || '',
                    grado: data.metadata.grado || '',
                    seccion: data.metadata.seccion || '',
                    area: data.metadata.area || '',
                    numeroSesion: data.metadata.numero_sesion || '',
                    duracionMinutos: parseMinutes(data.metadata.duracion) || 90,
                    unidad: data.metadata.unidad || '',
                    titulo: data.metadata.titulo || '',
                    logos: {
                        institucional: data.metadata.logo_left_url || null,
                        regional: data.metadata.logo_regional_url || null
                    }
                };
                AppState.currentSession.proposito = {
                    ...AppState.currentSession.proposito,
                    competencia: data.proposito.competencia || '',
                    capacidades: String(data.proposito.capacidad || '')
                        .split(/[;\n]/)
                        .map(value => value.trim())
                        .filter(Boolean),
                    desempeno: data.proposito.desempeno || ''
                };
                const enfoques = [...(AppState.currentSession.enfoquesTransversales || [])];
                [data.proposito.enfoque, data.proposito.enfoque2].forEach((nombre, index) => {
                    if (!nombre) return;
                    enfoques[index] = { ...(enfoques[index] || {}), nombre };
                });
                AppState.currentSession.enfoquesTransversales = enfoques;
                AppState.currentSession.alumnos = data.alumnos;
                Storage.triggerAutoSave();
            }
        });

        // Initialize Auth UI if available
        if (window.AuthUi) {
            window.AuthUi.init();
        }

        // Initialize Landing Router if available
        if (window.LandingRouter) {
            window.LandingRouter.init();
        }

        // Initialize Chatbot if available
        if (window.Chatbot) {
            Chatbot.init();
        }

        // Global callback to refresh session lists after login/logout
        window.getCurrentSession = () => AppState.currentSession;
        window.appReloadSessions = () => {
            renderSavedList();
            loadLastSession();
            loadProfileDefaults();
            loadLogosGallery();
        };

        // Load last session if exists
        loadLastSession();

        // Render saved sessions list
        renderSavedList();

        // Load curriculum database
        loadCurriculum();

        // Load profile defaults if user is logged in
        loadProfileDefaults();

        // Load logo gallery
        loadLogosGallery();

        // Setup drag and drop on sheet
        setupDragAndDrop();

        // Sync local and cloud sessions in the background
        if (window.Storage && typeof Storage.syncSessions === 'function') {
            Storage.syncSessions().then(() => {
                renderSavedList();
            }).catch(e => console.warn('[Sync] Sync failed at startup:', e));
        }

        // Check local backend status
        checkBackendStatus();

        // Loop de verificación en tiempo real del estado del motor (cada 6 segundos)
        setInterval(async () => {
            const wasOnline = AppState.backendOnline;
            await checkBackendStatus();
            if (wasOnline && !AppState.backendOnline) {
                if (typeof Toast !== 'undefined') {
                    Toast.warning('El motor de exportación local (pablitopyhost.exe) se ha cerrado o desconectado.');
                }
            } else if (!wasOnline && AppState.backendOnline) {
                if (typeof Toast !== 'undefined') {
                    Toast.success('¡Motor de exportación local conectado en tiempo real!');
                }
            }
        }, 6000);

        console.log('Space Lab initialized');
    }


    // ═══════════════════════════════════════
    // EVENT BINDING
    // ═══════════════════════════════════════

    function bindEvents() {
        // Sidebar tabs switcher
        const tabs = $$('.sidebar-tab');
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => activateWorkflowTab(tab));
            tab.addEventListener('keydown', (event) => {
                let nextIndex = null;
                if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
                if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
                if (event.key === 'Home') nextIndex = 0;
                if (event.key === 'End') nextIndex = tabs.length - 1;
                if (nextIndex === null) return;
                event.preventDefault();
                tabs[nextIndex].focus();
                activateWorkflowTab(tabs[nextIndex]);
            });
        });

        const btnEmptyStart = $('#btn-empty-start');
        if (btnEmptyStart) {
            btnEmptyStart.addEventListener('click', () => {
                const dataTab = $('.sidebar-tab[data-tab="tab-general"]');
                activateWorkflowTab(dataTab);
                dataTab?.focus();
            });
        }

        // Generate buttons
        DOM.btnGenerate.addEventListener('click', handleGenerateAI);

        // Pedagogy Brief trigger button
        const btnPedagogyBrief = document.getElementById('btn-pedagogy-brief');
        if (btnPedagogyBrief) {
            btnPedagogyBrief.addEventListener('click', handleOpenPedagogyBrief);
        }

        // When PedagogyBrief finishes, auto-trigger AI generation with the summary
        document.addEventListener('pedagogy-brief-ready', (e) => {
            const summary = e.detail?.summary || null;
            // Update button visual state
            const btn = document.getElementById('btn-pedagogy-brief');
            if (btn) {
                if (summary) {
                    btn.classList.add('pb-has-brief');
                    btn.textContent = 'Enfoque listo — Editar';
                } else {
                    btn.classList.remove('pb-has-brief');
                    btn.textContent = 'Afinar enfoque pedagógico';
                }
            }
            // Auto-launch AI generation
            handleGenerateAI();
        });

        // Action buttons
        DOM.btnToggleEdit.addEventListener('click', toggleEditMode);
        DOM.btnPreview.addEventListener('click', togglePreviewMode);
        DOM.btnExportPdf.addEventListener('click', () => {
            if (AppState.backendOnline) {
                exportarAPDFBackend();
            } else if (AppState.backendRunning) {
                if (typeof Toast !== 'undefined') {
                    Toast.warning('El Motor Local está encendido pero falta vincularlo. Haz clic en "[ CLIC AQUÍ PARA VINCULAR ]" en la ventana de pablitopyhost.exe para enlazar de forma segura.');
                }
            } else {
                showPdfGuide();
            }
        });

        // Word export listeners
        const btnExportWord = document.getElementById('btn-export-word');
        if (btnExportWord) {
            btnExportWord.addEventListener('click', handleExportWord);
        }
        const btnExportWordPreview = document.getElementById('btn-export-word-preview');
        if (btnExportWordPreview) {
            btnExportWordPreview.addEventListener('click', handleExportWord);
        }

        const btnAiRubrica = document.getElementById('btn-ai-rubrica');
        if (btnAiRubrica) {
            btnAiRubrica.addEventListener('click', handleAiRubrica);
        }

        const btnAiImproveText = document.getElementById('btn-ai-improve-text');
        if (btnAiImproveText) {
            btnAiImproveText.addEventListener('click', () => handleAiImproveText('improve'));
        }

        // Live Time Balance updates
        DOM.sessionSheet.addEventListener('input', checkTimeBalance);
        if (DOM.inputDuracion) {
            DOM.inputDuracion.addEventListener('input', checkTimeBalance);
            DOM.inputDuracion.addEventListener('change', checkTimeBalance);
        }

        if (DOM.btnDownloadEngine) {
            DOM.btnDownloadEngine.addEventListener('click', (e) => {
                if (AppState.backendOnline) {
                    e.preventDefault();
                    if (typeof Toast !== 'undefined') {
                        Toast.success('El Motor Local está conectado de forma segura y listo.');
                    }
                }
            });
        }

        // PDF Guide Modal bindings
        const pdfGuideModal = document.getElementById('pdf-guide-modal');
        const pdfGuideClose = document.getElementById('pdf-guide-close');
        const pdfGuideCancel = document.getElementById('pdf-guide-cancel');
        const pdfGuideProceed = document.getElementById('pdf-guide-proceed');
        if (pdfGuideClose) pdfGuideClose.addEventListener('click', closePdfGuide);
        if (pdfGuideCancel) pdfGuideCancel.addEventListener('click', closePdfGuide);
        if (pdfGuideProceed) pdfGuideProceed.addEventListener('click', () => {
            closePdfGuide();
            handlePrint();
        });
        // Close on backdrop click
        if (pdfGuideModal) {
            pdfGuideModal.addEventListener('click', (e) => {
                if (e.target === pdfGuideModal) closePdfGuide();
            });
        }

        // Engine Required Modal bindings
        const engineRequiredModal = document.getElementById('engine-required-modal');
        const engineModalClose = document.getElementById('engine-modal-close');
        const engineModalCancel = document.getElementById('engine-modal-cancel');
        if (engineModalClose) engineModalClose.addEventListener('click', closeEngineModal);
        if (engineModalCancel) engineModalCancel.addEventListener('click', closeEngineModal);
        if (engineRequiredModal) {
            engineRequiredModal.addEventListener('click', (e) => {
                if (e.target === engineRequiredModal) closeEngineModal();
            });
        }

        DOM.btnSave.addEventListener('click', handleSave);
        if (DOM.btnSaveAs) DOM.btnSaveAs.addEventListener('click', handleSaveAs);
        DOM.btnLoad.addEventListener('click', handleShowLoadModal);
        DOM.btnNew.addEventListener('click', handleNew);
        DOM.btnCleanFormat.addEventListener('click', handleCleanFormat);
        if (DOM.btnCloseSession) DOM.btnCloseSession.addEventListener('click', handleCloseSession);

        // CNEB Curriculum dropdowns
        DOM.inputArea.addEventListener('change', handleAreaChange);
        DOM.selectAiProvider.addEventListener('change', handleAiProviderChange);
        DOM.selectCnebCompetencia.addEventListener('change', handleCompetenciaChange);
        DOM.selectCnebCapacidad.addEventListener('change', handleCapacidadChange);
        DOM.selectCnebEnfoque.addEventListener('change', handleEnfoqueChange);
        DOM.selectCnebEnfoque2.addEventListener('change', handleEnfoque2Change);

        // Student Roster change and save listeners
        DOM.inputNivel.addEventListener('change', loadRosterForCurrentClass);
        DOM.inputGrado.addEventListener('change', loadRosterForCurrentClass);
        DOM.inputSeccion.addEventListener('input', loadRosterForCurrentClass);
        const btnSaveAlumnos = document.getElementById('btn-save-alumnos');
        if (btnSaveAlumnos) btnSaveAlumnos.addEventListener('click', handleSaveAlumnos);

        // Import / Export JSON
        DOM.btnExportJson.addEventListener('click', handleExportJson);
        DOM.btnImportJson.addEventListener('click', () => DOM.inputImportFile.click());
        DOM.inputImportFile.addEventListener('change', handleImportJson);

        // Mobile sidebar
        DOM.btnMenuMobile.addEventListener('click', toggleSidebar);
        const desktopWorkflow = window.matchMedia('(min-width: 1101px)');
        const syncWorkflowDisclosure = () => {
            const isDesktop = desktopWorkflow.matches;
            if (isDesktop) DOM.workflowRail.classList.remove('expanded');
            DOM.btnToggleRail.setAttribute('aria-expanded', String(isDesktop || DOM.workflowRail.classList.contains('expanded')));
            DOM.btnToggleRail.setAttribute('aria-label', isDesktop
                ? 'Etapas del flujo de creación'
                : (DOM.workflowRail.classList.contains('expanded') ? 'Ocultar nombres de las etapas' : 'Mostrar nombres de las etapas'));
        };
        DOM.btnToggleRail.addEventListener('click', () => {
            if (desktopWorkflow.matches) return;
            const expanded = DOM.workflowRail.classList.toggle('expanded');
            DOM.btnToggleRail.setAttribute('aria-expanded', String(expanded));
            DOM.btnToggleRail.setAttribute('aria-label', expanded ? 'Ocultar nombres de las etapas' : 'Mostrar nombres de las etapas');
        });
        desktopWorkflow.addEventListener?.('change', syncWorkflowDisclosure);
        syncWorkflowDisclosure();
        DOM.btnCloseSidebar.addEventListener('click', () => closeSidebar());
        document.addEventListener('click', (event) => {
            if (!AppState.sidebarOpen) return;
            if (DOM.sidebar.contains(event.target) || DOM.workflowRail.contains(event.target) || DOM.btnMenuMobile.contains(event.target)) return;
            event.preventDefault();
            event.stopPropagation();
            closeSidebar(false);
        }, true);

        // Load modal
        DOM.btnCloseLoad.addEventListener('click', () => DOM.loadModal.classList.add('hidden'));
        DOM.loadModal.addEventListener('click', (e) => {
            if (e.target === DOM.loadModal) DOM.loadModal.classList.add('hidden');
        });

        // Clean paste in contenteditable
        document.addEventListener('paste', handleCleanPaste);

        // Save defaults in profile
        DOM.btnSaveDefaults.addEventListener('click', handleSaveDefaults);

        // Upload logo trigger and event
        DOM.btnTriggerUploadLogo.addEventListener('click', () => {
            AppState.activeLogoTarget = null; // Reset target so it asks
            DOM.inputUploadLogo.click();
        });
        DOM.inputUploadLogo.addEventListener('change', handleUploadLogo);
        DOM.btnRefreshLogos.addEventListener('click', loadLogosGallery);

        // Selection range holder for manual formatting (letter colors & highlight)
        let lastSelectionRange = null;

        function saveSelection() {
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                if (DOM.sessionSheet.contains(range.commonAncestorContainer)) {
                    lastSelectionRange = range;
                }
            }
        }

        function restoreSelection() {
            if (lastSelectionRange) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(lastSelectionRange);
            }
        }

        DOM.sessionSheet.addEventListener('mouseup', saveSelection);
        DOM.sessionSheet.addEventListener('keyup', saveSelection);
        DOM.sessionSheet.addEventListener('focusout', saveSelection);

        // Keep track of active table cell for row insertions/deletions
        DOM.sessionSheet.addEventListener('focusin', (e) => {
            const cell = e.target.closest('td, th');
            if (cell) {
                AppState.activeTableCell = cell;
            }
        });
        DOM.sessionSheet.addEventListener('click', (e) => {
            const cell = e.target.closest('td, th');
            if (cell) {
                AppState.activeTableCell = cell;
            }
        });

        // Helper to update session design styles from DOM inputs
        function updateStylesFromSidebar() {
            applyDesignStyles(DocumentPresentation.normalize({
                preset: DOM.designPreset?.value,
                themeColor: DOM.designColor.value,
                accentColor: DOM.designAccentColor?.value,
                fontFamily: DOM.designFontFamily.value,
                fontSize: DOM.designFontSize.value,
                padding: DOM.designPadding.value,
                lineHeight: DOM.designLineHeight.value,
                headerBg: DOM.designHeaderBg.value
            }));
            saveCurrentState();
        }

        function updateStylesFromRibbon() {
            applyDesignStyles(DocumentPresentation.normalize({
                preset: DOM.designPreset?.value,
                themeColor: DOM.ribbonColor.value,
                accentColor: DOM.designAccentColor?.value,
                fontFamily: DOM.ribbonFontFamily.value,
                fontSize: DOM.ribbonFontSize.value,
                padding: DOM.ribbonPadding.value,
                lineHeight: DOM.ribbonLineHeight.value,
                headerBg: DOM.ribbonHeaderBg.value
            }));
            saveCurrentState();
        }

        // Design customizer controls events (Sidebar)
        DOM.designColor.addEventListener('input', updateStylesFromSidebar);
        if (DOM.designAccentColor) DOM.designAccentColor.addEventListener('input', updateStylesFromSidebar);
        if (DOM.designPreset) DOM.designPreset.addEventListener('change', () => {
            applyDesignStyles(DocumentPresentation.preset(DOM.designPreset.value));
            saveCurrentState();
        });
        DOM.designColorHex.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                DOM.designColor.value = e.target.value;
                updateStylesFromSidebar();
            }
        });
        if (DOM.designFontFamily) DOM.designFontFamily.addEventListener('change', updateStylesFromSidebar);
        DOM.designFontSize.addEventListener('change', updateStylesFromSidebar);
        DOM.designPadding.addEventListener('change', updateStylesFromSidebar);
        DOM.designLineHeight.addEventListener('change', updateStylesFromSidebar);
        DOM.designHeaderBg.addEventListener('change', updateStylesFromSidebar);

        // Design customizer controls events (Ribbon)
        if (DOM.ribbonColor) DOM.ribbonColor.addEventListener('input', updateStylesFromRibbon);
        if (DOM.ribbonFontFamily) DOM.ribbonFontFamily.addEventListener('change', updateStylesFromRibbon);
        if (DOM.ribbonFontSize) DOM.ribbonFontSize.addEventListener('change', updateStylesFromRibbon);
        if (DOM.ribbonPadding) DOM.ribbonPadding.addEventListener('change', updateStylesFromRibbon);
        if (DOM.ribbonLineHeight) DOM.ribbonLineHeight.addEventListener('change', updateStylesFromRibbon);
        if (DOM.ribbonHeaderBg) DOM.ribbonHeaderBg.addEventListener('change', updateStylesFromRibbon);

        // Text formatting command triggers (Word Style)
        const formatBtnBold = document.getElementById('btn-format-bold');
        if (formatBtnBold) {
            formatBtnBold.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand('bold', false, null);
            });
        }
        const formatBtnItalic = document.getElementById('btn-format-italic');
        if (formatBtnItalic) {
            formatBtnItalic.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand('italic', false, null);
            });
        }
        const formatBtnUnderline = document.getElementById('btn-format-underline');
        if (formatBtnUnderline) {
            formatBtnUnderline.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand('underline', false, null);
            });
        }
        const formatBtnListBullet = document.getElementById('btn-format-list-bullet');
        if (formatBtnListBullet) {
            formatBtnListBullet.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand('insertUnorderedList', false, null);
            });
        }
        const formatBtnListNumber = document.getElementById('btn-format-list-number');
        if (formatBtnListNumber) {
            formatBtnListNumber.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand('insertOrderedList', false, null);
            });
        }

        // Alignments manual editing
        const formatBtnAlignLeft = document.getElementById('btn-format-align-left');
        if (formatBtnAlignLeft) {
            formatBtnAlignLeft.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand('justifyLeft', false, null);
            });
        }
        const formatBtnAlignCenter = document.getElementById('btn-format-align-center');
        if (formatBtnAlignCenter) {
            formatBtnAlignCenter.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand('justifyCenter', false, null);
            });
        }
        const formatBtnAlignRight = document.getElementById('btn-format-align-right');
        if (formatBtnAlignRight) {
            formatBtnAlignRight.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand('justifyRight', false, null);
            });
        }
        const formatBtnAlignJustify = document.getElementById('btn-format-align-justify');
        if (formatBtnAlignJustify) {
            formatBtnAlignJustify.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand('justifyFull', false, null);
            });
        }

        // Undo and Redo triggers
        if (DOM.btnFormatUndo) {
            DOM.btnFormatUndo.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand('undo', false, null);
                saveCurrentState();
            });
        }
        if (DOM.btnFormatRedo) {
            DOM.btnFormatRedo.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand('redo', false, null);
                saveCurrentState();
            });
        }

        // Table row management triggers
        if (DOM.btnTableRowInsert) {
            DOM.btnTableRowInsert.addEventListener('click', (e) => {
                e.preventDefault();
                handleInsertRow();
            });
        }
        if (DOM.btnTableRowDelete) {
            DOM.btnTableRowDelete.addEventListener('click', (e) => {
                e.preventDefault();
                handleDeleteRow();
            });
        }

        // Color formatting using last saved selection
        if (DOM.btnFormatForeColor) {
            DOM.btnFormatForeColor.addEventListener('change', (e) => {
                restoreSelection();
                document.execCommand('foreColor', false, e.target.value);
                saveCurrentState();
            });
        }
        if (DOM.btnFormatBackColor) {
            DOM.btnFormatBackColor.addEventListener('change', (e) => {
                restoreSelection();
                document.execCommand('hiliteColor', false, e.target.value);
                saveCurrentState();
            });
        }

        // Ribbon Add Logo trigger
        if (DOM.btnRibbonAddLogo) {
            DOM.btnRibbonAddLogo.addEventListener('click', (e) => {
                e.preventDefault();
                const logosList = document.getElementById('official-header-logos-list');
                if (logosList) {
                    AppState.activeLogoTarget = null; // Reset target so it appends
                    openLogosGalleryModal();
                } else {
                    Toast.warning('Genera la sesión primero para poder añadir un logo');
                }
            });
        }

        // Click on logo images or add-logo placeholder inside document
        DOM.sessionSheet.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.classList.contains('official-logo-img')) {
                e.stopPropagation();
                openLogoEditor(target);
            } else if (target && (target.id === 'btn-add-header-logo' || target.closest('#btn-add-header-logo'))) {
                e.stopPropagation();
                AppState.activeLogoTarget = null; // Reset target so it appends
                openLogosGalleryModal();
            }
        });

        // Listen for logo removal event to save state
        window.addEventListener('logo-removed', () => {
            saveCurrentState();
        });

        // Initialize Floating Logo Editor global listeners once
        initLogoEditorListeners();

        // Source file upload drag & drop events
        DOM.sourceFileDropzone.addEventListener('click', () => DOM.inputSourceFile.click());
        DOM.inputSourceFile.addEventListener('change', handleSourceFileSelect);
        DOM.sourceFileDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            DOM.sourceFileDropzone.classList.add('dragover');
        });
        DOM.sourceFileDropzone.addEventListener('dragleave', () => {
            DOM.sourceFileDropzone.classList.remove('dragover');
        });
        DOM.sourceFileDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            DOM.sourceFileDropzone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processSourceFile(e.dataTransfer.files[0]);
            }
        });
        DOM.btnRemoveSourceFile.addEventListener('click', handleRemoveSourceFile);

        // Ctrl + Scroll Zoom on sheet
        DOM.previewArea.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault(); // Prevent standard browser zoom

                const delta = e.deltaY;
                const scaleChange = 0.05;
                if (delta < 0) {
                    AppState.zoomScale = Math.min(AppState.zoomScale + scaleChange, 2.0); // max 200%
                } else {
                    AppState.zoomScale = Math.max(AppState.zoomScale - scaleChange, 0.5); // min 50%
                }

                applyZoom();
            }
        }, { passive: false });

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboard);

        // Word-like Right-Click Context Menu
        initContextMenu();

        // Logos Gallery Modal listeners
        initLogosGalleryModal();

        // Refine text modal listeners
        initRefineTextModal();

        // ── Interceptación de impresión para paginado A4 dinámico temporal ──
        window.addEventListener('beforeprint', () => {
            if (typeof Paginador !== 'undefined') {
                try {
                    // Guardar HTML original interactivo
                    DOM.sessionSheet.setAttribute('data-original-html', DOM.sessionSheet.innerHTML);

                    // Clonar limpio para medir
                    const clone = DOM.sessionSheet.cloneNode(true);
                    clone.querySelectorAll('.no-print, #logo-resize-handle, .btn-remove-logo, .add-logo-placeholder').forEach(el => el.remove());

                    const canvas = Paginador.calcular(clone);
                    const hojas = canvas.querySelectorAll('.hoja-a4');
                    hojas.forEach((h, i) => h.setAttribute('data-pagina', `${i + 1} / ${hojas.length}`));

                    // Reemplazar DOM temporalmente
                    DOM.sessionSheet.innerHTML = '';
                    DOM.sessionSheet.appendChild(canvas);
                } catch (e) {
                    console.warn('[Paginador] Error al aplicar paginado temporal para impresión:', e);
                }
            }
        });

        window.addEventListener('afterprint', () => {
            const originalHtml = DOM.sessionSheet.getAttribute('data-original-html');
            if (originalHtml) {
                DOM.sessionSheet.innerHTML = originalHtml;
                DOM.sessionSheet.removeAttribute('data-original-html');

                // Re-inicializar fórmulas matemáticas en el DOM restaurado
                renderMatematica();

                // Re-enlazar celdas editables para que el cursor no pierda foco
                const editables = DOM.sessionSheet.querySelectorAll('[contenteditable]');
                editables.forEach(el => {
                    el.addEventListener('focusout', saveSelection);
                });
            }
        });
    }

    // ═══════════════════════════════════════
    // STUDENT ROSTER LOGIC
    // ═══════════════════════════════════════
    const {
        loadRosterForCurrentClass,
        handleSaveAlumnos
    } = window.SpaceLabStudentsController.create({
        state: AppState,
        dom: DOM,
        renderSession
    });

    function getFormData() {
        const logos = [];
        const logoImgs = DOM.sessionSheet.querySelectorAll('.official-logo-img');
        logoImgs.forEach((img, index) => {
            logos.push({
                id: img.id || `header-logo-${Date.now()}-${index}`,
                url: img.getAttribute('src') || '',
                style: img.getAttribute('style') || ''
            });
        });

        const firstLogo = logos[0] || {};
        const secondLogo = logos[1] || {};

        return {
            metadata: {
                institucion: DOM.inputInstitucion.value,
                dre: DOM.inputDre.value,
                ugel: DOM.inputUgel.value,
                docente: DOM.inputDocente.value,
                director: DOM.inputDirector.value,
                fecha: DOM.inputFecha.value,
                nivel: DOM.inputNivel.value,
                numero_sesion: DOM.inputNumeroSesion.value,
                grado: DOM.inputGrado.value,
                seccion: DOM.inputSeccion.value,
                area: DOM.inputArea.value,
                duracion: DOM.inputDuracion.value,
                unidad: DOM.inputUnidad.value,
                titulo: DOM.inputTitulo.value,
                methodology: DOM.selectMethodology.value,
                ai_provider: DOM.selectAiProvider.value,
                logo_regional_url: secondLogo.url || '',
                logo_left_url: firstLogo.url || '',
                logo_left_style: firstLogo.style || '',
                logo_regional_style: secondLogo.style || '',
                logos: logos
            },
            proposito: {
                competencia: DOM.inputCompetencia.value,
                capacidad: DOM.inputCapacidad.value,
                desempeno: DOM.inputDesempeno.value,
                enfoque: DOM.inputEnfoque.value,
                enfoque2: DOM.inputEnfoque2.value
            },
            presentation: DocumentPresentation.normalize({
                preset: DOM.designPreset?.value,
                themeColor: DOM.designColor.value,
                accentColor: DOM.designAccentColor?.value,
                fontFamily: DOM.designFontFamily.value,
                fontSize: DOM.designFontSize.value,
                padding: DOM.designPadding.value,
                lineHeight: DOM.designLineHeight.value,
                headerBg: DOM.designHeaderBg.value
            }),
            momentos: {},
            evaluacion: {},
            alumnos: (() => {
                const text = document.getElementById('textarea-alumnos')?.value || '';
                return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            })()
        };
    }

    function populateForm(session) {
        if (!session) return;
        const m = session.metadata || {};
        const p = session.proposito || {};
        const d = DocumentPresentation.normalize(session.presentation || session.design || {
            themeColor: '#000000',
            fontFamily: 'Arial, sans-serif',
            fontSize: '10pt',
            padding: '4px 6px',
            lineHeight: '1.4',
            headerBg: '#f1f5f9'
        });

        DOM.inputInstitucion.value = m.institucion || '';
        DOM.inputDre.value = m.dre || '';
        DOM.inputUgel.value = m.ugel || '';
        DOM.inputDocente.value = m.docente || '';
        DOM.inputDirector.value = m.director || '';
        DOM.inputFecha.value = m.fecha || '';
        DOM.inputNivel.value = m.nivel || 'SECUNDARIA';
        DOM.inputNumeroSesion.value = m.numeroSesion || m.numero_sesion || '';
        DOM.inputGrado.value = m.grado || '';
        DOM.inputSeccion.value = m.seccion || '';
        DOM.inputArea.value = m.area || '';
        DOM.inputDuracion.value = m.duracionMinutos || m.duracion || '';
        DOM.inputUnidad.value = m.unidad || '';
        DOM.inputTitulo.value = m.titulo || '';
        DOM.inputCompetencia.value = p.competencia || '';
        DOM.inputCapacidad.value = p.capacidad || (p.capacidades || []).join('; ');
        DOM.inputDesempeno.value = p.desempeno || '';
        DOM.inputEnfoque.value = p.enfoque || '';
        DOM.inputEnfoque2.value = p.enfoque2 || '';

        if (session.template) {
            DOM.selectTemplate.value = session.template;
        }
        DOM.selectMethodology.value = m.methodology || '';
        
        let prov = m.ai_provider || 'openai-gpt-6-luna';
        if (prov === 'openai') prov = 'openai-gpt-6-luna';
        if (prov === 'gemini') prov = 'gemini-2.5-flash';
        if (prov === 'deepseek') prov = 'deepseek-chat';
        DOM.selectAiProvider.value = prov;
        handleAiProviderChange();

        // Design config inputs
        const cssDesign = DocumentPresentation.toCss(d);
        DOM.designColor.value = d.primaryColor;
        DOM.designColorHex.value = d.primaryColor;
        if (DOM.designPreset) DOM.designPreset.value = d.preset;
        if (DOM.designAccentColor) DOM.designAccentColor.value = d.accentColor;
        if (DOM.designFontFamily) DOM.designFontFamily.value = cssDesign.fontFamily;
        DOM.designFontSize.value = cssDesign.fontSize;
        DOM.designPadding.value = cssDesign.padding;
        DOM.designLineHeight.value = cssDesign.lineHeight;
        DOM.designHeaderBg.value = d.headerBackground;

        // Sync curriculum selectors with loaded area
        handleAreaChange();

        // Populate student roster textarea
        const textareaAlumnos = document.getElementById('textarea-alumnos');
        if (textareaAlumnos) {
            textareaAlumnos.value = (session.alumnos || session.listaCotejo?.alumnos || []).join('\n');
        }
    }

    // ═══════════════════════════════════════
    // SESSION GENERATION
    // ═══════════════════════════════════════

    // ─── PEDAGOGY BRIEF ───
    function renderSession(session) {
        const template = session.template || 'estandar';
        const html = Templates.render(template, session, AppState.editMode);

        DOM.sessionSheet.innerHTML = window.SpaceLabSanitizer
            ? SpaceLabSanitizer.sanitizeSessionHTML(html)
            : '';
        DOM.emptyState.classList.add('hidden');
        DOM.printPreview.classList.remove('hidden');

        // Apply design customizer variables
        applyDesignStyles(session.presentation || session.design);

        // Apply zoom scale
        applyZoom();

        // Close sidebar on mobile
        closeSidebar();

        // Save current state
        Storage.setCurrentSession(session);

        // Check time balance
        checkTimeBalance();

        // Render math formulas (KaTeX) — only for Matemática sessions or if LaTeX delimiters detected
        renderMatematica();
    }

    // ═══════════════════════════════════════
    // KATEX MATH RENDERING
    // ═══════════════════════════════════════

    function renderMatematica() {
        if (typeof renderMathInElement !== 'function') return;
        if (!DOM.sessionSheet) return;

        try {
            renderMathInElement(DOM.sessionSheet, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false,
                errorColor: '#cc0000',
                // Preserve the contenteditable attribute after KaTeX rendering
                trust: (context) => context.command !== '\\href'
            });
        } catch (err) {
            // KaTeX errors are non-fatal — session still renders normally
            console.warn('[KaTeX] Render warning:', err.message);
        }
    }

    // ═══════════════════════════════════════
    // EDIT MODE
    // ═══════════════════════════════════════

    function enforceEditMode() {
        const editables = DOM.sessionSheet.querySelectorAll('[contenteditable]');
        editables.forEach(el => {
            el.setAttribute('contenteditable', AppState.editMode ? 'true' : 'false');
        });
    }

    function toggleEditMode() {
        AppState.editMode = !AppState.editMode;

        enforceEditMode();

        // Update UI
        const btnLabel = DOM.btnToggleEdit.querySelector('.btn-label');
        const btnIconUse = DOM.btnToggleEdit.querySelector('use');

        if (AppState.editMode) {
            btnLabel.textContent = 'Editar';
            if (btnIconUse) btnIconUse.setAttribute('href', '#icon-edit');
            DOM.editModeBadge.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#icon-edit"></use></svg>Modo edición';
            DOM.editModeBadge.classList.remove('read-only');
        } else {
            btnLabel.textContent = 'Lectura';
            if (btnIconUse) btnIconUse.setAttribute('href', '#icon-eye');
            DOM.editModeBadge.innerHTML = '<svg class="ui-icon" aria-hidden="true"><use href="#icon-eye"></use></svg>Modo lectura';
            DOM.editModeBadge.classList.add('read-only');
        }

        Toast.info(AppState.editMode ? 'Modo edición activado' : 'Modo lectura activado');
    }

    // ═══════════════════════════════════════
    // PREVIEW & PRINT
    // ═══════════════════════════════════════

    function togglePreviewMode() {
        if (!AppState.currentSession) {
            Toast.warning('Genera una sesión primero');
            return;
        }

        AppState.previewMode = !AppState.previewMode;

        if (AppState.previewMode) {
            document.body.classList.add('preview-active');
            DOM.sidebar.style.display = 'none';
            DOM.previewArea.style.maxWidth = '900px';
            DOM.previewArea.style.margin = '0 auto';
            Toast.info('Vista previa activada. Clic de nuevo para salir.');
        } else {
            document.body.classList.remove('preview-active');
            DOM.sidebar.style.display = '';
            DOM.previewArea.style.maxWidth = '';
            DOM.previewArea.style.margin = '';
        }
    }

    const {
        handleSave,
        handleSaveAs,
        saveCurrentState,
        undo,
        redo,
        compressImage,
        validateLogoFile,
        loadLastSession,
        handleShowLoadModal,
        handleNew,
        handleCloseSession,
        renderSavedList
    } = window.SpaceLabSessionController.create({
        state: AppState,
        dom: DOM,
        escapeHtml: escHTML,
        formatDate,
        getFormData,
        populateForm,
        renderSession,
        applyDesignStyles: (...args) => applyDesignStyles(...args),
        applyZoom,
        enforceEditMode,
        checkTimeBalance: (...args) => checkTimeBalance(...args),
        loadProfileDefaults
    });

    const {
        handlePrint,
        showPdfGuide,
        closePdfGuide,
        showEngineModal,
        closeEngineModal,
        checkBackendStatus,
        getFormDataJSON,
        exportarAPDFBackend,
        handleExportWord,
        checkTimeBalance
    } = window.SpaceLabExportController.create({
        state: AppState,
        dom: DOM,
        parseMinutes,
        saveCurrentState
    });

    const {
        handleOpenPedagogyBrief,
        handleGenerateAI,
        handleAiRubrica,
        handleAiImproveText,
        handleAiProviderChange,
        handleSourceFileSelect,
        processSourceFile,
        handleRemoveSourceFile,
        initRefineTextModal
    } = window.SpaceLabAiController.create({
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
    });

    function handleCleanPaste(e) {
        const target = e.target;
        if (target.closest('#session-sheet') && target.hasAttribute('contenteditable')) {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        }
    }

    function handleCleanFormat() {
        if (!AppState.currentSession) return;

        const editables = DOM.sessionSheet.querySelectorAll('[contenteditable]');
        editables.forEach(el => {
            // Utilizar el DOMParser del navegador para limpiar de manera robusta
            const parser = new DOMParser();
            const doc = parser.parseFromString(el.innerHTML, 'text/html');

            // Lista de etiquetas permitidas
            const allowedTags = ['STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'P', 'BR'];

            // Función recursiva para sanear nodos
            function sanitizeNode(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.cloneNode(true);
                }

                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tagName = node.tagName;

                    // Si la etiqueta está permitida, recreamos el elemento sin atributos
                    if (allowedTags.includes(tagName)) {
                        const newEl = document.createElement(tagName);

                        // Recursivamente sanear y añadir hijos
                        node.childNodes.forEach(child => {
                            const cleanChild = sanitizeNode(child);
                            if (cleanChild) newEl.appendChild(cleanChild);
                        });
                        return newEl;
                    } else {
                        // Si la etiqueta no está permitida (ej: span, div, font, table, etc.),
                        // extraemos recursivamente sus hijos y los retornamos en un DocumentFragment
                        const fragment = document.createDocumentFragment();
                        node.childNodes.forEach(child => {
                            const cleanChild = sanitizeNode(child);
                            if (cleanChild) fragment.appendChild(cleanChild);
                        });
                        return fragment;
                    }
                }
                return null;
            }

            const cleanFragment = document.createDocumentFragment();
            doc.body.childNodes.forEach(child => {
                const cleanChild = sanitizeNode(child);
                if (cleanChild) cleanFragment.appendChild(cleanChild);
            });

            // Reemplazar el HTML original
            el.innerHTML = '';
            el.appendChild(cleanFragment);

            // Limpieza de espacios en blanco
            el.innerHTML = el.innerHTML.trim();
        });

        Toast.success('Formato limpiado (conservando negritas y listas)');
    }

    // ═══════════════════════════════════════
    // PLANNING DRAWER
    // ═══════════════════════════════════════

    function openSidebar() {
        AppState.sidebarOpen = true;
        DOM.sidebar.classList.add('open');
        document.body.classList.add('sidebar-open');
        DOM.btnMenuMobile.setAttribute('aria-expanded', 'true');
        window.setTimeout(() => DOM.btnCloseSidebar.focus(), 180);
    }

    function toggleSidebar() {
        if (AppState.sidebarOpen) closeSidebar();
        else openSidebar();
    }

    function closeSidebar(returnFocus = true) {
        AppState.sidebarOpen = false;
        DOM.sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        DOM.btnMenuMobile.setAttribute('aria-expanded', 'false');
        if (returnFocus) $('.sidebar-tab.active')?.focus();
    }

    // ═══════════════════════════════════════
    // KEYBOARD SHORTCUTS
    // ═══════════════════════════════════════

    function handleKeyboard(e) {
        const key = e.key.toLowerCase();

        // Ctrl+S: Save
        if (e.ctrlKey && key === 's') {
            e.preventDefault();
            handleSave();
        }
        // Ctrl+P: Print
        if (e.ctrlKey && key === 'p') {
            e.preventDefault();
            handlePrint();
        }
        // Ctrl+E: Toggle edit
        if (e.ctrlKey && key === 'e') {
            e.preventDefault();
            toggleEditMode();
        }
        // Ctrl+Z: Undo
        if (e.ctrlKey && key === 'z') {
            e.preventDefault();
            undo();
        }
        // Ctrl+Y: Redo
        if (e.ctrlKey && key === 'y') {
            e.preventDefault();
            redo();
        }
        // Ctrl+B or Ctrl+N: Bold (N is bold in Spanish MS Word)
        if (e.ctrlKey && (key === 'b' || key === 'n')) {
            e.preventDefault();
            document.execCommand('bold', false, null);
            saveCurrentState();
        }
        // Ctrl+I or Ctrl+K: Italic (K is italic in Spanish MS Word)
        if (e.ctrlKey && (key === 'i' || key === 'k')) {
            e.preventDefault();
            document.execCommand('italic', false, null);
            saveCurrentState();
        }
        // Ctrl+U: Underline
        if (e.ctrlKey && key === 'u') {
            e.preventDefault();
            document.execCommand('underline', false, null);
            saveCurrentState();
        }
        // Escape: Close modals/sidebar
        if (e.key === 'Escape') {
            closeSidebar();
            DOM.loadModal.classList.add('hidden');
            const galleryModal = document.getElementById('logos-gallery-modal');
            if (galleryModal) galleryModal.classList.add('hidden');
            const menu = document.getElementById('editor-context-menu');
            if (menu) {
                menu.style.display = 'none';
                menu.classList.add('hidden');
            }
            hideResizeHandle();
            if (AppState.previewMode) togglePreviewMode();
        }
    }

    // ═══════════════════════════════════════
    // SPACE BACKGROUND (Canvas Animation)
    // ═══════════════════════════════════════

    function initSpaceBackground() {
        const canvas = DOM.spaceBg;
        if (!canvas || canvas.hidden) return;

        const ctx = canvas.getContext('2d');
        let stars = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            createStars();
        }

        function createStars() {
            stars = [];
            const count = Math.floor((canvas.width * canvas.height) / 5000);
            for (let i = 0; i < count; i++) {
                const layer = Math.random() < 0.6 ? 1 : (Math.random() < 0.85 ? 2 : 3);
                let size, speed, opacity, twinkleSpeed;

                if (layer === 1) { // Background stars
                    size = Math.random() * 0.8 + 0.3;
                    speed = Math.random() * 0.05 + 0.01;
                    opacity = Math.random() * 0.5 + 0.2;
                    twinkleSpeed = Math.random() * 0.02 + 0.005;
                } else if (layer === 2) { // Midground stars
                    size = Math.random() * 1.2 + 0.8;
                    speed = Math.random() * 0.15 + 0.05;
                    opacity = Math.random() * 0.7 + 0.3;
                    twinkleSpeed = Math.random() * 0.04 + 0.01;
                } else { // Foreground / Glowing stars
                    size = Math.random() * 2.0 + 1.5;
                    speed = Math.random() * 0.3 + 0.15;
                    opacity = Math.random() * 0.8 + 0.4;
                    twinkleSpeed = Math.random() * 0.06 + 0.02;
                }

                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: size,
                    speed: speed,
                    opacity: opacity,
                    pulse: Math.random() * Math.PI * 2,
                    twinkleSpeed: twinkleSpeed,
                    layer: layer,
                    color: Math.random() < 0.7 ? 'rgba(224, 231, 255, ' : (Math.random() < 0.5 ? 'rgba(0, 212, 255, ' : 'rgba(139, 92, 246, ')
                });
            }
        }

        function draw() {
            // Dark base background
            ctx.fillStyle = '#06060f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Nebulas (Cyan + Purple overlay)
            const grad1 = ctx.createRadialGradient(
                canvas.width * 0.15, canvas.height * 0.2, 50,
                canvas.width * 0.25, canvas.height * 0.2, canvas.width * 0.65
            );
            grad1.addColorStop(0, 'rgba(0, 212, 255, 0.04)');
            grad1.addColorStop(0.5, 'rgba(139, 92, 246, 0.02)');
            grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');

            const grad2 = ctx.createRadialGradient(
                canvas.width * 0.85, canvas.height * 0.75, 50,
                canvas.width * 0.75, canvas.height * 0.8, canvas.width * 0.55
            );
            grad2.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
            grad2.addColorStop(0.5, 'rgba(0, 212, 255, 0.02)');
            grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad1;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = grad2;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Stars
            for (const star of stars) {
                star.pulse += star.twinkleSpeed;
                const alpha = star.opacity * (0.5 + 0.5 * Math.sin(star.pulse));

                // Core star
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `${star.color}${alpha})`;
                ctx.fill();

                // Lens flare / Cross glow for foreground glowing stars (layer 3)
                if (star.layer === 3 && alpha > 0.7) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha - 0.7) * 0.5})`;
                    ctx.lineWidth = 0.5;

                    // Horizontal flare
                    ctx.beginPath();
                    ctx.moveTo(star.x - star.size * 4, star.y);
                    ctx.lineTo(star.x + star.size * 4, star.y);
                    ctx.stroke();

                    // Vertical flare
                    ctx.beginPath();
                    ctx.moveTo(star.x, star.y - star.size * 4);
                    ctx.lineTo(star.x, star.y + star.size * 4);
                    ctx.stroke();
                }

                // Drift downwards
                star.y += star.speed;
                if (star.y > canvas.height) {
                    star.y = 0;
                    star.x = Math.random() * canvas.width;
                }
            }

            requestAnimationFrame(draw);
        }

        window.addEventListener('resize', resize);
        resize();
        draw();
    }

    // ═══════════════════════════════════════
    // CNEB CURRICULUM INTEGRATION & IMPORT/EXPORT
    // ═══════════════════════════════════════

    let curriculumData = null;

    async function loadCurriculum() {
        try {
            const response = await fetch('data/competencias.json');
            curriculumData = await response.json();

            populateEnfoques();

            // Sync with existing selection if any
            if (DOM.inputArea.value) {
                handleAreaChange();
            }

            console.log('CNEB curriculum database loaded');
        } catch (e) {
            console.warn('Could not load CNEB curriculum json:', e);
        }
    }

    function populateEnfoques() {
        if (!curriculumData || !curriculumData.enfoques_transversales) return;

        const optionsHtml = '<option value="">-- Seleccionar Enfoque Oficial --</option>' +
            curriculumData.enfoques_transversales.map(e => `<option value="${escHTML(e)}">${escHTML(e)}</option>`).join('');

        DOM.selectCnebEnfoque.innerHTML = optionsHtml;
        DOM.selectCnebEnfoque2.innerHTML = optionsHtml;
    }

    function handleAreaChange() {
        const area = DOM.inputArea.value;

        if (!curriculumData || !curriculumData.areas || !curriculumData.areas[area]) {
            DOM.selectCnebCompetencia.classList.add('hidden');
            DOM.selectCnebCapacidad.classList.add('hidden');
            return;
        }

        const areaInfo = curriculumData.areas[area];

        DOM.selectCnebCompetencia.innerHTML = '<option value="">-- Seleccionar Competencia Oficial --</option>' +
            areaInfo.competencias.map((c, i) => `<option value="${i}">${escHTML(c.nombre)}</option>`).join('');

        DOM.selectCnebCompetencia.classList.remove('hidden');
        DOM.selectCnebCapacidad.classList.add('hidden');
    }

    function handleCompetenciaChange() {
        const area = DOM.inputArea.value;
        const compIdx = DOM.selectCnebCompetencia.value;

        if (compIdx === '' || !curriculumData || !curriculumData.areas || !curriculumData.areas[area]) {
            DOM.selectCnebCapacidad.classList.add('hidden');
            return;
        }

        const comp = curriculumData.areas[area].competencias[compIdx];

        // Fill textarea
        DOM.inputCompetencia.value = comp.nombre;

        // Populate capacities select
        DOM.selectCnebCapacidad.innerHTML = '<option value="">-- Seleccionar Capacidad Oficial --</option>' +
            comp.capacidades.map(c => `<option value="${escHTML(c)}">${escHTML(c)}</option>`).join('');

        DOM.selectCnebCapacidad.classList.remove('hidden');
        DOM.form.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function handleCapacidadChange() {
        const capValue = DOM.selectCnebCapacidad.value;
        if (!capValue) return;

        const currentText = DOM.inputCapacidad.value.trim();
        if (currentText) {
            if (!currentText.includes(capValue)) {
                DOM.inputCapacidad.value = currentText + '\n• ' + capValue;
            }
        } else {
            DOM.inputCapacidad.value = '• ' + capValue;
        }
        DOM.form.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function handleEnfoqueChange() {
        const enfoqueValue = DOM.selectCnebEnfoque.value;
        if (!enfoqueValue) return;
        DOM.inputEnfoque.value = enfoqueValue;
        DOM.form.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function handleEnfoque2Change() {
        const enfoqueValue = DOM.selectCnebEnfoque2.value;
        if (!enfoqueValue) return;
        DOM.inputEnfoque2.value = enfoqueValue;
        DOM.form.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function handleExportJson() {
        if (!AppState.currentSession) {
            Toast.warning('No hay sesión para exportar');
            return;
        }
        saveCurrentState();
        Storage.exportAsJSON(AppState.currentSession);
        Toast.success('Sesión exportada correctamente');
    }

    async function handleImportJson(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const session = await Storage.importFromJSON(file);
            if (!session.id || !session.template || !session.metadata) {
                throw new Error('El archivo no tiene la estructura de Space Lab');
            }

            Storage.saveSession(session);
            loadSession(session.id);
            renderSavedList();

            Toast.success('Sesión importada correctamente');
        } catch (err) {
            Toast.error('Error al importar sesión: ' + err.message);
        } finally {
            DOM.inputImportFile.value = '';
        }
    }

    // ═══════════════════════════════════════
    // PROFILE DEFAULTS & LOGO STORAGE GALLERY
    // ═══════════════════════════════════════

    async function loadProfileDefaults() {
        try {
            const profile = await SupabaseClient.getUserProfile();
            if (profile) {
                if (profile.institucion) DOM.inputInstitucion.value = profile.institucion;
                if (profile.dre) DOM.inputDre.value = profile.dre;
                if (profile.ugel) DOM.inputUgel.value = profile.ugel;
                if (profile.docente) DOM.inputDocente.value = profile.docente;
                if (profile.director) DOM.inputDirector.value = profile.director;
                if (profile.nivel) DOM.inputNivel.value = profile.nivel;
                console.log('Predeterminados de perfil cargados');
            }
        } catch (e) {
            console.warn('[Profile] Error al cargar predeterminados:', e);
        }
    }

    async function handleSaveDefaults() {
        const user = await SupabaseClient.getCurrentUser();
        if (!user) {
            Toast.warning('Debes iniciar sesión para guardar tus datos predeterminados en la nube');
            return;
        }

        Loader.show('Guardando datos predeterminados...');
        try {
            const data = {
                institucion: DOM.inputInstitucion.value.trim(),
                dre: DOM.inputDre.value.trim(),
                ugel: DOM.inputUgel.value.trim(),
                docente: DOM.inputDocente.value.trim(),
                director: DOM.inputDirector.value.trim(),
                nivel: DOM.inputNivel.value
            };

            await SupabaseClient.updateUserProfile(data);
            Loader.hide();
            Toast.success('Datos predeterminados guardados en la nube');
        } catch (e) {
            Loader.hide();
            Toast.error('Error al guardar predeterminados: ' + e.message);
        }
    }

    async function loadLogosGallery() {
        const user = await SupabaseClient.getCurrentUser();
        if (!user) {
            DOM.logosContainer.innerHTML = `<span style="grid-column: span 4; font-size: 0.7rem; text-align: center; color: var(--text-muted); padding: 4px;">Inicia sesión para ver logos</span>`;
            return;
        }

        DOM.logosContainer.innerHTML = `<span style="grid-column: span 4; font-size: 0.7rem; text-align: center; color: var(--text-muted); padding: 4px;">Cargando...</span>`;
        try {
            const logos = await SupabaseClient.listLogos();
            if (logos.length === 0) {
                DOM.logosContainer.innerHTML = `<span style="grid-column: span 4; font-size: 0.7rem; text-align: center; color: var(--text-muted); padding: 4px;">No hay logos subidos</span>`;
                return;
            }

            DOM.logosContainer.innerHTML = logos.map(logo => `
                <div class="logo-gallery-item" draggable="true" data-url="${logo.url}" style="position: relative; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 6px; padding: 4px; cursor: grab; transition: all var(--transition-fast);" title="Haz clic para aplicar o arrastra al documento">
                    <img src="${logo.url}" alt="${logo.name}" style="max-width: 100%; max-height: 100%; object-fit: contain; pointer-events: none;">
                </div>
            `).join('');

            // Bind events for gallery items
            DOM.logosContainer.querySelectorAll('.logo-gallery-item').forEach(item => {
                item.addEventListener('click', () => {
                    applyLogoToDocument(item.dataset.url);
                });

                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', item.dataset.url);
                    item.style.opacity = '0.5';
                });

                item.addEventListener('dragend', () => {
                    item.style.opacity = '1';
                });
            });

        } catch (e) {
            console.error('[Gallery] Error loading logos:', e);
            DOM.logosContainer.innerHTML = `<span style="grid-column: span 4; font-size: 0.7rem; text-align: center; color: var(--danger); padding: 4px;">Error al cargar</span>`;
        }
    }

    async function handleUploadLogo(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            validateLogoFile(file);
        } catch (error) {
            Toast.warning(error.message);
            return;
        }

        Loader.show('Comprimiendo y subiendo logo...');
        try {
            const compressedFile = await compressImage(file, 800, 800, 0.8);
            validateLogoFile(compressedFile);
            const publicUrl = await SupabaseClient.uploadLogo(compressedFile);
            Loader.hide();
            Toast.success('Logo subido correctamente');

            // Reload the gallery
            await loadLogosGallery();

            // Ask the user if they want to apply the logo they just uploaded
            const confirmed = await ConfirmDialog.show({
                title: '¿Aplicar logo?',
                message: '¿Quieres aplicar el logo subido al encabezado del documento actual?',
                confirmText: 'Aplicar'
            });
            if (confirmed) {
                applyLogoToDocument(publicUrl);
            }
        } catch (err) {
            Loader.hide();
            Toast.error('Error al subir logo: ' + err.message);
        } finally {
            DOM.inputUploadLogo.value = ''; // Reset file input
        }
    }

    const {
        applyDesignStyles,
        applyLogoToDocument,
        addLogoToHeader,
        openLogoEditor,
        initLogoEditorListeners,
        setupDragAndDrop
    } = window.SpaceLabDesignController.create({
        state: AppState,
        dom: DOM,
        saveCurrentState,
        getOrCreateResizeHandle: (...args) => getOrCreateResizeHandle(...args),
        hideResizeHandle: (...args) => hideResizeHandle(...args),
        openLogosGalleryModal: (...args) => openLogosGalleryModal(...args),
        swapLogos: (...args) => swapLogos(...args)
    });

    function handleInsertRow() {
        let cell = AppState.activeTableCell;
        if (!cell) {
            const activeEl = document.activeElement;
            if (activeEl && DOM.sessionSheet.contains(activeEl)) {
                cell = activeEl.closest('td, th');
            }
        }

        if (!cell) {
            Toast.warning("Por favor, selecciona una celda en una tabla editable.");
            return;
        }

        const table = cell.closest('table');
        if (!table) {
            Toast.warning("Esta celda no pertenece a ninguna tabla.");
            return;
        }

        // Only allow dynamic rows in .content-table, .eval-table, and .momentos-table
        const allowedClasses = ['content-table', 'eval-table', 'momentos-table'];
        const isAllowed = allowedClasses.some(cls => table.classList.contains(cls));
        if (!isAllowed) {
            Toast.warning("Esta acción está deshabilitada en tablas de encabezados.");
            return;
        }

        const activeRow = cell.closest('tr');
        if (!activeRow) {
            Toast.warning("No se pudo identificar la fila.");
            return;
        }

        // Avoid modifying headers
        if (activeRow.closest('thead') || (activeRow.querySelectorAll('th').length > 0 && !activeRow.querySelectorAll('td').length)) {
            Toast.warning("No se pueden modificar las filas de cabecera.");
            return;
        }

        // Clone active row
        const clone = activeRow.cloneNode(true);

        // Reset text content of cells & ensure they are contenteditable
        clone.querySelectorAll('td, th').forEach(el => {
            el.innerHTML = '';
            el.setAttribute('contenteditable', 'true');
        });

        // Insert clone after active row
        activeRow.after(clone);

        // Ensure newly created cells are active and editable
        enforceEditMode();

        // Focus the first cell of the inserted row
        const nextCell = clone.querySelector('[contenteditable="true"]') || clone.querySelector('td');
        if (nextCell) {
            nextCell.focus();
            AppState.activeTableCell = nextCell;
        }

        saveCurrentState();
        Toast.success("Fila insertada correctamente");
    }

    function handleDeleteRow() {
        let cell = AppState.activeTableCell;
        if (!cell) {
            const activeEl = document.activeElement;
            if (activeEl && DOM.sessionSheet.contains(activeEl)) {
                cell = activeEl.closest('td, th');
            }
        }

        if (!cell) {
            Toast.warning("Por favor, selecciona una celda en la fila que deseas eliminar.");
            return;
        }

        const table = cell.closest('table');
        if (!table) {
            Toast.warning("Esta celda no pertenece a ninguna tabla.");
            return;
        }

        const allowedClasses = ['content-table', 'eval-table', 'momentos-table'];
        const isAllowed = allowedClasses.some(cls => table.classList.contains(cls));
        if (!isAllowed) {
            Toast.warning("Esta acción está deshabilitada en tablas de encabezados.");
            return;
        }

        const activeRow = cell.closest('tr');
        if (!activeRow) {
            Toast.warning("No se pudo identificar la fila.");
            return;
        }

        // Avoid modifying headers
        if (activeRow.closest('thead') || (activeRow.querySelectorAll('th').length > 0 && !activeRow.querySelectorAll('td').length)) {
            Toast.warning("No se pueden eliminar las filas de cabecera.");
            return;
        }

        const tbody = activeRow.parentNode;
        if (!tbody) return;

        // Find all non-header rows in the same tbody
        const allBodyRows = Array.from(tbody.querySelectorAll('tr')).filter(r => {
            return !r.closest('thead') && !(r.querySelectorAll('th').length > 0 && !r.querySelectorAll('td').length);
        });

        if (allBodyRows.length <= 1) {
            Toast.warning("No se puede eliminar la única fila restante de la tabla.");
            return;
        }

        // Determine next cell focus
        const activeIdx = allBodyRows.indexOf(activeRow);
        let siblingToFocus = null;
        if (activeIdx > 0) {
            siblingToFocus = allBodyRows[activeIdx - 1];
        } else if (activeIdx < allBodyRows.length - 1) {
            siblingToFocus = allBodyRows[activeIdx + 1];
        }

        activeRow.remove();

        if (siblingToFocus) {
            const nextCell = siblingToFocus.querySelector('[contenteditable="true"]') || siblingToFocus.querySelector('td');
            if (nextCell) {
                nextCell.focus();
                AppState.activeTableCell = nextCell;
            }
        } else {
            AppState.activeTableCell = null;
        }

        saveCurrentState();
        Toast.success("Fila eliminada correctamente");
    }

    let sheetResizeObserver = null;

    function applyZoom() {
        const sheet = DOM.sessionSheet;
        if (!sheet) return;

        // Firefox compatibility fallback:
        // Firefox does not support css zoom. We check if zoom is supported in style.
        if ('zoom' in sheet.style) {
            sheet.style.zoom = AppState.zoomScale;
            sheet.style.transform = '';
            sheet.style.transformOrigin = '';
            const parent = sheet.parentElement;
            if (parent) parent.style.height = '';
        } else {
            // Firefox and others without zoom support
            sheet.style.transform = `scale(${AppState.zoomScale})`;
            sheet.style.transformOrigin = 'top center';
            const parent = sheet.parentElement;
            if (parent) {
                // Adjust height of the parent container so scrollbar and footer elements render properly
                parent.style.height = `${sheet.scrollHeight * AppState.zoomScale + 40}px`;

                // Configurar ResizeObserver dinámico para actualizar la altura cuando cambie el contenido del lienzo
                if (!sheetResizeObserver) {
                    sheetResizeObserver = new ResizeObserver(() => {
                        parent.style.height = `${sheet.scrollHeight * AppState.zoomScale + 40}px`;
                    });
                    sheetResizeObserver.observe(sheet);
                }
            }
        }

        // Show temporary zoom floating percentage indicator
        showZoomIndicator();
    }

    let zoomIndicatorTimeout = null;
    function showZoomIndicator() {
        let indicator = document.getElementById('zoom-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'zoom-indicator';
            indicator.style.position = 'fixed';
            indicator.style.bottom = '20px';
            indicator.style.right = '20px';
            indicator.style.background = 'rgba(12, 12, 29, 0.85)';
            indicator.style.backdropFilter = 'blur(8px)';
            indicator.style.border = '1px solid var(--border-accent)';
            indicator.style.borderRadius = 'var(--radius-sm)';
            indicator.style.padding = '8px 12px';
            indicator.style.color = 'var(--text-accent)';
            indicator.style.fontFamily = 'var(--font-mono)';
            indicator.style.fontSize = '0.8rem';
            indicator.style.fontWeight = 'bold';
            indicator.style.zIndex = '9999';
            indicator.style.pointerEvents = 'none';
            indicator.style.boxShadow = 'var(--shadow-md)';
            indicator.style.transition = 'opacity 0.2s ease';
            document.body.appendChild(indicator);
        }

        indicator.textContent = `Zoom: ${Math.round(AppState.zoomScale * 100)}%`;
        indicator.style.opacity = '1';

        clearTimeout(zoomIndicatorTimeout);
        zoomIndicatorTimeout = setTimeout(() => {
            indicator.style.opacity = '0';
        }, 1200);
    }

    // ═══════════════════════════════════════
    // WORD-STYLE EDITING & LOGO GALERIA FEATURES
    // ═══════════════════════════════════════

    let selectedGalleryLogoUrl = null;

    function swapLogos() {
        if (!AppState.activeLogoTarget) return;
        const target = document.getElementById(AppState.activeLogoTarget);
        if (!target) return;

        const item = target.closest('.official-logo-item');
        if (!item) return;

        const next = item.nextElementSibling;
        const parent = item.parentElement;

        if (next && next.classList.contains('official-logo-item')) {
            // Swap item with next element
            parent.insertBefore(next, item);
        } else {
            // Cycle back to the start (before the first item)
            const first = parent.querySelector('.official-logo-item');
            if (first && first !== item) {
                parent.insertBefore(item, first);
            }
        }

        // Save state
        saveCurrentState();

        // Reposition popover and resize handle
        setTimeout(() => {
            openLogoEditor(target);
        }, 100);
        Toast.success('Posición de logo cambiada');
    }

    function getOrCreateResizeHandle() {
        let handle = document.getElementById('logo-resize-handle');
        if (!handle) {
            handle = document.createElement('div');
            handle.id = 'logo-resize-handle';
            handle.className = 'logo-resize-handle no-print';
            document.body.appendChild(handle);
            handle.addEventListener('mousedown', initResizeDrag);
        }
        return handle;
    }

    function hideResizeHandle() {
        const handle = document.getElementById('logo-resize-handle');
        if (handle) {
            handle.style.display = 'none';
        }
    }

    function initResizeDrag(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!AppState.activeLogoTarget) return;
        const target = document.getElementById(AppState.activeLogoTarget);
        if (!target) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const rect = target.getBoundingClientRect();
        const startWidth = rect.width;
        const startHeight = rect.height;
        const aspectRatio = startWidth / startHeight;

        const handle = document.getElementById('logo-resize-handle');
        const popover = document.getElementById('logo-editor-popover');
        const widthSlider = document.getElementById('logo-editor-width-slider');
        const widthVal = document.getElementById('logo-editor-width-val');
        const heightSlider = document.getElementById('logo-editor-height-slider');
        const heightVal = document.getElementById('logo-editor-height-val');
        const heightContainer = document.getElementById('logo-editor-height-container');
        const fitContainer = document.getElementById('logo-editor-fit-container');
        const aspectRatioCheckbox = document.getElementById('logo-editor-aspect-ratio');

        document.body.style.cursor = 'se-resize';
        document.body.style.userSelect = 'none';

        function onMouseMove(moveEvt) {
            const zoom = AppState.zoomScale || 1.0;
            const deltaX = (moveEvt.clientX - startX) / zoom;
            const deltaY = (moveEvt.clientY - startY) / zoom;

            let newWidth = Math.max(30, Math.min(300, startWidth + deltaX));
            let newHeight;

            const keepAspect = !moveEvt.ctrlKey;

            if (keepAspect) {
                newHeight = newWidth / aspectRatio;
                target.style.height = 'auto';
                target.style.width = `${newWidth}px`;
                target.style.maxWidth = 'none';
                target.style.maxHeight = 'none';

                aspectRatioCheckbox.checked = true;
                heightContainer.classList.add('hidden');
                heightContainer.style.display = 'none';
                fitContainer.classList.add('hidden');
                fitContainer.style.display = 'none';
            } else {
                newHeight = Math.max(30, Math.min(300, startHeight + deltaY));
                target.style.width = `${newWidth}px`;
                target.style.height = `${newHeight}px`;
                target.style.maxWidth = 'none';
                target.style.maxHeight = 'none';

                aspectRatioCheckbox.checked = false;
                heightContainer.classList.remove('hidden');
                heightContainer.style.display = 'flex';
                fitContainer.classList.remove('hidden');
                fitContainer.style.display = 'flex';

                heightSlider.value = Math.round(newHeight);
                heightVal.textContent = `${Math.round(newHeight)}px`;
            }

            widthSlider.value = Math.round(newWidth);
            widthVal.textContent = `${Math.round(newWidth)}px`;

            const newRect = target.getBoundingClientRect();
            handle.style.top = `${window.scrollY + newRect.bottom - 5}px`;
            handle.style.left = `${window.scrollX + newRect.right - 5}px`;

            if (popover && !popover.classList.contains('hidden')) {
                let popTop = window.scrollY + newRect.bottom + 10;
                let popLeft = window.scrollX + newRect.left + (newRect.width / 2) - (popover.offsetWidth / 2);
                if (popLeft < 10) popLeft = 10;
                if (popLeft + popover.offsetWidth > window.innerWidth - 10) {
                    popLeft = window.innerWidth - popover.offsetWidth - 10;
                }
                popover.style.top = `${popTop}px`;
                popover.style.left = `${popLeft}px`;
            }
        }

        function onMouseUp() {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            saveCurrentState();
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    async function openLogosGalleryModal() {
        const modal = document.getElementById('logos-gallery-modal');
        if (!modal) return;

        const posSelector = document.getElementById('modal-logo-position-selector');
        if (posSelector) posSelector.classList.add('hidden');
        selectedGalleryLogoUrl = null;

        modal.classList.remove('hidden');
        await refreshModalLogosList();
    }

    async function refreshModalLogosList() {
        const container = document.getElementById('modal-logos-container');
        if (!container) return;

        const user = await SupabaseClient.getCurrentUser();
        if (!user) {
            container.innerHTML = `<span style="grid-column: span 4; font-size: 0.8rem; text-align: center; color: #a1a1aa; padding: 10px;">Inicia sesión para ver tus logos subidos</span>`;
            return;
        }

        container.innerHTML = `<span style="grid-column: span 4; font-size: 0.8rem; text-align: center; color: #a1a1aa; padding: 10px;">Cargando logos de Supabase...</span>`;
        try {
            const logos = await SupabaseClient.listLogos();
            if (logos.length === 0) {
                container.innerHTML = `<span style="grid-column: span 4; font-size: 0.8rem; text-align: center; color: #a1a1aa; padding: 10px;">No tienes logos subidos previamente</span>`;
                return;
            }

            container.innerHTML = logos.map(logo => `
                <div class="modal-logo-item" data-url="${logo.url}" style="position: relative; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 6px; cursor: pointer; transition: all 0.2s;" title="Clic para seleccionar">
                    <img src="${logo.url}" alt="${logo.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
            `).join('');

            container.querySelectorAll('.modal-logo-item').forEach(item => {
                item.addEventListener('click', () => {
                    const url = item.dataset.url;
                    handleSelectModalLogo(url);
                });
            });
        } catch (e) {
            console.error('[Modal Gallery] Error loading logos:', e);
            container.innerHTML = `<span style="grid-column: span 4; font-size: 0.8rem; text-align: center; color: var(--danger); padding: 10px;">Error al cargar logos</span>`;
        }
    }

    function handleSelectModalLogo(url) {
        if (AppState.activeLogoTarget) {
            applyLogoToDocument(url, AppState.activeLogoTarget);
        } else {
            addLogoToHeader(url);
        }
        document.getElementById('logos-gallery-modal').classList.add('hidden');
    }

    async function handleModalLogoUpload(file) {
        const user = await SupabaseClient.getCurrentUser();
        if (!user) {
            Toast.warning('Debes iniciar sesión para subir logos a la galería.');
            if (window.AuthUi && typeof window.AuthUi.openRegister === 'function') {
                window.AuthUi.openRegister();
            }
            return;
        }

        try {
            validateLogoFile(file);
        } catch (error) {
            Toast.warning(error.message);
            return;
        }

        Loader.show('Comprimiendo y subiendo logo...');
        try {
            const compressedFile = await compressImage(file, 800, 800, 0.8);
            validateLogoFile(compressedFile);
            const publicUrl = await SupabaseClient.uploadLogo(compressedFile);
            Toast.success('Logo subido correctamente');

            await refreshModalLogosList();
            await loadLogosGallery();

            handleSelectModalLogo(publicUrl);
        } catch (err) {
            Toast.error('Error al subir logo: ' + err.message);
        } finally {
            Loader.hide();
            const modalFileInput = document.getElementById('input-modal-upload-logo');
            if (modalFileInput) modalFileInput.value = '';
        }
    }

    function initContextMenu() {
        const menu = document.getElementById('editor-context-menu');
        if (!menu) return;

        // Prevent selection from being lost when clicking inside the context menu
        menu.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

        DOM.sessionSheet.addEventListener('contextmenu', (e) => {
            if (AppState.previewMode) return;

            e.preventDefault();
            e.stopPropagation();

            const isLogo = e.target.classList.contains('official-logo-img');
            const itemEditLogo = document.getElementById('menu-item-edit-logo');
            const itemSwapLogos = document.getElementById('menu-item-swap-logos');

            if (isLogo) {
                AppState.activeLogoTarget = e.target.id;
                if (itemEditLogo) itemEditLogo.classList.remove('hidden');
                if (itemSwapLogos) itemSwapLogos.classList.remove('hidden');
            } else {
                if (itemEditLogo) itemEditLogo.classList.add('hidden');
                if (itemSwapLogos) itemSwapLogos.classList.add('hidden');
            }

            menu.style.display = 'block';
            menu.classList.remove('hidden');

            let top = window.scrollY + e.clientY;
            let left = window.scrollX + e.clientX;

            if (left + menu.offsetWidth > window.innerWidth - 10) {
                left = window.innerWidth - menu.offsetWidth - 10;
            }
            if (e.clientY + menu.offsetHeight > window.innerHeight - 10) {
                top = window.scrollY + e.clientY - menu.offsetHeight;
            }

            menu.style.top = `${top}px`;
            menu.style.left = `${left}px`;
        });

        window.addEventListener('click', (e) => {
            if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target)) {
                menu.style.display = 'none';
                menu.classList.add('hidden');
            }
        });

        document.getElementById('menu-item-bold').addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('bold', false, null);
            saveCurrentState();
            menu.style.display = 'none';
            menu.classList.add('hidden');
        });

        document.getElementById('menu-item-italic').addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('italic', false, null);
            saveCurrentState();
            menu.style.display = 'none';
            menu.classList.add('hidden');
        });

        document.getElementById('menu-item-underline').addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('underline', false, null);
            saveCurrentState();
            menu.style.display = 'none';
            menu.classList.add('hidden');
        });

        document.getElementById('menu-item-cut').addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('cut');
            saveCurrentState();
            menu.style.display = 'none';
            menu.classList.add('hidden');
        });

        document.getElementById('menu-item-copy').addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('copy');
            menu.style.display = 'none';
            menu.classList.add('hidden');
        });

        document.getElementById('menu-item-paste').addEventListener('click', async (e) => {
            e.preventDefault();
            menu.style.display = 'none';
            menu.classList.add('hidden');
            try {
                const text = await navigator.clipboard.readText();
                document.execCommand('insertText', false, text);
                saveCurrentState();
            } catch (err) {
                Toast.info('Usa Ctrl+V para pegar contenido');
            }
        });

        document.getElementById('menu-item-ai-improve').addEventListener('click', (e) => {
            e.preventDefault();
            handleAiImproveText('improve');
            menu.style.display = 'none';
            menu.classList.add('hidden');
        });

        document.getElementById('menu-item-ai-rubrica').addEventListener('click', (e) => {
            e.preventDefault();
            handleAiRubrica();
            menu.style.display = 'none';
            menu.classList.add('hidden');
        });

        document.getElementById('menu-item-edit-logo').addEventListener('click', (e) => {
            e.preventDefault();
            if (AppState.activeLogoTarget) {
                const logo = document.getElementById(AppState.activeLogoTarget);
                if (logo) openLogoEditor(logo);
            }
            menu.style.display = 'none';
            menu.classList.add('hidden');
        });

        document.getElementById('menu-item-swap-logos').addEventListener('click', (e) => {
            e.preventDefault();
            swapLogos();
            menu.style.display = 'none';
            menu.classList.add('hidden');
        });
    }

    function initLogosGalleryModal() {
        const btnCloseModal = document.getElementById('btn-close-gallery-modal');
        const btnCloseModal2 = document.getElementById('btn-modal-gallery-close');
        const modalDropzone = document.getElementById('modal-logo-dropzone');
        const modalFileInput = document.getElementById('input-modal-upload-logo');

        [btnCloseModal, btnCloseModal2].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    document.getElementById('logos-gallery-modal').classList.add('hidden');
                });
            }
        });

        if (modalDropzone) {
            modalDropzone.addEventListener('click', () => {
                modalFileInput.click();
            });
            modalDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                modalDropzone.style.borderColor = '#00d2ff';
                modalDropzone.style.background = 'rgba(0, 210, 255, 0.05)';
            });
            modalDropzone.addEventListener('dragleave', () => {
                modalDropzone.style.borderColor = 'rgba(0, 210, 255, 0.2)';
                modalDropzone.style.background = 'rgba(0, 210, 255, 0.02)';
            });
            modalDropzone.addEventListener('drop', async (e) => {
                e.preventDefault();
                modalDropzone.style.borderColor = 'rgba(0, 210, 255, 0.2)';
                modalDropzone.style.background = 'rgba(0, 210, 255, 0.02)';
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    await handleModalLogoUpload(e.dataTransfer.files[0]);
                }
            });
        }
        if (modalFileInput) {
            modalFileInput.addEventListener('change', async (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    await handleModalLogoUpload(e.target.files[0]);
                }
            });
        }
    }

    // Expose styling API globally for agentic chatbot features
    window.AppDesign = {
        apply: (design) => {
            if (typeof applyDesignStyles === 'function') {
                applyDesignStyles(design);
            }
        },
        save: () => {
            if (typeof saveCurrentState === 'function') {
                saveCurrentState();
            }
        },
        getCurrent: () => {
            if (!DOM.designColor) return null;
            return DocumentPresentation.normalize({
                preset: DOM.designPreset?.value,
                themeColor: DOM.designColor.value,
                accentColor: DOM.designAccentColor?.value,
                fontFamily: DOM.designFontFamily?.value,
                fontSize: DOM.designFontSize.value,
                padding: DOM.designPadding.value,
                lineHeight: DOM.designLineHeight.value,
                headerBg: DOM.designHeaderBg.value
            });
        }
    };

    // ═══════════════════════════════════════
    // BOOT
    // ═══════════════════════════════════════

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
