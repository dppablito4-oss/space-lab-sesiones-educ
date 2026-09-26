/* ═══════════════════════════════════════════════════
   ADMIN.JS — Controlador del Panel Maestro
   Space Lab — Sesiones Educativas
   ═══════════════════════════════════════════════════ */

; (function () {
    'use strict';

    if (!window.SpaceLabUtils) throw new Error('No se cargaron las utilidades base de Space Lab.');
    const {
        escapeHtml: escHTML,
        escapeAttribute: escAttr,
        formatDate
    } = window.SpaceLabUtils;

    // ─── AUTHENTICATION CHECK admin super admin ───
    async function checkAdminAuth() {
        if (!window.SupabaseClient) {
            alert('Supabase no está configurado');
            window.location.href = 'index.html';
            return;
        }

        try {
            const user = await SupabaseClient.getCurrentUser();
            if (!user) {
                window.location.href = 'index.html';
                return;
            }

            const role = await SupabaseClient.getUserRole(user.id);
            if (role !== 'superadmin' && role !== 'admin') {
                alert('No tienes permisos de administrador para ver esta página');
                window.location.href = 'index.html';
                return;
            }

            // Mostrar el email del admin
            document.getElementById('admin-user-email').textContent = user.email;

            // Iniciar aplicación
            initAdmin();
        } catch (e) {
            console.error('[Admin] Error en autenticación:', e);
            window.location.href = 'index.html';
        }
    }

    // ─── ADMIN SYSTEM ───
    function initAdmin() {
        bindTabEvents();
        bindFormEvents();

        // Cargar primera tab
        loadTabData('smtp');

        // Logout
        document.getElementById('btn-admin-logout').addEventListener('click', async () => {
            const confirmed = await ConfirmDialog.show({
                title: '¿Cerrar sesión de Admin?',
                message: 'Se cerrará la sesión de administrador.',
                confirmText: 'Cerrar Sesión'
            });

            if (confirmed) {
                await SupabaseClient.logout();
                window.location.href = 'index.html';
            }
        });
    }

    // Navegación de Pestañas
    function bindTabEvents() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;

                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.add('hidden'));

                btn.classList.add('active');
                document.getElementById(`tab-${targetTab}`).classList.remove('hidden');

                // Cargar datos al cambiar de tab
                loadTabData(targetTab);
            });
        });

        // Botones de actualización
        document.getElementById('btn-refresh-logs').addEventListener('click', () => loadTabData('logs'));
        document.getElementById('btn-refresh-sessions').addEventListener('click', () => loadTabData('sessions'));
        document.getElementById('btn-refresh-credits').addEventListener('click', () => loadTabData('credits'));
        document.getElementById('btn-search-credits').addEventListener('click', fetchCreditAccounts);
        document.getElementById('credit-search').addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                fetchCreditAccounts();
            }
        });
    }

    // Carga de datos correspondientes a cada pestaña
    function loadTabData(tabName) {
        switch (tabName) {
            case 'smtp':
                fetchSmtpConfig();
                break;
            case 'logs':
                fetchSecurityLogs();
                break;
            case 'sessions':
                fetchServerSessions();
                break;
            case 'credits':
                fetchCreditAccounts();
                break;
        }
    }

    // ─── AI CREDIT MANAGEMENT ───
    async function fetchCreditAccounts() {
        const tbody = document.getElementById('credits-tbody');
        const search = document.getElementById('credit-search').value.trim();
        tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Cargando cuentas...</td></tr>';

        try {
            const { data, error } = await SupabaseClient.client.rpc('admin_list_ai_credit_accounts', {
                p_search: search,
                p_limit: 100
            });
            if (error) throw error;

            const accounts = Array.isArray(data) ? data : [];
            if (accounts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No se encontraron cuentas</td></tr>';
                return;
            }

            tbody.innerHTML = accounts.map(account => `
                <tr>
                    <td>
                        <span class="credit-account-email">${escHTML(account.email || 'Sin correo')}</span>
                        <span class="credit-account-meta">${escHTML(account.username || 'sin usuario')} · ${escHTML(account.user_id)}</span>
                    </td>
                    <td><span class="badge badge-info">${escHTML(account.role || 'user')}</span></td>
                    <td>${escHTML(account.plan_id || 'free')}</td>
                    <td><strong>${Number(account.balance) || 0}</strong></td>
                    <td>
                        <input class="form-select credit-balance-input" type="number" min="0" max="1000000"
                            step="1" value="${Number(account.balance) || 0}" data-user-id="${escAttr(account.user_id)}"
                            aria-label="Nuevo saldo para ${escAttr(account.email || account.user_id)}">
                    </td>
                    <td>
                        <button class="btn btn-primary btn-sm btn-save-credits" data-user-id="${escAttr(account.user_id)}"
                            data-email="${escAttr(account.email || account.user_id)}">Guardar</button>
                    </td>
                </tr>
            `).join('');

            tbody.querySelectorAll('.btn-save-credits').forEach(button => {
                button.addEventListener('click', () => setAccountCredits(button));
            });
        } catch (error) {
            console.error('[Admin] Error al cargar créditos:', error);
            Toast.error('Error al cargar créditos: ' + error.message);
            tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No se pudieron cargar las cuentas</td></tr>';
        }
    }

    async function setAccountCredits(button) {
        const userId = button.dataset.userId;
        const email = button.dataset.email;
        const input = document.querySelector(`.credit-balance-input[data-user-id="${CSS.escape(userId)}"]`);
        const balance = Number(input?.value);
        if (!Number.isInteger(balance) || balance < 0 || balance > 1000000) {
            Toast.warning('El saldo debe ser un número entero entre 0 y 1 000 000.');
            input?.focus();
            return;
        }

        const confirmed = await ConfirmDialog.show({
            title: 'Actualizar créditos de IA',
            message: `Se establecerá el saldo de ${email} en ${balance} créditos.`,
            confirmText: 'Actualizar saldo',
            cancelText: 'Cancelar'
        });
        if (!confirmed) return;

        button.disabled = true;
        button.textContent = 'Guardando...';
        try {
            const { data, error } = await SupabaseClient.client.rpc('admin_set_ai_credits', {
                p_user_id: userId,
                p_balance: balance,
                p_reason: 'Actualización manual desde Panel Maestro'
            });
            if (error) throw error;
            if (!data?.ok) throw new Error(data?.message || data?.code || 'No se pudo actualizar el saldo.');
            Toast.success(`Saldo actualizado: ${data.balance} créditos.`);
            await fetchCreditAccounts();
        } catch (error) {
            console.error('[Admin] Error al actualizar créditos:', error);
            Toast.error('Error al actualizar créditos: ' + error.message);
            button.disabled = false;
            button.textContent = 'Guardar';
        }
    }

    // ─── SMTP CONFIGURATION ───
    async function fetchSmtpConfig() {
        try {
            const { data, error } = await SupabaseClient.client.functions.invoke('pablito-mailer', {
                body: { action: 'GET_SMTP_CONFIG', payload: {} }
            });

            if (error) throw error;

            if (data) {
                document.getElementById('smtp-email').value = data.smtp_email || '';
                document.getElementById('smtp-host').value = data.smtp_host || 'smtp.gmail.com';
                document.getElementById('smtp-port').value = data.smtp_port || 465;
                document.getElementById('smtp-secure').checked = data.smtp_secure !== undefined ? data.smtp_secure : true;
            }
        } catch (e) {
            console.error('[Admin] Error al cargar configuración SMTP:', e);
        }
    }

    // ─── AUDIT SECURITY LOGS ───
    async function fetchSecurityLogs() {
        const tbody = document.getElementById('logs-tbody');
        tbody.innerHTML = '<tr><td colspan="4" class="table-empty">Cargando registros...</td></tr>';

        try {
            const { data, error } = await SupabaseClient.client
                .from('security_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="table-empty">No hay logs registrados</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(log => `
                <tr>
                    <td style="white-space: nowrap;">${formatDate(log.created_at)}</td>
                    <td style="font-family: var(--font-mono); font-size: 0.8rem;">${log.user_id || 'Sistema/Anónimo'}</td>
                    <td><span class="badge ${getLogBadgeClass(log.action)}">${escHTML(log.action)}</span></td>
                    <td>${escHTML(log.details)}</td>
                </tr>
            `).join('');

        } catch (e) {
            Toast.error('Error al cargar logs: ' + e.message);
            tbody.innerHTML = '<tr><td colspan="4" class="table-empty" style="color: var(--danger);">Error al cargar registros</td></tr>';
        }
    }

    // ─── SESSIONS MONITORING ───
    async function fetchServerSessions() {
        const tbody = document.getElementById('sessions-tbody');
        tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Cargando sesiones...</td></tr>';

        try {
            // 1. Limpieza automática en la base de datos de sesiones eliminadas hace más de 7 días
            const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            await SupabaseClient.client
                .from('sesiones')
                .delete()
                .not('deleted_at', 'is', null)
                .lt('deleted_at', cutoffDate);

            // 2. Obtenemos todas las sesiones
            const { data: sessions, error: sesError } = await SupabaseClient.client
                .from('sesiones')
                .select('*')
                .order('last_saved', { ascending: false });

            if (sesError) throw sesError;

            // 3. Obtenemos perfiles de usuario para traducir user_id a email
            const { data: profiles, error: profError } = await SupabaseClient.client
                .from('profiles')
                .select('id, email');

            const profileMap = new Map();
            if (!profError && profiles) {
                profiles.forEach(p => profileMap.set(p.id, p.email));
            }

            if (!sessions || sessions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No hay sesiones guardadas en el servidor</td></tr>';
                return;
            }

            tbody.innerHTML = sessions.map(s => {
                const email = profileMap.get(s.user_id) || s.user_id;
                const metadata = s.session_data?.metadata || {};

                let statusHtml = '';
                let actionsHtml = '';

                if (s.deleted_at) {
                    const delDate = new Date(s.deleted_at);
                    const expireDate = new Date(delDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                    const msLeft = expireDate.getTime() - Date.now();
                    const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

                    statusHtml = `<span class="badge badge-danger">Papelera (${daysLeft}d)</span>`;

                    actionsHtml = `
                        <button class="btn btn-ghost btn-sm btn-preview" data-id="${escAttr(s.id)}" title="Previsualizar sesión">Ver</button>
                        <button class="btn btn-ghost btn-sm btn-inspect" data-id="${escAttr(s.id)}" title="Ver JSON de la sesión">JSON</button>
                        <button class="btn btn-ghost btn-sm btn-restore-session" data-id="${escAttr(s.id)}" style="color: #10b981; border-color: rgba(16, 185, 129, 0.2);" title="Restaurar sesión">Restaurar</button>
                        <button class="btn btn-danger-ghost btn-sm btn-purge-session" data-id="${escAttr(s.id)}" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.2);" title="Eliminar permanentemente">Purgar</button>
                    `;
                } else {
                    statusHtml = '<span class="badge badge-success">Activa</span>';

                    actionsHtml = `
                        <button class="btn btn-ghost btn-sm btn-preview" data-id="${escAttr(s.id)}" title="Previsualizar sesión">Ver</button>
                        <button class="btn btn-ghost btn-sm btn-inspect" data-id="${escAttr(s.id)}" title="Ver JSON de la sesión">JSON</button>
                        <button class="btn btn-danger-ghost btn-sm btn-delete-session" data-id="${escAttr(s.id)}" style="color: #f97316; border-color: rgba(249, 115, 22, 0.2);" title="Enviar a papelera">Eliminar</button>
                    `;
                }

                return `
                    <tr style="${s.deleted_at ? 'opacity: 0.65; background: rgba(255,255,255,0.01);' : ''}">
                        <td style="font-family: var(--font-mono); font-size: 0.75rem;">${escHTML(s.id)}</td>
                        <td title="${escAttr(s.user_id)}">${escHTML(email)}</td>
                        <td>${escHTML(metadata.area || 'Sin Área')} / ${escHTML(metadata.grado || 'Sin Grado')}</td>
                        <td><strong>${escHTML(s.titulo || 'Sin Título')}</strong></td>
                        <td>${formatDate(s.last_saved)}</td>
                        <td style="text-align: center;">${statusHtml}</td>
                        <td>
                            <div style="display: flex; gap: 4px; justify-content: center;">
                                ${actionsHtml}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Vincular evento de inspección
            tbody.querySelectorAll('.btn-inspect').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const session = sessions.find(s => s.id === id);
                    if (session) {
                        inspectSessionJSON(session);
                    }
                });
            });

            // Vincular evento de previsualización
            tbody.querySelectorAll('.btn-preview').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const session = sessions.find(s => s.id === id);
                    if (session) {
                        previewSessionHtml(session);
                    }
                });
            });

            // Vincular evento de eliminación (soft-delete)
            tbody.querySelectorAll('.btn-delete-session').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    deleteServerSession(id, false);
                });
            });

            // Vincular evento de restauración
            tbody.querySelectorAll('.btn-restore-session').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    restoreServerSession(id);
                });
            });

            // Vincular evento de purga permanente
            tbody.querySelectorAll('.btn-purge-session').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    deleteServerSession(id, true);
                });
            });

        } catch (e) {
            Toast.error('Error al cargar sesiones: ' + e.message);
            tbody.innerHTML = '<tr><td colspan="6" class="table-empty" style="color: var(--danger);">Error al cargar sesiones</td></tr>';
        }
    }

    // Previsualizar la sesión en HTML con estilos e iframe aislado
    function previewSessionHtml(session) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.style.zIndex = '1000';

        overlay.innerHTML = `
            <div class="glass-card" style="width: 95%; max-width: 900px; height: 90vh; padding: 1.5rem; display: flex; flex-direction: column; position: relative; gap: 1rem;">
                <button id="btn-close-preview" class="btn btn-ghost btn-sm" style="position: absolute; top: 1rem; right: 1rem;" aria-label="Cerrar vista previa">Cerrar</button>
                <h3 style="margin-top: 0; margin-bottom: 0;">Previsualización de Sesión: ${escHTML(session.titulo || 'Sin Título')}</h3>
                
                <div style="flex: 1; border-radius: 8px; border: 1px solid var(--border); overflow: hidden; background: #ffffff;">
                    <iframe id="preview-iframe" sandbox="allow-same-origin" referrerpolicy="no-referrer" style="width: 100%; height: 100%; border: none;"></iframe>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.8rem; color: #a1a1aa;">Docente: ${escHTML(session.user_id)}</span>
                    <button id="btn-print-preview" class="btn btn-primary">Imprimir o guardar PDF</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const iframe = overlay.querySelector('#preview-iframe');
        const sessionData = session.session_data || {};
        const presentation = window.DocumentPresentation
            ? DocumentPresentation.normalize(sessionData.presentation || sessionData.design || {})
            : (sessionData.presentation || sessionData.design || {});
        const design = window.DocumentPresentation ? {
            themeColor: presentation.primaryColor,
            fontFamily: DocumentPresentation.toCss(presentation).fontFamily,
            fontSize: DocumentPresentation.toCss(presentation).fontSize,
            padding: DocumentPresentation.toCss(presentation).padding,
            lineHeight: presentation.lineHeight,
            headerBg: presentation.headerBackground
        } : presentation;
        const safeHtml = window.SpaceLabSanitizer
            ? SpaceLabSanitizer.sanitizeSessionHTML(sessionData.htmlContent || '')
            : '';
        const cssValue = (value, fallback) => escAttr(window.SpaceLabSanitizer
            ? SpaceLabSanitizer.sanitizeCssValue(value, fallback)
            : fallback);
        iframe.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${escHTML(session.titulo || 'Sesión de Aprendizaje')}</title>
                <link rel="stylesheet" href="css/style.css">
                <link rel="stylesheet" href="css/print.css" media="print">
                <style>
                    body {
                        background: #f1f5f9;
                        padding: 20px;
                        display: flex;
                        justify-content: center;
                        font-family: Arial, sans-serif;
                    }
                    .session-sheet {
                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                        background-color: #ffffff;
                        width: 100%;
                        max-width: 800px;
                    }
                    .no-print {
                        display: none !important;
                    }
                </style>
            </head>
            <body>
                <div class="session-sheet" style="--theme-border-color: ${cssValue(design.themeColor, '#000000')}; --session-font-family: ${cssValue(design.fontFamily, 'Arial, sans-serif')}; --session-font-size: ${cssValue(design.fontSize, '10pt')}; --session-cell-padding: ${cssValue(design.padding, '4px 6px')}; --session-line-height: ${cssValue(design.lineHeight, '1.4')}; --theme-label-bg: ${cssValue(design.headerBg, '#f1f5f9')};">
                    ${safeHtml || '<h3>No hay contenido HTML guardado para esta sesión</h3>'}
                </div>
            </body>
            </html>
        `;

        const close = () => document.body.removeChild(overlay);
        overlay.querySelector('#btn-close-preview').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        overlay.querySelector('#btn-print-preview').addEventListener('click', () => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        });
    }

    // Eliminar la sesión del servidor (soft-delete o purga hard-delete)
    async function deleteServerSession(id, forceHardDelete = false) {
        const title = forceHardDelete ? '¿Purgar permanentemente?' : '¿Enviar a Papelera?';
        const message = forceHardDelete
            ? `¿Estás seguro de que deseas eliminar permanentemente la sesión con ID: ${id}? Esta acción es irreversible.`
            : `¿Deseas enviar la sesión ${id} a la papelera? El docente no la verá pero se guardará por 7 días.`;
        const confirmText = forceHardDelete ? 'Purgar Todo' : 'Mandar a Papelera';

        const confirmed = await ConfirmDialog.show({
            title: title,
            message: message,
            confirmText: confirmText,
            cancelText: 'Cancelar'
        });

        if (!confirmed) return;

        try {
            if (forceHardDelete) {
                // Hard delete
                const { error } = await SupabaseClient.client
                    .from('sesiones')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                Toast.success('Sesión purgada permanentemente');
            } else {
                // Soft delete: actualizar deleted_at y last_saved en la DB
                const { error } = await SupabaseClient.client
                    .from('sesiones')
                    .update({
                        deleted_at: new Date().toISOString(),
                        last_saved: new Date().toISOString()
                    })
                    .eq('id', id);
                if (error) throw error;
                Toast.success('Sesión enviada a la papelera');
            }
            fetchServerSessions(); // Recargar lista
        } catch (e) {
            console.error('[Admin] Error al procesar eliminación:', e);
            Toast.error('Error al eliminar sesión: ' + e.message);
        }
    }

    // Restaurar sesión desde la papelera
    async function restoreServerSession(id) {
        const confirmed = await ConfirmDialog.show({
            title: '¿Restaurar Sesión?',
            message: `¿Deseas restaurar la sesión con ID: ${id}? Volverá a aparecer en la cuenta del docente de inmediato.`,
            confirmText: 'Restaurar',
            cancelText: 'Cancelar'
        });

        if (!confirmed) return;

        try {
            const { error } = await SupabaseClient.client
                .from('sesiones')
                .update({
                    deleted_at: null,
                    last_saved: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            Toast.success('Sesión restaurada con éxito');
            fetchServerSessions(); // Recargar lista
        } catch (e) {
            console.error('[Admin] Error al restaurar sesión:', e);
            Toast.error('Error al restaurar sesión: ' + e.message);
        }
    }

    // Mostrar ventana emergente/JSON de la sesión
    function inspectSessionJSON(session) {
        const jsonStr = JSON.stringify(session.session_data, null, 2);

        // Crear un modal temporal de visualización
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.style.zIndex = '1000';

        overlay.innerHTML = `
            <div class="glass-card" style="width: 90%; max-width: 700px; padding: 2rem; max-height: 80vh; display: flex; flex-direction: column; position: relative;">
                <button id="btn-close-inspect" class="btn btn-ghost btn-sm" style="position: absolute; top: 1rem; right: 1rem;" aria-label="Cerrar inspección">Cerrar</button>
                <h3 style="margin-top: 0; margin-bottom: 1rem;">Detalle de Sesión: ${escHTML(session.titulo || 'Sin Título')}</h3>
                <div style="flex: 1; overflow-y: auto; text-align: left; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 1rem; border: 1px solid var(--border);">
                    <pre style="font-family: var(--font-mono); font-size: 0.8rem; margin: 0; color: #a78bfa; white-space: pre-wrap; word-break: break-all;">${escHTML(jsonStr)}</pre>
                </div>
                <div style="margin-top: 1rem; display: flex; justify-content: flex-end; gap: var(--space-sm);">
                    <button id="btn-download-inspect" class="btn btn-primary">Descargar JSON</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Cerrar modal
        const close = () => document.body.removeChild(overlay);
        overlay.querySelector('#btn-close-inspect').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // Descargar JSON
        overlay.querySelector('#btn-download-inspect').addEventListener('click', () => {
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sesion_${session.titulo || 'sin_titulo'}_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Formularios de envío y guardado
    function bindFormEvents() {
        // Guardar SMTP
        const smtpForm = document.getElementById('smtp-form');
        const btnTogglePass = document.getElementById('btn-toggle-password');
        const smtpPass = document.getElementById('smtp-password');

        btnTogglePass.addEventListener('click', () => {
            if (smtpPass.type === 'password') {
                smtpPass.type = 'text';
                btnTogglePass.textContent = 'Ocultar';
                btnTogglePass.setAttribute('aria-label', 'Ocultar contraseña');
            } else {
                smtpPass.type = 'password';
                btnTogglePass.textContent = 'Mostrar';
                btnTogglePass.setAttribute('aria-label', 'Mostrar contraseña');
            }
        });

        smtpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('smtp-email').value.trim();
            const password = smtpPass.value.trim();
            const host = document.getElementById('smtp-host').value.trim();
            const port = parseInt(document.getElementById('smtp-port').value.trim(), 10);
            const secure = document.getElementById('smtp-secure').checked;

            if (!email || !password || !host || isNaN(port)) {
                Toast.warning('Completa todos los campos de SMTP');
                return;
            }

            const btnSave = document.getElementById('btn-save-smtp');
            btnSave.disabled = true;
            btnSave.textContent = 'Guardando...';

            try {
                const { error } = await SupabaseClient.client.functions.invoke('pablito-mailer', {
                    body: {
                        action: 'UPDATE_SMTP_CONFIG',
                        payload: { email, password, host, port, secure }
                    }
                });

                if (error) throw error;

                await SupabaseClient.logAction('SMTP_CONFIG_UPDATE', `Configuración SMTP actualizada para el remitente: ${email}`);
                Toast.success('¡Credenciales SMTP guardadas exitosamente en la base de datos!');
                smtpPass.value = ''; // Limpiar campo por seguridad
            } catch (e) {
                Toast.error('Error al guardar credenciales: ' + e.message);
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = 'Guardar credenciales SMTP';
            }
        });

        // Despachar Email Blast
        const blastForm = document.getElementById('blast-form');
        blastForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const target = document.getElementById('blast-target').value;
            const subject = document.getElementById('blast-subject').value.trim();
            const message = document.getElementById('blast-message').value.trim();

            if (!subject || !message) {
                Toast.warning('Asunto y Mensaje son obligatorios');
                return;
            }

            const confirmed = await ConfirmDialog.show({
                title: '¿Confirmar Envío Masivo?',
                message: 'Esta acción enviará este correo electrónico a TODOS los usuarios registrados de la aplicación. Esta acción no se puede deshacer.',
                confirmText: 'Enviar correos'
            });

            if (!confirmed) return;

            const btnFire = document.getElementById('btn-fire-blast');
            btnFire.disabled = true;
            btnFire.textContent = 'Despachando Correos...';

            try {
                console.log('[Admin] Invocando Edge Function pablito-mailer...');
                const { data, error } = await SupabaseClient.client.functions.invoke('pablito-mailer', {
                    body: {
                        action: 'MANUAL_BLAST',
                        payload: {
                            target: target,
                            subject: subject,
                            customHtml: message
                        }
                    }
                });

                if (error) throw error;

                await SupabaseClient.logAction('EMAIL_BLAST_SENT', `Despacho masivo enviado: ${subject}`);
                Toast.success(data?.message || '¡Oleada de correos enviada con éxito!');
                blastForm.reset();
            } catch (e) {
                Toast.error('Error al despachar correos: ' + e.message);
            } finally {
                btnFire.disabled = false;
                btnFire.textContent = 'Enviar correo masivo';
            }
        });
    }

    // Utilidades de diseño
    function getLogBadgeClass(action) {
        action = String(action || '');
        if (action.includes('SUCCESS') || action === 'LOGOUT') return 'badge-success';
        if (action.includes('FAIL') || action.includes('ERROR') || action.includes('INTRUSION')) return 'badge-danger';
        if (action.includes('UPDATE') || action.includes('DELETE')) return 'badge-warning';
        return 'badge-info';
    }

    // Iniciar verificación de autenticidad en la carga del documento
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAdminAuth);
    } else {
        checkAdminAuth();
    }

})();
