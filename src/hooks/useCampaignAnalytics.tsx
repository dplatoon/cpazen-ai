import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CampaignKpis {
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  profit: number;
  cpa: number;
  roas: number;
  conversionRate: number;
}

export interface CampaignBreakdown {
  dimension: string;
  value: string;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  profit: number;
  cpa: number;
  roas: number;
}

export interface HealthScore {
  score: number;
  label: 'Stable' | 'Needs attention' | 'Low data';
  reason: string;
}

// Calculate campaign KPIs - optimized with RPC function
export function useCampaignKpis(campaignId: string, dateRange?: { start: Date; end: Date }) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['campaign-kpis', campaignId, dateRange],
    queryFn: async (): Promise<CampaignKpis> => {
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.end || new Date();

      // Try optimized RPC function first
      const { data, error } = await supabase.rpc('get_campaign_kpis', {
        p_campaign_id: campaignId,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0]
      });

      if (!error && data && data.length > 0) {
        const kpis = data[0];
        return {
          clicks: Number(kpis.clicks) || 0,
          conversions: Number(kpis.conversions) || 0,
          revenue: Number(kpis.revenue) || 0,
          cost: Number(kpis.cost) || 0,
          profit: Number(kpis.profit) || 0,
          cpa: Number(kpis.cpa) || 0,
          roas: Number(kpis.roas) || 0,
          conversionRate: Number(kpis.conversion_rate) || 0
        };
      }

      // Fall back to direct query
      const { data: clicks, error: clicksError } = await supabase
        .from('clicks')
        .select('id, created_at')
        .eq('campaign_id', campaignId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (clicksError) throw clicksError;

      const { data: conversions, error: conversionsError } = await supabase
        .from('conversions')
        .select('id, payout, created_at')
        .eq('campaign_id', campaignId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (conversionsError) throw conversionsError;

      const totalClicks = clicks?.length || 0;
      const totalConversions = conversions?.length || 0;
      const totalRevenue = conversions?.reduce((sum, c) => sum + Number(c.payout || 0), 0) || 0;
      const totalCost = 0;
      const profit = totalRevenue - totalCost;
      const cpa = totalConversions > 0 ? totalCost / totalConversions : 0;
      const roas = totalCost > 0 ? totalRevenue / totalCost : 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      return {
        clicks: totalClicks,
        conversions: totalConversions,
        revenue: totalRevenue,
        cost: totalCost,
        profit,
        cpa,
        roas,
        conversionRate,
      };
    },
    enabled: !!user && !!campaignId,
  });
}

// Get campaign breakdown by dimension - optimized with RPC function
export function useCampaignBreakdown(
  campaignId: string, 
  dimension: 'geo' | 'device' | 'os' | 'subId' | 'trafficSource',
  dateRange?: { start: Date; end: Date }
) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['campaign-breakdown', campaignId, dimension, dateRange],
    queryFn: async (): Promise<CampaignBreakdown[]> => {
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.end || new Date();

      // Try optimized RPC function first
      const { data, error } = await supabase.rpc('get_campaign_breakdown', {
        p_campaign_id: campaignId,
        p_dimension: dimension,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0]
      });

      if (!error && data && data.length > 0) {
        return data.map((row: {
          dimension_value: string;
          clicks: number;
          conversions: number;
          revenue: number;
          cost: number;
          profit: number;
          conversion_rate: number;
        }) => ({
          dimension,
          value: row.dimension_value,
          clicks: Number(row.clicks) || 0,
          conversions: Number(row.conversions) || 0,
          revenue: Number(row.revenue) || 0,
          cost: Number(row.cost) || 0,
          profit: Number(row.profit) || 0,
          cpa: row.conversions > 0 ? Number(row.cost) / Number(row.conversions) : 0,
          roas: row.cost > 0 ? Number(row.revenue) / Number(row.cost) : 0
        }));
      }

      // Fall back to direct query
      const columnMap: Record<string, string> = {
        geo: 'country',
        device: 'device',
        os: 'os',
        subId: 'sub_id',
        trafficSource: 'referrer',
      };

      const column = columnMap[dimension];

      const { data: clicks, error: clicksError } = await supabase
        .from('clicks')
        .select('id, country, device, os, sub_id, referrer, created_at')
        .eq('campaign_id', campaignId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (clicksError) throw clicksError;

      const { data: conversions, error: conversionsError } = await supabase
        .from('conversions')
        .select(`id, payout, click_id, created_at`)
        .eq('campaign_id', campaignId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (conversionsError) throw conversionsError;

      const clickDimensions = new Map<string, string>();
      clicks?.forEach(click => {
        clickDimensions.set(click.id, (click as Record<string, unknown>)[column] as string || 'Unknown');
      });

      const aggregated = new Map<string, { clicks: number; conversions: number; revenue: number }>();

      clicks?.forEach(click => {
        const value = (click as Record<string, unknown>)[column] as string || 'Unknown';
        const existing = aggregated.get(value) || { clicks: 0, conversions: 0, revenue: 0 };
        existing.clicks++;
        aggregated.set(value, existing);
      });

      conversions?.forEach(conv => {
        const value = clickDimensions.get(conv.click_id) || 'Unknown';
        const existing = aggregated.get(value) || { clicks: 0, conversions: 0, revenue: 0 };
        existing.conversions++;
        existing.revenue += Number(conv.payout || 0);
        aggregated.set(value, existing);
      });

      return Array.from(aggregated.entries()).map(([value, aggData]) => ({
        dimension,
        value,
        clicks: aggData.clicks,
        conversions: aggData.conversions,
        revenue: aggData.revenue,
        cost: 0,
        profit: aggData.revenue,
        cpa: aggData.conversions > 0 ? 0 / aggData.conversions : 0,
        roas: 0,
      })).sort((a, b) => b.clicks - a.clicks);
    },
    enabled: !!user && !!campaignId,
  });
}

// Calculate health score for a campaign
export function useCampaignHealthScore(campaignId: string) {
  const { user } = useAuth();
  const { data: kpis } = useCampaignKpis(campaignId);

  return useQuery({
    queryKey: ['campaign-health', campaignId, kpis],
    queryFn: async (): Promise<HealthScore> => {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('target_cpa, daily_budget')
        .eq('id', campaignId)
        .maybeSingle();

      if (!kpis) {
        return { score: 0, label: 'Low data', reason: 'Insufficient data to calculate health score' };
      }

      let score = 50;
      const reasons: string[] = [];

      if (kpis.clicks < 100) {
        score -= 25;
        reasons.push('Low click volume');
      } else if (kpis.clicks >= 1000) {
        score += 15;
      } else {
        score += 5;
      }

      if (kpis.conversions < 10) {
        score -= 15;
        reasons.push('Low conversions');
      } else if (kpis.conversions >= 100) {
        score += 10;
      } else {
        score += 5;
      }

      const targetCpa = campaign?.target_cpa || 0;
      if (targetCpa > 0 && kpis.cpa > 0) {
        const cpaRatio = kpis.cpa / targetCpa;
        if (cpaRatio <= 0.8) {
          score += 25;
        } else if (cpaRatio <= 1.0) {
          score += 15;
        } else if (cpaRatio <= 1.2) {
          score += 5;
        } else {
          score -= 10;
          reasons.push('CPA exceeds target');
        }
      }

      if (kpis.conversionRate >= 5) {
        score += 15;
      } else if (kpis.conversionRate >= 2) {
        score += 10;
      } else if (kpis.conversionRate >= 1) {
        score += 5;
      } else if (kpis.conversionRate < 0.5 && kpis.clicks > 100) {
        reasons.push('Low conversion rate');
      }

      if (kpis.roas >= 2) {
        score += 10;
      } else if (kpis.roas >= 1.5) {
        score += 5;
      } else if (kpis.roas < 1 && kpis.cost > 0) {
        reasons.push('ROAS below 1');
      }

      score = Math.max(0, Math.min(100, score));

      let label: 'Stable' | 'Needs attention' | 'Low data';
      if (kpis.conversions < 10 || kpis.clicks < 100) {
        label = 'Low data';
      } else if (score >= 70) {
        label = 'Stable';
      } else {
        label = 'Needs attention';
      }

      const reason = reasons.length > 0 
        ? reasons.join('. ') 
        : label === 'Stable' 
          ? 'Campaign performing well' 
          : 'Gathering more data';

      return { score, label, reason };
    },
    enabled: !!user && !!campaignId && !!kpis,
  });
}

// Time series data for charts
export function useCampaignTimeSeries(campaignId: string, metric: string, days: number = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign-timeseries', campaignId, metric, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: clicks, error: clicksError } = await supabase
        .from('clicks')
        .select('created_at')
        .eq('campaign_id', campaignId)
        .gte('created_at', startDate.toISOString());

      if (clicksError) throw clicksError;

      const { data: conversions, error: conversionsError } = await supabase
        .from('conversions')
        .select('created_at, payout')
        .eq('campaign_id', campaignId)
        .gte('created_at', startDate.toISOString());

      if (conversionsError) throw conversionsError;

      const dailyData = new Map<string, { clicks: number; conversions: number; revenue: number }>();

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData.set(dateStr, { clicks: 0, conversions: 0, revenue: 0 });
      }

      clicks?.forEach(click => {
        const dateStr = click.created_at.split('T')[0];
        const existing = dailyData.get(dateStr);
        if (existing) {
          existing.clicks++;
        }
      });

      conversions?.forEach(conv => {
        const dateStr = conv.created_at.split('T')[0];
        const existing = dailyData.get(dateStr);
        if (existing) {
          existing.conversions++;
          existing.revenue += Number(conv.payout || 0);
        }
      });

      return Array.from(dailyData.entries())
        .map(([date, aggData]) => ({
          date,
          clicks: aggData.clicks,
          conversions: aggData.conversions,
          revenue: aggData.revenue,
          cpa: aggData.conversions > 0 ? 0 : 0,
          roas: 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!user && !!campaignId,
  });
}
