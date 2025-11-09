import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET")!;

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
  "send-notification",
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
        body: JSON.stringify({ health_check: true, secret: internalSecret }),
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

    // Count total records in key tables
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
    // Get error logs from last 24 hours (you'd need to implement error logging)
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check all edge functions in parallel
    const edgeFunctionChecks = await Promise.all(
      EDGE_FUNCTIONS.map(checkEdgeFunction)
    );

    // Get database metrics
    const databaseMetrics = await getDatabaseMetrics(supabase);

    // Get error rates
    const errorRates = await getErrorRates(supabase);

    // Calculate overall health
    const healthyFunctions = edgeFunctionChecks.filter(f => f.status === "healthy").length;
    const totalFunctions = edgeFunctionChecks.length;
    const healthScore = (healthyFunctions / totalFunctions) * 100;

    const overallStatus = {
      status: healthScore === 100 ? "healthy" : healthScore >= 80 ? "degraded" : "unhealthy",
      healthScore: healthScore.toFixed(0),
      timestamp: new Date().toISOString(),
      edgeFunctions: edgeFunctionChecks,
      database: databaseMetrics,
      errorRates,
      summary: {
        totalFunctions,
        healthyFunctions,
        avgResponseTime: Math.round(
          edgeFunctionChecks.reduce((sum, f) => sum + f.responseTime, 0) / totalFunctions
        ),
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
