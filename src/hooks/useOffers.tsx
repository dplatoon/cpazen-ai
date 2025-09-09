import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Offer {
  id: string;
  name: string;
  network: string;
  payout: number;
  currency: string;
  countries: string[];
  daily_cap: number | null;
  status: 'active' | 'paused' | 'stopped';
  offer_url: string;
  created_at: string;
  updated_at: string;
}

export function useOffers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['offers', user?.id],
    queryFn: async (): Promise<Offer[]> => {
      if (!user) return [];

      // Use the secure function to get available offers
      const { data, error } = await supabase.rpc('get_available_offers');

      if (error) {
        console.error('Error fetching offers:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (offerData: Omit<Offer, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('offers')
        .insert({
          name: offerData.name,
          network: offerData.network,
          offer_url: offerData.offer_url,
          payout: offerData.payout,
          currency: offerData.currency,
          countries: offerData.countries,
          daily_cap: offerData.daily_cap,
          status: offerData.status,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', user?.id] });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Offer> & { id: string }) => {
      const { data, error } = await supabase
        .from('offers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', user?.id] });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', user?.id] });
    },
  });
}