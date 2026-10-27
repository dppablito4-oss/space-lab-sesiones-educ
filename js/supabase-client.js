/* ═══════════════════════════════════════════════════
   SUPABASE CLIENT — Configuración & Helpers de Base de Datos
   Space Lab — Sesiones Educativas
   ═══════════════════════════════════════════════════ */

window.SupabaseClient = (() => {
    if (!window.SpaceLabProfileFields) {
        throw new Error('No se cargó la allowlist de campos de perfil.');
    }
    // Credenciales dadas por el usuario
    const SUPABASE_URL = 'https://koptglmifwpzrfzvipnm.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_erAiat0Q6VFXk5gveRnj4A_3WKFzBzI';

    let supabase = null;
    let _cachedUser = null;
    let _cachedSession = null;
    let _storageOwnerId = null;
    let _sessionResolved = false;
    let _passwordRecoveryPending = false;

    function setSessionContext(session) {
        const previousUserId = _storageOwnerId;
        _cachedSession = session || null;
        _cachedUser = session?.user || null;
        _sessionResolved = true;
        _storageOwnerId = _cachedUser?.id || null;
        if (previousUserId !== _storageOwnerId) {
            window.dispatchEvent(new CustomEvent('spacelab:account-changed', {
                detail: { previousUserId, userId: _storageOwnerId }
            }));
        }
    }

    /**
     * Lee inmediatamente el usuario persistido en localStorage de forma síncrona
     * sin esperar promesas ni peticiones de red.
     */
    function getSessionUserSync() {
        if (_sessionResolved) return _cachedUser;
        if (_cachedUser) return _cachedUser;
        try {
            const exactKey = 'sb-koptglmifwpzrfzvipnm-auth-token';
            let item = window.localStorage ? window.localStorage.getItem(exactKey) : null;
            if (item) {
                const parsed = JSON.parse(item);
                if (parsed && (parsed.user || parsed.currentSession?.user)) {
                    const u = parsed.user || parsed.currentSession?.user;
                    _cachedUser = u;
                    _cachedSession = parsed;
                    return u;
                }
            }
        } catch (e) {
            console.warn('[SupabaseClient] Error leyendo sesión síncrona:', e);
        }
        return null;
    }

    // Inicializar cliente de Supabase
    try {
        if (window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: {
                    storage: window.localStorage,
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            _cachedUser = getSessionUserSync();
            _storageOwnerId = _cachedUser?.id || null;
            supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'PASSWORD_RECOVERY') _passwordRecoveryPending = true;
                if (event === 'SIGNED_OUT') _passwordRecoveryPending = false;
                setSessionContext(session);
            });
            console.log('Supabase Client initialized successfully');
        } else {
            console.error('[Supabase] SDK no encontrado. Asegúrate de incluir la etiqueta de script en tu HTML.');
        }
    } catch (e) {
        console.error('[Supabase] Error al inicializar el cliente:', e);
    }

    // ─── AUTHENTICATION HELPERS ───

    /**
     * Registra un nuevo usuario con correo, contraseña y apodo
     */
    async function signUp(email, password, username) {
        if (!supabase) throw new Error('Supabase no inicializado');
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                data: {
                    username: username.trim().toLowerCase()
                }
            }
        });
        if (error) throw error;

        // Registrar log de seguridad si se crea el usuario
        if (data?.user) {
            await logAction('REGISTER_SUCCESS', `Usuario registrado: ${email} con apodo: ${username}`);
            // Asegurar perfil
            await ensureUserProfile(data.user);
        }
        return data;
    }

    /**
     * Inicia sesión con correo y contraseña
     */
    async function signIn(email, password) {
        if (!supabase) throw new Error('Supabase no inicializado');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });
        if (error) throw error;

        // Registrar log de seguridad
        if (data?.user) {
            await logAction('LOGIN_SUCCESS', `Usuario ingresó correctamente con credenciales (Email: ${email})`);
            // Asegurar perfil por si acaso
            await ensureUserProfile(data.user);
        }
        return data;
    }

    /**
     * Envía un correo electrónico con código OTP (Mantenido por compatibilidad)
     */
    async function sendOtp(email) {
        if (!supabase) throw new Error('Supabase no inicializado');
        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        if (error) throw error;
        return true;
    }

    /**
     * Verifica el código OTP ingresado por el usuario (Mantenido por compatibilidad)
     */
    async function verifyOtp(email, token) {
        if (!supabase) throw new Error('Supabase no inicializado');
        
        // Intentar con type 'email' (login)
        let { data, error } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: token.trim(),
            type: 'email'
        });

        // Si falla, intentar como 'signup' por si es un nuevo usuario
        if (error) {
            const signupResult = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: token.trim(),
                type: 'signup'
            });
            if (signupResult.error) throw signupResult.error;
            data = signupResult.data;
        }

        // Registrar log de seguridad
        if (data?.user) {
            await logAction('LOGIN_SUCCESS', `Usuario ingresó correctamente por OTP: ${email}`);
            // Verificar si el perfil existe, sino crearlo en el cliente como fallback
            await ensureUserProfile(data.user);
        }

        return data;
    }

    /**
     * Asegura la creación del perfil si falla el trigger de BD
     */
    async function ensureUserProfile(user) {
        try {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (!data) {
                const username = user.user_metadata?.username || user.email.split('@')[0];
                await supabase.from('profiles').insert([{
                    id: user.id,
                    email: user.email,
                    username: username,
                    role: 'user'
                }]);
            }
        } catch (e) {
            console.warn('[Supabase] Error al asegurar el perfil del usuario:', e);
        }
    }

    /**
     * Cierra la sesión del usuario actual
     */
    async function logout() {
        if (!supabase) throw new Error('Supabase no inicializado');
        const user = await getCurrentUser();
        if (user) {
            await logAction('LOGOUT', `Usuario cerró sesión: ${user.email}`);
        }
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setSessionContext(null);
        return true;
    }

    async function requestPasswordReset(email) {
        if (!supabase) throw new Error('Supabase no inicializado');
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}${window.location.pathname}`
        });
        if (error) throw error;
        return true;
    }

    async function updateRecoveredPassword(password) {
        if (!supabase || !_passwordRecoveryPending) throw new Error('Abre un enlace de recuperación válido para cambiar la contraseña.');
        if (password.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        _passwordRecoveryPending = false;
        return true;
    }

    /**
     * Obtiene el usuario actual autenticado
     */
    async function getCurrentUser() {
        if (_cachedUser) return _cachedUser;
        const syncUser = getSessionUserSync();
        if (syncUser) return syncUser;
        if (!supabase) return null;
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user) {
                _cachedUser = sessionData.session.user;
                _cachedSession = sessionData.session;
                return _cachedUser;
            }
            const { data, error } = await supabase.auth.getUser();
            if (error || !data) return getSessionUserSync();
            if (data.user) {
                _cachedUser = data.user;
                return _cachedUser;
            }
            return getSessionUserSync();
        } catch (err) {
            console.warn('[SupabaseClient] Error verificando sesión:', err);
            return getSessionUserSync();
        }
    }

    async function readFunctionError(error, fallbackMessage) {
        const response = error && error.context;
        if (response && typeof response.clone === 'function') {
            try {
                const payload = await response.clone().json();
                if (payload && payload.error) {
                    return `${payload.error}${payload.details ? ': ' + payload.details : ''}`;
                }
            } catch {
                // The SDK error message below is the fallback for non-JSON responses.
            }
        }
        return (error && error.message) || fallbackMessage;
    }

    /**
     * Invokes an authenticated Edge Function. Provider keys always remain in
     * Supabase secrets and are never requested from or exposed to the browser.
     */
    async function invokeFunction(functionName, body) {
        if (!supabase) throw new Error('No se pudo conectar con Supabase.');
        const ownerId = getSessionUserSync()?.id || null;

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error('Debes iniciar sesión para usar las funciones de IA.');
        if (!ownerId || session.user?.id !== ownerId) throw new Error('La cuenta cambió. Inténtalo nuevamente.');

        try {
            const { data, error } = await supabase.functions.invoke(functionName, { body });
            if (getSessionUserSync()?.id !== ownerId) throw new Error('La cuenta cambió. Se descartó la respuesta anterior.');
            if (error) {
                if (error.name === 'FunctionsFetchError') {
                    console.warn('[Supabase] No se recibió respuesta de la función.', {
                        functionName,
                        origin: window.location?.origin,
                        requestId: body?.requestId
                    });
                    const connectionError = new Error('No se pudo conectar con la IA. Revisa tu conexión y la dirección desde la que abriste la aplicación.');
                    connectionError.code = 'AI_CONNECTION_ERROR';
                    throw connectionError;
                }
                throw new Error(await readFunctionError(error, `La función ${functionName} no está disponible.`));
            }
            if (data && typeof data === 'object' && data.error) {
                throw new Error(data.error);
            }
            return data;
        } finally {
            refreshAiCreditBalance().catch(() => {});
        }
    }

    /**
     * Obtiene el rol del usuario actual desde su perfil
     */
    async function getUserRole(userId) {
        if (!supabase || !userId) return 'user';
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();
            if (error) throw error;
            return data?.role || 'user';
        } catch (e) {
            console.error('[Supabase] Error al obtener el rol del usuario:', e);
            return 'user';
        }
    }

    // ─── DATABASE CRUD HELPERS ───

    /**
     * Obtiene todas las sesiones guardadas en la nube para el usuario
     */
    async function getSessionsCloud(expectedUserId = getSessionUserSync()?.id) {
        if (!supabase) return [];
        if (!expectedUserId || getSessionUserSync()?.id !== expectedUserId) throw new Error('La cuenta cambió.');
        const { data, error } = await supabase
            .from('sesiones')
            .select('*')
            .eq('user_id', expectedUserId)
            .order('last_saved', { ascending: false });
        
        if (error) {
            console.error('[Supabase] Error al leer sesiones:', error);
            throw error;
        }

        if (getSessionUserSync()?.id !== expectedUserId) throw new Error('La cuenta cambió.');
        return data.map(row => window.SessionSync.fromRow(row, expectedUserId));
    }

    /**
     * Guarda una sesión en la nube
     */
    async function saveSessionCloud(session, expectedUserId = getSessionUserSync()?.id) {
        if (!supabase) return false;
        const sync = window.SessionSync;
        sync.prepare(session, expectedUserId);
        const snapshot = JSON.parse(JSON.stringify(session));
        const user = await getCurrentUser();
        if (!user) return false;
        if (!expectedUserId || user.id !== expectedUserId || getSessionUserSync()?.id !== expectedUserId) throw new Error('La cuenta cambió.');

        const expectedVersion = snapshot._cloudSync.version;
        const payload = {
                id: snapshot.id,
                user_id: user.id,
                titulo: snapshot.metadata?.titulo || 'Sin título',
                template: snapshot.template || 'estandar',
                session_data: sync.data(snapshot),
                last_saved: sync.nextVersion(expectedVersion),
                deleted_at: snapshot.deleted_at || null
        };
        // Postgres evaluates the version predicate while locking the row. A
        // concurrent writer cannot pass using the same revision after a commit.
        const query = expectedVersion
            ? supabase.from('sesiones').update(payload).eq('id', snapshot.id)
                .eq('user_id', expectedUserId).eq('last_saved', expectedVersion)
            : supabase.from('sesiones').insert(payload);
        const {data, error} = await query.select('last_saved');
        if (getSessionUserSync()?.id !== expectedUserId) throw new Error('La cuenta cambió.');
        if (error && error.code !== '23505') {
            console.error('[Supabase] Error al guardar sesión en nube:', error);
            throw error;
        }
        let version = data?.[0]?.last_saved;
        if (!version) {
            const {data: remote, error: readError} = await supabase.from('sesiones').select('*')
                .eq('id', snapshot.id).eq('user_id', expectedUserId).maybeSingle();
            if (getSessionUserSync()?.id !== expectedUserId) throw new Error('La cuenta cambió.');
            if (readError) throw readError;
            const current = remote ? sync.fromRow(remote, expectedUserId) : null;
            if (current && sync.same(snapshot, current)) version = remote.last_saved;
            else {
                const conflict = new Error('Esta sesión cambió en otro dispositivo. Conservaremos tus cambios en una copia recuperada.');
                conflict.code = 'SESSION_CONFLICT';
                conflict.remoteSession = current;
                throw conflict;
            }
        }
        if (session.id === snapshot.id && session._cloudSync?.branchId === snapshot._cloudSync.branchId) {
            session._cloudSync = {...snapshot._cloudSync, version};
        }
        return true;
    }

    /**
     * Elimina una sesión de la nube
     */
    async function deleteSessionCloud(id) {
        if (!supabase) return false;
        const { error } = await supabase
            .from('sesiones')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[Supabase] Error al eliminar sesión de la nube:', error);
            throw error;
        }
        return true;
    }

    /** Obtiene los registros de planificación, incluidos sus tombstones. */
    async function getPlanningRecordsCloud(expectedUserId = getSessionUserSync()?.id) {
        if (!supabase) return [];
        if (!expectedUserId || getSessionUserSync()?.id !== expectedUserId) throw new Error('La cuenta cambió.');
        const { data, error } = await supabase
            .from('planning_containers')
            .select('*')
            .eq('user_id', expectedUserId)
            .order('last_saved', { ascending: false });
        if (error) throw error;
        return (data || []).map(row => ({
            id: row.id,
            schemaVersion: row.schema_version,
            revision: row.revision,
            status: row.status,
            title: row.title,
            planningType: row.planning_type,
            level: row.education_level,
            containerData: row.container_data,
            lastSaved: row.last_saved,
            deletedAt: row.deleted_at,
            synced: true
        }));
    }

    /** Inserta o actualiza un registro validado de PlanningContainer. */
    async function savePlanningRecordCloud(record, expectedUserId = getSessionUserSync()?.id) {
        if (!supabase) return false;
        const user = await getCurrentUser();
        if (!user) return false;
        if (!expectedUserId || user.id !== expectedUserId || getSessionUserSync()?.id !== expectedUserId) throw new Error('La cuenta cambió.');
        const { error } = await supabase
            .from('planning_containers')
            .upsert({
                user_id: user.id,
                id: record.id,
                schema_version: record.schemaVersion || record.containerData?.schemaVersion,
                revision: record.revision,
                status: record.status,
                title: record.title,
                planning_type: record.planningType,
                education_level: record.level,
                container_data: record.containerData,
                last_saved: record.lastSaved || new Date().toISOString(),
                deleted_at: record.deletedAt || null
            }, { onConflict: 'user_id,id' });
        if (error) throw error;
        return true;
    }

    /**
     * Inserta un log de seguridad
     */
    async function logAction(action, details) {
        if (!supabase) return;
        try {
            const user = await getCurrentUser();
            await supabase.from('security_logs').insert([{
                user_id: user ? user.id : null,
                action: action,
                details: details
            }]);
        } catch (e) {
            console.warn('[Supabase] No se pudo escribir el log de seguridad:', e);
        }
    }

    /**
     * Obtiene el perfil completo del usuario actual
     */
    async function getUserProfile(sessionUser = null) {
        if (!supabase) return null;
        const user = sessionUser || await getCurrentUser();
        if (!user) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (error) throw error;
            if (getSessionUserSync()?.id !== user.id) return null;
            return data;
        } catch (e) {
            console.error('[Supabase] Error al obtener el perfil del usuario:', e);
            return null;
        }
    }

    /**
     * Actualiza el perfil del usuario actual con sus datos predeterminados
     */
    async function updateUserProfile(profileData) {
        if (!supabase) return false;
        const user = await getCurrentUser();
        if (!user) return false;
        try {
            const editableData = window.SpaceLabProfileFields.sanitizeUpdate(profileData);
            if (Object.keys(editableData).length === 0) return true;
            const { error } = await supabase
                .from('profiles')
                .update(editableData)
                .eq('id', user.id);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('[Supabase] Error al actualizar el perfil del usuario:', e);
            throw e;
        }
    }

    let cachedEntitlements = null;
    let cachedEntitlementsUserId = null;

    /** Consulta las capacidades y plan comercial del usuario (RPC get_user_entitlements) */
    async function getUserEntitlements(forceRefresh = false, sessionUser = null) {
        if (!supabase) return { ok: false, plan: 'anonymous', features: {} };
        const user = sessionUser || await getCurrentUser();
        if (!forceRefresh && cachedEntitlements && cachedEntitlementsUserId === (user ? user.id : null)) {
            return cachedEntitlements;
        }
        try {
            const { data, error } = await supabase.rpc('get_user_entitlements');
            if (error) throw error;
            if (getSessionUserSync()?.id !== user?.id) return { ok: false, plan: 'unknown', features: {} };
            if (data && typeof data === 'object') {
                cachedEntitlements = data;
                cachedEntitlementsUserId = user ? user.id : null;
                return data;
            }
            return { ok: false, plan: 'unknown', features: {} };
        } catch (e) {
            console.warn('[Supabase] Error al consultar entitlements:', e);
            return { ok: false, plan: 'fallback', features: { 'session.generate': true } };
        }
    }

    /**
     * Lee la sesión persistida sin hacer una solicitud de red. Se usa solo
     * para decidir la vista inicial; Supabase mantiene la autorización real
     * en las consultas y funciones posteriores.
     */
    async function getSessionUser() {
        const syncUser = getSessionUserSync();
        if (syncUser) return syncUser;
        if (!supabase) return null;
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) return getSessionUserSync();
            if (data?.session?.user) {
                _cachedUser = data.session.user;
                _cachedSession = data.session;
                return _cachedUser;
            }
            return getSessionUserSync();
        } catch (err) {
            console.warn('[SupabaseClient] No se pudo leer la sesión local:', err);
            return getSessionUserSync();
        }
    }

    /** Devuelve el codigo del plan comercial; nunca lo infiere desde el wallet. */
    async function getCommercialPlan(forceRefresh = false, sessionUser = null) {
        const entitlements = await getUserEntitlements(forceRefresh, sessionUser);
        const plan = typeof entitlements?.plan === 'string' ? entitlements.plan.trim() : '';
        if (entitlements?.ok !== true || !plan || ['anonymous', 'unknown', 'fallback'].includes(plan)) {
            return null;
        }
        return plan;
    }

    /** Read-only view of the authenticated user's AI wallet. */
    async function getAiCreditBalance(sessionUser = null) {
        if (!supabase) return null;
        const user = sessionUser || await getCurrentUser();
        if (!user) return null;
        const { data, error } = await supabase
            .from('ai_credit_wallets')
            .select('balance, updated_at')
            .eq('user_id', user.id)
            .maybeSingle();
        if (error) throw error;
        if (getSessionUserSync()?.id !== user.id) return null;
        return data ? {
            balance: Number(data.balance) || 0,
            updatedAt: data.updated_at
        } : null;
    }

    /** Read-only recent usage; costs are always decided by PostgreSQL. */
    async function getAiUsage(limit = 20) {
        if (!supabase) return [];
        const user = await getCurrentUser();
        if (!user) return [];
        const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
        const { data, error } = await supabase
            .from('ai_usage')
            .select('request_id, action, provider, model, credits, status, input_tokens, output_tokens, created_at, completed_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(safeLimit);
        if (error) throw error;
        return data || [];
    }

    async function refreshAiCreditBalance() {
        const wallet = await getAiCreditBalance();
        window.dispatchEvent(new CustomEvent('spacelab:aicredits', { detail: wallet }));
        return wallet;
    }

    /**
     * Sube una imagen de logo al bucket 'logos'
     */
    async function uploadLogo(file) {
        if (!supabase) throw new Error('Supabase no inicializado');
        const user = await getCurrentUser();
        if (!user) throw new Error('Debes iniciar sesión para subir logos');

        const allowedTypes = new Map([
            ['image/png', 'png'],
            ['image/jpeg', 'jpg'],
            ['image/webp', 'webp']
        ]);
        const fileExt = allowedTypes.get(file.type);
        if (!fileExt) throw new Error('Formato de logo no permitido.');
        if (file.size > 5 * 1024 * 1024) throw new Error('El logo supera el límite de 5 MB.');
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        
        const { error } = await supabase.storage
            .from('logos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Obtener la URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('logos')
            .getPublicUrl(fileName);

        return publicUrl;
    }

    /**
     * Lista todos los logos subidos en el storage
     */
    async function listLogos() {
        if (!supabase) return [];
        try {
            const user = await getCurrentUser();
            if (!user) return [];
            const { data, error } = await supabase.storage
                .from('logos')
                .list(user.id, {
                    limit: 50,
                    sortBy: { column: 'name', order: 'desc' }
                });

            if (error) throw error;
            if (getSessionUserSync()?.id !== user.id) return [];

            return (data || []).map(file => {
                const { data: { publicUrl } } = supabase.storage
                    .from('logos')
                    .getPublicUrl(`${user.id}/${file.name}`);
                return {
                    name: file.name,
                    url: publicUrl
                };
            });
        } catch (e) {
            console.warn('[Supabase] Error al listar logos del storage:', e);
            return [];
        }
    }

    /**
     * Obtiene la lista de alumnos registrados para un nivel, grado y sección.
     */
    async function getAlumnos(nivel, grado, seccion) {
        if (!supabase) return [];
        const user = await getCurrentUser();
        if (!user) return [];
        try {
            const { data, error } = await supabase
                .from('alumnos')
                .select('nombre_completo')
                .eq('user_id', user.id)
                .eq('nivel', nivel)
                .eq('grado', grado)
                .eq('seccion', seccion)
                .order('nombre_completo', { ascending: true });
            if (error) throw error;
            if (getSessionUserSync()?.id !== user.id) return [];
            return (data || []).map(r => r.nombre_completo);
        } catch (e) {
            console.error('[Supabase] Error al obtener alumnos:', e);
            return [];
        }
    }

    /**
     * Reemplaza la lista de alumnos para un nivel, grado y sección.
     */
    async function saveAlumnos(nivel, grado, seccion, nombresArray) {
        if (!supabase) return false;
        const user = await getCurrentUser();
        if (!user) throw new Error('Debes iniciar sesión para guardar alumnos');
        try {
            const nombres = [...new Set(nombresArray.map(nombre => nombre.trim()).filter(Boolean))];
            const { error } = await supabase.rpc('replace_alumnos_roster', {
                p_nivel: nivel,
                p_grado: grado,
                p_seccion: seccion,
                p_nombres: nombres
            });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('[Supabase] Error al guardar alumnos:', e);
            throw e;
        }
    }

    /**
     * Suscribe un callback a cambios de estado de sesión (login, token refresh, logout).
     */
    function onAuthStateChange(callback) {
        if (!supabase?.auth?.onAuthStateChange) return { data: { subscription: null } };
        return supabase.auth.onAuthStateChange(callback);
    }

    return {
        get client() { return supabase; },
        onAuthStateChange,
        signUp,
        signIn,
        sendOtp,
        verifyOtp,
        logout,
        requestPasswordReset,
        updateRecoveredPassword,
        isPasswordRecoveryPending: () => _passwordRecoveryPending,
        getCurrentUser,
        getSessionUser,
        getSessionUserSync,
        invokeFunction,
        getUserRole,
        getSessionsCloud,
        saveSessionCloud,
        deleteSessionCloud,
        getPlanningRecordsCloud,
        savePlanningRecordCloud,
        logAction,
        getUserProfile,
        updateUserProfile,
        getUserEntitlements,
        getCommercialPlan,
        getAiCreditBalance,
        getAiUsage,
        refreshAiCreditBalance,
        uploadLogo,
        listLogos,
        getAlumnos,
        saveAlumnos
    };
})();
