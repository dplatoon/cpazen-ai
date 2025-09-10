import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Code2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCampaigns } from "@/hooks/useRealData";
import { useTrackingDomain } from "@/hooks/useTrackingDomain";
import { TrackingDomainSettings } from "./TrackingDomainSettings";

export function IntegrationDocs() {
  const { toast } = useToast();
  const { data: campaigns } = useCampaigns();
  const { generateTrackingUrl, getPostbackUrl } = useTrackingDomain();
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const postbackUrl = getPostbackUrl();

  const exampleTrackingUrl = campaigns && campaigns.length > 0 
    ? generateTrackingUrl(campaigns[0].id)
    : generateTrackingUrl('{campaign_id}').replace('{campaign_id}', '{campaign_id}');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integration Guide</h1>
        <p className="text-muted-foreground mt-2">
          Set up tracking links and postback endpoints for your affiliate campaigns
        </p>
      </div>

      {/* Tracking Domain Settings */}
      <TrackingDomainSettings />

      {/* Tracking Links Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-teal" />
            Tracking Links
          </CardTitle>
          <CardDescription>
            Use these URLs to track clicks from your traffic sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">URL Format:</h4>
            <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
              <code className="text-sm">
                {generateTrackingUrl('{campaign_id}').replace('{campaign_id}', '{campaign_id}')}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generateTrackingUrl('{campaign_id}').replace('{campaign_id}', '{campaign_id}'))}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {campaigns && campaigns.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Example with your campaign:</h4>
              <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                <code className="text-sm break-all">
                  {exampleTrackingUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(exampleTrackingUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold">Parameters:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><Badge variant="outline">campaign_id</Badge> - Your campaign UUID from the campaigns page</li>
              <li><Badge variant="outline">sub_id</Badge> - Optional sub-affiliate or source ID for tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Postback Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-brand-teal" />
            Postback Endpoint
          </CardTitle>
          <CardDescription>
            Configure your affiliate network to send conversion data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Postback URL:</h4>
            <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
              <code className="text-sm">
                {postbackUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(postbackUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Required Parameters (JSON POST):</h4>
            <div className="bg-muted p-3 rounded-lg">
              <pre className="text-sm">
{`{
  "click_id": "uuid-from-tracking-link",
  "payout": 25.00,
  "status": "approved"
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Security Token (Recommended):</h4>
            <div className="bg-muted p-3 rounded-lg">
              <pre className="text-sm">
{`{
  "click_id": "uuid-from-tracking-link",
  "payout": 25.00,
  "status": "approved",
  "security_token": "sha256(click_id + your_secret_key)"
}`}
              </pre>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              The security token is SHA-256 hash of click_id concatenated with your profile secret key.
              Your secret key is kept secure server-side and never exposed to prevent unauthorized access.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Status Values:</h4>
            <div className="flex gap-2 flex-wrap">
              <Badge>approved</Badge>
              <Badge variant="secondary">pending</Badge>
              <Badge variant="destructive">rejected</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macros Section */}
      <Card>
        <CardHeader>
          <CardTitle>Offer URL Macros</CardTitle>
          <CardDescription>
            Use these macros in your offer URLs to pass tracking data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <code className="font-semibold">{'{click_id}'}</code>
                <p className="text-sm text-muted-foreground">Replaced with unique click identifier</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <code className="font-semibold">{'{sub_id}'}</code>
                <p className="text-sm text-muted-foreground">Appended as query parameter if provided</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <a
                href="https://supabase.com/dashboard/project/pxdypbnzlxxvewtwkohn/functions"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Edge Function Logs
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}