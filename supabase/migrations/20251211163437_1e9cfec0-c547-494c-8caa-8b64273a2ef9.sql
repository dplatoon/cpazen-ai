-- Create a function to get webhooks without exposing secret_key
CREATE OR REPLACE FUNCTION public.get_user_webhooks()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  url text,
  events text[],
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  secret_key_masked text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.user_id,
    w.name,
    w.url,
    w.events,
    w.is_active,
    w.created_at,
    w.updated_at,
    substring(w.secret_key from 1 for 8) || '...' || substring(w.secret_key from length(w.secret_key) - 3 for 4) as secret_key_masked
  FROM public.webhooks w
  WHERE w.user_id = auth.uid()
  ORDER BY w.created_at DESC;
END;
$$;

-- Create a rate limiting table for postback requests per click_id
CREATE TABLE IF NOT EXISTS public.postback_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id uuid NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  first_request_at timestamp with time zone NOT NULL DEFAULT now(),
  last_request_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(click_id)
);

-- Enable RLS
ALTER TABLE public.postback_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can manage rate limits (edge functions use service role)
CREATE POLICY "System manages postback rate limits"
  ON public.postback_rate_limits
  FOR ALL
  USING (false);

-- Create cleanup function for old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_old_postback_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.postback_rate_limits
  WHERE first_request_at < now() - interval '1 hour';
END;
$$;