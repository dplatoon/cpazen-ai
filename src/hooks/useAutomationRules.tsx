import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type ConditionMetric = 'cpa' | 'roas' | 'conversion_rate' | 'clicks' | 'conversions';
export type ConditionOperator = '>' | '<' | '>=' | '<=';
export type ActionType = 'pause_campaign' | 'pause_source' | 'lower_bid' | 'raise_bid' | 'send_alert';

export interface RuleCondition {
  metric: ConditionMetric;
  operator: ConditionOperator;
  threshold: number;
  scope: 'campaign' | 'source' | 'subId';
  timeWindow: {
    value: number;
    unit: string;
  };
}

export interface RuleAction {
  type: ActionType;
  value?: number; // For bid adjustments
  notification?: string; // For alerts
}

export interface AutomationRule {
  id: string;
  campaign_id: string;
  user_id: string;
  name: string;
  condition_json: RuleCondition;
  action_json: RuleAction;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useAutomationRules(campaignId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['automation-rules', campaignId],
    queryFn: async () => {
      let query = supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(rule => ({
        ...rule,
        condition_json: rule.condition_json as unknown as RuleCondition,
        action_json: rule.action_json as unknown as RuleAction,
      })) as AutomationRule[];
    },
    enabled: !!user,
  });
}

export function useCreateAutomationRule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: {
      campaign_id: string;
      name: string;
      condition_json: RuleCondition;
      action_json: RuleAction;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const insertData = {
        campaign_id: rule.campaign_id,
        name: rule.name,
        condition_json: rule.condition_json as unknown,
        action_json: rule.action_json as unknown,
        user_id: user.id,
        is_active: true,
      };
      
      const { data, error } = await supabase
        .from('automation_rules')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({
        title: "Rule Created",
        description: "Automation rule has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create automation rule",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAutomationRule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AutomationRule> & { id: string }) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.name) updateData.name = updates.name;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.condition_json) updateData.condition_json = updates.condition_json as unknown as Record<string, unknown>;
      if (updates.action_json) updateData.action_json = updates.action_json as unknown as Record<string, unknown>;
      
      const { error } = await supabase
        .from('automation_rules')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({
        title: "Rule Updated",
        description: "Automation rule has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update automation rule",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAutomationRule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({
        title: "Rule Deleted",
        description: "Automation rule has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete automation rule",
        variant: "destructive",
      });
    },
  });
}

export function useToggleAutomationRule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({
        title: is_active ? "Rule Activated" : "Rule Deactivated",
        description: `Automation rule is now ${is_active ? 'active' : 'inactive'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle automation rule",
        variant: "destructive",
      });
    },
  });
}
