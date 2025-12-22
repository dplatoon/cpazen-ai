import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface RealtimeStats {
  todayClicks: number;
  todayConversions: number;
  todayRevenue: number;
}

export function useRealtimeStats() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeUpdates, setRealtimeUpdates] = useState<{
    lastClick: Date | null;
    lastConversion: Date | null;
    isConnected: boolean;
  }>({
    lastClick: null,
    lastConversion: null,
    isConnected: false,
  });

  const invalidateQueries = useCallback(() => {
    // Invalidate dashboard queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    queryClient.invalidateQueries({ queryKey: ['chartData'] });
    queryClient.invalidateQueries({ queryKey: ['topCampaigns'] });
    queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
  }, [queryClient]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to clicks table changes
    const clicksChannel = supabase
      .channel('realtime-clicks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clicks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New click received:', payload);
          setRealtimeUpdates((prev) => ({
            ...prev,
            lastClick: new Date(),
          }));
          invalidateQueries();
        }
      )
      .subscribe((status) => {
        console.log('Clicks channel status:', status);
        setRealtimeUpdates((prev) => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED',
        }));
      });

    // Subscribe to conversions table changes
    const conversionsChannel = supabase
      .channel('realtime-conversions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New conversion received:', payload);
          setRealtimeUpdates((prev) => ({
            ...prev,
            lastConversion: new Date(),
          }));
          invalidateQueries();
        }
      )
      .subscribe((status) => {
        console.log('Conversions channel status:', status);
      });

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(clicksChannel);
      supabase.removeChannel(conversionsChannel);
    };
  }, [user, invalidateQueries]);

  return realtimeUpdates;
}

// Hook for realtime webhook logs
export function useRealtimeWebhookLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const webhookLogsChannel = supabase
      .channel('realtime-webhook-logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhook_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Webhook log update:', payload);
          queryClient.invalidateQueries({ queryKey: ['webhookLogs'] });
          queryClient.invalidateQueries({ queryKey: ['webhookRetryQueue'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(webhookLogsChannel);
    };
  }, [user, queryClient]);
}
