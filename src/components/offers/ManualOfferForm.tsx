import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const offerSchema = z.object({
  name: z.string().min(1, 'Offer name is required'),
  network: z.string().min(1, 'Network is required'),
  offer_url: z.string().url('Valid offer URL is required'),
  payout: z.number().min(0, 'Payout must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  daily_cap: z.number().optional(),
  status: z.enum(['active', 'paused', 'stopped']),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface ManualOfferFormProps {
  onSuccess: () => void;
}

const POPULAR_NETWORKS = [
  'MaxBounty', 'Everflow', 'ShareASale', 'CPA Junction', 'ClickDealer', 
  'Adsterra', 'CrakRevenue', 'ClickBank', 'Commission Junction', 'Custom'
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export const ManualOfferForm = ({ onSuccess }: ManualOfferFormProps) => {
  const [countries, setCountries] = useState<string[]>([]);
  const [countryInput, setCountryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: '',
      network: '',
      offer_url: '',
      payout: 0,
      currency: 'USD',
      status: 'active',
    },
  });

  const addCountry = () => {
    if (countryInput && !countries.includes(countryInput.toUpperCase())) {
      setCountries([...countries, countryInput.toUpperCase()]);
      setCountryInput('');
    }
  };

  const removeCountry = (country: string) => {
    setCountries(countries.filter(c => c !== country));
  };

  const handleSubmit = async (data: OfferFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('offers')
        .insert({
          name: data.name,
          network: data.network,
          offer_url: data.offer_url,
          payout: data.payout,
          currency: data.currency,
          countries: countries,
          daily_cap: data.daily_cap || null,
          status: data.status,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Offer added successfully!',
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to add offer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Offer Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Premium Dating App" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="network"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Affiliate Network</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {POPULAR_NETWORKS.map((network) => (
                      <SelectItem key={network} value={network}>
                        {network}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="offer_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Offer URL (with tracking macros)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://network.com/offer?click_id={click_id}&sub_id={sub_id}" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="payout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payout</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="daily_cap"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Cap (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1000"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Target Countries</FormLabel>
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="e.g., US, UK, CA"
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCountry())}
            />
            <Button type="button" onClick={addCountry} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {countries.map((country) => (
              <Badge key={country} variant="outline" className="flex items-center gap-1">
                {country}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeCountry(country)}
                />
              </Badge>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-gradient-brand hover:opacity-90 transition-opacity"
          disabled={isLoading}
        >
          {isLoading ? 'Adding Offer...' : 'Add Offer'}
        </Button>
      </form>
    </Form>
  );
};