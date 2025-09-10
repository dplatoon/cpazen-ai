import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Target, Zap, Settings, Globe, BarChart3 } from "lucide-react";

export function FeatureAudit() {
  const features = [
    {
      name: "Offer Management",
      icon: <Zap className="h-5 w-5 text-success" />,
      status: "✅ Complete",
      description: "Browse, add, and manage CPA offers with network integration",
      details: [
        "Manual offer entry with full details",
        "Network integration (MaxBounty, ClickDealer, Everflow, ShareASale, CPA Junction)",
        "Offer status management and filtering",
        "Country targeting and payout display",
        "Network badges with branded colors"
      ]
    },
    {
      name: "Network Integration",
      icon: <Settings className="h-5 w-5 text-success" />,
      status: "✅ Complete",
      description: "Connect to major affiliate networks with API credentials",
      details: [
        "Support for 6+ major networks",
        "API credential management",
        "Postback URL generation",
        "Network-specific configuration",
        "Integrated in offer dialog"
      ]
    },
    {
      name: "Campaign Management", 
      icon: <Target className="h-5 w-5 text-success" />,
      status: "✅ Complete",
      description: "Create and manage tracking campaigns with real-time metrics",
      details: [
        "Campaign creation with offer selection",
        "Status management (Active/Paused/Stopped)",
        "Performance metrics (clicks, conversions, revenue)",
        "Campaign filtering and search",
        "Integration with offer selection"
      ]
    },
    {
      name: "Tracking Links",
      icon: <Globe className="h-5 w-5 text-success" />,
      status: "✅ Enhanced",
      description: "Custom branded tracking domains with click tracking",
      details: [
        "Custom domain configuration (track.cpazen.com)",
        "Branded URLs instead of raw Supabase URLs",
        "Click tracking with sub_id support",
        "Copy-to-clipboard functionality",
        "Format: https://track.cpazen.com/c/{campaign_id}?sub={sub_id}"
      ]
    },
    {
      name: "Analytics Dashboard",
      icon: <BarChart3 className="h-5 w-5 text-success" />,
      status: "✅ Complete", 
      description: "Real-time performance tracking and reporting",
      details: [
        "KPI cards with key metrics",
        "Revenue charts and trends",
        "Campaign performance metrics",
        "Top performing campaigns",
        "Real-time click and conversion tracking"
      ]
    },
    {
      name: "Integration Documentation",
      icon: <Settings className="h-5 w-5 text-success" />,
      status: "✅ Enhanced",
      description: "Complete setup guide with tracking domain configuration",
      details: [
        "Tracking link format documentation",
        "Postback endpoint configuration", 
        "Security token generation",
        "Custom domain settings panel",
        "Network-specific integration guides"
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Cpazen Feature Audit</h2>
        <p className="text-muted-foreground">Complete CPA tracking platform with network integrations</p>
      </div>

      <div className="grid gap-6">
        {features.map((feature) => (
          <Card key={feature.name} className="bg-gradient-card border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {feature.icon}
                  {feature.name}
                </div>
                <Badge className="bg-success/10 text-success border-success/20">
                  {feature.status}
                </Badge>
              </CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feature.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-foreground-muted">{detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-brand/10 border-brand-teal/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <h3 className="text-lg font-semibold">Platform Ready</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            All core CPA tracking features are implemented and ready for production use. 
            The platform now supports custom tracking domains, network integrations, 
            comprehensive campaign management, and real-time analytics.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-brand-teal">6+</div>
              <div className="text-sm text-muted-foreground">Network Integrations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-teal">∞</div>
              <div className="text-sm text-muted-foreground">Campaign Capacity</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-teal">Real-time</div>
              <div className="text-sm text-muted-foreground">Analytics</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-teal">Custom</div>
              <div className="text-sm text-muted-foreground">Tracking Domains</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}