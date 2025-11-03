-- Add missing columns to clicks table for proper click tracking
ALTER TABLE public.clicks 
  ADD COLUMN referrer TEXT,
  ADD COLUMN bot_score INTEGER DEFAULT 0,
  ADD COLUMN click_id UUID DEFAULT gen_random_uuid() UNIQUE;

-- Create indexes for performance
CREATE INDEX idx_clicks_click_id ON public.clicks(click_id);
CREATE INDEX idx_clicks_referrer ON public.clicks(referrer);

-- Add comments for documentation
COMMENT ON COLUMN public.clicks.referrer IS 'HTTP referrer from click request';
COMMENT ON COLUMN public.clicks.bot_score IS 'AI bot detection score 0-100';
COMMENT ON COLUMN public.clicks.click_id IS 'Unique identifier for postback tracking';

-- Add missing column to conversions table for audit trail
ALTER TABLE public.conversions 
  ADD COLUMN network_postback_raw JSONB;

COMMENT ON COLUMN public.conversions.network_postback_raw IS 'Raw postback data from affiliate network for audit trail and debugging';

CREATE INDEX idx_conversions_raw_data ON public.conversions USING gin(network_postback_raw);