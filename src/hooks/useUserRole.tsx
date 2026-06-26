import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'affiliate' | 'manager';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export function useUserRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<UserRole | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        // Throw to let React Query handle retry logic
        // instead of silently defaulting to 'affiliate' (security risk)
        throw new Error('Failed to fetch user role');
      }

      return data?.role as UserRole || 'affiliate';
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 3, // Retry 3 times before showing error
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Hook to check if user has a specific role
export function useHasRole(role: UserRole) {
  const { data: userRole } = useUserRole();
  return userRole === role;
}

// Hook to check if user is admin
export function useIsAdmin() {
  return useHasRole('admin');
}
