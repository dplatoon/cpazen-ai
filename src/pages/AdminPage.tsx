import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, AlertTriangle, Activity, TrendingUp, DollarSign, Package, UserCog, FileText, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminOfferManager } from '@/components/admin/AdminOfferManager';
import { UserManagement } from '@/components/admin/UserManagement';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { AdminWorkflowGuide } from '@/components/admin/AdminWorkflowGuide';
import { AdminPaymentManager } from '@/components/admin/AdminPaymentManager';

export default function AdminPage() {
  const navigate = useNavigate();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && userRole !== 'admin') {
      navigate('/');
    }
  }, [userRole, roleLoading, navigate]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, campaignsRes, clicksRes, conversionsRes, alertsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }),
        supabase.from('clicks').select('id', { count: 'exact', head: true }),
        supabase.from('conversions').select('payout', { count: 'exact' }),
        supabase.from('fraud_alerts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const totalRevenue = conversionsRes.data?.reduce((sum, conv) => sum + Number(conv.payout), 0) || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalCampaigns: campaignsRes.count || 0,
        totalClicks: clicksRes.count || 0,
        totalConversions: conversionsRes.count || 0,
        totalRevenue,
        pendingAlerts: alertsRes.count || 0,
      };
    },
    enabled: userRole === 'admin',
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['recent-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .maybeSingle();
          
          return {
            ...profile,
            role: roleData?.role || 'affiliate'
          };
        })
      );

      return usersWithRoles;
    },
    enabled: userRole === 'admin',
  });

  const { data: fraudAlerts } = useQuery({
    queryKey: ['fraud-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .select('*, campaigns(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: userRole === 'admin',
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // Fetch campaigns with user info
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, name, created_at, status, user_id')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch clicks with campaign and user info
      const { data: clicks } = await supabase
        .from('clicks')
        .select('id, created_at, country, user_id, campaign_id')
        .order('created_at', { ascending: false })
        .limit(15);

      // Fetch conversions with campaign and user info
      const { data: conversions } = await supabase
        .from('conversions')
        .select('id, created_at, payout, status, user_id, campaign_id')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get all unique user IDs
      const userIds = new Set([
        ...(campaigns || []).map((c) => c.user_id),
        ...(clicks || []).map((c) => c.user_id),
        ...(conversions || []).map((c) => c.user_id),
      ]);

      // Get all unique campaign IDs
      const campaignIds = new Set([
        ...(clicks || []).map((c) => c.campaign_id),
        ...(conversions || []).map((c) => c.campaign_id),
      ]);

      // Fetch user emails
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', Array.from(userIds));

      // Fetch campaign names
      const { data: campaignNames } = await supabase
        .from('campaigns')
        .select('id, name')
        .in('id', Array.from(campaignIds));

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.email]));
      const campaignMap = new Map(campaignNames?.map((c) => [c.id, c.name]));

      const activities = [
        ...(campaigns || []).map((c) => ({
          type: 'campaign' as const,
          id: c.id,
          timestamp: c.created_at,
          description: `Campaign "${c.name}" created`,
          user: profileMap.get(c.user_id) || 'Unknown',
          status: c.status,
        })),
        ...(clicks || []).map((c) => ({
          type: 'click' as const,
          id: c.id,
          timestamp: c.created_at,
          description: `Click from ${c.country || 'Unknown'}`,
          campaign: campaignMap.get(c.campaign_id) || 'Unknown Campaign',
          user: profileMap.get(c.user_id) || 'Unknown',
        })),
        ...(conversions || []).map((c) => ({
          type: 'conversion' as const,
          id: c.id,
          timestamp: c.created_at,
          description: `Conversion $${Number(c.payout).toFixed(2)}`,
          campaign: campaignMap.get(c.campaign_id) || 'Unknown Campaign',
          user: profileMap.get(c.user_id) || 'Unknown',
          status: c.status,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return activities.slice(0, 20);
    },
    enabled: userRole === 'admin',
  });

  if (roleLoading || !userRole) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-brand-teal/10">
          <Shield className="h-6 w-6 text-brand-teal" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-foreground-muted">Network management & monitoring</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="bg-card border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground-muted">Total Users</CardTitle>
            <Users className="h-4 w-4 text-brand-teal" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalCampaigns}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalClicks.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalConversions.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">${stats?.totalRevenue.toFixed(2)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CR</CardTitle>
            <TrendingUp className="h-4 w-4 text-foreground-muted" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalClicks ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(2) : '0'}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="guide" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="guide">
            <BookOpen className="mr-2 h-4 w-4" />
            Guide
          </TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="audit-logs">
            <FileText className="mr-2 h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="offers">
            <Package className="mr-2 h-4 w-4" />
            Offers
          </TabsTrigger>
          <TabsTrigger value="user-management">
            <UserCog className="mr-2 h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="payments">
            <DollarSign className="mr-2 h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="fraud">
            Fraud Alerts
            {stats && stats.pendingAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pendingAlerts}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-4">
          <AdminWorkflowGuide />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle>System-Wide Activity</CardTitle>
              <CardDescription>Recent activity across all user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {!recentActivity || recentActivity.length === 0 ? (
                <div className="text-center py-8 text-foreground-muted">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      className="flex items-start justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              activity.type === 'conversion'
                                ? 'default'
                                : activity.type === 'campaign'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {activity.type}
                          </Badge>
                          {'status' in activity && activity.status && (
                            <Badge variant="outline" className="text-xs">
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{activity.description}</p>
                        {'campaign' in activity && (
                          <p className="text-sm text-foreground-muted">
                            Campaign: {activity.campaign}
                          </p>
                        )}
                        <p className="text-xs text-foreground-muted mt-1">
                          User: {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-logs" className="space-y-4">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <AdminOfferManager />
        </TabsContent>

        <TabsContent value="user-management" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <AdminPaymentManager />
        </TabsContent>

        <TabsContent value="fraud" className="space-y-4">
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pending Fraud Alerts
              </CardTitle>
              <CardDescription>Review and manage suspicious activities</CardDescription>
            </CardHeader>
            <CardContent>
              {!fraudAlerts || fraudAlerts.length === 0 ? (
                <div className="text-center py-8 text-foreground-muted">
                  No pending fraud alerts
                </div>
              ) : (
                <div className="space-y-4">
                  {fraudAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                alert.severity === 'high'
                                  ? 'destructive'
                                  : alert.severity === 'medium'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {alert.severity}
                            </Badge>
                            <span className="text-sm text-foreground-muted">
                              {alert.alert_type}
                            </span>
                          </div>
                          <p className="mt-2">{alert.description}</p>
                          {alert.campaigns && (
                            <p className="text-sm text-foreground-muted mt-1">
                              Campaign: {alert.campaigns.name}
                            </p>
                          )}
                          <p className="text-xs text-foreground-muted mt-1">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}