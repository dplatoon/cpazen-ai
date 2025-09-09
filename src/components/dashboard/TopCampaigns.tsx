import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play, Pause, Square } from "lucide-react";
import { useTopCampaigns } from "@/hooks/useRealData";
import { cn } from "@/lib/utils";
import { DashboardFiltersState } from "./DashboardFilters";

interface TopCampaignsProps {
  filters?: DashboardFiltersState;
}

export const TopCampaigns = ({ filters }: TopCampaignsProps) => {
  const { data: campaigns, isLoading } = useTopCampaigns();

  if (isLoading) {
    return (
      <Card className="bg-gradient-card border-card-border">
        <div className="p-6 border-b border-card-border">
          <h3 className="text-lg font-semibold text-foreground">Top Campaigns</h3>
          <p className="text-sm text-foreground-muted">Best performing campaigns this week</p>
        </div>
        <div className="p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 animate-pulse">
              <div className="h-4 bg-card-hover/50 rounded w-32"></div>
              <div className="h-4 bg-card-hover/50 rounded w-16"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const topCampaigns = campaigns || [];
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

  return (
    <Card className="bg-gradient-card border-card-border">
      <div className="p-6 border-b border-card-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Top Campaigns</h3>
            <p className="text-sm text-foreground-muted">Your best performing campaigns</p>
          </div>
          <Button variant="outline" size="sm">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border">
              <th className="text-left p-4 text-sm font-medium text-foreground-muted">Campaign</th>
              <th className="text-left p-4 text-sm font-medium text-foreground-muted">Network</th>
              <th className="text-right p-4 text-sm font-medium text-foreground-muted">Clicks</th>
              <th className="text-right p-4 text-sm font-medium text-foreground-muted">Conv.</th>
              <th className="text-right p-4 text-sm font-medium text-foreground-muted">Revenue</th>
              <th className="text-right p-4 text-sm font-medium text-foreground-muted">CR%</th>
              <th className="text-right p-4 text-sm font-medium text-foreground-muted">EPC</th>
              <th className="text-center p-4 text-sm font-medium text-foreground-muted">Status</th>
              <th className="text-center p-4 text-sm font-medium text-foreground-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topCampaigns.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center">
                  <p className="text-foreground-muted">No campaign data yet. Create your first campaign to see performance metrics here.</p>
                </td>
              </tr>
            ) : (
              topCampaigns.map((campaign: any) => (
                <tr key={campaign.id} className="border-b border-card-border/50 hover:bg-card-hover/50 transition-colors">
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-foreground">{campaign.name}</div>
                      <div className="text-sm text-foreground-muted">{campaign.offer}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="border-card-border">
                      {campaign.network}
                    </Badge>
                  </td>
                  <td className="p-4 text-right font-medium text-foreground">
                    {(campaign.clicks || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-medium text-foreground">
                    {campaign.conversions || 0}
                  </td>
                  <td className="p-4 text-right font-medium text-success">
                    ${(campaign.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right font-medium text-foreground">
                    {campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) : '0.00'}%
                  </td>
                  <td className="p-4 text-right font-medium text-foreground">
                    ${campaign.clicks > 0 ? (campaign.revenue / campaign.clicks).toFixed(2) : '0.00'}
                  </td>
                  <td className="p-4 text-center">
                    {getStatusBadge('active')}
                  </td>
                  <td className="p-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-success hover:bg-success/10"
                    >
                      {getStatusIcon('active')}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};