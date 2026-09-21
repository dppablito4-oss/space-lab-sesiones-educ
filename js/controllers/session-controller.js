/** Session persistence, history, and lifecycle controller. */
window.SpaceLabSessionController = (() => {
    'use strict';

    function create(dependencies) {
        const {
            state: AppState,
            dom: DOM,
            escapeHtml: escHTML,
            formatDate,
            getFormData,
            populateForm,
            renderSession,
            applyDesignStyles,
            applyZoom,
            enforceEditMode,
            checkTimeBalance,
            loadProfileDefaults
        } = dependencies;

        function handleSave() {
            if (!AppState.currentSession) {
                Toast.warning('No hay sesión para guardar');
                return;
            }
        
            saveCurrentState();
        
            // Also persist to the sessions list
            const session = {
                ...AppState.currentSession,
                htmlContent: window.SpaceLabSanitizer
                    ? SpaceLabSanitizer.sanitizeSessionHTML(DOM.sessionSheet.innerHTML)
                    : DOM.sessionSheet.textContent
            };
        
            if (Storage.saveSession(session)) {
                Toast.success('Sesión guardada correctamente');
                renderSavedList();
            } else {
                Toast.error('Error al guardar la sesión');
            }
        }
        
        function handleSaveAs() {
            if (!AppState.currentSession) {
                Toast.warning('No hay sesión activa para guardar como copia');
                return;
            }
        
            // Primero guardar la sesión actual para no perder cambios de la sesión activa
            saveCurrentState();
        
            const currentTitulo = AppState.currentSession.metadata?.titulo || AppState.currentSession.titulo || 'Sin título';
            const nuevoTitulo = prompt("Introduce el título para la nueva copia de la sesión:", currentTitulo + " - Copia");
        
            if (nuevoTitulo === null) {
                // Cancelado por el usuario
                return;
            }
        
            const tituloFinal = nuevoTitulo.trim();
            if (!tituloFinal) {
                Toast.warning("El título no puede estar vacío.");
                return;
            }
        
            // Crear clon profundo del objeto de sesión actual
            const clon = JSON.parse(JSON.stringify(AppState.currentSession));
            clon.id = Storage.generateId();
            clon.titulo = tituloFinal;
            if (clon.metadata) {
                clon.metadata.titulo = tituloFinal;
            }
            clon.lastSaved = new Date().toISOString();
            clon.created_at = new Date().toISOString();
            clon.synced = false; // Requiere resincronizar en Supabase
        
            // Guardar la nueva sesión en Storage local (que sincroniza a la nube si está conectado)
            if (Storage.saveSession(clon)) {
                // Establecer la nueva sesión como la activa
                AppState.currentSession = clon;
                Storage.setCurrentSession(clon);
                populateForm(clon);
        
                // Actualizar inputs del formulario de metadatos (si hay uno en pantalla para el título)
                if (DOM.inputTitulo) DOM.inputTitulo.value = tituloFinal;
        
                // Regenerar visualmente con el nuevo título
                renderSession(clon);
        
                renderSavedList();
                Toast.success('Copia de sesión creada correctamente');
            } else {
                Toast.error('Error al crear la copia de la sesión');
            }
        }
        
        let isUndoingOrRedoing = false;
        
        function saveCurrentState() {
            if (!AppState.currentSession) return;
            if (isUndoingOrRedoing) return;
        
            const currentHtml = window.SpaceLabSanitizer
                ? SpaceLabSanitizer.sanitizeSessionHTML(DOM.sessionSheet.innerHTML)
                : DOM.sessionSheet.textContent;
            const previousState = AppState.currentSession.htmlContent || '';
        
            // If the HTML changed, push the previous state to the undo stack
            if (currentHtml && currentHtml !== previousState) {
                AppState.undoStack.push({
                    html: previousState,
                    metadata: JSON.parse(JSON.stringify(AppState.currentSession.metadata || {}))
                });
                if (AppState.undoStack.length > 50) {
                    AppState.undoStack.shift();
                }
                AppState.redoStack = []; // Clear redo stack on new action
            }
        
            AppState.currentSession.htmlContent = currentHtml;
            AppState.currentSession.lastSaved = new Date().toISOString();
        
            Storage.setCurrentSession(AppState.currentSession);
        
            if (Storage.getSession(AppState.currentSession.id)) {
                Storage.saveSession(AppState.currentSession);
                renderSavedList();
            }
        }
        
        function undo() {
            if (!AppState.undoStack || AppState.undoStack.length === 0) {
                Toast.warning('No hay más acciones para deshacer.');
                return;
            }
        
            isUndoingOrRedoing = true;
            const currentHtml = DOM.sessionSheet.innerHTML;
            AppState.redoStack.push({
                html: currentHtml,
                metadata: JSON.parse(JSON.stringify(AppState.currentSession.metadata || {}))
            });
            if (AppState.redoStack.length > 50) {
                AppState.redoStack.shift();
            }
        
            const prevState = AppState.undoStack.pop();
            DOM.sessionSheet.innerHTML = window.SpaceLabSanitizer
                ? SpaceLabSanitizer.sanitizeSessionHTML(prevState.html)
                : '';
        
            AppState.currentSession.metadata = prevState.metadata;
            populateForm(AppState.currentSession);
        
            AppState.currentSession.htmlContent = prevState.html;
            Storage.setCurrentSession(AppState.currentSession);
            if (Storage.getSession(AppState.currentSession.id)) {
                Storage.saveSession(AppState.currentSession);
                renderSavedList();
            }
        
            // Hide resize handle if active logo target is modified
            const resizeHandle = document.getElementById('logo-resize-handle');
            if (resizeHandle) resizeHandle.style.display = 'none';
        
            checkTimeBalance();
            isUndoingOrRedoing = false;
            Toast.success('Deshecho');
        }
        
        function redo() {
            if (!AppState.redoStack || AppState.redoStack.length === 0) {
                Toast.warning('No hay más acciones para rehacer.');
                return;
            }
        
            isUndoingOrRedoing = true;
            const currentHtml = DOM.sessionSheet.innerHTML;
            AppState.undoStack.push({
                html: currentHtml,
                metadata: JSON.parse(JSON.stringify(AppState.currentSession.metadata || {}))
            });
            if (AppState.undoStack.length > 50) {
                AppState.undoStack.shift();
            }
        
            const nextState = AppState.redoStack.pop();
            DOM.sessionSheet.innerHTML = window.SpaceLabSanitizer
                ? SpaceLabSanitizer.sanitizeSessionHTML(nextState.html)
                : '';
        
            AppState.currentSession.metadata = nextState.metadata;
            populateForm(AppState.currentSession);
        
            AppState.currentSession.htmlContent = nextState.html;
            Storage.setCurrentSession(AppState.currentSession);
            if (Storage.getSession(AppState.currentSession.id)) {
                Storage.saveSession(AppState.currentSession);
                renderSavedList();
            }
        
            const resizeHandle = document.getElementById('logo-resize-handle');
            if (resizeHandle) resizeHandle.style.display = 'none';
        
            checkTimeBalance();
            isUndoingOrRedoing = false;
            Toast.success('Rehecho');
        }
        
        function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onerror = () => {
                        reject(new Error('Formato de imagen inválido o archivo corrupto.'));
                    };
                    img.onload = () => {
                        let width = img.width;
                        let height = img.height;
        
                        if (width > maxWidth || height > maxHeight) {
                            if (width > height) {
                                height = Math.round((height * maxWidth) / width);
                                width = maxWidth;
                            } else {
                                width = Math.round((width * maxHeight) / height);
                                height = maxHeight;
                            }
                        }
        
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
        
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
        
                        canvas.toBlob((blob) => {
                            if (!blob) {
                                reject(new Error('Canvas compression failed'));
                                return;
                            }
                            const compressedFile = new File([blob], file.name, {
                                type: file.type || 'image/jpeg',
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        }, file.type || 'image/jpeg', quality);
                    };
                    img.onerror = (err) => reject(err);
                };
                reader.onerror = (err) => reject(err);
            });
        }
        
        const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
        const MAX_LOGO_BYTES = 5 * 1024 * 1024;
        
        function validateLogoFile(file) {
            if (!file || !ALLOWED_LOGO_TYPES.has(file.type)) {
                throw new Error('Formato no permitido. Usa PNG, JPG o WebP.');
            }
            if (file.size > MAX_LOGO_BYTES) {
                throw new Error('El logo supera el límite de 5 MB.');
            }
        }
        
        function loadLastSession() {
            const current = Storage.getCurrentSession();
            if (current && current.htmlContent) {
                AppState.currentSession = current;
                populateForm(current);
        
                DOM.sessionSheet.innerHTML = window.SpaceLabSanitizer
                    ? SpaceLabSanitizer.sanitizeSessionHTML(current.htmlContent)
                    : '';
                applyDesignStyles(current.presentation || current.design);
                applyZoom();
                enforceEditMode();
                DOM.emptyState.classList.add('hidden');
                DOM.printPreview.classList.remove('hidden');
        
                if (current.template) {
                    DOM.selectTemplate.value = current.template;
                }
        
                Toast.info('Última sesión restaurada');
        
                // Check time balance
                checkTimeBalance();
            }
        }
        
        function handleShowLoadModal() {
            const sessions = Storage.getAllSessions();
        
            if (sessions.length === 0) {
                Toast.info('No hay sesiones guardadas');
                return;
            }
        
            DOM.loadList.innerHTML = sessions.map(s => `
                <li class="load-item" data-id="${s.id}">
                    <div class="load-item-info">
                        <span class="load-item-title">${escHTML(s.metadata?.titulo || 'Sin título')}</span>
                        <span class="load-item-meta">
                            ${escHTML(s.metadata?.area || '')} · ${escHTML(s.metadata?.grado || '')} · 
                            ${formatDate(s.lastSaved)}
                        </span>
                    </div>
                    <div class="load-item-actions">
                        <button class="btn btn-ghost btn-sm load-item-select" data-id="${s.id}" title="Cargar" aria-label="Cargar"><svg class="ui-icon" aria-hidden="true"><use href="#icon-folder"></use></svg></button>
                        <button class="btn btn-ghost btn-sm load-item-delete" data-id="${s.id}" title="Eliminar" aria-label="Eliminar"><svg class="ui-icon" aria-hidden="true"><use href="#icon-trash"></use></svg></button>
                    </div>
                </li>
            `).join('');
        
            // Bind load events
            DOM.loadList.querySelectorAll('.load-item-select').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    loadSession(btn.dataset.id);
                });
            });
        
            DOM.loadList.querySelectorAll('.load-item-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const confirmed = await ConfirmDialog.show({
                        title: '¿Eliminar sesión?',
                        message: 'Esta acción no se puede deshacer.',
                        confirmText: 'Eliminar'
                    });
                    if (confirmed) {
                        Storage.deleteSession(btn.dataset.id);
                        Toast.success('Sesión eliminada');
                        handleShowLoadModal(); // Refresh
                        renderSavedList();
                    }
                });
            });
        
            // Also allow clicking the whole item
            DOM.loadList.querySelectorAll('.load-item').forEach(item => {
                item.addEventListener('click', () => loadSession(item.dataset.id));
            });
        
            DOM.loadModal.classList.remove('hidden');
        }
        
        function loadSession(id) {
            const session = Storage.getSession(id);
            if (!session) {
                Toast.error('Sesión no encontrada');
                return;
            }
        
            AppState.currentSession = session;
            populateForm(session);
        
            if (session.htmlContent) {
                DOM.sessionSheet.innerHTML = window.SpaceLabSanitizer
                    ? SpaceLabSanitizer.sanitizeSessionHTML(session.htmlContent)
                    : '';
                applyDesignStyles(session.presentation || session.design);
                applyZoom();
                enforceEditMode();
            } else {
                renderSession(session);
            }
        
            DOM.emptyState.classList.add('hidden');
            DOM.printPreview.classList.remove('hidden');
            DOM.loadModal.classList.add('hidden');
        
            Storage.setCurrentSession(session);
            Toast.success('Sesión cargada correctamente');
            window.dispatchEvent(new CustomEvent('spacelab:session-loaded', { detail: { session } }));
        }
        
        async function handleNew() {
            if (AppState.currentSession) {
                const confirmed = await ConfirmDialog.show({
                    title: '¿Nueva sesión?',
                    message: 'Los cambios no guardados se perderán.',
                    confirmText: 'Continuar'
                });
                if (!confirmed) return;
            }
            await forceNewSession();
        }
        
        async function forceNewSession() {
            // Reset
            AppState.currentSession = null;
            DOM.form.querySelectorAll('input, textarea, select').forEach(el => {
                if (el.type === 'date') {
                    el.valueAsDate = new Date();
                } else if (el.tagName === 'SELECT') {
                    el.selectedIndex = 0;
                } else {
                    el.value = '';
                }
            });
        
            // Reset zoom scale to 100%
            AppState.zoomScale = 1.0;
            applyZoom();
        
            DOM.sessionSheet.innerHTML = '';
            DOM.printPreview.classList.add('hidden');
            DOM.emptyState.classList.remove('hidden');
        
            // Hide CNEB selectors
            DOM.selectCnebCompetencia.classList.add('hidden');
            DOM.selectCnebCapacidad.classList.add('hidden');
        
            Storage.clearCurrentSession();
            await loadProfileDefaults();
            Toast.info('Nueva sesión iniciada');
        }
        
        async function handleCloseSession() {
            if (!AppState.currentSession) {
                Toast.info('El editor ya está vacío y listo para una nueva sesión.');
                return;
            }
        
            const choice = await ConfirmDialog.show({
                title: '¿Cerrar sesión del editor?',
                message: '¿Deseas guardar los cambios de la sesión actual antes de cerrarla y comenzar otra?',
                showDenyButton: true,
                confirmText: 'Sí, guardar',
                denyText: 'No guardar',
                cancelText: 'Cancelar'
            });
        
            if (choice === 'confirm') {
                handleSave();
                await forceNewSession();
            } else if (choice === 'deny') {
                await forceNewSession();
            }
        }
        
        // ═══════════════════════════════════════
        // SAVED LIST (Sidebar)
        // ═══════════════════════════════════════
        
        function renderSavedList() {
            const sessions = Storage.getAllSessions();
        
            if (sessions.length === 0) {
                DOM.savedList.innerHTML = '<li class="saved-empty">No hay sesiones guardadas</li>';
                return;
            }
        
            // Show only last 5
            DOM.savedList.innerHTML = sessions.slice(0, 5).map(s => `
                <li class="saved-item" data-id="${s.id}">
                    <div class="saved-item-info">
                        <span class="saved-item-title">${escHTML(s.metadata?.titulo || 'Sin título')}</span>
                        <span class="saved-item-date">${formatDate(s.lastSaved)}</span>
                    </div>
                    <button class="saved-item-delete" data-id="${s.id}" title="Eliminar" aria-label="Eliminar"><svg class="ui-icon" aria-hidden="true"><use href="#icon-trash"></use></svg></button>
                </li>
            `).join('');
        
            // Bind events
            DOM.savedList.querySelectorAll('.saved-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('saved-item-delete')) {
                        loadSession(item.dataset.id);
                    }
                });
            });
        
            DOM.savedList.querySelectorAll('.saved-item-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const confirmed = await ConfirmDialog.show({
                        title: '¿Mandar a la Papelera?',
                        message: 'La sesión se guardará por 7 días en la papelera para que puedas restaurarla si la borras por error.',
                        confirmText: 'Mandar a Papelera'
                    });
                    if (confirmed) {
                        Storage.deleteSession(btn.dataset.id);
        
                        // Si la sesión activa es la que se eliminó, limpiar lienzo
                        if (AppState.currentSession && AppState.currentSession.id === btn.dataset.id) {
                            Storage.clearCurrentSession();
                            AppState.currentSession = null;
                            DOM.sessionSheet.innerHTML = '';
                            DOM.emptyState.classList.remove('hidden');
                            DOM.printPreview.classList.add('hidden');
                        }
        
                        renderSavedList();
                        Toast.success('Sesión enviada a la papelera');
                    }
                });
            });
        }
        
        // ═══════════════════════════════════════
        // CLEAN PASTE
        // ═══════════════════════════════════════
        
        
        return {
            handleSave,
            handleSaveAs,
            saveCurrentState,
            undo,
            redo,
            compressImage,
            validateLogoFile,
            loadLastSession,
            handleShowLoadModal,
            loadSession,
            handleNew,
            forceNewSession,
            handleCloseSession,
            renderSavedList
        };
    }

    return { create };
})();
