-- Persistencia multiusuario para PlanningContainer v1.

CREATE TABLE IF NOT EXISTS public.planning_containers (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    schema_version TEXT NOT NULL DEFAULT '1.0',
    revision INTEGER NOT NULL CHECK (revision >= 1),
    status TEXT NOT NULL CHECK (status IN ('draft', 'reviewed', 'archived')),
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    planning_type TEXT NOT NULL CHECK (planning_type IN ('learning_experience', 'unit', 'project', 'context')),
    education_level TEXT NOT NULL CHECK (education_level IN ('initial', 'primary', 'secondary')),
    container_data JSONB NOT NULL,
    last_saved TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, id),
    CONSTRAINT planning_container_id_format CHECK (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT planning_container_schema_v1 CHECK (
        jsonb_typeof(container_data) = 'object'
        AND schema_version = '1.0'
        AND container_data ->> 'schemaVersion' = schema_version
    ),
    CONSTRAINT planning_container_identity_consistent CHECK (
        container_data ->> 'id' = id
        AND (container_data ->> 'revision')::INTEGER = revision
        AND container_data ->> 'status' = status
        AND container_data #>> '{identity,title}' = title
        AND container_data #>> '{identity,planningType}' = planning_type
        AND container_data #>> '{identity,level}' = education_level
    ),
    CONSTRAINT planning_container_size_limit CHECK (pg_column_size(container_data) <= 2097152)
);

CREATE INDEX IF NOT EXISTS idx_planning_containers_user_active_saved
    ON public.planning_containers (user_id, last_saved DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_planning_containers_user_level_type
    ON public.planning_containers (user_id, education_level, planning_type)
    WHERE deleted_at IS NULL;

ALTER TABLE public.planning_containers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own planning containers" ON public.planning_containers;
CREATE POLICY "Users can view their own planning containers"
    ON public.planning_containers
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own planning containers" ON public.planning_containers;
CREATE POLICY "Users can insert their own planning containers"
    ON public.planning_containers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own planning containers" ON public.planning_containers;
CREATE POLICY "Users can update their own planning containers"
    ON public.planning_containers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own planning containers" ON public.planning_containers;
CREATE POLICY "Users can delete their own planning containers"
    ON public.planning_containers
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

REVOKE ALL ON public.planning_containers FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planning_containers TO authenticated;
GRANT ALL ON public.planning_containers TO service_role;
