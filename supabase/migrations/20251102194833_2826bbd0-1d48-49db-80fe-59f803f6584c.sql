-- Add explicit DENY policies for immutable audit tables

-- Clicks table - prevent modifications to audit records
CREATE POLICY "Prevent click updates" ON public.clicks
FOR UPDATE USING (false);

CREATE POLICY "Prevent click deletions" ON public.clicks
FOR DELETE USING (false);

-- Conversions table - prevent modifications to financial records
CREATE POLICY "Prevent conversion updates" ON public.conversions
FOR UPDATE USING (false);

CREATE POLICY "Prevent conversion deletions" ON public.conversions
FOR DELETE USING (false);

-- Profiles table - prevent direct deletion
CREATE POLICY "Prevent profile deletion" ON public.profiles
FOR DELETE USING (false);

-- Create rate limiting table for click tracking
CREATE TABLE IF NOT EXISTS public.click_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  click_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient rate limit lookups
CREATE INDEX idx_click_rate_limits_ip_time ON public.click_rate_limits(ip_address, created_at);

-- Enable RLS on rate limits table
ALTER TABLE public.click_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can manage rate limits (edge functions use service role)
CREATE POLICY "System manages rate limits" ON public.click_rate_limits
FOR ALL USING (false);

-- Auto-cleanup old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.click_rate_limits
  WHERE created_at < now() - interval '1 hour';
END;
$$;