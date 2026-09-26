const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function cssBlock(source, marker) {
    const markerIndex = source.indexOf(marker);
    assert.ok(markerIndex >= 0, `No se encontró ${marker}`);
    const start = source.indexOf('{', markerIndex);
    let depth = 0;
    for (let index = start; index < source.length; index += 1) {
        if (source[index] === '{') depth += 1;
        if (source[index] === '}') depth -= 1;
        if (depth === 0) return source.slice(start + 1, index);
    }
    throw new Error(`Bloque CSS incompleto: ${marker}`);
}

function cssVariables(block) {
    return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)]
        .map(match => [match[1], match[2]]));
}

function luminance(hex) {
    const channels = hex.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16) / 255)
        .map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrast(foreground, background) {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
}

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

const themeCss = fs.readFileSync('css/app-theme.css', 'utf8');
const lightTokens = cssVariables(cssBlock(themeCss, 'html[data-theme="light"]'));
const darkTokens = cssVariables(cssBlock(themeCss, 'html[data-theme="dark"]'));

for (const [name, tokens] of [['claro', lightTokens], ['oscuro', darkTokens]]) {
    for (const surface of ['color-background', 'color-card', 'color-card-surface']) {
        assert.ok(contrast(tokens['color-foreground'], tokens[surface]) >= 7,
            `El texto principal del tema ${name} necesita contraste AAA sobre ${surface}`);
        assert.ok(contrast(tokens['color-muted-foreground'], tokens[surface]) >= 4.5,
            `El texto secundario del tema ${name} necesita contraste AA sobre ${surface}`);
    }
    assert.ok(contrast(tokens['color-primary'], tokens['color-background']) >= 4.5,
        `El acento del tema ${name} necesita contraste AA`);
}

const homeCss = fs.readFileSync('css/home.css', 'utf8');
assert.match(homeCss, /background:\s*var\(--color-card\)/);
assert.match(homeCss, /color:\s*var\(--color-muted-foreground\)/);
assert.doesNotMatch(homeCss, /rgba\((?:6|12|18),\s*(?:6|12|18),\s*(?:15|29|43)/,
    'Mi espacio no debe conservar superficies oscuras fijas en el tema claro');

console.log('theme.test.js: OK');
