-- Migration: Payment System + Affiliate Self-Serve Portal
-- Creates tables for earnings tracking, withdrawals, payment methods, and offer applications

-- ═══════════════════════════════════════════════
-- 1. AFFILIATE OFFER APPLICATIONS
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.affiliate_offer_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  tracking_link text,
  custom_payout numeric(10,2),
  applied_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  UNIQUE(affiliate_id, offer_id)
);

ALTER TABLE public.affiliate_offer_applications ENABLE ROW LEVEL SECURITY;

-- Affiliates can see their own applications
CREATE POLICY "affiliates_own_applications" ON public.affiliate_offer_applications
  FOR SELECT USING (auth.uid() = affiliate_id);

-- Affiliates can create applications
CREATE POLICY "affiliates_apply" ON public.affiliate_offer_applications
  FOR INSERT WITH CHECK (auth.uid() = affiliate_id);

-- Admins can see and update all applications
CREATE POLICY "admins_manage_applications" ON public.affiliate_offer_applications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ═══════════════════════════════════════════════
-- 2. PAYMENT METHODS
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type text NOT NULL CHECK (method_type IN ('bkash', 'nagad', 'rocket', 'paypal', 'wise', 'bank_wire', 'usdt_trc20', 'usdt_erc20')),
  account_name text NOT NULL,
  account_number text NOT NULL,
  is_primary boolean DEFAULT false,
  currency text DEFAULT 'USD',
  extra_details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_payment_methods" ON public.payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- 3. AFFILIATE EARNINGS LEDGER
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.affiliate_earnings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id),
  offer_id uuid REFERENCES public.offers(id),
  click_id text,
  conversion_id uuid,
  amount numeric(10,4) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  description text,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  paid_at timestamptz
);

ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliates_own_earnings" ON public.affiliate_earnings
  FOR SELECT USING (auth.uid() = affiliate_id);

CREATE POLICY "admins_manage_earnings" ON public.affiliate_earnings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ═══════════════════════════════════════════════
-- 4. WITHDRAWAL REQUESTS
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_method_id uuid NOT NULL REFERENCES public.payment_methods(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'rejected', 'cancelled')),
  admin_note text,
  transaction_ref text,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliates_own_withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = affiliate_id);

CREATE POLICY "affiliates_request_withdrawal" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = affiliate_id);

CREATE POLICY "admins_manage_withdrawals" ON public.withdrawal_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ═══════════════════════════════════════════════
-- 5. RPC FUNCTIONS
-- ═══════════════════════════════════════════════

-- Get affiliate balance (approved but unpaid earnings)
CREATE OR REPLACE FUNCTION public.get_affiliate_balance(p_affiliate_id uuid)
RETURNS TABLE(
  available_balance numeric,
  pending_balance numeric,
  total_earned numeric,
  total_paid numeric,
  total_rejected numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as available_balance,
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_balance,
    COALESCE(SUM(CASE WHEN status IN ('approved', 'paid') THEN amount ELSE 0 END), 0) as total_earned,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
    COALESCE(SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END), 0) as total_rejected
  FROM affiliate_earnings
  WHERE affiliate_id = p_affiliate_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_balance(uuid) TO authenticated;

-- Apply for an offer (affiliate self-serve)
CREATE OR REPLACE FUNCTION public.apply_for_offer(
  p_offer_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app_id uuid;
  v_offer_url text;
  v_tracking_link text;
BEGIN
  -- Check if already applied
  IF EXISTS (
    SELECT 1 FROM affiliate_offer_applications
    WHERE affiliate_id = auth.uid() AND offer_id = p_offer_id
  ) THEN
    RAISE EXCEPTION 'Already applied for this offer';
  END IF;

  -- Get offer URL for tracking link generation
  SELECT offer_url INTO v_offer_url FROM offers WHERE id = p_offer_id AND status = 'active';
  IF v_offer_url IS NULL THEN
    RAISE EXCEPTION 'Offer not found or inactive';
  END IF;

  -- Insert application (auto-approved for now, can add manual review later)
  INSERT INTO affiliate_offer_applications (affiliate_id, offer_id, status, tracking_link)
  VALUES (auth.uid(), p_offer_id, 'approved', v_tracking_link)
  RETURNING id INTO v_app_id;

  RETURN v_app_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_for_offer(uuid) TO authenticated;

-- Request withdrawal
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount numeric,
  p_payment_method_id uuid,
  p_currency text DEFAULT 'USD'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_min_payout numeric := 50.00; -- Minimum payout threshold
  v_withdrawal_id uuid;
  v_pending_withdrawals numeric;
BEGIN
  -- Check available balance
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM affiliate_earnings
  WHERE affiliate_id = auth.uid() AND status = 'approved';

  -- Check pending withdrawals
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_withdrawals
  FROM withdrawal_requests
  WHERE affiliate_id = auth.uid() AND status IN ('pending', 'processing');

  -- Validate
  IF p_amount < v_min_payout THEN
    RAISE EXCEPTION 'Minimum withdrawal is $%. Requested: $%', v_min_payout, p_amount;
  END IF;

  IF p_amount > (v_balance - v_pending_withdrawals) THEN
    RAISE EXCEPTION 'Insufficient balance. Available: $%, Pending: $%, Requested: $%', 
      v_balance, v_pending_withdrawals, p_amount;
  END IF;

  -- Verify payment method belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM payment_methods WHERE id = p_payment_method_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  -- Create withdrawal request
  INSERT INTO withdrawal_requests (affiliate_id, amount, currency, payment_method_id)
  VALUES (auth.uid(), p_amount, p_currency, p_payment_method_id)
  RETURNING id INTO v_withdrawal_id;

  RETURN v_withdrawal_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, uuid, text) TO authenticated;

-- Admin: Process withdrawal
CREATE OR REPLACE FUNCTION public.admin_process_withdrawal(
  p_withdrawal_id uuid,
  p_status text,
  p_admin_note text DEFAULT NULL,
  p_transaction_ref text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update withdrawal
  UPDATE withdrawal_requests
  SET status = p_status,
      admin_note = p_admin_note,
      transaction_ref = p_transaction_ref,
      processed_at = now(),
      processed_by = auth.uid()
  WHERE id = p_withdrawal_id;

  -- If paid, mark earnings as paid
  IF p_status = 'paid' THEN
    UPDATE affiliate_earnings
    SET status = 'paid', paid_at = now()
    WHERE affiliate_id = (SELECT affiliate_id FROM withdrawal_requests WHERE id = p_withdrawal_id)
      AND status = 'approved'
    ORDER BY created_at
    LIMIT (SELECT amount FROM withdrawal_requests WHERE id = p_withdrawal_id)::int;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_process_withdrawal(uuid, text, text, text) TO authenticated;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_earnings_affiliate ON public.affiliate_earnings(affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_earnings_created ON public.affiliate_earnings(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_affiliate ON public.withdrawal_requests(affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_affiliate ON public.affiliate_offer_applications(affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_offer ON public.affiliate_offer_applications(offer_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON public.payment_methods(user_id);
