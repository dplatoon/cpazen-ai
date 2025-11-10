import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, AlertTriangle, Activity, TrendingUp, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalCampaigns}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalClicks.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">${stats?.totalRevenue.toFixed(2)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="fraud">
            Fraud Alerts
            {stats && stats.pendingAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pendingAlerts}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>Latest registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers?.map((user) => (
                  <div key={user.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge>
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pending Fraud Alerts
              </CardTitle>
              <CardDescription>Review and manage suspicious activities</CardDescription>
            </CardHeader>
            <CardContent>
              {!fraudAlerts || fraudAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
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
                            <span className="text-sm text-muted-foreground">
                              {alert.alert_type}
                            </span>
                          </div>
                          <p className="mt-2">{alert.description}</p>
                          {alert.campaigns && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Campaign: {alert.campaigns.name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
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