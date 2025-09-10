-- Create a secure function to validate postbacks without exposing secret keys
CREATE OR REPLACE FUNCTION public.validate_postback_security_token(
  click_id_param uuid,
  provided_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_secret text;
  expected_token text;
  click_owner_id uuid;
BEGIN
  -- Get the user_id for this click through campaign
  SELECT c.user_id INTO click_owner_id
  FROM clicks cl
  JOIN campaigns c ON c.id = cl.campaign_id
  WHERE cl.click_id = click_id_param;
  
  IF click_owner_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get the secret key for the click owner
  SELECT secret_key INTO user_secret
  FROM profiles
  WHERE user_id = click_owner_id;
  
  IF user_secret IS NULL THEN
    RETURN false;
  END IF;
  
  -- Calculate expected token: sha256(click_id + secret_key)
  expected_token := encode(digest(click_id_param::text || user_secret, 'sha256'), 'hex');
  
  -- Return true if tokens match
  RETURN expected_token = provided_token;
END;
$$;

-- Create a function to get a masked version of secret key for display purposes
CREATE OR REPLACE FUNCTION public.get_user_secret_key_masked()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN secret_key IS NOT NULL THEN 
        left(secret_key, 8) || '...' || right(secret_key, 8)
      ELSE NULL 
    END
  FROM public.profiles 
  WHERE user_id = auth.uid();
$$;

-- Create a function to generate security token without exposing secret key
CREATE OR REPLACE FUNCTION public.generate_security_token_for_click(click_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_secret text;
  security_token text;
BEGIN
  -- Get current user's secret key
  SELECT secret_key INTO user_secret
  FROM profiles
  WHERE user_id = auth.uid();
  
  IF user_secret IS NULL THEN
    RAISE EXCEPTION 'User secret key not found';
  END IF;
  
  -- Generate security token: sha256(click_id + secret_key)
  security_token := encode(digest(click_id_param::text || user_secret, 'sha256'), 'hex');
  
  RETURN security_token;
END;
$$;