import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  type: "conversion" | "daily_summary" | "low_performance" | "weekly_report";
  data: any;
}

const emailTemplates = {
  conversion: (data: any) => ({
    subject: `🎉 New Conversion: ${data.campaign_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">New Conversion!</h1>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Campaign:</strong> ${data.campaign_name}</p>
          <p><strong>Payout:</strong> $${data.payout.toFixed(2)}</p>
          <p><strong>Time:</strong> ${new Date(data.created_at).toLocaleString()}</p>
          <p><strong>Click ID:</strong> ${data.click_id}</p>
        </div>
        <p>Keep up the great work! 🚀</p>
      </div>
    `,
  }),
  daily_summary: (data: any) => ({
    subject: `📊 Daily Summary - ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Daily Performance Summary</h1>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>Today's Stats</h2>
          <p><strong>Clicks:</strong> ${data.clicks}</p>
          <p><strong>Conversions:</strong> ${data.conversions}</p>
          <p><strong>Revenue:</strong> $${data.revenue.toFixed(2)}</p>
          <p><strong>Conversion Rate:</strong> ${data.conversion_rate.toFixed(2)}%</p>
          <p><strong>EPC:</strong> $${data.epc.toFixed(2)}</p>
        </div>
        <a href="https://cpazen.com/dashboard" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Dashboard
        </a>
      </div>
    `,
  }),
  low_performance: (data: any) => ({
    subject: `⚠️ Low Performance Alert: ${data.campaign_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Performance Alert</h1>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p><strong>Campaign:</strong> ${data.campaign_name}</p>
          <p><strong>Issue:</strong> ${data.issue}</p>
          <p><strong>Current CR:</strong> ${data.conversion_rate.toFixed(2)}%</p>
          <p><strong>Clicks (last 24h):</strong> ${data.clicks}</p>
          <p><strong>Conversions (last 24h):</strong> ${data.conversions}</p>
        </div>
        <h3>Recommendations:</h3>
        <ul>
          <li>Review traffic sources for quality</li>
          <li>Check geo-targeting settings</li>
          <li>Consider pausing and optimizing</li>
        </ul>
        <a href="https://cpazen.com/campaigns" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Optimize Campaign
        </a>
      </div>
    `,
  }),
  weekly_report: (data: any) => ({
    subject: `📈 Weekly Report - ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8b5cf6;">Weekly Performance Report</h1>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>This Week's Summary</h2>
          <p><strong>Total Clicks:</strong> ${data.total_clicks}</p>
          <p><strong>Total Conversions:</strong> ${data.total_conversions}</p>
          <p><strong>Total Revenue:</strong> $${data.total_revenue.toFixed(2)}</p>
          <p><strong>Avg CR:</strong> ${data.avg_conversion_rate.toFixed(2)}%</p>
          <p><strong>Avg EPC:</strong> $${data.avg_epc.toFixed(2)}</p>
        </div>
        <h3>Top Campaigns:</h3>
        <ol>
          ${data.top_campaigns.map((c: any) => 
            `<li><strong>${c.name}</strong> - $${c.revenue.toFixed(2)}</li>`
          ).join('')}
        </ol>
        <a href="https://cpazen.com/analytics" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Full Report
        </a>
      </div>
    `,
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, type, data }: NotificationRequest = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile and preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, notification_preferences")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    // Check if user has enabled this notification type
    const preferences = profile.notification_preferences || {};
    if (!preferences.email_notifications || !preferences[`${type}_alerts`]) {
      return new Response(
        JSON.stringify({ message: "Notification disabled by user preferences" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email template
    const template = emailTemplates[type](data);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "CPAzen <notifications@cpazen.com>",
      to: [profile.email],
      subject: template.subject,
      html: template.html,
    });

    console.log("Email sent:", emailResponse);

    // Log notification
    await supabase.from("notification_logs").insert({
      user_id: userId,
      notification_type: type,
      email_to: profile.email,
      subject: template.subject,
      status: "sent",
      metadata: { email_id: emailResponse.id, data },
    });

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
