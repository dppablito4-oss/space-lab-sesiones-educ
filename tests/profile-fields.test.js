const assert = require('node:assert/strict');
const ProfileFields = require('../js/core/profile-fields.js');

const sanitized = ProfileFields.sanitizeUpdate({
    username: 'docente',
    institucion: 'I.E. 001',
    nivel: 'SECUNDARIA',
    id: 'attacker-id',
    email: 'attacker@example.com',
    role: 'superadmin',
    created_at: '2099-01-01',
    subscription: 'premium',
    subscription_status: 'active',
    credits: 999999,
    permissions: ['*']
});

assert.deepEqual(sanitized, {
    username: 'docente',
    institucion: 'I.E. 001',
    nivel: 'SECUNDARIA'
});
assert.ok(!ProfileFields.EDITABLE_FIELDS.includes('email'));
assert.ok(!ProfileFields.EDITABLE_FIELDS.includes('role'));
assert.deepEqual(ProfileFields.sanitizeUpdate(null), {});
assert.deepEqual(ProfileFields.sanitizeUpdate([]), {});

console.log('profile-fields.test.js: OK');
