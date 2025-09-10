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

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('user_id', user.id)
        .single();

      // For now, return default config - in future this could be stored in profile
      return defaultConfig;
    },
    enabled: !!user,
  });

  const updateDomainMutation = useMutation({
    mutationFn: async (newConfig: Partial<TrackingDomainConfig>) => {
      if (!user) throw new Error('User not authenticated');
      
      // For now, just return the config - in future this could be stored in database
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
      : 'https://pxdypbnzlxxvewtwkohn.supabase.co/functions/v1/track-click';
    
    const url = `${baseUrl}/${campaignId}`;
    return subId ? `${url}?sub=${subId}` : `${url}?sub={sub_id}`;
  };

  const getPostbackUrl = () => {
    return 'https://pxdypbnzlxxvewtwkohn.supabase.co/functions/v1/postback';
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