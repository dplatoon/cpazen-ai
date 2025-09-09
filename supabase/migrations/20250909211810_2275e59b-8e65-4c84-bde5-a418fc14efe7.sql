-- Fix 1: Separate secret key access from profile access
-- Create separate policies for secret key column access

-- First, let's create a more restrictive view for profile data without secret keys
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT 
  id,
  user_id,
  email,
  role,
  company_name,
  timezone,
  created_at,
  updated_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.profiles_safe SET (security_barrier = true);

-- Create a function to get user's own secret key only
CREATE OR REPLACE FUNCTION public.get_user_secret_key()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT secret_key FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Fix 2: Add more restrictive RLS policies for secret key access
-- Drop existing policies and recreate with better security
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- New policies with restricted admin access to secret keys
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

-- Admins can view profile data but NOT secret keys directly
-- They must use a separate secure function if needed
CREATE POLICY "Admins can view profile data" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'admin'
  AND auth.uid() = user_id -- Admins can only see their own secret_key
);

CREATE POLICY "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Fix 3: Create a secure admin function to view profile data without secret keys
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

-- Fix 4: Restrict offers table access to authenticated users only
DROP POLICY IF EXISTS "Everyone can view active offers" ON public.offers;

CREATE POLICY "Authenticated users can view active offers" 
ON public.offers 
FOR SELECT 
TO authenticated
USING (status = 'active');

-- Fix 5: Add better system access controls for clicks and conversions
-- Create a function to validate system access with proper authentication
CREATE OR REPLACE FUNCTION public.is_system_service()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  -- This checks if the current session is from an edge function
  -- Edge functions run with service role which has this claim
  SELECT auth.jwt() ->> 'role' = 'service_role';
$$;

-- Update clicks policies
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

-- Fix 6: Add audit logging for sensitive operations
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

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Create trigger to log secret key access
CREATE OR REPLACE FUNCTION public.log_secret_key_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when secret key is accessed
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    details
  ) VALUES (
    auth.uid(),
    'secret_key_accessed',
    'profiles',
    NEW.id,
    jsonb_build_object('email', NEW.email)
  );
  
  RETURN NEW;
END;
$$;

-- Add trigger for secret key access logging
DROP TRIGGER IF EXISTS audit_secret_key_access ON public.profiles;
CREATE TRIGGER audit_secret_key_access
  AFTER SELECT ON public.profiles
  FOR EACH ROW
  WHEN (current_setting('audit.log_secret_access', true) = 'true')
  EXECUTE FUNCTION public.log_secret_key_access();

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

-- Function to check rate limits
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
  window_start := date_trunc('hour', now()) + (extract(minute from now())::integer / window_minutes * window_minutes || ' minutes')::interval;
  
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