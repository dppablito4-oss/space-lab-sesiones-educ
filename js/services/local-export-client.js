/** Network boundary for the optional local PDF/DOCX export engine. */
const LocalExportClient = (() => {
    'use strict';

    const DEFAULT_HOSTS = Object.freeze(['localhost:8000', '127.0.0.1:8000']);
    const EXPORT_ENDPOINTS = Object.freeze({ pdf: 'exportar-pdf-json', docx: 'exportar-docx-json' });

    function create(options = {}) {
        const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
        const hosts = options.hosts || DEFAULT_HOSTS;
        let activeHost = hosts[0];
        if (typeof fetchImpl !== 'function') throw new Error('LocalExportClient requiere una implementación de fetch.');

        async function findRunningHost() {
            for (const host of hosts) {
                try {
                    const response = await fetchImpl(`http://${host}/`, { method: 'GET' });
                    if (response.ok) {
                        activeHost = host;
                        return host;
                    }
                } catch {
                    // Continue with the next loopback alias.
                }
            }
            return null;
        }

        async function getStatus(token) {
            const host = await findRunningHost();
            if (!host) return { running: false, online: false, host: null, reason: 'unreachable' };
            if (!token) return { running: true, online: false, host, reason: 'missing-token' };

            try {
                const response = await fetchImpl(`http://${host}/verificar-token?token=${encodeURIComponent(token)}`, { method: 'GET' });
                if (!response.ok) return { running: true, online: false, host, reason: 'invalid-token' };
                const data = await response.json();
                const online = data?.status === 'Connected';
                return { running: true, online, host, reason: online ? null : 'invalid-token' };
            } catch {
                return { running: true, online: false, host, reason: 'verification-failed' };
            }
        }

        async function exportDocument(format, payload) {
            const endpoint = EXPORT_ENDPOINTS[format];
            if (!endpoint) throw new Error(`Formato de exportación no compatible: ${format}`);
            const response = await fetchImpl(`http://${activeHost}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                let detail = '';
                try {
                    const errorData = await response.json();
                    detail = errorData?.detail || '';
                } catch {
                    // The engine may return an empty or non-JSON error body.
                }
                throw new Error(detail || `Error del servidor: ${response.status} ${response.statusText || ''}`.trim());
            }
            return response.blob();
        }

        return { getStatus, exportDocument, getActiveHost: () => activeHost };
    }

    let defaultClient = null;
    function current() {
        if (!defaultClient) defaultClient = create();
        return defaultClient;
    }

    return {
        create,
        getStatus: token => current().getStatus(token),
        exportDocument: (format, payload) => current().exportDocument(format, payload),
        getActiveHost: () => current().getActiveHost()
    };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LocalExportClient;
if (typeof window !== 'undefined') window.LocalExportClient = LocalExportClient;
