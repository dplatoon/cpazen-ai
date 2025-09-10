import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, ExternalLink, DollarSign, Globe } from "lucide-react";
import { useOffers } from "@/hooks/useOffers";
import { AddOfferDialog } from "./AddOfferDialog";
import { NetworkBadge } from "./NetworkBadge";
import { useState } from "react";

export const OfferManager = () => {
  const { data: offers, isLoading, refetch } = useOffers();
  const [searchTerm, setSearchTerm] = useState('');

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

  const getNetworkBadge = (network: string) => {
    const colors = {
      'MaxBounty': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      'Everflow': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'ShareASale': 'bg-green-500/10 text-green-500 border-green-500/20',
      'ClickDealer': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'CPA Junction': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    };
    
    return (
      <Badge className={colors[network as keyof typeof colors] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}>
        {network}
      </Badge>
    );
  };

  const filteredOffers = offers?.filter(offer =>
    offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.network.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Offer Manager</h1>
          <p className="text-foreground-muted mt-2">
            Connect to affiliate networks like MaxBounty, ClickDealer & add offers manually
          </p>
        </div>
        <AddOfferDialog onOfferAdded={refetch} />
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gradient-card border-card-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              placeholder="Search offers..."
              className="pl-10 bg-background-secondary border-card-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-card-border">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </Card>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-foreground-muted mb-4">
              {searchTerm ? 'No offers found matching your search.' : 'Connect to affiliate networks like MaxBounty, ClickDealer, or add offers manually to get started.'}
            </p>
            <AddOfferDialog onOfferAdded={refetch} />
          </div>
        ) : (
          filteredOffers.map((offer) => (
          <Card key={offer.id} className="p-6 bg-gradient-card hover:bg-gradient-hover transition-all duration-200 border-card-border">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground text-lg">{offer.name}</h3>
                    <div className="flex items-center space-x-2">
                      <NetworkBadge network={offer.network} />
                    </div>
                  </div>
                {getStatusBadge(offer.status)}
              </div>

              {/* Offer URL Preview */}
              <p className="text-xs text-foreground-muted font-mono bg-background-secondary p-2 rounded truncate">
                {offer.offer_url}
              </p>

              {/* Payout */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="text-lg font-bold text-success">
                    ${offer.payout.toFixed(2)}
                  </span>
                  <span className="text-sm text-foreground-muted">
                    {offer.currency}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-foreground-muted">Daily Cap</div>
                  <div className="font-medium text-foreground">{offer.daily_cap || 'Unlimited'}</div>
                </div>
              </div>

              {/* Countries */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Globe className="h-4 w-4 text-foreground-muted" />
                  <span className="text-sm font-medium text-foreground-muted">Countries</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {offer.countries.slice(0, 4).map((country) => (
                    <Badge key={country} variant="outline" className="text-xs border-card-border">
                      {country}
                    </Badge>
                  ))}
                  {offer.countries.length > 4 && (
                    <Badge variant="outline" className="text-xs border-card-border">
                      +{offer.countries.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button className="flex-1 bg-gradient-brand hover:opacity-90 transition-opacity">
                  Create Campaign
                </Button>
                <Button variant="outline" size="sm" className="border-card-border">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
          ))
        )}
      </div>
    </div>
  );
};