import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminOffers, useAdminCreateOffer, useAdminUpdateOffer, useAdminDeleteOffer } from '@/hooks/useAdminOffers';
import { Plus, Pencil, Trash2, Search, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const NETWORKS = ['MaxBounty', 'Everflow', 'ShareASale', 'ClickDealer', 'CPA Junction', 'Direct'];
const COUNTRIES = ['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BR', 'MX', 'IN', 'JP', 'KR', 'SG'];

export function AdminOfferManager() {
  const { data: offers, isLoading } = useAdminOffers();
  const createOffer = useAdminCreateOffer();
  const updateOffer = useAdminUpdateOffer();
  const deleteOffer = useAdminDeleteOffer();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    offer_url: '',
    payout: '',
    network: '',
    currency: 'USD',
    countries: [] as string[],
    daily_cap: '',
    status: 'active',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      offer_url: '',
      payout: '',
      network: '',
      currency: 'USD',
      countries: [],
      daily_cap: '',
      status: 'active',
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.offer_url || !formData.payout) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await createOffer.mutateAsync({
        name: formData.name,
        offer_url: formData.offer_url,
        payout: parseFloat(formData.payout),
        network: formData.network || undefined,
        currency: formData.currency,
        countries: formData.countries.length > 0 ? formData.countries : undefined,
        daily_cap: formData.daily_cap ? parseInt(formData.daily_cap) : undefined,
        status: formData.status,
      });
      toast.success('Offer created successfully');
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create offer');
    }
  };

  const handleUpdate = async (offerId: string) => {
    try {
      await updateOffer.mutateAsync({
        id: offerId,
        name: formData.name || undefined,
        offer_url: formData.offer_url || undefined,
        payout: formData.payout ? parseFloat(formData.payout) : undefined,
        network: formData.network || undefined,
        currency: formData.currency || undefined,
        countries: formData.countries.length > 0 ? formData.countries : undefined,
        daily_cap: formData.daily_cap ? parseInt(formData.daily_cap) : undefined,
        status: formData.status || undefined,
      });
      toast.success('Offer updated successfully');
      setEditingOffer(null);
      resetForm();
    } catch (error) {
      toast.error('Failed to update offer');
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      await deleteOffer.mutateAsync(offerId);
      toast.success('Offer deleted successfully');
    } catch (error) {
      toast.error('Failed to delete offer');
    }
  };

  const openEditDialog = (offer: any) => {
    setFormData({
      name: offer.name,
      offer_url: offer.offer_url,
      payout: offer.payout.toString(),
      network: offer.network || '',
      currency: offer.currency,
      countries: offer.countries || [],
      daily_cap: offer.daily_cap?.toString() || '',
      status: offer.status,
    });
    setEditingOffer(offer.id);
  };

  const filteredOffers = offers?.filter(offer =>
    offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (offer.network?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (offer.owner_email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const OfferForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Offer Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Weight Loss Trial"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="offer_url">Offer URL *</Label>
        <Input
          id="offer_url"
          value={formData.offer_url}
          onChange={(e) => setFormData({ ...formData, offer_url: e.target.value })}
          placeholder="https://tracking.network.com/offer/123"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="payout">Payout *</Label>
          <Input
            id="payout"
            type="number"
            step="0.01"
            value={formData.payout}
            onChange={(e) => setFormData({ ...formData, payout: e.target.value })}
            placeholder="25.00"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="network">Network</Label>
          <Select value={formData.network} onValueChange={(v) => setFormData({ ...formData, network: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              {NETWORKS.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="daily_cap">Daily Cap</Label>
          <Input
            id="daily_cap"
            type="number"
            value={formData.daily_cap}
            onChange={(e) => setFormData({ ...formData, daily_cap: e.target.value })}
            placeholder="100"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="stopped">Stopped</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Countries</Label>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((country) => (
            <Badge
              key={country}
              variant={formData.countries.includes(country) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setFormData({
                  ...formData,
                  countries: formData.countries.includes(country)
                    ? formData.countries.filter((c) => c !== country)
                    : [...formData.countries, country],
                });
              }}
            >
              {country}
            </Badge>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={createOffer.isPending || updateOffer.isPending}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Offer Management
            </CardTitle>
            <CardDescription>Create and manage offers for all affiliates</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Offer</DialogTitle>
                <DialogDescription>Add a new offer for affiliates</DialogDescription>
              </DialogHeader>
              <OfferForm onSubmit={handleCreate} submitLabel="Create Offer" />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search offers..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No offers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium">{offer.name}</TableCell>
                    <TableCell>{offer.network || '-'}</TableCell>
                    <TableCell>${Number(offer.payout).toFixed(2)} {offer.currency}</TableCell>
                    <TableCell>{getStatusBadge(offer.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{offer.owner_email || 'Unknown'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog open={editingOffer === offer.id} onOpenChange={(open) => !open && setEditingOffer(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(offer)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Offer</DialogTitle>
                              <DialogDescription>Update offer details</DialogDescription>
                            </DialogHeader>
                            <OfferForm onSubmit={() => handleUpdate(offer.id)} submitLabel="Update Offer" />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(offer.id)}
                          disabled={deleteOffer.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
