const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Sync = require('../js/core/session-sync.js');

const rows = new Map();
let writes = 0, loseReply = false;
function client(owner = 'teacher-a') {
    const callbacks = [];
    let user = {id: owner};
    function query(table) {
        let operation = 'read', payload, single = false;
        const filters = [];
        const api = {
            select: () => api, order: () => api,
            eq: (key, value) => {filters.push([key, value]); return api;},
            insert: value => {operation = 'insert'; payload = structuredClone(value); return api;},
            update: value => {operation = 'update'; payload = structuredClone(value); return api;},
            maybeSingle: () => {single = true; return api;},
            then(resolve, reject) {
                return Promise.resolve().then(() => {
                    if (table !== 'sesiones') return {data: [], error: null};
                    const matching = Array.from(rows.values()).filter(row => row.user_id === user.id
                        && filters.every(([key, value]) => row[key] === value));
                    if (operation === 'insert' && rows.has(payload.id)) return {data: null, error: {code: '23505'}};
                    if (operation === 'insert' || (operation === 'update' && matching.length)) {
                        rows.set(payload.id, structuredClone(payload)); writes++;
                        if (loseReply) {loseReply = false; return {data: null, error: {code: 'NETWORK_LOST'}};}
                        return {data: [{last_saved: payload.last_saved}], error: null};
                    }
                    return {data: structuredClone(single ? matching[0] || null : matching), error: null};
                }).then(resolve, reject);
            }
        };
        return api;
    }
    const window = {SessionSync: Sync, SpaceLabProfileFields: {},
        localStorage: {getItem: () => JSON.stringify({user})}, dispatchEvent() {},
        supabase: {createClient: () => ({from: query, auth: {
            onAuthStateChange: callback => callbacks.push(callback),
            getSession: async () => ({data: {session: {user}}}),
            getUser: async () => ({data: {user}})
        }})}};
    const context = vm.createContext({window, console: {log() {},warn() {},error() {}},
        CustomEvent: class {constructor(type, options) {this.type = type; this.detail = options.detail;}}});
    vm.runInContext(fs.readFileSync('js/supabase-client.js', 'utf8'), context);
    return {api: window.SupabaseClient, change(next) {user = {id: next}; callbacks.forEach(cb => cb('SIGNED_IN', {user}));}};
}

(async () => {
    const a = client(), b = client();
    const initial = {id: 'shared', metadata: {titulo: 'Base'}, htmlContent: '<p>Original</p>'};
    assert.equal(await a.api.saveSessionCloud(initial), true);
    assert.ok(initial._cloudSync.version);
    const first = (await a.api.getSessionsCloud())[0];
    const stale = (await b.api.getSessionsCloud())[0];
    first.metadata.titulo = 'Título de A';
    await a.api.saveSessionCloud(first);
    stale.htmlContent = '<p>Cuerpo de B</p>';
    await assert.rejects(b.api.saveSessionCloud(stale), error => error.code === 'SESSION_CONFLICT'
        && error.remoteSession.metadata.titulo === 'Título de A');
    assert.equal(rows.get('shared').session_data.metadata.titulo, 'Título de A');
    assert.equal(rows.get('shared').session_data.htmlContent, '<p>Original</p>');

    const x = (await a.api.getSessionsCloud())[0], y = (await b.api.getSessionsCloud())[0];
    x.metadata.titulo = 'Simultáneo A'; y.metadata.titulo = 'Simultáneo B';
    const results = await Promise.allSettled([a.api.saveSessionCloud(x), b.api.saveSessionCloud(y)]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(results.filter(r => r.status === 'rejected' && r.reason.code === 'SESSION_CONFLICT').length, 1);

    const retry = (await a.api.getSessionsCloud())[0];
    retry.htmlContent = '<p>Respuesta perdida</p>';
    loseReply = true;
    await assert.rejects(a.api.saveSessionCloud(retry), error => error.code === 'NETWORK_LOST');
    const committedVersion = rows.get('shared').last_saved, committedWrites = writes;
    await a.api.saveSessionCloud(retry);
    assert.equal(writes, committedWrites, 'Retry must acknowledge the identical committed content without rewriting');
    assert.equal(retry._cloudSync.version, committedVersion);

    const collision = {id: 'shared', metadata: {titulo: 'Imported without a baseline'}, htmlContent: 'Keep me'};
    await assert.rejects(b.api.saveSessionCloud(collision), error => error.code === 'SESSION_CONFLICT');
    assert.equal(rows.get('shared').session_data.htmlContent, '<p>Respuesta perdida</p>');
    const fork = {...structuredClone(retry), id: 'copy-id'};
    await a.api.saveSessionCloud(fork);
    assert.ok(rows.has('copy-id'), 'Save As must create a new document despite inherited metadata');
    assert.equal(fork._cloudSync.documentId, 'copy-id');
    assert.equal(rows.get('copy-id').session_data._cloudSync, undefined);
    assert.ok(Sync.nextVersion(committedVersion) > committedVersion);
    b.change('teacher-b');
    assert.equal((await b.api.getSessionsCloud()).length, 0);
    console.log('session-sync.test.js: atomic competing writes, stale snapshots, retry, import collision, copy and owner boundaries OK');
})().catch(error => {console.error(error); process.exitCode = 1;});
