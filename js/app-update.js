(function () {
    'use strict';

    const BUILD_META = 'app-build';
    const MANIFEST_PATH = 'app-version.json';
    const CHECK_INTERVAL_MS = 5 * 60 * 1000;
    const BANNER_ID = 'app-update-banner';
    const REQUESTED_BUILD_KEY = 'requested-app-build';
    const RELOAD_BUILD_PARAM = '_app_build';
    const RELOAD_NONCE_PARAM = '_app_refresh';
    const CHECK_TIMEOUT_MS = 8000;
    let checkInFlight = null;

    function sessionGet(key) {
        try { return sessionStorage.getItem(key); } catch (_error) { return null; }
    }

    function sessionSet(key, value) {
        try { sessionStorage.setItem(key, value); return true; } catch (_error) { return false; }
    }

    function sessionRemove(key) {
        try { sessionStorage.removeItem(key); } catch (_error) { /* Storage can be unavailable in privacy modes. */ }
    }

    function canonicalEntryUrl(value = window.location.href) {
        const url = new URL(value);
        url.pathname = url.pathname.replace(/\/index\.html$/i, '/');
        url.searchParams.delete('app_version');
        url.searchParams.delete(RELOAD_BUILD_PARAM);
        url.searchParams.delete(RELOAD_NONCE_PARAM);
        return url;
    }

    function normalizeEntryUrl() {
        const canonical = canonicalEntryUrl();
        if (canonical.toString() !== window.location.href && window.history?.replaceState) {
            window.history.replaceState(window.history.state, '', canonical.toString());
        }
    }

    function currentBuild() {
        return document.querySelector(`meta[name="${BUILD_META}"]`)?.content || '';
    }

    function manifestUrl() {
        const url = new URL(MANIFEST_PATH, document.baseURI);
        url.searchParams.set('_cache_bust', String(Date.now()));
        return url;
    }

    function reloadWithBuild(build) {
        try {
            sessionSet(REQUESTED_BUILD_KEY, build);
            const url = canonicalEntryUrl();
            // A query unique to this deployment forces CDNs and browser caches to
            // retrieve the new HTML. normalizeEntryUrl removes it after startup.
            url.searchParams.set(RELOAD_BUILD_PARAM, build);
            url.searchParams.set(RELOAD_NONCE_PARAM, String(Date.now()));
            window.location.replace(url.toString());
            return true;
        } catch (error) {
            console.warn('[App Update] No se pudo iniciar la recarga:', error);
            return false;
        }
    }

    function showUpdateBanner(build) {
        if (!build || document.getElementById(BANNER_ID)) return;
        if (sessionGet('dismissed-app-build') === build) return;

        const banner = document.createElement('section');
        banner.id = BANNER_ID;
        banner.setAttribute('role', 'status');
        banner.setAttribute('aria-live', 'polite');
        banner.style.cssText = [
            'position:fixed',
            'z-index:2147483647',
            'right:16px',
            'bottom:16px',
            'width:min(390px,calc(100vw - 32px))',
            'box-sizing:border-box',
            'padding:16px',
            'border:1px solid rgba(96,165,250,.45)',
            'border-radius:14px',
            'background:#111827',
            'color:#f8fafc',
            'box-shadow:0 18px 50px rgba(0,0,0,.38)',
            'font-family:Inter,Outfit,system-ui,-apple-system,sans-serif',
        ].join(';');

        const title = document.createElement('strong');
        title.textContent = 'Nueva versión disponible';
        title.style.cssText = 'display:block;margin-bottom:6px;font-size:15px';

        const message = document.createElement('p');
        message.textContent = 'Actualiza cuando hayas guardado tu trabajo para cargar las mejoras recientes.';
        message.style.cssText = 'margin:0 0 12px;color:#cbd5e1;font-size:13px;line-height:1.45';

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px';

        const laterButton = document.createElement('button');
        laterButton.type = 'button';
        laterButton.textContent = 'Más tarde';
        laterButton.style.cssText = 'padding:8px 12px;border:0;background:transparent;color:#cbd5e1;cursor:pointer';
        laterButton.addEventListener('click', function () {
            sessionSet('dismissed-app-build', build);
            banner.remove();
        });

        const updateButton = document.createElement('button');
        updateButton.type = 'button';
        updateButton.textContent = 'Actualizar ahora';
        updateButton.style.cssText = 'padding:8px 13px;border:0;border-radius:8px;background:#2563eb;color:white;font-weight:700;cursor:pointer';
        updateButton.addEventListener('click', function () {
            updateButton.disabled = true;
            updateButton.textContent = 'Actualizando…';
            if (!reloadWithBuild(build)) {
                updateButton.disabled = false;
                updateButton.textContent = 'Reintentar';
                message.textContent = 'No se pudo recargar. Tu trabajo sigue seguro; vuelve a intentarlo.';
                return;
            }
            window.setTimeout(() => {
                if (!document.getElementById(BANNER_ID)) return;
                updateButton.disabled = false;
                updateButton.textContent = 'Reintentar';
                message.textContent = 'La recarga está tardando. Tu trabajo sigue seguro; puedes reintentarlo.';
            }, 12000);
        });

        actions.append(laterButton, updateButton);
        banner.append(title, message, actions);
        document.body.appendChild(banner);
    }

    async function performUpdateCheck() {
        const localBuild = currentBuild();
        if (!localBuild) return;

        if (sessionGet(REQUESTED_BUILD_KEY) === localBuild) {
            sessionRemove(REQUESTED_BUILD_KEY);
        }

        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timeoutId = window.setTimeout(() => controller?.abort(), CHECK_TIMEOUT_MS);
        try {
            const response = await fetch(manifestUrl(), {
                cache: 'no-store',
                credentials: 'same-origin',
                headers: { 'Cache-Control': 'no-cache' },
                signal: controller?.signal,
            });
            if (!response.ok) return;

            const manifest = await response.json();
            const remoteBuild = typeof manifest.build === 'string' ? manifest.build : '';
            if (remoteBuild && remoteBuild !== localBuild) showUpdateBanner(remoteBuild);
        } catch (error) {
            console.debug('[App Update] No se pudo comprobar la versión:', error);
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    function checkForUpdate() {
        if (!checkInFlight) {
            checkInFlight = performUpdateCheck().finally(() => { checkInFlight = null; });
        }
        return checkInFlight;
    }

    function recoverFromPageRestore(event) {
        if (!event.persisted) return;
        document.getElementById('loader-overlay')?.classList.add('hidden');
        document.documentElement.classList.remove('app-updating');
        checkForUpdate();
    }

    normalizeEntryUrl();

    window.addEventListener('load', function () {
        window.setTimeout(checkForUpdate, 1500);
        window.setInterval(checkForUpdate, CHECK_INTERVAL_MS);
    });
    window.addEventListener('pageshow', recoverFromPageRestore);

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') checkForUpdate();
    });
})();
