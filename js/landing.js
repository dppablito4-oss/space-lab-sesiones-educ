/* ═══════════════════════════════════════════════════
   LANDING ROUTER — Navegación y Detección de Sesión
   Space Lab — Sesiones Educativas
   ═══════════════════════════════════════════════════ */

window.LandingRouter = (() => {
    let landingView = null;
    let homeView = null;
    let appView = null;
    let routeRequest = 0;

    async function init() {
        landingView = document.getElementById('landing-view');
        homeView = document.getElementById('home-view');
        appView = document.getElementById('app-view');

        if (!landingView || !homeView || !appView) {
            return;
        }

        bindEvents();
        await checkRoute();
    }

    function bindEvents() {
        // Enlaces de entrar a la plataforma / editor
        document.querySelectorAll('[data-action="enter-app"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showApp(true);
            });
        });

        // Enlace para volver a la presentación
        document.querySelectorAll('[data-action="view-landing"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showLanding();
            });
        });

        document.querySelectorAll('[data-action="view-home"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.hash = '#/home';
            });
        });

        // Enlaces para abrir login desde la landing
        document.querySelectorAll('[data-action="open-login"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.AuthUi && typeof window.AuthUi.openModal === 'function') {
                    window.AuthUi.openModal();
                }
            });
        });

        // Smooth scroll a secciones internas de la landing (#como-funciona, #modelos-ia, etc.)
        landingView.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#') && !href.startsWith('#/')) {
                    const targetId = href.substring(1);
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                        e.preventDefault();
                        targetEl.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });

        window.addEventListener('hashchange', checkRoute);
    }

    async function checkRoute() {
        const requestId = ++routeRequest;
        const hash = window.location.hash;
        const isAutomation = Boolean(navigator.webdriver);

        // 1. Si es test automatizado o la URL pide explícitamente el editor
        if (isAutomation || hash === '#/app' || hash === '#/editor' || hash === '#/sessions/new' || /^#\/sessions\/[^/]+\/edit$/.test(hash)) {
            showApp(false);
            activateEditorRoute(hash);
            return;
        }

        if (hash === '#/landing') {
            showLanding(false);
            return;
        }

        // 2. Mi espacio y la biblioteca requieren una cuenta autenticada.
        if (window.SupabaseClient && typeof window.SupabaseClient.getCurrentUser === 'function') {
            try {
                const user = await window.SupabaseClient.getCurrentUser();
                if (requestId !== routeRequest) return;
                if (user) {
                    showHome(false, { scrollToSessions: hash === '#/sessions' });
                    return;
                }
            } catch (err) {
                console.warn('[LandingRouter] No se pudo verificar la sesión:', err);
            }
        }

        if (hash === '#/home' || hash === '#/sessions') {
            showLanding(false);
            window.AuthUi?.openModal?.();
            return;
        }

        // 3. Si en esta pestaña ya había decidido entrar al editor
        if (sessionStorage.getItem('spacelab_view') === 'app') {
            showApp(false);
            return;
        }

        // 4. Si es visitante nuevo no autenticado, mostrar Landing Page
        showLanding();
    }

    function setBodyView(view) {
        document.body.classList.toggle('landing-active', view === 'landing');
        document.documentElement.classList.toggle('landing-active', view === 'landing');
        document.body.classList.toggle('home-active', view === 'home');
        document.documentElement.classList.toggle('home-active', view === 'home');
    }

    function showLanding(updateHash = true) {
        if (!landingView || !homeView || !appView) return;
        landingView.classList.remove('hidden');
        homeView.classList.add('hidden');
        appView.classList.add('hidden');
        setBodyView('landing');
        sessionStorage.setItem('spacelab_view', 'landing');
        landingView.scrollTop = 0;
        window.scrollTo({ top: 0 });
        if (updateHash && window.location.hash !== '#/landing') window.location.hash = '#/landing';
    }

    function showHome(updateHash = true, options = {}) {
        if (!landingView || !homeView || !appView) return;
        landingView.classList.add('hidden');
        homeView.classList.remove('hidden');
        appView.classList.add('hidden');
        setBodyView('home');
        sessionStorage.setItem('spacelab_view', 'home');
        if (updateHash && window.location.hash !== '#/home') window.location.hash = '#/home';
        window.SpaceLabHome?.refresh?.(options);
    }

    function showApp(updateHash = true, targetHash = '#/app') {
        if (!landingView || !homeView || !appView) return;
        landingView.classList.add('hidden');
        homeView.classList.add('hidden');
        appView.classList.remove('hidden');
        setBodyView('app');
        sessionStorage.setItem('spacelab_view', 'app');
        if (updateHash && window.location.hash !== targetHash) {
            window.location.hash = targetHash;
        }
    }

    function activateEditorRoute(hash) {
        if (hash === '#/sessions/new') {
            window.setTimeout(() => window.appStartNewSession?.(), 0);
            return;
        }
        const match = hash.match(/^#\/sessions\/([^/]+)\/edit$/);
        if (match) {
            const sessionId = decodeURIComponent(match[1]);
            window.setTimeout(() => window.appOpenSession?.(sessionId), 0);
        }
    }

    function openNewSession() {
        if (window.location.hash === '#/sessions/new') {
            showApp(false);
            activateEditorRoute('#/sessions/new');
        } else {
            window.location.hash = '#/sessions/new';
        }
    }

    function openSession(sessionId) {
        if (!sessionId) return;
        const hash = `#/sessions/${encodeURIComponent(sessionId)}/edit`;
        if (window.location.hash === hash) {
            showApp(false);
            activateEditorRoute(hash);
        } else {
            window.location.hash = hash;
        }
    }

    function onLogout() {
        sessionStorage.removeItem('spacelab_view');
        showLanding(true);
    }

    return {
        init,
        showLanding,
        showHome,
        showApp,
        openNewSession,
        openSession,
        onLogout
    };
})();
