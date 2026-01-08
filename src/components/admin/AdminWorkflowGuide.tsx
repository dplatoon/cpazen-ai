import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Package, 
  Users, 
  Link2, 
  ArrowRight, 
  CheckCircle2, 
  Target,
  Globe,
  Bell,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'rdajybqalmsdycxsruon';

export function AdminWorkflowGuide() {
  const trackClickUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/track-click`;
  const postbackUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/postback`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Admin Workflow Guide
          </CardTitle>
          <CardDescription>
            Complete guide for managing offers, affiliates, and tracking on CPAzen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Flow Overview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Platform Flow Overview</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                Admin Creates Offer
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Affiliate Sees Offer
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Creates Campaign
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Gets Tracking Link
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Drives Traffic
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="flex items-center gap-1">
                <Bell className="h-3 w-3" />
                Postback → Conversion
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Step 1: Adding Offers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                1
              </div>
              <h3 className="text-lg font-semibold">Add Offers for Affiliates</h3>
            </div>
            <div className="ml-10 space-y-2">
              <p className="text-muted-foreground">
                Navigate to the <strong>Offers</strong> tab in this Admin Dashboard to manage all offers.
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Click <strong>"Add Offer"</strong> button</li>
                <li>Fill in offer details: Name, URL, Payout, Network, Countries</li>
                <li>Set <strong>Daily Cap</strong> if the network has conversion limits</li>
                <li>Set status to <strong>"Active"</strong> for affiliates to see the offer</li>
                <li>Only <strong>Active</strong> offers appear in the Affiliate Hub</li>
              </ul>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm">Affiliates will see offers in their Affiliate Hub automatically</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Step 2: Managing Users */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                2
              </div>
              <h3 className="text-lg font-semibold">Manage Affiliates & Users</h3>
            </div>
            <div className="ml-10 space-y-2">
              <p className="text-muted-foreground">
                Use the <strong>User Management</strong> tab to control user access and roles.
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>View all registered users and their activity</li>
                <li>Change user roles: <strong>Admin</strong>, <strong>Affiliate</strong>, or <strong>Manager</strong></li>
                <li>Disable or suspend problematic accounts</li>
                <li>View individual user activity logs</li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Step 3: Tracking Setup */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                3
              </div>
              <h3 className="text-lg font-semibold">Tracking Link Format (For Affiliates)</h3>
            </div>
            <div className="ml-10 space-y-3">
              <p className="text-muted-foreground">
                When affiliates create campaigns, they get tracking links in this format:
              </p>
              <div className="bg-muted rounded-lg p-3 font-mono text-sm break-all">
                <div className="flex items-center justify-between gap-2">
                  <code>{trackClickUrl}/&#123;campaign_id&#125;?sub=&#123;sub_id&#125;</code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(trackClickUrl, 'Track click URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li><strong>campaign_id</strong>: Unique identifier for the campaign</li>
                <li><strong>sub</strong>: Optional sub-ID for tracking traffic sources</li>
                <li>Additional parameters: <code>sub2</code>, <code>sub3</code>, <code>sub4</code>, <code>sub5</code></li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Step 4: Postback Configuration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                4
              </div>
              <h3 className="text-lg font-semibold">Postback Configuration (Network Setup)</h3>
            </div>
            <div className="ml-10 space-y-3">
              <p className="text-muted-foreground">
                Configure affiliate networks to send conversion postbacks to CPAzen:
              </p>
              <div className="bg-muted rounded-lg p-3 font-mono text-sm break-all">
                <div className="flex items-center justify-between gap-2">
                  <code>{postbackUrl}?cid=&#123;click_id&#125;&payout=&#123;payout&#125;</code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(postbackUrl, 'Postback URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">MaxBounty Format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="text-xs break-all">
                      {postbackUrl}?cid=#s1#&payout=#price#&status=approved
                    </code>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Everflow Format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="text-xs break-all">
                      {postbackUrl}?cid=&#123;sub1&#125;&payout=&#123;payout&#125;&status=approved
                    </code>
                  </CardContent>
                </Card>
              </div>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground mt-2">
                <li><strong>cid</strong>: The click ID passed in tracking link (required)</li>
                <li><strong>payout</strong>: Conversion amount (optional, uses offer payout if not provided)</li>
                <li><strong>status</strong>: Conversion status - approved, pending, rejected (default: approved)</li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Step 5: Monitoring */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                5
              </div>
              <h3 className="text-lg font-semibold">Monitor Activity & Fraud</h3>
            </div>
            <div className="ml-10 space-y-2">
              <p className="text-muted-foreground">
                Use the dashboard tabs to monitor platform health:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li><strong>Recent Activity</strong>: Real-time view of all clicks, conversions, and campaigns</li>
                <li><strong>Audit Logs</strong>: Track all admin and user actions for compliance</li>
                <li><strong>Fraud Alerts</strong>: Review and resolve suspicious activity</li>
                <li>Use the <strong>Fraud Monitoring</strong> page for detailed fraud analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
