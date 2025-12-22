import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Dashboard stats hook - optimized with RPC function
export function useDashboardStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Use the optimized RPC function
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_user_id: user.id,
        p_start_date: new Date().toISOString().split('T')[0],
        p_end_date: new Date().toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error fetching dashboard stats:', error);
        // Fall back to direct query if RPC fails (no data in campaign_stats)
        return await fetchDashboardStatsFallback(user.id);
      }

      const stats = data?.[0];
      if (!stats || (stats.total_clicks === 0 && stats.total_conversions === 0)) {
        // Fall back if no aggregated data
        return await fetchDashboardStatsFallback(user.id);
      }

      return {
        todayClicks: Number(stats.total_clicks) || 0,
        todayConversions: Number(stats.total_conversions) || 0,
        todayRevenue: Number(stats.total_revenue) || 0,
        conversionRate: String(stats.conversion_rate || '0.00'),
        epc: String(stats.epc || '0.00'),
        avgPayout: String(stats.avg_payout || '0.00')
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

// Fallback function for direct query when campaign_stats has no data
async function fetchDashboardStatsFallback(userId: string) {
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

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
    .eq('campaigns.user_id', userId)
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);

  const clicks = todayClicks?.length || 0;
  const conversions = todayClicks?.filter(c => c.conversions && c.conversions.length > 0 && c.conversions[0].payout).length || 0;
  const revenue = todayClicks?.reduce((sum, c) => {
    const conversion = c.conversions && c.conversions.length > 0 ? c.conversions[0] : null;
    return sum + (conversion?.payout || 0);
  }, 0) || 0;
  const conversionRate = clicks > 0 ? (conversions / clicks * 100) : 0;
  const epc = clicks > 0 ? (revenue / clicks) : 0;

  const approvedConversions = todayClicks?.filter(c => 
    c.conversions && c.conversions.length > 0 && c.conversions[0].status === 'approved'
  ) || [];
  const avgPayout = approvedConversions.length > 0 ? 
    approvedConversions.reduce((sum, c) => sum + (c.conversions[0]?.payout || 0), 0) / approvedConversions.length : 0;

  return {
    todayClicks: clicks,
    todayConversions: conversions,
    todayRevenue: revenue,
    conversionRate: conversionRate.toFixed(2),
    epc: epc.toFixed(2),
    avgPayout: avgPayout.toFixed(2)
  };
}

// Chart data hook - optimized with RPC function
export function useChartData() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['chartData', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Try optimized RPC function first
      const { data, error } = await supabase.rpc('get_dashboard_chart_data', {
        p_user_id: user.id,
        p_days: 7
      });

      if (!error && data && data.length > 0) {
        return data.map((row: { date: string; clicks: number; conversions: number; revenue: number }) => ({
          date: row.date,
          clicks: Number(row.clicks) || 0,
          conversions: Number(row.conversions) || 0,
          revenue: Number(row.revenue) || 0
        }));
      }

      // Fall back to direct query
      return await fetchChartDataFallback(user.id);
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}

// Fallback for chart data
async function fetchChartDataFallback(userId: string) {
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
      .eq('campaigns.user_id', userId)
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd);

    const clicks = dayClicks?.length || 0;
    const conversions = dayClicks?.filter(c => c.conversions && c.conversions.length > 0 && c.conversions[0].payout).length || 0;
    const revenue = dayClicks?.reduce((sum, c) => {
      const conversion = c.conversions && c.conversions.length > 0 ? c.conversions[0] : null;
      return sum + (conversion?.payout || 0);
    }, 0) || 0;

    chartData.push({
      date: day,
      clicks,
      conversions,
      revenue
    });
  }

  return chartData;
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
            currency,
            offer_url
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

// Top campaigns hook - optimized with RPC function
export function useTopCampaigns() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['topCampaigns', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Try optimized RPC function first
      const { data, error } = await supabase.rpc('get_top_campaigns', {
        p_user_id: user.id,
        p_days: 7,
        p_limit: 10
      });

      if (!error && data && data.length > 0) {
        return data.map((row: { 
          campaign_id: string;
          campaign_name: string;
          offer_name: string;
          network: string;
          clicks: number;
          conversions: number;
          revenue: number;
          conversion_rate: number;
          epc: number;
          status: string;
        }) => ({
          id: row.campaign_id,
          name: row.campaign_name,
          offer: row.offer_name,
          network: row.network,
          clicks: Number(row.clicks) || 0,
          conversions: Number(row.conversions) || 0,
          revenue: Number(row.revenue) || 0,
          conversionRate: Number(row.conversion_rate) || 0,
          epc: Number(row.epc) || 0,
          status: row.status
        }));
      }

      // Fall back to direct query
      return await fetchTopCampaignsFallback(user.id);
    },
    enabled: !!user,
  });
}

// Fallback for top campaigns
async function fetchTopCampaignsFallback(userId: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: campaignClicks } = await supabase
    .from('clicks')
    .select(`
      campaign_id,
      campaigns!inner (
        name,
        user_id,
        status,
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
    .eq('campaigns.user_id', userId)
    .gte('created_at', weekAgo.toISOString());

  const campaignStats = (campaignClicks || []).reduce((acc: Record<string, {
    id: string;
    name: string;
    offer: string;
    network: string;
    status: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>, click) => {
    const campaignId = click.campaign_id;
    if (!acc[campaignId]) {
      acc[campaignId] = {
        id: campaignId,
        name: click.campaigns.name,
        offer: click.campaigns.offers?.name || 'Unknown Offer',
        network: click.campaigns.offers?.network || 'Unknown Network',
        status: click.campaigns.status,
        clicks: 0,
        conversions: 0,
        revenue: 0
      };
    }
    acc[campaignId].clicks++;
    const conversion = click.conversions && click.conversions.length > 0 ? click.conversions[0] : null;
    if (conversion && conversion.payout) {
      acc[campaignId].conversions++;
      acc[campaignId].revenue += conversion.payout;
    }
    return acc;
  }, {});

  return Object.values(campaignStats)
    .map((c) => ({
      ...c,
      conversionRate: c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0,
      epc: c.clicks > 0 ? c.revenue / c.clicks : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
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
    refetchInterval: 3600000,
  });
}
