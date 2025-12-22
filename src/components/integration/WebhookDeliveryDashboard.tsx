import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeWebhookLogs } from '@/hooks/useRealtimeStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  delivered_at: string;
}

interface WebhookRetryItem {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  attempt: number;
  max_retries: number;
  status: string;
  last_error: string | null;
  next_retry_at: string;
  created_at: string;
}

export function WebhookDeliveryDashboard() {
  const { user } = useAuth();
  
  // Enable realtime updates
  useRealtimeWebhookLogs();

  // Fetch recent webhook logs
  const { data: webhookLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['webhookLogs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('delivered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WebhookLog[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch retry queue
  const { data: retryQueue, isLoading: retryLoading } = useQuery({
    queryKey: ['webhookRetryQueue', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_retry_queue')
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['pending', 'retrying'])
        .order('next_retry_at', { ascending: true })
        .limit(20);

      if (error) throw error;
      return data as WebhookRetryItem[];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Calculate stats
  const successCount = webhookLogs?.filter(l => l.response_status && l.response_status >= 200 && l.response_status < 300).length || 0;
  const failureCount = webhookLogs?.filter(l => !l.response_status || l.response_status >= 400).length || 0;
  const pendingRetries = retryQueue?.length || 0;

  const getStatusBadge = (status: number | null) => {
    if (!status) return <Badge variant="secondary">No Response</Badge>;
    if (status >= 200 && status < 300) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Success {status}</Badge>;
    if (status >= 400 && status < 500) return <Badge variant="destructive">Client Error {status}</Badge>;
    if (status >= 500) return <Badge variant="destructive">Server Error {status}</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getEventBadge = (eventType: string) => {
    const colors: Record<string, string> = {
      conversion: 'bg-brand-teal/20 text-brand-teal border-brand-teal/30',
      click: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      fraud_alert: 'bg-red-500/20 text-red-400 border-red-500/30',
      postback_received: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      postback_failed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return <Badge className={colors[eventType] || 'bg-muted'}>{eventType}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-card-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-teal/20 rounded-lg">
                <Activity className="h-5 w-5 text-brand-teal" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Total Deliveries</p>
                <p className="text-2xl font-bold text-foreground">{webhookLogs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-card-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Successful</p>
                <p className="text-2xl font-bold text-green-400">{successCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-card-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Failed</p>
                <p className="text-2xl font-bold text-red-400">{failureCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-card-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <RefreshCw className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Pending Retries</p>
                <p className="text-2xl font-bold text-yellow-400">{pendingRetries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for logs and retries */}
      <Card className="bg-gradient-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-teal" />
            Webhook Delivery Log
          </CardTitle>
          <CardDescription>
            Real-time view of webhook deliveries and retry queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent">
            <TabsList className="bg-card-hover">
              <TabsTrigger value="recent">Recent Deliveries</TabsTrigger>
              <TabsTrigger value="failures">Failures</TabsTrigger>
              <TabsTrigger value="retries">Retry Queue ({pendingRetries})</TabsTrigger>
            </TabsList>

            <TabsContent value="recent">
              <ScrollArea className="h-[400px]">
                {logsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-foreground-muted" />
                  </div>
                ) : !webhookLogs?.length ? (
                  <div className="text-center py-8 text-foreground-muted">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No webhook deliveries yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {webhookLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 border border-card-border rounded-lg bg-card-hover/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getEventBadge(log.event_type)}
                            <ArrowRight className="h-4 w-4 text-foreground-muted" />
                            {getStatusBadge(log.response_status)}
                          </div>
                          <span className="text-xs text-foreground-muted">
                            {formatDistanceToNow(new Date(log.delivered_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-foreground-muted truncate">
                          {log.response_body?.slice(0, 100) || 'No response body'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="failures">
              <ScrollArea className="h-[400px]">
                {logsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-foreground-muted" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {webhookLogs
                      ?.filter((l) => !l.response_status || l.response_status >= 400)
                      .map((log) => (
                        <div
                          key={log.id}
                          className="p-4 border border-destructive/30 rounded-lg bg-destructive/10"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              {getEventBadge(log.event_type)}
                              {getStatusBadge(log.response_status)}
                            </div>
                            <span className="text-xs text-foreground-muted">
                              {format(new Date(log.delivered_at), 'MMM d, HH:mm:ss')}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-foreground-muted">
                            {log.response_body || 'Connection failed or timeout'}
                          </div>
                        </div>
                      )) || (
                      <div className="text-center py-8 text-foreground-muted">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400 opacity-50" />
                        <p>No failures recorded</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="retries">
              <ScrollArea className="h-[400px]">
                {retryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-foreground-muted" />
                  </div>
                ) : !retryQueue?.length ? (
                  <div className="text-center py-8 text-foreground-muted">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending retries</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {retryQueue.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 border border-yellow-500/30 rounded-lg bg-yellow-500/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-yellow-400" />
                            {getEventBadge(item.event_type)}
                            <Badge variant="secondary">
                              Attempt {item.attempt}/{item.max_retries}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-foreground-muted">
                            <Clock className="h-3 w-3" />
                            Next retry: {formatDistanceToNow(new Date(item.next_retry_at), { addSuffix: true })}
                          </div>
                        </div>
                        {item.last_error && (
                          <div className="text-xs font-mono text-red-400 mt-2">
                            Last error: {item.last_error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
