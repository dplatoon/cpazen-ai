import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardFiltersState } from "./DashboardFilters";

interface ActivityItem {
  id: string;
  type: 'conversion' | 'click' | 'campaign' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  value?: number;
}

interface RecentActivityProps {
  filters?: DashboardFiltersState;
}

const mockActivity: ActivityItem[] = [];

export const RecentActivity = ({ filters }: RecentActivityProps) => {
  const { user } = useAuth();

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['recentActivity', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get recent clicks and conversions
      const { data: recentClicks } = await supabase
        .from('clicks')
        .select(`
          *,
          campaigns!inner (
            name,
            user_id,
            offers (
              name,
              network
            )
          ),
          conversions (
            payout,
            status,
            created_at
          )
        `)
        .eq('campaigns.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const activities: ActivityItem[] = [];

      recentClicks?.forEach(click => {
        // Add conversion activities
        const conversion = click.conversions && click.conversions.length > 0 ? click.conversions[0] : null;
        if (conversion && conversion.payout) {
          activities.push({
            id: `conv-${click.id}`,
            type: 'conversion',
            title: 'New Conversion',
            description: `${click.campaigns.name} - ${click.campaigns.offers?.name || 'Unknown Offer'}`,
            timestamp: formatRelativeTime(conversion.created_at || click.created_at),
            value: conversion.payout
          });
        }

        // Add high-value click activities (every 10th click to avoid spam)
        if (parseInt(click.id.slice(-1), 16) % 10 === 0) {
          activities.push({
            id: `click-${click.id}`,
            type: 'click',
            title: 'Quality Click',
            description: `${click.campaigns.name} - ${click.os} ${click.browser}`,
            timestamp: formatRelativeTime(click.created_at)
          });
        }
      });

      // Sort by timestamp and take most recent
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };
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
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Start driving traffic to see updates here</p>
            </div>
          ) : (
            recentActivity.map((activity) => (
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
            ))
          )}
        </div>
      </div>
    </Card>
  );
};