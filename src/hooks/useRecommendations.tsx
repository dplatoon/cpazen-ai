import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCampaignKpis, useCampaignHealthScore } from "./useCampaignAnalytics";

export type RecommendationType = 
  | 'pause_source' 
  | 'raise_bid' 
  | 'lower_bid' 
  | 'expand_geo' 
  | 'narrow_geo' 
  | 'adjust_cap' 
  | 'test_creative' 
  | 'pause_campaign' 
  | 'scale_campaign';

export type RecommendationStatus = 'new' | 'applied' | 'scheduled' | 'dismissed';

export interface Recommendation {
  id: string;
  campaign_id: string;
  user_id: string;
  type: RecommendationType;
  title: string;
  description: string;
  scope: Record<string, any>;
  expected_impact: {
    cpaDelta?: number;
    roasDelta?: number;
    revenueDelta?: number;
  };
  confidence_score: number;
  status: RecommendationStatus;
  created_at: string;
  updated_at: string;
}

export function useRecommendations(campaignId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', campaignId],
    queryFn: async () => {
      let query = supabase
        .from('recommendations')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Recommendation[];
    },
    enabled: !!user,
  });
}

export function useUpdateRecommendation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RecommendationStatus }) => {
      const { error } = await supabase
        .from('recommendations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      toast({
        title: "Recommendation Updated",
        description: "The recommendation status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update recommendation",
        variant: "destructive",
      });
    },
  });
}

// Heuristic-based recommendation engine
export function useGenerateRecommendations(campaignId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: kpis } = useCampaignKpis(campaignId);
  const { data: health } = useCampaignHealthScore(campaignId);

  return useMutation({
    mutationFn: async () => {
      if (!user || !kpis) return [];

      // Get campaign details
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (!campaign) throw new Error('Campaign not found');

      const recommendations: Omit<Recommendation, 'id' | 'created_at' | 'updated_at'>[] = [];
      const targetCpa = campaign.target_cpa || 0;
      const dailyBudget = campaign.daily_budget || 0;

      // Rule 1: CPA too high
      if (targetCpa > 0 && kpis.cpa > targetCpa * 1.2 && kpis.conversions >= 10) {
        recommendations.push({
          campaign_id: campaignId,
          user_id: user.id,
          type: 'lower_bid',
          title: 'Consider lowering bids',
          description: `Your CPA ($${kpis.cpa.toFixed(2)}) is ${((kpis.cpa / targetCpa - 1) * 100).toFixed(0)}% above target ($${targetCpa}). Consider reducing bids on underperforming sources.`,
          scope: {},
          expected_impact: { cpaDelta: -15 },
          confidence_score: kpis.conversions >= 50 ? 0.8 : 0.6,
          status: 'new',
        });
      }

      // Rule 2: High ROAS - Scale opportunity
      if (kpis.roas >= 2 && kpis.conversions >= 20) {
        recommendations.push({
          campaign_id: campaignId,
          user_id: user.id,
          type: 'scale_campaign',
          title: 'Scale this campaign',
          description: `Strong ROAS of ${kpis.roas.toFixed(2)}x with ${kpis.conversions} conversions. Consider increasing daily budget to capture more volume.`,
          scope: {},
          expected_impact: { revenueDelta: 20, roasDelta: 0 },
          confidence_score: 0.75,
          status: 'new',
        });
      }

      // Rule 3: Low conversion rate
      if (kpis.conversionRate < 1 && kpis.clicks >= 500) {
        recommendations.push({
          campaign_id: campaignId,
          user_id: user.id,
          type: 'test_creative',
          title: 'Test new creatives or landing page',
          description: `Conversion rate is only ${kpis.conversionRate.toFixed(2)}% with ${kpis.clicks} clicks. Testing new creatives or landing page optimizations could improve performance.`,
          scope: {},
          expected_impact: { cpaDelta: -10 },
          confidence_score: 0.65,
          status: 'new',
        });
      }

      // Rule 4: Budget nearly exhausted consistently
      if (dailyBudget > 0 && kpis.profit > 0) {
        recommendations.push({
          campaign_id: campaignId,
          user_id: user.id,
          type: 'adjust_cap',
          title: 'Increase daily budget cap',
          description: `Campaign is profitable. Consider increasing the daily budget to maximize returns.`,
          scope: {},
          expected_impact: { revenueDelta: 15 },
          confidence_score: 0.7,
          status: 'new',
        });
      }

      // Rule 5: Poor health score
      if (health && health.score < 40 && kpis.conversions >= 5) {
        recommendations.push({
          campaign_id: campaignId,
          user_id: user.id,
          type: 'pause_campaign',
          title: 'Consider pausing campaign',
          description: `Health score is low (${health.score}/100). ${health.reason}. Review targeting and offers before continuing.`,
          scope: {},
          expected_impact: { cpaDelta: 0 },
          confidence_score: 0.6,
          status: 'new',
        });
      }

      // Insert recommendations
      if (recommendations.length > 0) {
        const { error } = await supabase
          .from('recommendations')
          .insert(recommendations);

        if (error) throw error;
      }

      return recommendations;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      toast({
        title: "Recommendations Generated",
        description: `Generated ${data?.length || 0} new recommendations.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate recommendations",
        variant: "destructive",
      });
    },
  });
}
