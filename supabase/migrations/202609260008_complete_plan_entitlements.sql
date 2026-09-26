-- Completa la matriz comercial antes de activar BILLING_ENFORCEMENT.
-- Es incremental: no modifica los entitlements existentes de free o beta_teacher.

INSERT INTO public.plan_entitlements (plan_code, feature_key, enabled)
VALUES
    ('teacher', 'session.generate', TRUE),
    ('teacher', 'session.save', TRUE),
    ('teacher', 'session.export_docx', TRUE),
    ('teacher', 'session.export_pdf', TRUE),
    ('teacher', 'ai.chat', TRUE),
    ('teacher', 'ai.attach_file', TRUE),
    ('teacher', 'ai.quality_balanced', TRUE),
    ('teacher', 'ai.quality_max', FALSE),
    ('teacher', 'planning.unit', FALSE),
    ('teacher', 'planning.experience', FALSE),
    ('teacher', 'custom.templates', TRUE),
    ('pro', 'session.generate', TRUE),
    ('pro', 'session.save', TRUE),
    ('pro', 'session.export_docx', TRUE),
    ('pro', 'session.export_pdf', TRUE),
    ('pro', 'ai.chat', TRUE),
    ('pro', 'ai.attach_file', TRUE),
    ('pro', 'ai.quality_balanced', TRUE),
    ('pro', 'ai.quality_max', TRUE),
    ('pro', 'planning.unit', TRUE),
    ('pro', 'planning.experience', TRUE),
    ('pro', 'custom.templates', TRUE)
ON CONFLICT (plan_code, feature_key) DO UPDATE
SET enabled = EXCLUDED.enabled;
