const assert = require('node:assert/strict');
const fs = require('node:fs');

const migration = fs.readFileSync(
  'supabase/migrations/202609260010_credit_grant_validity_reconciliation.sql',
  'utf8',
);
const functionSql = migration.split(
  'CREATE OR REPLACE FUNCTION public.reserve_ai_credits',
  2,
)[1].split('$$;', 1)[0];

assert.doesNotMatch(migration, /CREATE TABLE|ALTER TABLE|DROP TABLE|DROP COLUMN/i);
assert.equal(
  (functionSql.match(/starts_at <= timezone\('utc'::text, now\(\)\)/g) || []).length,
  4,
  'La funcion debe filtrar vigencia al reconciliar, sumar, consumir y recalcular',
);
assert.match(functionSql, /priority ASC, expires_at ASC NULLS LAST, created_at ASC/);
assert.match(functionSql, /v_stale_found BOOLEAN := FALSE/);
assert.match(functionSql, /refund_entry\.grant_id IS NOT DISTINCT FROM reserve_entry\.grant_id/);
assert.match(functionSql, /refund_entry\.event_type = 'refund'/);
assert.match(functionSql, /SELECT \* INTO v_wallet[\s\S]*FOR UPDATE/);
assert.ok(
  functionSql.indexOf('SET balance = v_reconciled_balance')
    < functionSql.indexOf("'code', 'RATE_LIMITED'"),
  'El wallet debe reconciliarse antes de cualquier salida por rate limit',
);

const NOW = Date.parse('2026-09-26T12:00:00Z');

function isActive(grant) {
  return grant.remaining > 0
    && Date.parse(grant.startsAt) <= NOW
    && (grant.expiresAt === null || Date.parse(grant.expiresAt) > NOW);
}

function availableBalance(grants) {
  return grants.filter(isActive).reduce((total, grant) => total + grant.remaining, 0);
}

function consume(grants, credits) {
  const ordered = grants.filter(isActive).sort((left, right) =>
    left.priority - right.priority
    || (Date.parse(left.expiresAt || '9999-12-31') - Date.parse(right.expiresAt || '9999-12-31'))
    || left.createdAt.localeCompare(right.createdAt));
  let remaining = credits;
  for (const grant of ordered) {
    const amount = Math.min(grant.remaining, remaining);
    grant.remaining -= amount;
    remaining -= amount;
    if (remaining === 0) break;
  }
  return remaining === 0;
}

function cleanupStale(state) {
  let staleFound = false;
  for (const usage of state.usage) {
    if (usage.status !== 'reserved' || NOW - Date.parse(usage.createdAt) <= 15 * 60 * 1000) continue;
    staleFound = true;
    const reserves = state.ledger.filter(entry =>
      entry.requestId === usage.requestId && entry.eventType === 'reserve' && entry.delta < 0);
    for (const reserve of reserves) {
      const refunded = state.ledger.some(entry =>
        entry.requestId === reserve.requestId
        && entry.grantId === reserve.grantId
        && entry.eventType === 'refund');
      if (refunded) continue;
      const grant = state.grants.find(item => item.id === reserve.grantId);
      if (grant) grant.remaining += Math.abs(reserve.delta);
      state.ledger.push({
        requestId: reserve.requestId,
        grantId: reserve.grantId,
        eventType: 'refund',
        delta: Math.abs(reserve.delta),
      });
    }
    usage.status = 'refunded';
  }
  if (staleFound) state.wallet = availableBalance(state.grants);
}

function reserveAfterCleanup(state, { rateLimited = false } = {}) {
  cleanupStale(state);
  if (rateLimited) return { ok: false, code: 'RATE_LIMITED', balance: state.wallet };
  return { ok: true, balance: state.wallet };
}

const grants = [
  {
    id: 'future', remaining: 50, priority: 10,
    startsAt: '2026-09-27T00:00:00Z', expiresAt: '2026-10-27T00:00:00Z', createdAt: '2026-09-01',
  },
  {
    id: 'active', remaining: 20, priority: 20,
    startsAt: '2026-09-25T00:00:00Z', expiresAt: '2026-09-27T00:00:00Z', createdAt: '2026-09-02',
  },
  {
    id: 'expired', remaining: 30, priority: 1,
    startsAt: '2026-09-01T00:00:00Z', expiresAt: '2026-09-25T00:00:00Z', createdAt: '2026-09-03',
  },
];

assert.equal(availableBalance(grants), 20, 'Solo el grant vigente integra el saldo');
assert.equal(consume(grants, 5), true, 'El grant vigente debe poder consumirse');
assert.equal(grants.find(grant => grant.id === 'active').remaining, 15);
assert.equal(grants.find(grant => grant.id === 'future').remaining, 50);
assert.equal(grants.find(grant => grant.id === 'expired').remaining, 30);

function staleFixture() {
  return {
    wallet: 35,
    grants: [{
      id: 'active-grant', remaining: 35, priority: 20,
      startsAt: '2026-09-01T00:00:00Z', expiresAt: null, createdAt: '2026-09-01',
    }],
    usage: [{ requestId: 'stale-request', status: 'reserved', createdAt: '2026-09-26T11:30:00Z' }],
    ledger: [{ requestId: 'stale-request', grantId: 'active-grant', eventType: 'reserve', delta: -5 }],
  };
}

const staleState = staleFixture();
cleanupStale(staleState);
assert.equal(staleState.wallet, 40, 'El refund stale debe reconciliar el wallet inmediatamente');
assert.equal(staleState.usage[0].status, 'refunded');
assert.equal(staleState.ledger.filter(entry => entry.eventType === 'refund').length, 1);

const rateLimitedState = staleFixture();
const rateLimitedResult = reserveAfterCleanup(rateLimitedState, { rateLimited: true });
assert.equal(rateLimitedResult.code, 'RATE_LIMITED');
assert.equal(rateLimitedResult.balance, 40);
assert.equal(rateLimitedState.wallet, 40, 'Una salida RATE_LIMITED posterior no revierte la reconciliacion');

cleanupStale(staleState);
assert.equal(staleState.wallet, 40, 'Repetir el cleanup no debe duplicar el saldo');
assert.equal(staleState.ledger.filter(entry => entry.eventType === 'refund').length, 1);

const legacyWalletWithoutStale = { wallet: 30, grants: [], usage: [], ledger: [] };
cleanupStale(legacyWalletWithoutStale);
assert.equal(
  legacyWalletWithoutStale.wallet,
  30,
  'Sin stale reservations no se debe borrar el saldo legacy antes de su auto-migracion',
);

console.log('credit-grant-reconciliation.test.js: OK');
