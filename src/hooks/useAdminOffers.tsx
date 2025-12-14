import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { logAuditEvent } from '@/hooks/useAuditLogs';
import { useAuth } from '@/hooks/useAuth';

export interface AdminOffer {
  id: string;
  user_id: string;
  name: string;
  network: string | null;
  payout: number;
  currency: string;
  countries: string[] | null;
  daily_cap: number | null;
  status: string;
  offer_url: string;
  created_at: string;
  updated_at: string;
  owner_email: string | null;
}

export function useAdminOffers() {
  const { data: userRole } = useUserRole();

  return useQuery({
    queryKey: ['admin-offers'],
    queryFn: async (): Promise<AdminOffer[]> => {
      const { data, error } = await supabase.rpc('get_all_offers_admin');

      if (error) {
        console.error('Error fetching admin offers:', error);
        throw error;
      }

      return data || [];
    },
    enabled: userRole === 'admin',
  });
}

export function useAdminCreateOffer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (offerData: {
      name: string;
      offer_url: string;
      payout: number;
      network?: string;
      currency?: string;
      countries?: string[];
      daily_cap?: number;
      status?: string;
      user_id?: string;
    }) => {
      const { data, error } = await supabase.rpc('admin_create_offer', {
        p_name: offerData.name,
        p_offer_url: offerData.offer_url,
        p_payout: offerData.payout,
        p_network: offerData.network || null,
        p_currency: offerData.currency || 'USD',
        p_countries: offerData.countries || null,
        p_daily_cap: offerData.daily_cap || null,
        p_status: offerData.status || 'active',
        p_user_id: offerData.user_id || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (offerId, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      
      // Log audit event
      if (user) {
        logAuditEvent(user.id, 'offer_created', 'offer', offerId as string, {
          name: variables.name,
          payout: variables.payout,
        });
      }
    },
  });
}

export function useAdminUpdateOffer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (offerData: {
      id: string;
      name?: string;
      offer_url?: string;
      payout?: number;
      network?: string;
      currency?: string;
      countries?: string[];
      daily_cap?: number;
      status?: string;
    }) => {
      const { data, error } = await supabase.rpc('admin_update_offer', {
        p_offer_id: offerData.id,
        p_name: offerData.name || null,
        p_offer_url: offerData.offer_url || null,
        p_payout: offerData.payout || null,
        p_network: offerData.network || null,
        p_currency: offerData.currency || null,
        p_countries: offerData.countries || null,
        p_daily_cap: offerData.daily_cap || null,
        p_status: offerData.status || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      
      // Log audit event
      if (user) {
        logAuditEvent(user.id, 'offer_updated', 'offer', variables.id, {
          updated_fields: Object.keys(variables).filter(k => k !== 'id'),
        });
      }
    },
  });
}

export function useAdminDeleteOffer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (offerId: string) => {
      const { data, error } = await supabase.rpc('admin_delete_offer', {
        p_offer_id: offerId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, offerId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      
      // Log audit event
      if (user) {
        logAuditEvent(user.id, 'offer_deleted', 'offer', offerId);
      }
    },
  });
}
