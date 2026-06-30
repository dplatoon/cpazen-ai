import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Loader2, DollarSign, Users } from 'lucide-react';

interface WithdrawalAdmin {
  id: string;
  affiliate_id: string;
  amount: number;
  currency: string;
  status: string;
  admin_note: string | null;
  transaction_ref: string | null;
  requested_at: string;
  processed_at: string | null;
  payment_method_id: string;
  profiles?: { full_name: string | null; company_name: string | null };
  payment_methods?: { method_type: string; account_name: string; account_number: string };
}

export function AdminPaymentManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processDialog, setProcessDialog] = useState<WithdrawalAdmin | null>(null);
  const [processForm, setProcessForm] = useState({ status: 'paid', note: '', txnRef: '' });

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['admin-withdrawals', statusFilter],
    queryFn: async (): Promise<WithdrawalAdmin[]> => {
      let query = supabase
        .from('withdrawal_requests')
        .select(`
          *,
          profiles:affiliate_id ( full_name, company_name ),
          payment_methods:payment_method_id ( method_type, account_name, account_number )
        `)
        .order('requested_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const processWithdrawal = useMutation({
    mutationFn: async () => {
      if (!processDialog) throw new Error('No withdrawal selected');

      const { error } = await supabase.rpc('admin_process_withdrawal', {
        p_withdrawal_id: processDialog.id,
        p_status: processForm.status,
        p_admin_note: processForm.note || null,
        p_transaction_ref: processForm.txnRef || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      setProcessDialog(null);
      setProcessForm({ status: 'paid', note: '', txnRef: '' });
      toast({ title: 'Withdrawal Processed', description: `Status updated to ${processForm.status}` });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const pendingTotal = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-card-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">${pendingTotal.toFixed(2)}</p>
            <p className="text-xs text-foreground-muted">Pending Payouts</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{withdrawals.length}</p>
            <p className="text-xs text-foreground-muted">Total Requests</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {withdrawals.filter(w => w.status === 'paid').length}
            </p>
            <p className="text-xs text-foreground-muted">Paid This Period</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['pending', 'processing', 'paid', 'rejected', 'all'].map(s => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? 'bg-brand-teal' : ''}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Withdrawal List */}
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : withdrawals.length === 0 ? (
            <p className="text-center py-8 text-foreground-muted">No withdrawal requests found.</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map(w => (
                <div key={w.id} className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-card-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-teal/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-brand-teal" />
                    </div>
                    <div>
                      <p className="font-semibold">${w.amount.toFixed(2)} {w.currency}</p>
                      <p className="text-xs text-foreground-muted">
                        {w.profiles?.full_name || w.profiles?.company_name || 'Unknown'} · {' '}
                        {w.payment_methods?.method_type} ({w.payment_methods?.account_number?.slice(-4) || '****'})
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {new Date(w.requested_at).toLocaleDateString()} {new Date(w.requested_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={
                      w.status === 'pending' ? 'bg-warning/10 text-warning' :
                      w.status === 'paid' ? 'bg-success/10 text-success' :
                      w.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                      'bg-brand-teal/10 text-brand-teal'
                    }>{w.status}</Badge>
                    {(w.status === 'pending' || w.status === 'processing') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setProcessDialog(w);
                          setProcessForm({ status: 'paid', note: '', txnRef: '' });
                        }}
                      >
                        Process
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Dialog */}
      {processDialog && (
        <Dialog open={!!processDialog} onOpenChange={() => setProcessDialog(null)}>
          <DialogContent className="bg-card border-card-border">
            <DialogHeader>
              <DialogTitle>Process Withdrawal</DialogTitle>
              <DialogDescription>
                ${processDialog.amount.toFixed(2)} {processDialog.currency} → {' '}
                {processDialog.payment_methods?.method_type} ({processDialog.payment_methods?.account_number})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Status</Label>
                <Select value={processForm.status} onValueChange={v => setProcessForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">✅ Paid</SelectItem>
                    <SelectItem value="processing">⏳ Processing</SelectItem>
                    <SelectItem value="rejected">❌ Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {processForm.status === 'paid' && (
                <div>
                  <Label>Transaction Reference</Label>
                  <Input
                    placeholder="bKash TrxID, PayPal ref, wire ref..."
                    value={processForm.txnRef}
                    onChange={e => setProcessForm(f => ({ ...f, txnRef: e.target.value }))}
                  />
                </div>
              )}
              <div>
                <Label>Admin Note (optional)</Label>
                <Textarea
                  placeholder="Internal note..."
                  value={processForm.note}
                  onChange={e => setProcessForm(f => ({ ...f, note: e.target.value }))}
                  rows={2}
                />
              </div>
              <Button
                onClick={() => processWithdrawal.mutate()}
                disabled={processWithdrawal.isPending}
                className="w-full bg-brand-teal hover:bg-brand-teal/90"
              >
                {processWithdrawal.isPending ? 'Processing...' : `Mark as ${processForm.status}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
