-- Drop the view since we're using functions instead (resolves SECURITY DEFINER VIEW warning)
DROP VIEW IF EXISTS public.daily_campaign_stats;