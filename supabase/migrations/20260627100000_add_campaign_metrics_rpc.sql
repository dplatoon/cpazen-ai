-- Migration: Add optimized campaign metrics RPC function
-- Fixes N+1 query pattern in useCampaignMetrics hook

CREATE OR REPLACE FUNCTION public.get_campaign_metrics_v2(p_user_id uuid)
RETURNS TABLE(
  campaign_id uuid,
  campaign_name text,
  total_clicks bigint,
  total_conversions bigint,
  total_revenue numeric,
  total_cost numeric,
  conversion_rate numeric,
  epc numeric,
  ecpm numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id as campaign_id,
    c.name as campaign_name,
    COALESCE(click_stats.total_clicks, 0) as total_clicks,
    COALESCE(conv_stats.total_conversions, 0) as total_conversions,
    COALESCE(conv_stats.total_revenue, 0) as total_revenue,
    COALESCE(conv_stats.total_cost, 0) as total_cost,
    CASE 
      WHEN COALESCE(click_stats.total_clicks, 0) > 0 
      THEN ROUND((COALESCE(conv_stats.total_conversions, 0)::numeric / click_stats.total_clicks) * 100, 2)
      ELSE 0 
    END as conversion_rate,
    CASE 
      WHEN COALESCE(click_stats.total_clicks, 0) > 0 
      THEN ROUND(COALESCE(conv_stats.total_revenue, 0) / click_stats.total_clicks, 4)
      ELSE 0 
    END as epc,
    CASE 
      WHEN COALESCE(click_stats.total_clicks, 0) > 0 
      THEN ROUND((COALESCE(conv_stats.total_revenue, 0) / click_stats.total_clicks) * 1000, 2)
      ELSE 0 
    END as ecpm
  FROM campaigns c
  LEFT JOIN (
    SELECT campaign_id, COUNT(*) as total_clicks
    FROM clicks
    GROUP BY campaign_id
  ) click_stats ON click_stats.campaign_id = c.id
  LEFT JOIN (
    SELECT 
      cl.campaign_id,
      COUNT(*) as total_conversions,
      SUM(COALESCE(cs.revenue, 0)) as total_revenue,
      SUM(COALESCE(cs.cost, 0)) as total_cost
    FROM conversions cs
    JOIN clicks cl ON cl.click_id = cs.click_id
    WHERE cs.status = 'approved'
    GROUP BY cl.campaign_id
  ) conv_stats ON conv_stats.campaign_id = c.id
  WHERE c.user_id = p_user_id
  ORDER BY COALESCE(click_stats.total_clicks, 0) DESC;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_campaign_metrics_v2(uuid) TO authenticated;

-- Also create a daily aggregation function for dashboard performance
CREATE OR REPLACE FUNCTION public.get_daily_metrics(
  p_user_id uuid,
  p_start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  metric_date date,
  clicks bigint,
  conversions bigint,
  revenue numeric,
  cost numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.metric_date,
    COALESCE(click_counts.cnt, 0) as clicks,
    COALESCE(conv_counts.cnt, 0) as conversions,
    COALESCE(conv_counts.rev, 0) as revenue,
    COALESCE(conv_counts.cst, 0) as cost
  FROM generate_series(p_start_date, p_end_date, '1 day'::interval) d(metric_date)
  LEFT JOIN (
    SELECT DATE(created_at) as click_date, COUNT(*) as cnt
    FROM clicks
    WHERE user_id = p_user_id
      AND created_at >= p_start_date
      AND created_at < p_end_date + INTERVAL '1 day'
    GROUP BY DATE(created_at)
  ) click_counts ON click_counts.click_date = d.metric_date
  LEFT JOIN (
    SELECT 
      DATE(cs.created_at) as conv_date,
      COUNT(*) as cnt,
      SUM(COALESCE(cs.revenue, 0)) as rev,
      SUM(COALESCE(cs.cost, 0)) as cst
    FROM conversions cs
    JOIN clicks cl ON cl.click_id = cs.click_id
    WHERE cl.user_id = p_user_id
      AND cs.created_at >= p_start_date
      AND cs.created_at < p_end_date + INTERVAL '1 day'
      AND cs.status = 'approved'
    GROUP BY DATE(cs.created_at)
  ) conv_counts ON conv_counts.conv_date = d.metric_date
  ORDER BY d.metric_date;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_metrics(uuid, date, date) TO authenticated;
