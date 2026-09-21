-- =======================================================
-- Space Lab: Esquema de Base de Datos & Políticas RLS
-- Motor: Supabase PostgreSQL
-- =======================================================

-- 1. Tabla de Perfiles de Usuario
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Asegurar columnas en profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institucion TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dre TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ugel TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS docente TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS director TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nivel TEXT;

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para verificar si el usuario es administrador sin entrar en bucle RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'superadmin' OR role = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Políticas de RLS para profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id
        AND role = 'user'
        AND email = (auth.jwt() ->> 'email')
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Trigger para crear perfil automáticamente cuando se registra un usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        'user' -- Todos los usuarios se registran como 'user' por seguridad.
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Protección por allowlist: usuarios normales solo pueden editar campos de UI.
-- Todo campo de identidad, seguridad o añadido en el futuro queda protegido por defecto.
CREATE OR REPLACE FUNCTION public.check_profile_protected_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_editable_fields CONSTANT TEXT[] := ARRAY[
        'username', 'institucion', 'dre', 'ugel',
        'docente', 'director', 'nivel'
    ];
BEGIN
    IF v_user_id IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;
    IF OLD.id IS DISTINCT FROM v_user_id THEN
        RAISE EXCEPTION 'No tienes permisos para modificar este perfil.';
    END IF;
    IF (to_jsonb(NEW) - v_editable_fields)
       IS DISTINCT FROM (to_jsonb(OLD) - v_editable_fields) THEN
        RAISE EXCEPTION 'El perfil contiene cambios en campos protegidos.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_profile_role_update ON public.profiles;
DROP TRIGGER IF EXISTS before_profile_protected_update ON public.profiles;
CREATE TRIGGER before_profile_protected_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.check_profile_protected_update();

DROP FUNCTION IF EXISTS public.check_profile_role_update();
REVOKE ALL ON FUNCTION public.check_profile_protected_update() FROM PUBLIC, anon, authenticated;

-- Sincronizar roles solo con app_metadata. user_metadata puede ser modificada
-- por el propio usuario y nunca debe utilizarse para autorizar administradores.
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
CREATE TRIGGER on_profile_role_update
    AFTER INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_to_auth();

-- Verificar el rol directamente en la tabla protegida. La función SECURITY
-- DEFINER evita la recursión de RLS sin confiar en claims controlados por el usuario.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'superadmin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



-- 2. Tabla Principal de Sesiones
CREATE TABLE IF NOT EXISTS public.sesiones (
    id TEXT PRIMARY KEY, -- Usamos TEXT para mantener los IDs locales 'ses_...'
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    titulo TEXT,
    template TEXT,
    session_data JSONB DEFAULT '{}'::jsonB NOT NULL,
    last_saved TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Migración para añadir columna si la tabla ya existe
ALTER TABLE public.sesiones ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Habilitar RLS en sesiones
ALTER TABLE public.sesiones ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para sesiones
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sesiones;
CREATE POLICY "Users can view their own sessions" ON public.sesiones
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.sesiones;
CREATE POLICY "Users can insert their own sessions" ON public.sesiones
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sessions" ON public.sesiones;
CREATE POLICY "Users can update their own sessions" ON public.sesiones
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.sesiones;
CREATE POLICY "Users can delete their own sessions" ON public.sesiones
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sesiones;
CREATE POLICY "Admins can view all sessions" ON public.sesiones
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete all sessions" ON public.sesiones;
CREATE POLICY "Admins can delete all sessions" ON public.sesiones
    FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all sessions" ON public.sesiones;
CREATE POLICY "Admins can update all sessions" ON public.sesiones
    FOR UPDATE USING (public.is_admin());


-- 3. Tabla de Configuración de Correo Corporativo (SMTP)
CREATE TABLE IF NOT EXISTS public.corporate_email_settings (
    id INT PRIMARY KEY DEFAULT 1,
    smtp_email TEXT NOT NULL,
    smtp_app_password TEXT NOT NULL,
    smtp_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
    smtp_port INT NOT NULL DEFAULT 465,
    smtp_secure BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Asegurar columnas SMTP dinámicas si la tabla ya existe
ALTER TABLE public.corporate_email_settings ADD COLUMN IF NOT EXISTS smtp_host TEXT NOT NULL DEFAULT 'smtp.gmail.com';
ALTER TABLE public.corporate_email_settings ADD COLUMN IF NOT EXISTS smtp_port INT NOT NULL DEFAULT 465;
ALTER TABLE public.corporate_email_settings ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN NOT NULL DEFAULT true;

-- Habilitar RLS en corporate_email_settings
ALTER TABLE public.corporate_email_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para SMTP settings (solo para administradores)
DROP POLICY IF EXISTS "Admins can view SMTP settings" ON public.corporate_email_settings;

DROP POLICY IF EXISTS "Admins can modify SMTP settings" ON public.corporate_email_settings;


-- 4. Tabla de Logs de Seguridad
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'security_logs_action_format'
          AND conrelid = 'public.security_logs'::regclass
    ) THEN
        ALTER TABLE public.security_logs
            ADD CONSTRAINT security_logs_action_format
            CHECK (action ~ '^[A-Z][A-Z0-9_]{0,63}$') NOT VALID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'security_logs_details_length'
          AND conrelid = 'public.security_logs'::regclass
    ) THEN
        ALTER TABLE public.security_logs
            ADD CONSTRAINT security_logs_details_length
            CHECK (details IS NULL OR char_length(details) <= 2000) NOT VALID;
    END IF;
END
$$;

-- Habilitar RLS en security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para security_logs
DROP POLICY IF EXISTS "Admins can view logs" ON public.security_logs;
CREATE POLICY "Admins can view logs" ON public.security_logs
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can insert security logs" ON public.security_logs;
DROP POLICY IF EXISTS "Users can insert their own security logs" ON public.security_logs;
CREATE POLICY "Users can insert their own security logs" ON public.security_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =======================================================
-- 5. Configuración de Storage para Logos Públicos
-- =======================================================

-- Crear bucket de storage 'logos' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp']
WHERE id = 'logos';

-- Crear políticas para permitir a cualquiera ver/listar logos públicos
DROP POLICY IF EXISTS "Public Access to Logos" ON storage.objects;
CREATE POLICY "Public Access to Logos" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'logos' AND auth.uid() = owner);

-- Permitir a usuarios autenticados subir logos
DROP POLICY IF EXISTS "Auth Users Upload Logos" ON storage.objects;
CREATE POLICY "Auth Users Upload Logos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'logos'
        AND auth.uid() = owner
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Permitir a usuarios autenticados actualizar solo sus propios logos
DROP POLICY IF EXISTS "Auth Users Update Logos" ON storage.objects;
CREATE POLICY "Auth Users Update Logos" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'logos' AND auth.uid() = owner)
    WITH CHECK (
        bucket_id = 'logos'
        AND auth.uid() = owner
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Permitir a usuarios autenticados eliminar solo sus propios logos
DROP POLICY IF EXISTS "Auth Users Delete Logos" ON storage.objects;
CREATE POLICY "Auth Users Delete Logos" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'logos' AND auth.uid() = owner);

-- =======================================================
-- 6. Lista de alumnos por docente y sección
-- =======================================================
-- Esta sección ya incluye todo el contenido de student_roster.sql.
-- Si ejecutas este archivo completo, no necesitas ejecutar el archivo separado.

CREATE TABLE IF NOT EXISTS public.alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nombre_completo TEXT NOT NULL CHECK (char_length(trim(nombre_completo)) > 0),
    nivel TEXT NOT NULL,
    grado TEXT NOT NULL,
    seccion TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own student rosters" ON public.alumnos;
CREATE POLICY "Users can manage their own student rosters"
    ON public.alumnos
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_alumnos_user_grade_section
    ON public.alumnos (user_id, nivel, grado, seccion);

-- Reemplazo atómico de roster: evita perder la lista si falla la inserción
-- después del borrado de registros anteriores.
CREATE OR REPLACE FUNCTION public.replace_alumnos_roster(
    p_nivel TEXT,
    p_grado TEXT,
    p_seccion TEXT,
    p_nombres TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para guardar alumnos.';
    END IF;
    IF coalesce(array_length(p_nombres, 1), 0) > 200 THEN
        RAISE EXCEPTION 'La lista no puede superar 200 alumnos.';
    END IF;

    DELETE FROM public.alumnos
    WHERE user_id = v_user_id
      AND nivel = trim(p_nivel)
      AND grado = trim(p_grado)
      AND seccion = upper(trim(p_seccion));

    INSERT INTO public.alumnos (user_id, nombre_completo, nivel, grado, seccion)
    SELECT v_user_id, trim(nombre), trim(p_nivel), trim(p_grado), upper(trim(p_seccion))
    FROM unnest(coalesce(p_nombres, ARRAY[]::TEXT[])) AS nombre
    WHERE char_length(trim(nombre)) > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_alumnos_roster(TEXT, TEXT, TEXT, TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_alumnos_roster(TEXT, TEXT, TEXT, TEXT[]) TO authenticated;

-- =======================================================
-- 7. Planes, billeteras y consumo de créditos de IA
-- Mantener sincronizado con 202609210002_ai_credits.sql.
-- =======================================================
-- Stable Core V1: server-authoritative AI credit accounting.

CREATE TABLE IF NOT EXISTS public.ai_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    monthly_credits INTEGER NOT NULL CHECK (monthly_credits >= 0),
    daily_credit_limit INTEGER NOT NULL CHECK (daily_credit_limit > 0),
    requests_per_minute INTEGER NOT NULL CHECK (requests_per_minute > 0),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.ai_plans (id, name, monthly_credits, daily_credit_limit, requests_per_minute, enabled)
VALUES ('free', 'Free', 30, 15, 5, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    monthly_credits = EXCLUDED.monthly_credits,
    daily_credit_limit = EXCLUDED.daily_credit_limit,
    requests_per_minute = EXCLUDED.requests_per_minute,
    enabled = EXCLUDED.enabled,
    updated_at = timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.ai_action_costs (
    action TEXT PRIMARY KEY,
    credits INTEGER NOT NULL CHECK (credits > 0),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.ai_action_costs (action, credits, enabled) VALUES
    ('generate_session', 5, TRUE),
    ('generate_criteria', 1, TRUE),
    ('refine_text', 1, TRUE),
    ('pedagogy_brief', 1, TRUE),
    ('summarize_brief', 1, TRUE),
    ('chatbot', 1, TRUE)
ON CONFLICT (action) DO UPDATE SET
    credits = EXCLUDED.credits,
    enabled = EXCLUDED.enabled,
    updated_at = timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.ai_credit_wallets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL DEFAULT 'free' REFERENCES public.ai_plans(id),
    balance INTEGER NOT NULL DEFAULT 30 CHECK (balance >= 0),
    cycle_started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id UUID NOT NULL,
    action TEXT NOT NULL REFERENCES public.ai_action_costs(action),
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    credits INTEGER NOT NULL CHECK (credits >= 0),
    status TEXT NOT NULL CHECK (status IN ('reserved', 'success', 'refunded', 'rejected')),
    input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
    output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created
    ON public.ai_usage (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_reserved_created
    ON public.ai_usage (status, created_at)
    WHERE status = 'reserved';

ALTER TABLE public.ai_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own AI wallet" ON public.ai_credit_wallets;
CREATE POLICY "Users can read their own AI wallet"
    ON public.ai_credit_wallets FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own AI usage" ON public.ai_usage;
CREATE POLICY "Users can read their own AI usage"
    ON public.ai_usage FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

REVOKE ALL ON public.ai_plans, public.ai_action_costs, public.ai_credit_wallets, public.ai_usage FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.ai_credit_wallets, public.ai_usage FROM authenticated;
GRANT SELECT ON public.ai_credit_wallets, public.ai_usage TO authenticated;

CREATE OR REPLACE FUNCTION public.create_ai_wallet_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_monthly_credits INTEGER;
BEGIN
    SELECT monthly_credits INTO v_monthly_credits
    FROM public.ai_plans WHERE id = 'free' AND enabled = TRUE;

    INSERT INTO public.ai_credit_wallets (user_id, plan_id, balance)
    VALUES (NEW.id, 'free', COALESCE(v_monthly_credits, 30))
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_ai_wallet ON auth.users;
CREATE TRIGGER on_auth_user_ai_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_ai_wallet_for_user();

INSERT INTO public.ai_credit_wallets (user_id, plan_id, balance)
SELECT users.id, 'free', plans.monthly_credits
FROM auth.users AS users
CROSS JOIN public.ai_plans AS plans
WHERE plans.id = 'free'
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.reserve_ai_credits(
    p_request_id UUID,
    p_action TEXT,
    p_provider TEXT,
    p_model TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_wallet public.ai_credit_wallets%ROWTYPE;
    v_plan public.ai_plans%ROWTYPE;
    v_cost INTEGER;
    v_recent_requests INTEGER;
    v_daily_credits INTEGER;
    v_stale_refund INTEGER;
    v_existing_status TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'AUTH_REQUIRED');
    END IF;
    IF p_request_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_REQUEST_ID');
    END IF;

    SELECT * INTO v_wallet
    FROM public.ai_credit_wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.ai_credit_wallets (user_id, plan_id, balance)
        SELECT v_user_id, id, monthly_credits FROM public.ai_plans WHERE id = 'free'
        ON CONFLICT (user_id) DO NOTHING;
        SELECT * INTO v_wallet
        FROM public.ai_credit_wallets
        WHERE user_id = v_user_id
        FOR UPDATE;
    END IF;

    SELECT * INTO v_plan FROM public.ai_plans WHERE id = v_wallet.plan_id;
    IF NOT FOUND OR NOT v_plan.enabled THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'PLAN_DISABLED');
    END IF;

    SELECT status INTO v_existing_status
    FROM public.ai_usage
    WHERE user_id = v_user_id AND request_id = p_request_id;
    IF FOUND THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'code', 'DUPLICATE_REQUEST',
            'status', v_existing_status,
            'balance', v_wallet.balance
        );
    END IF;

    IF v_wallet.cycle_started_at + INTERVAL '1 month' <= timezone('utc', now()) THEN
        UPDATE public.ai_usage
        SET status = 'refunded', completed_at = timezone('utc', now())
        WHERE user_id = v_user_id AND status = 'reserved';

        UPDATE public.ai_credit_wallets
        SET balance = v_plan.monthly_credits,
            cycle_started_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE user_id = v_user_id
        RETURNING * INTO v_wallet;
    ELSE
        WITH stale AS (
            UPDATE public.ai_usage
            SET status = 'refunded', completed_at = timezone('utc', now())
            WHERE user_id = v_user_id
              AND status = 'reserved'
              AND created_at < timezone('utc', now()) - INTERVAL '15 minutes'
            RETURNING credits
        )
        SELECT COALESCE(sum(credits), 0)::INTEGER INTO v_stale_refund FROM stale;

        IF v_stale_refund > 0 THEN
            UPDATE public.ai_credit_wallets
            SET balance = LEAST(v_plan.monthly_credits, balance + v_stale_refund),
                updated_at = timezone('utc', now())
            WHERE user_id = v_user_id
            RETURNING * INTO v_wallet;
        END IF;
    END IF;

    SELECT credits INTO v_cost
    FROM public.ai_action_costs
    WHERE action = p_action AND enabled = TRUE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'UNKNOWN_ACTION', 'balance', v_wallet.balance);
    END IF;

    SELECT count(*)::INTEGER INTO v_recent_requests
    FROM public.ai_usage
    WHERE user_id = v_user_id
      AND created_at >= timezone('utc', now()) - INTERVAL '1 minute';
    IF v_recent_requests >= v_plan.requests_per_minute THEN
        INSERT INTO public.ai_usage (user_id, request_id, action, provider, model, credits, status, completed_at)
        VALUES (v_user_id, p_request_id, p_action, p_provider, p_model, v_cost, 'rejected', timezone('utc', now()));
        RETURN jsonb_build_object('ok', FALSE, 'code', 'RATE_LIMITED', 'balance', v_wallet.balance);
    END IF;

    SELECT COALESCE(sum(credits), 0)::INTEGER INTO v_daily_credits
    FROM public.ai_usage
    WHERE user_id = v_user_id
      AND status IN ('reserved', 'success')
      AND created_at >= date_trunc('day', timezone('utc', now()));
    IF v_daily_credits + v_cost > v_plan.daily_credit_limit THEN
        INSERT INTO public.ai_usage (user_id, request_id, action, provider, model, credits, status, completed_at)
        VALUES (v_user_id, p_request_id, p_action, p_provider, p_model, v_cost, 'rejected', timezone('utc', now()));
        RETURN jsonb_build_object('ok', FALSE, 'code', 'DAILY_LIMIT_REACHED', 'balance', v_wallet.balance);
    END IF;

    IF v_wallet.balance < v_cost THEN
        INSERT INTO public.ai_usage (user_id, request_id, action, provider, model, credits, status, completed_at)
        VALUES (v_user_id, p_request_id, p_action, p_provider, p_model, v_cost, 'rejected', timezone('utc', now()));
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INSUFFICIENT_CREDITS', 'balance', v_wallet.balance, 'required', v_cost);
    END IF;

    UPDATE public.ai_credit_wallets
    SET balance = balance - v_cost, updated_at = timezone('utc', now())
    WHERE user_id = v_user_id
    RETURNING * INTO v_wallet;

    INSERT INTO public.ai_usage (user_id, request_id, action, provider, model, credits, status)
    VALUES (v_user_id, p_request_id, p_action, p_provider, p_model, v_cost, 'reserved');

    RETURN jsonb_build_object(
        'ok', TRUE,
        'code', 'RESERVED',
        'credits', v_cost,
        'balance', v_wallet.balance,
        'planId', v_wallet.plan_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_ai_usage(
    p_request_id UUID,
    p_input_tokens INTEGER DEFAULT NULL,
    p_output_tokens INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_usage public.ai_usage%ROWTYPE;
    v_balance INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'AUTH_REQUIRED');
    END IF;

    SELECT * INTO v_usage FROM public.ai_usage
    WHERE user_id = v_user_id AND request_id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'USAGE_NOT_FOUND');
    END IF;
    IF v_usage.status = 'success' THEN
        SELECT balance INTO v_balance FROM public.ai_credit_wallets WHERE user_id = v_user_id;
        RETURN jsonb_build_object('ok', TRUE, 'code', 'ALREADY_COMPLETED', 'balance', v_balance);
    END IF;
    IF v_usage.status <> 'reserved' THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_USAGE_STATE', 'status', v_usage.status);
    END IF;

    UPDATE public.ai_usage
    SET status = 'success',
        input_tokens = CASE
            WHEN p_input_tokens IS NULL THEN NULL
            ELSE GREATEST(p_input_tokens, 0)
        END,
        output_tokens = CASE
            WHEN p_output_tokens IS NULL THEN NULL
            ELSE GREATEST(p_output_tokens, 0)
        END,
        completed_at = timezone('utc', now())
    WHERE id = v_usage.id;
    SELECT balance INTO v_balance FROM public.ai_credit_wallets WHERE user_id = v_user_id;
    RETURN jsonb_build_object('ok', TRUE, 'code', 'COMPLETED', 'balance', v_balance);
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_ai_usage(p_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_usage public.ai_usage%ROWTYPE;
    v_wallet public.ai_credit_wallets%ROWTYPE;
    v_monthly_credits INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'AUTH_REQUIRED');
    END IF;

    SELECT * INTO v_wallet FROM public.ai_credit_wallets
    WHERE user_id = v_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'WALLET_NOT_FOUND');
    END IF;

    SELECT * INTO v_usage FROM public.ai_usage
    WHERE user_id = v_user_id AND request_id = p_request_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'USAGE_NOT_FOUND');
    END IF;
    IF v_usage.status = 'refunded' THEN
        RETURN jsonb_build_object('ok', TRUE, 'code', 'ALREADY_REFUNDED', 'balance', v_wallet.balance);
    END IF;
    IF v_usage.status <> 'reserved' THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_USAGE_STATE', 'status', v_usage.status);
    END IF;

    SELECT monthly_credits INTO v_monthly_credits FROM public.ai_plans WHERE id = v_wallet.plan_id;
    UPDATE public.ai_credit_wallets
    SET balance = LEAST(v_monthly_credits, balance + v_usage.credits),
        updated_at = timezone('utc', now())
    WHERE user_id = v_user_id
    RETURNING * INTO v_wallet;

    UPDATE public.ai_usage
    SET status = 'refunded', completed_at = timezone('utc', now())
    WHERE id = v_usage.id;

    RETURN jsonb_build_object('ok', TRUE, 'code', 'REFUNDED', 'balance', v_wallet.balance);
END;
$$;

REVOKE ALL ON FUNCTION public.create_ai_wallet_for_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_ai_credits(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_ai_usage(UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.refund_ai_usage(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_ai_credits(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_ai_usage(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_ai_usage(UUID) TO authenticated;
