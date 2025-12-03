import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface ManagedUser {
  user_id: string;
  email: string;
  company_name: string | null;
  timezone: string;
  status: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface UserActivity {
  activity_type: string;
  description: string;
  metadata: Json;
  created_at: string;
}

type AppRole = 'admin' | 'affiliate' | 'manager';

export function useAllUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<ManagedUser[]> => {
      const { data, error } = await supabase.rpc('get_all_users_admin');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data, error } = await supabase.rpc('admin_update_user_role', {
        p_user_id: userId,
        p_role: role,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { data, error } = await supabase.rpc('admin_update_user_status', {
        p_user_id: userId,
        p_status: status,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}

export function useUserActivity(userId: string | null) {
  return useQuery({
    queryKey: ['user-activity', userId],
    queryFn: async (): Promise<UserActivity[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc('get_user_activity_admin', {
        p_user_id: userId,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}
