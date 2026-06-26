import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface PaymentMethod {
  id: string;
  method_type: string;
  account_name: string;
  account_number: string;
  is_primary: boolean;
  currency: string;
  extra_details: Record<string, any>;
  created_at: string;
}

export type PaymentMethodType = 'bkash' | 'nagad' | 'rocket' | 'paypal' | 'wise' | 'bank_wire' | 'usdt_trc20' | 'usdt_erc20';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, { label: string; icon: string; currency: string }> = {
  bkash: { label: 'bKash', icon: '💳', currency: 'BDT' },
  nagad: { label: 'Nagad', icon: '📱', currency: 'BDT' },
  rocket: { label: 'Rocket', icon: '🚀', currency: 'BDT' },
  paypal: { label: 'PayPal', icon: '🅿️', currency: 'USD' },
  wise: { label: 'Wise', icon: '💸', currency: 'USD' },
  bank_wire: { label: 'Bank Wire', icon: '🏦', currency: 'USD' },
  usdt_trc20: { label: 'USDT (TRC-20)', icon: '₮', currency: 'USDT' },
  usdt_erc20: { label: 'USDT (ERC-20)', icon: '₮', currency: 'USDT' },
};

export function usePaymentMethods() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payment-methods', user?.id],
    queryFn: async (): Promise<PaymentMethod[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useAddPaymentMethod() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (method: {
      method_type: PaymentMethodType;
      account_name: string;
      account_number: string;
      is_primary?: boolean;
      currency?: string;
      extra_details?: Record<string, any>;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // If setting as primary, unset existing primary first
      if (method.is_primary) {
        await supabase
          .from('payment_methods')
          .update({ is_primary: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user.id,
          method_type: method.method_type,
          account_name: method.account_name,
          account_number: method.account_number,
          is_primary: method.is_primary ?? false,
          currency: method.currency || PAYMENT_METHOD_LABELS[method.method_type]?.currency || 'USD',
          extra_details: method.extra_details || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast({ title: 'Payment Method Added', description: 'Your payment method has been saved.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeletePaymentMethod() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (methodId: string) => {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast({ title: 'Payment Method Removed' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
