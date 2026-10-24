/** Discoverable choices, without reserving credits or exposing keys/provider names. */
import { decideAiRoute, fallbackRoute, type AiProvider, type AiQuality } from './ai-routing.ts';
import { getRequiredFeatureKeys } from './entitlements.ts';

export function availableSessionQualities(
  entitlements: unknown,
  configured: (provider: AiProvider) => boolean,
): AiQuality[] {
  if (!entitlements || typeof entitlements !== 'object') return [];
  const result = entitlements as {ok?: boolean; features?: Record<string, boolean>};
  if (result.ok !== true || !result.features || Array.isArray(result.features)) return [];
  const qualities: AiQuality[] = ['automatic', 'fast', 'balanced', 'max_quality'];
  return qualities.filter(quality => {
    if (!getRequiredFeatureKeys('generate_session', {modelQuality:quality}).every(key => result.features?.[key] === true)) return false;
    const primary = decideAiRoute({action:'generate_session', quality});
    return configured(primary.provider) || configured(fallbackRoute(primary.provider, quality).provider);
  });
}
