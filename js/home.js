/* Authenticated home for the Space Lab product workspace. */
window.SpaceLabHome = (() => {
    const RECENT_LIMIT = 5;
    let initialized = false;
    let showAllSessions = false;

    const PLAN_LABELS = {
        free: 'Gratuito',
        beta: 'Docente Beta',
        basic: 'Básico',
        pro: 'Profesional',
        premium: 'Premium',
        institutional: 'Institucional'
    };

    function byId(id) {
        return document.getElementById(id);
    }

    function escapeHTML(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function displayName(user, profile) {
        const preferred = profile?.docente || user?.user_metadata?.docente ||
            user?.user_metadata?.full_name || user?.user_metadata?.username;
        if (preferred && String(preferred).trim()) {
            return String(preferred).trim().split(/[._-]/).filter(Boolean)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        const emailPrefix = user?.email?.split('@')[0] || '';
        return emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : 'Docente';
    }

    function initials(name) {
        const parts = String(name || 'D').replace(/^Prof\.\s*/i, '').trim().split(/\s+/).filter(Boolean);
        return parts.length > 1
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();
    }

    function sessionMetadata(session) {
        return session?.metadata || session?.data?.metadata || {};
    }

    function sessionTitle(session) {
        return sessionMetadata(session).titulo || session?.titulo || 'Sesión sin título';
    }

    function sessionDescription(session) {
        const metadata = sessionMetadata(session);
        return [metadata.nivel, metadata.grado, metadata.area].filter(Boolean).join(' · ') || 'Planificación en progreso';
    }

    function formatSavedDate(value) {
        const date = new Date(value || 0);
        if (Number.isNaN(date.getTime())) return 'Sin fecha';
        return new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: 'short',
            year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
        }).format(date);
    }

    function getSessions() {
        if (!window.StorageManager?.getAllSessions) return [];
        return window.StorageManager.getAllSessions()
            .slice()
            .sort((a, b) => new Date(b.lastSaved || 0) - new Date(a.lastSaved || 0));
    }

    function renderSessions(sessions) {
        const container = byId('home-session-list');
        const toggle = byId('home-toggle-all-sessions');
        if (!container || !toggle) return;

        byId('home-session-count').textContent = String(sessions.length);
        toggle.classList.toggle('hidden', sessions.length <= RECENT_LIMIT);
        toggle.textContent = showAllSessions ? 'Ver recientes' : `Ver todas (${sessions.length})`;

        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="home-empty-sessions">
                    <span><svg class="ui-icon" aria-hidden="true"><use href="#icon-folder"></use></svg></span>
                    <h3>Aún no tienes sesiones guardadas</h3>
                    <p>Crea tu primera planificación y aparecerá aquí automáticamente.</p>
                    <button type="button" class="btn btn-primary btn-sm" data-home-action="new-session">Crear mi primera sesión</button>
                </div>`;
            return;
        }

        const visibleSessions = showAllSessions ? sessions : sessions.slice(0, RECENT_LIMIT);
        container.innerHTML = visibleSessions.map(session => `
            <article class="home-session-item">
                <div class="home-session-main">
                    <span class="home-session-symbol"><svg class="ui-icon" aria-hidden="true"><use href="#icon-file"></use></svg></span>
                    <div class="home-session-copy">
                        <strong>${escapeHTML(sessionTitle(session))}</strong>
                        <span>${escapeHTML(sessionDescription(session))}</span>
                    </div>
                </div>
                <div class="home-session-actions">
                    <time class="home-session-date" datetime="${escapeHTML(session.lastSaved || '')}">${escapeHTML(formatSavedDate(session.lastSaved))}</time>
                    <button type="button" class="btn btn-ghost btn-sm home-open-session" data-session-id="${escapeHTML(session.id)}">
                        Abrir <svg class="ui-icon" aria-hidden="true"><use href="#icon-arrow-right"></use></svg>
                    </button>
                </div>
            </article>`).join('');
    }

    function renderCurrentSession() {
        const current = window.StorageManager?.getCurrentSession?.();
        const continueButton = byId('home-continue-session');
        if (!continueButton) return;
        continueButton.classList.toggle('hidden', !current);
        if (current) continueButton.title = `Continuar: ${sessionTitle(current)}`;
    }

    function renderWallet(wallet) {
        const credits = byId('home-credit-count');
        const plan = byId('home-plan-name');
        const accountPlan = byId('home-account-plan');
        const planName = PLAN_LABELS[wallet?.planId] || wallet?.planId || 'Docente';
        if (credits) credits.textContent = wallet ? String(wallet.balance) : '--';
        if (plan) plan.textContent = planName;
        if (accountPlan) accountPlan.textContent = `Plan ${planName}`;
    }

    async function refresh(options = {}) {
        const homeView = byId('home-view');
        if (!homeView || homeView.classList.contains('hidden')) return;

        const sessionsRoute = window.location.hash === '#/sessions';
        homeView.querySelectorAll('.home-nav-link').forEach(link => {
            link.classList.toggle('active', sessionsRoute ? link.getAttribute('href') === '#/sessions' : link.getAttribute('href') === '#/home');
        });
        renderSessions(getSessions());
        renderCurrentSession();

        if (options.scrollToSessions) {
            requestAnimationFrame(() => byId('home-sessions-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        } else {
            homeView.scrollTo({ top: 0 });
        }

        try {
            const user = await window.SupabaseClient?.getCurrentUser?.();
            if (!user) return;
            const [profile, wallet] = await Promise.all([
                window.SupabaseClient.getUserProfile?.().catch(() => null),
                window.SupabaseClient.getAiCreditBalance?.().catch(() => null)
            ]);
            const name = displayName(user, profile);
            const firstName = name.split(/\s+/)[0];
            byId('home-welcome-title').textContent = `Hola, ${firstName}. ¿Qué planificamos hoy?`;
            byId('home-account-name').textContent = name;
            byId('home-account-name').title = user.email || '';
            byId('home-account-avatar').textContent = initials(name);
            renderWallet(wallet);
        } catch (error) {
            console.warn('[Mi espacio] No se pudo cargar todo el resumen:', error);
        }

    }

    async function handleLogout() {
        const confirmed = typeof ConfirmDialog !== 'undefined'
            ? await ConfirmDialog.show({
                title: '¿Cerrar sesión?',
                message: 'Tus sesiones guardadas seguirán disponibles cuando vuelvas a ingresar.',
                confirmText: 'Cerrar sesión'
            })
            : true;
        if (!confirmed) return;

        try {
            await window.SupabaseClient.logout();
            await window.AuthUi?.checkSessionState?.();
            if (typeof Toast !== 'undefined') Toast.info('Sesión cerrada');
            window.LandingRouter?.onLogout?.();
        } catch (error) {
            if (typeof Toast !== 'undefined') Toast.error(`No se pudo cerrar la sesión: ${error.message}`);
        }
    }

    function bindEvents() {
        byId('home-view')?.addEventListener('click', event => {
            const actionButton = event.target.closest('[data-home-action]');
            if (actionButton) {
                const action = actionButton.dataset.homeAction;
                if (action === 'new-session') window.LandingRouter?.openNewSession?.();
                if (action === 'continue-session') window.LandingRouter?.showApp?.(true);
                return;
            }

            const sessionButton = event.target.closest('[data-session-id]');
            if (sessionButton) window.LandingRouter?.openSession?.(sessionButton.dataset.sessionId);
        });

        byId('home-toggle-all-sessions')?.addEventListener('click', () => {
            showAllSessions = !showAllSessions;
            renderSessions(getSessions());
        });
        byId('home-logout')?.addEventListener('click', handleLogout);
        window.addEventListener('spacelab:aicredits', event => renderWallet(event.detail));
        window.addEventListener('spacelab:session-loaded', () => {
            renderSessions(getSessions());
            renderCurrentSession();
        });
    }

    function init() {
        if (initialized) return;
        initialized = true;
        bindEvents();
    }

    return { init, refresh };
})();
