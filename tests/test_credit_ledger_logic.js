const assert = require('node:assert/strict');

/**
 * Simulación y verificación del algoritmo contable de Fase 5:
 * credit_grants (fuente de verdad) + credit_ledger (append-only) + ai_credit_wallets (snapshot)
 */
console.log('=== TEST CREDIT LEDGER & GRANTS CONSUMPTION LOGIC ===');

function createAccountingState() {
  return {
    grants: [],
    ledger: [],
    walletBalance: 0
  };
}

function addGrant(state, { id, sourceType, credits, priority = 50, expiresAt = null }) {
  const grant = {
    id,
    sourceType,
    grantedCredits: credits,
    remainingCredits: credits,
    priority,
    expiresAt
  };
  state.grants.push(grant);
  state.walletBalance += credits;
  state.ledger.push({
    grantId: id,
    eventType: 'grant',
    creditsDelta: credits,
    balanceAfter: state.walletBalance,
    reason: `Asignación de créditos (${sourceType})`
  });
  return grant;
}

function reserveCredits(state, { requestId, cost, action = 'generate_session' }) {
  // Ordenar grants por: priority ASC, expiresAt ASC (fechas más próximas primero), id ASC
  const availableGrants = state.grants
    .filter(g => g.remainingCredits > 0 && (!g.expiresAt || new Date(g.expiresAt) > new Date()))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.expiresAt && b.expiresAt) return new Date(a.expiresAt) - new Date(b.expiresAt);
      if (a.expiresAt) return -1;
      if (b.expiresAt) return 1;
      return 0;
    });

  const totalAvailable = availableGrants.reduce((sum, g) => sum + g.remainingCredits, 0);
  if (totalAvailable < cost) {
    return { ok: false, code: 'INSUFFICIENT_CREDITS', balance: totalAvailable, required: cost };
  }

  let remainingNeeded = cost;
  for (const grant of availableGrants) {
    if (remainingNeeded <= 0) break;
    const deduct = Math.min(grant.remainingCredits, remainingNeeded);
    grant.remainingCredits -= deduct;
    remainingNeeded -= deduct;
    state.walletBalance -= deduct;

    state.ledger.push({
      requestId,
      grantId: grant.id,
      eventType: 'reserve',
      creditsDelta: -deduct,
      balanceAfter: state.walletBalance,
      reason: `Reserva para ${action}`
    });
  }

  return { ok: true, code: 'RESERVED', credits: cost, balance: state.walletBalance };
}

function completeUsage(state, { requestId, action = 'generate_session' }) {
  // En complete, el saldo ya fue debitado en reserve; se añade el asiento append-only de gasto confirmado
  state.ledger.push({
    requestId,
    eventType: 'spend',
    creditsDelta: 0,
    balanceAfter: state.walletBalance,
    reason: `Consumo completado: ${action}`
  });
  return { ok: true, balance: state.walletBalance };
}

function refundUsage(state, { requestId, action = 'generate_session' }) {
  const reservations = state.ledger.filter(
    l => l.requestId === requestId && l.eventType === 'reserve' && l.creditsDelta < 0
  );

  if (reservations.length === 0) {
    return { ok: false, code: 'NO_RESERVATION_TO_REFUND' };
  }

  for (const res of reservations) {
    const refundAmount = Math.abs(res.creditsDelta);
    const grant = state.grants.find(g => g.id === res.grantId);
    if (grant) {
      grant.remainingCredits += refundAmount;
    }
    state.walletBalance += refundAmount;
    state.ledger.push({
      requestId,
      grantId: res.grantId,
      eventType: 'refund',
      creditsDelta: refundAmount,
      balanceAfter: state.walletBalance,
      reason: `Reembolso por fallo en ${action}`
    });
  }

  return { ok: true, code: 'REFUNDED', balance: state.walletBalance };
}

// ==========================================
// TEST 1: Consumo en orden de prioridad y vencimiento
// ==========================================
const state = createAccountingState();

// Promo: prioridad 10 (se debe consumir primero)
addGrant(state, { id: 'grant-promo', sourceType: 'promo', credits: 10, priority: 10, expiresAt: '2026-10-01' });

// Suscripción: prioridad 20 (se debe consumir segundo)
addGrant(state, { id: 'grant-sub', sourceType: 'subscription', credits: 50, priority: 20 });

// Prepago: prioridad 30 (se debe consumir último)
addGrant(state, { id: 'grant-prepaid', sourceType: 'prepaid', credits: 100, priority: 30 });

assert.equal(state.walletBalance, 160, 'Balance inicial debe ser 160');
assert.equal(state.ledger.length, 3, 'Ledger debe tener 3 eventos grant');

// Generar una sesión de 5 créditos
const res1 = reserveCredits(state, { requestId: 'req-1', cost: 5 });
assert.equal(res1.ok, true);
assert.equal(res1.balance, 155);
// Debe haberse consumido de la promo (quedan 5)
assert.equal(state.grants.find(g => g.id === 'grant-promo').remainingCredits, 5);
assert.equal(state.grants.find(g => g.id === 'grant-sub').remainingCredits, 50);

// Generar otra sesión de 8 créditos (debe agotar los 5 restantes de promo y tomar 3 de sub)
const res2 = reserveCredits(state, { requestId: 'req-2', cost: 8 });
assert.equal(res2.ok, true);
assert.equal(res2.balance, 147);
assert.equal(state.grants.find(g => g.id === 'grant-promo').remainingCredits, 0, 'Promo debe estar agotada');
assert.equal(state.grants.find(g => g.id === 'grant-sub').remainingCredits, 47, 'Sub debe tener 47');
console.log('  ✓ Consumo multi-grant con orden de prioridad respetado OK');

// ==========================================
// TEST 2: Reembolso restituye exactamente a los grants de origen
// ==========================================
// Reembolsar req-2 (que tomó 5 de promo y 3 de sub)
const ref2 = refundUsage(state, { requestId: 'req-2' });
assert.equal(ref2.ok, true);
assert.equal(ref2.balance, 155, 'Balance debe regresar a 155');
assert.equal(state.grants.find(g => g.id === 'grant-promo').remainingCredits, 5, 'Promo recuperó sus 5');
assert.equal(state.grants.find(g => g.id === 'grant-sub').remainingCredits, 50, 'Sub recuperó sus 3');
console.log('  ✓ Reembolso exacto a grants originales OK');

// ==========================================
// TEST 3: Confirmación de uso (completeUsage)
// ==========================================
completeUsage(state, { requestId: 'req-1' });
assert.equal(state.walletBalance, 155, 'Completar uso no altera balance');
const spendEvent = state.ledger.at(-1);
assert.equal(spendEvent.eventType, 'spend');
assert.equal(spendEvent.creditsDelta, 0);
assert.equal(spendEvent.requestId, 'req-1');
console.log('  ✓ Confirmación append-only en el ledger OK');

// ==========================================
// TEST 4: Saldo insuficiente
// ==========================================
const resHuge = reserveCredits(state, { requestId: 'req-fail', cost: 9999 });
assert.equal(resHuge.ok, false);
assert.equal(resHuge.code, 'INSUFFICIENT_CREDITS');
assert.equal(resHuge.balance, 155);
console.log('  ✓ Prevención de saldo insuficiente OK');

console.log('>>> TODOS LOS TESTS DE LOGICA CONTABLE PASARON EXITOSAMENTE <<<');
