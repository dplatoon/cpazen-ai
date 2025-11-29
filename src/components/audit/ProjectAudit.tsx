import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Clock, XCircle, ArrowRight } from "lucide-react";

export function ProjectAudit() {
  const completedFeatures = [
    {
      name: "User Authentication",
      status: "complete",
      notes: "Email/password auth with protected routes"
    },
    {
      name: "Offer Management",
      status: "complete",
      notes: "Full CRUD with network integration support"
    },
    {
      name: "Campaign Management",
      status: "complete",
      notes: "Create, track, and manage campaigns with real-time metrics"
    },
    {
      name: "Click Tracking",
      status: "complete",
      notes: "Custom tracking domains with sub_id support"
    },
    {
      name: "Conversion Tracking",
      status: "complete",
      notes: "Postback endpoint with security token validation"
    },
    {
      name: "Analytics Dashboard",
      status: "complete",
      notes: "Real-time KPIs, charts, and performance metrics"
    },
    {
      name: "Webhook System",
      status: "complete",
      notes: "Webhook configuration and logging with signature verification"
    },
    {
      name: "Basic Fraud Detection",
      status: "complete",
      notes: "Fraud scoring with velocity and bot detection"
    },
    {
      name: "Admin Dashboard",
      status: "complete",
      notes: "Role-based access with user management and fraud monitoring"
    }
  ];

  const pendingFeatures = [
    {
      name: "IP Blacklist/Whitelist",
      status: "pending",
      blocker: "Database migration not approved",
      impact: "Medium - Enhanced traffic filtering"
    },
    {
      name: "ML-Based Fraud Patterns",
      status: "pending",
      blocker: "Database migration not approved",
      impact: "High - Improved fraud detection accuracy"
    },
    {
      name: "Webhook Testing Tools",
      status: "pending",
      blocker: "Database migration not approved",
      impact: "Medium - Better webhook debugging"
    }
  ];

  const productionReadiness = [
    {
      category: "Security",
      items: [
        { name: "RLS Policies", status: "complete", critical: true },
        { name: "Auth Configuration", status: "complete", critical: true },
        { name: "Secret Key Management", status: "complete", critical: true },
        { name: "Rate Limiting", status: "complete", critical: false }
      ]
    },
    {
      category: "Functionality",
      items: [
        { name: "Core Tracking Flow", status: "complete", critical: true },
        { name: "Postback Processing", status: "complete", critical: true },
        { name: "Analytics & Reporting", status: "complete", critical: false },
        { name: "Fraud Detection", status: "complete", critical: false }
      ]
    },
    {
      category: "Configuration",
      items: [
        { name: "Edge Functions Deployed", status: "complete", critical: true },
        { name: "Database Indexes", status: "needs-review", critical: false },
        { name: "CORS Settings", status: "complete", critical: true },
        { name: "Environment Variables", status: "complete", critical: true }
      ]
    },
    {
      category: "Testing",
      items: [
        { name: "End-to-End Click Flow", status: "needs-testing", critical: true },
        { name: "Conversion Postback", status: "needs-testing", critical: true },
        { name: "Webhook Delivery", status: "needs-testing", critical: false },
        { name: "Fraud Detection", status: "needs-testing", critical: false }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "needs-review":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "needs-testing":
        return <Clock className="h-4 w-4 text-warning" />;
      case "pending":
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      complete: "bg-success/10 text-success border-success/20",
      "needs-review": "bg-warning/10 text-warning border-warning/20",
      "needs-testing": "bg-warning/10 text-warning border-warning/20",
      pending: "bg-muted text-muted-foreground border-border"
    };
    return variants[status] || variants.pending;
  };

  const criticalIssues = productionReadiness
    .flatMap(cat => cat.items.filter(item => item.critical && item.status !== "complete"));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Project Audit</h1>
        <p className="text-muted-foreground">Comprehensive review of Cpazen CPA Tracking Platform</p>
      </div>

      {/* Critical Issues Alert */}
      {criticalIssues.length > 0 && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <AlertDescription className="text-foreground">
            <strong className="font-semibold">{criticalIssues.length} Critical Items</strong> require attention before production launch
          </AlertDescription>
        </Alert>
      )}

      {/* Overall Status */}
      <Card className="bg-gradient-card border-card-border">
        <CardHeader>
          <CardTitle>Overall Status</CardTitle>
          <CardDescription>Platform readiness assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-success mb-2">{completedFeatures.length}</div>
              <div className="text-sm text-muted-foreground">Features Complete</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-warning mb-2">{pendingFeatures.length}</div>
              <div className="text-sm text-muted-foreground">Features Pending</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-teal mb-2">
                {Math.round((completedFeatures.length / (completedFeatures.length + pendingFeatures.length)) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Features */}
      <Card className="bg-gradient-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Completed Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedFeatures.map((feature) => (
              <div key={feature.name} className="flex items-start justify-between p-3 rounded-lg bg-background/50">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">{feature.name}</div>
                    <div className="text-sm text-muted-foreground">{feature.notes}</div>
                  </div>
                </div>
                <Badge className="bg-success/10 text-success border-success/20">Complete</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Features */}
      {pendingFeatures.length > 0 && (
        <Card className="bg-gradient-card border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Pending Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingFeatures.map((feature) => (
                <div key={feature.name} className="flex items-start justify-between p-3 rounded-lg bg-background/50 border border-warning/20">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground">{feature.name}</div>
                      <div className="text-sm text-muted-foreground">Blocker: {feature.blocker}</div>
                      <div className="text-sm text-warning mt-1">Impact: {feature.impact}</div>
                    </div>
                  </div>
                  <Badge className="bg-muted text-muted-foreground border-border">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Production Readiness Checklist */}
      <Card className="bg-gradient-card border-card-border">
        <CardHeader>
          <CardTitle>Production Readiness Checklist</CardTitle>
          <CardDescription>Items to verify before launch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {productionReadiness.map((category) => (
            <div key={category.category}>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                {category.category}
                <Badge variant="outline" className="text-xs">
                  {category.items.filter(i => i.status === "complete").length}/{category.items.length}
                </Badge>
              </h3>
              <div className="space-y-2">
                {category.items.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded bg-background/50">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="text-sm text-foreground">{item.name}</span>
                      {item.critical && (
                        <Badge variant="outline" className="text-xs border-destructive text-destructive">
                          Critical
                        </Badge>
                      )}
                    </div>
                    <Badge className={getStatusBadge(item.status)}>
                      {item.status.replace("-", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-gradient-brand/10 border-brand-teal/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-brand-teal" />
            Next Steps to Production
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <Badge className="bg-brand-teal text-white shrink-0">1</Badge>
              <div>
                <div className="font-medium text-foreground">Approve Pending Database Migration</div>
                <div className="text-sm text-muted-foreground">
                  Complete IP blacklist/whitelist, ML fraud patterns, and webhook testing features
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="bg-brand-teal text-white shrink-0">2</Badge>
              <div>
                <div className="font-medium text-foreground">End-to-End Testing</div>
                <div className="text-sm text-muted-foreground">
                  Test complete click-to-conversion flow with real tracking links and postback endpoints
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="bg-brand-teal text-white shrink-0">3</Badge>
              <div>
                <div className="font-medium text-foreground">Performance Optimization</div>
                <div className="text-sm text-muted-foreground">
                  Review database indexes, add caching where needed, optimize edge function response times
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="bg-brand-teal text-white shrink-0">4</Badge>
              <div>
                <div className="font-medium text-foreground">Monitoring & Alerts</div>
                <div className="text-sm text-muted-foreground">
                  Set up monitoring for edge functions, database performance, and fraud detection accuracy
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="bg-brand-teal text-white shrink-0">5</Badge>
              <div>
                <div className="font-medium text-foreground">Documentation & Training</div>
                <div className="text-sm text-muted-foreground">
                  Finalize integration docs, create user guides, prepare support materials
                </div>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-gradient-card border-card-border">
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-brand-teal mt-1 shrink-0" />
              <span className="text-sm text-foreground">
                <strong>High Priority:</strong> Complete end-to-end testing using the testing guide in docs/END_TO_END_TESTING.md
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-brand-teal mt-1 shrink-0" />
              <span className="text-sm text-foreground">
                <strong>Database:</strong> Add composite indexes on frequently queried columns (campaign_id + created_at, user_id + status)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-brand-teal mt-1 shrink-0" />
              <span className="text-sm text-foreground">
                <strong>Security:</strong> Implement rate limiting on postback endpoint to prevent abuse
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-brand-teal mt-1 shrink-0" />
              <span className="text-sm text-foreground">
                <strong>Monitoring:</strong> Set up alerts for high fraud scores, failed webhooks, and unusual traffic patterns
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
