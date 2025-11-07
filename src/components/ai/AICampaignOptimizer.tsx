import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, TrendingUp, Target, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCampaigns } from '@/hooks/useRealData';

interface Recommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
  steps: string[];
}

export const AICampaignOptimizer = () => {
  const { toast } = useToast();
  const { data: campaigns } = useCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [campaignMetrics, setCampaignMetrics] = useState<any>(null);

  const handleOptimize = async () => {
    if (!selectedCampaign) {
      toast({
        title: 'Select a campaign',
        description: 'Please choose a campaign to optimize',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-campaign-optimizer', {
        body: { campaignId: selectedCampaign }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive'
        });
        return;
      }

      setRecommendations(data.recommendations || []);
      setCampaignMetrics(data.campaignData);
      
      toast({
        title: 'Analysis Complete',
        description: `Generated ${data.recommendations?.length || 0} optimization recommendations`
      });
    } catch (error: any) {
      console.error('Optimization error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to analyze campaign',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-teal" />
            AI Campaign Optimizer
          </CardTitle>
          <CardDescription>
            Get AI-powered recommendations to improve your campaign performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a campaign to optimize" />
              </SelectTrigger>
              <SelectContent>
                {campaigns?.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleOptimize} disabled={loading || !selectedCampaign}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Optimize
                </>
              )}
            </Button>
          </div>

          {campaignMetrics && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">{campaignMetrics.name}</CardTitle>
                <CardDescription>Last 7 days performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Clicks</p>
                    <p className="text-2xl font-bold">{campaignMetrics.metrics.clicks}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-bold">{campaignMetrics.metrics.conversions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CR</p>
                    <p className="text-2xl font-bold">{campaignMetrics.metrics.conversionRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">
                      {campaignMetrics.metrics.currency} {campaignMetrics.metrics.revenue}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Optimization Recommendations</h3>
          {recommendations.map((rec, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {rec.priority === 1 && <Zap className="h-4 w-4 text-yellow-500" />}
                      {rec.priority === 2 && <TrendingUp className="h-4 w-4 text-blue-500" />}
                      {rec.priority === 3 && <Target className="h-4 w-4 text-gray-500" />}
                      {rec.title}
                    </CardTitle>
                    <CardDescription className="mt-1">{rec.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getImpactColor(rec.impact)}>
                      {rec.impact} impact
                    </Badge>
                    <Badge variant="outline">Priority {rec.priority}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Implementation Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    {rec.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
