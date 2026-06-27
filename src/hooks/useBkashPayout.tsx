import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface PaymentTransaction {
  id: string;
  withdrawal_id: string;
  affiliate_id: string;
  gateway: string;
  gateway_txn_id: string | null;
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  recipient_number: string;
  recipient_name: string | null;
  status: string;
  gateway_response: any;
  error_message: string | null;
  initiated_at: string;
  completed_at: string | null;
}

export interface PayoutBatch {
  id: string;
  batch_name: string;
  gateway: string;
  total_amount: number;
  total_fee: number;
  transaction_count: number;
  success_count: number;
  failed_count: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export function usePaymentTransactions(limit = 50) {
  return useQuery({
    queryKey: ['payment-transactions', limit],
    queryFn: async (): Promise<PaymentTransaction[]> => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('initiated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePayoutBatches() {
  return useQuery({
    queryKey: ['payout-batches'],
    queryFn: async (): Promise<PayoutBatch[]> => {
      const { data, error } = await supabase
        .from('payout_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useGatewayConfig() {
  return useQuery({
    queryKey: ['gateway-config-bkash'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_gateway_configs')
        .select('id, gateway, environment, is_active, daily_limit, per_txn_limit, min_payout')
        .eq('gateway', 'bkash');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSinglePayout() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (withdrawalId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/bkash-payout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'single_payout',
            withdrawal_id: withdrawalId,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Payout failed');
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
      toast({
        title: data.success ? '✅ bKash Payment Sent!' : '❌ Payment Failed',
        description: data.success
          ? `৳${data.amount} sent to ${data.recipient}. TrxID: ${data.gateway_txn_id}`
          : data.message || 'Please try again.',
        variant: data.success ? 'default' : 'destructive',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Payout Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useBatchPayout() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (withdrawalIds: string[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/bkash-payout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'batch_payout',
            batch_withdrawal_ids: withdrawalIds,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Batch payout failed');
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payout-batches'] });
      toast({
        title: `Batch Complete: ${data.success}/${data.total} succeeded`,
        description: `Total: ৳${data.total_amount?.toFixed(2)}. ${data.failed} failed.`,
      });
    },
    onError: (error: any) => {
      toast({ title: 'Batch Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSaveGatewayConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: {
      app_key: string;
      app_secret: string;
      username: string;
      password: string;
      environment: 'sandbox' | 'production';
    }) => {
      const { data, error } = await supabase
        .from('payment_gateway_configs')
        .upsert({
          gateway: 'bkash',
          environment: config.environment,
          credentials: {
            app_key: config.app_key,
            app_secret: config.app_secret,
            username: config.username,
            password: config.password,
          },
          is_active: true,
        }, { onConflict: 'gateway,environment' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-config-bkash'] });
      toast({ title: 'bKash Config Saved', description: 'Gateway credentials updated successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
