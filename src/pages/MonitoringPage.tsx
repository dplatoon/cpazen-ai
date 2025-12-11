import { ModernLayout } from '@/components/layout/ModernLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  AlertTriangle, 
  Bell,
  CheckCircle2, 
  Clock, 
  Database, 
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  TrendingUp,
  Webhook,
  Zap,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EdgeFunctionHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'error';
  statusCode: number;
  responseTime: number;
  lastChecked: string;
  error?: string;
}

interface Alert {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
}

interface HighFraudClick {
  id: string;
  campaign_id: string;
  fraud_score: number;
  ip_address: string;
  country: string;
  created_at: string;
}

interface FailedWebhook {
  id: string;
  webhook_id: string;
  event_type: string;
  response_status: number | null;
  delivered_at: string;
  response_body: string | null;
}

interface FraudAlert {
  id: string;
  alert_type: string;
  severity: string;
  description: string;
  created_at: string;
  campaign_id: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  healthScore: string;
  timestamp: string;
  alerts: Alert[];
  edgeFunctions: EdgeFunctionHealth[];
  database: {
    status: string;
    responseTime: number;
    tables: {
      clicks: number;
      conversions: number;
      campaigns: number;
    };
  };
  errorRates: {
    period: string;
    totalClicks: number;
    botClicks: number;
    botRate: string;
  };
  highFraudClicks: {
    count: number;
    recentClicks: HighFraudClick[];
    threshold: number;
    period: string;
  };
  failedPostbacks: {
    failedCount: number;
    recentFailures: FailedWebhook[];
    totalConversions: number;
    period: string;
  };
  fraudAlerts: {
    totalPending: number;
    highSeverity: number;
    mediumSeverity: number;
    recentAlerts: FraudAlert[];
  };
  summary: {
    totalFunctions: number;
    healthyFunctions: number;
    avgResponseTime: number;
    totalAlerts: number;
    highSeverityAlerts: number;
    mediumSeverityAlerts: number;
  };
}

export default function MonitoringPage() {
  const { data: health, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealth> => {
      const { data, error } = await supabase.functions.invoke('system-health');

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  const handleRefresh = () => {
    refetch();
    toast.info('Refreshing system health...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800';
      case 'unhealthy':
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'unhealthy':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'edge_function_error':
        return <Server className="h-4 w-4" />;
      case 'high_fraud_score':
        return <ShieldAlert className="h-4 w-4" />;
      case 'failed_postback':
        return <Webhook className="h-4 w-4" />;
      case 'pending_fraud_alert':
        return <Shield className="h-4 w-4" />;
      case 'high_bot_rate':
        return <Zap className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Monitoring</h1>
            <p className="text-muted-foreground mt-2">
              Real-time health, alerts, and performance metrics
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={isRefetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Overall Status */}
        <Card className={getStatusColor(health?.status || 'error')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(health?.status || 'error')}
                <div>
                  <h3 className="text-2xl font-bold">System Status: {health?.status?.toUpperCase()}</h3>
                  <p className="text-sm">
                    Health Score: {health?.healthScore}% | Last checked: {health?.timestamp ? format(new Date(health.timestamp), 'PPp') : 'N/A'}
                  </p>
                </div>
              </div>
              {(health?.summary.totalAlerts || 0) > 0 && (
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <span className="font-semibold">{health?.summary.totalAlerts} Active Alerts</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alert Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Edge Functions</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {health?.summary.healthyFunctions}/{health?.summary.totalFunctions}
              </div>
              <p className="text-xs text-muted-foreground">Healthy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Failed Postbacks</CardTitle>
              <Webhook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(health?.failedPostbacks.failedCount || 0) > 0 ? 'text-red-600' : ''}`}>
                {health?.failedPostbacks.failedCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">Last 24h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">High Fraud Clicks</CardTitle>
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(health?.highFraudClicks.count || 0) >= 10 ? 'text-red-600' : ''}`}>
                {health?.highFraudClicks.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">Score ≥70</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fraud Alerts</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(health?.fraudAlerts.highSeverity || 0) > 0 ? 'text-red-600' : ''}`}>
                {health?.fraudAlerts.totalPending || 0}
              </div>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bot Rate</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${parseFloat(health?.errorRates.botRate || '0') >= 20 ? 'text-red-600' : ''}`}>
                {health?.errorRates.botRate}%
              </div>
              <p className="text-xs text-muted-foreground">Last 24h</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        {(health?.alerts?.length || 0) > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-destructive" />
                <CardTitle>Active Alerts</CardTitle>
              </div>
              <CardDescription>Issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {health?.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start justify-between p-4 border rounded-lg ${
                      alert.severity === 'high' ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : 
                      alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20' : 
                      'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${alert.severity === 'high' ? 'text-red-600' : alert.severity === 'medium' ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(alert.timestamp), 'PPp')}
                        </p>
                      </div>
                    </div>
                    {getSeverityBadge(alert.severity)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Tabs */}
        <Tabs defaultValue="functions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="functions">Edge Functions</TabsTrigger>
            <TabsTrigger value="postbacks">Failed Postbacks</TabsTrigger>
            <TabsTrigger value="fraud">High Fraud Clicks</TabsTrigger>
            <TabsTrigger value="alerts">Fraud Alerts</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          <TabsContent value="functions">
            <Card>
              <CardHeader>
                <CardTitle>Edge Functions Health</CardTitle>
                <CardDescription>Status and performance of all backend functions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {health?.edgeFunctions.map((func) => (
                    <div
                      key={func.name}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(func.status)}
                        <div>
                          <p className="font-medium">{func.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Status Code: {func.statusCode} | Response: {func.responseTime}ms
                          </p>
                          {func.error && (
                            <p className="text-sm text-red-600 mt-1">{func.error}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={func.status === 'healthy' ? 'default' : 'destructive'}>
                        {func.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="postbacks">
            <Card>
              <CardHeader>
                <CardTitle>Failed Webhook Deliveries</CardTitle>
                <CardDescription>
                  {health?.failedPostbacks.failedCount || 0} failures out of {health?.failedPostbacks.totalConversions || 0} conversions in the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(health?.failedPostbacks.recentFailures?.length || 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                    <p>No failed postbacks in the last 24 hours</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {health?.failedPostbacks.recentFailures.map((failure) => (
                      <div
                        key={failure.id}
                        className="flex items-center justify-between p-4 border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">Event: {failure.event_type}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: {failure.response_status || 'No response'} | {format(new Date(failure.delivered_at), 'PPp')}
                          </p>
                          {failure.response_body && (
                            <p className="text-xs text-red-600 mt-1 truncate max-w-md">
                              {failure.response_body.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                        <Badge variant="destructive">Failed</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fraud">
            <Card>
              <CardHeader>
                <CardTitle>High Fraud Score Clicks</CardTitle>
                <CardDescription>
                  Clicks with fraud score ≥{health?.highFraudClicks.threshold || 70} in the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(health?.highFraudClicks.recentClicks?.length || 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 text-green-600" />
                    <p>No high fraud score clicks detected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {health?.highFraudClicks.recentClicks.map((click) => (
                      <div
                        key={click.id}
                        className="flex items-center justify-between p-4 border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">IP: {click.ip_address || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            Country: {click.country || 'Unknown'} | {format(new Date(click.created_at), 'PPp')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">Score: {click.fraud_score}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Pending Fraud Alerts</CardTitle>
                <CardDescription>
                  {health?.fraudAlerts.totalPending || 0} alerts pending review ({health?.fraudAlerts.highSeverity || 0} high severity)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(health?.fraudAlerts.recentAlerts?.length || 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                    <p>No pending fraud alerts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {health?.fraudAlerts.recentAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          alert.severity === 'high' ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : 
                          'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20'
                        }`}
                      >
                        <div>
                          <p className="font-medium">{alert.alert_type}</p>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(alert.created_at), 'PPp')}
                          </p>
                        </div>
                        {getSeverityBadge(alert.severity)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Database Metrics</CardTitle>
                <CardDescription>Current database status and table sizes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Response Time</p>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-2">{health?.database.responseTime}ms</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Clicks</p>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {health?.database.tables.clicks.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Conversions</p>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {health?.database.tables.conversions.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Campaigns</p>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {health?.database.tables.campaigns.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernLayout>
  );
}
