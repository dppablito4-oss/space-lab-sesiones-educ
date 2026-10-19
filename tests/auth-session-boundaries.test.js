const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const values = new Map();
const events = [];
const callbacks = [];
let session = null;
let releaseInvocation;
let resetRequest;
let updatedPassword;
const sdk = {
    auth: {
        onAuthStateChange(callback) { callbacks.push(callback); return { data: { subscription: null } }; },
        async getSession() { return { data: { session } }; },
        async getUser() { return { data: { user: session?.user || null } }; },
        async signOut() { emit('SIGNED_OUT', null); return {}; },
        async resetPasswordForEmail(email, options) { resetRequest = { email, options }; return {}; },
        async updateUser(options) { updatedPassword = options.password; return {}; }
    },
    functions: { invoke() { return new Promise(resolve => { releaseInvocation = resolve; }); } },
    from() {
        const query = new Proxy({}, { get(_target, name) {
            if (name === 'then') return resolve => resolve({ data: null, error: null });
            return () => query;
        } });
        return query;
    }
};
function emit(event, next) { session = next; for (const callback of callbacks) callback(event, next); }
const localStorage = { getItem: key => values.get(key) || null };
const window = {
    localStorage,
    location: { origin: 'https://sesiones.sypablitodp.site', pathname: '/' },
    SpaceLabProfileFields: { sanitizeUpdate: value => value },
    supabase: { createClient: () => sdk },
    dispatchEvent: event => events.push(event)
};
const context = vm.createContext({
    window, console, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
});
values.set('sb-unrelated-project-auth-token', JSON.stringify({ user: { id: 'unrelated' } }));
vm.runInContext(fs.readFileSync('js/supabase-client.js', 'utf8'), context);
const client = window.SupabaseClient;

(async () => {
    assert.equal(client.getSessionUserSync(), null, 'No leer una identidad de otro proyecto.');
    emit('SIGNED_IN', { user: { id: 'a', email: 'a@example.test' } });
    assert.equal(client.getSessionUserSync().id, 'a');
    assert.equal(events.at(-1).detail.userId, 'a');
    const eventCount = events.length;
    emit('TOKEN_REFRESHED', { user: { id: 'a' } });
    assert.equal(events.length, eventCount, 'Renovar token no cambia el espacio de trabajo.');

    const pending = client.invokeFunction('ai-gateway', { action: 'test' });
    await new Promise(resolve => setImmediate(resolve));
    emit('SIGNED_IN', { user: { id: 'b' } });
    releaseInvocation({ data: 'private response a', error: null });
    await assert.rejects(pending, /cuenta cambió/);
    assert.equal(events.findLast(event => event.type === 'spacelab:account-changed').detail.previousUserId, 'a');

    await client.requestPasswordReset(' teacher@example.test ');
    assert.equal(resetRequest.email, 'teacher@example.test');
    assert.equal(resetRequest.options.redirectTo, 'https://sesiones.sypablitodp.site/');
    await assert.rejects(client.updateRecoveredPassword('new-password'), /enlace de recuperación/);
    emit('PASSWORD_RECOVERY', { user: { id: 'b' } });
    assert.equal(client.isPasswordRecoveryPending(), true);
    await assert.rejects(client.updateRecoveredPassword('short'), /8 caracteres/);
    await client.updateRecoveredPassword('new-password');
    assert.equal(updatedPassword, 'new-password');
    assert.equal(client.isPasswordRecoveryPending(), false);
    emit('SIGNED_OUT', null);
    values.set('sb-koptglmifwpzrfzvipnm-auth-token', JSON.stringify({ user: { id: 'stale-a' } }));
    assert.equal(client.getSessionUserSync(), null, 'Un evento de salida prevalece sobre una copia local obsoleta.');
    console.log('auth-session-boundaries.test.js: OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
