import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, AlertCircle, CheckCircle, Loader2, Trash2, RefreshCw, Plus, Copy } from 'lucide-react';
import { useTrackingDomains, type TrackingDomain } from '@/hooks/useTrackingDomains';
import { useTrackingDomain } from '@/hooks/useTrackingDomain';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

export function TrackingDomainSettings() {
  const { domains, isLoading, addDomain, isAdding, verifyDomain, isVerifying, deleteDomain, getVerifiedDomain } = useTrackingDomains();
  const { config, updateDomain, isUpdating } = useTrackingDomain();
  const { toast } = useToast();
  const [newDomain, setNewDomain] = useState('');
  const [useCustom, setUseCustom] = useState(config.use_custom_domain);

  const verifiedDomain = getVerifiedDomain();

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    addDomain(newDomain.trim(), {
      onSuccess: () => setNewDomain(''),
    });
  };

  const handleToggleCustom = (enabled: boolean) => {
    setUseCustom(enabled);
    if (verifiedDomain) {
      updateDomain({
        custom_domain: verifiedDomain.domain,
        use_custom_domain: enabled,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="bg-gradient-card border-card-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-brand-teal" />
          Tracking Domains
        </CardTitle>
        <CardDescription>
          Configure custom tracking domains for branded links
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Domain */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Add Custom Domain</Label>
          <div className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="track.yourdomain.com"
              className="bg-background-secondary border-card-border"
            />
            <Button 
              onClick={handleAddDomain}
              disabled={isAdding || !newDomain.trim()}
              className="bg-gradient-brand hover:opacity-90"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Domain List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : domains.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell className="font-mono text-sm">{domain.domain}</TableCell>
                  <TableCell>{getStatusBadge(domain.verification_status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {domain.verification_status !== 'verified' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => verifyDomain(domain.id)}
                          disabled={isVerifying}
                        >
                          <RefreshCw className={`h-4 w-4 ${isVerifying ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDomain(domain.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No custom domains configured yet.</p>
          </div>
        )}

        {/* Use Custom Domain Toggle */}
        {verifiedDomain && (
          <div className="flex items-center justify-between pt-4 border-t border-card-border">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Use Custom Domain</Label>
              <div className="text-sm text-muted-foreground">
                Use {verifiedDomain.domain} for tracking links
              </div>
            </div>
            <Switch
              checked={useCustom}
              onCheckedChange={handleToggleCustom}
              disabled={isUpdating}
            />
          </div>
        )}

        {/* DNS Configuration Guide */}
        <div className="pt-4 border-t border-card-border space-y-4">
          <h4 className="font-medium">DNS Configuration</h4>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">Option 1</Badge>
              <div className="flex-1">
                <p className="text-sm font-medium">CNAME Record (Recommended)</p>
                <div className="mt-1 bg-muted p-2 rounded text-xs font-mono flex items-center justify-between">
                  <span>your-domain → rdajybqalmsdycxsruon.supabase.co</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard('rdajybqalmsdycxsruon.supabase.co')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">Option 2</Badge>
              <div className="flex-1">
                <p className="text-sm font-medium">TXT Record</p>
                <p className="text-xs text-muted-foreground mb-1">
                  Add to _cpazen.your-domain with your verification token
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              DNS changes can take up to 48 hours to propagate. Click the refresh button to verify once configured.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
