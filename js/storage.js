/* ═══════════════════════════════════════════════════
   STORAGE — LocalStorage Manager
   CRUD de sesiones + auto-save con debounce
   ═══════════════════════════════════════════════════ */

const Storage = (() => {
    const accounts = window.AccountStorage || (typeof require === 'function' ? require('./core/account-storage.js') : null);
    const currentOwner = () => accounts.userId(window.SupabaseClient);
    const scopedKey = base => accounts.key(base, currentOwner());
    const STORAGE_KEY = 'spacelab_sessions';
    const CURRENT_KEY = 'spacelab_current';
    const SETTINGS_KEY = 'spacelab_settings';

    // ─── ACTIVE SYNC TRACKING ───
    let activeSyncsCount = 0;
    const cloudSaveQueues = new Map();

    function incrementSync() {
        activeSyncsCount++;
    }

    function decrementSync() {
        activeSyncsCount = Math.max(0, activeSyncsCount - 1);
    }

    function queueCloudSave(session) {
        if (!window.SupabaseClient || typeof SupabaseClient.saveSessionCloud !== 'function') return;
        const ownerId = currentOwner();
        if (!ownerId) return;

        // Each request owns an immutable snapshot and waits for the preceding save.
        // This prevents a slow, older autosave from overwriting a newer version.
        const snapshot = JSON.parse(JSON.stringify(session));
        const queueKey = accounts.key(snapshot.id, ownerId);
        const previous = cloudSaveQueues.get(queueKey) || Promise.resolve();
        const next = previous.catch(() => undefined).then(async () => {
            if (currentOwner() !== ownerId) return;
            incrementSync();
            try {
                const user = await SupabaseClient.getCurrentUser();
                if (user?.id === ownerId && currentOwner() === ownerId) {
                    await SupabaseClient.saveSessionCloud(snapshot, ownerId);
                }
            } finally {
                decrementSync();
            }
        });

        cloudSaveQueues.set(queueKey, next);
        next.catch(err => console.warn('[Storage] Error al subir a la nube:', err));
        next.then(() => {
            if (cloudSaveQueues.get(queueKey) === next) cloudSaveQueues.delete(queueKey);
        }, () => {
            if (cloudSaveQueues.get(queueKey) === next) cloudSaveQueues.delete(queueKey);
        });
    }

    window.addEventListener('beforeunload', (e) => {
        if (activeSyncsCount > 0) {
            e.preventDefault();
            e.returnValue = 'Hay sincronizaciones de base de datos activas en segundo plano. ¿Estás seguro de que quieres salir?';
            return e.returnValue;
        }
    });

    // ─── SAFE LOCALSTORAGE SETTER ───
    function safeSetItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.error('[Storage] Error al escribir en localStorage:', e);
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                if (window.Toast && typeof Toast.warning === 'function') {
                    Toast.warning('Almacenamiento local lleno. Guarda o sincroniza tus sesiones en la nube para no perder cambios.');
                }
            }
            return false;
        }
    }

    // ─── CRUD ───

    function getAllSessions(includeDeleted = false) {
        try {
            const data = localStorage.getItem(scopedKey(STORAGE_KEY));
            const sessions = data ? JSON.parse(data) : [];
            if (!Array.isArray(sessions)) return [];
            if (includeDeleted) return sessions;
            return sessions.filter(s => !s.deleted_at);
        } catch (e) {
            console.error('[Storage] Error reading sessions:', e);
            return [];
        }
    }

    function getSession(id) {
        const sessions = getAllSessions();
        return sessions.find(s => s.id === id) || null;
    }

    function saveSession(session) {
        try {
            if (window.SpaceLabSanitizer && typeof session?.htmlContent === 'string') {
                session = {
                    ...session,
                    htmlContent: window.SpaceLabSanitizer.sanitizeSessionHTML(session.htmlContent)
                };
            }
            // Include soft-deleted records so a later save cannot discard the
            // deletion tombstones before they are synchronized with Supabase.
            const sessions = getAllSessions(true);
            const idx = sessions.findIndex(s => s.id === session.id);

            session.lastSaved = new Date().toISOString();

            if (idx >= 0) {
                sessions[idx] = session;
            } else {
                sessions.unshift(session);
            }

            if (!safeSetItem(scopedKey(STORAGE_KEY), JSON.stringify(sessions))) return false;

            // Sincronización asíncrona con Supabase en background si está logueado
            queueCloudSave(session);

            return true;
        } catch (e) {
            console.error('[Storage] Error saving session:', e);
            return false;
        }
    }

    function deleteSession(id) {
        try {
            const sessions = getAllSessions(true);
            const session = sessions.find(s => s.id === id);
            
            if (session) {
                session.deleted_at = new Date().toISOString();
                session.lastSaved = new Date().toISOString();
                if (!safeSetItem(scopedKey(STORAGE_KEY), JSON.stringify(sessions))) return false;

                // Sincronización asíncrona con Supabase en background
                queueCloudSave(session);
            }

            return true;
        } catch (e) {
            console.error('[Storage] Error deleting session:', e);
            return false;
        }
    }

    // ─── CURRENT SESSION (working draft) ───

    function getCurrentSession() {
        try {
            const data = localStorage.getItem(scopedKey(CURRENT_KEY));
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    function setCurrentSession(session, ownerId = currentOwner()) {
        return safeSetItem(accounts.key(CURRENT_KEY, ownerId), JSON.stringify(session));
    }

    function clearCurrentSession() {
        localStorage.removeItem(scopedKey(CURRENT_KEY));
    }

    // ─── SETTINGS ───

    function getSettings() {
        try {
            const data = localStorage.getItem(SETTINGS_KEY);
            return data ? JSON.parse(data) : {
                editMode: true,
                autoSave: true,
                lastTemplate: 'estandar'
            };
        } catch {
            return { editMode: true, autoSave: true, lastTemplate: 'estandar' };
        }
    }

    function saveSettings(settings) {
        safeSetItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    // ─── AUTO-SAVE (Debounced) ───

    let _autoSaveTimer = null;
    let _autoSaveCallback = null;
    let _unsavedChanges = false;
    let _indicatorTimer = null;

    function cancelAutoSave() {
        clearTimeout(_autoSaveTimer);
        clearTimeout(_indicatorTimer);
        _unsavedChanges = false;
    }

    window.addEventListener('spacelab:account-changed', cancelAutoSave);
    window.addEventListener('beforeunload', e => {
        if (_unsavedChanges) { e.preventDefault(); e.returnValue = ''; }
    });

    function setupAutoSave(callback, delay = 3000) {
        _autoSaveCallback = callback;
        
        // Listen for changes in contenteditable areas
        document.addEventListener('input', (e) => {
            if (e.target.closest('#session-sheet') && e.target.hasAttribute('contenteditable')) {
                triggerAutoSave(delay);
            }
        });
    }

    function triggerAutoSave(delay = 3000) {
        clearTimeout(_autoSaveTimer);
        const ownerId = currentOwner();
        _unsavedChanges = true;
        
        // Update save indicator to "saving..."
        updateSaveIndicator('saving');
        
        _autoSaveTimer = setTimeout(async () => {
            if (ownerId !== currentOwner()) return;
            if (_autoSaveCallback) {
                try {
                    const result = await _autoSaveCallback();
                    if (ownerId !== currentOwner()) return;
                    _unsavedChanges = result !== true;
                    updateSaveIndicator(result === true ? 'saved' : 'error');
                } catch (error) {
                    console.error('[Storage] Falló el autoguardado:', error);
                    if (ownerId === currentOwner()) updateSaveIndicator('error');
                }
            }
        }, delay);
    }

    function updateSaveIndicator(state) {
        clearTimeout(_indicatorTimer);
        const indicator = document.getElementById('save-indicator');
        if (!indicator) return;
        const text = indicator.querySelector('.save-text');
        if (!text) return;
        
        indicator.classList.remove('saved', 'saving');

        switch (state) {
            case 'saving':
                indicator.classList.add('saving');
                text.textContent = 'Guardando...';
                break;
            case 'saved':
                _unsavedChanges = false;
                indicator.classList.add('saved');
                text.textContent = 'Guardado local';
                // Reset after 5 seconds
                _indicatorTimer = setTimeout(() => {
                    indicator.classList.remove('saved');
                    text.textContent = 'Sin cambios';
                }, 5000);
                break;
            case 'error':
                _unsavedChanges = true;
                text.textContent = 'Sin guardar · reintenta';
                break;
            default:
                text.textContent = 'Sin cambios';
        }
    }

    // ─── UTILITIES ───

    function generateId() {
        return 'ses_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }

    function exportAsJSON(session) {
        const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const titulo = session.metadata?.titulo || session.titulo || 'sin_titulo';
        const cleanTitle = titulo.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '_');
        a.download = `sesion_${cleanTitle}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportAsV1JSON(session) {
        let docToExport = session.data || session;
        if (typeof SessionAdapter !== 'undefined' && docToExport.schemaVersion !== '1.0') {
            const { document } = SessionAdapter.adaptLegacyToV1(docToExport);
            docToExport = document;
        }
        const blob = new Blob([JSON.stringify(docToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const titulo = docToExport.metadata?.titulo || session.metadata?.titulo || 'sin_titulo';
        const cleanTitle = titulo.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '_');
        a.download = `sesion_${cleanTitle}_v1_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (typeof SessionAdapter !== 'undefined' && data && typeof data === 'object' && data.schemaVersion !== '1.0') {
                        const { document } = SessionAdapter.adaptLegacyToV1(data);
                        resolve({ ...data, data: document });
                    } else {
                        resolve(data);
                    }
                } catch {
                    reject(new Error('Archivo JSON inválido'));
                }
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file);
        });
    }

    async function syncSessions() {
        if (!window.SupabaseClient) return false;
        const ownerId = currentOwner();
        const user = await SupabaseClient.getCurrentUser();
        if (!ownerId || user?.id !== ownerId || currentOwner() !== ownerId) return false;

        incrementSync();
        try {
            // 1. Obtener todas las sesiones locales (incluidas las soft-deleted)
            const localSessions = getAllSessions(true);
            const original = new Map(localSessions.map(session => [session.id, JSON.stringify(session)]));
            
            // 2. Obtener sesiones de la nube (que incluyen deleted_at)
            const cloudSessions = await SupabaseClient.getSessionsCloud(ownerId);
            accounts.assertCurrent(window.SupabaseClient, ownerId);

            // 3. Fusionar local y nube
            const mergedMap = new Map();

            // Agregar primero locales
            localSessions.forEach(s => mergedMap.set(s.id, s));

            // Agregar/sobreescribir con las de la nube si son más recientes
            cloudSessions.forEach(cs => {
                const local = mergedMap.get(cs.id);
                if (!local) {
                    mergedMap.set(cs.id, cs);
                } else {
                    const localTime = new Date(local.lastSaved || 0);
                    const cloudTime = new Date(cs.lastSaved || cs.last_saved || 0);
                    if (cloudTime > localTime) {
                        mergedMap.set(cs.id, cs);
                    }
                }
            });

            // Procesar la lista consolidada
            const finalSessions = [];
            const savePromises = [];

            for (const session of mergedMap.values()) {
                const cloudVersion = cloudSessions.find(cs => cs.id === session.id);

                // Si está marcada como eliminada
                if (session.deleted_at) {
                    // Si no está en la nube, es porque el admin la purgó o borró físicamente. La purgamos local.
                    if (!cloudVersion) {
                        console.log('[Sync] Purgando sesión eliminada localmente (no existe en la nube):', session.id);
                        continue;
                    }
                    // Si está en la nube pero no marcada como eliminada en la nube, actualizamos la nube
                    if (!cloudVersion.deleted_at) {
                        savePromises.push(SupabaseClient.saveSessionCloud(session, ownerId));
                    }
                    session.synced = true;
                    finalSessions.push(session);
                } else {
                    // Sesión activa
                    if (!cloudVersion) {
                        // No está en la nube
                        // ¿Ya había sido sincronizada anteriormente? (Si tiene la marca synced)
                        if (session.synced) {
                            // Si ya fue sincronizada pero ya no está en la nube, fue borrada de la nube por el admin.
                            // Por lo tanto, la borramos localmente para evitar resurrecciones.
                            console.log('[Sync] Borrando sesión eliminada por administrador en nube:', session.id);
                            continue;
                        } else {
                            // Nueva sesión local nunca subida. La subimos.
                            session.synced = true;
                            savePromises.push(SupabaseClient.saveSessionCloud(session, ownerId));
                            finalSessions.push(session);
                        }
                    } else {
                        // Existe en ambos lados y está activa.
                        // Si la versión local es más nueva, la subimos a la nube.
                        const localTime = new Date(session.lastSaved || 0);
                        const cloudTime = new Date(cloudVersion.lastSaved || 0);
                        if (localTime > cloudTime) {
                            savePromises.push(SupabaseClient.saveSessionCloud(session, ownerId));
                        }
                        session.synced = true;
                        finalSessions.push(session);
                    }
                }
            }

            // Ejecutar subidas/sincronizaciones en la nube en paralelo
            if (savePromises.length > 0) {
                console.log(`[Sync] Sincronizando ${savePromises.length} sesiones en la nube en paralelo...`);
                const results = await Promise.all(savePromises);
                if (results.some(result => result === false)) throw new Error('No se completó la sincronización.');
            }
            accounts.assertCurrent(window.SupabaseClient, ownerId);

            // Ordenar por fecha
            finalSessions.sort((a, b) => new Date(b.lastSaved || 0) - new Date(a.lastSaved || 0));

            // Guardar el resultado consolidado en LocalStorage
            // Merge saves made while the network was in flight instead of losing them.
            const latest = new Map(getAllSessions(true).map(session => [session.id, session]));
            for (const [id, session] of latest) {
                if (JSON.stringify(session) !== original.get(id)) {
                    const index = finalSessions.findIndex(item => item.id === id);
                    if (index >= 0) finalSessions[index] = session;
                    else finalSessions.push(session);
                }
            }
            if (!safeSetItem(accounts.key(STORAGE_KEY, ownerId), JSON.stringify(finalSessions))) return false;

            console.log('Sesiones sincronizadas con Supabase con éxito');
            return true;
        } catch (e) {
            console.error('[Storage] Error al sincronizar sesiones:', e);
            return false;
        } finally {
            decrementSync();
        }
    }

    return {
        getAllSessions,
        getSession,
        saveSession,
        deleteSession,
        getCurrentSession,
        setCurrentSession,
        clearCurrentSession,
        getSettings,
        saveSettings,
        setupAutoSave,
        triggerAutoSave,
        cancelAutoSave,
        updateSaveIndicator,
        generateId,
        exportAsJSON,
        exportAsV1JSON,
        importFromJSON,
        syncSessions
    };
})();

if (typeof window !== 'undefined') {
    window.StorageManager = Storage;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}

