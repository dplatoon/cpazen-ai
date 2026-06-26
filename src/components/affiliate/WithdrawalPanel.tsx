import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight, Clock, CheckCircle, XCircle, Loader2, Banknote } from 'lucide-react';
import { useWithdrawals, useRequestWithdrawal } from '@/hooks/useWithdrawals';
import { usePaymentMethods, PAYMENT_METHOD_LABELS, PaymentMethodType } from '@/hooks/usePaymentMethods';
import { useAffiliateBalance } from '@/hooks/useAffiliateEarnings';
import { Skeleton } from '@/components/ui/skeleton';

export function WithdrawalPanel() {
  const { data: balance } = useAffiliateBalance();
  const { data: methods = [] } = usePaymentMethods();
  const { data: withdrawals = [], isLoading } = useWithdrawals();
  const requestWithdrawal = useRequestWithdrawal();
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');

  const availableBalance = balance?.available_balance || 0;
  const minPayout = 50;

  const handleRequest = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || !selectedMethodId) return;
    requestWithdrawal.mutate({
      amount: numAmount,
      paymentMethodId: selectedMethodId,
    }, {
      onSuccess: () => {
        setAmount('');
        setSelectedMethodId('');
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-brand-teal animate-spin" />;
      case 'paid': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      processing: 'bg-brand-teal/10 text-brand-teal border-brand-teal/20',
      paid: 'bg-success/10 text-success border-success/20',
      rejected: 'bg-destructive/10 text-destructive border-destructive/20',
      cancelled: 'bg-muted text-foreground-muted',
    };
    return <Badge className={styles[status] || ''}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Request Withdrawal */}
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-brand-teal" />
            Request Withdrawal
          </CardTitle>
          <CardDescription>
            Available: <span className="text-success font-semibold">${availableBalance.toFixed(2)}</span>
            {' · '}Minimum payout: ${minPayout.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {methods.length === 0 ? (
            <div className="text-center py-4 text-foreground-muted text-sm">
              Please add a payment method first before requesting a withdrawal.
            </div>
          ) : (
            <div className="flex gap-3 flex-wrap items-end">
              <div className="flex-1 min-w-[140px]">
                <Label className="text-xs">Amount (USD)</Label>
                <Input
                  type="number"
                  min={minPayout}
                  max={availableBalance}
                  step="0.01"
                  placeholder={`Min $${minPayout}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs">Payment Method</Label>
                <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
                  <SelectTrigger><SelectValue placeholder="Select method..." /></SelectTrigger>
                  <SelectContent>
                    {methods.map(m => {
                      const info = PAYMENT_METHOD_LABELS[m.method_type as PaymentMethodType];
                      return (
                        <SelectItem key={m.id} value={m.id}>
                          {info?.icon} {info?.label} — {m.account_number.slice(-4)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleRequest}
                disabled={
                  requestWithdrawal.isPending ||
                  !amount ||
                  parseFloat(amount) < minPayout ||
                  parseFloat(amount) > availableBalance ||
                  !selectedMethodId
                }
                className="bg-brand-teal hover:bg-brand-teal/90"
              >
                {requestWithdrawal.isPending ? 'Submitting...' : 'Request Withdrawal'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="text-lg">Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              <Banknote className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No withdrawals yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-card-border/50">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(w.status)}
                    <div>
                      <p className="text-sm font-semibold">${w.amount.toFixed(2)} {w.currency}</p>
                      <p className="text-xs text-foreground-muted">
                        {new Date(w.requested_at).toLocaleDateString()}
                        {w.transaction_ref && ` · Ref: ${w.transaction_ref}`}
                      </p>
                      {w.admin_note && (
                        <p className="text-xs text-foreground-muted mt-1">Note: {w.admin_note}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(w.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
