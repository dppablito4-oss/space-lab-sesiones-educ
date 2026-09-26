const assert = require('node:assert/strict');
const fs = require('node:fs');

/**
 * Test de la capa de Entitlements (Fase 4 SaaS)
 */
console.log('=== TEST ENTITLEMENTS & CAPABILITY RESOLUTION (FASE 4) ===');

// 1. Cargar y compilar función getRequiredFeatureKey
const source = fs.readFileSync('supabase/functions/_shared/entitlements.ts', 'utf8')
  .replace(/export interface [\s\S]*?\n}\n/g, '')
  .replace(/: string = 0/g, ' = 0')
  .replace(/: number = 0/g, ' = 0')
  .replace(/: string/g, '')
  .replace(/: boolean/g, '')
  .replace(/: unknown/g, '')
  .replace(/: Record<[^>]+>/g, '')
  .replace(/: Promise<[^>]+>/g, '')
  .replace(/: EntitlementRpcClient/g, '')
  .replace(/: RequiredFeatureOptions/g, '')
  .replace(/: CheckEntitlementOptions/g, '')
  .replace(/: UserEntitlementsResult/g, '')
  .replace(/: EntitlementCheckResult/g, '')
  .replace(/as UserEntitlementsResult/g, '')
  .replace(/export /g, '');

const evalContext = { console };
const fn = new Function('exports', 'Deno', `${source}\nexports.getRequiredFeatureKey = getRequiredFeatureKey; exports.checkFeatureEntitlement = checkFeatureEntitlement;`);
const DenoMock = { env: { get: () => 'false' } };
fn(evalContext, DenoMock);

const { getRequiredFeatureKey, checkFeatureEntitlement } = evalContext;

// 1. Mapeo de features según acción y contexto
assert.equal(getRequiredFeatureKey('generate_session'), 'session.generate');
assert.equal(getRequiredFeatureKey('generate_criteria'), 'session.generate');
assert.equal(getRequiredFeatureKey('chatbot'), 'ai.chat');
assert.equal(getRequiredFeatureKey('generate_session', { hasAttachment: true }), 'ai.attach_file');
assert.equal(getRequiredFeatureKey('generate_session', { modelQuality: 'max_quality' }), 'ai.quality_max');
assert.equal(getRequiredFeatureKey('generate_session', { modelQuality: 'balanced' }), 'ai.quality_balanced');
console.log('  ✓ Resolución de requiredFeatureKey según acción y atributos OK');

(async () => {
  // 2. Test modo SHADOW: feature deshabilitada pero BILLING_ENFORCEMENT=false
  // No debe bloquear, debe retornar allowed=true y wouldBlock=true
  const clientShadow = {
    rpc: async (name) => {
      assert.equal(name, 'get_user_entitlements');
      return {
        data: {
          ok: true,
          plan: 'free',
          features: {
            'session.generate': true,
            'ai.attach_file': false,
            'ai.quality_max': false
          }
        },
        error: null
      };
    }
  };

  const shadowResult = await checkFeatureEntitlement(clientShadow, 'ai.attach_file', {
    userId: 'user-free-1',
    requestId: 'req-1',
    enforce: false
  });

  assert.equal(shadowResult.allowed, true, 'En modo shadow debe permitir la solicitud');
  assert.equal(shadowResult.wouldBlock, true, 'En modo shadow debe registrar wouldBlock=true');
  assert.equal(shadowResult.plan, 'free');
  console.log('  ✓ Modo SHADOW no bloquea y audita wouldBlock OK');

  // 3. Test feature habilitada: plan beta_teacher
  const clientBeta = {
    rpc: async () => ({
      data: {
        ok: true,
        plan: 'beta_teacher',
        features: {
          'session.generate': true,
          'ai.attach_file': true,
          'ai.quality_max': true
        }
      },
      error: null
    })
  };

  const betaResult = await checkFeatureEntitlement(clientBeta, 'ai.attach_file', {
    userId: 'user-beta-1',
    requestId: 'req-2'
  });
  assert.equal(betaResult.allowed, true);
  assert.equal(betaResult.wouldBlock, false);
  assert.equal(betaResult.plan, 'beta_teacher');
  console.log('  ✓ Plan beta_teacher permite todo sin advertencias OK');

  // 4. Test modo ENFORCE (futuro): si enforce=true, bloquea
  const enforceResult = await checkFeatureEntitlement(clientShadow, 'ai.attach_file', {
    userId: 'user-free-1',
    requestId: 'req-3',
    enforce: true
  });
  assert.equal(enforceResult.allowed, false, 'En modo enforce debe bloquear');
  assert.equal(enforceResult.wouldBlock, true);
  console.log('  ✓ Modo ENFORCE bloquea cuando se requiere OK');

  console.log('>>> TODOS LOS TESTS DE ENTITLEMENTS PASARON EXITOSAMENTE <<<');
})();
