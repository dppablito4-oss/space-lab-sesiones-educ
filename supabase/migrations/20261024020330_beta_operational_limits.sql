BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role, supabase_auth_admin;

CREATE TABLE private.beta_limits (
    singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
    daily_credits integer NOT NULL DEFAULT 500 CHECK(daily_credits > 0),
    max_concurrent integer NOT NULL DEFAULT 8 CHECK(max_concurrent > 0),
    daily_estimated_usd numeric NOT NULL DEFAULT 10 CHECK(daily_estimated_usd > 0),
    signups_per_hour integer NOT NULL DEFAULT 20 CHECK(signups_per_hour > 0),
    signups_per_day integer NOT NULL DEFAULT 100 CHECK(signups_per_day > 0),
    signups_per_ip_hour integer NOT NULL DEFAULT 10 CHECK(signups_per_ip_hour > 0),
    ip_salt text NOT NULL DEFAULT gen_random_uuid()::text
);
INSERT INTO private.beta_limits DEFAULT VALUES;
ALTER TABLE private.beta_limits ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON private.beta_limits TO service_role;
GRANT SELECT ON private.beta_limits TO supabase_auth_admin;
CREATE POLICY auth_limits ON private.beta_limits FOR SELECT TO supabase_auth_admin USING (true);

CREATE TABLE private.beta_signup_windows (
    bucket text PRIMARY KEY, attempts integer NOT NULL, expires_at timestamptz NOT NULL
);
ALTER TABLE private.beta_signup_windows ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.beta_signup_windows TO supabase_auth_admin;
GRANT SELECT ON private.beta_signup_windows TO service_role;
CREATE POLICY auth_signup_windows ON private.beta_signup_windows TO supabase_auth_admin
    USING (true) WITH CHECK (true);

CREATE FUNCTION public.beta_before_user_created(event jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, private AS $$
DECLARE
    limits private.beta_limits%ROWTYPE;
    hour_key text := to_char(now() AT TIME ZONE 'America/Bogota', 'YYYYMMDDHH24');
    day_key text := to_char(now() AT TIME ZONE 'America/Bogota', 'YYYYMMDD');
    ip text := event->'metadata'->>'ip_address';
    buckets text[];
    caps integer[];
    idx integer;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('spacelab-beta-signups'));
    SELECT * INTO STRICT limits FROM private.beta_limits WHERE singleton;
    buckets := ARRAY['hour:' || hour_key, 'day:' || day_key];
    caps := ARRAY[limits.signups_per_hour, limits.signups_per_day];
    IF nullif(ip, '') IS NOT NULL THEN
        buckets := array_append(buckets, 'ip:' || hour_key || ':' || md5(limits.ip_salt || ip));
        caps := array_append(caps, limits.signups_per_ip_hour);
    END IF;
    FOR idx IN 1..array_length(buckets, 1) LOOP
        IF COALESCE((SELECT attempts FROM private.beta_signup_windows WHERE bucket=buckets[idx]), 0) >= caps[idx] THEN
            RETURN jsonb_build_object('error', jsonb_build_object('http_code',429,
                'message','La beta alcanzó temporalmente su límite de registros. Inténtalo más tarde.'));
        END IF;
    END LOOP;
    DELETE FROM private.beta_signup_windows WHERE expires_at < now();
    FOR idx IN 1..array_length(buckets, 1) LOOP
        INSERT INTO private.beta_signup_windows(bucket, attempts, expires_at)
        VALUES(buckets[idx], 1, now()+interval '2 days')
        ON CONFLICT(bucket) DO UPDATE SET attempts=beta_signup_windows.attempts+1;
    END LOOP;
    RETURN '{}'::jsonb;
END;
$$;
REVOKE ALL ON FUNCTION public.beta_before_user_created(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.beta_before_user_created(jsonb) TO supabase_auth_admin;

ALTER FUNCTION public.run_ai_accounting(uuid,text,jsonb) SET SCHEMA private;
ALTER FUNCTION private.run_ai_accounting(uuid,text,jsonb) RENAME TO run_ai_accounting_core;
CREATE FUNCTION public.run_ai_accounting(p_user_id uuid, p_operation text, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public, private AS $$
DECLARE
    limits private.beta_limits%ROWTYPE;
    day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'America/Bogota') AT TIME ZONE 'America/Bogota';
    used integer;
    concurrent integer;
    estimated numeric;
    cost integer;
BEGIN
    IF current_setting('request.jwt.claims',true)::jsonb->>'role' IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'Backend accounting only' USING ERRCODE='42501';
    END IF;
    IF p_operation='reserve_ai_credits' AND NOT EXISTS (
        SELECT 1 FROM public.ai_usage WHERE request_id=(p_payload->>'p_request_id')::uuid AND user_id=p_user_id
    ) THEN
        -- Serializes the global check and the atomic reservation across accounts.
        PERFORM pg_advisory_xact_lock(hashtext('spacelab-beta-reservations'));
        SELECT * INTO STRICT limits FROM private.beta_limits WHERE singleton;
        SELECT COALESCE(sum(credits) FILTER (WHERE created_at>=day_start AND
                (status='success' OR (status='reserved' AND created_at>now()-interval '10 minutes'))),0),
            count(*) FILTER (WHERE status='reserved' AND created_at>now()-interval '10 minutes'),
            COALESCE(sum(provider_cost_usd) FILTER (WHERE status='success' AND created_at>=day_start),0)
        INTO used, concurrent, estimated FROM public.ai_usage;
        SELECT credits INTO cost FROM public.ai_action_costs WHERE action=p_payload->>'p_action' AND enabled;
        IF used+COALESCE(cost,0)>limits.daily_credits OR estimated>=limits.daily_estimated_usd THEN
            RETURN jsonb_build_object('ok',false,'code','BETA_BUDGET_REACHED');
        END IF;
        IF concurrent>=limits.max_concurrent THEN
            RETURN jsonb_build_object('ok',false,'code','BETA_BUSY');
        END IF;
    END IF;
    RETURN private.run_ai_accounting_core(p_user_id,p_operation,p_payload);
END;
$$;
REVOKE ALL ON FUNCTION public.run_ai_accounting(uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_ai_accounting(uuid,text,jsonb) TO service_role;
COMMIT;
