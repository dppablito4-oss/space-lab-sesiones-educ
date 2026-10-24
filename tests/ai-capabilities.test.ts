import { availableSessionQualities } from '../supabase/functions/_shared/ai-capabilities.ts';

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
}
Deno.test('discovery fails closed for missing account/backend and gates paid quality', () => {
  equal(availableSessionQualities(null, () => true), []);
  equal(availableSessionQualities({ok:false}, () => true), []);
  equal(availableSessionQualities({ok:true,features:{'session.generate':true}}, () => false), []);
  equal(availableSessionQualities({ok:true,features:{'session.generate':true}}, () => true), ['automatic','fast']);
  equal(availableSessionQualities({ok:true,features:{'session.generate':true,'ai.quality_balanced':true,'ai.quality_max':true}}, () => true), ['automatic','fast','balanced','max_quality']);
  equal(availableSessionQualities({ok:true,features:{'session.generate':false,'ai.quality_max':true}}, () => true), []);
});
Deno.test('discovery uses a configured fallback route', () => {
  equal(availableSessionQualities({ok:true,features:{'session.generate':true}}, provider => provider === 'gemini'), ['automatic','fast']);
});
