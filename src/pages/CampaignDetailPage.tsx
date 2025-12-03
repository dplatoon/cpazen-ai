import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Pause, Settings, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCampaigns } from "@/hooks/useRealData";
import { useCampaignKpis, useCampaignHealthScore } from "@/hooks/useCampaignAnalytics";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { CampaignSummaryCards } from "@/components/campaigns/CampaignSummaryCards";
import { PerformanceCharts } from "@/components/campaigns/PerformanceCharts";
import { BreakdownTables } from "@/components/campaigns/BreakdownTables";
import { HealthScoreBadge } from "@/components/campaigns/HealthScoreBadge";
import { RecommendationsList } from "@/components/campaigns/RecommendationsList";
import { AutomationRulesList } from "@/components/campaigns/AutomationRulesList";
import { ExperimentsList } from "@/components/campaigns/ExperimentsList";
import { AiCopilotPanel } from "@/components/campaigns/AiCopilotPanel";

const CampaignDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns();
  const campaign = campaigns.find(c => c.id === id);
  
  const { data: kpis, isLoading: kpisLoading } = useCampaignKpis(id || '');
  const { data: health } = useCampaignHealthScore(id || '');
  const { data: recommendations = [], isLoading: recsLoading } = useRecommendations(id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const updateCampaignStatus = async (newStatus: string) => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: "Campaign Updated",
        description: `Campaign status changed to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign status",
        variant: "destructive",
      });
    }
  };

  if (authLoading || campaignsLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!campaign) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Campaign Not Found</h2>
          <p className="text-muted-foreground mb-4">The campaign you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </AppLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'paused':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Paused</Badge>;
      case 'archived':
        return <Badge className="bg-muted text-muted-foreground">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{campaign.name}</h1>
                {getStatusBadge(campaign.status)}
                {health && (
                  <HealthScoreBadge 
                    score={health.score} 
                    label={health.label} 
                    reason={health.reason}
                    showScore 
                  />
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {campaign.offers?.name || 'Unknown Offer'} • {campaign.offers?.network || 'Unknown Network'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status === 'active' ? (
              <Button 
                variant="outline" 
                onClick={() => updateCampaignStatus('paused')}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => updateCampaignStatus('active')}
              >
                <Play className="h-4 w-4 mr-2" />
                Activate
              </Button>
            )}
            {campaign.offers?.offer_url && (
              <Button variant="outline" asChild>
                <a href={campaign.offers.offer_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Offer
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Summary KPIs */}
        <CampaignSummaryCards kpis={kpis} isLoading={kpisLoading} />

        {/* Main Content with AI Copilot Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="performance" className="space-y-4">
              <TabsList>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="recommendations">
                  AI Recommendations
                  {recommendations.filter(r => r.status === 'new').length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {recommendations.filter(r => r.status === 'new').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="automation">Automation</TabsTrigger>
                <TabsTrigger value="experiments">Experiments</TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="space-y-6">
                <PerformanceCharts campaignId={id!} />
                <BreakdownTables campaignId={id!} />
              </TabsContent>

              <TabsContent value="recommendations">
                <RecommendationsList 
                  recommendations={recommendations} 
                  campaignId={id}
                  isLoading={recsLoading}
                />
              </TabsContent>

              <TabsContent value="automation">
                <AutomationRulesList campaignId={id!} />
              </TabsContent>

              <TabsContent value="experiments">
                <ExperimentsList campaignId={id!} />
              </TabsContent>
            </Tabs>
          </div>

          {/* AI Copilot Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <AiCopilotPanel 
                campaignId={id!} 
                campaignName={campaign.name}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CampaignDetailPage;
