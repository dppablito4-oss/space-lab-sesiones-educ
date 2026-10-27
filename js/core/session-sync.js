/** Session content and revision metadata. Revisions always belong to a specific snapshot. */
const SessionSync = (() => {
    'use strict';
    const newId = () => globalThis.crypto?.randomUUID?.()
        || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    function data(session) {
        const copy = JSON.parse(JSON.stringify(session));
        delete copy._cloudSync;
        delete copy.synced;
        delete copy.lastSaved;
        copy.deleted_at = copy.deleted_at || null;
        copy.template = copy.template || 'estandar';
        return copy;
    }
    function sorted(value) {
        if (Array.isArray(value)) return value.map(sorted);
        if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])]));
        return value;
    }
    function same(a, b) { return JSON.stringify(sorted(data(a))) === JSON.stringify(sorted(data(b))); }
    function prepare(session, ownerId) {
        if (!ownerId) return session;
        if (session._cloudSync?.ownerId !== ownerId || session._cloudSync?.documentId !== session.id) {
            session._cloudSync = {ownerId, documentId: session.id, version: null, branchId: newId()};
        }
        return session;
    }
    function fromRow(row, ownerId) {
        return {...row.session_data, id: row.id, lastSaved: row.last_saved, deleted_at: row.deleted_at, synced: true,
            _cloudSync: {ownerId, documentId: row.id, version: row.last_saved, branchId: newId()}};
    }
    function beginEdit(session, ownerId) {
        prepare(session, ownerId);
        if (session._cloudSync) session._cloudSync = {...session._cloudSync, branchId: newId()};
        return session;
    }
    function nextVersion(previous) {
        return new Date(Math.max(Date.now(), (Date.parse(previous) || 0) + 1)).toISOString();
    }
    return {newId, data, same, prepare, fromRow, beginEdit, nextVersion};
})();
if (typeof window !== 'undefined') window.SessionSync = SessionSync;
if (typeof module !== 'undefined' && module.exports) module.exports = SessionSync;
