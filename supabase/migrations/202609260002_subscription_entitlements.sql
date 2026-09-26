-- Migración: 202609260002_subscription_entitlements.sql
-- Fase 3 de Refactor SaaS: Capa comercial (Planes, Entitlements y Suscripciones)
-- Garantiza que ningún usuario beta actual pierda acceso asignándolo a 'beta_teacher'.

-- 1. Tabla de Planes de Suscripción Comerciales
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    billing_period TEXT NOT NULL DEFAULT 'monthly', -- 'none', 'monthly', 'yearly'
    price_minor INTEGER NOT NULL DEFAULT 0,          -- en céntimos (ej. 2900 = 29.00 PEN)
    currency TEXT NOT NULL DEFAULT 'PEN',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Entitlements (Permisos y capacidades por plan)
CREATE TABLE IF NOT EXISTS public.plan_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_code TEXT NOT NULL REFERENCES public.subscription_plans(code) ON DELETE CASCADE,
    feature_key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    limit_value NUMERIC DEFAULT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT uq_plan_entitlement UNIQUE (plan_code, feature_key)
);

-- 3. Tabla de Suscripciones de Usuario
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_code TEXT NOT NULL REFERENCES public.subscription_plans(code),
    status TEXT NOT NULL DEFAULT 'active', -- 'trialing', 'active', 'past_due', 'canceled', 'expired'
    provider TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'mercadopago', 'stripe'
    provider_customer_id TEXT DEFAULT NULL,
    provider_subscription_id TEXT DEFAULT NULL,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    current_period_end TIMESTAMPTZ DEFAULT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_subscription UNIQUE (user_id)
);

-- 4. Seed de Planes Comerciales
INSERT INTO public.subscription_plans (code, name, description, billing_period, price_minor, currency, active, is_public)
VALUES
    ('beta_teacher', 'Docente Pionero (Beta)', 'Acceso preferencial completo para evaluadores y docentes pioneros.', 'none', 0, 'PEN', TRUE, FALSE),
    ('free', 'Docente Inicial (Gratuito)', 'Plan introductorio para explorar la planificación asistida por IA.', 'none', 0, 'PEN', TRUE, TRUE),
    ('teacher', 'Docente Regular', 'Plan mensual completo para el docente de aula con cuota ampliada.', 'monthly', 2900, 'PEN', TRUE, TRUE),
    ('pro', 'Docente Especialista / Pro', 'Plan de alta capacidad con acceso a máxima calidad de modelos y exportación.', 'monthly', 5900, 'PEN', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 5. Seed de Entitlements para el plan 'beta_teacher' (Acceso 100% completo para no romper a nadie)
INSERT INTO public.plan_entitlements (plan_code, feature_key, enabled)
VALUES
    ('beta_teacher', 'session.generate', TRUE),
    ('beta_teacher', 'session.save', TRUE),
    ('beta_teacher', 'session.export_docx', TRUE),
    ('beta_teacher', 'session.export_pdf', TRUE),
    ('beta_teacher', 'ai.chat', TRUE),
    ('beta_teacher', 'ai.attach_file', TRUE),
    ('beta_teacher', 'ai.quality_balanced', TRUE),
    ('beta_teacher', 'ai.quality_max', TRUE),
    ('beta_teacher', 'planning.unit', TRUE),
    ('beta_teacher', 'planning.experience', TRUE),
    ('beta_teacher', 'custom.templates', TRUE)
ON CONFLICT (plan_code, feature_key) DO UPDATE SET enabled = TRUE;

-- Seed de Entitlements para el plan 'free'
INSERT INTO public.plan_entitlements (plan_code, feature_key, enabled)
VALUES
    ('free', 'session.generate', TRUE),
    ('free', 'session.save', TRUE),
    ('free', 'session.export_docx', TRUE),
    ('free', 'session.export_pdf', TRUE),
    ('free', 'ai.chat', TRUE),
    ('free', 'ai.attach_file', FALSE),
    ('free', 'ai.quality_balanced', FALSE),
    ('free', 'ai.quality_max', FALSE),
    ('free', 'planning.unit', FALSE),
    ('free', 'planning.experience', FALSE),
    ('free', 'custom.templates', FALSE)
ON CONFLICT (plan_code, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

-- 6. Backfill: Asignar a todos los usuarios existentes al plan 'beta_teacher'
INSERT INTO public.subscriptions (user_id, plan_code, status, provider)
SELECT id, 'beta_teacher', 'active', 'manual'
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 7. Función RPC de consulta de Entitlements del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_entitlements()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_plan_code TEXT;
    v_features JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        -- Usuario anónimo: plan gratuito
        SELECT jsonb_object_agg(feature_key, enabled) INTO v_features
        FROM public.plan_entitlements
        WHERE plan_code = 'free';
        RETURN jsonb_build_object(
            'ok', TRUE,
            'plan', 'anonymous',
            'features', COALESCE(v_features, '{}'::jsonb)
        );
    END IF;

    -- Obtener plan activo del usuario (o asignar beta_teacher si aún no tiene)
    SELECT plan_code INTO v_plan_code
    FROM public.subscriptions
    WHERE user_id = v_user_id AND status = 'active';

    IF v_plan_code IS NULL THEN
        -- Asignar automáticamente a beta_teacher
        INSERT INTO public.subscriptions (user_id, plan_code, status, provider)
        VALUES (v_user_id, 'beta_teacher', 'active', 'manual')
        ON CONFLICT (user_id) DO UPDATE SET status = 'active'
        RETURNING plan_code INTO v_plan_code;
    END IF;

    SELECT jsonb_object_agg(feature_key, enabled) INTO v_features
    FROM public.plan_entitlements
    WHERE plan_code = v_plan_code;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'plan', v_plan_code,
        'features', COALESCE(v_features, '{}'::jsonb)
    );
END;
$$;

-- 8. Seguridad y Políticas RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para subscription_plans
DROP POLICY IF EXISTS "Planes públicos visibles para todos" ON public.subscription_plans;
CREATE POLICY "Planes públicos visibles para todos"
    ON public.subscription_plans FOR SELECT
    USING (active = TRUE);

-- Políticas para plan_entitlements
DROP POLICY IF EXISTS "Entitlements visibles para autenticados" ON public.plan_entitlements;
CREATE POLICY "Entitlements visibles para autenticados"
    ON public.plan_entitlements FOR SELECT
    USING (TRUE);

-- Políticas para subscriptions
DROP POLICY IF EXISTS "Usuarios pueden ver su propia suscripción" ON public.subscriptions;
CREATE POLICY "Usuarios pueden ver su propia suscripción"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

REVOKE ALL ON FUNCTION public.get_user_entitlements() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_entitlements() TO authenticated;
