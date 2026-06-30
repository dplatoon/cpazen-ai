import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface TrackingDomainConfig {
  custom_domain?: string;
  use_custom_domain: boolean;
}

export function useTrackingDomain() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultConfig: TrackingDomainConfig = {
    custom_domain: 'track.cpazen.com',
    use_custom_domain: false
  };

  const { data: config = defaultConfig, isLoading } = useQuery({
    queryKey: ['trackingDomain', user?.id],
    queryFn: async (): Promise<TrackingDomainConfig> => {
      if (!user) return defaultConfig;

      // Read from tracking_domains table for verified custom domains
      const { data: domainData, error: domainError } = await supabase
        .from('tracking_domains')
        .select('domain, is_verified, is_primary')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .order('is_primary', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (domainError) {
        console.error('Error fetching tracking domain:', domainError);
        return defaultConfig;
      }

      if (domainData?.domain) {
        return {
          custom_domain: domainData.domain,
          use_custom_domain: true,
        };
      }

      return defaultConfig;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const updateDomainMutation = useMutation({
    mutationFn: async (newConfig: Partial<TrackingDomainConfig>) => {
      if (!user) throw new Error('User not authenticated');
      
      if (newConfig.custom_domain) {
        // Upsert tracking domain record
        const { error } = await supabase
          .from('tracking_domains')
          .upsert({
            user_id: user.id,
            domain: newConfig.custom_domain,
            is_verified: false,
            is_primary: true,
          }, { onConflict: 'user_id,domain' });

        if (error) throw error;
      }

      return { ...config, ...newConfig };
    },
    onSuccess: (newConfig) => {
      queryClient.setQueryData(['trackingDomain', user?.id], newConfig);
      toast({
        title: "Domain Settings Updated",
        description: "Your tracking domain preferences have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update domain settings",
        variant: "destructive",
      });
    },
  });

  const generateTrackingUrl = (campaignId: string, subId?: string) => {
    const baseUrl = config.use_custom_domain && config.custom_domain
      ? `https://${config.custom_domain}/c`
      : '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-click';
    
    const url = `${baseUrl}/${campaignId}`;
    return subId ? `${url}?sub=${subId}` : `${url}?sub={sub_id}`;
  };

  const getPostbackUrl = () => {
    return '${import.meta.env.VITE_SUPABASE_URL}/functions/v1/postback';
  };

  return {
    config,
    isLoading,
    updateDomain: updateDomainMutation.mutate,
    isUpdating: updateDomainMutation.isPending,
    generateTrackingUrl,
    getPostbackUrl,
  };
}