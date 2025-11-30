import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Copy, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';

export function ClickToConversionTester() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [testSubId, setTestSubId] = useState('test_sub_123');
  const [generatedClickId, setGeneratedClickId] = useState<string>('');
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [postbackPayout, setPostbackPayout] = useState('25.00');
  const [postbackStatus, setPostbackStatus] = useState('approved');

  // Fetch active campaigns
  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, status')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Generate test click
  const generateClickMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCampaignId) throw new Error('Please select a campaign');
      
      const { data: click, error } = await supabase
        .from('clicks')
        .insert({
          campaign_id: selectedCampaignId,
          user_id: user!.id,
          sub_id: testSubId,
          ip_address: '203.0.113.42',
          user_agent: 'Mozilla/5.0 (Test Browser)',
          country: 'US',
          device: 'Desktop',
          os: 'Windows',
          browser: 'Chrome',
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return click;
    },
    onSuccess: (click) => {
      setGeneratedClickId(click.id);
      const url = `https://pxdypbnzlxxvewtwkohn.supabase.co/functions/v1/track-click/${selectedCampaignId}?sub=${testSubId}`;
      setTrackingUrl(url);
      toast({
        title: "Test Click Generated",
        description: `Click ID: ${click.id}`,
      });
      queryClient.invalidateQueries({ queryKey: ['clicks'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test postback
  const testPostbackMutation = useMutation({
    mutationFn: async () => {
      if (!generatedClickId) throw new Error('Generate a test click first');
      
      const postbackUrl = `https://pxdypbnzlxxvewtwkohn.supabase.co/functions/v1/postback?cid=${generatedClickId}&payout=${postbackPayout}&status=${postbackStatus}`;
      
      const response = await fetch(postbackUrl);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Postback failed');
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Postback Successful",
        description: "Conversion recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['conversions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Postback Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Generate Test Click */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3">1</Badge>
            <div>
              <CardTitle>Generate Test Click</CardTitle>
              <CardDescription>Create a test click to simulate user traffic</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign">Select Campaign</Label>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns?.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subid">Sub ID (Optional)</Label>
            <Input
              id="subid"
              value={testSubId}
              onChange={(e) => setTestSubId(e.target.value)}
              placeholder="test_sub_123"
            />
          </div>

          <Button
            onClick={() => generateClickMutation.mutate()}
            disabled={!selectedCampaignId || generateClickMutation.isPending}
            className="w-full"
          >
            {generateClickMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Test Click'
            )}
          </Button>

          {generatedClickId && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Click Generated Successfully!</strong>
                <br />
                Click ID: <code className="bg-white px-2 py-1 rounded">{generatedClickId}</code>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Tracking URL */}
      {trackingUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-3">2</Badge>
              <div>
                <CardTitle>Tracking URL</CardTitle>
                <CardDescription>Use this URL to simulate real traffic</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Generated Tracking Link</Label>
              <div className="flex gap-2">
                <Input value={trackingUrl} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(trackingUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(trackingUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Testing Tip:</strong> Click this URL in a new tab to simulate real traffic.
                The edge function will redirect you to the offer URL and log the click data.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Test Postback */}
      {generatedClickId && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-3">3</Badge>
              <div>
                <CardTitle>Test Postback</CardTitle>
                <CardDescription>Simulate a conversion from the affiliate network</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payout">Payout Amount</Label>
                <Input
                  id="payout"
                  type="number"
                  step="0.01"
                  value={postbackPayout}
                  onChange={(e) => setPostbackPayout(e.target.value)}
                  placeholder="25.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Conversion Status</Label>
                <Select value={postbackStatus} onValueChange={setPostbackStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Postback URL:</strong>
                <br />
                <code className="text-xs bg-muted p-1 rounded block mt-1 break-all">
                  {`https://pxdypbnzlxxvewtwkohn.supabase.co/functions/v1/postback?cid=${generatedClickId}&payout=${postbackPayout}&status=${postbackStatus}`}
                </code>
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => testPostbackMutation.mutate()}
              disabled={testPostbackMutation.isPending}
              className="w-full"
              variant="default"
            >
              {testPostbackMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Postback...
                </>
              ) : (
                'Fire Test Postback'
              )}
            </Button>

            {testPostbackMutation.isSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Conversion Recorded!</strong> Check your Analytics page to see the conversion.
                </AlertDescription>
              </Alert>
            )}

            {testPostbackMutation.isError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Postback Failed:</strong> {testPostbackMutation.error?.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!campaigns?.length && !loadingCampaigns && (
        <Alert>
          <AlertDescription>
            <strong>No Active Campaigns:</strong> Create a campaign with an active offer first to start testing.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
