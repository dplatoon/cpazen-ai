import { ModernLayout } from '@/components/layout/ModernLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database, 
  RefreshCw,
  Server,
  TrendingUp,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface EdgeFunctionHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'error';
  statusCode: number;
  responseTime: number;
  lastChecked: string;
  error?: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  healthScore: string;
  timestamp: string;
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
  summary: {
    totalFunctions: number;
    healthyFunctions: number;
    avgResponseTime: number;
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
    refetchInterval: 60000, // Refresh every minute
  });

  const handleRefresh = () => {
    refetch();
    toast.info('Refreshing system health...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy':
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
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
            <p className="text-foreground-muted mt-2">
              Real-time health and performance metrics
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
                    Health Score: {health?.healthScore}% | Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Edge Functions</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {health?.summary.healthyFunctions}/{health?.summary.totalFunctions}
              </div>
              <p className="text-xs text-muted-foreground">Healthy functions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health?.summary.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">Across all functions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health?.database.responseTime}ms</div>
              <p className="text-xs text-muted-foreground">Query response time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bot Rate (24h)</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health?.errorRates.botRate}%</div>
              <p className="text-xs text-muted-foreground">
                {health?.errorRates.botClicks} of {health?.errorRates.totalClicks} clicks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Edge Functions Status */}
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

        {/* Database Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Database Metrics</CardTitle>
            <CardDescription>Current database status and table sizes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>
    </ModernLayout>
  );
}
