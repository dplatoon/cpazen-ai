import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface NetworkAccount {
  id: string;
  user_id: string;
  network_type: string;
  name: string;
  external_id: string | null;
  postback_secret: string;
  config_json: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostbackKey {
  id: string;
  user_id: string;
  network_account_id: string;
  key: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateNetworkAccountInput {
  network_type: string;
  name: string;
  external_id?: string;
  config_json?: Json;
}

export function useNetworkAccounts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['networkAccounts', user?.id],
    queryFn: async (): Promise<NetworkAccount[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('network_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as NetworkAccount[];
    },
    enabled: !!user,
  });

  const { data: postbackKeys = [] } = useQuery({
    queryKey: ['postbackKeys', user?.id],
    queryFn: async (): Promise<PostbackKey[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('postback_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PostbackKey[];
    },
    enabled: !!user,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (input: CreateNetworkAccountInput) => {
      if (!user) throw new Error('User not authenticated');

      // Create network account
      const { data: account, error: accountError } = await supabase
        .from('network_accounts')
        .insert([{
          user_id: user.id,
          network_type: input.network_type,
          name: input.name,
          external_id: input.external_id || null,
          config_json: input.config_json || {} as Json,
        }])
        .select()
        .single();

      if (accountError) throw accountError;

      // Create postback key for this account
      const { error: keyError } = await supabase
        .from('postback_keys')
        .insert({
          user_id: user.id,
          network_account_id: account.id,
        });

      if (keyError) throw keyError;

      return account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networkAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['postbackKeys'] });
      toast({
        title: 'Network Connected',
        description: 'Your network account has been added successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add network account',
        variant: 'destructive',
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NetworkAccount> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.network_type !== undefined) updateData.network_type = updates.network_type;
      if (updates.external_id !== undefined) updateData.external_id = updates.external_id;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.config_json !== undefined) updateData.config_json = updates.config_json as Json;

      const { data, error } = await supabase
        .from('network_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networkAccounts'] });
      toast({
        title: 'Updated',
        description: 'Network account updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update network account',
        variant: 'destructive',
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('network_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networkAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['postbackKeys'] });
      toast({
        title: 'Deleted',
        description: 'Network account removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete network account',
        variant: 'destructive',
      });
    },
  });

  const regeneratePostbackKey = useMutation({
    mutationFn: async (networkAccountId: string) => {
      if (!user) throw new Error('User not authenticated');

      // Deactivate old key
      await supabase
        .from('postback_keys')
        .update({ is_active: false })
        .eq('network_account_id', networkAccountId);

      // Create new key
      const { data, error } = await supabase
        .from('postback_keys')
        .insert({
          user_id: user.id,
          network_account_id: networkAccountId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postbackKeys'] });
      toast({
        title: 'Key Regenerated',
        description: 'New postback key generated. Update your network settings.',
      });
    },
  });

  const getPostbackKeyForAccount = (accountId: string): PostbackKey | undefined => {
    return postbackKeys.find(k => k.network_account_id === accountId);
  };

  return {
    accounts,
    postbackKeys,
    isLoading,
    createAccount: createAccountMutation.mutate,
    isCreating: createAccountMutation.isPending,
    updateAccount: updateAccountMutation.mutate,
    isUpdating: updateAccountMutation.isPending,
    deleteAccount: deleteAccountMutation.mutate,
    isDeleting: deleteAccountMutation.isPending,
    regeneratePostbackKey: regeneratePostbackKey.mutate,
    getPostbackKeyForAccount,
  };
}
