-- E2: acción económica y entitlement independientes para mapas de planificación con IA.

INSERT INTO public.ai_action_costs (action, credits, enabled)
VALUES ('planning.map.generate', 8, TRUE)
ON CONFLICT (action) DO UPDATE SET
    credits = EXCLUDED.credits,
    enabled = EXCLUDED.enabled,
    updated_at = timezone('utc'::text, now());

INSERT INTO public.plan_entitlements (plan_code, feature_key, enabled)
VALUES
    ('free', 'planning.ai', FALSE),
    ('beta_teacher', 'planning.ai', TRUE),
    ('teacher', 'planning.ai', FALSE),
    ('pro', 'planning.ai', TRUE)
ON CONFLICT (plan_code, feature_key) DO UPDATE
SET enabled = EXCLUDED.enabled;
