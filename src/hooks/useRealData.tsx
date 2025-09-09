import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Dashboard stats hook
export function useDashboardStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Get today's clicks
      const { data: todayClicks } = await supabase
        .from('clicks')
        .select(`
          *,
          campaigns!inner (
            user_id
          ),
          conversions (
            payout,
            status
          )
        `)
        .eq('campaigns.user_id', user.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      const clicks = todayClicks?.length || 0;
      const conversions = todayClicks?.filter(c => c.conversions && c.conversions.payout).length || 0;
      const revenue = todayClicks?.reduce((sum, c) => sum + (c.conversions?.payout || 0), 0) || 0;
      const conversionRate = clicks > 0 ? (conversions / clicks * 100) : 0;
      const epc = clicks > 0 ? (revenue / clicks) : 0;

      // Calculate average payout
      const approvedConversions = todayClicks?.filter(c => 
        c.conversions && c.conversions.status === 'approved'
      ) || [];
      const avgPayout = approvedConversions.length > 0 ? 
        approvedConversions.reduce((sum, c) => sum + c.conversions.payout, 0) / approvedConversions.length : 0;

      return {
        todayClicks: clicks,
        todayConversions: conversions,
        todayRevenue: revenue,
        conversionRate: conversionRate.toFixed(2),
        epc: epc.toFixed(2),
        avgPayout: avgPayout.toFixed(2)
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Chart data hook
export function useChartData() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['chartData', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const chartData = [];

      for (const day of days) {
        const dayStart = `${day}T00:00:00.000Z`;
        const dayEnd = `${day}T23:59:59.999Z`;

        const { data: dayClicks } = await supabase
          .from('clicks')
          .select(`
            *,
            campaigns!inner (
              user_id
            ),
            conversions (
              payout,
              status
            )
          `)
          .eq('campaigns.user_id', user.id)
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd);

        const clicks = dayClicks?.length || 0;
        const conversions = dayClicks?.filter(c => c.conversions && c.conversions.payout).length || 0;
        const revenue = dayClicks?.reduce((sum, c) => sum + (c.conversions?.payout || 0), 0) || 0;

        chartData.push({
          date: day,
          clicks,
          conversions,
          revenue
        });
      }

      return chartData;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
}

// Campaigns hook
export function useCampaigns() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          offers (
            name,
            network,
            payout,
            currency
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user,
  });
}

// Offers hook
export function useOffers() {
  return useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching offers:', error);
        return [];
      }

      return data || [];
    },
  });
}

// Top campaigns hook
export function useTopCampaigns() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['topCampaigns', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get last 7 days data
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: campaignClicks } = await supabase
        .from('clicks')
        .select(`
          campaign_id,
          campaigns!inner (
            name,
            user_id,
            offers (
              name,
              network
            )
          ),
          conversions (
            payout,
            status
          )
        `)
        .eq('campaigns.user_id', user.id)
        .gte('created_at', weekAgo.toISOString());

      // Group by campaign and calculate stats
      const campaignStats = (campaignClicks || []).reduce((acc, click) => {
        const campaignId = click.campaign_id;
        if (!acc[campaignId]) {
          acc[campaignId] = {
            id: campaignId,
            name: click.campaigns.name,
            offer: click.campaigns.offers.name,
            network: click.campaigns.offers.network,
            clicks: 0,
            conversions: 0,
            revenue: 0
          };
        }
        acc[campaignId].clicks++;
        if (click.conversions && click.conversions.payout) {
          acc[campaignId].conversions++;
          acc[campaignId].revenue += click.conversions.payout;
        }
        return acc;
      }, {});

      // Convert to array and sort by revenue
      return Object.values(campaignStats)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);
    },
    enabled: !!user,
  });
}

// AI Insights hook
export function useAIInsights() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['aiInsights'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-insights');
      
      if (error) {
        console.error('Error fetching AI insights:', error);
        return { insights: ['Unable to generate insights at this time.'] };
      }

      return data;
    },
    enabled: !!user,
    refetchInterval: 3600000, // Refetch every hour
  });
}