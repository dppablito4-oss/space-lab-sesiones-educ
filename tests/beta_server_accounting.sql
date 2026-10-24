-- Run in a separate transaction: synthetic users and credit events roll back.
BEGIN;
SET LOCAL statement_timeout = '25s';
CREATE TEMP TABLE accounting_users (kind text, id uuid) ON COMMIT DROP;
INSERT INTO accounting_users VALUES ('a', gen_random_uuid()), ('b', gen_random_uuid());
GRANT SELECT ON accounting_users TO authenticated, service_role;
INSERT INTO auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
SELECT id, 'accounting-test-' || id || '@example.invalid', 'authenticated', 'authenticated',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
FROM accounting_users;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', jsonb_build_object('sub', id, 'role', 'authenticated')::text, true)
FROM accounting_users WHERE kind = 'a';
DO $$
DECLARE denied boolean := false;
BEGIN
    ASSERT NOT has_function_privilege('authenticated', 'public.run_ai_accounting(uuid,text,jsonb)', 'EXECUTE');
    BEGIN
        PERFORM public.run_ai_accounting((SELECT id FROM accounting_users WHERE kind='b'), 'refund_ai_usage', '{}');
    EXCEPTION WHEN insufficient_privilege THEN denied := true;
    END;
    ASSERT denied, 'Browser must not impersonate the accounting backend';
END;
$$;
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
DO $$
DECLARE
    a uuid := (SELECT id FROM accounting_users WHERE kind='a');
    b uuid := (SELECT id FROM accounting_users WHERE kind='b');
    v_request_id uuid := gen_random_uuid();
    paid_id uuid := gen_random_uuid();
    result jsonb;
    balance_before integer;
    denied boolean := false;
BEGIN
    SELECT balance INTO balance_before FROM public.ai_credit_wallets WHERE user_id=a;
    result := public.run_ai_accounting(a, 'reserve_ai_credits', jsonb_build_object(
        'p_request_id',v_request_id, 'p_action','refine_text','p_provider','openai','p_model','gpt-6-luna', 'p_user_id',b));
    ASSERT result->>'ok'='true', 'Backend reserve must succeed';
    ASSERT current_setting('request.jwt.claims')::jsonb->>'role'='service_role', 'Identity must be restored';
    ASSERT (SELECT u.user_id FROM public.ai_usage u WHERE u.request_id=v_request_id)=a, 'Payload must not change owner';
    result := public.run_ai_accounting(b, 'refund_ai_usage', jsonb_build_object('p_request_id',v_request_id));
    ASSERT result->>'ok'='false', 'Another user cannot refund a reservation';
    result := public.run_ai_accounting(a, 'refund_ai_usage', jsonb_build_object('p_request_id',v_request_id));
    ASSERT result->>'ok'='true', 'Backend refund must succeed';
    result := public.run_ai_accounting(a, 'refund_ai_usage', jsonb_build_object('p_request_id',v_request_id));
    ASSERT result->>'ok'='true', 'Backend refund must be idempotent';
    ASSERT (SELECT balance FROM public.ai_credit_wallets WHERE user_id=a)=balance_before, 'Refund restores exact balance';
    result := public.run_ai_accounting(a, 'reserve_ai_credits', jsonb_build_object(
        'p_request_id',paid_id, 'p_action','refine_text','p_provider','openai','p_model','gpt-6-luna'));
    ASSERT result->>'ok'='true';
    result := public.run_ai_accounting(a, 'complete_ai_usage', jsonb_build_object(
        'p_request_id',paid_id, 'p_input_tokens',1,'p_output_tokens',1,'p_provider_model','synthetic-test','p_cost_usd',0,'p_latency_ms',1));
    ASSERT result->>'ok'='true', 'Backend completion succeeds';
    result := public.run_ai_accounting(a, 'refund_ai_usage', jsonb_build_object('p_request_id',paid_id));
    ASSERT result->>'ok'='false', 'Completed usage cannot be refunded';
    BEGIN
        PERFORM public.run_ai_accounting(a, 'invented_operation', '{}');
    EXCEPTION WHEN invalid_parameter_value THEN denied := true;
    END;
    ASSERT denied, 'Only allowlisted operations may execute';
    ASSERT current_setting('request.jwt.claims')::jsonb->>'role'='service_role', 'Failure must restore identity';
    result := public.run_ai_accounting(gen_random_uuid(), 'refund_ai_usage', '{}');
    ASSERT result->>'ok'='false', 'Unknown account must be rejected';
END;
$$;
ROLLBACK;
