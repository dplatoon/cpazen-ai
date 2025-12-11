-- Performance indexes for clicks table
CREATE INDEX IF NOT EXISTS idx_clicks_campaign_id ON public.clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_clicks_user_id ON public.clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON public.clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_user_campaign ON public.clicks(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_clicks_user_created ON public.clicks(user_id, created_at DESC);

-- Performance indexes for conversions table
CREATE INDEX IF NOT EXISTS idx_conversions_campaign_id ON public.conversions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON public.conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_click_id ON public.conversions(click_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON public.conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_user_campaign ON public.conversions(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_conversions_user_created ON public.conversions(user_id, created_at DESC);

-- Performance indexes for campaign_stats table
CREATE INDEX IF NOT EXISTS idx_campaign_stats_campaign_id ON public.campaign_stats(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_stats_user_id ON public.campaign_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_stats_date ON public.campaign_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_stats_user_date ON public.campaign_stats(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_stats_campaign_date ON public.campaign_stats(campaign_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_stats_user_campaign_date ON public.campaign_stats(user_id, campaign_id, date DESC);