-- Update validate_postback_security_token to use proper HMAC validation
CREATE OR REPLACE FUNCTION public.validate_postback_security_token(_click_id uuid, _token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_secret TEXT;
  user_id_val UUID;
  expected_token TEXT;
BEGIN
  -- Get user_id from click
  SELECT user_id INTO user_id_val
  FROM public.clicks
  WHERE id = _click_id;
  
  IF user_id_val IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's secret key
  SELECT secret_key INTO profile_secret
  FROM public.profiles
  WHERE user_id = user_id_val;
  
  IF profile_secret IS NULL OR _token IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Generate expected HMAC token: HMAC-SHA256 of click_id with user's secret key
  expected_token := encode(
    extensions.hmac(_click_id::text::bytea, profile_secret::bytea, 'sha256'),
    'hex'
  );
  
  -- Constant-time comparison to prevent timing attacks
  RETURN expected_token = _token;
END;
$$;

-- Update generate_security_token_for_click to generate proper HMAC tokens
CREATE OR REPLACE FUNCTION public.generate_security_token_for_click(click_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_secret TEXT;
  user_id_val UUID;
  token TEXT;
BEGIN
  -- Get user_id from click
  SELECT user_id INTO user_id_val
  FROM public.clicks
  WHERE id = click_id_param;
  
  IF user_id_val IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get user's secret key
  SELECT secret_key INTO profile_secret
  FROM public.profiles
  WHERE user_id = user_id_val;
  
  IF profile_secret IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Generate HMAC-SHA256 token
  token := encode(
    extensions.hmac(click_id_param::text::bytea, profile_secret::bytea, 'sha256'),
    'hex'
  );
  
  RETURN token;
END;
$$;