import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Json;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UseAuditLogsParams {
  limit?: number;
  offset?: number;
  actionFilter?: string | null;
  userFilter?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export function useAuditLogs(params: UseAuditLogsParams = {}) {
  const { 
    limit = 100, 
    offset = 0, 
    actionFilter = null, 
    userFilter = null,
    startDate = null,
    endDate = null,
  } = params;

  return useQuery({
    queryKey: ['audit-logs', limit, offset, actionFilter, userFilter, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<AuditLog[]> => {
      const { data, error } = await supabase.rpc('get_audit_logs_admin', {
        p_limit: limit,
        p_offset: offset,
        p_action_filter: actionFilter,
        p_user_filter: userFilter,
        p_start_date: startDate?.toISOString() || null,
        p_end_date: endDate?.toISOString() || null,
      });
      if (error) throw error;
      return (data || []) as AuditLog[];
    },
  });
}

export async function logAuditEvent(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Json
) {
  const { error } = await supabase.rpc('log_audit_event', {
    p_user_id: userId,
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId || null,
    p_details: details || {},
  });
  if (error) {
    console.error('Failed to log audit event:', error);
  }
}
