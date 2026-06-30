import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  admin_note: string | null;
  transaction_ref: string | null;
  requested_at: string;
  processed_at: string | null;
  payment_method_id: string;
}

export function useWithdrawals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['withdrawals', user?.id],
    queryFn: async (): Promise<WithdrawalRequest[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('affiliate_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useRequestWithdrawal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, paymentMethodId, currency = 'USD' }: {
      amount: number;
      paymentMethodId: string;
      currency?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('request_withdrawal', {
        p_amount: amount,
        p_payment_method_id: paymentMethodId,
        p_currency: currency,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-balance'] });
      toast({
        title: 'Withdrawal Requested',
        description: 'Your withdrawal request has been submitted for processing.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Withdrawal Failed',
        description: error.message || 'Failed to submit withdrawal request.',
        variant: 'destructive',
      });
    },
  });
}
