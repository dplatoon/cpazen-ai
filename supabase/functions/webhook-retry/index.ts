import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Exponential backoff configuration
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 second
const MAX_DELAY_MS = 300000; // 5 minutes

// Calculate delay with exponential backoff and jitter
function calculateBackoffDelay(attempt: number): number {
  const exponentialDelay = Math.min(
    BASE_DELAY_MS * Math.pow(2, attempt),
    MAX_DELAY_MS
  );
  // Add jitter (random 0-25% of delay)
  const jitter = exponentialDelay * Math.random() * 0.25;
  return Math.floor(exponentialDelay + jitter);
}

// SSRF Protection: Validate webhook URLs
function isUrlSafe(urlString: string): { safe: boolean; reason?: string } {
  try {
    const url = new URL(urlString);
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { safe: false, reason: 'Only HTTP(S) protocols allowed' };
    }
    
    const hostname = url.hostname.toLowerCase();
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { safe: false, reason: 'Localhost not allowed' };
    }
    
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Pattern);
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number);
      if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || 
          (a === 169 && b === 254) || a === 127 || a === 0) {
        return { safe: false, reason: 'Private/internal IPs not allowed' };
      }
    }
    
    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }
}

interface WebhookRetryJob {
  id: string;
  webhook_id: string;
  user_id: string;
  event_type: string;
  payload: any;
  attempt: number;
  next_retry_at: string;
  max_retries: number;
  last_error?: string;
  webhook_url?: string;
  webhook_secret?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate internal secret
    const providedSecret = req.headers.get("X-Internal-Secret");
    if (internalSecret && providedSecret !== internalSecret) {
      // Also allow service role key auth
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.includes(supabaseKey)) {
        console.error("Unauthorized request");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));

    // Handle different modes
    const mode = body.mode || "process"; // process, schedule, status

    if (mode === "schedule") {
      // Schedule a webhook for retry
      const { webhookLogId, webhookId, userId, eventType, payload } = body;
      
      if (!webhookId || !userId || !eventType || !payload) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate first retry delay (1 second)
      const nextRetryAt = new Date(Date.now() + calculateBackoffDelay(0)).toISOString();

      const { data: retryJob, error: insertError } = await supabase
        .from("webhook_retry_queue")
        .insert({
          webhook_id: webhookId,
          user_id: userId,
          event_type: eventType,
          payload,
          attempt: 0,
          next_retry_at: nextRetryAt,
          max_retries: MAX_RETRIES,
          status: "pending",
          original_log_id: webhookLogId,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error scheduling retry:", insertError);
        throw insertError;
      }

      console.log(`Scheduled webhook retry: ${retryJob.id}, next retry at ${nextRetryAt}`);

      return new Response(
        JSON.stringify({ success: true, retryJob }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "process") {
      // Process pending retries
      const now = new Date().toISOString();

      // Get pending retries that are due
      const { data: pendingRetries, error: fetchError } = await supabase
        .from("webhook_retry_queue")
        .select(`
          *,
          webhook:webhooks(url, secret_key, is_active)
        `)
        .eq("status", "pending")
        .lte("next_retry_at", now)
        .limit(10);

      if (fetchError) {
        console.error("Error fetching pending retries:", fetchError);
        throw fetchError;
      }

      if (!pendingRetries || pendingRetries.length === 0) {
        return new Response(
          JSON.stringify({ message: "No pending retries", processed: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Processing ${pendingRetries.length} pending webhook retries`);

      const results = await Promise.allSettled(
        pendingRetries.map(async (retry: any) => {
          const webhook = retry.webhook;
          
          // Check if webhook still exists and is active
          if (!webhook || !webhook.is_active) {
            await supabase
              .from("webhook_retry_queue")
              .update({ 
                status: "cancelled", 
                last_error: "Webhook no longer active",
                completed_at: new Date().toISOString(),
              })
              .eq("id", retry.id);
            return { id: retry.id, status: "cancelled", reason: "Webhook inactive" };
          }

          // Validate URL
          const urlValidation = isUrlSafe(webhook.url);
          if (!urlValidation.safe) {
            await supabase
              .from("webhook_retry_queue")
              .update({ 
                status: "failed", 
                last_error: `URL blocked: ${urlValidation.reason}`,
                completed_at: new Date().toISOString(),
              })
              .eq("id", retry.id);
            return { id: retry.id, status: "failed", reason: urlValidation.reason };
          }

          try {
            // Create signature
            const signature = await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(JSON.stringify(retry.payload) + webhook.secret_key)
            );
            const signatureHex = Array.from(new Uint8Array(signature))
              .map(b => b.toString(16).padStart(2, "0"))
              .join("");

            console.log(`Retry attempt ${retry.attempt + 1} for webhook ${retry.webhook_id}`);

            // Send webhook
            const response = await fetch(webhook.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signatureHex,
                "X-Webhook-Event": retry.event_type,
                "X-Retry-Attempt": String(retry.attempt + 1),
              },
              body: JSON.stringify(retry.payload),
            });

            const responseBody = await response.text();

            // Log the retry attempt
            await supabase.from("webhook_logs").insert({
              webhook_id: retry.webhook_id,
              event_type: retry.event_type,
              payload: retry.payload,
              response_status: response.status,
              response_body: responseBody.substring(0, 1000),
              user_id: retry.user_id,
            });

            if (response.ok) {
              // Success - mark as completed
              await supabase
                .from("webhook_retry_queue")
                .update({ 
                  status: "completed",
                  completed_at: new Date().toISOString(),
                })
                .eq("id", retry.id);

              console.log(`Webhook retry succeeded for ${retry.id}`);
              return { id: retry.id, status: "completed", attempt: retry.attempt + 1 };
            } else {
              // Failed - schedule next retry or mark as failed
              const newAttempt = retry.attempt + 1;
              
              if (newAttempt >= retry.max_retries) {
                await supabase
                  .from("webhook_retry_queue")
                  .update({ 
                    status: "failed",
                    attempt: newAttempt,
                    last_error: `HTTP ${response.status}: ${responseBody.substring(0, 200)}`,
                    completed_at: new Date().toISOString(),
                  })
                  .eq("id", retry.id);

                console.log(`Webhook retry exhausted for ${retry.id}`);
                return { id: retry.id, status: "failed", reason: "Max retries exceeded" };
              } else {
                const nextDelay = calculateBackoffDelay(newAttempt);
                const nextRetryAt = new Date(Date.now() + nextDelay).toISOString();

                await supabase
                  .from("webhook_retry_queue")
                  .update({ 
                    attempt: newAttempt,
                    next_retry_at: nextRetryAt,
                    last_error: `HTTP ${response.status}: ${responseBody.substring(0, 200)}`,
                  })
                  .eq("id", retry.id);

                console.log(`Webhook retry ${newAttempt} failed for ${retry.id}, next retry at ${nextRetryAt}`);
                return { id: retry.id, status: "retrying", attempt: newAttempt, nextRetryAt };
              }
            }
          } catch (error: any) {
            const newAttempt = retry.attempt + 1;
            
            if (newAttempt >= retry.max_retries) {
              await supabase
                .from("webhook_retry_queue")
                .update({ 
                  status: "failed",
                  attempt: newAttempt,
                  last_error: error.message,
                  completed_at: new Date().toISOString(),
                })
                .eq("id", retry.id);

              return { id: retry.id, status: "failed", reason: error.message };
            } else {
              const nextDelay = calculateBackoffDelay(newAttempt);
              const nextRetryAt = new Date(Date.now() + nextDelay).toISOString();

              await supabase
                .from("webhook_retry_queue")
                .update({ 
                  attempt: newAttempt,
                  next_retry_at: nextRetryAt,
                  last_error: error.message,
                })
                .eq("id", retry.id);

              return { id: retry.id, status: "retrying", attempt: newAttempt, nextRetryAt };
            }
          }
        })
      );

      const processedResults = results.map((r, i) => 
        r.status === "fulfilled" ? r.value : { id: pendingRetries[i].id, status: "error", error: r.reason }
      );

      return new Response(
        JSON.stringify({ 
          processed: processedResults.length,
          results: processedResults,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "status") {
      // Get retry queue status
      const { data: stats, error: statsError } = await supabase
        .from("webhook_retry_queue")
        .select("status")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (statsError) throw statsError;

      const statusCounts = (stats || []).reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      return new Response(
        JSON.stringify({ 
          period: "24h",
          counts: statusCounts,
          total: stats?.length || 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid mode" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Webhook retry error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
