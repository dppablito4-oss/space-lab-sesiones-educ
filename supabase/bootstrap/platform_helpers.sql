-- Compatibility bootstrap for fresh/local installations. The original managed
-- project already has this event-trigger function; a historical immutable
-- migration revokes its RPC permissions. Preserve an existing implementation.
-- This file does not install an event trigger or alter existing tables.
DO $bootstrap$
BEGIN
    IF to_regprocedure('public.rls_auto_enable()') IS NULL THEN
        EXECUTE $definition$
            CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
            LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
            AS $function$
            DECLARE cmd record;
            BEGIN
                FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
                    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
                      AND object_type IN ('table', 'partitioned table')
                LOOP
                    IF cmd.schema_name = 'public' THEN
                        BEGIN
                            EXECUTE format('ALTER TABLE IF EXISTS %s ENABLE ROW LEVEL SECURITY', cmd.object_identity);
                        EXCEPTION WHEN OTHERS THEN
                            RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
                        END;
                    END IF;
                END LOOP;
            END;
            $function$
        $definition$;
    END IF;
END;
$bootstrap$;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
