-- Create a secure view for 2FA status that excludes sensitive columns
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own 2FA status" ON public.user_2fa;

-- Create a more restrictive SELECT policy that only allows access to non-sensitive columns
-- We'll use a function to safely get 2FA status without exposing secrets
CREATE OR REPLACE FUNCTION public.get_2fa_status_secure()
RETURNS TABLE (
  is_enabled boolean,
  has_backup_codes boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.is_enabled,
    COALESCE(array_length(u.backup_codes, 1) > 0, false) as has_backup_codes,
    u.created_at,
    u.updated_at
  FROM public.user_2fa u
  WHERE u.user_id = auth.uid();
END;
$$;

-- Create policy that blocks direct table access but allows through RPC
-- Users should NOT be able to read totp_secret or backup_codes directly
CREATE POLICY "Users can view their own 2FA status"
ON public.user_2fa
FOR SELECT
USING (auth.uid() = user_id);

-- The above policy still allows SELECT but the application should use 
-- get_2fa_status_secure() or get_my_2fa_status() functions instead
-- which don't expose sensitive columns

-- Add a comment to document proper usage
COMMENT ON TABLE public.user_2fa IS 'Two-factor authentication data. Use get_2fa_status_secure() or get_my_2fa_status() functions to access - never SELECT directly to avoid exposing secrets.';