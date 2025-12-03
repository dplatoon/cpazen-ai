import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Lightbulb, 
  ChevronDown, 
  Check, 
  Clock, 
  X, 
  TrendingUp, 
  TrendingDown,
  Pause,
  ArrowUp,
  ArrowDown,
  Globe,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { useState } from "react";
import { Recommendation, useUpdateRecommendation, useGenerateRecommendations } from "@/hooks/useRecommendations";
import { cn } from "@/lib/utils";

interface RecommendationsListProps {
  recommendations: Recommendation[];
  campaignId?: string;
  isLoading?: boolean;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  pause_source: { icon: Pause, color: 'text-warning' },
  raise_bid: { icon: ArrowUp, color: 'text-success' },
  lower_bid: { icon: ArrowDown, color: 'text-destructive' },
  expand_geo: { icon: Globe, color: 'text-primary' },
  narrow_geo: { icon: Globe, color: 'text-warning' },
  adjust_cap: { icon: TrendingUp, color: 'text-success' },
  test_creative: { icon: Sparkles, color: 'text-primary' },
  pause_campaign: { icon: Pause, color: 'text-destructive' },
  scale_campaign: { icon: TrendingUp, color: 'text-success' },
};

function getConfidenceLabel(score: number): { label: string; color: string } {
  if (score >= 0.7) return { label: 'High', color: 'text-success' };
  if (score >= 0.4) return { label: 'Medium', color: 'text-warning' };
  return { label: 'Low', color: 'text-muted-foreground' };
}

export function RecommendationsList({ recommendations, campaignId, isLoading }: RecommendationsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const updateRecommendation = useUpdateRecommendation();
  const generateRecommendations = useGenerateRecommendations(campaignId || '');

  const activeRecommendations = recommendations.filter(r => r.status === 'new');
  const appliedRecommendations = recommendations.filter(r => r.status !== 'new');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Recommendations</CardTitle>
            {activeRecommendations.length > 0 && (
              <Badge variant="secondary">{activeRecommendations.length}</Badge>
            )}
          </div>
          {campaignId && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => generateRecommendations.mutate()}
              disabled={generateRecommendations.isPending}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", generateRecommendations.isPending && "animate-spin")} />
              Generate
            </Button>
          )}
        </div>
        <CardDescription>
          AI-powered suggestions to improve campaign performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeRecommendations.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No new recommendations</p>
            <p className="text-sm">Check back later or generate new ones</p>
          </div>
        ) : (
          activeRecommendations.map((rec) => {
            const config = TYPE_CONFIG[rec.type] || { icon: Lightbulb, color: 'text-primary' };
            const Icon = config.icon;
            const confidence = getConfidenceLabel(rec.confidence_score);
            const impact = rec.expected_impact;

            return (
              <Collapsible
                key={rec.id}
                open={expandedId === rec.id}
                onOpenChange={(open) => setExpandedId(open ? rec.id : null)}
              >
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg bg-muted", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{rec.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("ml-2 shrink-0", confidence.color)}>
                      {confidence.label}
                    </Badge>
                  </div>

                  {/* Impact Summary */}
                  {(impact.cpaDelta || impact.roasDelta || impact.revenueDelta) && (
                    <div className="flex gap-4 text-sm">
                      {impact.cpaDelta && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">CPA:</span>
                          <span className={impact.cpaDelta < 0 ? 'text-success' : 'text-destructive'}>
                            {impact.cpaDelta > 0 ? '+' : ''}{impact.cpaDelta}%
                          </span>
                        </div>
                      )}
                      {impact.roasDelta && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">ROAS:</span>
                          <span className={impact.roasDelta > 0 ? 'text-success' : 'text-destructive'}>
                            {impact.roasDelta > 0 ? '+' : ''}{impact.roasDelta}%
                          </span>
                        </div>
                      )}
                      {impact.revenueDelta && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Revenue:</span>
                          <span className={impact.revenueDelta > 0 ? 'text-success' : 'text-destructive'}>
                            {impact.revenueDelta > 0 ? '+' : ''}{impact.revenueDelta}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full">
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        expandedId === rec.id && "rotate-180"
                      )} />
                      <span className="ml-2">Why this?</span>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="pt-2 border-t text-sm text-muted-foreground">
                      <p>This recommendation is based on your campaign's performance data. 
                         Confidence: {(rec.confidence_score * 100).toFixed(0)}%</p>
                    </div>
                  </CollapsibleContent>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => updateRecommendation.mutate({ id: rec.id, status: 'applied' })}
                      disabled={updateRecommendation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Apply
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateRecommendation.mutate({ id: rec.id, status: 'scheduled' })}
                      disabled={updateRecommendation.isPending}
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => updateRecommendation.mutate({ id: rec.id, status: 'dismissed' })}
                      disabled={updateRecommendation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Collapsible>
            );
          })
        )}

        {/* Applied/Dismissed History */}
        {appliedRecommendations.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                <ChevronDown className="h-4 w-4 mr-2" />
                {appliedRecommendations.length} previous recommendations
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {appliedRecommendations.slice(0, 5).map((rec) => (
                <div key={rec.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                  <span className="text-muted-foreground">{rec.title}</span>
                  <Badge variant={rec.status === 'applied' ? 'default' : 'secondary'}>
                    {rec.status}
                  </Badge>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
