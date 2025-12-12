-- Create user_sessions table to track active sessions
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_current BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own sessions (for revoking)
CREATE POLICY "Users can update their own sessions"
ON public.user_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert sessions
CREATE POLICY "System can insert sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete their own sessions"
ON public.user_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);

-- Function to get user sessions with current session marked
CREATE OR REPLACE FUNCTION public.get_user_sessions(current_token TEXT DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  device_info JSONB,
  ip_address TEXT,
  user_agent TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  is_current BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.device_info,
    s.ip_address,
    s.user_agent,
    s.last_active_at,
    s.created_at,
    (s.session_token = current_token) as is_current
  FROM public.user_sessions s
  WHERE s.user_id = auth.uid()
  AND s.revoked_at IS NULL
  ORDER BY s.last_active_at DESC;
END;
$$;

-- Function to revoke a session
CREATE OR REPLACE FUNCTION public.revoke_session(session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions
  SET revoked_at = now()
  WHERE id = session_id
  AND user_id = auth.uid()
  AND revoked_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Function to revoke all sessions except current
CREATE OR REPLACE FUNCTION public.revoke_all_other_sessions(current_token TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  UPDATE public.user_sessions
  SET revoked_at = now()
  WHERE user_id = auth.uid()
  AND session_token != current_token
  AND revoked_at IS NULL;
  
  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  RETURN revoked_count;
END;
$$;

-- Function to register/update a session
CREATE OR REPLACE FUNCTION public.register_session(
  p_session_token TEXT,
  p_device_info JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_id UUID;
BEGIN
  -- Try to update existing session
  UPDATE public.user_sessions
  SET last_active_at = now(),
      device_info = COALESCE(p_device_info, device_info),
      ip_address = COALESCE(p_ip_address, ip_address),
      user_agent = COALESCE(p_user_agent, user_agent)
  WHERE user_id = auth.uid()
  AND session_token = p_session_token
  AND revoked_at IS NULL
  RETURNING id INTO session_id;
  
  -- If no existing session, create new one
  IF session_id IS NULL THEN
    INSERT INTO public.user_sessions (user_id, session_token, device_info, ip_address, user_agent)
    VALUES (auth.uid(), p_session_token, p_device_info, p_ip_address, p_user_agent)
    RETURNING id INTO session_id;
  END IF;
  
  RETURN session_id;
END;
$$;