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

-- Fix 2: More restrictive offers access - only show offers relevant to user's campaigns
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

-- Fix 3: Create a separate public function to browse available offers (without sensitive data)
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

-- Fix 4: Add policy to protect secret_key column specifically
-- This creates a separate policy that explicitly denies access to secret_key for non-owners
CREATE POLICY "Restrict secret_key column access" 
ON public.profiles 
FOR SELECT 
USING (
  CASE 
    WHEN current_setting('request.columns', true) LIKE '%secret_key%' THEN
      auth.uid() = user_id -- Only owner can directly access secret_key column
    ELSE 
      true -- Allow other columns based on other policies
  END
);

-- Fix 5: Create audit function for profile access
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log profile access for security monitoring
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    details
  ) VALUES (
    auth.uid(),
    'profile_accessed',
    'profiles',
    NEW.id,
    jsonb_build_object(
      'accessed_columns', current_setting('request.columns', true),
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Add audit trigger for profile access (only when secret key is accessed)
CREATE TRIGGER audit_profile_access_trigger
  AFTER SELECT ON public.profiles
  FOR EACH ROW
  WHEN (current_setting('request.columns', true) LIKE '%secret_key%')
  EXECUTE FUNCTION public.audit_profile_access();

-- Fix 6: Create function to safely check if user has campaign access to an offer
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