-- Secure administrator operations for inspecting and assigning AI credits.
-- The browser never receives direct UPDATE permission on ai_credit_wallets.

CREATE OR REPLACE FUNCTION public.admin_list_ai_credit_accounts(
    p_search TEXT DEFAULT '',
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    username TEXT,
    role TEXT,
    plan_id TEXT,
    balance INTEGER,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.username,
        p.role,
        COALESCE(w.plan_id, 'free'),
        COALESCE(w.balance, 0),
        w.updated_at
    FROM public.profiles AS p
    LEFT JOIN public.ai_credit_wallets AS w ON w.user_id = p.id
    WHERE COALESCE(trim(p_search), '') = ''
       OR p.email ILIKE '%' || trim(p_search) || '%'
       OR COALESCE(p.username, '') ILIKE '%' || trim(p_search) || '%'
       OR p.id::TEXT = trim(p_search)
    ORDER BY p.email ASC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 200);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_ai_credits(
    p_user_id UUID,
    p_balance INTEGER,
    p_reason TEXT DEFAULT 'Actualización manual desde Panel Maestro'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_old_balance INTEGER;
    v_target_email TEXT;
    v_reason TEXT := left(COALESCE(NULLIF(trim(p_reason), ''), 'Actualización manual'), 300);
BEGIN
    IF v_admin_id IS NULL OR NOT public.is_admin() THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'ADMIN_REQUIRED');
    END IF;
    IF p_user_id IS NULL OR p_balance IS NULL OR p_balance < 0 OR p_balance > 1000000 THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_CREDIT_BALANCE');
    END IF;

    SELECT email INTO v_target_email FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'USER_NOT_FOUND');
    END IF;

    SELECT balance INTO v_old_balance
    FROM public.ai_credit_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.ai_credit_wallets (user_id, plan_id, balance)
        VALUES (p_user_id, 'free', p_balance);
        v_old_balance := 0;
    ELSE
        UPDATE public.ai_credit_wallets
        SET balance = p_balance,
            updated_at = timezone('utc', now())
        WHERE user_id = p_user_id;
    END IF;

    INSERT INTO public.security_logs (user_id, action, details)
    VALUES (
        v_admin_id,
        'AI_CREDITS_ADMIN_UPDATE',
        format('Cuenta %s (%s): %s -> %s créditos. %s', p_user_id, v_target_email, v_old_balance, p_balance, v_reason)
    );

    RETURN jsonb_build_object(
        'ok', TRUE,
        'code', 'CREDITS_UPDATED',
        'userId', p_user_id,
        'previousBalance', v_old_balance,
        'balance', p_balance
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_ai_credit_accounts(TEXT, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_ai_credits(UUID, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_ai_credit_accounts(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_ai_credits(UUID, INTEGER, TEXT) TO authenticated;
