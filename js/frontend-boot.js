/* Shared controller boot and recovery for a missing React bundle. No second view tree. */
;(() => {
    'use strict';
    let loading = null;
    let queuedClick = null;
    document.addEventListener('click', event => {
        if (window.SpaceLabFrontend?.ready) return;
        const target = event.target.closest?.('button,[data-action],[data-home-action]');
        if (!target || !document.getElementById('frontend-root')?.contains(target)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        queuedClick = target;
    }, true);

    function start() {
        if (loading) return loading;
        loading = Promise.all(Array.from(document.querySelectorAll('script[type="application/x-spacelab-controller"]'), entry =>
            new Promise(resolve => {
                const script = document.createElement('script');
                script.src = entry.src;
                script.async = false;
                if (entry.crossOrigin) script.crossOrigin = entry.crossOrigin;
                script.onload = resolve;
                script.onerror = () => {
                    window.SpaceLabFrontend.failures.push(new URL(entry.src).pathname);
                    resolve();
                };
                document.head.appendChild(script);
            })
        )).then(() => {
            window.SpaceLabFrontend.ready = true;
            window.dispatchEvent(new CustomEvent('spacelab:frontend-ready'));
            const target = queuedClick;
            queuedClick = null;
            if (target?.isConnected) target.click();
        });
        return loading;
    }

    function textElement(tag, text, className) {
        const element = document.createElement(tag);
        element.textContent = String(text ?? '');
        if (className) element.className = className;
        return element;
    }

    function recover() {
        if (window.SpaceLabFrontend?.hydrated || window.SpaceLabFrontend?.mode === 'recovery') return;
        window.SpaceLabFrontend = {hydrated:false, ready:false, mode:'recovery', failures:['bundle-unavailable']};
        // Only dynamic regions need a small safe renderer during recovery. All
        // page markup is still the exact static output of the React components.
        window.SpaceLabReactUI = {
            sessions(items) {
                const target = document.getElementById('home-session-list');
                if (!target) return;
                target.replaceChildren(...items.map(item => {
                    const row = textElement('article', '', 'home-session-item');
                    row.appendChild(textElement('strong', item.title));
                    const button = textElement('button', 'Abrir', 'btn btn-ghost btn-sm');
                    button.type = 'button';
                    button.dataset.sessionId = item.id;
                    row.appendChild(button);
                    return row;
                }));
            },
            auth(state) {
                const target = document.getElementById('auth-header-container');
                if (!target) return;
                const button = textElement('button', state.signedIn ? 'Salir' : 'Iniciar sesión', 'btn btn-ghost btn-sm');
                button.type = 'button';
                button.id = state.signedIn ? 'btn-logout' : 'btn-login-trigger';
                button.addEventListener('click', state.signedIn ? state.onLogout : state.onLogin);
                target.replaceChildren(button);
            },
            toast(message, type = 'info', duration = 3500) {
                const notice = textElement('div', message, 'toast toast-' + type);
                notice.setAttribute('role', type === 'error' ? 'alert' : 'status');
                document.getElementById('toast-container')?.appendChild(notice);
                notice.addEventListener('click', () => notice.remove());
                setTimeout(() => notice.remove(), duration);
            }
        };
        const banner = textElement('div', 'La interfaz está en modo recuperación. Tus datos siguen disponibles. ', 'frontend-recovery');
        banner.setAttribute('role', 'status');
        const reload = textElement('button', 'Recargar', 'btn btn-ghost btn-sm');
        reload.type = 'button';
        reload.addEventListener('click', () => location.reload());
        banner.appendChild(reload);
        document.body.prepend(banner);
        void start();
    }

    window.SpaceLabControllerBoot = {start};
    window.addEventListener('error', event => {
        if (event.target instanceof HTMLScriptElement && /\/assets\/react-ui\/app\.js(?:\?|$)/.test(event.target.src)) recover();
    }, true);
    setTimeout(recover, 8000);
})();
