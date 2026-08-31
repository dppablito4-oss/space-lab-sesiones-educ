-- ==============================================================================
-- 👥 TABLA DE ALUMNOS (ROSTER DE ESTUDIANTES)
-- ==============================================================================
-- Archivo independiente y opcional.
-- No lo ejecutes si ya ejecutaste database_setup.sql, porque esa configuración
-- ya crea esta tabla, su política RLS y su índice.

CREATE TABLE IF NOT EXISTS public.alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nombre_completo TEXT NOT NULL CHECK (char_length(trim(nombre_completo)) > 0),
    nivel TEXT NOT NULL,      -- Inicial, Primaria, Secundaria
    grado TEXT NOT NULL,      -- 1, 2, 3, etc.
    seccion TEXT NOT NULL,    -- A, B, C, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;

-- Política de RLS para que los usuarios solo manejen sus propios alumnos
DROP POLICY IF EXISTS "Users can manage their own student rosters" ON public.alumnos;
CREATE POLICY "Users can manage their own student rosters" 
    ON public.alumnos
    FOR ALL 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Índices para optimizar búsquedas frecuentes por usuario y grado/sección
CREATE INDEX IF NOT EXISTS idx_alumnos_user_grade_section 
    ON public.alumnos (user_id, nivel, grado, seccion);

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
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión para guardar alumnos.'; END IF;
    IF coalesce(array_length(p_nombres, 1), 0) > 200 THEN RAISE EXCEPTION 'La lista no puede superar 200 alumnos.'; END IF;
    DELETE FROM public.alumnos WHERE user_id = v_user_id AND nivel = trim(p_nivel) AND grado = trim(p_grado) AND seccion = upper(trim(p_seccion));
    INSERT INTO public.alumnos (user_id, nombre_completo, nivel, grado, seccion)
    SELECT v_user_id, trim(nombre), trim(p_nivel), trim(p_grado), upper(trim(p_seccion))
    FROM unnest(coalesce(p_nombres, ARRAY[]::TEXT[])) AS nombre
    WHERE char_length(trim(nombre)) > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_alumnos_roster(TEXT, TEXT, TEXT, TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_alumnos_roster(TEXT, TEXT, TEXT, TEXT[]) TO authenticated;
