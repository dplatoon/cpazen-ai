import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalOffers } from '@/hooks/useGlobalOffers';
import { useCampaignMetrics } from '@/hooks/useCampaignMetrics';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  DollarSign, Globe, TrendingUp, MousePointer, 
  Package, CreditCard, ArrowUpRight, BarChart3 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// New portal components
import { EarningsDashboard } from '@/components/affiliate/EarningsDashboard';
import { PaymentMethodsManager } from '@/components/affiliate/PaymentMethodsManager';
import { WithdrawalPanel } from '@/components/affiliate/WithdrawalPanel';
import { OfferMarketplace } from '@/components/affiliate/OfferMarketplace';

export default function AffiliateDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: globalOffers, isLoading: globalLoading } = useGlobalOffers();
  const { data: metrics, isLoading: metricsLoading } = useCampaignMetrics();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  if (!user) return null;

  // Aggregate metrics across all campaigns
  const aggregatedMetrics = metrics ? Object.values(metrics).reduce(
    (acc, m) => ({
      totalClicks: acc.totalClicks + m.clicks,
      totalConversions: acc.totalConversions + m.conversions,
      totalRevenue: acc.totalRevenue + m.revenue,
    }),
    { totalClicks: 0, totalConversions: 0, totalRevenue: 0 }
  ) : { totalClicks: 0, totalConversions: 0, totalRevenue: 0 };

  const overviewCards = [
    { label: 'Total Clicks', value: aggregatedMetrics.totalClicks.toLocaleString(), icon: MousePointer, color: 'text-brand-teal', bg: 'bg-brand-teal/10' },
    { label: 'Conversions', value: aggregatedMetrics.totalConversions.toLocaleString(), icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Revenue', value: `$${aggregatedMetrics.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
    { label: 'Available Offers', value: String(globalOffers?.length || 0), icon: Package, color: 'text-warning', bg: 'bg-warning/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Affiliate Portal</h1>
        <p className="text-foreground-muted mt-1">Manage your offers, earnings, and payouts</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => (
          <Card key={card.label} className="bg-card border-card-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <div>
                  {metricsLoading || globalLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  )}
                  <p className="text-xs text-foreground-muted">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="offers" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="offers" className="flex items-center gap-1.5 text-xs">
            <Globe className="h-3.5 w-3.5" /> Offers
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" /> Earnings
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex items-center gap-1.5 text-xs">
            <ArrowUpRight className="h-3.5 w-3.5" /> Payouts
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="flex items-center gap-1.5 text-xs">
            <CreditCard className="h-3.5 w-3.5" /> Methods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="mt-6">
          <OfferMarketplace />
        </TabsContent>

        <TabsContent value="earnings" className="mt-6">
          <EarningsDashboard />
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-6">
          <WithdrawalPanel />
        </TabsContent>

        <TabsContent value="payment-methods" className="mt-6">
          <PaymentMethodsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
