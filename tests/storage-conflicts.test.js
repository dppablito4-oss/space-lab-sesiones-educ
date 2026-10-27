const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Sync = require('../js/core/session-sync.js');
const Accounts = require('../js/core/account-storage.js');
const tick = async () => {for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve));};

function workspace(conflicts = true) {
    const values = new Map(), events = [], uploads = [], notices = [];
    let owner = 'teacher-a', quota = false, release;
    const localStorage = {get length() {return values.size;}, key: index => Array.from(values.keys())[index],
        getItem: key => values.get(key) || null, removeItem: key => values.delete(key),
        setItem(key, value) {if (quota && key.startsWith('spacelab_recovered:')) throw new Error('quota'); values.set(key, String(value));}};
    const remote = {id: 'shared', metadata: {titulo: 'Versión remota'}, htmlContent: '<p>Remoto</p>',
        _cloudSync: {ownerId: owner, documentId: 'shared', version: '2026-10-27T10:00:00Z', branchId: 'remote-branch'}};
    const cloud = {getSessionUserSync: () => owner ? {id: owner} : null,
        getCurrentUser: async () => owner ? {id: owner} : null,
        getSessionsCloud: async () => [structuredClone(remote)],
        async saveSessionCloud(session) {
            if (release) await release.promise;
            if (session.id === 'shared' && conflicts) {
                const error = new Error('conflict'); error.code = 'SESSION_CONFLICT';error.remoteSession = structuredClone(remote);throw error;
            }
            uploads.push(structuredClone(session));
            session._cloudSync.version = Sync.nextVersion(session._cloudSync.version);
            return true;
        }};
    const window = {AccountStorage: Accounts, SessionSync: Sync, SupabaseClient: cloud,
        addEventListener() {},dispatchEvent: event => events.push(event),
        Toast: {warning: message => notices.push(message), error: message => notices.push(message)}};
    const context = vm.createContext({window, localStorage, SupabaseClient: cloud, console: {log() {},warn() {},error() {}},
        setTimeout,clearTimeout,CustomEvent: class {constructor(type, options) {this.type = type;this.detail = options.detail;}}});
    vm.runInContext(fs.readFileSync('js/storage.js', 'utf8'), context);
    return {storage: window.StorageManager, values, uploads, events, notices, remote,
        owner: value => {owner = value;}, quota: () => {quota = true;},
        pause() {let resolve;const promise = new Promise(done => {resolve = done;});release = {promise};return resolve;}};
}
const edited = () => ({id: 'shared',metadata: {titulo: 'Local'},htmlContent: '<p>Local</p>',
    _cloudSync: {ownerId: 'teacher-a',documentId: 'shared',version: '2026-10-27T09:00:00Z',branchId: 'local-branch'}});

(async () => {
    const normal = workspace(false);
    normal.storage.saveSession(edited());
    normal.storage.saveSession({...edited(), htmlContent: '<p>Latest own edit</p>'});
    await tick();
    assert.equal(normal.uploads.length, 2);
    assert.ok(normal.uploads[1]._cloudSync.version > normal.uploads[0]._cloudSync.version,
        'Queued saves from the same editor must use the preceding acknowledged revision');
    assert.equal(normal.storage.getSession('shared').htmlContent, '<p>Latest own edit</p>');
    assert.equal(normal.storage.getSession('shared').synced, true);
    Object.assign(normal.remote, structuredClone(normal.storage.getSession('shared')));
    normal.remote.metadata.titulo = 'New remote title';
    normal.remote._cloudSync.version = Sync.nextVersion(normal.remote._cloudSync.version);
    assert.equal(await normal.storage.syncSessions(), true);
    assert.equal(normal.storage.getSession('shared').metadata.titulo, 'New remote title');
    assert.equal(await normal.storage.syncSessions(), true);
    assert.equal(normal.uploads.length, 2, 'Clean synchronization must accept remote changes without writes or false recovery copies');

    const work = workspace();
    work.storage.saveSession(edited());
    work.storage.saveSession({...edited(), htmlContent: '<p>Última edición local</p>'});
    await tick();
    const all = work.storage.getAllSessions();
    assert.equal(all.find(s => s.id === 'shared').metadata.titulo, 'Versión remota');
    const copy = all.find(s => s._recoveryOf === 'shared');
    assert.ok(copy);
    assert.equal(copy.htmlContent, '<p>Última edición local</p>');
    assert.equal(work.uploads.length, 1, 'Queued old snapshots must not overwrite the recovered latest draft');
    assert.ok(work.events.some(e => e.type === 'spacelab:session-conflict'));
    work.values.delete('spacelab_sessions:user:teacher-a');
    assert.equal(work.storage.getSession(copy.id).htmlContent, copy.htmlContent, 'A lost shared index must not discard recovery data');
    work.owner('teacher-b'); assert.equal(work.storage.getAllSessions().length, 0);
    work.owner(null); assert.equal(work.storage.getAllSessions().length, 0, 'Guest must never read authenticated recovery keys');
    work.owner('teacher-a');
    work.values.set('spacelab_recovered:user:teacher-a:corrupt', '{bad');
    assert.ok(work.storage.getSession(copy.id));

    const full = workspace(); full.quota();
    full.storage.saveSession(edited()); await tick();
    assert.equal(full.storage.getSession('shared').htmlContent, '<p>Local</p>');
    assert.equal(full.uploads.length, 0);
    assert.ok(full.notices.some(message => message.includes('Exporta')));

    const changed = workspace(), finish = changed.pause();
    changed.storage.saveSession(edited()); await new Promise(resolve => setImmediate(resolve));
    changed.owner('teacher-b'); finish(); await tick();
    assert.equal(changed.storage.getAllSessions().length, 0);
    assert.equal(changed.values.size, 1, 'A stale account continuation must create no recovery key for the next account');
    console.log('storage-conflicts.test.js: latest queued draft recovered, durable copy, quota, corrupt key and A/B/guest boundaries OK');
})().catch(error => {console.error(error);process.exitCode = 1;});
