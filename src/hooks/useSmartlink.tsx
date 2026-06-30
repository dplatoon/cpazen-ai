import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTrackingDomain } from './useTrackingDomain';

export interface SmartlinkStats {
  totalClicks: number;
  totalConversions: number;
  revenue: number;
  topCountries: { country: string; clicks: number }[];
  topOffers: { name: string; conversions: number; revenue: number }[];
  epc: number;
}

export function useSmartlink() {
  const { user } = useAuth();
  const { config } = useTrackingDomain();

  const getSmartlinkUrl = (subId?: string) => {
    const base = config.use_custom_domain
      ? `https://${config.custom_domain}`
      : `${import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
    
    let url = `${base}/smartlink?aff=${user?.id || ''}`;
    if (subId) url += `&sub=${encodeURIComponent(subId)}`;
    return url;
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: ['smartlink-stats', user?.id],
    queryFn: async (): Promise<SmartlinkStats> => {
      if (!user) return { totalClicks: 0, totalConversions: 0, revenue: 0, topCountries: [], topOffers: [], epc: 0 };

      // Get smartlink clicks (sub_id = 'smartlink')
      const { data: clicks } = await supabase
        .from('clicks')
        .select('id, country, created_at')
        .eq('user_id', user.id)
        .eq('sub_id', 'smartlink')
        .order('created_at', { ascending: false })
        .limit(10000);

      const totalClicks = clicks?.length || 0;

      // Count by country
      const countryMap = new Map<string, number>();
      clicks?.forEach(c => {
        const country = c.country || 'Unknown';
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      });
      const topCountries = [...countryMap.entries()]
        .map(([country, clicks]) => ({ country, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      return {
        totalClicks,
        totalConversions: 0,
        revenue: 0,
        topCountries,
        topOffers: [],
        epc: 0,
      };
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  return {
    getSmartlinkUrl,
    stats: stats || { totalClicks: 0, totalConversions: 0, revenue: 0, topCountries: [], topOffers: [], epc: 0 },
    isLoading,
  };
}
