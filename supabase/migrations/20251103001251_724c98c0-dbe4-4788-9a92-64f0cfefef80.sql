-- Fix 1: Change get_available_offers to SECURITY INVOKER
-- This follows principle of least privilege since RLS policies already handle access control
CREATE OR REPLACE FUNCTION public.get_available_offers()
RETURNS TABLE(
  id uuid, 
  name text, 
  network text, 
  payout numeric, 
  currency text, 
  countries text[], 
  daily_cap integer, 
  status text, 
  offer_url text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.network,
    o.payout,
    o.currency,
    o.countries,
    o.daily_cap,
    o.status,
    o.offer_url,
    o.created_at,
    o.updated_at
  FROM public.offers o
  WHERE o.user_id = auth.uid()
  AND o.status = 'active';
END;
$$;

-- Fix 2: Create audit table for secret key rotations
CREATE TABLE IF NOT EXISTS public.secret_key_rotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_key_hash text NOT NULL,
  rotated_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Add index for efficient rate limit checks
CREATE INDEX IF NOT EXISTS idx_secret_key_rotations_user_time 
  ON public.secret_key_rotations(user_id, rotated_at DESC);

-- Enable RLS on audit table
ALTER TABLE public.secret_key_rotations ENABLE ROW LEVEL SECURITY;

-- Users can view their own rotation history
CREATE POLICY "Users can view their own rotation history"
ON public.secret_key_rotations
FOR SELECT
USING (auth.uid() = user_id);

-- Only the system can insert rotation records (via function)
CREATE POLICY "System can insert rotation records"
ON public.secret_key_rotations
FOR INSERT
WITH CHECK (false);

-- Add comment for documentation
COMMENT ON TABLE public.secret_key_rotations IS 
  'Audit trail for secret key rotations with rate limiting (max 3 per 24 hours)';

-- Fix 3: Update rotate_user_secret_key function with rate limiting and audit trail
CREATE OR REPLACE FUNCTION public.rotate_user_secret_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_key TEXT;
  old_key TEXT;
  rotation_count INTEGER;
BEGIN
  -- Check rate limit: max 3 rotations per 24 hours
  SELECT COUNT(*)
  INTO rotation_count
  FROM public.secret_key_rotations
  WHERE user_id = auth.uid()
  AND rotated_at > now() - interval '24 hours';
  
  IF rotation_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 3 key rotations per 24 hours';
  END IF;
  
  -- Get current key for audit trail
  SELECT secret_key INTO old_key
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  -- Generate new key
  new_key := encode(gen_random_bytes(32), 'hex');
  
  -- Update profile with new key
  UPDATE public.profiles
  SET secret_key = new_key,
      updated_at = now()
  WHERE user_id = auth.uid();
  
  -- Log rotation to audit trail (hash old key for security)
  INSERT INTO public.secret_key_rotations (user_id, old_key_hash)
  VALUES (
    auth.uid(),
    encode(digest(old_key, 'sha256'), 'hex')
  );
  
  RETURN new_key;
END;
$$;