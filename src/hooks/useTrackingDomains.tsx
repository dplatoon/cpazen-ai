import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface TrackingDomain {
  id: string;
  user_id: string;
  domain: string;
  verification_status: 'pending' | 'verified' | 'failed';
  verification_token: string;
  dns_record_type: string;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useTrackingDomains() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['trackingDomains', user?.id],
    queryFn: async (): Promise<TrackingDomain[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('tracking_domains')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TrackingDomain[];
    },
    enabled: !!user,
  });

  const addDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tracking_domains')
        .insert({
          user_id: user.id,
          domain: domain.toLowerCase().trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackingDomains'] });
      toast({
        title: 'Domain Added',
        description: 'Configure the DNS records to verify your domain.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add domain',
        variant: 'destructive',
      });
    },
  });

  const verifyDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      // Call the verify-domain edge function
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: { domainId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trackingDomains'] });
      if (data.verified) {
        toast({
          title: 'Domain Verified',
          description: 'Your tracking domain is now active.',
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: data.message || 'DNS records not found. Please try again later.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Verification failed',
        variant: 'destructive',
      });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tracking_domains')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackingDomains'] });
      toast({
        title: 'Domain Removed',
        description: 'Tracking domain has been deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete domain',
        variant: 'destructive',
      });
    },
  });

  const getVerifiedDomain = (): TrackingDomain | undefined => {
    return domains.find(d => d.verification_status === 'verified');
  };

  return {
    domains,
    isLoading,
    addDomain: addDomainMutation.mutate,
    isAdding: addDomainMutation.isPending,
    verifyDomain: verifyDomainMutation.mutate,
    isVerifying: verifyDomainMutation.isPending,
    deleteDomain: deleteDomainMutation.mutate,
    isDeleting: deleteDomainMutation.isPending,
    getVerifiedDomain,
  };
}
