const assert = require('node:assert/strict');
const fs = require('node:fs');

const migration = fs.readFileSync(
  'supabase/migrations/202609260011_subscription_credit_lifecycle.sql',
  'utf8',
);

assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.subscription_credit_policies/);
assert.match(migration, /plan_code TEXT PRIMARY KEY[\s\S]*REFERENCES public\.subscription_plans\(code\)/);
assert.match(migration, /credits_per_cycle INTEGER NOT NULL/);
assert.match(migration, /expires_with_cycle BOOLEAN NOT NULL/);
assert.match(migration, /rollover_allowed BOOLEAN NOT NULL/);
assert.match(migration, /max_rollover INTEGER NOT NULL/);
assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_grants_subscription_cycle/);
assert.match(migration, /ON public\.credit_grants \(source_type, source_id\)/);
assert.match(migration, /CREATE OR REPLACE FUNCTION public\.issue_subscription_cycle_credits/);
assert.match(migration, /ON CONFLICT \(source_type, source_id\)/);
assert.match(migration, /CREATE TRIGGER on_subscription_cycle_credits/);
assert.match(migration, /AFTER INSERT OR UPDATE OF plan_code, status, current_period_start, current_period_end/);
assert.match(migration, /TO service_role/);
assert.match(migration, /FROM PUBLIC, anon, authenticated/);
assert.doesNotMatch(migration, /DELETE FROM public\.credit_grants/);

const policyRows = [...migration.matchAll(
  /\('(free|beta_teacher|teacher|pro)',\s*(\d+),\s*(TRUE|FALSE),\s*(TRUE|FALSE),\s*(\d+),\s*TRUE\)/g,
)];
assert.deepEqual(
  Object.fromEntries(policyRows.map(row => [row[1], Number(row[2])])),
  { free: 30, beta_teacher: 100, teacher: 150, pro: 400 },
);

const NOW = Date.parse('2026-09-26T12:00:00Z');
const POLICIES = {
  free: { credits: 30, expiresWithCycle: false },
  beta_teacher: { credits: 100, expiresWithCycle: false },
  teacher: { credits: 150, expiresWithCycle: true },
  pro: { credits: 400, expiresWithCycle: true },
};

function activeGrant(grant) {
  return grant.remaining > 0
    && Date.parse(grant.startsAt) <= NOW
    && (grant.expiresAt === null || Date.parse(grant.expiresAt) > NOW);
}

function sourceId(subscription) {
  return `${subscription.id}:${subscription.periodStart}`;
}

function issueCycle(state, subscription) {
  if (!['trialing', 'active'].includes(subscription.status)) {
    return { ok: false, code: 'SUBSCRIPTION_INACTIVE' };
  }
  if (subscription.periodEnd !== null && Date.parse(subscription.periodEnd) <= NOW) {
    return { ok: false, code: 'SUBSCRIPTION_EXPIRED' };
  }

  const policy = POLICIES[subscription.plan];
  if (!policy) return { ok: false, code: 'CREDIT_POLICY_NOT_FOUND' };
  if (policy.expiresWithCycle && subscription.periodEnd === null) {
    return { ok: false, code: 'PERIOD_END_REQUIRED' };
  }

  const idempotencyKey = sourceId(subscription);
  const existing = state.grants.find(grant =>
    grant.sourceType === 'subscription' && grant.sourceId === idempotencyKey);
  if (existing) return { ok: true, code: 'CYCLE_GRANT_EXISTS', grantId: existing.id };

  const grant = {
    id: `grant-${state.grants.length + 1}`,
    sourceType: 'subscription',
    sourceId: idempotencyKey,
    remaining: policy.credits,
    startsAt: subscription.periodStart,
    expiresAt: policy.expiresWithCycle ? subscription.periodEnd : null,
  };
  state.grants.push(grant);
  state.ledger.push({ eventType: 'grant', grantId: grant.id, delta: policy.credits });
  state.wallet = state.grants.filter(activeGrant).reduce((sum, item) => sum + item.remaining, 0);
  return { ok: true, code: 'CYCLE_GRANT_CREATED', grantId: grant.id };
}

const state = {
  wallet: 50,
  grants: [
    {
      id: 'prepaid', sourceType: 'prepaid', sourceId: 'purchase-1', remaining: 50,
      startsAt: '2026-09-01T00:00:00Z', expiresAt: null,
    },
    {
      id: 'promo', sourceType: 'promo', sourceId: 'promo-1', remaining: 10,
      startsAt: '2026-09-01T00:00:00Z', expiresAt: '2026-10-15T00:00:00Z',
    },
  ],
  ledger: [],
};

const subscription = {
  id: 'sub-teacher-1', plan: 'teacher', status: 'active',
  periodStart: '2026-09-01T00:00:00Z', periodEnd: '2026-10-01T00:00:00Z',
};

const created = issueCycle(state, subscription);
assert.equal(created.code, 'CYCLE_GRANT_CREATED');
assert.equal(state.grants.filter(grant => grant.sourceType === 'subscription').length, 1);
assert.equal(state.ledger.length, 1);
assert.equal(state.wallet, 210, 'Wallet = prepago + promo + grant de suscripcion');

const duplicate = issueCycle(state, subscription);
assert.equal(duplicate.code, 'CYCLE_GRANT_EXISTS');
assert.equal(state.grants.filter(grant => grant.sourceType === 'subscription').length, 1);
assert.equal(state.ledger.length, 1, 'Un ciclo duplicado no agrega otro asiento');

const renewed = {
  ...subscription,
  periodStart: '2026-10-01T00:00:00Z',
  periodEnd: '2026-11-01T00:00:00Z',
};
const renewal = issueCycle(state, renewed);
assert.equal(renewal.code, 'CYCLE_GRANT_CREATED');
assert.equal(state.grants.filter(grant => grant.sourceType === 'subscription').length, 2);
assert.equal(state.grants.find(grant => grant.id === 'prepaid').remaining, 50);
assert.equal(state.grants.find(grant => grant.id === 'prepaid').expiresAt, null);
assert.equal(state.grants.find(grant => grant.id === 'promo').expiresAt, '2026-10-15T00:00:00Z');

const duplicateRenewal = issueCycle(state, renewed);
assert.equal(duplicateRenewal.code, 'CYCLE_GRANT_EXISTS');
assert.equal(state.grants.filter(grant => grant.sourceType === 'subscription').length, 2);

const canceled = issueCycle(state, { ...renewed, status: 'canceled' });
assert.equal(canceled.code, 'SUBSCRIPTION_INACTIVE');
assert.equal(state.grants.find(grant => grant.id === 'prepaid').remaining, 50);

const expired = issueCycle(state, {
  ...subscription,
  periodStart: '2026-08-01T00:00:00Z',
  periodEnd: '2026-09-01T00:00:00Z',
});
assert.equal(expired.code, 'SUBSCRIPTION_EXPIRED');
assert.equal(state.grants.filter(grant => grant.sourceType === 'subscription').length, 2);

console.log('subscription-credit-lifecycle.test.js: OK');
