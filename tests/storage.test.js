const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const values = new Map();
const localStorage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
  removeItem(key) { values.delete(key); },
};

const window = {
  addEventListener() {},
  localStorage,
  AccountStorage: require('../js/core/account-storage.js'),
};

const context = vm.createContext({
  window,
  localStorage,
  console,
  Blob,
  URL,
  setTimeout,
  clearTimeout,
});

const storageSource = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'storage.js'),
  'utf8',
);
vm.runInContext(storageSource, context, { filename: 'js/storage.js' });

const Storage = window.StorageManager;
assert.ok(Storage, 'StorageManager debe inicializarse');

const deleted = {
  id: 'ses_deleted',
  metadata: { titulo: 'Eliminada' },
  deleted_at: '2026-08-15T00:00:00.000Z',
  lastSaved: '2026-08-15T00:00:00.000Z',
};
const active = {
  id: 'ses_active',
  metadata: { titulo: 'Activa' },
  lastSaved: '2026-08-15T00:00:00.000Z',
};
localStorage.setItem('spacelab_sessions', JSON.stringify([deleted, active]));

Storage.saveSession({ id: 'ses_new', metadata: { titulo: 'Nueva' } });

const persisted = JSON.parse(localStorage.getItem('spacelab_sessions'));
assert.equal(persisted.length, 3, 'guardar no debe borrar tombstones pendientes');
assert.ok(persisted.some((session) => session.id === 'ses_deleted' && session.deleted_at));
assert.deepEqual(
  Array.from(Storage.getAllSessions(), (session) => session.id).sort(),
  ['ses_active', 'ses_new'],
  'las sesiones eliminadas deben permanecer ocultas para la UI',
);

console.log('storage.test.js: OK');

(async () => {
  let user = { id: 'account-a' };
  const uploads = [];
  const cloud = {
    getSessionUserSync: () => user,
    getCurrentUser: async () => user,
    getSessionsCloud: async () => [],
    saveSessionCloud: async (session, ownerId) => { uploads.push({ id: session.id, ownerId }); return true; }
  };
  window.SupabaseClient = cloud;
  context.SupabaseClient = cloud;
  assert.equal(Storage.getAllSessions().length, 0, 'No adjudicar datos antiguos al iniciar sesión.');
  assert.equal(Storage.saveSession({ id: 'private-a' }), true);
  Storage.setCurrentSession({ id: 'draft-a' });
  await new Promise(resolve => setImmediate(resolve));
  user = { id: 'account-b' };
  assert.equal(Storage.getSession('private-a'), null);
  assert.equal(Storage.getCurrentSession(), null);
  assert.equal(await Storage.syncSessions(), true);
  assert.ok(!uploads.some(item => item.ownerId === 'account-b'), 'B no debe subir datos de A ni del invitado.');
  Storage.saveSession({ id: 'private-b' });
  user = null;
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(!uploads.some(item => item.id === 'private-b'), 'Cancelar subidas en cola al cambiar de cuenta.');
  assert.equal(Storage.getSession('private-a'), null);
  assert.ok(Storage.getSession('ses_new'), 'Conservar datos anteriores en invitado.');
  user = { id: 'account-a' };
  assert.equal(Storage.getCurrentSession().id, 'draft-a');
  assert.ok(Storage.getSession('private-a'));

  let releaseRead;
  cloud.getSessionsCloud = () => new Promise(resolve => { releaseRead = resolve; });
  const syncing = Storage.syncSessions();
  await new Promise(resolve => setImmediate(resolve));
  user = { id: 'account-b' };
  releaseRead([{ id: 'remote-a' }]);
  assert.equal(await syncing, false);
  assert.equal(Storage.getSession('remote-a'), null, 'Una respuesta de A no debe escribirse en B.');

  user = { id: 'account-a' };
  const inFlight = Storage.syncSessions();
  await new Promise(resolve => setImmediate(resolve));
  Storage.saveSession({ id: 'private-a', metadata: { titulo: 'Edición durante sincronización' } });
  releaseRead([]);
  await inFlight;
  assert.equal(Storage.getSession('private-a').metadata.titulo, 'Edición durante sincronización');

  const originalSet = localStorage.setItem;
  localStorage.setItem = () => { const error = new Error('full'); error.name = 'QuotaExceededError'; throw error; };
  const before = uploads.length;
  assert.equal(Storage.saveSession({ id: 'not-persisted' }), false);
  assert.equal(Storage.setCurrentSession({ id: 'not-persisted' }), false);
  assert.equal(Storage.deleteSession('private-a'), false);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(uploads.length, before, 'No subir cambios que no pudieron persistirse localmente.');
  assert.ok(Storage.getSession('private-a'));
  localStorage.setItem = originalSet;
  console.log('storage account boundaries, concurrent sync and quota errors: OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
