import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useGlobalOffers } from '@/hooks/useGlobalOffers';
import { useCampaignMetrics } from '@/hooks/useCampaignMetrics';
import { Search, DollarSign, Globe, TrendingUp, MousePointer, ArrowUpRight, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { NetworkBadge } from '@/components/offers/NetworkBadge';
import { CreateCampaignDialog } from '@/components/campaigns/CreateCampaignDialog';

export default function AffiliateDashboard() {
  const { data: globalOffers, isLoading: globalLoading } = useGlobalOffers();
  const { data: metrics, isLoading: metricsLoading } = useCampaignMetrics();
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | undefined>(undefined);

  // Aggregate metrics across all campaigns
  const aggregatedMetrics = metrics ? Object.values(metrics).reduce(
    (acc, m) => ({
      totalClicks: acc.totalClicks + m.clicks,
      totalConversions: acc.totalConversions + m.conversions,
      totalRevenue: acc.totalRevenue + m.revenue,
    }),
    { totalClicks: 0, totalConversions: 0, totalRevenue: 0 }
  ) : { totalClicks: 0, totalConversions: 0, totalRevenue: 0 };

  const filteredGlobalOffers = globalOffers?.filter(offer =>
    offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (offer.network?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'paused':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Paused</Badge>;
      case 'stopped':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Stopped</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleCreateCampaign = (offerId: string) => {
    setSelectedOfferId(offerId);
    setCampaignDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setCampaignDialogOpen(open);
    if (!open) {
      setSelectedOfferId(undefined);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Affiliate Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Browse available offers from the network and track your performance
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{aggregatedMetrics.totalClicks.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{aggregatedMetrics.totalConversions.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">${aggregatedMetrics.totalRevenue.toFixed(2)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {aggregatedMetrics.totalClicks > 0 
                  ? ((aggregatedMetrics.totalConversions / aggregatedMetrics.totalClicks) * 100).toFixed(2) 
                  : '0'}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Offers */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Available Offers
              </CardTitle>
              <CardDescription>
                Browse and promote offers from the network. Create campaigns to start earning.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search offers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {globalLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : filteredGlobalOffers.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Available Offers</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No offers match your search criteria.' : 'Check back later for new offers from the network.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGlobalOffers.map((offer) => (
                <Card key={offer.id} className="hover:shadow-lg transition-shadow border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{offer.name}</CardTitle>
                        {offer.network && <NetworkBadge network={offer.network} />}
                      </div>
                      {getStatusBadge(offer.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded truncate">
                      {offer.offer_url}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="text-lg font-bold text-success">
                          ${Number(offer.payout).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground">{offer.currency}</span>
                      </div>
                      {offer.daily_cap && (
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Daily Cap</div>
                          <div className="font-medium">{offer.daily_cap}</div>
                        </div>
                      )}
                    </div>

                    {offer.countries && offer.countries.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Countries</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {offer.countries.slice(0, 4).map((country) => (
                            <Badge key={country} variant="outline" className="text-xs">
                              {country}
                            </Badge>
                          ))}
                          {offer.countries.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{offer.countries.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <Button 
                      className="w-full"
                      onClick={() => handleCreateCampaign(offer.id)}
                      disabled={offer.status !== 'active'}
                    >
                      Create Campaign
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={campaignDialogOpen}
        onOpenChange={handleDialogClose}
        defaultOfferId={selectedOfferId}
      />
    </div>
  );
}
