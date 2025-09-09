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

      // Get all clicks for user's campaigns
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
        .eq('campaigns.user_id', user.id);

      if (!clicksData) return {};

      // Group by campaign and calculate metrics
      const metrics: CampaignMetrics = {};

      clicksData.forEach(click => {
        const campaignId = click.campaign_id;
        
        if (!metrics[campaignId]) {
          metrics[campaignId] = {
            clicks: 0,
            conversions: 0,
            revenue: 0,
            conversionRate: 0,
            epc: 0
          };
        }

        metrics[campaignId].clicks++;
        
        if (click.conversions && click.conversions.payout) {
          metrics[campaignId].conversions++;
          metrics[campaignId].revenue += click.conversions.payout;
        }
      });

      // Calculate rates
      Object.keys(metrics).forEach(campaignId => {
        const metric = metrics[campaignId];
        metric.conversionRate = metric.clicks > 0 ? (metric.conversions / metric.clicks) * 100 : 0;
        metric.epc = metric.clicks > 0 ? metric.revenue / metric.clicks : 0;
      });

      return metrics;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
}