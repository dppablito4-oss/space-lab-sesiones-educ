const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');

const manifest = JSON.parse(fs.readFileSync('app-version.json', 'utf8'));
const updateScript = fs.readFileSync('js/app-update.js', 'utf8');
const scriptHash = crypto.createHash('sha256').update(updateScript).digest('hex').slice(0, 12);
const pages = ['index.html', 'admin.html', 'conexion.html', 'descargas_landing.html'];

assert.match(manifest.build, /^[a-f0-9]{16}$/);
assert.equal(manifest.strategy, 'content-sha256');

for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    assert.ok(
        html.includes(`<meta name="app-build" content="${manifest.build}">`),
        `${page} debe usar el build actual`,
    );
    assert.ok(
        html.includes(`src="js/app-update.js?v=${scriptHash}"`),
        `${page} debe usar el hash actual del verificador`,
    );
}

assert.match(updateScript, /cache:\s*'no-store'/);
assert.match(updateScript, /_cache_bust/);
assert.match(updateScript, /app_version/);
assert.match(updateScript, /Nueva versión disponible/);
assert.match(updateScript, /sessionStorage/);

(async () => {
    let loadHandler;
    let pendingCheck;
    let renderedBanner;
    let replacementUrl = '';
    const sessionValues = new Map();

    function element(tag) {
        return {
            tag,
            children: [],
            handlers: {},
            style: {},
            setAttribute() {},
            addEventListener(name, handler) { this.handlers[name] = handler; },
            append(...children) { this.children.push(...children); },
            remove() { this.removed = true; },
        };
    }

    const documentMock = {
        baseURI: 'https://example.test/index.html',
        visibilityState: 'visible',
        querySelector: () => ({ content: 'old-build' }),
        getElementById: () => null,
        createElement: element,
        addEventListener() {},
        body: { appendChild(node) { renderedBanner = node; } },
    };
    const windowMock = {
        location: {
            href: 'https://example.test/index.html?mode=teacher#editor',
            replace(url) { replacementUrl = url; },
        },
        addEventListener(name, handler) {
            if (name === 'load') loadHandler = handler;
        },
        setTimeout(handler) { pendingCheck = Promise.resolve(handler()); },
        setInterval() {},
    };

    vm.runInNewContext(updateScript, {
        console,
        document: documentMock,
        window: windowMock,
        sessionStorage: {
            getItem(key) { return sessionValues.get(key) || null; },
            setItem(key, value) { sessionValues.set(key, value); },
        },
        fetch: async (url, options) => {
            assert.equal(options.cache, 'no-store');
            assert.match(url.toString(), /_cache_bust=/);
            return {
                ok: true,
                json: async () => ({ build: 'new-build' }),
            };
        },
        URL,
    });

    assert.equal(typeof loadHandler, 'function');
    loadHandler();
    await pendingCheck;
    assert.equal(renderedBanner.id, 'app-update-banner');
    assert.equal(renderedBanner.children[0].textContent, 'Nueva versión disponible');

    const actions = renderedBanner.children[2];
    const updateButton = actions.children[1];
    updateButton.handlers.click();
    assert.match(replacementUrl, /mode=teacher/);
    assert.match(replacementUrl, /app_version=new-build/);
    assert.match(replacementUrl, /#editor$/);

    console.log('app-update.test.js: OK');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
