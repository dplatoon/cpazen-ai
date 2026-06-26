import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CampaignMetrics {
  [campaignId: string]: {
    clicks: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
    epc: number;
  };
}

export function useCampaignMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaignMetrics', user?.id],
    queryFn: async (): Promise<CampaignMetrics> => {
      if (!user) return {};

      // Use optimized RPC function instead of N+1 queries
      const { data, error } = await supabase.rpc('get_campaign_metrics_v2', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching campaign metrics:', error);
        // Fallback to direct query if RPC not yet deployed
        return await fetchMetricsFallback(user.id);
      }

      if (!data || data.length === 0) return {};

      // Transform RPC result into CampaignMetrics shape
      const metrics: CampaignMetrics = {};
      data.forEach((row: any) => {
        metrics[row.campaign_id] = {
          clicks: Number(row.total_clicks) || 0,
          conversions: Number(row.total_conversions) || 0,
          revenue: Number(row.total_revenue) || 0,
          conversionRate: Number(row.conversion_rate) || 0,
          epc: Number(row.epc) || 0,
        };
      });

      return metrics;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
}

// Fallback for when RPC function hasn't been deployed yet
async function fetchMetricsFallback(userId: string): Promise<CampaignMetrics> {
  const { data: clicksData } = await supabase
    .from('clicks')
    .select(`
      campaign_id,
      conversions (
        payout,
        status
      ),
      campaigns!inner (
        user_id
      )
    `)
    .eq('campaigns.user_id', userId)
    .limit(5000); // Add limit to prevent loading too much data

  if (!clicksData) return {};

  const metrics: CampaignMetrics = {};

  clicksData.forEach((click: any) => {
    const campaignId = click.campaign_id;
    
    if (!metrics[campaignId]) {
      metrics[campaignId] = {
        clicks: 0,
        conversions: 0,
        revenue: 0,
        conversionRate: 0,
        epc: 0,
      };
    }

    metrics[campaignId].clicks++;
    
    const conversion = click.conversions && click.conversions.length > 0 ? click.conversions[0] : null;
    if (conversion && conversion.payout) {
      metrics[campaignId].conversions++;
      metrics[campaignId].revenue += conversion.payout;
    }
  });

  // Calculate rates
  Object.keys(metrics).forEach(campaignId => {
    const metric = metrics[campaignId];
    metric.conversionRate = metric.clicks > 0 ? (metric.conversions / metric.clicks) * 100 : 0;
    metric.epc = metric.clicks > 0 ? metric.revenue / metric.clicks : 0;
  });

  return metrics;
}
