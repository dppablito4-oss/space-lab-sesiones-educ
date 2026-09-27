const assert = require('node:assert/strict');
const { formatValidationErrors } = require('../js/core/validation-errors.js');

assert.equal(formatValidationErrors(['Error legacy.']), 'Error legacy.');
assert.equal(formatValidationErrors([{ message: 'Error V2.' }]), 'Error V2.');
assert.equal(formatValidationErrors([{ path: 'identity.grade', message: 'El grado 4 no pertenece al perfil.' }]), 'identity.grade: El grado 4 no pertenece al perfil.');
assert.equal(formatValidationErrors([]), '');
assert.equal(formatValidationErrors([{ code: 'unknown' }]), '{"code":"unknown"}');
assert.doesNotMatch(formatValidationErrors([{ code: 'unknown' }]), /\[object Object\]/);

console.log('validation-errors.test.js: OK');
