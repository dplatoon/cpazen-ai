import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FraudPatternManager } from '@/components/fraud/FraudPatternManager';

export default function FraudMonitoringPage() {
  const { data: fraudAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['my-fraud-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .select('*, campaigns(name), clicks(ip_address, user_agent)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const { data: suspiciousClicks, isLoading: clicksLoading } = useQuery({
    queryKey: ['suspicious-clicks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('clicks')
        .select('*, campaigns(name)')
        .eq('user_id', user.id)
        .gte('fraud_score', 50)
        .order('fraud_score', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const pendingAlerts = fraudAlerts?.filter(a => a.status === 'pending').length || 0;
  const highSeverity = fraudAlerts?.filter(a => a.severity === 'high').length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Fraud Monitoring</h1>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAlerts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highSeverity}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspiciousClicks?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">
            Fraud Alerts
            {pendingAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="clicks">Suspicious Clicks</TabsTrigger>
          <TabsTrigger value="patterns">ML Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Alerts</CardTitle>
              <CardDescription>Review suspicious activities detected in your campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div>Loading alerts...</div>
              ) : !fraudAlerts || fraudAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No fraud alerts detected
                </div>
              ) : (
                <div className="space-y-4">
                  {fraudAlerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4 space-y-2">
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
                            <Badge variant="outline">{alert.status}</Badge>
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

        <TabsContent value="clicks">
          <Card>
            <CardHeader>
              <CardTitle>Suspicious Clicks</CardTitle>
              <CardDescription>Clicks with high fraud scores</CardDescription>
            </CardHeader>
            <CardContent>
              {clicksLoading ? (
                <div>Loading clicks...</div>
              ) : !suspiciousClicks || suspiciousClicks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No suspicious clicks found
                </div>
              ) : (
                <div className="space-y-4">
                  {suspiciousClicks.map((click) => (
                    <div key={click.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                click.fraud_score >= 80
                                  ? 'destructive'
                                  : click.fraud_score >= 60
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              Score: {click.fraud_score}
                            </Badge>
                            {click.campaigns && (
                              <span className="text-sm">{click.campaigns.name}</span>
                            )}
                          </div>
                          <div className="mt-2 text-sm space-y-1">
                            <p className="text-muted-foreground">IP: {click.ip_address}</p>
                            {click.country && <p className="text-muted-foreground">Country: {click.country}</p>}
                            {Array.isArray(click.fraud_indicators) && click.fraud_indicators.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-1">
                                {click.fraud_indicators.map((indicator: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {indicator.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(click.created_at).toLocaleString()}
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

        <TabsContent value="patterns">
          <FraudPatternManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}