const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture() {
    const elements = new Map();
    const pending = [];
    const events = [];
    let owner = 'A';
    const listeners = new Map();
    function element() {
        return {
            style: {}, value: '', children: [], isConnected: true,
            classList: { add() {}, remove() {} },
            setAttribute() {}, getBoundingClientRect() {}, focus() {},
            addEventListener(name, cb) { this[name] = cb; },
            appendChild(child) { this.children.push(child); },
            remove() { if (elements.get(this.id) === this) elements.delete(this.id); },
            set innerHTML(value) {
                this.html = value;
                for (const id of value.matchAll(/id="([^"]+)"/g)) elements.set(id[1], element());
            }
        };
    }
    const body = element();
    body.appendChild = child => { elements.set(child.id, child); };
    const window = {
        addEventListener: (name, cb) => listeners.set(name, cb),
        SpaceLabSanitizer: { sanitizeFragment: value => 'SANITIZED:' + value },
        SupabaseClient: {
            client: {}, getSessionUserSync: () => ({id: owner}),
            invokeFunction: () => new Promise((resolve, reject) => pending.push({resolve, reject}))
        }
    };
    const document = {body, createElement: element, getElementById: id => elements.get(id),
        dispatchEvent: event => events.push(event)};
    const context = vm.createContext({window, document, SupabaseClient: window.SupabaseClient,
        CustomEvent: class {constructor(type, options) {this.type = type; this.detail = options.detail;}},
        console: {error() {}}, setTimeout: cb => cb()});
    vm.runInContext(fs.readFileSync('js/pedagogy-brief.js', 'utf8'), context);
    return {brief: window.PedagogyBrief, elements, pending, events, window,
        account(id) {owner = id; listeners.get('spacelab:account-changed')();},
        open(title = 'Documento') {window.PedagogyBrief.open({area: 'Matemática', titulo: title});},
        async reply(value) {pending.at(-1).resolve(value); await tick();}};
}
const tick = async () => {for (let i = 0; i < 12; i++) await Promise.resolve();};

(async () => {
    let f = fixture(); f.open(); await f.reply('<strong>Seguro</strong><img onerror="evil()">');
    assert.ok(f.elements.get('pb-messages').children[0].html.startsWith('SANITIZED:'));
    f = fixture(); delete f.window.SpaceLabSanitizer; f.open(); await f.reply('<img onerror="evil()">');
    assert.equal(f.elements.get('pb-messages').children[0].html, undefined);
    assert.equal(f.elements.get('pb-messages').children[0].textContent, '<img onerror="evil()">');

    for (const change of ['account', 'reopen', 'close']) {
        for (const rejected of [false, true]) {
            f = fixture(); f.open(); await f.reply('[LISTO_PARA_GENERAR] Preparado');
            const finishing = f.elements.get('pb-generate-btn').click();
            const old = f.pending.at(-1);
            if (change === 'account') f.account('B');
            if (change === 'close') f.elements.get('pb-close-btn').click();
            f.open('Nuevo documento');
            if (rejected) old.reject(new Error('La cuenta cambió.'));
            else old.resolve('Resumen antiguo');
            await finishing;
            assert.equal(f.events.length, 0, `${change}/${rejected}: no generar con un diálogo vencido`);
            assert.ok(f.elements.has('pedagogy-brief-modal'));
            assert.equal(f.brief.getSummary(), null);
        }
    }
    for (const rejected of [false, true]) {
        f = fixture(); f.open(); const old = f.pending[0]; f.open('Reapertura');
        if (rejected) old.reject(new Error('Respuesta anterior'));
        else old.resolve('Respuesta anterior');
        await tick();
        assert.equal(f.elements.get('pb-messages').children.length, 0);
    }
    f = fixture(); f.open(); await f.reply('[LISTO_PARA_GENERAR] Preparado');
    const finish = f.elements.get('pb-generate-btn').click(); await f.reply('Resumen vigente'); await finish;
    assert.equal(f.events.length, 1); assert.equal(f.events[0].detail.summary, 'Resumen vigente');
    assert.equal(f.brief.getSummary(), 'Resumen vigente');
    console.log('pedagogy-brief.test.js: sanitizer, safe fallback, expired success/error and current summary passed.');
})().catch(error => {console.error(error); process.exitCode = 1;});
