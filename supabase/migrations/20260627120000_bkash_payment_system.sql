-- Migration: bKash Auto-Payment System
-- Tracks payment transactions, bKash credentials, and payout batches

-- ═══════════════════════════════════════════════
-- 1. PAYMENT GATEWAY CONFIGS (admin-managed)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payment_gateway_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway text NOT NULL CHECK (gateway IN ('bkash', 'nagad', 'sslcommerz', 'stripe', 'paypal')),
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  credentials jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT false,
  daily_limit numeric(12,2) DEFAULT 500000.00,
  per_txn_limit numeric(10,2) DEFAULT 25000.00,
  min_payout numeric(10,2) DEFAULT 500.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(gateway, environment)
);

ALTER TABLE public.payment_gateway_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_only_gateway" ON public.payment_gateway_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ═══════════════════════════════════════════════
-- 2. PAYMENT TRANSACTIONS (every payout attempt)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  withdrawal_id uuid REFERENCES public.withdrawal_requests(id),
  affiliate_id uuid NOT NULL REFERENCES auth.users(id),
  gateway text NOT NULL,
  gateway_txn_id text,
  amount numeric(10,2) NOT NULL,
  fee numeric(10,2) DEFAULT 0,
  net_amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'BDT',
  recipient_number text NOT NULL,
  recipient_name text,
  status text NOT NULL DEFAULT 'initiated' 
    CHECK (status IN ('initiated', 'pending', 'success', 'failed', 'reversed')),
  gateway_response jsonb DEFAULT '{}',
  error_message text,
  initiated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliates_own_txns" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = affiliate_id);

CREATE POLICY "admins_manage_txns" ON public.payment_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ═══════════════════════════════════════════════
-- 3. PAYOUT BATCHES (group multiple payouts)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payout_batches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name text NOT NULL,
  gateway text NOT NULL,
  total_amount numeric(12,2) DEFAULT 0,
  total_fee numeric(10,2) DEFAULT 0,
  transaction_count int DEFAULT 0,
  success_count int DEFAULT 0,
  failed_count int DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'partial', 'failed')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_only_batches" ON public.payout_batches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ═══════════════════════════════════════════════
-- 4. RPC: Process bKash payout
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.initiate_bkash_payout(
  p_withdrawal_id uuid,
  p_admin_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal withdrawal_requests;
  v_payment_method payment_methods;
  v_txn_id uuid;
  v_fee numeric := 0;
BEGIN
  -- Get withdrawal details
  SELECT * INTO v_withdrawal FROM withdrawal_requests WHERE id = p_withdrawal_id;
  IF v_withdrawal IS NULL THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF v_withdrawal.status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'Withdrawal is not in payable status: %', v_withdrawal.status;
  END IF;

  -- Get payment method
  SELECT * INTO v_payment_method FROM payment_methods WHERE id = v_withdrawal.payment_method_id;
  IF v_payment_method IS NULL THEN RAISE EXCEPTION 'Payment method not found'; END IF;
  IF v_payment_method.method_type NOT IN ('bkash', 'nagad', 'rocket') THEN
    RAISE EXCEPTION 'This function only handles bKash/Nagad/Rocket payouts';
  END IF;

  -- Calculate fee (bKash B2P: 0.5% or min ৳5)
  v_fee := GREATEST(v_withdrawal.amount * 0.005, 5.00);

  -- Create transaction record
  INSERT INTO payment_transactions (
    withdrawal_id, affiliate_id, gateway,
    amount, fee, net_amount, currency,
    recipient_number, recipient_name,
    status, created_by
  ) VALUES (
    p_withdrawal_id, v_withdrawal.affiliate_id, v_payment_method.method_type,
    v_withdrawal.amount, v_fee, v_withdrawal.amount - v_fee, 'BDT',
    v_payment_method.account_number, v_payment_method.account_name,
    'initiated', COALESCE(p_admin_id, auth.uid())
  ) RETURNING id INTO v_txn_id;

  -- Update withdrawal status to processing
  UPDATE withdrawal_requests
  SET status = 'processing', processed_at = now(), processed_by = COALESCE(p_admin_id, auth.uid())
  WHERE id = p_withdrawal_id;

  RETURN v_txn_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initiate_bkash_payout(uuid, uuid) TO authenticated;

-- ═══════════════════════════════════════════════
-- 5. RPC: Complete payout (after bKash API confirms)
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.complete_payout(
  p_txn_id uuid,
  p_status text,
  p_gateway_txn_id text DEFAULT NULL,
  p_gateway_response jsonb DEFAULT '{}',
  p_error_message text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_txn payment_transactions;
BEGIN
  SELECT * INTO v_txn FROM payment_transactions WHERE id = p_txn_id;
  IF v_txn IS NULL THEN RAISE EXCEPTION 'Transaction not found'; END IF;

  -- Update transaction
  UPDATE payment_transactions
  SET status = p_status,
      gateway_txn_id = COALESCE(p_gateway_txn_id, gateway_txn_id),
      gateway_response = p_gateway_response,
      error_message = p_error_message,
      completed_at = CASE WHEN p_status IN ('success', 'failed') THEN now() ELSE NULL END
  WHERE id = p_txn_id;

  -- If success, mark withdrawal as paid and update earnings
  IF p_status = 'success' THEN
    UPDATE withdrawal_requests
    SET status = 'paid',
        transaction_ref = COALESCE(p_gateway_txn_id, p_txn_id::text)
    WHERE id = v_txn.withdrawal_id;

    -- Mark earnings as paid up to the withdrawal amount
    WITH to_pay AS (
      SELECT id FROM affiliate_earnings
      WHERE affiliate_id = v_txn.affiliate_id AND status = 'approved'
      ORDER BY created_at
    )
    UPDATE affiliate_earnings SET status = 'paid', paid_at = now()
    WHERE id IN (SELECT id FROM to_pay);
  END IF;

  -- If failed, revert withdrawal to pending
  IF p_status = 'failed' THEN
    UPDATE withdrawal_requests
    SET status = 'pending',
        admin_note = COALESCE(admin_note || E'\n', '') || 'Auto-pay failed: ' || COALESCE(p_error_message, 'Unknown error')
    WHERE id = v_txn.withdrawal_id;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_payout(uuid, text, text, jsonb, text) TO authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_txns_withdrawal ON public.payment_transactions(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_txns_affiliate ON public.payment_transactions(affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_txns_status ON public.payment_transactions(status, initiated_at);
CREATE INDEX IF NOT EXISTS idx_gateway_configs ON public.payment_gateway_configs(gateway, is_active);
