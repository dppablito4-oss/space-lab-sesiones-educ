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

-- Trigger de protección para evitar que un usuario se auto-asigne el rol de administrador o cambie su rol
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
    -- En peticiones autenticadas, solo un administrador puede cambiar roles.
    -- auth.uid() es NULL en contextos internos de confianza como el SQL Editor
    -- de Supabase o una operación con service_role; esos contextos deben poder
    -- realizar tareas administrativas.
    IF OLD.role IS DISTINCT FROM NEW.role
       AND auth.uid() IS NOT NULL
       AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'No tienes permisos para modificar el rol de usuario.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS before_profile_role_update ON public.profiles;
CREATE TRIGGER before_profile_role_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.check_profile_role_update();

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
