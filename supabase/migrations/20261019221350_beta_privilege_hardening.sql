-- Browser roles need row CRUD governed by RLS, never whole-table operations.
-- No application records are changed by this migration.
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public
    FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM PUBLIC, anon, authenticated;

-- Trigger functions run through their triggers; they are not public RPCs.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_role_to_auth() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- Administrative RLS checks remain available to signed-in users.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- The six-argument accounting function supersedes the legacy overload.
REVOKE ALL ON FUNCTION public.complete_ai_usage(UUID, INTEGER, INTEGER)
    FROM PUBLIC, anon, authenticated;

-- Anonymous visitors do not need private account tables. Catalogs are unchanged.
REVOKE ALL ON TABLE public.profiles, public.sesiones, public.alumnos,
    public.security_logs, public.corporate_email_settings, public.ai_gateway_requests,
    public.ai_credit_wallets, public.ai_usage, public.credit_grants, public.credit_ledger,
    public.subscriptions, public.planning_containers FROM anon;
