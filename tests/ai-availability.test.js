const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {randomUUID} = require('node:crypto');

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return {promise, resolve};
}
function harness() {
    const select = {value: 'automatic', addEventListener() {}};
    select.options = ['automatic','fast','balanced','max_quality'].map(value => ({
        value, get selected() { return select.value === value; }
    }));
    const nodes = {'select-ai-provider': select, 'ai-availability-status': {}, 'ai-availability-help': {}};
    const client = {getCurrentUser: async () => ({id: 'teacher'}), invokeFunction: async () => ({qualities: ['automatic','fast']})};
    const window = {SupabaseClient: client, Toast: {warning() {}}, addEventListener() {}};
    vm.runInNewContext(fs.readFileSync('js/components/ai-availability.js','utf8'), {
        window, document: {getElementById: id => nodes[id]}, crypto: {randomUUID}
    });
    return {api: window.SpaceLabAiAvailability, client, select, nodes,
        enabled: value => !select.options.find(option => option.value === value).disabled};
}

(async () => {
    const h = harness();
    await h.api.refresh();
    assert(h.enabled('fast'));
    assert(!h.enabled('max_quality'));

    // A slow user lookup from account A cannot start discovery after B's result.
    const userA = deferred();
    let calls = 0;
    h.client.getCurrentUser = () => userA.promise;
    const oldUserLookup = h.api.refresh();
    h.client.getCurrentUser = async () => ({id: 'account-b'});
    h.client.invokeFunction = async () => { calls++; return {qualities: ['automatic','fast']}; };
    await h.api.refresh();
    userA.resolve({id: 'account-a'});
    assert.equal(await oldUserLookup, false);
    assert.equal(calls, 1);

    // A late premium response cannot grant options to the next account.
    const oldCapabilities = deferred();
    h.client.invokeFunction = () => oldCapabilities.promise;
    const oldRequest = h.api.refresh();
    await Promise.resolve();
    h.client.invokeFunction = async () => ({qualities: ['automatic']});
    await h.api.refresh();
    oldCapabilities.resolve({qualities: ['automatic','fast','max_quality']});
    assert.equal(await oldRequest, false);
    assert(!h.enabled('fast'));
    assert(!h.enabled('max_quality'));

    // A validation superseded by an account refresh must not permit generation.
    const validation = deferred();
    h.client.invokeFunction = () => validation.promise;
    const allowed = h.api.validate();
    await Promise.resolve();
    h.client.invokeFunction = async () => ({qualities: ['automatic']});
    await h.api.refresh();
    validation.resolve({qualities: ['automatic']});
    assert.equal(await allowed, false);

    h.client.invokeFunction = async () => { throw new Error('Older gateway / offline'); };
    assert.equal(await h.api.validate(), true); // Automatic delegates final authority to gateway.
    h.select.value = 'fast';
    assert.equal(await h.api.validate(), false);
    assert.equal(h.select.value, 'fast'); // Never silently replace a saved preference.
    h.client.getCurrentUser = async () => null;
    await h.api.refresh();
    assert.match(h.nodes['ai-availability-help'].textContent, /cuenta con créditos/);
    assert(!h.enabled('fast'));
    console.log('ai-availability.test.js: OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
