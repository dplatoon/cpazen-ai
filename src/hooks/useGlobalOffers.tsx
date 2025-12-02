import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface GlobalOffer {
  id: string;
  name: string;
  network: string | null;
  payout: number;
  currency: string;
  countries: string[] | null;
  daily_cap: number | null;
  status: string;
  offer_url: string;
  created_at: string;
}

export function useGlobalOffers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['global-offers'],
    queryFn: async (): Promise<GlobalOffer[]> => {
      const { data, error } = await supabase.rpc('get_global_offers');

      if (error) {
        console.error('Error fetching global offers:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
}
