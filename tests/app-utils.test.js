const assert = require('node:assert/strict');
const Utils = require('../js/core/app-utils.js');

assert.equal(Utils.parseMinutes('90 min'), 90);
assert.equal(Utils.parseMinutes('2 horas pedagógicas'), 90);
assert.equal(Utils.parseMinutes('15 + 5 min'), 20);
assert.equal(Utils.parseMinutes(''), 0);

assert.equal(Utils.escapeHtml('<script a="1">&</script>'), '&lt;script a=&quot;1&quot;&gt;&amp;&lt;/script&gt;');
assert.equal(Utils.escapeAttribute("' quoted"), '&#39; quoted');
assert.equal(Utils.formatDate('not-a-date'), 'not-a-date');

assert.equal(Utils.getBinaryMimeFallback('guia.PDF'), 'application/pdf');
assert.equal(Utils.getBinaryMimeFallback('audio.mp3'), 'audio/mpeg');
assert.equal(Utils.getBinaryMimeFallback('unknown.bin'), 'application/octet-stream');

globalThis.btoa = value => Buffer.from(value, 'binary').toString('base64');
assert.equal(Utils.arrayBufferToBase64(Uint8Array.from([72, 105]).buffer), 'SGk=');

console.log('app-utils.test.js: OK');
