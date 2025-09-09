import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Link, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NetworkIntegrationFormProps {
  onSuccess: () => void;
}

const SUPPORTED_NETWORKS = [
  {
    name: 'MaxBounty',
    id: 'maxbounty',
    description: 'Leading CPA network with high-converting offers',
    fields: ['API Key', 'Affiliate ID'],
    postbackUrl: 'https://www.maxbounty.com/pixel/fire/?t={click_id}&payout={payout}',
    logo: '🎯'
  },
  {
    name: 'Everflow',
    id: 'everflow',
    description: 'Performance marketing platform',
    fields: ['API Token', 'Network ID'],
    postbackUrl: 'https://tracking.everflow.io/p.ashx?pid={offer_id}&cid={click_id}&payout={payout}',
    logo: '🌊'
  },
  {
    name: 'ShareASale',
    id: 'shareasale',
    description: 'Established affiliate network',
    fields: ['Affiliate ID', 'API Token', 'API Secret'],
    postbackUrl: 'https://www.shareasale.com/sale.cfm?tracking={click_id}&amount={payout}',
    logo: '🤝'
  },
  {
    name: 'CPA Junction',
    id: 'cpajunction',
    description: 'Performance-based affiliate network',
    fields: ['API Key', 'Publisher ID'],
    postbackUrl: 'https://cpajunction.com/postback?subid={click_id}&payout={payout}',
    logo: '⚡'
  },
  {
    name: 'ClickDealer',
    id: 'clickdealer',
    description: 'Global performance marketing network',
    fields: ['API Key', 'Affiliate ID'],
    postbackUrl: 'https://clickdealer.com/postback?clickid={click_id}&payout={payout}',
    logo: '🎰'
  },
  {
    name: 'CrakRevenue',
    id: 'crakrevenue',
    description: 'Adult and mainstream offers',
    fields: ['API Key', 'Webmaster ID'],
    postbackUrl: 'https://crakrevenue.com/postback?t1={click_id}&payout={payout}',
    logo: '💰'
  }
];

export const NetworkIntegrationForm = ({ onSuccess }: NetworkIntegrationFormProps) => {
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const network = SUPPORTED_NETWORKS.find(n => n.id === selectedNetwork);

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleConnect = async () => {
    if (!network) return;

    setIsConnecting(true);
    try {
      // Here you would typically make an API call to test the credentials
      // and fetch available offers from the network
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Integration Successful',
        description: `Connected to ${network.name}. Offers will be synced automatically.`,
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: 'Integration Failed',
        description: 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Select Affiliate Network</Label>
        <p className="text-sm text-foreground-muted mb-3">
          Choose a network to integrate and automatically sync offers
        </p>
        <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a network..." />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_NETWORKS.map((network) => (
              <SelectItem key={network.id} value={network.id}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{network.logo}</span>
                  {network.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {network && (
        <Card className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{network.logo}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{network.name}</h3>
              <p className="text-sm text-foreground-muted">{network.description}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              <Settings className="w-3 h-3 mr-1" />
              API Integration
            </Badge>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">API Credentials</Label>
            {network.fields.map((field) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={field} className="text-xs text-foreground-muted">
                  {field}
                </Label>
                <Input
                  id={field}
                  type={field.toLowerCase().includes('secret') ? 'password' : 'text'}
                  placeholder={`Enter your ${field.toLowerCase()}`}
                  value={credentials[field] || ''}
                  onChange={(e) => handleCredentialChange(field, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Link className="w-4 h-4" />
              Postback URL
            </Label>
            <div className="bg-background-secondary p-2 rounded border text-xs font-mono break-all">
              {network.postbackUrl}
            </div>
            <p className="text-xs text-foreground-muted">
              Configure this URL in your {network.name} account for conversion tracking
            </p>
          </div>

          <Button 
            onClick={handleConnect}
            disabled={isConnecting || !network.fields.every(field => credentials[field])}
            className="w-full bg-gradient-brand hover:opacity-90 transition-opacity"
          >
            {isConnecting ? 'Connecting...' : `Connect to ${network.name}`}
          </Button>
        </Card>
      )}

      <Card className="p-4 bg-blue-50/50 border-blue-200">
        <div className="flex items-start gap-2">
          <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Need API Credentials?</h4>
            <p className="text-sm text-blue-700 mt-1">
              Contact your affiliate manager or check your network dashboard to get API access credentials.
              Most networks provide these in the "Developer" or "API" section.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};