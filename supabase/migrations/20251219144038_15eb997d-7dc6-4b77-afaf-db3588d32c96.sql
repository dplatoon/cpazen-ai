-- Create table for tracking failed login attempts
CREATE TABLE public.login_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_until TIMESTAMP WITH TIME ZONE,
  UNIQUE(ip_address)
);

-- Enable RLS
ALTER TABLE public.login_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can manage rate limits (no user access)
CREATE POLICY "System manages login rate limits" 
ON public.login_rate_limits 
FOR ALL 
USING (false);

-- Create function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_ip_address TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record login_rate_limits%ROWTYPE;
  v_max_attempts INTEGER := 5;
  v_lockout_minutes INTEGER := 15;
  v_window_minutes INTEGER := 15;
BEGIN
  -- Get existing record
  SELECT * INTO v_record
  FROM login_rate_limits
  WHERE ip_address = p_ip_address;
  
  -- If no record exists, create one and allow
  IF v_record.id IS NULL THEN
    INSERT INTO login_rate_limits (ip_address)
    VALUES (p_ip_address);
    RETURN jsonb_build_object('allowed', true, 'attempts_remaining', v_max_attempts - 1);
  END IF;
  
  -- Check if currently locked out
  IF v_record.locked_until IS NOT NULL AND v_record.locked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'locked_until', v_record.locked_until,
      'message', 'Too many failed attempts. Please try again later.'
    );
  END IF;
  
  -- Reset if window has passed
  IF v_record.first_attempt_at < now() - (v_window_minutes || ' minutes')::interval THEN
    UPDATE login_rate_limits
    SET attempt_count = 1,
        first_attempt_at = now(),
        last_attempt_at = now(),
        locked_until = NULL
    WHERE ip_address = p_ip_address;
    RETURN jsonb_build_object('allowed', true, 'attempts_remaining', v_max_attempts - 1);
  END IF;
  
  -- Increment attempt count
  UPDATE login_rate_limits
  SET attempt_count = attempt_count + 1,
      last_attempt_at = now(),
      locked_until = CASE 
        WHEN attempt_count + 1 >= v_max_attempts 
        THEN now() + (v_lockout_minutes || ' minutes')::interval
        ELSE NULL
      END
  WHERE ip_address = p_ip_address
  RETURNING * INTO v_record;
  
  -- Check if now locked
  IF v_record.attempt_count >= v_max_attempts THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'locked_until', v_record.locked_until,
      'message', 'Too many failed attempts. Please try again in ' || v_lockout_minutes || ' minutes.'
    );
  END IF;
  
  RETURN jsonb_build_object('allowed', true, 'attempts_remaining', v_max_attempts - v_record.attempt_count);
END;
$$;

-- Create function to reset rate limit on successful login
CREATE OR REPLACE FUNCTION public.reset_login_rate_limit(p_ip_address TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM login_rate_limits WHERE ip_address = p_ip_address;
END;
$$;

-- Create cleanup function for old rate limits
CREATE OR REPLACE FUNCTION public.cleanup_old_login_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM login_rate_limits
  WHERE last_attempt_at < now() - interval '24 hours';
END;
$$;