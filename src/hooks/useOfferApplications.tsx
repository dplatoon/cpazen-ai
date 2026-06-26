import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface OfferApplication {
  id: string;
  affiliate_id: string;
  offer_id: string;
  status: string;
  tracking_link: string | null;
  custom_payout: number | null;
  applied_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  offers?: {
    name: string;
    payout: number;
    currency: string;
    network: string | null;
    offer_url: string;
    status: string;
  };
}

export function useMyOfferApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-offer-applications', user?.id],
    queryFn: async (): Promise<OfferApplication[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('affiliate_offer_applications')
        .select(`
          *,
          offers (
            name, payout, currency, network, offer_url, status
          )
        `)
        .eq('affiliate_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useApplyForOffer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('apply_for_offer', {
        p_offer_id: offerId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-offer-applications'] });
      queryClient.invalidateQueries({ queryKey: ['global-offers'] });
      toast({
        title: 'Application Submitted!',
        description: 'You have been approved for this offer. Your tracking link is ready.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Application Failed',
        description: error.message || 'Could not apply for this offer.',
        variant: 'destructive',
      });
    },
  });
}

// Admin hook for managing all applications
export function useAllOfferApplications() {
  return useQuery({
    queryKey: ['all-offer-applications'],
    queryFn: async (): Promise<OfferApplication[]> => {
      const { data, error } = await supabase
        .from('affiliate_offer_applications')
        .select(`
          *,
          offers ( name, payout, currency, network )
        `)
        .order('applied_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });
}
