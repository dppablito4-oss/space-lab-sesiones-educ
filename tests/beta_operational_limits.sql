BEGIN;
SET LOCAL statement_timeout='25s';
CREATE TEMP TABLE beta_limit_users(id uuid) ON COMMIT DROP;
INSERT INTO beta_limit_users VALUES(gen_random_uuid());
GRANT SELECT ON beta_limit_users TO service_role;
INSERT INTO auth.users(id,email,aud,role,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
SELECT id,'limits-'||id||'@example.invalid','authenticated','authenticated',
    '{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now() FROM beta_limit_users;
UPDATE private.beta_limits SET daily_credits=1;
SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$
DECLARE uid uuid:=(SELECT id FROM beta_limit_users); rid uuid:=gen_random_uuid(); balance_before integer; result jsonb;
BEGIN
    SELECT balance INTO balance_before FROM public.ai_credit_wallets WHERE user_id=uid;
    result:=public.run_ai_accounting(uid,'reserve_ai_credits',jsonb_build_object(
        'p_request_id',rid,'p_action','generate_session','p_provider','openai','p_model','synthetic'));
    ASSERT result->>'code'='BETA_BUDGET_REACHED';
    ASSERT NOT EXISTS(SELECT 1 FROM public.ai_usage WHERE request_id=rid);
    ASSERT (SELECT balance FROM public.ai_credit_wallets WHERE user_id=uid)=balance_before;
END;
$$;
RESET ROLE;
SELECT pg_advisory_xact_lock(hashtext('spacelab-beta-signups'));
DELETE FROM private.beta_signup_windows;
UPDATE private.beta_limits SET signups_per_hour=2,signups_per_day=10,signups_per_ip_hour=2;
-- Managed Auth owns its role; postgres cannot SET ROLE to it. Validate the
-- hook's result here, ACLs below, then exercise actual public signup by HTTP.
DO $$
DECLARE event jsonb:='{"metadata":{"ip_address":"192.0.2.1"},"user":{"email":"synthetic@example.invalid"}}'; result jsonb;
BEGIN
    ASSERT has_function_privilege('supabase_auth_admin','public.beta_before_user_created(jsonb)','EXECUTE');
    ASSERT has_table_privilege('supabase_auth_admin','private.beta_signup_windows','UPDATE');
    ASSERT public.beta_before_user_created(event)='{}'::jsonb;
    ASSERT public.beta_before_user_created(event)='{}'::jsonb;
    result:=public.beta_before_user_created(event);
    ASSERT result->'error'->>'http_code'='429';
    ASSERT (SELECT max(attempts) FROM private.beta_signup_windows)=2;
END;
$$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
    ASSERT NOT has_schema_privilege('authenticated','private','USAGE');
    ASSERT NOT has_function_privilege('authenticated','public.beta_before_user_created(jsonb)','EXECUTE');
END;
$$;
ROLLBACK;
