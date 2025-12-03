import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, ExternalLink, Copy, Play, Pause, Square, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCampaigns } from "@/hooks/useRealData";
import { useCampaignMetrics } from "@/hooks/useCampaignMetrics";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTrackingDomain } from "@/hooks/useTrackingDomain";
import { CreateCampaignDialog } from "./CreateCampaignDialog";

export const CampaignManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: campaignMetrics = {} } = useCampaignMetrics();
  const { generateTrackingUrl } = useTrackingDomain();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

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
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'paused':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Paused</Badge>;
      case 'stopped':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Stopped</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'stopped':
        return <Square className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  // Use the hook's generateTrackingUrl method

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Tracking link copied to clipboard",
    });
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.offers?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaign Manager</h1>
          <p className="text-foreground-muted mt-2">
            Create, manage, and optimize your CPA campaigns
          </p>
        </div>
        <Button 
          className="bg-gradient-brand hover:opacity-90 transition-opacity"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gradient-card border-card-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              placeholder="Search campaigns..."
              className="pl-10 bg-background-secondary border-card-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-card-border">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </Card>

      {/* Campaigns Table */}
      <Card className="bg-gradient-card border-card-border">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading campaigns...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">
                {campaigns.length === 0 
                  ? "Create your first campaign to start tracking clicks and conversions"
                  : "No campaigns match your search criteria"
                }
              </p>
              {campaigns.length === 0 && (
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-brand hover:opacity-90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Campaign
                </Button>
              )}
            </div>
          ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left p-4 text-sm font-medium text-foreground-muted">Campaign Details</th>
                <th className="text-left p-4 text-sm font-medium text-foreground-muted">Tracking Link</th>
                <th className="text-right p-4 text-sm font-medium text-foreground-muted">Performance</th>
                <th className="text-center p-4 text-sm font-medium text-foreground-muted">Status</th>
                <th className="text-center p-4 text-sm font-medium text-foreground-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-card-border/50 hover:bg-card-hover/50 transition-colors">
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{campaign.name}</div>
                      <div className="text-sm text-foreground-muted">{campaign.offers?.name || 'Unknown Offer'}</div>
                      <Badge variant="outline" className="border-card-border text-xs">
                        {campaign.offers?.network || 'Unknown Network'}
                      </Badge>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-background-secondary px-2 py-1 rounded border border-card-border text-brand-teal max-w-xs truncate">
                        {generateTrackingUrl(campaign.id)}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(generateTrackingUrl(campaign.id))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="text-right space-y-1">
                      <div className="flex justify-end space-x-4 text-sm">
                        <span className="text-foreground-muted">
                          {campaignMetrics[campaign.id]?.clicks.toLocaleString() || 0} clicks
                        </span>
                        <span className="text-foreground-muted">
                          {campaignMetrics[campaign.id]?.conversions || 0} conv
                        </span>
                      </div>
                      <div className="flex justify-end space-x-4 text-sm">
                        <span className="text-success font-medium">
                          ${(campaignMetrics[campaign.id]?.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-foreground">
                          {(campaignMetrics[campaign.id]?.conversionRate || 0).toFixed(2)}% CR
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4 text-center">
                    {getStatusBadge(campaign.status)}
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                        onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0",
                          campaign.status === 'active' ? "text-warning hover:bg-warning/10" : "text-success hover:bg-success/10"
                        )}
                        onClick={() => updateCampaignStatus(
                          campaign.id, 
                          campaign.status === 'active' ? 'paused' : 'active'
                        )}
                      >
                        {getStatusIcon(campaign.status)}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-foreground-muted hover:text-foreground"
                        asChild
                      >
                        <a
                          href={campaign.offers?.offer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </Card>

      <CreateCampaignDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
};