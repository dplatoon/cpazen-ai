import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Banknote, Settings, Send, CheckCircle, XCircle, Clock,
  Loader2, Zap, Shield, AlertTriangle, Package
} from 'lucide-react';
import {
  usePaymentTransactions, usePayoutBatches, useGatewayConfig,
  useSinglePayout, useBatchPayout, useSaveGatewayConfig,
} from '@/hooks/useBkashPayout';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function BkashPayoutManager() {
  const { data: transactions = [], isLoading: txnLoading } = usePaymentTransactions();
  const { data: batches = [], isLoading: batchLoading } = usePayoutBatches();
  const { data: gatewayConfigs = [] } = useGatewayConfig();
  const singlePayout = useSinglePayout();
  const batchPayout = useBatchPayout();
  const saveConfig = useSaveGatewayConfig();

  const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([]);
  const [configForm, setConfigForm] = useState({
    app_key: '', app_secret: '', username: '', password: '',
    environment: 'sandbox' as 'sandbox' | 'production',
  });

  // Get pending bKash withdrawals
  const { data: pendingWithdrawals = [] } = useQuery({
    queryKey: ['pending-bkash-withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          profiles:affiliate_id ( full_name, company_name, email ),
          payment_methods:payment_method_id ( method_type, account_name, account_number )
        `)
        .in('status', ['pending', 'processing'])
        .order('requested_at', { ascending: true });
      if (error) throw error;
      return (data || []).filter((w: any) => 
        w.payment_methods?.method_type && ['bkash', 'nagad', 'rocket'].includes(w.payment_methods.method_type)
      );
    },
  });

  const isConfigured = gatewayConfigs.some(c => c.is_active);
  const totalPending = pendingWithdrawals.reduce((s: number, w: any) => s + w.amount, 0);

  const toggleSelection = (id: string) => {
    setSelectedWithdrawals(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedWithdrawals.length === pendingWithdrawals.length) {
      setSelectedWithdrawals([]);
    } else {
      setSelectedWithdrawals(pendingWithdrawals.map((w: any) => w.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: any }> = {
      initiated: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
      pending: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
      success: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
      failed: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
      reversed: { color: 'bg-foreground-muted/10 text-foreground-muted', icon: AlertTriangle },
    };
    const s = map[status] || map.pending;
    return (
      <Badge className={s.color}>
        <s.icon className="h-3 w-3 mr-1" />{status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Payouts', value: `৳${totalPending.toLocaleString()}`, icon: Clock, color: 'text-warning', count: pendingWithdrawals.length },
          { label: 'Total Sent', value: `৳${transactions.filter(t => t.status === 'success').reduce((s, t) => s + t.net_amount, 0).toLocaleString()}`, icon: Send, color: 'text-success' },
          { label: 'Failed', value: transactions.filter(t => t.status === 'failed').length.toString(), icon: XCircle, color: 'text-destructive' },
          { label: 'Gateway', value: isConfigured ? 'Active' : 'Not Set', icon: isConfigured ? Shield : AlertTriangle, color: isConfigured ? 'text-success' : 'text-destructive' },
        ].map(card => (
          <Card key={card.label} className="bg-card border-card-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <card.icon className={`h-5 w-5 ${card.color}`} />
                <div>
                  <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-foreground-muted">
                    {card.label}
                    {card.count !== undefined && ` (${card.count})`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="payouts" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="payouts" className="text-xs">
            <Banknote className="h-3.5 w-3.5 mr-1" /> Pay Now
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs">
            <Send className="h-3.5 w-3.5 mr-1" /> History
          </TabsTrigger>
          <TabsTrigger value="batches" className="text-xs">
            <Package className="h-3.5 w-3.5 mr-1" /> Batches
          </TabsTrigger>
          <TabsTrigger value="config" className="text-xs">
            <Settings className="h-3.5 w-3.5 mr-1" /> Config
          </TabsTrigger>
        </TabsList>

        {/* ═══ PAY NOW ═══ */}
        <TabsContent value="payouts" className="mt-4 space-y-4">
          {!isConfigured && (
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">bKash Gateway Not Configured</p>
                  <p className="text-xs text-foreground-muted">Go to Config tab to add your bKash API credentials.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {pendingWithdrawals.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedWithdrawals.length === pendingWithdrawals.length && pendingWithdrawals.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-foreground-muted">
                  {selectedWithdrawals.length} of {pendingWithdrawals.length} selected
                </span>
              </div>
              {selectedWithdrawals.length > 1 && (
                <Button
                  onClick={() => batchPayout.mutate(selectedWithdrawals)}
                  disabled={batchPayout.isPending || !isConfigured}
                  className="bg-success hover:bg-success/90"
                  size="sm"
                >
                  {batchPayout.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing...</>
                  ) : (
                    <><Zap className="h-4 w-4 mr-1" /> Batch Pay ({selectedWithdrawals.length})</>
                  )}
                </Button>
              )}
            </div>
          )}

          {pendingWithdrawals.length === 0 ? (
            <Card className="bg-card border-card-border">
              <CardContent className="p-8 text-center text-foreground-muted">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No pending bKash/Nagad/Rocket payouts</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pendingWithdrawals.map((w: any) => (
                <Card key={w.id} className={`bg-card border-card-border ${selectedWithdrawals.includes(w.id) ? 'ring-1 ring-brand-teal/30' : ''}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Checkbox
                      checked={selectedWithdrawals.includes(w.id)}
                      onCheckedChange={() => toggleSelection(w.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          ৳{w.amount.toLocaleString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {w.payment_methods?.method_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground-muted">
                        {w.profiles?.full_name || w.profiles?.email} → {w.payment_methods?.account_number}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        Requested: {new Date(w.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => singlePayout.mutate(w.id)}
                      disabled={singlePayout.isPending || !isConfigured}
                      className="bg-success hover:bg-success/90"
                    >
                      {singlePayout.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><Send className="h-3 w-3 mr-1" /> Pay</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ TRANSACTION HISTORY ═══ */}
        <TabsContent value="transactions" className="mt-4">
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <CardDescription>All bKash/Nagad payout attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {txnLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : transactions.length === 0 ? (
                <p className="text-center py-8 text-foreground-muted">No transactions yet.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map(txn => (
                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-card-border/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txn.status === 'success' ? 'bg-success/10' : txn.status === 'failed' ? 'bg-destructive/10' : 'bg-warning/10'}`}>
                          {txn.status === 'success' ? <CheckCircle className="h-4 w-4 text-success" /> :
                           txn.status === 'failed' ? <XCircle className="h-4 w-4 text-destructive" /> :
                           <Clock className="h-4 w-4 text-warning" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            ৳{txn.net_amount.toLocaleString()} → {txn.recipient_number}
                            <span className="text-xs text-foreground-muted ml-2">
                              (fee: ৳{txn.fee.toFixed(2)})
                            </span>
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {new Date(txn.initiated_at).toLocaleString()}
                            {txn.gateway_txn_id && ` · TrxID: ${txn.gateway_txn_id}`}
                          </p>
                          {txn.error_message && (
                            <p className="text-xs text-destructive">{txn.error_message}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(txn.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ BATCHES ═══ */}
        <TabsContent value="batches" className="mt-4">
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle className="text-lg">Payout Batches</CardTitle>
            </CardHeader>
            <CardContent>
              {batchLoading ? (
                <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : batches.length === 0 ? (
                <p className="text-center py-8 text-foreground-muted">No batch payouts yet. Select multiple withdrawals to create a batch.</p>
              ) : (
                <div className="space-y-2">
                  {batches.map(batch => (
                    <div key={batch.id} className="p-4 rounded-lg bg-background/50 border border-card-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">{batch.batch_name}</span>
                        {getStatusBadge(batch.status)}
                      </div>
                      <div className="flex gap-4 text-xs text-foreground-muted">
                        <span>৳{batch.total_amount.toLocaleString()}</span>
                        <span>✅ {batch.success_count}/{batch.transaction_count}</span>
                        {batch.failed_count > 0 && <span className="text-destructive">❌ {batch.failed_count} failed</span>}
                        <span>Fee: ৳{batch.total_fee.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ CONFIG ═══ */}
        <TabsContent value="config" className="mt-4">
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-brand-teal" />
                bKash Gateway Configuration
              </CardTitle>
              <CardDescription>
                Get your API credentials from{' '}
                <a href="https://developer.bka.sh" target="_blank" rel="noopener" className="text-brand-teal underline">developer.bka.sh</a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Environment</Label>
                  <Select
                    value={configForm.environment}
                    onValueChange={(v) => setConfigForm(f => ({ ...f, environment: v as any }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">🧪 Sandbox (Testing)</SelectItem>
                      <SelectItem value="production">🚀 Production (Live)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">
                    {isConfigured ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <CheckCircle className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    ) : (
                      <Badge className="bg-warning/10 text-warning border-warning/20">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Not Configured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label>App Key</Label>
                <Input
                  placeholder="bKash App Key"
                  value={configForm.app_key}
                  onChange={e => setConfigForm(f => ({ ...f, app_key: e.target.value }))}
                />
              </div>
              <div>
                <Label>App Secret</Label>
                <Input
                  type="password"
                  placeholder="bKash App Secret"
                  value={configForm.app_secret}
                  onChange={e => setConfigForm(f => ({ ...f, app_secret: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <Input
                    placeholder="bKash Username"
                    value={configForm.username}
                    onChange={e => setConfigForm(f => ({ ...f, username: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="bKash Password"
                    value={configForm.password}
                    onChange={e => setConfigForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
              </div>
              <Button
                onClick={() => saveConfig.mutate(configForm)}
                disabled={saveConfig.isPending || !configForm.app_key || !configForm.app_secret}
                className="w-full bg-brand-teal hover:bg-brand-teal/90"
              >
                {saveConfig.isPending ? 'Saving...' : 'Save bKash Configuration'}
              </Button>

              <div className="text-xs text-foreground-muted space-y-1 pt-2 border-t border-card-border">
                <p>💡 Start with <strong>Sandbox</strong> mode to test. Switch to <strong>Production</strong> when ready for real payments.</p>
                <p>📋 B2P transfer fee: 0.5% per transaction (min ৳5)</p>
                <p>⚠️ Credentials are encrypted and stored in Supabase with RLS protection.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
