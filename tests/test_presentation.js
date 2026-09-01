const assert = require('assert');
const Presentation = require('../js/document-presentation.js');
const SessionAdapter = require('../js/ai/session-adapter.js');

const modern = Presentation.preset('moderno');
assert.strictEqual(modern.preset, 'moderno');
assert.strictEqual(modern.fontFamily, 'Calibri');
assert.strictEqual(Presentation.toCss(modern).padding, '6px 8px');

const legacy = Presentation.normalize({
    themeColor: '#123456', headerBg: '#abcdef', fontFamily: "'Times New Roman', serif",
    fontSize: '12pt', padding: '8px 10px', lineHeight: '1.6'
});
assert.strictEqual(legacy.primaryColor, '#123456');
assert.strictEqual(legacy.headerBackground, '#ABCDEF');
assert.strictEqual(legacy.fontFamily, 'Times New Roman');
assert.strictEqual(legacy.cellPadding, 'spacious');

const adapted = SessionAdapter.adaptLegacyToV1({
    metadata: {}, proposito: {}, momentos: {}, design: { themeColor: '#112233' }
}).document;
assert.strictEqual(adapted.presentation.primaryColor, '#112233');

const sanitized = Presentation.normalize({ primaryColor: 'red', fontSizePt: 99, lineHeight: 0 });
assert.strictEqual(sanitized.primaryColor, '#000000');
assert.strictEqual(sanitized.fontSizePt, 12);
assert.strictEqual(sanitized.lineHeight, 1);

console.log('Presentation contract tests passed.');
