-- Fix: Remove direct SELECT access to user_2fa table to prevent exposure of totp_secret and backup_codes
-- All legitimate SELECT operations go through SECURITY DEFINER functions (get_2fa_status_secure, get_my_2fa_status)
-- which return only safe fields. Edge functions use service role and bypass RLS.

-- Drop the existing SELECT policy that exposes sensitive columns
DROP POLICY IF EXISTS "Users can view their own 2FA status" ON public.user_2fa;

-- Note: INSERT, UPDATE, DELETE policies remain unchanged as they don't expose data
-- - INSERT: Users can insert their own 2FA settings (needed for initial setup via edge function)
-- - UPDATE: Users can update their own 2FA settings (needed for enable/disable)
-- - DELETE: Users can delete their own 2FA settings (needed for cleanup)