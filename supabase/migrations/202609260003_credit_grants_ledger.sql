-- Migración: 202609260003_credit_grants_ledger.sql
-- Fase 5 de Refactor SaaS: Sistema de Grants y Ledger Contable Append-Only
-- Soporta recargas prepago, suscripciones y promociones sin colisiones de saldo.

-- 1. Tabla de Asignaciones de Crédito (Credit Grants)
CREATE TABLE IF NOT EXISTS public.credit_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('subscription', 'prepaid', 'promo', 'referral', 'birthday', 'admin', 'beta', 'refund')),
    source_id TEXT DEFAULT NULL,
    granted_credits INTEGER NOT NULL CHECK (granted_credits > 0),
    remaining_credits INTEGER NOT NULL CHECK (remaining_credits >= 0),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ DEFAULT NULL,
    priority INTEGER NOT NULL DEFAULT 50, -- 10: promo, 20: subscription, 30: prepaid, 50: beta/admin
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_credit_grants_user_remaining 
    ON public.credit_grants (user_id, remaining_credits) 
    WHERE remaining_credits > 0;

-- 2. Tabla del Libro Contable de Créditos (Credit Ledger) - Append Only
CREATE TABLE IF NOT EXISTS public.credit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id UUID DEFAULT NULL,
    grant_id UUID DEFAULT NULL REFERENCES public.credit_grants(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('grant', 'reserve', 'spend', 'refund', 'expire', 'adjustment')),
    credits_delta INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user 
    ON public.credit_ledger (user_id, created_at DESC);

-- 3. Backfill: Migrar saldos existentes de ai_credit_wallets a credit_grants
INSERT INTO public.credit_grants (user_id, source_type, granted_credits, remaining_credits, priority, metadata)
SELECT 
    user_id,
    'beta',
    GREATEST(balance, 100),
    GREATEST(balance, 100),
    50,
    jsonb_build_object('migrated_from', 'ai_credit_wallets', 'original_balance', balance)
FROM public.ai_credit_wallets
WHERE NOT EXISTS (
    SELECT 1 FROM public.credit_grants cg WHERE cg.user_id = ai_credit_wallets.user_id
);

-- Registrar en el ledger los saldos iniciales migrados
INSERT INTO public.credit_ledger (user_id, grant_id, event_type, credits_delta, balance_after, reason)
SELECT 
    cg.user_id,
    cg.id,
    'grant',
    cg.remaining_credits,
    cg.remaining_credits,
    'Saldo inicial migrado a sistema de grants (Beta)'
FROM public.credit_grants cg
WHERE cg.source_type = 'beta'
  AND NOT EXISTS (
    SELECT 1 FROM public.credit_ledger cl WHERE cl.user_id = cg.user_id AND cl.grant_id = cg.id
  );

-- 4. Procedimiento Atómico para Asignar Créditos (Suscripción, Prepago o Promo)
CREATE OR REPLACE FUNCTION public.add_credit_grant(
    p_user_id UUID,
    p_source_type TEXT,
    p_credits INTEGER,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_reason TEXT DEFAULT 'Recarga de créditos'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_grant_id UUID;
    v_priority INTEGER := 30; -- prepago por defecto
    v_new_balance INTEGER;
    v_current_balance INTEGER := 0;
BEGIN
    IF p_credits <= 0 THEN
        RETURN jsonb_build_object('ok', FALSE, 'code', 'INVALID_CREDITS');
    END IF;

    -- Asignar prioridad según tipo
    IF p_source_type = 'promo' OR p_source_type = 'birthday' THEN
        v_priority := 10;
    ELSIF p_source_type = 'subscription' THEN
        v_priority := 20;
    ELSIF p_source_type = 'prepaid' THEN
        v_priority := 30;
    ELSE
        v_priority := 50;
    END IF;

    -- Insertar el nuevo grant
    INSERT INTO public.credit_grants (
        user_id, source_type, granted_credits, remaining_credits, expires_at, priority, metadata
    )
    VALUES (
        p_user_id, p_source_type, p_credits, p_credits, p_expires_at, v_priority,
        jsonb_build_object('reason', p_reason, 'granted_by', auth.uid())
    )
    RETURNING id INTO v_grant_id;

    -- Obtener saldo total disponible sumando todos los grants vigentes
    SELECT COALESCE(SUM(remaining_credits), 0) INTO v_new_balance
    FROM public.credit_grants
    WHERE user_id = p_user_id
      AND remaining_credits > 0
      AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()));

    -- Actualizar o crear la billetera rápida ai_credit_wallets
    INSERT INTO public.ai_credit_wallets (user_id, balance, plan_id)
    VALUES (p_user_id, v_new_balance, 'free')
    ON CONFLICT (user_id) DO UPDATE
    SET balance = v_new_balance,
        updated_at = timezone('utc'::text, now());

    -- Registrar evento en el libro contable (ledger)
    INSERT INTO public.credit_ledger (
        user_id, grant_id, event_type, credits_delta, balance_after, reason
    )
    VALUES (
        p_user_id, v_grant_id, 'grant', p_credits, v_new_balance, p_reason
    );

    RETURN jsonb_build_object(
        'ok', TRUE,
        'grant_id', v_grant_id,
        'credits_added', p_credits,
        'new_balance', v_new_balance
    );
END;
$$;

-- 5. Seguridad y Políticas RLS
ALTER TABLE public.credit_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus propios grants" ON public.credit_grants;
CREATE POLICY "Usuarios ven sus propios grants"
    ON public.credit_grants FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios ven su propio ledger" ON public.credit_ledger;
CREATE POLICY "Usuarios ven su propio ledger"
    ON public.credit_ledger FOR SELECT
    USING (auth.uid() = user_id);

REVOKE ALL ON FUNCTION public.add_credit_grant(UUID, TEXT, INTEGER, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_credit_grant(UUID, TEXT, INTEGER, TIMESTAMPTZ, TEXT) TO authenticated;
