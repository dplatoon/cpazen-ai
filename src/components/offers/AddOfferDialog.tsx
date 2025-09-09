import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { ManualOfferForm } from './ManualOfferForm';
import { NetworkIntegrationForm } from './NetworkIntegrationForm';

interface AddOfferDialogProps {
  onOfferAdded: () => void;
}

export const AddOfferDialog = ({ onOfferAdded }: AddOfferDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleOfferAdded = () => {
    onOfferAdded();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-brand hover:opacity-90 transition-opacity">
          <Plus className="mr-2 h-4 w-4" />
          Add Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Offer</DialogTitle>
          <DialogDescription>
            Add offers manually or connect to affiliate networks like MaxBounty, Everflow, ShareASale, and more.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="network">Network Integration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4">
            <ManualOfferForm onSuccess={handleOfferAdded} />
          </TabsContent>
          
          <TabsContent value="network" className="space-y-4">
            <NetworkIntegrationForm onSuccess={handleOfferAdded} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};