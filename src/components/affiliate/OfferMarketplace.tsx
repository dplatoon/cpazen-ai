import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Globe, DollarSign, CheckCircle, Clock, MousePointerClick } from 'lucide-react';
import { useGlobalOffers } from '@/hooks/useGlobalOffers';
import { useMyOfferApplications, useApplyForOffer } from '@/hooks/useOfferApplications';
import { useTrackingDomain } from '@/hooks/useTrackingDomain';
import { useToast } from '@/hooks/use-toast';
import { NetworkBadge } from '@/components/offers/NetworkBadge';

export function OfferMarketplace() {
  const { data: globalOffers = [], isLoading: offersLoading } = useGlobalOffers();
  const { data: myApplications = [], isLoading: appsLoading } = useMyOfferApplications();
  const applyForOffer = useApplyForOffer();
  const { generateTrackingUrl } = useTrackingDomain();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNetwork, setFilterNetwork] = useState('all');

  // Create a map of applied offer IDs for quick lookup
  const appliedOfferIds = new Set(myApplications.map(a => a.offer_id));
  const getApplicationStatus = (offerId: string) => {
    return myApplications.find(a => a.offer_id === offerId)?.status;
  };

  const filteredOffers = globalOffers.filter(offer => {
    const matchesSearch = offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (offer.network?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesNetwork = filterNetwork === 'all' || offer.network === filterNetwork;
    return matchesSearch && matchesNetwork;
  });

  const networks = [...new Set(globalOffers.map(o => o.network).filter(Boolean))];

  const copyTrackingLink = (offerId: string) => {
    const link = generateTrackingUrl(offerId);
    navigator.clipboard.writeText(link);
    toast({ title: 'Copied!', description: 'Tracking link copied to clipboard.' });
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            placeholder="Search offers by name or network..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={filterNetwork === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterNetwork('all')}
            className={filterNetwork === 'all' ? 'bg-brand-teal' : ''}
          >
            All ({globalOffers.length})
          </Button>
          {networks.map(net => (
            <Button
              key={net}
              variant={filterNetwork === net ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterNetwork(net!)}
              className={filterNetwork === net ? 'bg-brand-teal' : ''}
            >
              {net}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-foreground-muted">
        <span>{filteredOffers.length} offers available</span>
        <span>·</span>
        <span className="text-brand-teal">{myApplications.filter(a => a.status === 'approved').length} active offers</span>
      </div>

      {/* Offer Grid */}
      {offersLoading || appsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-12 text-foreground-muted">
          <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No offers found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOffers.map((offer) => {
            const appStatus = getApplicationStatus(offer.id);
            const isApplied = appliedOfferIds.has(offer.id);

            return (
              <Card key={offer.id} className="bg-card border-card-border hover:border-brand-teal/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-foreground leading-tight">{offer.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {offer.network && <NetworkBadge network={offer.network} />}
                        <Badge variant="outline" className="text-xs">
                          {offer.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="flex items-center gap-1 text-success">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-lg font-bold">{offer.payout.toFixed(2)}</span>
                      </div>
                      <span className="text-xs text-foreground-muted">{offer.currency} / conv</span>
                    </div>
                  </div>

                  {/* Offer details */}
                  <div className="flex gap-3 text-xs text-foreground-muted mb-3 flex-wrap">
                    {offer.countries && offer.countries.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {offer.countries.slice(0, 3).join(', ')}
                        {offer.countries.length > 3 && ` +${offer.countries.length - 3}`}
                      </span>
                    )}
                    {offer.daily_cap && (
                      <span>Cap: {offer.daily_cap}/day</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  {isApplied ? (
                    <div className="flex gap-2">
                      {appStatus === 'approved' ? (
                        <>
                          <Badge className="bg-success/10 text-success border-success/20">
                            <CheckCircle className="h-3 w-3 mr-1" /> Approved
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-auto text-xs"
                            onClick={() => copyTrackingLink(offer.id)}
                          >
                            <MousePointerClick className="h-3 w-3 mr-1" /> Copy Link
                          </Button>
                        </>
                      ) : appStatus === 'pending' ? (
                        <Badge className="bg-warning/10 text-warning border-warning/20">
                          <Clock className="h-3 w-3 mr-1" /> Pending Review
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                          Rejected
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full bg-brand-teal hover:bg-brand-teal/90"
                      onClick={() => applyForOffer.mutate(offer.id)}
                      disabled={applyForOffer.isPending}
                    >
                      {applyForOffer.isPending ? 'Applying...' : 'Apply for Offer →'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
