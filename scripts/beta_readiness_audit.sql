-- Read-only infrastructure inventory. Does not select user records or secrets.
BEGIN TRANSACTION READ ONLY;

-- One result set: CLI db query returns only the last SELECT's rows.
WITH tables AS (
    SELECT expected.name AS required_table, c.oid IS NOT NULL AS installed,
           COALESCE(c.relrowsecurity, false) AS rls_enabled
    FROM (VALUES ('profiles'), ('sesiones'), ('alumnos'), ('planning_containers'),
        ('ai_credit_wallets'), ('ai_usage'), ('credit_grants'), ('credit_ledger'),
        ('ai_gateway_requests'), ('subscriptions')) AS expected(name)
    LEFT JOIN pg_namespace n ON n.nspname = 'public'
    LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = expected.name
), policies AS (
    SELECT tablename, policyname, roles, cmd, qual, with_check
    FROM pg_policies WHERE schemaname = 'public'
), functions AS (
    SELECT p.oid::regprocedure::text AS signature, p.prosecdef AS security_definer,
           has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
           has_function_privilege('authenticated', p.oid, 'EXECUTE') AS user_can_execute
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
), excessive_grants AS (
    SELECT c.relname AS table_name, roles.name AS role_name, privilege.name AS privilege
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    CROSS JOIN (VALUES ('anon'), ('authenticated')) AS roles(name)
    CROSS JOIN (VALUES ('TRUNCATE'), ('TRIGGER'), ('REFERENCES')) AS privilege(name)
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
      AND has_table_privilege(roles.name, c.oid, privilege.name)
)
SELECT jsonb_build_object(
    'tables', (SELECT jsonb_agg(to_jsonb(t) ORDER BY required_table) FROM tables t),
    'policies', (SELECT jsonb_agg(to_jsonb(p) ORDER BY tablename, policyname) FROM policies p),
    'functions', (SELECT jsonb_agg(to_jsonb(f) ORDER BY signature) FROM functions f),
    'excessive_grants', COALESCE((SELECT jsonb_agg(to_jsonb(g) ORDER BY table_name, role_name, privilege) FROM excessive_grants g), '[]'::jsonb)
) AS inventory;

COMMIT;
