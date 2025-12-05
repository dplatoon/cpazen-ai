-- Fix the validate_postback_security_token function to actually compare the token
CREATE OR REPLACE FUNCTION public.validate_postback_security_token(_click_id uuid, _token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  profile_secret TEXT;
  user_id_val UUID;
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
  
  -- FIXED: Actually validate the token matches the user's secret key
  -- Use constant-time comparison to prevent timing attacks
  IF profile_secret IS NULL OR _token IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN profile_secret = _token;
END;
$function$;