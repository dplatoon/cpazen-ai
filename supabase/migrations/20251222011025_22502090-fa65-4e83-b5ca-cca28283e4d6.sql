-- Function to aggregate click stats
CREATE OR REPLACE FUNCTION public.aggregate_click_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Upsert into campaign_stats for the click
  INSERT INTO public.campaign_stats (
    campaign_id,
    user_id,
    date,
    clicks,
    geo,
    device,
    os,
    sub_id
  ) VALUES (
    NEW.campaign_id,
    NEW.user_id,
    DATE(NEW.created_at),
    1,
    NEW.country,
    NEW.device,
    NEW.os,
    NEW.sub_id
  )
  ON CONFLICT (campaign_id, date, COALESCE(geo, ''), COALESCE(device, ''), COALESCE(os, ''), COALESCE(sub_id, ''))
  DO UPDATE SET
    clicks = campaign_stats.clicks + 1;
  
  RETURN NEW;
END;
$$;

-- Function to aggregate conversion stats
CREATE OR REPLACE FUNCTION public.aggregate_conversion_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  click_record RECORD;
BEGIN
  -- Get click details for dimension matching
  SELECT country, device, os, sub_id
  INTO click_record
  FROM public.clicks
  WHERE id = NEW.click_id;
  
  -- Upsert into campaign_stats for the conversion
  INSERT INTO public.campaign_stats (
    campaign_id,
    user_id,
    date,
    conversions,
    revenue,
    geo,
    device,
    os,
    sub_id
  ) VALUES (
    NEW.campaign_id,
    NEW.user_id,
    DATE(NEW.created_at),
    1,
    NEW.payout,
    click_record.country,
    click_record.device,
    click_record.os,
    click_record.sub_id
  )
  ON CONFLICT (campaign_id, date, COALESCE(geo, ''), COALESCE(device, ''), COALESCE(os, ''), COALESCE(sub_id, ''))
  DO UPDATE SET
    conversions = campaign_stats.conversions + 1,
    revenue = campaign_stats.revenue + NEW.payout;
  
  RETURN NEW;
END;
$$;

-- Create unique index for upsert to work
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_stats_upsert 
ON public.campaign_stats (campaign_id, date, COALESCE(geo, ''), COALESCE(device, ''), COALESCE(os, ''), COALESCE(sub_id, ''));

-- Create trigger for clicks
DROP TRIGGER IF EXISTS trigger_aggregate_click_stats ON public.clicks;
CREATE TRIGGER trigger_aggregate_click_stats
  AFTER INSERT ON public.clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.aggregate_click_stats();

-- Create trigger for conversions
DROP TRIGGER IF EXISTS trigger_aggregate_conversion_stats ON public.conversions;
CREATE TRIGGER trigger_aggregate_conversion_stats
  AFTER INSERT ON public.conversions
  FOR EACH ROW
  EXECUTE FUNCTION public.aggregate_conversion_stats();