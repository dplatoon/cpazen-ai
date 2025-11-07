import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AIOfferDescriptionGenerator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    offerName: '',
    network: '',
    payout: '',
    currency: 'USD',
    countries: '',
    category: '',
    tone: 'professional'
  });

  const [generated, setGenerated] = useState<{
    headline: string;
    shortDescription: string;
    detailedDescription: string;
    bulletPoints: string[];
  } | null>(null);

  const handleGenerate = async () => {
    if (!formData.offerName || !formData.network || !formData.payout) {
      toast({
        title: 'Missing information',
        description: 'Please fill in offer name, network, and payout',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-offer-description', {
        body: {
          ...formData,
          countries: formData.countries.split(',').map(c => c.trim()).filter(Boolean)
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive'
        });
        return;
      }

      setGenerated(data);
      toast({
        title: 'Success',
        description: 'Generated compelling offer descriptions'
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate descriptions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-teal" />
            AI Offer Description Generator
          </CardTitle>
          <CardDescription>
            Generate compelling marketing copy for your affiliate offers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offerName">Offer Name *</Label>
              <Input
                id="offerName"
                value={formData.offerName}
                onChange={(e) => setFormData({ ...formData, offerName: e.target.value })}
                placeholder="e.g., Premium VPN Service"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="network">Network *</Label>
              <Input
                id="network"
                value={formData.network}
                onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                placeholder="e.g., MaxBounty"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout">Payout *</Label>
              <div className="flex gap-2">
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="payout"
                  type="number"
                  value={formData.payout}
                  onChange={(e) => setFormData({ ...formData, payout: e.target.value })}
                  placeholder="25.00"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="countries">Target Countries</Label>
              <Input
                id="countries"
                value={formData.countries}
                onChange={(e) => setFormData({ ...formData, countries: e.target.value })}
                placeholder="US, UK, CA (comma separated)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Software, Finance, Health"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Descriptions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generated && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Content</h3>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Headline</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generated.headline, 'Headline')}
                >
                  {copied === 'Headline' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">{generated.headline}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Short Description</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generated.shortDescription, 'Short Description')}
                >
                  {copied === 'Short Description' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p>{generated.shortDescription}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Detailed Description</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generated.detailedDescription, 'Detailed Description')}
                >
                  {copied === 'Detailed Description' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{generated.detailedDescription}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Key Features</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generated.bulletPoints.join('\n'), 'Key Features')}
                >
                  {copied === 'Key Features' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {generated.bulletPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
