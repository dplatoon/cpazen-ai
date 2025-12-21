import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  status: string;
  offer_id: string | null;
  redirect_mode: string | null;
  cost_model: string | null;
  tracking_domain: string | null;
  daily_budget: number | null;
  monthly_budget: number | null;
  total_budget: number | null;
  target_cpa: number | null;
  target_geo: string[] | null;
  devices: string[] | null;
  os: string[] | null;
  vertical: string | null;
  currency: string | null;
  traffic_source_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useCampaigns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async (): Promise<Campaign[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (input: Partial<Campaign>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: input.name || 'New Campaign',
          status: input.status || 'active',
          offer_id: input.offer_id,
          redirect_mode: input.redirect_mode || '302',
          cost_model: input.cost_model || 'CPC',
          tracking_domain: input.tracking_domain,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign Created',
        description: 'Your campaign has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign',
        variant: 'destructive',
      });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Updated',
        description: 'Campaign updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update campaign',
        variant: 'destructive',
      });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Deleted',
        description: 'Campaign has been deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete campaign',
        variant: 'destructive',
      });
    },
  });

  return {
    campaigns,
    isLoading,
    createCampaign: createCampaignMutation.mutate,
    isCreating: createCampaignMutation.isPending,
    updateCampaign: updateCampaignMutation.mutate,
    isUpdating: updateCampaignMutation.isPending,
    deleteCampaign: deleteCampaignMutation.mutate,
    isDeleting: deleteCampaignMutation.isPending,
  };
}
