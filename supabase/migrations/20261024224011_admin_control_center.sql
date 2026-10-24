BEGIN;
-- Private state: no browser grants, no second wallet, no provider credentials.
CREATE TABLE private.admin_permissions (key text PRIMARY KEY);
INSERT INTO private.admin_permissions VALUES
 ('overview.read'),('users.read'),('users.restrict'),('credits.read'),('credits.adjust'),
 ('plans.read'),('plans.assign'),('quotas.write'),('ai.read'),('ai.configure'),('audit.read'),('operators.manage');
CREATE TABLE private.admin_role_permissions (
 role text NOT NULL, permission text NOT NULL REFERENCES private.admin_permissions(key), PRIMARY KEY(role,permission)
);
INSERT INTO private.admin_role_permissions
 SELECT 'admin',key FROM private.admin_permissions WHERE key<>'operators.manage';
INSERT INTO private.admin_role_permissions VALUES
 ('support','users.read'),('support','credits.read'),('support','plans.read'),
 ('finance','overview.read'),('finance','credits.read'),('finance','plans.read'),
 ('analyst','overview.read'),('analyst','plans.read'),('analyst','ai.read'),
 ('auditor','overview.read'),('auditor','users.read'),('auditor','credits.read'),('auditor','plans.read'),('auditor','audit.read');
CREATE TABLE private.admin_operator_roles (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('support','finance','analyst','auditor')),
 expires_at timestamptz, granted_by uuid NOT NULL, PRIMARY KEY(user_id,role)
);
CREATE TABLE private.admin_account_controls (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 state text NOT NULL DEFAULT 'active' CHECK(state IN ('active','suspended','blocked')),
 restrict_ai boolean NOT NULL DEFAULT false, freeze_credits boolean NOT NULL DEFAULT false,
 expires_at timestamptz, reason text NOT NULL, updated_by uuid NOT NULL, version integer NOT NULL DEFAULT 1
);
CREATE TABLE private.admin_operations (
 request_id uuid PRIMARY KEY, actor uuid NOT NULL, action text NOT NULL, parameters jsonb NOT NULL,
 result jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE private.admin_audit_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, request_id uuid NOT NULL UNIQUE,
 actor uuid NOT NULL, action text NOT NULL, target uuid, reason text NOT NULL,
 changes jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_created ON private.admin_audit_events(created_at DESC,id DESC);
CREATE INDEX admin_audit_target ON private.admin_audit_events(target,created_at DESC);
CREATE TABLE private.admin_runtime (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), ai_enabled boolean NOT NULL DEFAULT true,
 message text NOT NULL DEFAULT '', version integer NOT NULL DEFAULT 1
);
INSERT INTO private.admin_runtime DEFAULT VALUES;
ALTER TABLE private.beta_limits ADD COLUMN signups_enabled boolean NOT NULL DEFAULT true;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['admin_permissions','admin_role_permissions','admin_operator_roles','admin_account_controls','admin_operations','admin_audit_events','admin_runtime'] LOOP
  EXECUTE format('ALTER TABLE private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON private.%I FROM PUBLIC, anon, authenticated',t);
 END LOOP;
END $$;
GRANT SELECT ON private.admin_runtime, private.admin_account_controls TO service_role;

CREATE FUNCTION public.account_is_active() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
 SELECT auth.uid() IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM private.admin_account_controls WHERE user_id=auth.uid() AND state<>'active'
  AND (expires_at IS NULL OR expires_at>now()));
$$;
CREATE FUNCTION public.admin_cc_has_permission(p_permission text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
 SELECT public.account_is_active() AND EXISTS(SELECT 1 FROM private.admin_permissions WHERE key=p_permission)
 AND (EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='superadmin') OR EXISTS (
  SELECT 1 FROM private.admin_role_permissions rp WHERE rp.permission=p_permission AND (
   (rp.role='admin' AND EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin')) OR
   EXISTS(SELECT 1 FROM private.admin_operator_roles op WHERE op.user_id=auth.uid() AND op.role=rp.role
    AND (op.expires_at IS NULL OR op.expires_at>now())))));
$$;
CREATE FUNCTION public.admin_cc_authorize(p_permission text,p_step_up boolean DEFAULT false) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
BEGIN
 IF NOT public.admin_cc_has_permission(p_permission) THEN RAISE EXCEPTION 'ADMIN_PERMISSION_DENIED' USING ERRCODE='42501'; END IF;
 IF p_step_up AND auth.jwt()->>'aal' IS DISTINCT FROM 'aal2' THEN RAISE EXCEPTION 'MFA_REQUIRED' USING ERRCODE='42501'; END IF;
 RETURN true;
END $$;
CREATE FUNCTION public.admin_cc_context() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
DECLARE permissions jsonb;
BEGIN
 SELECT jsonb_agg(key ORDER BY key) INTO permissions FROM private.admin_permissions WHERE public.admin_cc_has_permission(key);
 IF permissions IS NULL THEN RAISE EXCEPTION 'ADMIN_PERMISSION_DENIED' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('version',1,'userId',auth.uid(),'permissions',permissions,'mfa',COALESCE(auth.jwt()->>'aal'='aal2',false));
END $$;

-- Existing JWTs cannot bypass a suspension through the data API.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','sesiones','planning_containers','alumnos'] LOOP
  EXECUTE format('CREATE POLICY admin_account_active ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.account_is_active()) WITH CHECK (public.account_is_active())',t);
 END LOOP;
END $$;

-- Legacy administrator policies must not grant access to teacher documents.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['sesiones','planning_containers','alumnos'] LOOP
  EXECUTE format('CREATE POLICY admin_owner_boundary ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid())',t);
 END LOOP;
END $$;
CREATE POLICY admin_owner_boundary ON public.profiles AS RESTRICTIVE FOR ALL TO authenticated
 USING (id=auth.uid()) WITH CHECK (id=auth.uid());

-- Even administrators cannot promote themselves through the profile API.
CREATE OR REPLACE FUNCTION public.check_profile_protected_update() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN NEW; END IF;
 IF OLD.id IS DISTINCT FROM auth.uid() OR
  (to_jsonb(NEW)-ARRAY['username','institucion','dre','ugel','docente','director','nivel']) IS DISTINCT FROM
  (to_jsonb(OLD)-ARRAY['username','institucion','dre','ugel','docente','director','nivel']) THEN
  RAISE EXCEPTION 'PROFILE_PROTECTED_FIELD' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.check_profile_protected_update() FROM PUBLIC,anon,authenticated;

ALTER FUNCTION public.replace_alumnos_roster(text,text,text,text[]) SET SCHEMA private;
ALTER FUNCTION private.replace_alumnos_roster(text,text,text,text[]) RENAME TO cc_roster_core;
REVOKE ALL ON FUNCTION private.cc_roster_core(text,text,text,text[]) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.replace_alumnos_roster(p_nivel text,p_grado text,p_seccion text,p_nombres text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
BEGIN
 IF NOT public.account_is_active() THEN RAISE EXCEPTION 'ACCOUNT_RESTRICTED' USING ERRCODE='42501'; END IF;
 PERFORM private.cc_roster_core(p_nivel,p_grado,p_seccion,p_nombres);
END $$;
REVOKE ALL ON FUNCTION public.replace_alumnos_roster(text,text,text,text[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.replace_alumnos_roster(text,text,text,text[]) TO authenticated;

-- Only server accounting may enter this wrapper. Completions/refunds keep working.
ALTER FUNCTION public.run_ai_accounting(uuid,text,jsonb) SET SCHEMA private;
ALTER FUNCTION private.run_ai_accounting(uuid,text,jsonb) RENAME TO cc_accounting_core;
CREATE FUNCTION public.run_ai_accounting(p_user_id uuid,p_operation text,p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,private AS $$
BEGIN
 IF COALESCE(current_setting('request.jwt.claims',true),'{}')::jsonb->>'role' IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'Backend accounting only' USING ERRCODE='42501'; END IF;
 IF p_operation IN('reserve_ai_credits','begin_ai_gateway_request') THEN
  IF NOT (SELECT ai_enabled FROM private.admin_runtime WHERE singleton) THEN
   RETURN jsonb_build_object('ok',false,'code','AI_DISABLED'); END IF;
  IF EXISTS(SELECT 1 FROM private.admin_account_controls WHERE user_id=p_user_id
   AND (state<>'active' OR restrict_ai OR freeze_credits) AND (expires_at IS NULL OR expires_at>now())) THEN
   RETURN jsonb_build_object('ok',false,'code','ACCOUNT_RESTRICTED'); END IF;
 END IF;
 RETURN private.cc_accounting_core(p_user_id,p_operation,p_payload);
END $$;
REVOKE ALL ON FUNCTION public.run_ai_accounting(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.run_ai_accounting(uuid,text,jsonb) TO service_role;

-- The configured Auth hook keeps its URL, counters and IP salt.
ALTER FUNCTION public.beta_before_user_created(jsonb) SET SCHEMA private;
ALTER FUNCTION private.beta_before_user_created(jsonb) RENAME TO cc_signup_core;
CREATE FUNCTION public.beta_before_user_created(event jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,private AS $$
BEGIN
 IF NOT (SELECT signups_enabled FROM private.beta_limits WHERE singleton) THEN
  RETURN jsonb_build_object('error',jsonb_build_object('http_code',403,'message','El registro está temporalmente cerrado.')); END IF;
 RETURN private.cc_signup_core(event);
END $$;
REVOKE ALL ON FUNCTION public.beta_before_user_created(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.beta_before_user_created(jsonb) TO supabase_auth_admin;

-- Keep the proven ledger implementation private; the old absolute setter is no longer a browser API.
ALTER FUNCTION public.admin_set_ai_credits(uuid,integer,text) SET SCHEMA private;
ALTER FUNCTION private.admin_set_ai_credits(uuid,integer,text) RENAME TO cc_set_credits_core;
REVOKE ALL ON FUNCTION private.cc_set_credits_core(uuid,integer,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.admin_list_ai_credit_accounts(text,integer) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.admin_cc_read(p_resource text,p_query jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
DECLARE result jsonb; items jsonb; total bigint; target uuid;
 lim integer:=LEAST(GREATEST(COALESCE((p_query->>'limit')::integer,25),1),100);
 off integer:=LEAST(GREATEST(COALESCE((p_query->>'offset')::integer,0),0),100000);
 search text:=left(COALESCE(p_query->>'search',''),128);
 since timestamptz:=now()-make_interval(days=>LEAST(GREATEST(COALESCE((p_query->>'days')::integer,30),1),366));
BEGIN
 IF p_resource='overview' THEN
  PERFORM public.admin_cc_authorize('overview.read');
  SELECT jsonb_build_object('users',(SELECT count(*) FROM auth.users),
   'registrations',(SELECT count(*) FROM auth.users WHERE created_at>=since),
   'generations',count(*),'successful',count(*) FILTER(WHERE status='success'),
   'failed',count(*) FILTER(WHERE status IN('refunded','rejected')),
   'credits',COALESCE(sum(credits) FILTER(WHERE status='success'),0),
   'reportedCostUsd',sum(provider_cost_usd) FILTER(WHERE input_tokens IS NOT NULL AND output_tokens IS NOT NULL AND status='success'),
   'telemetrySamples',count(*) FILTER(WHERE input_tokens IS NOT NULL AND output_tokens IS NOT NULL AND status='success'),
   'activeUsers',NULL,'revenue',NULL,'since',since) INTO result FROM public.ai_usage WHERE created_at>=since;
  RETURN result;
 ELSIF p_resource='users' THEN
  PERFORM public.admin_cc_authorize('users.read');
  WITH rows AS (
   SELECT p.id,p.email,p.username,p.role,u.created_at,u.last_sign_in_at,
    CASE WHEN c.expires_at<=now() THEN 'active' ELSE COALESCE(c.state,'active') END AS state,
    COALESCE(s.plan_code,'free') AS plan_code,
    COALESCE((SELECT sum(g.remaining_credits) FROM public.credit_grants g WHERE g.user_id=p.id
      AND g.starts_at<=now() AND (g.expires_at IS NULL OR g.expires_at>now())),0)::integer AS balance,
    count(*) OVER() AS total_count
   FROM public.profiles p JOIN auth.users u ON u.id=p.id
   LEFT JOIN private.admin_account_controls c ON c.user_id=p.id
   LEFT JOIN public.subscriptions s ON s.user_id=p.id AND s.status IN('active','trialing') AND (s.current_period_end IS NULL OR s.current_period_end>now())
   WHERE (search='' OR p.email ILIKE '%'||search||'%' OR COALESCE(p.username,'') ILIKE '%'||search||'%' OR p.id::text=search)
   ORDER BY u.created_at DESC,p.id LIMIT lim OFFSET off
  ) SELECT COALESCE(jsonb_agg(to_jsonb(rows)-'total_count'),'[]'),COALESCE(max(total_count),0) INTO items,total FROM rows;
  IF total=0 AND off>0 THEN SELECT count(*) INTO total FROM public.profiles p WHERE
   search='' OR p.email ILIKE '%'||search||'%' OR COALESCE(p.username,'') ILIKE '%'||search||'%' OR p.id::text=search; END IF;
 ELSIF p_resource='credits' THEN
  PERFORM public.admin_cc_authorize('credits.read');
  WITH rows AS (SELECT p.id,p.email,
   COALESCE((SELECT sum(remaining_credits) FROM public.credit_grants WHERE user_id=p.id AND starts_at<=now()
    AND (expires_at IS NULL OR expires_at>now())),0) AS balance,count(*) OVER() total_count
   FROM public.profiles p WHERE search='' OR p.email ILIKE '%'||search||'%' OR p.id::text=search
   ORDER BY p.id LIMIT lim OFFSET off)
   SELECT COALESCE(jsonb_agg(to_jsonb(rows)-'total_count'),'[]'),COALESCE(max(total_count),0) INTO items,total FROM rows;
  IF total=0 AND off>0 THEN SELECT count(*) INTO total FROM public.profiles p WHERE search='' OR p.email ILIKE '%'||search||'%' OR p.id::text=search; END IF;
 ELSIF p_resource='creditAccount' THEN
  PERFORM public.admin_cc_authorize('credits.read'); target:=(p_query->>'id')::uuid;
  SELECT jsonb_build_object('id',p.id,'email',p.email,'balance',COALESCE((SELECT sum(remaining_credits) FROM public.credit_grants WHERE user_id=p.id
   AND starts_at<=now() AND (expires_at IS NULL OR expires_at>now())),0),'ledger',
   (SELECT COALESCE(jsonb_agg(x),'[]') FROM (SELECT event_type,credits_delta,balance_after,reason,created_at FROM public.credit_ledger
    WHERE user_id=p.id ORDER BY created_at DESC LIMIT 20) x)) INTO result FROM public.profiles p WHERE p.id=target;
  IF result IS NULL THEN RAISE EXCEPTION 'USER_NOT_FOUND' USING ERRCODE='22023'; END IF;
  RETURN result;
 ELSIF p_resource='user' THEN
  PERFORM public.admin_cc_authorize('users.read'); target:=(p_query->>'id')::uuid;
  SELECT jsonb_build_object('id',p.id,'email',p.email,'username',p.username,'role',p.role,
   'controls',COALESCE((SELECT to_jsonb(c)-'updated_by' FROM private.admin_account_controls c WHERE c.user_id=p.id),'{"state":"active","version":0}'::jsonb),
   'subscription',(SELECT to_jsonb(s)-'provider_customer_id'-'provider_subscription_id' FROM public.subscriptions s WHERE s.user_id=p.id),
   'balance',COALESCE((SELECT sum(g.remaining_credits) FROM public.credit_grants g WHERE g.user_id=p.id AND g.starts_at<=now() AND (g.expires_at IS NULL OR g.expires_at>now())),0),
   'ledger',CASE WHEN public.admin_cc_has_permission('credits.read') THEN (SELECT COALESCE(jsonb_agg(x),'[]') FROM
     (SELECT event_type,credits_delta,balance_after,reason,created_at FROM public.credit_ledger WHERE user_id=p.id ORDER BY created_at DESC LIMIT 20) x) ELSE NULL END)
  INTO result FROM public.profiles p WHERE p.id=target;
  IF result IS NULL THEN RAISE EXCEPTION 'USER_NOT_FOUND' USING ERRCODE='22023'; END IF;
  RETURN result;
 ELSIF p_resource='plans' THEN
  PERFORM public.admin_cc_authorize('plans.read');
  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.code),'[]') INTO items FROM public.subscription_plans p;
 ELSIF p_resource='quotas' THEN
  PERFORM public.admin_cc_authorize('plans.read');
  SELECT COALESCE(jsonb_agg(to_jsonb(q) ORDER BY q.plan_code),'[]') INTO items FROM public.ai_quota_policies q;
 ELSIF p_resource='generations' THEN
  PERFORM public.admin_cc_authorize('ai.read');
  WITH rows AS (SELECT request_id,user_id,action,provider,model,credits,status,created_at,completed_at,
    input_tokens,output_tokens,provider_cost_usd,latency_ms,error_code,count(*) OVER() total_count
    FROM public.ai_usage WHERE created_at>=since ORDER BY created_at DESC,id DESC LIMIT lim OFFSET off)
   SELECT COALESCE(jsonb_agg(to_jsonb(rows)-'total_count'),'[]'),COALESCE(max(total_count),0) INTO items,total FROM rows;
  IF total=0 AND off>0 THEN SELECT count(*) INTO total FROM public.ai_usage WHERE created_at>=since; END IF;
 ELSIF p_resource='audit' THEN
  PERFORM public.admin_cc_authorize('audit.read');
  WITH rows AS (SELECT *,count(*) OVER() total_count FROM private.admin_audit_events WHERE created_at>=since
    ORDER BY created_at DESC,id DESC LIMIT lim OFFSET off)
   SELECT COALESCE(jsonb_agg(to_jsonb(rows)-'total_count'),'[]'),COALESCE(max(total_count),0) INTO items,total FROM rows;
  IF total=0 AND off>0 THEN SELECT count(*) INTO total FROM private.admin_audit_events WHERE created_at>=since; END IF;
 ELSIF p_resource='runtime' THEN
  PERFORM public.admin_cc_authorize('ai.read');
  SELECT jsonb_build_object('aiEnabled',r.ai_enabled,'message',r.message,'version',r.version,
    'dailyCredits',b.daily_credits,'maxConcurrent',b.max_concurrent,'dailyEstimatedUsd',b.daily_estimated_usd,
    'signupsEnabled',b.signups_enabled,'signupsPerHour',b.signups_per_hour,'signupsPerDay',b.signups_per_day,
    'signupsPerIpHour',b.signups_per_ip_hour,'environmentOverrides','Additional deploy-time limits may apply')
  INTO result FROM private.admin_runtime r CROSS JOIN private.beta_limits b WHERE r.singleton AND b.singleton;
  RETURN result;
 ELSIF p_resource='operators' THEN
  PERFORM public.admin_cc_authorize('operators.manage');
  SELECT COALESCE(jsonb_agg(to_jsonb(o)),'[]') INTO items FROM private.admin_operator_roles o;
 ELSE RAISE EXCEPTION 'UNKNOWN_ADMIN_RESOURCE' USING ERRCODE='22023';
 END IF;
 RETURN jsonb_build_object('items',items,'total',COALESCE(total,jsonb_array_length(items)),'limit',lim,'offset',off);
END $$;

CREATE FUNCTION public.admin_cc_write(p_request_id uuid,p_action text,p_target uuid,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
DECLARE permission text; allowed text[]; op private.admin_operations%ROWTYPE; v_result jsonb;
 reason text:=trim(p_payload->>'reason'); old_balance integer; new_balance integer; delta integer;
 current_version integer; before_state jsonb; plan public.subscription_plans%ROWTYPE; sub public.subscriptions%ROWTYPE;
BEGIN
 permission:=CASE p_action WHEN 'credits.adjust' THEN 'credits.adjust' WHEN 'users.restrict' THEN 'users.restrict'
  WHEN 'plans.assign' THEN 'plans.assign' WHEN 'quotas.update' THEN 'quotas.write' WHEN 'runtime.update' THEN 'ai.configure'
  WHEN 'operators.assign' THEN 'operators.manage' END;
 IF permission IS NULL THEN RAISE EXCEPTION 'UNKNOWN_ADMIN_ACTION' USING ERRCODE='22023'; END IF;
 PERFORM public.admin_cc_authorize(permission,true);
 IF p_request_id IS NULL OR jsonb_typeof(p_payload)<>'object' OR octet_length(p_payload::text)>8192
  OR reason IS NULL OR char_length(reason)<8 OR char_length(reason)>300 THEN RAISE EXCEPTION 'INVALID_ADMIN_INPUT' USING ERRCODE='22023'; END IF;
 allowed:=CASE p_action
  WHEN 'credits.adjust' THEN ARRAY['reason','delta','expectedBalance']
  WHEN 'users.restrict' THEN ARRAY['reason','state','restrictAi','freezeCredits','expiresAt','version']
  WHEN 'plans.assign' THEN ARRAY['reason','planCode','expiresAt','expectedUpdatedAt']
  WHEN 'quotas.update' THEN ARRAY['reason','planCode','requestsPerMinute','dailyCredits','maxConcurrent','expectedUpdatedAt']
  WHEN 'runtime.update' THEN ARRAY['reason','aiEnabled','message','version','dailyCredits','maxConcurrent','dailyEstimatedUsd','signupsEnabled','signupsPerHour','signupsPerDay','signupsPerIpHour']
  WHEN 'operators.assign' THEN ARRAY['reason','role','expiresAt','remove'] END;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_payload) k WHERE NOT k=ANY(allowed)) THEN
  RAISE EXCEPTION 'UNKNOWN_ADMIN_FIELD' USING ERRCODE='22023'; END IF;
 INSERT INTO private.admin_operations(request_id,actor,action,parameters)
 VALUES(p_request_id,auth.uid(),p_action,jsonb_build_object('target',p_target,'payload',p_payload)) ON CONFLICT DO NOTHING;
 SELECT * INTO STRICT op FROM private.admin_operations WHERE request_id=p_request_id FOR UPDATE;
 IF op.actor<>auth.uid() OR op.action<>p_action OR op.parameters<>jsonb_build_object('target',p_target,'payload',p_payload) THEN
  RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE='22023'; END IF;
 IF op.result IS NOT NULL THEN RETURN op.result||'{"replayed":true}'::jsonb; END IF;
 IF p_action IN('credits.adjust','users.restrict','plans.assign','operators.assign') AND
  (p_target IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_target)) THEN
  RAISE EXCEPTION 'USER_NOT_FOUND' USING ERRCODE='22023'; END IF;
 IF p_action='credits.adjust' THEN
  delta:=(p_payload->>'delta')::integer;
  IF delta IS NULL OR delta=0 OR abs(delta::bigint)>100000 THEN RAISE EXCEPTION 'INVALID_CREDIT_DELTA' USING ERRCODE='22023'; END IF;
  PERFORM 1 FROM public.ai_credit_wallets WHERE user_id=p_target FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'WALLET_NOT_FOUND' USING ERRCODE='22023'; END IF;
  SELECT COALESCE(sum(remaining_credits),0)::integer INTO old_balance FROM public.credit_grants
   WHERE user_id=p_target AND starts_at<=now() AND (expires_at IS NULL OR expires_at>now());
  IF (p_payload->>'expectedBalance')::integer IS DISTINCT FROM old_balance THEN RAISE EXCEPTION 'STALE_BALANCE' USING ERRCODE='40001'; END IF;
  new_balance:=old_balance+delta;
  IF new_balance<0 OR new_balance>1000000 THEN RAISE EXCEPTION 'INVALID_CREDIT_BALANCE' USING ERRCODE='22023'; END IF;
  v_result:=private.cc_set_credits_core(p_target,new_balance,reason);
  IF v_result->>'ok' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'CREDIT_UPDATE_REJECTED'; END IF;
 ELSIF p_action='users.restrict' THEN
  IF p_target=auth.uid() OR EXISTS(SELECT 1 FROM public.profiles WHERE id=p_target AND role='superadmin') THEN
   RAISE EXCEPTION 'PROTECTED_OWNER' USING ERRCODE='42501'; END IF;
  IF (EXISTS(SELECT 1 FROM public.profiles WHERE id=p_target AND role='admin') OR EXISTS(SELECT 1 FROM private.admin_operator_roles WHERE user_id=p_target AND (expires_at IS NULL OR expires_at>now())))
   AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='superadmin') THEN
   RAISE EXCEPTION 'PROTECTED_OPERATOR' USING ERRCODE='42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(p_target::text));
  SELECT to_jsonb(c),c.version INTO before_state,current_version FROM private.admin_account_controls c WHERE user_id=p_target FOR UPDATE;
  IF COALESCE(current_version,0) IS DISTINCT FROM (p_payload->>'version')::integer THEN RAISE EXCEPTION 'STALE_CONTROL' USING ERRCODE='40001'; END IF;
  IF nullif(p_payload->>'expiresAt','')::timestamptz<=now() THEN RAISE EXCEPTION 'INVALID_EXPIRATION' USING ERRCODE='22023'; END IF;
  INSERT INTO private.admin_account_controls(user_id,state,restrict_ai,freeze_credits,expires_at,reason,updated_by)
  VALUES(p_target,p_payload->>'state',COALESCE((p_payload->>'restrictAi')::boolean,false),COALESCE((p_payload->>'freezeCredits')::boolean,false),nullif(p_payload->>'expiresAt','')::timestamptz,reason,auth.uid())
  ON CONFLICT(user_id) DO UPDATE SET state=EXCLUDED.state,restrict_ai=EXCLUDED.restrict_ai,freeze_credits=EXCLUDED.freeze_credits,
    expires_at=EXCLUDED.expires_at,reason=EXCLUDED.reason,updated_by=EXCLUDED.updated_by,version=admin_account_controls.version+1;
  v_result:=jsonb_build_object('ok',true,'previous',before_state,'state',p_payload->>'state');
 ELSIF p_action='plans.assign' THEN
  SELECT * INTO STRICT plan FROM public.subscription_plans WHERE code=p_payload->>'planCode' AND active;
  PERFORM pg_advisory_xact_lock(hashtext(p_target::text));
  SELECT * INTO sub FROM public.subscriptions WHERE user_id=p_target FOR UPDATE;
  IF sub.provider IS NOT NULL AND sub.provider<>'manual' THEN RAISE EXCEPTION 'PAYMENT_PROVIDER_MANAGED' USING ERRCODE='22023'; END IF;
  IF sub.updated_at IS DISTINCT FROM nullif(p_payload->>'expectedUpdatedAt','')::timestamptz THEN RAISE EXCEPTION 'STALE_SUBSCRIPTION' USING ERRCODE='40001'; END IF;
  IF nullif(p_payload->>'expiresAt','')::timestamptz<=now() THEN RAISE EXCEPTION 'INVALID_EXPIRATION' USING ERRCODE='22023'; END IF;
  INSERT INTO public.subscriptions(user_id,plan_code,status,provider,current_period_end)
  VALUES(p_target,plan.code,'active','manual',nullif(p_payload->>'expiresAt','')::timestamptz)
  ON CONFLICT(user_id) DO UPDATE SET plan_code=EXCLUDED.plan_code,status='active',current_period_end=EXCLUDED.current_period_end,updated_at=now();
  v_result:=jsonb_build_object('ok',true,'planCode',plan.code,'previousPlan',sub.plan_code);
 ELSIF p_action='quotas.update' THEN
  SELECT to_jsonb(q) INTO before_state FROM public.ai_quota_policies q WHERE plan_code=p_payload->>'planCode' FOR UPDATE;
  IF NOT COALESCE(((p_payload->>'requestsPerMinute')::integer BETWEEN 1 AND 1000 AND (p_payload->>'dailyCredits')::integer BETWEEN 1 AND 10000
    AND (p_payload->>'maxConcurrent')::integer BETWEEN 1 AND 20),false) THEN RAISE EXCEPTION 'INVALID_QUOTA' USING ERRCODE='22023'; END IF;
  UPDATE public.ai_quota_policies SET requests_per_minute=(p_payload->>'requestsPerMinute')::integer,daily_credit_limit=(p_payload->>'dailyCredits')::integer,
   max_concurrent_requests=(p_payload->>'maxConcurrent')::integer,updated_at=now()
   WHERE plan_code=p_payload->>'planCode' AND updated_at=(p_payload->>'expectedUpdatedAt')::timestamptz;
  IF NOT FOUND THEN RAISE EXCEPTION 'STALE_QUOTA' USING ERRCODE='40001'; END IF;
  v_result:=jsonb_build_object('ok',true,'previous',before_state,'current',
   (SELECT to_jsonb(q) FROM public.ai_quota_policies q WHERE plan_code=p_payload->>'planCode'));
 ELSIF p_action='runtime.update' THEN
  SELECT jsonb_build_object('runtime',to_jsonb(r),'limits',to_jsonb(b)-'ip_salt') INTO before_state
   FROM private.admin_runtime r CROSS JOIN private.beta_limits b WHERE r.singleton AND b.singleton FOR UPDATE;
  IF NOT COALESCE(((p_payload->>'dailyCredits')::integer BETWEEN 1 AND 100000 AND (p_payload->>'maxConcurrent')::integer BETWEEN 1 AND 50
   AND (p_payload->>'dailyEstimatedUsd')::numeric BETWEEN 0.01 AND 1000 AND (p_payload->>'signupsPerHour')::integer BETWEEN 1 AND 10000
   AND (p_payload->>'signupsPerDay')::integer BETWEEN 1 AND 100000 AND (p_payload->>'signupsPerIpHour')::integer BETWEEN 1 AND 1000),false)
   OR length(COALESCE(p_payload->>'message',''))>300 THEN RAISE EXCEPTION 'INVALID_RUNTIME_LIMIT' USING ERRCODE='22023'; END IF;
  UPDATE private.admin_runtime SET ai_enabled=(p_payload->>'aiEnabled')::boolean,message=COALESCE(p_payload->>'message',''),version=version+1
   WHERE singleton AND version=(p_payload->>'version')::integer;
  IF NOT FOUND THEN RAISE EXCEPTION 'STALE_CONFIG' USING ERRCODE='40001'; END IF;
  UPDATE private.beta_limits SET daily_credits=(p_payload->>'dailyCredits')::integer,max_concurrent=(p_payload->>'maxConcurrent')::integer,
   daily_estimated_usd=(p_payload->>'dailyEstimatedUsd')::numeric,signups_enabled=(p_payload->>'signupsEnabled')::boolean,
   signups_per_hour=(p_payload->>'signupsPerHour')::integer,signups_per_day=(p_payload->>'signupsPerDay')::integer,
   signups_per_ip_hour=(p_payload->>'signupsPerIpHour')::integer WHERE singleton;
  v_result:=jsonb_build_object('ok',true,'previous',before_state,'current',
   (SELECT jsonb_build_object('runtime',to_jsonb(r),'limits',to_jsonb(b)-'ip_salt')
    FROM private.admin_runtime r CROSS JOIN private.beta_limits b WHERE r.singleton AND b.singleton));
 ELSIF p_action='operators.assign' THEN
  IF nullif(p_payload->>'expiresAt','')::timestamptz<=now() THEN RAISE EXCEPTION 'INVALID_EXPIRATION' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='superadmin') OR p_target=auth.uid() THEN RAISE EXCEPTION 'OWNER_REQUIRED' USING ERRCODE='42501'; END IF;
  IF p_payload->>'role' NOT IN('support','finance','analyst','auditor') THEN RAISE EXCEPTION 'INVALID_OPERATOR_ROLE' USING ERRCODE='22023'; END IF;
  IF COALESCE((p_payload->>'remove')::boolean,false) THEN
   DELETE FROM private.admin_operator_roles WHERE user_id=p_target AND role=p_payload->>'role';
  ELSE
   INSERT INTO private.admin_operator_roles(user_id,role,expires_at,granted_by)
   VALUES(p_target,p_payload->>'role',nullif(p_payload->>'expiresAt','')::timestamptz,auth.uid())
   ON CONFLICT(user_id,role) DO UPDATE SET expires_at=EXCLUDED.expires_at,granted_by=EXCLUDED.granted_by;
  END IF;
  v_result:=jsonb_build_object('ok',true,'role',p_payload->>'role');
 END IF;
 UPDATE private.admin_operations SET result=v_result WHERE request_id=p_request_id;
 INSERT INTO private.admin_audit_events(request_id,actor,action,target,reason,changes)
 VALUES(p_request_id,auth.uid(),p_action,p_target,reason,v_result);
 RETURN v_result;
END $$;

DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace
  AND (proname LIKE 'admin_cc_%' OR proname='account_is_active') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);
 END LOOP;
END $$;
COMMIT;
