import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, Zap, Globe, MousePointer, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { useSmartlink } from '@/hooks/useSmartlink';
import { useToast } from '@/hooks/use-toast';

export function SmartlinkManager() {
  const { getSmartlinkUrl, stats, isLoading } = useSmartlink();
  const { toast } = useToast();
  const [subId, setSubId] = useState('');
  const [copied, setCopied] = useState(false);

  const smartlinkUrl = getSmartlinkUrl(subId || undefined);

  const copyLink = () => {
    navigator.clipboard.writeText(smartlinkUrl);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Smartlink URL copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    { label: 'Total Clicks', value: stats.totalClicks.toLocaleString(), icon: MousePointer, color: 'text-brand-teal' },
    { label: 'Conversions', value: stats.totalConversions.toLocaleString(), icon: TrendingUp, color: 'text-success' },
    { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: 'text-secondary' },
    { label: 'EPC', value: `$${stats.epc.toFixed(4)}`, icon: BarChart3, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6">
      {/* How Smartlink Works */}
      <Card className="bg-gradient-to-br from-brand-teal/5 to-secondary/5 border-brand-teal/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-brand-teal" />
            Smartlink — Auto-Route Traffic to Best Offers
          </CardTitle>
          <CardDescription>
            One link for ALL your traffic. CPAZen AI automatically routes each visitor to the highest-paying offer that matches their geo, device, and browsing profile. No more manual offer selection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { step: '1', title: 'Send Traffic', desc: 'Use one Smartlink URL for all sources', icon: '🔗' },
              { step: '2', title: 'AI Routes', desc: 'Geo + device + payout optimization', icon: '🤖' },
              { step: '3', title: 'Max Revenue', desc: 'Always the best-paying offer', icon: '💰' },
            ].map(s => (
              <div key={s.step} className="p-3 rounded-lg bg-card/50 border border-card-border/50">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xs font-bold text-foreground">{s.title}</div>
                <div className="text-xs text-foreground-muted mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate Smartlink */}
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="text-lg">Your Smartlink</CardTitle>
          <CardDescription>Add a sub ID to segment your traffic sources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-foreground-muted">Sub ID (optional — for tracking sources)</Label>
            <Input
              placeholder="e.g., facebook, tiktok, email-campaign-1"
              value={subId}
              onChange={(e) => setSubId(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 bg-background/50 border border-card-border rounded-lg p-3 font-mono text-xs text-foreground-muted break-all select-all">
              {smartlinkUrl}
            </div>
            <Button
              onClick={copyLink}
              variant="outline"
              className={copied ? 'bg-success/10 border-success/30 text-success' : 'border-brand-teal/30 text-brand-teal hover:bg-brand-teal/10'}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {['facebook', 'tiktok', 'google', 'native', 'push', 'email'].map(source => (
              <Button
                key={source}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => setSubId(source)}
              >
                {source}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card key={card.label} className="bg-card border-card-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <card.icon className={`h-4 w-4 ${card.color}`} />
                <div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-14" />
                  ) : (
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  )}
                  <p className="text-xs text-foreground-muted">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Geo Distribution */}
      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand-teal" />
            Traffic by Country
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : stats.topCountries.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No traffic data yet. Share your Smartlink to start routing traffic!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.topCountries.map((geo, i) => {
                const maxClicks = stats.topCountries[0]?.clicks || 1;
                const pct = (geo.clicks / maxClicks) * 100;
                return (
                  <div key={geo.country} className="flex items-center gap-3">
                    <span className="w-8 text-xs font-mono text-foreground-muted text-right">{i + 1}.</span>
                    <Badge variant="outline" className="w-12 justify-center text-xs font-bold">
                      {geo.country}
                    </Badge>
                    <div className="flex-1 h-6 bg-background/50 rounded-md overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-brand-teal/30 to-brand-teal/10 rounded-md transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-foreground">
                        {geo.clicks.toLocaleString()} clicks
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
