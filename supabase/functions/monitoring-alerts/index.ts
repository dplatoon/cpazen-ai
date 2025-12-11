import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Alert {
  id: string;
  type: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: string;
}

interface MonitoringAlertRequest {
  alerts: Alert[];
  healthScore: number;
  systemStatus: string;
}

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case "high": return "#dc2626";
    case "medium": return "#f59e0b";
    default: return "#6b7280";
  }
};

const getAlertIcon = (type: string): string => {
  switch (type) {
    case "edge_function_error": return "⚙️";
    case "high_fraud_score": return "🛡️";
    case "failed_postback": return "🔗";
    case "pending_fraud_alert": return "⚠️";
    case "high_bot_rate": return "🤖";
    default: return "🔔";
  }
};

const generateAlertEmailHtml = (alerts: Alert[], healthScore: number, systemStatus: string): string => {
  const highSeverityAlerts = alerts.filter(a => a.severity === "high");
  const mediumSeverityAlerts = alerts.filter(a => a.severity === "medium");

  const alertsHtml = alerts.map(alert => `
    <div style="background: ${alert.severity === 'high' ? '#fef2f2' : '#fffbeb'}; 
                border-left: 4px solid ${getSeverityColor(alert.severity)}; 
                padding: 16px; 
                margin: 12px 0; 
                border-radius: 0 8px 8px 0;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 20px;">${getAlertIcon(alert.type)}</span>
        <span style="font-weight: bold; color: ${getSeverityColor(alert.severity)}; text-transform: uppercase; font-size: 12px;">
          ${alert.severity} SEVERITY
        </span>
      </div>
      <h3 style="margin: 0 0 8px 0; color: #1f2937;">${alert.title}</h3>
      <p style="margin: 0; color: #4b5563;">${alert.description}</p>
      <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
        ${new Date(alert.timestamp).toLocaleString()}
      </p>
    </div>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Critical System Alert</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Immediate attention required</p>
        </div>

        <!-- Status Summary -->
        <div style="padding: 24px; background: #fef2f2; border-bottom: 1px solid #fecaca;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">System Status</p>
              <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: bold; color: #dc2626; text-transform: uppercase;">
                ${systemStatus}
              </p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Health Score</p>
              <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: bold; color: ${healthScore >= 70 ? '#f59e0b' : '#dc2626'};">
                ${healthScore}%
              </p>
            </div>
          </div>
        </div>

        <!-- Alert Summary -->
        <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">Alert Summary</h2>
          <div style="display: flex; gap: 24px;">
            <div style="flex: 1; background: #fef2f2; padding: 16px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #dc2626;">${highSeverityAlerts.length}</p>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">High Severity</p>
            </div>
            <div style="flex: 1; background: #fffbeb; padding: 16px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #f59e0b;">${mediumSeverityAlerts.length}</p>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Medium Severity</p>
            </div>
          </div>
        </div>

        <!-- Active Alerts -->
        <div style="padding: 24px;">
          <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">Active Alerts</h2>
          ${alertsHtml}
        </div>

        <!-- Action Button -->
        <div style="padding: 24px; text-align: center; background: #f9fafb;">
          <a href="https://cpazen.com/monitoring" 
             style="display: inline-block; 
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                    color: white; 
                    padding: 14px 32px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: 600;
                    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
            View Monitoring Dashboard →
          </a>
        </div>

        <!-- Footer -->
        <div style="padding: 24px; background: #1f2937; text-align: center;">
          <p style="margin: 0; color: #9ca3af; font-size: 14px;">
            This is an automated alert from CPAzen System Monitoring
          </p>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
            © ${new Date().getFullYear()} CPAzen. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate internal secret
    const providedSecret = req.headers.get("X-Internal-Secret");
    if (internalSecret && providedSecret !== internalSecret) {
      console.error("Unauthorized: Invalid internal secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { alerts, healthScore, systemStatus }: MonitoringAlertRequest = await req.json();

    // Only send emails for high-severity alerts
    const highSeverityAlerts = alerts.filter(a => a.severity === "high");
    if (highSeverityAlerts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No high-severity alerts to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all admin users
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(
        JSON.stringify({ message: "No admin users to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin emails
    const adminUserIds = adminRoles.map(r => r.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, email, notification_preferences")
      .in("user_id", adminUserIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Filter admins who have monitoring alerts enabled
    const adminsToNotify = profiles?.filter(p => {
      const prefs = p.notification_preferences || {};
      return prefs.email_notifications !== false; // Default to true if not set
    }) || [];

    if (adminsToNotify.length === 0) {
      return new Response(
        JSON.stringify({ message: "No admins with notifications enabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate email content
    const html = generateAlertEmailHtml(alerts, healthScore, systemStatus);
    const subject = `🚨 CPAzen Alert: ${highSeverityAlerts.length} Critical Issue${highSeverityAlerts.length > 1 ? 's' : ''} Detected`;

    // Send emails to all admins
    const emailPromises = adminsToNotify.map(async (admin) => {
      try {
        const emailResponse = await resend.emails.send({
          from: "CPAzen Alerts <alerts@cpazen.com>",
          to: [admin.email],
          subject,
          html,
        });

        console.log(`Alert email sent to ${admin.email}:`, emailResponse);

        // Log notification
        await supabase.from("notification_logs").insert({
          user_id: admin.user_id,
          notification_type: "monitoring_alert",
          email_to: admin.email,
          subject,
          status: "sent",
          metadata: { 
            email_id: emailResponse.id, 
            alerts_count: alerts.length,
            high_severity_count: highSeverityAlerts.length,
            health_score: healthScore,
          },
        });

        return { success: true, email: admin.email };
      } catch (error: any) {
        console.error(`Failed to send alert to ${admin.email}:`, error);
        
        await supabase.from("notification_logs").insert({
          user_id: admin.user_id,
          notification_type: "monitoring_alert",
          email_to: admin.email,
          subject,
          status: "failed",
          error_message: error.message,
          metadata: { alerts_count: alerts.length },
        });

        return { success: false, email: admin.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Monitoring alerts sent: ${successCount}/${results.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount,
        total: results.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending monitoring alerts:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
