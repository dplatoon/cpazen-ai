-- Final Security Fixes - Address remaining security scan issues

-- Fix 1: Add missing RLS policies for rate_limits table
CREATE POLICY "System can insert rate limits" 
ON public.rate_limits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR is_system_service());

CREATE POLICY "Users can update their own rate limits" 
ON public.rate_limits 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rate limits" 
ON public.rate_limits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix 2: Create a separate public function to browse available offers (without sensitive URLs)
CREATE OR REPLACE FUNCTION public.get_available_offers()
RETURNS TABLE (
  id uuid,
  name text,
  network text,
  countries text[],
  currency text,
  payout numeric,
  daily_cap integer
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.name,
    o.network,
    o.countries,
    o.currency,
    o.payout,
    o.daily_cap
  FROM public.offers o
  WHERE o.status = 'active'
  AND auth.uid() IS NOT NULL; -- Must be authenticated
$$;

-- Fix 3: Create function to safely check if user has campaign access to an offer
CREATE OR REPLACE FUNCTION public.can_access_offer(offer_uuid uuid)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.offer_id = offer_uuid 
    AND (c.user_id = auth.uid() OR get_user_role(auth.uid()) = 'admin')
  ) OR get_user_role(auth.uid()) = 'admin';
$$;

-- Fix 4: More restrictive offers access - only show offers relevant to user's campaigns
-- This prevents competitors from seeing all available offers
DROP POLICY IF EXISTS "Authenticated users can view active offers" ON public.offers;

CREATE POLICY "Users can view offers for their campaigns" 
ON public.offers 
FOR SELECT 
TO authenticated
USING (
  status = 'active' AND (
    -- Users can see offers they're already running campaigns for
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.offer_id = offers.id 
      AND (campaigns.user_id = auth.uid() OR get_user_role(auth.uid()) = 'admin')
    )
    -- Or if they're admin, they can see all active offers
    OR get_user_role(auth.uid()) = 'admin'
  )
);

-- Fix 5: Add function to log security events manually
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_action text,
  event_table text,
  event_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    details
  ) VALUES (
    auth.uid(),
    event_action,
    event_table,
    event_details
  );
END;
$$;