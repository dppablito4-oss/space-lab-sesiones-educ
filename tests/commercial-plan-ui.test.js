const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const clientSource = fs.readFileSync('js/supabase-client.js', 'utf8');
const homeSource = fs.readFileSync('js/home.js', 'utf8');
const creditUiSource = fs.readFileSync('js/ai-credit-ui.js', 'utf8');
const authSource = fs.readFileSync('js/auth-ui.js', 'utf8');

const walletFunction = clientSource.split(
  "/** Read-only view of the authenticated user's AI wallet. */",
  2,
)[1].split('/** Read-only recent usage;', 1)[0];

assert.match(clientSource, /async function getCommercialPlan\(forceRefresh = false\)/);
assert.match(clientSource, /getUserEntitlements\(forceRefresh\)/);
assert.match(clientSource, /getCommercialPlan,/);
assert.match(walletFunction, /\.select\('balance, updated_at'\)/);
assert.doesNotMatch(walletFunction, /plan_id|planId|cycle_started_at|cycleStartedAt/);

assert.match(homeSource, /getCommercialPlan\?\.\(true\)/);
assert.doesNotMatch(homeSource, /wallet\?\.planId|wallet\.planId/);
assert.match(creditUiSource, /getCommercialPlan\?\.\(true\)/);
assert.doesNotMatch(creditUiSource, /wallet\?\.planId|wallet\.planId/);
assert.doesNotMatch(authSource, /headerPlan\.textContent\s*=\s*['"]Docente Beta['"]/);

function element() {
  return {
    hidden: false,
    textContent: '',
    innerHTML: '',
    title: '',
    parentElement: { title: '' },
  };
}

const elements = new Map([
  ['ai-credit-indicator', element()],
  ['header-user-credits', element()],
  ['header-user-plan', element()],
  ['header-user-badge', element()],
]);
const windowMock = { addEventListener() {}, SupabaseClient: null };
const documentMock = {
  readyState: 'loading',
  addEventListener() {},
  getElementById(id) { return elements.get(id) || null; },
};

vm.runInNewContext(creditUiSource, {
  console,
  document: documentMock,
  window: windowMock,
  Promise,
});

const wallet = { balance: 42, updatedAt: '2026-09-26T00:00:00Z' };
windowMock.SpaceLabAiCreditUi.render(wallet, 'pro');
assert.equal(elements.get('header-user-plan').textContent, 'Docente Pro');
assert.match(elements.get('header-user-credits').innerHTML, /42/);

windowMock.SpaceLabAiCreditUi.render(wallet, 'teacher');
assert.equal(elements.get('header-user-plan').textContent, 'Docente Plus');
assert.match(elements.get('header-user-credits').innerHTML, /42/);

windowMock.SpaceLabAiCreditUi.render({ ...wallet, planId: 'free' });
assert.equal(
  elements.get('header-user-plan').textContent,
  'Docente Plus',
  'El plan del wallet no debe modificar el plan comercial mostrado',
);

console.log('commercial-plan-ui.test.js: OK');
