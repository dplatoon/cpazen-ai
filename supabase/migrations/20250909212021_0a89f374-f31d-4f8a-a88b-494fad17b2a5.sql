-- Security Fix Migration: Secure Profiles and Data Access

-- Fix 1: Create a secure function to get user's own secret key only
CREATE OR REPLACE FUNCTION public.get_user_secret_key()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT secret_key FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Fix 2: Update RLS policies with better security
-- Drop existing policies and recreate with restricted access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- New restrictive policies
CREATE POLICY "Users can view their own profile data" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can manage profiles but with controlled access
CREATE POLICY "Admins can manage profiles" 
ON public.profiles 
FOR ALL
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Fix 3: Create secure admin function for profile management
CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  role text,
  company_name text,
  timezone text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.email,
    p.role,
    p.company_name,
    p.timezone,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE get_user_role(auth.uid()) = 'admin';
$$;

-- Fix 4: Secure offers table - restrict to authenticated users only
DROP POLICY IF EXISTS "Everyone can view active offers" ON public.offers;

CREATE POLICY "Authenticated users can view active offers" 
ON public.offers 
FOR SELECT 
TO authenticated
USING (status = 'active');

-- Fix 5: Improve system access controls
-- Create function to validate system service access
CREATE OR REPLACE FUNCTION public.is_system_service()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check if current session is from edge function (service role)
  SELECT COALESCE(auth.jwt() ->> 'role' = 'service_role', false);
$$;

-- Update clicks policies with better system validation
DROP POLICY IF EXISTS "System can insert clicks" ON public.clicks;

CREATE POLICY "System services can insert clicks" 
ON public.clicks 
FOR INSERT 
WITH CHECK (is_system_service());

-- Update conversions policies
DROP POLICY IF EXISTS "System can manage conversions" ON public.conversions;

CREATE POLICY "System services can insert conversions" 
ON public.conversions 
FOR INSERT 
WITH CHECK (is_system_service());

CREATE POLICY "System services can update conversions" 
ON public.conversions 
FOR UPDATE 
USING (is_system_service())
WITH CHECK (is_system_service());

-- Fix 6: Add security audit logging
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Fix 7: Add rate limiting for sensitive operations
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, action, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (auth.uid() = user_id);

-- Rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  action_name text,
  max_requests integer DEFAULT 10,
  window_minutes integer DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  window_start timestamptz;
BEGIN
  -- Calculate window start time
  window_start := date_trunc('hour', now()) + 
    (extract(minute from now())::integer / window_minutes * window_minutes || ' minutes')::interval;
  
  -- Get current count for this user/action/window
  SELECT count INTO current_count
  FROM public.rate_limits
  WHERE user_id = auth.uid()
    AND action = action_name
    AND window_start = window_start;
  
  -- If no record exists or under limit, allow
  IF current_count IS NULL OR current_count < max_requests THEN
    -- Upsert the counter
    INSERT INTO public.rate_limits (user_id, action, count, window_start)
    VALUES (auth.uid(), action_name, 1, window_start)
    ON CONFLICT (user_id, action, window_start)
    DO UPDATE SET count = rate_limits.count + 1;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Fix 8: Create secure secret key rotation function
CREATE OR REPLACE FUNCTION public.rotate_user_secret_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_secret text;
BEGIN
  -- Check rate limit for secret key rotation (max 3 per day)
  IF NOT check_rate_limit('secret_key_rotation', 3, 1440) THEN
    RAISE EXCEPTION 'Rate limit exceeded for secret key rotation';
  END IF;
  
  -- Generate new secret key
  new_secret := encode(gen_random_bytes(32), 'hex');
  
  -- Update user's secret key
  UPDATE public.profiles 
  SET secret_key = new_secret, updated_at = now()
  WHERE user_id = auth.uid();
  
  -- Log the rotation
  INSERT INTO public.security_audit_log (
    user_id, action, table_name, details
  ) VALUES (
    auth.uid(), 
    'secret_key_rotated', 
    'profiles',
    jsonb_build_object('timestamp', now())
  );
  
  RETURN new_secret;
END;
$$;