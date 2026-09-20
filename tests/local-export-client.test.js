const assert = require('node:assert/strict');
const LocalExportClient = require('../js/services/local-export-client.js');

async function run() {
    const calls = [];
    const fetchImpl = async (url, options) => {
        calls.push({ url, options });
        if (url === 'http://localhost:8000/') throw new Error('unreachable');
        if (url === 'http://127.0.0.1:8000/') return { ok: true };
        if (url.includes('/verificar-token')) {
            return { ok: true, json: async () => ({ status: 'Connected' }) };
        }
        if (url.endsWith('/exportar-pdf-json')) {
            return { ok: true, blob: async () => ({ type: 'application/pdf' }) };
        }
        return { ok: false, status: 500, statusText: 'Failure', json: async () => ({ detail: 'Engine failure' }) };
    };

    const client = LocalExportClient.create({ fetchImpl });
    const status = await client.getStatus('a token&value');
    assert.deepEqual(status, { running: true, online: true, host: '127.0.0.1:8000', reason: null });
    assert.ok(calls.some(call => call.url.endsWith('token=a%20token%26value')));

    const blob = await client.exportDocument('pdf', { schemaVersion: '1.0' });
    assert.equal(blob.type, 'application/pdf');
    const exportCall = calls.find(call => call.url.endsWith('/exportar-pdf-json'));
    assert.equal(exportCall.options.method, 'POST');
    assert.equal(JSON.parse(exportCall.options.body).schemaVersion, '1.0');

    await assert.rejects(() => client.exportDocument('docx', {}), /Engine failure/);
    await assert.rejects(() => client.exportDocument('xlsx', {}), /no compatible/);

    const offline = LocalExportClient.create({
        fetchImpl: async () => { throw new Error('offline'); }
    });
    assert.deepEqual(
        await offline.getStatus('token'),
        { running: false, online: false, host: null, reason: 'unreachable' }
    );

    console.log('local-export-client.test.js: OK');
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
