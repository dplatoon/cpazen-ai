import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCreateOffer } from '@/hooks/useOffers';
import { useToast } from '@/hooks/use-toast';

interface NetworkAccount {
  id: string;
  name: string;
  network_type: string;
  external_id: string | null;
}

interface NetworkOffer {
  network_offer_id: string;
  name: string;
  payout: number;
  currency: string;
  countries: string[];
  offer_url: string;
  status: string;
  network: string;
}

interface NetworkOfferImportProps {
  account: NetworkAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NetworkOfferImport({ account, open, onOpenChange }: NetworkOfferImportProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createOffer = useCreateOffer();
  
  const [isLoading, setIsLoading] = useState(false);
  const [offers, setOffers] = useState<NetworkOffer[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  const fetchOffers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await supabase.functions.invoke('fetch-network-offers', {
        body: { network_account_id: account.id },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch offers');
      }

      const data = response.data;
      if (data.success && data.offers) {
        setOffers(data.offers);
      } else {
        throw new Error(data.error || 'No offers found');
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch offers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen) {
      setOffers([]);
      setSelectedOffers(new Set());
      setError(null);
      setImportedCount(0);
      fetchOffers();
    }
  };

  const toggleOffer = (offerId: string) => {
    setSelectedOffers(prev => {
      const next = new Set(prev);
      if (next.has(offerId)) {
        next.delete(offerId);
      } else {
        next.add(offerId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedOffers.size === offers.length) {
      setSelectedOffers(new Set());
    } else {
      setSelectedOffers(new Set(offers.map(o => o.network_offer_id)));
    }
  };

  const importSelectedOffers = async () => {
    if (selectedOffers.size === 0) return;

    setIsImporting(true);
    let imported = 0;

    try {
      const offersToImport = offers.filter(o => selectedOffers.has(o.network_offer_id));

      for (const offer of offersToImport) {
        try {
          await createOffer.mutateAsync({
            name: offer.name,
            network: offer.network,
            payout: offer.payout,
            currency: offer.currency,
            countries: offer.countries,
            daily_cap: null,
            status: offer.status as 'active' | 'paused' | 'stopped',
            offer_url: offer.offer_url,
          });
          imported++;
        } catch (err) {
          console.error(`Failed to import offer ${offer.name}:`, err);
        }
      }

      setImportedCount(imported);
      toast({
        title: 'Offers Imported',
        description: `Successfully imported ${imported} of ${selectedOffers.size} offers`,
      });

      if (imported > 0) {
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      }
    } catch (err) {
      toast({
        title: 'Import Failed',
        description: 'An error occurred while importing offers',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getNetworkLogo = (network: string) => {
    const logos: Record<string, string> = {
      maxbounty: '🎯',
      everflow: '🌊',
      shareasale: '🤝',
      cj: '📊',
      clickbank: '💳',
    };
    return logos[network] || '🔗';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{getNetworkLogo(account.network_type)}</span>
            Import Offers from {account.name}
          </DialogTitle>
          <DialogDescription>
            Select offers to import into your CPAzen account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Skeleton className="h-5 w-5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-3" />
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={fetchOffers}>
                Try Again
              </Button>
            </div>
          ) : importedCount > 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">Import Complete!</h3>
              <p className="text-muted-foreground">
                Successfully imported {importedCount} offers
              </p>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No offers available from this network.</p>
              <p className="text-sm mt-1">Check your API credentials or try again later.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedOffers.size === offers.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedOffers.size} of {offers.length} selected
                </span>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {offers.map(offer => (
                    <div
                      key={offer.network_offer_id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedOffers.has(offer.network_offer_id) 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleOffer(offer.network_offer_id)}
                    >
                      <Checkbox
                        checked={selectedOffers.has(offer.network_offer_id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{offer.name}</h4>
                          <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>
                            {offer.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-semibold text-green-600">
                            ${offer.payout.toFixed(2)} {offer.currency}
                          </span>
                          {offer.countries.length > 0 && (
                            <span>
                              {offer.countries.slice(0, 3).join(', ')}
                              {offer.countries.length > 3 && ` +${offer.countries.length - 3}`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {offer.offer_url}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={importSelectedOffers}
                  disabled={selectedOffers.size === 0 || isImporting}
                  className="bg-gradient-brand hover:opacity-90"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import {selectedOffers.size} Offer{selectedOffers.size !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
