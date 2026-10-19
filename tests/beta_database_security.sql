-- Real-role integration checks against an installed database. All fixture
-- accounts and accounting operations are rolled back. No emails or AI calls.
BEGIN;
SET LOCAL statement_timeout = '25s';

CREATE TEMP TABLE beta_security_users (kind TEXT, id UUID, email TEXT) ON COMMIT DROP;
INSERT INTO beta_security_users
SELECT kind, gen_random_uuid(), 'beta-audit-' || kind || '-' || gen_random_uuid() || '@example.invalid'
FROM (VALUES ('a'), ('b'), ('admin')) AS fixture(kind);
GRANT SELECT ON beta_security_users TO authenticated;

INSERT INTO auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
SELECT id, email, 'authenticated', 'authenticated',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
FROM beta_security_users;
UPDATE public.profiles SET role = 'admin'
WHERE id = (SELECT id FROM beta_security_users WHERE kind = 'admin');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated', 'email', email)::text, true)
FROM beta_security_users WHERE kind = 'a';

DO $$
DECLARE
    other_user UUID := (SELECT id FROM beta_security_users WHERE kind = 'b');
    request_id UUID := gen_random_uuid();
    refund_id UUID := gen_random_uuid();
    before_balance INTEGER;
    result JSONB;
    denied BOOLEAN;
BEGIN
    ASSERT NOT public.is_admin(), 'Normal account must not be admin';
    ASSERT (SELECT count(*) FROM public.profiles) = 1, 'Account must see only its own profile';
    INSERT INTO public.sesiones (id, user_id, titulo)
        VALUES ('beta-security-a-' || auth.uid(), auth.uid(), 'Synthetic security fixture A');
    ASSERT (SELECT count(*) FROM public.sesiones) = 1, 'Account must not read other teachers sessions';
    denied := false;
    BEGIN
        INSERT INTO public.sesiones (id, user_id, titulo)
            VALUES ('beta-security-forged-' || auth.uid(), other_user, 'Must be denied');
    EXCEPTION WHEN insufficient_privilege THEN denied := true;
    END;
    ASSERT denied, 'Cross-account insertion must fail';
    denied := false;
    BEGIN
        UPDATE public.sesiones SET user_id = other_user WHERE user_id = auth.uid();
    EXCEPTION WHEN insufficient_privilege THEN denied := true;
    END;
    ASSERT denied, 'Changing the owner must fail';
    denied := false;
    BEGIN
        UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
    EXCEPTION WHEN raise_exception OR insufficient_privilege THEN denied := true;
    END;
    ASSERT denied AND NOT public.is_admin(), 'User must not promote their own profile';
    ASSERT (SELECT count(*) FROM public.corporate_email_settings) = 0, 'SMTP settings must not be readable';

    SELECT balance INTO before_balance FROM public.ai_credit_wallets WHERE user_id = auth.uid();
    result := public.reserve_ai_credits(request_id, 'refine_text', 'openai', 'gpt-6-luna');
    ASSERT result->>'ok' = 'true', 'Synthetic accounting reservation must succeed';
    result := public.reserve_ai_credits(request_id, 'refine_text', 'openai', 'gpt-6-luna');
    ASSERT result->>'ok' = 'false' AND result->>'code' = 'DUPLICATE_REQUEST', 'Reservation must be idempotent';
    result := public.complete_ai_usage(request_id, 1, 1, 'synthetic-test', 0::numeric, 1);
    ASSERT result->>'ok' = 'true', 'Accounting completion must succeed';
    result := public.refund_ai_usage(request_id);
    ASSERT result->>'ok' = 'false', 'Successful usage must not be refunded';
    result := public.reserve_ai_credits(refund_id, 'refine_text', 'openai', 'gpt-6-luna');
    ASSERT result->>'ok' = 'true', 'Second accounting reservation must succeed';
    result := public.refund_ai_usage(refund_id);
    ASSERT result->>'ok' = 'true', 'Failed usage reservation must be refundable';
    result := public.refund_ai_usage(refund_id);
    ASSERT result->>'ok' = 'true', 'Duplicate refund must be harmless';
    ASSERT (SELECT balance FROM public.ai_credit_wallets WHERE user_id = auth.uid()) < before_balance,
        'Only the completed request must consume credits';
END;
$$;

SELECT set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated', 'email', email)::text, true)
FROM beta_security_users WHERE kind = 'b';
DO $$
BEGIN
    ASSERT (SELECT count(*) FROM public.sesiones) = 0, 'Second account must not read A sessions';
    INSERT INTO public.sesiones (id, user_id, titulo)
        VALUES ('beta-security-b-' || auth.uid(), auth.uid(), 'Synthetic security fixture B');
    ASSERT (SELECT count(*) FROM public.ai_usage) = 0, 'Second account must not read A usage';
    ASSERT (SELECT count(*) FROM public.credit_ledger WHERE user_id <> auth.uid()) = 0,
        'Ledger must be isolated by account';
END;
$$;

SELECT set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated', 'email', email)::text, true)
FROM beta_security_users WHERE kind = 'admin';
DO $$
BEGIN
    ASSERT public.is_admin(), 'Administrative RLS must still work';
    ASSERT (SELECT count(*) FROM public.sesiones WHERE id LIKE 'beta-security-%') = 2,
        'Administrator must retain session access';
    ASSERT NOT has_table_privilege('authenticated', 'public.sesiones', 'TRUNCATE'),
        'Browser role must not truncate sessions';
    ASSERT NOT has_function_privilege('anon', 'public.is_admin()', 'EXECUTE'),
        'Administrative helper must not be a public RPC';
END;
$$;

RESET ROLE;
SELECT jsonb_build_object('ok', true, 'scope', 'real roles, RLS, profile protection, credits, admin',
    'cleanup', 'transaction rolled back') AS result;
ROLLBACK;
