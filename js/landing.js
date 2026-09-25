/* ═══════════════════════════════════════════════════
   LANDING ROUTER — Navegación y Detección de Sesión
   Space Lab — Sesiones Educativas
   ═══════════════════════════════════════════════════ */

window.LandingRouter = (() => {
    let landingView = null;
    let appView = null;

    async function init() {
        landingView = document.getElementById('landing-view');
        appView = document.getElementById('app-view');

        if (!landingView || !appView) {
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

        // Enlaces para abrir login desde la landing
        document.querySelectorAll('[data-action="open-login"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.AuthUi && typeof window.AuthUi.openModal === 'function') {
                    window.AuthUi.openModal();
                }
            });
        });

        // Escuchar cambios de hash en la URL (#/app o #/landing)
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (hash === '#/app' || hash === '#/editor') {
                showApp(false);
            } else if (hash === '#/landing' || hash === '#/' || hash === '') {
                // Solo si el usuario explícitamente navegó a landing
                if (hash === '#/landing') {
                    showLanding();
                }
            }
        });
    }

    async function checkRoute() {
        const hash = window.location.hash;
        const isAutomation = Boolean(navigator.webdriver);

        // 1. Si es test automatizado o la URL pide explícitamente el editor
        if (isAutomation || hash === '#/app' || hash === '#/editor') {
            showApp(false);
            return;
        }

        // 2. Si el usuario ya inició sesión con Supabase, salta directo al editor
        if (window.SupabaseClient && typeof window.SupabaseClient.getCurrentUser === 'function') {
            try {
                const user = await window.SupabaseClient.getCurrentUser();
                if (user) {
                    showApp(false);
                    return;
                }
            } catch (err) {
                console.warn('[LandingRouter] No se pudo verificar la sesión:', err);
            }
        }

        // 3. Si en esta pestaña ya había decidido entrar al editor
        if (sessionStorage.getItem('spacelab_view') === 'app') {
            showApp(false);
            return;
        }

        // 4. Si es visitante nuevo no autenticado, mostrar Landing Page
        showLanding();
    }

    function showLanding() {
        if (!landingView || !appView) return;
        landingView.classList.remove('hidden');
        appView.classList.add('hidden');
        sessionStorage.setItem('spacelab_view', 'landing');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showApp(updateHash = true) {
        if (!landingView || !appView) return;
        landingView.classList.add('hidden');
        appView.classList.remove('hidden');
        sessionStorage.setItem('spacelab_view', 'app');
        if (updateHash && window.location.hash !== '#/app') {
            window.location.hash = '#/app';
        }
    }

    function onLogout() {
        sessionStorage.removeItem('spacelab_view');
        showLanding();
    }

    return {
        init,
        showLanding,
        showApp,
        onLogout
    };
})();
