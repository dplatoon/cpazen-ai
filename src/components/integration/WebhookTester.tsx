import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TestTube, Clock, CheckCircle, XCircle, Play } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function WebhookTester() {
  const queryClient = useQueryClient();
  const [selectedWebhook, setSelectedWebhook] = useState<string>('');
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    event_type: "conversion",
    click_id: "123e4567-e89b-12d3-a456-426614174000",
    campaign_id: "123e4567-e89b-12d3-a456-426614174001",
    payout: 25.00,
    currency: "USD"
  }, null, 2));

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: testLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['webhook-test-logs', selectedWebhook],
    queryFn: async () => {
      let query = supabase
        .from('webhook_test_logs')
        .select('*, webhooks(name, url)')
        .order('tested_at', { ascending: false })
        .limit(20);
      
      if (selectedWebhook) {
        query = query.eq('webhook_id', selectedWebhook);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: true,
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (data: { webhook_id: string; payload: any }) => {
      const response = await supabase.functions.invoke('test-webhook', {
        body: data,
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-test-logs'] });
      toast.success('Webhook test completed');
    },
    onError: (error: Error) => {
      toast.error(`Test failed: ${error.message}`);
    },
  });

  const handleTest = () => {
    if (!selectedWebhook) {
      toast.error('Please select a webhook');
      return;
    }

    try {
      const payload = JSON.parse(testPayload);
      testWebhookMutation.mutate({
        webhook_id: selectedWebhook,
        payload,
      });
    } catch (error) {
      toast.error('Invalid JSON payload');
    }
  };

  const getStatusBadge = (status: number | null) => {
    if (!status) return <Badge variant="secondary">Pending</Badge>;
    if (status >= 200 && status < 300) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
  };

  const loadSamplePayload = (type: string) => {
    const samples: Record<string, any> = {
      conversion: {
        event_type: "conversion",
        click_id: "123e4567-e89b-12d3-a456-426614174000",
        campaign_id: "123e4567-e89b-12d3-a456-426614174001",
        payout: 25.00,
        currency: "USD",
        status: "approved"
      },
      click: {
        event_type: "click",
        click_id: "123e4567-e89b-12d3-a456-426614174000",
        campaign_id: "123e4567-e89b-12d3-a456-426614174001",
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0...",
        country: "US"
      },
      fraud_alert: {
        event_type: "fraud_alert",
        alert_id: "123e4567-e89b-12d3-a456-426614174000",
        click_id: "123e4567-e89b-12d3-a456-426614174001",
        severity: "high",
        fraud_score: 85,
        description: "High click velocity detected"
      }
    };
    setTestPayload(JSON.stringify(samples[type] || {}, null, 2));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Webhook Tester
          </CardTitle>
          <CardDescription>
            Test your webhooks with sample payloads before going live
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Webhook</Label>
            <Select value={selectedWebhook} onValueChange={setSelectedWebhook}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a webhook to test" />
              </SelectTrigger>
              <SelectContent>
                {webhooks.map((webhook: any) => (
                  <SelectItem key={webhook.id} value={webhook.id}>
                    {webhook.name} - {webhook.url}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Test Payload (JSON)</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadSamplePayload('conversion')}
                >
                  Load Conversion
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadSamplePayload('click')}
                >
                  Load Click
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadSamplePayload('fraud_alert')}
                >
                  Load Alert
                </Button>
              </div>
            </div>
            <Textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder='{"event_type": "conversion", ...}'
            />
          </div>

          <Button
            onClick={handleTest}
            disabled={!selectedWebhook || testWebhookMutation.isPending}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {testWebhookMutation.isPending ? 'Testing...' : 'Send Test'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test History</CardTitle>
          <CardDescription>Recent webhook test results</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : testLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No test history yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Tested At</TableHead>
                  <TableHead>Response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{log.webhooks?.name}</div>
                        <div className="text-xs text-muted-foreground">{log.webhooks?.url}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(log.response_status)}</TableCell>
                    <TableCell>
                      {log.response_time_ms ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.response_time_ms}ms
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(log.tested_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-xs font-mono text-muted-foreground">
                        {log.response_body || '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}