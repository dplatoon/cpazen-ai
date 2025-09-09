import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, ExternalLink, Copy, Play, Pause, Square } from "lucide-react";
import { mockCampaigns } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export const CampaignManager = () => {
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

  const generateTrackingLink = (campaignId: string) => {
    return `https://cpazen.com/c/${campaignId}?sub={sub_id}`;
  };

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
        <Button className="bg-gradient-brand hover:opacity-90 transition-opacity">
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
              {mockCampaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-card-border/50 hover:bg-card-hover/50 transition-colors">
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{campaign.name}</div>
                      <div className="text-sm text-foreground-muted">{campaign.offer}</div>
                      <Badge variant="outline" className="border-card-border text-xs">
                        {campaign.network}
                      </Badge>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-background-secondary px-2 py-1 rounded border border-card-border text-brand-teal max-w-xs truncate">
                        {generateTrackingLink(campaign.id)}
                      </code>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="text-right space-y-1">
                      <div className="flex justify-end space-x-4 text-sm">
                        <span className="text-foreground-muted">
                          {campaign.clicks.toLocaleString()} clicks
                        </span>
                        <span className="text-foreground-muted">
                          {campaign.conversions} conv
                        </span>
                      </div>
                      <div className="flex justify-end space-x-4 text-sm">
                        <span className="text-success font-medium">
                          ${campaign.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-foreground">
                          {campaign.conversionRate.toFixed(2)}% CR
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
                        className={cn(
                          "h-8 w-8 p-0",
                          campaign.status === 'active' ? "text-warning hover:bg-warning/10" : "text-success hover:bg-success/10"
                        )}
                      >
                        {getStatusIcon(campaign.status)}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-foreground-muted hover:text-foreground">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};