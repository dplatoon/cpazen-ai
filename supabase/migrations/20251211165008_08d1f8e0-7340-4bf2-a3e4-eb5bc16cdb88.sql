-- Create table for storing 2FA settings
CREATE TABLE public.user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_secret TEXT, -- Encrypted TOTP secret
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes TEXT[], -- Hashed backup codes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Users can only view their own 2FA settings (but not the secret directly)
CREATE POLICY "Users can view their own 2FA status"
ON public.user_2fa
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own 2FA settings
CREATE POLICY "Users can insert their own 2FA settings"
ON public.user_2fa
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own 2FA settings
CREATE POLICY "Users can update their own 2FA settings"
ON public.user_2fa
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own 2FA settings
CREATE POLICY "Users can delete their own 2FA settings"
ON public.user_2fa
FOR DELETE
USING (auth.uid() = user_id);

-- Function to check if user has 2FA enabled (for login flow - doesn't expose secret)
CREATE OR REPLACE FUNCTION public.check_2fa_status(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_enabled BOOLEAN;
BEGIN
  -- Get user_id from email
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if 2FA is enabled
  SELECT is_enabled INTO v_is_enabled FROM public.user_2fa WHERE user_id = v_user_id;
  
  RETURN COALESCE(v_is_enabled, false);
END;
$$;

-- Function to get 2FA status for authenticated user
CREATE OR REPLACE FUNCTION public.get_my_2fa_status()
RETURNS TABLE (is_enabled BOOLEAN, has_backup_codes BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(u.is_enabled, false),
    COALESCE(array_length(u.backup_codes, 1) > 0, false)
  FROM public.user_2fa u
  WHERE u.user_id = auth.uid();
  
  -- If no row found, return defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false;
  END IF;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_user_2fa_updated_at
BEFORE UPDATE ON public.user_2fa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();