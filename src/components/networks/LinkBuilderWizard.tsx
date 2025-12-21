import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Link, ArrowRight, CheckCircle, Info } from 'lucide-react';
import { useNetworkAccounts } from '@/hooks/useNetworkAccounts';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const NETWORK_MACROS: Record<string, { clickId: string; subId: string; payout: string }> = {
  maxbounty: { clickId: '#S2#', subId: '#S1#', payout: '#RATE#' },
  everflow: { clickId: '{transaction_id}', subId: '{sub1}', payout: '{payout}' },
  shareasale: { clickId: '{afftrack}', subId: '{subid}', payout: '{amount}' },
  cj: { clickId: '{SID}', subId: '{PID}', payout: '{commissionAmount}' },
  clickbank: { clickId: '{tid}', subId: '{hop}', payout: '{ctransreceipt}' },
};

export function LinkBuilderWizard() {
  const { accounts, getPostbackKeyForAccount } = useNetworkAccounts();
  const { campaigns = [] } = useCampaigns();
  const { toast } = useToast();

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [subIds, setSubIds] = useState({ sub1: '', sub2: '', sub3: '', sub4: '', sub5: '' });

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const macros = selectedAccount ? NETWORK_MACROS[selectedAccount.network_type] : null;
  const postbackKey = selectedAccount ? getPostbackKeyForAccount(selectedAccount.id) : null;

  const trackingUrl = useMemo(() => {
    if (!selectedCampaign) return '';
    
    const baseUrl = `https://rdajybqalmsdycxsruon.supabase.co/functions/v1/track-click/${selectedCampaign.id}`;
    const params = new URLSearchParams();
    
    // Add click_id macro from network
    if (macros) {
      params.set('click_id', macros.clickId);
    }
    
    // Add sub IDs
    Object.entries(subIds).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }, [selectedCampaign, macros, subIds]);

  const postbackUrl = useMemo(() => {
    if (!postbackKey) return '';
    
    const baseUrl = `https://rdajybqalmsdycxsruon.supabase.co/functions/v1/postback`;
    const params = new URLSearchParams();
    params.set('key', postbackKey.key);
    params.set('click_id', '{click_id}');
    params.set('payout', macros?.payout || '{payout}');
    params.set('status', 'approved');

    return `${baseUrl}?${params.toString()}`;
  }, [postbackKey, macros]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5 text-brand-teal" />
          Link Builder
        </CardTitle>
        <CardDescription>
          Generate tracking and postback URLs with network-specific macros
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="build" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="build">Build Links</TabsTrigger>
            <TabsTrigger value="macros">Macro Reference</TabsTrigger>
          </TabsList>

          <TabsContent value="build" className="space-y-6 pt-4">
            {/* Step 1: Select Network */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full h-6 w-6 p-0 flex items-center justify-center">1</Badge>
                <Label className="font-medium">Select Network Account</Label>
              </div>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a network account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.network_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Select Campaign */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full h-6 w-6 p-0 flex items-center justify-center">2</Badge>
                <Label className="font-medium">Select Campaign</Label>
              </div>
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 3: Sub IDs (optional) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full h-6 w-6 p-0 flex items-center justify-center">3</Badge>
                <Label className="font-medium">Sub IDs (Optional)</Label>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Object.keys(subIds).map((key) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{key}</Label>
                    <Input
                      value={subIds[key as keyof typeof subIds]}
                      onChange={e => setSubIds(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`{${key}}`}
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Generated URLs */}
            {selectedCampaign && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-success" />
                      Tracking URL
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(trackingUrl, 'Tracking URL')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-muted p-3 rounded-lg font-mono text-xs break-all">
                    {trackingUrl}
                  </div>
                </div>

                {postbackKey && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-brand-teal" />
                        Postback URL
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(postbackUrl, 'Postback URL')}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-muted p-3 rounded-lg font-mono text-xs break-all">
                      {postbackUrl}
                    </div>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Add this postback URL to your network's conversion tracking settings.
                        Replace <code className="bg-muted px-1 rounded">{'{click_id}'}</code> with 
                        the network's click ID macro if needed.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="macros" className="pt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use these macros in your offer URLs or postback configurations:
              </p>
              <div className="grid gap-3">
                {Object.entries(NETWORK_MACROS).map(([network, networkMacros]) => (
                  <div key={network} className="border rounded-lg p-4">
                    <h4 className="font-medium capitalize mb-2">{network}</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Click ID:</span>
                        <code className="ml-2 bg-muted px-1.5 py-0.5 rounded text-xs">
                          {networkMacros.clickId}
                        </code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sub ID:</span>
                        <code className="ml-2 bg-muted px-1.5 py-0.5 rounded text-xs">
                          {networkMacros.subId}
                        </code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payout:</span>
                        <code className="ml-2 bg-muted px-1.5 py-0.5 rounded text-xs">
                          {networkMacros.payout}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
