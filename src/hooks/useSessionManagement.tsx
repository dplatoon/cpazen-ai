import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface RawSession {
  id: string;
  device_info: Json;
  ip_address: string | null;
  user_agent: string | null;
  last_active_at: string;
  created_at: string;
  is_current: boolean;
}

export interface UserSession {
  id: string;
  device_info: Json;
  ip_address: string | null;
  user_agent: string | null;
  last_active_at: string;
  created_at: string;
  is_current: boolean;
  browser?: string;
  os?: string;
  device?: string;
}

function parseUserAgent(ua: string | null): { browser: string; os: string; device: string } {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
  
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';
  
  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  // OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // Device detection
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) device = 'Mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet';
  
  return { browser, os, device };
}

export function useUserSessions() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: ['user-sessions'],
    queryFn: async (): Promise<UserSession[]> => {
      const currentToken = session?.access_token || '';
      
      const { data, error } = await supabase.rpc('get_user_sessions', {
        current_token: currentToken
      });
      
      if (error) throw error;
      
      return (data || []).map((s: RawSession) => ({
        ...s,
        ...parseUserAgent(s.user_agent)
      }));
    },
    enabled: !!session,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.rpc('revoke_session', {
        session_id: sessionId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      toast.success('Session revoked successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke session: ${error.message}`);
    },
  });
}

export function useRevokeAllOtherSessions() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      const currentToken = session?.access_token || '';
      
      const { data, error } = await supabase.rpc('revoke_all_other_sessions', {
        current_token: currentToken
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      toast.success(`Revoked ${count} session(s)`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke sessions: ${error.message}`);
    },
  });
}

export function useRegisterSession() {
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      if (!session?.access_token) return null;
      
      const deviceInfo = {
        ...parseUserAgent(navigator.userAgent),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
      };
      
      const { data, error } = await supabase.rpc('register_session', {
        p_session_token: session.access_token,
        p_device_info: deviceInfo,
        p_user_agent: navigator.userAgent,
      });
      
      if (error) throw error;
      return data;
    },
  });
}
