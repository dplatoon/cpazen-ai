import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, AlertCircle, CheckCircle } from 'lucide-react';
import { useTrackingDomain } from '@/hooks/useTrackingDomain';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function TrackingDomainSettings() {
  const { config, updateDomain, isUpdating } = useTrackingDomain();
  const [customDomain, setCustomDomain] = useState(config.custom_domain || '');
  const [useCustom, setUseCustom] = useState(config.use_custom_domain);

  const handleSave = () => {
    updateDomain({
      custom_domain: customDomain,
      use_custom_domain: useCustom,
    });
  };

  const hasChanges = 
    customDomain !== config.custom_domain || 
    useCustom !== config.use_custom_domain;

  return (
    <Card className="bg-gradient-card border-card-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-brand-teal" />
          Tracking Domain
        </CardTitle>
        <CardDescription>
          Configure your custom tracking domain for branded links
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Custom domains require DNS configuration. Contact support for setup assistance.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Use Custom Domain</Label>
              <div className="text-sm text-muted-foreground">
                Use your own branded domain instead of the default Supabase URL
              </div>
            </div>
            <Switch
              checked={useCustom}
              onCheckedChange={setUseCustom}
            />
          </div>

          {useCustom && (
            <div className="space-y-2">
              <Label htmlFor="custom-domain">Custom Domain</Label>
              <Input
                id="custom-domain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="track.yourdomain.com"
                className="bg-background-secondary border-card-border"
              />
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Current</Badge>
                <code className="text-xs bg-background-secondary px-2 py-1 rounded border">
                  {useCustom && customDomain 
                    ? `https://${customDomain}/c/{campaign_id}?sub={sub_id}`
                    : 'https://pxdypbnzlxxvewtwkohn.supabase.co/functions/v1/track-click/{campaign_id}?sub={sub_id}'
                  }
                </code>
              </div>
            </div>
          </div>

          {hasChanges && (
            <Button 
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-gradient-brand hover:opacity-90"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>

        <div className="pt-4 border-t border-card-border">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-success mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-medium">DNS Configuration Required</div>
              <div className="text-xs text-muted-foreground">
                Point your custom domain to: pxdypbnzlxxvewtwkohn.supabase.co
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}