import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'conversion' | 'click' | 'campaign' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  value?: number;
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'conversion',
    title: 'New Conversion',
    description: 'Dating SOI - US Tier1',
    timestamp: '2 minutes ago',
    value: 48.00
  },
  {
    id: '2',
    type: 'alert',
    title: 'High Click Volume',
    description: 'Crypto Trading campaign spike detected',
    timestamp: '5 minutes ago'
  },
  {
    id: '3',
    type: 'conversion',
    title: 'New Conversion',
    description: 'Health Supplements - Global',
    timestamp: '8 minutes ago',
    value: 47.94
  },
  {
    id: '4',
    type: 'campaign',
    title: 'Campaign Paused',
    description: 'Gaming CPI - Mobile auto-paused',
    timestamp: '12 minutes ago'
  },
  {
    id: '5',
    type: 'conversion',
    title: 'New Conversion',
    description: 'Dating SOI - US Tier1',
    timestamp: '15 minutes ago',
    value: 48.00
  },
  {
    id: '6',
    type: 'click',
    title: 'Traffic Peak',
    description: '1000+ clicks in last hour',
    timestamp: '18 minutes ago'
  }
];

export const RecentActivity = () => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'conversion':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'click':
        return <TrendingUp className="h-4 w-4 text-brand-teal" />;
      case 'campaign':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'alert':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-foreground-muted" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'conversion':
        return <Badge className="bg-success/10 text-success border-success/20">Conversion</Badge>;
      case 'click':
        return <Badge className="bg-brand-teal/10 text-brand-teal border-brand-teal/20">Traffic</Badge>;
      case 'campaign':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Campaign</Badge>;
      case 'alert':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Alert</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <Card className="bg-gradient-card border-card-border">
      <div className="p-6 border-b border-card-border">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <p className="text-sm text-foreground-muted">Latest updates from your campaigns</p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-1">
          {mockActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-4 hover:bg-card-hover/50 transition-colors border-b border-card-border/50 last:border-b-0"
            >
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </p>
                  {activity.value && (
                    <span className="text-sm font-medium text-success">
                      +${activity.value.toFixed(2)}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-foreground-muted truncate mb-2">
                  {activity.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground-subtle">
                    {activity.timestamp}
                  </span>
                  {getActivityBadge(activity.type)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};