const assert = require('node:assert/strict');
const DocumentSourceProcessor = require('../js/services/document-source-processor.js');

async function run() {
    const pages = [
        ['Primera', 'página'],
        ['Segunda', 'página']
    ];
    const pdfjs = {
        getDocument: () => ({
            promise: Promise.resolve({
                numPages: pages.length,
                getPage: async pageNumber => ({
                    getTextContent: async () => ({
                        items: pages[pageNumber - 1].map(str => ({ str }))
                    })
                })
            })
        })
    };

    const processor = DocumentSourceProcessor.create({ pdfjs });
    const text = await processor.extractText(new ArrayBuffer(0));
    assert.match(text, /PÁGINA 1/);
    assert.match(text, /Primera página/);
    assert.match(text, /PÁGINA 2/);

    const limited = await processor.extractText(new ArrayBuffer(0), 12);
    assert.equal(limited.length, 12);

    console.log('document-source-processor.test.js: OK');
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
