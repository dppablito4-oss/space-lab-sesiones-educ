const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const storage = new Map();
const select = {
    value: '',
    listeners: {},
    addEventListener(type, handler) { this.listeners[type] = handler; }
};
let systemListener = null;
const media = {
    matches: true,
    addEventListener(type, handler) {
        if (type === 'change') systemListener = handler;
    }
};
const documentElement = { dataset: {}, style: {} };
const events = [];
const context = vm.createContext({
    console,
    CustomEvent: class CustomEvent {
        constructor(type, options) { this.type = type; this.detail = options?.detail; }
    },
    localStorage: {
        getItem(key) { return storage.get(key) || null; },
        setItem(key, value) { storage.set(key, String(value)); }
    },
    document: {
        readyState: 'complete',
        documentElement,
        getElementById(id) { return id === 'theme-preference' ? select : null; },
        addEventListener() {}
    },
    window: {
        matchMedia() { return media; },
        dispatchEvent(event) { events.push(event); }
    }
});
context.window.window = context.window;
context.window.document = context.document;
context.window.localStorage = context.localStorage;
context.window.CustomEvent = context.CustomEvent;

vm.runInContext(fs.readFileSync('js/theme.js', 'utf8'), context);

assert.equal(documentElement.dataset.themePreference, 'system');
assert.equal(documentElement.dataset.theme, 'dark');
assert.equal(documentElement.style.colorScheme, 'dark');
assert.equal(select.value, 'system');

context.window.SpaceLabTheme.setPreference('light');
assert.equal(storage.get('spacelab_theme_preference'), 'light');
assert.equal(documentElement.dataset.theme, 'light');

select.value = 'dark';
select.listeners.change();
assert.equal(context.window.SpaceLabTheme.getPreference(), 'dark');
assert.equal(documentElement.dataset.theme, 'dark');

context.window.SpaceLabTheme.setPreference('system');
media.matches = false;
systemListener();
assert.equal(documentElement.dataset.theme, 'light');
assert.ok(events.some(event => event.type === 'spacelab:themechange'));

console.log('theme.test.js: OK');
