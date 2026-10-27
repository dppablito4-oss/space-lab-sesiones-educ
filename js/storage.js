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
    const sync = window.SessionSync || (typeof require === 'function' ? require('./core/session-sync.js') : null);
    const recoveryPrefix = ownerId => ownerId ? accounts.key('spacelab_recovered', ownerId) + ':' : 'spacelab_recovered:guest:';
    const recoveryKey = (session, ownerId) => recoveryPrefix(ownerId) + encodeURIComponent(session.id);

    function emit(name, detail) {
        if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new CustomEvent(name, {detail}));
    }

    function acknowledge(snapshot, ownerId) {
        if (currentOwner() !== ownerId || !snapshot._cloudSync) return;
        const sessions = getAllSessions(true);
        const local = sessions.find(item => item.id === snapshot.id);
        if (local?._cloudSync?.branchId === snapshot._cloudSync.branchId) {
            local._cloudSync = {...snapshot._cloudSync};
            local.synced = sync.same(local, snapshot);
            safeSetItem(accounts.key(STORAGE_KEY, ownerId), JSON.stringify(sessions));
            if (local._recoveryOf) safeSetItem(recoveryKey(local, ownerId), JSON.stringify(local));
        }
        const draft = getCurrentSession();
        if (draft?.id === snapshot.id && draft._cloudSync?.branchId === snapshot._cloudSync.branchId) {
            draft._cloudSync = {...snapshot._cloudSync};
            setCurrentSession(draft, ownerId);
        }
        emit('spacelab:session-synced', {id: snapshot.id, ownerId, state: snapshot._cloudSync});
    }

    async function recoverConflict(snapshot, error, ownerId, state) {
        if (currentOwner() !== ownerId) return false;
        const copy = JSON.parse(JSON.stringify(state.latestSnapshot || snapshot));
        const originalId = copy.id;
        copy.id = 'ses_recovered_' + sync.newId();
        copy._recoveryOf = originalId;
        copy.metadata = {...copy.metadata, titulo: (copy.metadata?.titulo || 'Sesión') + ' (copia recuperada)'};
        copy.synced = false;
        copy.lastSaved = new Date().toISOString();
        copy.deleted_at = null;
        if (copy.planning?.mode === 'linked') delete copy.planning;
        sync.prepare(copy, ownerId);
        // A dedicated key survives a competing tab replacing the sessions index.
        // Never discard the existing local version if there is insufficient space.
        if (!safeSetItem(recoveryKey(copy, ownerId), JSON.stringify(copy))) {
            const failure = new Error('Tus cambios siguen en este dispositivo, pero falta espacio para crear la copia recuperada. Exporta el documento a JSON antes de continuar.');
            failure.code = 'RECOVERY_STORAGE_FULL';
            window.Toast?.error?.(failure.message);
            throw failure;
        }
        const sessions = getAllSessions(true).filter(item => item.id !== originalId && item.id !== copy.id);
        if (error.remoteSession) sessions.push(error.remoteSession);
        sessions.push(copy);
        safeSetItem(accounts.key(STORAGE_KEY, ownerId), JSON.stringify(sessions));
        state.redirected = true;
        const forkKey = accounts.key(copy.id, ownerId);
        const forkState = {promise: state.promise, branchId: copy._cloudSync.branchId,
            baseVersion: null, version: null, latestSnapshot: copy};
        cloudSaveQueues.set(forkKey, forkState);
        emit('spacelab:session-conflict', {originalId, ownerId, branchId: snapshot._cloudSync.branchId, session: copy});
        window.Toast?.warning?.('La sesión cambió en otro dispositivo. Tus cambios están en una copia recuperada; la versión remota se conservó.');
        window.SpaceLabHome?.refresh?.();
        const saved = await SupabaseClient.saveSessionCloud(copy, ownerId);
        if (currentOwner() !== ownerId) return false;
        if (saved !== false) {
            forkState.version = copy._cloudSync.version;
            acknowledge(copy, ownerId);
        }
        if (cloudSaveQueues.get(forkKey) === forkState && forkState.promise === state.promise) cloudSaveQueues.delete(forkKey);
        return saved;
    }

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
        const previous = cloudSaveQueues.get(queueKey);
        const sameBranch = previous?.branchId && previous.branchId === snapshot._cloudSync?.branchId;
        const state = sameBranch ? previous : {ownerId, branchId: snapshot._cloudSync?.branchId,
            baseVersion: snapshot._cloudSync?.version, version: snapshot._cloudSync?.version};
        state.latestSnapshot = snapshot;
        const next = (previous?.promise || Promise.resolve()).catch(() => undefined).then(async () => {
            if (currentOwner() !== ownerId) return;
            if (state.redirected) return;
            if (snapshot._cloudSync && snapshot._cloudSync.version === state.baseVersion) {
                snapshot._cloudSync.version = state.version;
            }
            incrementSync();
            try {
                const user = await SupabaseClient.getCurrentUser();
                if (user?.id === ownerId && currentOwner() === ownerId) {
                    try {
                        const saved = await SupabaseClient.saveSessionCloud(snapshot, ownerId);
                        if (saved === false) return;
                        state.version = snapshot._cloudSync?.version;
                        acknowledge(snapshot, ownerId);
                    } catch (error) {
                        if (error.code !== 'SESSION_CONFLICT' || !sync) throw error;
                        await recoverConflict(snapshot, error, ownerId, state);
                    }
                }
            } finally {
                decrementSync();
            }
        });

        state.promise = next;
        cloudSaveQueues.set(queueKey, state);
        next.catch(err => console.warn('[Storage] Error al subir a la nube:', err));
        next.then(() => {
            if (cloudSaveQueues.get(queueKey)?.promise === next) cloudSaveQueues.delete(queueKey);
        }, () => {
            if (cloudSaveQueues.get(queueKey)?.promise === next) cloudSaveQueues.delete(queueKey);
        });
        return next;
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
            const prefix = recoveryPrefix(currentOwner());
            for (let index = 0; index < (localStorage.length || 0); index++) {
                const key = localStorage.key(index);
                if (!key?.startsWith(prefix)) continue;
                let recovered;
                try { recovered = JSON.parse(localStorage.getItem(key)); } catch { continue; }
                if (!recovered?.id) continue;
                const previous = sessions.findIndex(item => item.id === recovered.id);
                if (previous < 0) sessions.push(recovered);
                else if (new Date(recovered.lastSaved || 0) > new Date(sessions[previous].lastSaved || 0)) sessions[previous] = recovered;
            }
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
            sync?.prepare(session, currentOwner());
            session.synced = false;
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

            if (session._recoveryOf && !safeSetItem(recoveryKey(session, currentOwner()), JSON.stringify(session))) return false;
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
                session.synced = false;
                if (session._recoveryOf && !safeSetItem(recoveryKey(session, currentOwner()), JSON.stringify(session))) return false;
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
        if (session) sync?.prepare(session, ownerId);
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
            const localSessions = getAllSessions(true);
            const original = new Map(localSessions.map(session => [session.id, JSON.stringify(session)]));
            const cloudSessions = await SupabaseClient.getSessionsCloud(ownerId);
            accounts.assertCurrent(window.SupabaseClient, ownerId);
            const merged = new Map(cloudSessions.map(session => [session.id, session]));
            const writes = [];
            for (const local of localSessions) {
                const remote = merged.get(local.id);
                // Do not enqueue an old snapshot over an edit made during the read.
                const latest = getAllSessions(true).find(session => session.id === local.id);
                if (JSON.stringify(latest) !== original.get(local.id)) continue;
                if (remote && sync?.same(local, remote)) {
                    sync.prepare(local, ownerId);
                    local._cloudSync.version = remote._cloudSync?.version || remote.lastSaved;
                    local.synced = true;
                    merged.set(local.id, local);
                } else if (remote && local.synced && local._cloudSync?.version) {
                    // A clean local snapshot may advance; a dirty snapshot must
                    // pass its own revision to the atomic conditional write.
                    merged.set(local.id, remote);
                } else {
                    merged.set(local.id, local);
                    // A missing row may be a deletion or an RLS restriction.
                    // Keep the local copy and never resurrect it automatically.
                    if (!remote && local.synced) continue;
                    writes.push(queueCloudSave(local));
                }
            }
            const results = await Promise.all(writes);
            if (results.some(result => result === false)) return false;
            accounts.assertCurrent(window.SupabaseClient, ownerId);
            for (const session of getAllSessions(true)) {
                if (JSON.stringify(session) !== original.get(session.id)) merged.set(session.id, session);
            }
            const finalSessions = Array.from(merged.values());
            finalSessions.sort((a, b) => new Date(b.lastSaved || 0) - new Date(a.lastSaved || 0));
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

