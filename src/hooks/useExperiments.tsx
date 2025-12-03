import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type ExperimentType = 'lander_ab' | 'creative_ab' | 'offer_rotation';
export type ExperimentStatus = 'running' | 'paused' | 'completed';
export type ExperimentMetric = 'cpa' | 'roas' | 'conversion_rate' | 'revenue';

export interface ExperimentVariant {
  id: string;
  label: string;
  url?: string;
  weight: number;
}

export interface Experiment {
  id: string;
  campaign_id: string;
  user_id: string;
  name: string;
  type: ExperimentType;
  status: ExperimentStatus;
  metric: ExperimentMetric;
  variants: ExperimentVariant[];
  winner_variant_id: string | null;
  min_data_threshold: number;
  created_at: string;
  updated_at: string;
}

export function useExperiments(campaignId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['experiments', campaignId],
    queryFn: async () => {
      let query = supabase
        .from('experiments')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Parse variants JSON
      return (data || []).map(exp => ({
        ...exp,
        variants: Array.isArray(exp.variants) ? exp.variants : JSON.parse(exp.variants as any || '[]'),
      })) as Experiment[];
    },
    enabled: !!user,
  });
}

export function useCreateExperiment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (experiment: {
      campaign_id: string;
      name: string;
      type: ExperimentType;
      metric: ExperimentMetric;
      variants: ExperimentVariant[];
      min_data_threshold?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const insertData = {
        campaign_id: experiment.campaign_id,
        name: experiment.name,
        type: experiment.type,
        metric: experiment.metric,
        variants: experiment.variants as unknown,
        min_data_threshold: experiment.min_data_threshold || 100,
        user_id: user.id,
        status: 'running',
      };
      
      const { data, error } = await supabase
        .from('experiments')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast({
        title: "Experiment Created",
        description: "A/B test has been created and is now running.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create experiment",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateExperiment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Experiment> & { id: string }) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.name) updateData.name = updates.name;
      if (updates.status) updateData.status = updates.status;
      if (updates.metric) updateData.metric = updates.metric;
      if (updates.variants) updateData.variants = updates.variants as unknown as Record<string, unknown>[];
      if (updates.winner_variant_id !== undefined) updateData.winner_variant_id = updates.winner_variant_id;
      
      const { error } = await supabase
        .from('experiments')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast({
        title: "Experiment Updated",
        description: "Experiment has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update experiment",
        variant: "destructive",
      });
    },
  });
}

export function useEndExperiment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, winnerVariantId }: { id: string; winnerVariantId?: string }) => {
      const { error } = await supabase
        .from('experiments')
        .update({ 
          status: 'completed', 
          winner_variant_id: winnerVariantId || null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast({
        title: "Experiment Completed",
        description: "Experiment has been marked as completed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to end experiment",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteExperiment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast({
        title: "Experiment Deleted",
        description: "Experiment has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete experiment",
        variant: "destructive",
      });
    },
  });
}
