import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play, Pause, Square } from "lucide-react";
import { mockCampaigns } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export const TopCampaigns = () => {
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
            {mockCampaigns.map((campaign) => (
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
                  {campaign.clicks.toLocaleString()}
                </td>
                <td className="p-4 text-right font-medium text-foreground">
                  {campaign.conversions}
                </td>
                <td className="p-4 text-right font-medium text-success">
                  ${campaign.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-right font-medium text-foreground">
                  {campaign.conversionRate.toFixed(2)}%
                </td>
                <td className="p-4 text-right font-medium text-foreground">
                  ${campaign.epc.toFixed(2)}
                </td>
                <td className="p-4 text-center">
                  {getStatusBadge(campaign.status)}
                </td>
                <td className="p-4 text-center">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};