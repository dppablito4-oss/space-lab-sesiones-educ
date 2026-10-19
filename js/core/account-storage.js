/** Local account boundaries. Legacy keys remain in the guest workspace only. */
const AccountStorage = (() => {
    'use strict';

    function userId(client) {
        return client?.getSessionUserSync?.()?.id || null;
    }

    function key(base, ownerId) {
        return ownerId ? `${base}:user:${encodeURIComponent(ownerId)}` : base;
    }

    function assertCurrent(client, ownerId) {
        if (userId(client) !== ownerId) {
            throw new Error('La cuenta cambió. Vuelve a abrir el documento desde tu espacio.');
        }
    }

    return { userId, key, assertCurrent };
})();

if (typeof window !== 'undefined') window.AccountStorage = AccountStorage;
if (typeof module !== 'undefined' && module.exports) module.exports = AccountStorage;
