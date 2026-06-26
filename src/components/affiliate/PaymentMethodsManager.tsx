import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus, Star, CreditCard } from 'lucide-react';
import { usePaymentMethods, useAddPaymentMethod, useDeletePaymentMethod, PAYMENT_METHOD_LABELS, PaymentMethodType } from '@/hooks/usePaymentMethods';
import { Skeleton } from '@/components/ui/skeleton';

export function PaymentMethodsManager() {
  const { data: methods = [], isLoading } = usePaymentMethods();
  const addMethod = useAddPaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    method_type: '' as PaymentMethodType | '',
    account_name: '',
    account_number: '',
    is_primary: false,
  });

  const handleSubmit = () => {
    if (!formData.method_type || !formData.account_name || !formData.account_number) return;
    addMethod.mutate({
      method_type: formData.method_type as PaymentMethodType,
      account_name: formData.account_name,
      account_number: formData.account_number,
      is_primary: formData.is_primary || methods.length === 0,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setFormData({ method_type: '', account_name: '', account_number: '', is_primary: false });
      }
    });
  };

  return (
    <Card className="bg-card border-card-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Payment Methods</CardTitle>
          <CardDescription>How you want to receive your earnings</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-brand-teal hover:bg-brand-teal/90">
              <Plus className="h-4 w-4 mr-1" /> Add Method
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-card-border">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>Choose how you want to receive payments</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Payment Type</Label>
                <Select value={formData.method_type} onValueChange={(v) => setFormData(f => ({ ...f, method_type: v as PaymentMethodType }))}>
                  <SelectTrigger><SelectValue placeholder="Select method..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        {val.icon} {val.label} ({val.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Account Name</Label>
                <Input
                  placeholder="Your full name or business name"
                  value={formData.account_name}
                  onChange={(e) => setFormData(f => ({ ...f, account_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>
                  {formData.method_type === 'paypal' ? 'PayPal Email' :
                   formData.method_type === 'wise' ? 'Wise Email' :
                   formData.method_type?.startsWith('usdt') ? 'Wallet Address' :
                   formData.method_type === 'bank_wire' ? 'Account Number / IBAN' :
                   'Mobile Number'}
                </Label>
                <Input
                  placeholder={
                    formData.method_type === 'bkash' ? '01XXXXXXXXX' :
                    formData.method_type === 'paypal' ? 'email@example.com' :
                    formData.method_type?.startsWith('usdt') ? 'T...' :
                    'Account details'
                  }
                  value={formData.account_number}
                  onChange={(e) => setFormData(f => ({ ...f, account_number: e.target.value }))}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={addMethod.isPending || !formData.method_type || !formData.account_name || !formData.account_number}
                className="w-full bg-brand-teal hover:bg-brand-teal/90"
              >
                {addMethod.isPending ? 'Saving...' : 'Add Payment Method'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : methods.length === 0 ? (
          <div className="text-center py-8 text-foreground-muted">
            <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No payment methods added yet.</p>
            <p className="text-xs mt-1">Add one to receive your earnings.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => {
              const info = PAYMENT_METHOD_LABELS[method.method_type as PaymentMethodType];
              return (
                <div key={method.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-card-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{info?.icon || '💳'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{info?.label || method.method_type}</p>
                        {method.is_primary && (
                          <Badge variant="outline" className="text-xs py-0 border-brand-teal/30 text-brand-teal">
                            <Star className="h-3 w-3 mr-1" /> Primary
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted">
                        {method.account_name} · {method.account_number.replace(/(.{4}).*(.{4})/, '$1****$2')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMethod.mutate(method.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
