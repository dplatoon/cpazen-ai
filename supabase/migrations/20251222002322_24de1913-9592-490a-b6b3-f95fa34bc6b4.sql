-- Create daily campaign stats view for fast aggregation
-- Using a regular view since materialized views require more complex refresh handling

CREATE OR REPLACE VIEW public.daily_campaign_stats AS
SELECT 
  cs.campaign_id,
  cs.user_id,
  cs.date,
  COALESCE(cs.clicks, 0) as clicks,
  COALESCE(cs.conversions, 0) as conversions,
  COALESCE(cs.revenue, 0) as revenue,
  COALESCE(cs.cost, 0) as cost,
  COALESCE(cs.revenue, 0) - COALESCE(cs.cost, 0) as profit,
  cs.geo,
  cs.device,
  cs.os,
  cs.sub_id,
  cs.traffic_source_id
FROM public.campaign_stats cs;

-- Create function to get aggregated dashboard stats for a user
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  p_user_id uuid,
  p_start_date date DEFAULT CURRENT_DATE,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_clicks bigint,
  total_conversions bigint,
  total_revenue numeric,
  total_cost numeric,
  total_profit numeric,
  conversion_rate numeric,
  epc numeric,
  avg_payout numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(cs.clicks), 0)::bigint as total_clicks,
    COALESCE(SUM(cs.conversions), 0)::bigint as total_conversions,
    COALESCE(SUM(cs.revenue), 0) as total_revenue,
    COALESCE(SUM(cs.cost), 0) as total_cost,
    COALESCE(SUM(cs.revenue), 0) - COALESCE(SUM(cs.cost), 0) as total_profit,
    CASE 
      WHEN COALESCE(SUM(cs.clicks), 0) > 0 
      THEN ROUND((COALESCE(SUM(cs.conversions), 0)::numeric / SUM(cs.clicks)::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate,
    CASE 
      WHEN COALESCE(SUM(cs.clicks), 0) > 0 
      THEN ROUND(COALESCE(SUM(cs.revenue), 0) / SUM(cs.clicks)::numeric, 4)
      ELSE 0
    END as epc,
    CASE 
      WHEN COALESCE(SUM(cs.conversions), 0) > 0 
      THEN ROUND(COALESCE(SUM(cs.revenue), 0) / SUM(cs.conversions)::numeric, 2)
      ELSE 0
    END as avg_payout
  FROM public.campaign_stats cs
  WHERE cs.user_id = p_user_id
  AND cs.date >= p_start_date
  AND cs.date <= p_end_date;
END;
$$;

-- Create function to get chart data for dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_chart_data(
  p_user_id uuid,
  p_days integer DEFAULT 7
)
RETURNS TABLE(
  date date,
  clicks bigint,
  conversions bigint,
  revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.date,
    COALESCE(SUM(cs.clicks), 0)::bigint as clicks,
    COALESCE(SUM(cs.conversions), 0)::bigint as conversions,
    COALESCE(SUM(cs.revenue), 0) as revenue
  FROM public.campaign_stats cs
  WHERE cs.user_id = p_user_id
  AND cs.date >= CURRENT_DATE - p_days
  GROUP BY cs.date
  ORDER BY cs.date;
END;
$$;

-- Create function to get top campaigns by revenue
CREATE OR REPLACE FUNCTION public.get_top_campaigns(
  p_user_id uuid,
  p_days integer DEFAULT 7,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  campaign_id uuid,
  campaign_name text,
  offer_name text,
  network text,
  clicks bigint,
  conversions bigint,
  revenue numeric,
  conversion_rate numeric,
  epc numeric,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as campaign_id,
    c.name as campaign_name,
    COALESCE(o.name, 'No Offer') as offer_name,
    COALESCE(o.network, 'Direct') as network,
    COALESCE(SUM(cs.clicks), 0)::bigint as clicks,
    COALESCE(SUM(cs.conversions), 0)::bigint as conversions,
    COALESCE(SUM(cs.revenue), 0) as revenue,
    CASE 
      WHEN COALESCE(SUM(cs.clicks), 0) > 0 
      THEN ROUND((COALESCE(SUM(cs.conversions), 0)::numeric / SUM(cs.clicks)::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate,
    CASE 
      WHEN COALESCE(SUM(cs.clicks), 0) > 0 
      THEN ROUND(COALESCE(SUM(cs.revenue), 0) / SUM(cs.clicks)::numeric, 4)
      ELSE 0
    END as epc,
    c.status
  FROM public.campaigns c
  LEFT JOIN public.offers o ON c.offer_id = o.id
  LEFT JOIN public.campaign_stats cs ON c.id = cs.campaign_id AND cs.date >= CURRENT_DATE - p_days
  WHERE c.user_id = p_user_id
  GROUP BY c.id, c.name, c.status, o.name, o.network
  ORDER BY COALESCE(SUM(cs.revenue), 0) DESC
  LIMIT p_limit;
END;
$$;

-- Create function to get campaign KPIs efficiently
CREATE OR REPLACE FUNCTION public.get_campaign_kpis(
  p_campaign_id uuid,
  p_start_date date DEFAULT CURRENT_DATE - 30,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  clicks bigint,
  conversions bigint,
  revenue numeric,
  cost numeric,
  profit numeric,
  cpa numeric,
  roas numeric,
  conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_clicks bigint;
  v_conversions bigint;
  v_revenue numeric;
  v_cost numeric;
BEGIN
  SELECT 
    COALESCE(SUM(cs.clicks), 0),
    COALESCE(SUM(cs.conversions), 0),
    COALESCE(SUM(cs.revenue), 0),
    COALESCE(SUM(cs.cost), 0)
  INTO v_clicks, v_conversions, v_revenue, v_cost
  FROM public.campaign_stats cs
  WHERE cs.campaign_id = p_campaign_id
  AND cs.date >= p_start_date
  AND cs.date <= p_end_date;

  RETURN QUERY
  SELECT 
    v_clicks as clicks,
    v_conversions as conversions,
    v_revenue as revenue,
    v_cost as cost,
    v_revenue - v_cost as profit,
    CASE WHEN v_conversions > 0 THEN ROUND(v_cost / v_conversions, 2) ELSE 0 END as cpa,
    CASE WHEN v_cost > 0 THEN ROUND(v_revenue / v_cost, 2) ELSE 0 END as roas,
    CASE WHEN v_clicks > 0 THEN ROUND((v_conversions::numeric / v_clicks::numeric) * 100, 2) ELSE 0 END as conversion_rate;
END;
$$;

-- Create function to get campaign breakdown by dimension
CREATE OR REPLACE FUNCTION public.get_campaign_breakdown(
  p_campaign_id uuid,
  p_dimension text,
  p_start_date date DEFAULT CURRENT_DATE - 30,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  dimension_value text,
  clicks bigint,
  conversions bigint,
  revenue numeric,
  cost numeric,
  profit numeric,
  conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_dimension = 'geo' THEN
    RETURN QUERY
    SELECT 
      COALESCE(cs.geo, 'Unknown') as dimension_value,
      COALESCE(SUM(cs.clicks), 0)::bigint,
      COALESCE(SUM(cs.conversions), 0)::bigint,
      COALESCE(SUM(cs.revenue), 0),
      COALESCE(SUM(cs.cost), 0),
      COALESCE(SUM(cs.revenue), 0) - COALESCE(SUM(cs.cost), 0),
      CASE WHEN COALESCE(SUM(cs.clicks), 0) > 0 
        THEN ROUND((COALESCE(SUM(cs.conversions), 0)::numeric / SUM(cs.clicks)::numeric) * 100, 2)
        ELSE 0 END
    FROM public.campaign_stats cs
    WHERE cs.campaign_id = p_campaign_id
    AND cs.date >= p_start_date
    AND cs.date <= p_end_date
    GROUP BY cs.geo
    ORDER BY COALESCE(SUM(cs.clicks), 0) DESC;
  ELSIF p_dimension = 'device' THEN
    RETURN QUERY
    SELECT 
      COALESCE(cs.device, 'Unknown') as dimension_value,
      COALESCE(SUM(cs.clicks), 0)::bigint,
      COALESCE(SUM(cs.conversions), 0)::bigint,
      COALESCE(SUM(cs.revenue), 0),
      COALESCE(SUM(cs.cost), 0),
      COALESCE(SUM(cs.revenue), 0) - COALESCE(SUM(cs.cost), 0),
      CASE WHEN COALESCE(SUM(cs.clicks), 0) > 0 
        THEN ROUND((COALESCE(SUM(cs.conversions), 0)::numeric / SUM(cs.clicks)::numeric) * 100, 2)
        ELSE 0 END
    FROM public.campaign_stats cs
    WHERE cs.campaign_id = p_campaign_id
    AND cs.date >= p_start_date
    AND cs.date <= p_end_date
    GROUP BY cs.device
    ORDER BY COALESCE(SUM(cs.clicks), 0) DESC;
  ELSIF p_dimension = 'os' THEN
    RETURN QUERY
    SELECT 
      COALESCE(cs.os, 'Unknown') as dimension_value,
      COALESCE(SUM(cs.clicks), 0)::bigint,
      COALESCE(SUM(cs.conversions), 0)::bigint,
      COALESCE(SUM(cs.revenue), 0),
      COALESCE(SUM(cs.cost), 0),
      COALESCE(SUM(cs.revenue), 0) - COALESCE(SUM(cs.cost), 0),
      CASE WHEN COALESCE(SUM(cs.clicks), 0) > 0 
        THEN ROUND((COALESCE(SUM(cs.conversions), 0)::numeric / SUM(cs.clicks)::numeric) * 100, 2)
        ELSE 0 END
    FROM public.campaign_stats cs
    WHERE cs.campaign_id = p_campaign_id
    AND cs.date >= p_start_date
    AND cs.date <= p_end_date
    GROUP BY cs.os
    ORDER BY COALESCE(SUM(cs.clicks), 0) DESC;
  ELSIF p_dimension = 'subId' THEN
    RETURN QUERY
    SELECT 
      COALESCE(cs.sub_id, 'Unknown') as dimension_value,
      COALESCE(SUM(cs.clicks), 0)::bigint,
      COALESCE(SUM(cs.conversions), 0)::bigint,
      COALESCE(SUM(cs.revenue), 0),
      COALESCE(SUM(cs.cost), 0),
      COALESCE(SUM(cs.revenue), 0) - COALESCE(SUM(cs.cost), 0),
      CASE WHEN COALESCE(SUM(cs.clicks), 0) > 0 
        THEN ROUND((COALESCE(SUM(cs.conversions), 0)::numeric / SUM(cs.clicks)::numeric) * 100, 2)
        ELSE 0 END
    FROM public.campaign_stats cs
    WHERE cs.campaign_id = p_campaign_id
    AND cs.date >= p_start_date
    AND cs.date <= p_end_date
    GROUP BY cs.sub_id
    ORDER BY COALESCE(SUM(cs.clicks), 0) DESC;
  ELSE
    RETURN QUERY
    SELECT 
      COALESCE(cs.traffic_source_id, 'Unknown') as dimension_value,
      COALESCE(SUM(cs.clicks), 0)::bigint,
      COALESCE(SUM(cs.conversions), 0)::bigint,
      COALESCE(SUM(cs.revenue), 0),
      COALESCE(SUM(cs.cost), 0),
      COALESCE(SUM(cs.revenue), 0) - COALESCE(SUM(cs.cost), 0),
      CASE WHEN COALESCE(SUM(cs.clicks), 0) > 0 
        THEN ROUND((COALESCE(SUM(cs.conversions), 0)::numeric / SUM(cs.clicks)::numeric) * 100, 2)
        ELSE 0 END
    FROM public.campaign_stats cs
    WHERE cs.campaign_id = p_campaign_id
    AND cs.date >= p_start_date
    AND cs.date <= p_end_date
    GROUP BY cs.traffic_source_id
    ORDER BY COALESCE(SUM(cs.clicks), 0) DESC;
  END IF;
END;
$$;

-- Create index for faster campaign_stats queries
CREATE INDEX IF NOT EXISTS idx_campaign_stats_user_date ON public.campaign_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_campaign_stats_campaign_date ON public.campaign_stats(campaign_id, date);