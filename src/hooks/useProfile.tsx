import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  company_name?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, company_name, timezone, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });
}

// Separate hook for secret key with proper security (returns masked version only)
export function useSecretKey() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['secret-key-masked', user?.id],
    queryFn: async (): Promise<string | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .rpc('get_user_secret_key_masked');

      if (error) {
        console.error('Error fetching masked secret key');
        throw error;
      }

      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Keep for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

// Hook for secret key rotation
export function useRotateSecretKey() {
  const { user } = useAuth();

  return async (): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('rotate_user_secret_key');

    if (error) {
      console.error('Error rotating secret key');
      throw error;
    }

    return data;
  };
}

// Hook for generating security tokens for specific clicks
export function useGenerateSecurityToken() {
  const { user } = useAuth();

  return async (clickId: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('generate_security_token_for_click', {
        click_id_param: clickId
      });

    if (error) {
      console.error('Error generating security token');
      throw error;
    }

    return data;
  };
}