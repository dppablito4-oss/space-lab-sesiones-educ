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
