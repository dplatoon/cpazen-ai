import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Edge functions to monitor
const EDGE_FUNCTIONS = [
  "track-click",
  "postback",
  "ai-campaign-optimizer",
  "ai-chat",
  "ai-offer-description",
  "fraud-detection",
  "bot-detection",
];

async function checkEdgeFunction(functionName: string): Promise<any> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/${functionName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ health_check: true }),
      }
    );

    const responseTime = Date.now() - startTime;
    const isHealthy = response.status < 500;

    return {
      name: functionName,
      status: isHealthy ? "healthy" : "unhealthy",
      statusCode: response.status,
      responseTime,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: functionName,
      status: "error",
      statusCode: 0,
      responseTime: Date.now() - startTime,
      error: error.message,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function getDatabaseMetrics(supabase: any): Promise<any> {
  try {
    const startTime = Date.now();

    const [clicksCount, conversionsCount, campaignsCount] = await Promise.all([
      supabase.from("clicks").select("*", { count: "exact", head: true }),
      supabase.from("conversions").select("*", { count: "exact", head: true }),
      supabase.from("campaigns").select("*", { count: "exact", head: true }),
    ]);

    const queryTime = Date.now() - startTime;

    return {
      status: "healthy",
      responseTime: queryTime,
      tables: {
        clicks: clicksCount.count || 0,
        conversions: conversionsCount.count || 0,
        campaigns: campaignsCount.count || 0,
      },
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "error",
      error: error.message,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function getErrorRates(supabase: any): Promise<any> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: totalClicks } = await supabase
      .from("clicks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo);

    const { count: botClicks } = await supabase
      .from("clicks")
      .select("*", { count: "exact", head: true })
      .eq("is_bot", true)
      .gte("created_at", twentyFourHoursAgo);

    return {
      period: "24h",
      totalClicks: totalClicks || 0,
      botClicks: botClicks || 0,
      botRate: totalClicks ? ((botClicks / totalClicks) * 100).toFixed(2) : 0,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      error: error.message,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function getHighFraudScoreClicks(supabase: any): Promise<any> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Get clicks with fraud score >= 70 (high risk)
    const { data: highFraudClicks, count } = await supabase
      .from("clicks")
      .select("id, campaign_id, fraud_score, ip_address, country, created_at", { count: "exact" })
      .gte("fraud_score", 70)
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(20);

    return {
      count: count || 0,
      recentClicks: highFraudClicks || [],
      threshold: 70,
      period: "24h",
    };
  } catch (error) {
    console.error("Error fetching high fraud score clicks:", error);
    return {
      count: 0,
      recentClicks: [],
      threshold: 70,
      period: "24h",
      error: error.message,
    };
  }
}

async function getFailedPostbacks(supabase: any): Promise<any> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Get failed webhook deliveries (status code >= 400 or null)
    const { data: failedWebhooks, count } = await supabase
      .from("webhook_logs")
      .select("id, webhook_id, event_type, response_status, delivered_at, response_body", { count: "exact" })
      .or("response_status.gte.400,response_status.is.null")
      .gte("delivered_at", twentyFourHoursAgo)
      .order("delivered_at", { ascending: false })
      .limit(20);

    // Also check for conversion postbacks that might have failed
    const { count: totalConversions } = await supabase
      .from("conversions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo);

    return {
      failedCount: count || 0,
      recentFailures: failedWebhooks || [],
      totalConversions: totalConversions || 0,
      period: "24h",
    };
  } catch (error) {
    console.error("Error fetching failed postbacks:", error);
    return {
      failedCount: 0,
      recentFailures: [],
      totalConversions: 0,
      period: "24h",
      error: error.message,
    };
  }
}

async function getPendingFraudAlerts(supabase: any): Promise<any> {
  try {
    const { data: pendingAlerts, count } = await supabase
      .from("fraud_alerts")
      .select("id, alert_type, severity, description, created_at, campaign_id", { count: "exact" })
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20);

    const highSeverityCount = pendingAlerts?.filter((a: any) => a.severity === "high").length || 0;
    const mediumSeverityCount = pendingAlerts?.filter((a: any) => a.severity === "medium").length || 0;

    return {
      totalPending: count || 0,
      highSeverity: highSeverityCount,
      mediumSeverity: mediumSeverityCount,
      recentAlerts: pendingAlerts || [],
    };
  } catch (error) {
    console.error("Error fetching pending fraud alerts:", error);
    return {
      totalPending: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      recentAlerts: [],
      error: error.message,
    };
  }
}

async function generateAlerts(
  edgeFunctions: any[],
  highFraudClicks: any,
  failedPostbacks: any,
  fraudAlerts: any,
  errorRates: any
): Promise<any[]> {
  const alerts: any[] = [];

  // Edge function errors
  const unhealthyFunctions = edgeFunctions.filter(f => f.status !== "healthy");
  unhealthyFunctions.forEach(func => {
    alerts.push({
      id: `ef-${func.name}`,
      type: "edge_function_error",
      severity: "high",
      title: `Edge Function Error: ${func.name}`,
      description: func.error || `Function returned status ${func.statusCode}`,
      timestamp: func.lastChecked,
    });
  });

  // High fraud score alerts
  if (highFraudClicks.count >= 10) {
    alerts.push({
      id: "fraud-high-volume",
      type: "high_fraud_score",
      severity: highFraudClicks.count >= 50 ? "high" : "medium",
      title: "High Volume of Fraudulent Clicks",
      description: `${highFraudClicks.count} clicks with fraud score ≥70 in the last 24 hours`,
      timestamp: new Date().toISOString(),
    });
  }

  // Failed postback alerts
  if (failedPostbacks.failedCount > 0) {
    alerts.push({
      id: "postback-failures",
      type: "failed_postback",
      severity: failedPostbacks.failedCount >= 10 ? "high" : "medium",
      title: "Failed Webhook Deliveries",
      description: `${failedPostbacks.failedCount} webhook deliveries failed in the last 24 hours`,
      timestamp: new Date().toISOString(),
    });
  }

  // Pending fraud alerts
  if (fraudAlerts.highSeverity > 0) {
    alerts.push({
      id: "fraud-alerts-pending",
      type: "pending_fraud_alert",
      severity: "high",
      title: "Unresolved High-Severity Fraud Alerts",
      description: `${fraudAlerts.highSeverity} high-severity fraud alerts pending review`,
      timestamp: new Date().toISOString(),
    });
  }

  // High bot rate alert
  const botRate = parseFloat(errorRates.botRate || 0);
  if (botRate >= 20) {
    alerts.push({
      id: "high-bot-rate",
      type: "high_bot_rate",
      severity: botRate >= 40 ? "high" : "medium",
      title: "High Bot Traffic Rate",
      description: `Bot rate is ${botRate}% in the last 24 hours`,
      timestamp: new Date().toISOString(),
    });
  }

  return alerts.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// Trigger monitoring alerts if high-severity issues detected
async function triggerMonitoringAlerts(
  alerts: any[],
  healthScore: number,
  systemStatus: string
): Promise<void> {
  const highSeverityAlerts = alerts.filter(a => a.severity === "high");
  
  // Only send alerts if there are high-severity issues
  if (highSeverityAlerts.length === 0) {
    return;
  }

  try {
    const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/monitoring-alerts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "X-Internal-Secret": internalSecret || "",
        },
        body: JSON.stringify({
          alerts,
          healthScore,
          systemStatus,
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to send monitoring alerts:", await response.text());
    } else {
      console.log("Monitoring alerts sent successfully");
    }
  } catch (error) {
    console.error("Error triggering monitoring alerts:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for optional parameters
    const body = await req.json().catch(() => ({}));
    const sendAlerts = body.send_alerts !== false; // Default to true

    // Check all edge functions in parallel
    const edgeFunctionChecks = await Promise.all(
      EDGE_FUNCTIONS.map(checkEdgeFunction)
    );

    // Get all metrics in parallel
    const [databaseMetrics, errorRates, highFraudClicks, failedPostbacks, fraudAlerts] = await Promise.all([
      getDatabaseMetrics(supabase),
      getErrorRates(supabase),
      getHighFraudScoreClicks(supabase),
      getFailedPostbacks(supabase),
      getPendingFraudAlerts(supabase),
    ]);

    // Generate alerts based on metrics
    const alerts = await generateAlerts(
      edgeFunctionChecks,
      highFraudClicks,
      failedPostbacks,
      fraudAlerts,
      errorRates
    );

    // Calculate overall health
    const healthyFunctions = edgeFunctionChecks.filter(f => f.status === "healthy").length;
    const totalFunctions = edgeFunctionChecks.length;
    
    // Adjust health score based on alerts
    let healthScore = (healthyFunctions / totalFunctions) * 100;
    const highSeverityAlerts = alerts.filter(a => a.severity === "high").length;
    const mediumSeverityAlerts = alerts.filter(a => a.severity === "medium").length;
    healthScore -= highSeverityAlerts * 15;
    healthScore -= mediumSeverityAlerts * 5;
    healthScore = Math.max(0, healthScore);

    const systemStatus = healthScore >= 90 ? "healthy" : healthScore >= 70 ? "degraded" : "unhealthy";

    // Trigger email alerts for high-severity issues (run in background)
    if (sendAlerts && highSeverityAlerts > 0) {
      // Use EdgeRuntime.waitUntil for background task
      EdgeRuntime.waitUntil(
        triggerMonitoringAlerts(alerts, Number(healthScore.toFixed(0)), systemStatus)
      );
    }

    const overallStatus = {
      status: systemStatus,
      healthScore: healthScore.toFixed(0),
      timestamp: new Date().toISOString(),
      alerts,
      edgeFunctions: edgeFunctionChecks,
      database: databaseMetrics,
      errorRates,
      highFraudClicks,
      failedPostbacks,
      fraudAlerts,
      summary: {
        totalFunctions,
        healthyFunctions,
        avgResponseTime: Math.round(
          edgeFunctionChecks.reduce((sum, f) => sum + f.responseTime, 0) / totalFunctions
        ),
        totalAlerts: alerts.length,
        highSeverityAlerts,
        mediumSeverityAlerts,
      },
    };

    return new Response(JSON.stringify(overallStatus), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("System health check error:", error);

    return new Response(
      JSON.stringify({ 
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
