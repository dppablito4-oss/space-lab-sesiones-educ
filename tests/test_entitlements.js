const assert = require('node:assert/strict');
const fs = require('node:fs');

console.log('=== TEST ENTITLEMENTS & CAPABILITY RESOLUTION (FASE 4) ===');

const source = fs.readFileSync('supabase/functions/_shared/entitlements.ts', 'utf8')
  .replace(/export interface [\s\S]*?\n}\n/g, '')
  .replace(/: string\[\]/g, '')
  .replace(/: string/g, '')
  .replace(/: boolean/g, '')
  .replace(/: unknown/g, '')
  .replace(/: Record<[^>]+>/g, '')
  .replace(/: Promise<[^>]+>/g, '')
  .replace(/: EntitlementRpcClient/g, '')
  .replace(/: RequiredFeatureOptions/g, '')
  .replace(/: CheckEntitlementOptions/g, '')
  .replace(/: EntitlementCheckResult/g, '')
  .replace(/as UserEntitlementsResult/g, '')
  .replace(/export /g, '');

const evalContext = { console };
const fn = new Function(
  'exports',
  'Deno',
  `${source}\nexports.getRequiredFeatureKey = getRequiredFeatureKey; exports.getRequiredFeatureKeys = getRequiredFeatureKeys; exports.checkFeatureEntitlement = checkFeatureEntitlement; exports.checkFeatureEntitlements = checkFeatureEntitlements;`,
);
const DenoMock = { env: { get: () => 'false' } };
fn(evalContext, DenoMock);

const {
  getRequiredFeatureKey,
  getRequiredFeatureKeys,
  checkFeatureEntitlement,
  checkFeatureEntitlements,
} = evalContext;

assert.equal(getRequiredFeatureKey('generate_session'), 'session.generate');
assert.equal(getRequiredFeatureKey('chatbot'), 'ai.chat');
assert.deepEqual(
  getRequiredFeatureKeys('generate_session', { hasAttachment: true, modelQuality: 'max_quality' }),
  ['session.generate', 'ai.attach_file', 'ai.quality_max'],
);
assert.deepEqual(
  getRequiredFeatureKeys('chatbot', { modelQuality: 'balanced' }),
  ['ai.chat', 'ai.quality_balanced'],
);
console.log('  ✓ Resolución acumulativa de capacidades OK');

(async () => {
  const clientFree = {
    rpc: async (name) => {
      assert.equal(name, 'get_user_entitlements');
      return {
        data: {
          ok: true,
          plan: 'free',
          features: {
            'session.generate': true,
            'ai.attach_file': false,
            'ai.quality_max': false,
          },
        },
        error: null,
      };
    },
  };

  const shadowResult = await checkFeatureEntitlements(
    clientFree,
    ['session.generate', 'ai.attach_file', 'ai.quality_max'],
    { userId: 'user-free-1', requestId: 'req-1', enforce: false },
  );
  assert.equal(shadowResult.allowed, true);
  assert.equal(shadowResult.wouldBlock, true);
  assert.deepEqual(shadowResult.deniedFeatures, ['ai.attach_file', 'ai.quality_max']);
  console.log('  ✓ Shadow audita todas las capacidades denegadas OK');

  const enforceResult = await checkFeatureEntitlements(
    clientFree,
    ['session.generate', 'ai.attach_file'],
    { userId: 'user-free-1', requestId: 'req-2', enforce: true },
  );
  assert.equal(enforceResult.allowed, false);
  assert.equal(enforceResult.featureKey, 'ai.attach_file');
  console.log('  ✓ Enforcement bloquea capacidades denegadas OK');

  const missingResult = await checkFeatureEntitlement(
    clientFree,
    'feature.not_configured',
    { enforce: true },
  );
  assert.equal(missingResult.allowed, false, 'Una feature ausente debe denegarse');
  console.log('  ✓ Features desconocidas se deniegan en enforcement OK');

  const clientFailure = {
    rpc: async () => ({ data: null, error: new Error('database unavailable') }),
  };
  const failureShadow = await checkFeatureEntitlement(clientFailure, 'session.generate', { enforce: false });
  const failureEnforce = await checkFeatureEntitlement(clientFailure, 'session.generate', { enforce: true });
  assert.equal(failureShadow.allowed, true);
  assert.equal(failureShadow.verificationFailed, true);
  assert.equal(failureEnforce.allowed, false, 'Enforcement debe fallar cerrado');
  assert.equal(failureEnforce.verificationFailed, true);
  console.log('  ✓ Error de verificación permite en shadow y falla cerrado en enforcement OK');

  const invalidResponse = {
    rpc: async () => ({ data: { ok: false, plan: 'unknown', features: {} }, error: null }),
  };
  const invalidEnforce = await checkFeatureEntitlement(
    invalidResponse,
    'session.generate',
    { enforce: true },
  );
  assert.equal(invalidEnforce.allowed, false);
  assert.equal(invalidEnforce.verificationFailed, true);
  console.log('  ✓ Respuesta RPC inválida falla cerrado en enforcement OK');

  const clientBeta = {
    rpc: async () => ({
      data: {
        ok: true,
        plan: 'beta_teacher',
        features: {
          'session.generate': true,
          'ai.attach_file': true,
          'ai.quality_max': true,
        },
      },
      error: null,
    }),
  };
  const betaResult = await checkFeatureEntitlements(
    clientBeta,
    ['session.generate', 'ai.attach_file', 'ai.quality_max'],
    { enforce: true },
  );
  assert.equal(betaResult.allowed, true);
  assert.deepEqual(betaResult.deniedFeatures, []);
  console.log('  ✓ Plan beta con capacidades explícitas permite la solicitud OK');

  console.log('>>> TODOS LOS TESTS DE ENTITLEMENTS PASARON EXITOSAMENTE <<<');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
