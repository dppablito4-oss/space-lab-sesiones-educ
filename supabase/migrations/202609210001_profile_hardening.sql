-- Protect identity, authorization and every future profile column by default.
-- Normal users may update only the fields explicitly editable in the current UI.

CREATE OR REPLACE FUNCTION public.check_profile_protected_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_editable_fields CONSTANT TEXT[] := ARRAY[
        'username',
        'institucion',
        'dre',
        'ugel',
        'docente',
        'director',
        'nivel'
    ];
BEGIN
    -- SQL Editor, migrations and service_role are trusted internal contexts.
    -- Legitimate administrators retain their current management capabilities.
    IF v_user_id IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF OLD.id IS DISTINCT FROM v_user_id THEN
        RAISE EXCEPTION 'No tienes permisos para modificar este perfil.';
    END IF;

    -- Removing the editable fields leaves identity/security fields and also
    -- automatically protects columns introduced by future migrations.
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
