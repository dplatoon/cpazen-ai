import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AffiliateBalance {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_paid: number;
  total_rejected: number;
}

export interface EarningRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
  campaign_id: string | null;
  offer_id: string | null;
}

export function useAffiliateBalance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['affiliate-balance', user?.id],
    queryFn: async (): Promise<AffiliateBalance> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_affiliate_balance', {
        p_affiliate_id: user.id,
      });

      if (error) throw error;

      const row = data?.[0] || {
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0,
        total_paid: 0,
        total_rejected: 0,
      };

      return {
        available_balance: Number(row.available_balance) || 0,
        pending_balance: Number(row.pending_balance) || 0,
        total_earned: Number(row.total_earned) || 0,
        total_paid: Number(row.total_paid) || 0,
        total_rejected: Number(row.total_rejected) || 0,
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useEarningsHistory(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['earnings-history', user?.id, limit],
    queryFn: async (): Promise<EarningRecord[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('affiliate_earnings')
        .select('*')
        .eq('affiliate_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}
