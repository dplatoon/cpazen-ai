import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { useAffiliateBalance, useEarningsHistory } from '@/hooks/useAffiliateEarnings';

export function EarningsDashboard() {
  const { data: balance, isLoading: balanceLoading } = useAffiliateBalance();
  const { data: earnings = [], isLoading: earningsLoading } = useEarningsHistory();

  const balanceCards = [
    { label: 'Available Balance', value: balance?.available_balance || 0, icon: DollarSign, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Pending', value: balance?.pending_balance || 0, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Total Earned', value: balance?.total_earned || 0, icon: TrendingUp, color: 'text-brand-teal', bg: 'bg-brand-teal/10' },
    { label: 'Total Paid', value: balance?.total_paid || 0, icon: CheckCircle, color: 'text-foreground-muted', bg: 'bg-muted/50' },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      approved: 'bg-success/10 text-success border-success/20',
      rejected: 'bg-destructive/10 text-destructive border-destructive/20',
      paid: 'bg-brand-teal/10 text-brand-teal border-brand-teal/20',
    };
    return <Badge className={styles[status] || ''}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {balanceCards.map((card) => (
          <Card key={card.label} className="bg-card border-card-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <div>
                  {balanceLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <p className={`text-xl font-bold ${card.color}`}>
                      ${card.value.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-foreground-muted">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Earnings History */}
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="text-lg">Earnings History</CardTitle>
          <CardDescription>Your recent conversion earnings</CardDescription>
        </CardHeader>
        <CardContent>
          {earningsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No earnings yet. Apply for offers and start driving traffic!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {earnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-card-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        +${earning.amount.toFixed(2)} {earning.currency}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {earning.description || 'Conversion'} · {new Date(earning.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(earning.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
