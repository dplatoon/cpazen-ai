import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

interface WebhookPayload {
  userId: string;
  eventType: string;
  data: any;
}

// SSRF Protection: Validate webhook URLs against dangerous destinations
function isUrlSafe(urlString: string): { safe: boolean; reason?: string } {
  try {
    const url = new URL(urlString);
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { safe: false, reason: 'Only HTTP(S) protocols are allowed' };
    }
    
    const hostname = url.hostname.toLowerCase();
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { safe: false, reason: 'Localhost URLs are not allowed' };
    }
    
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Pattern);
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number);
      
      if (a === 10) return { safe: false, reason: 'Private IP addresses not allowed' };
      if (a === 172 && b >= 16 && b <= 31) return { safe: false, reason: 'Private IP addresses not allowed' };
      if (a === 192 && b === 168) return { safe: false, reason: 'Private IP addresses not allowed' };
      if (a === 169 && b === 254) return { safe: false, reason: 'Cloud metadata endpoints not allowed' };
      if (a === 127) return { safe: false, reason: 'Loopback addresses not allowed' };
      if (a === 0) return { safe: false, reason: 'Invalid IP address' };
    }
    
    const blockedHostnames = ['metadata.google.internal', 'metadata.google', 'metadata', 'internal', 'local', '0.0.0.0'];
    if (blockedHostnames.some(blocked => hostname === blocked || hostname.endsWith('.' + blocked))) {
      return { safe: false, reason: 'Internal hostnames are not allowed' };
    }
    
    return { safe: true };
  } catch (error) {
    return { safe: false, reason: 'Invalid URL format' };
  }
}

// Schedule a webhook for retry
async function scheduleRetry(
  supabase: any,
  webhookId: string,
  userId: string,
  eventType: string,
  payload: any,
  logId?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('webhook_retry_queue')
      .insert({
        webhook_id: webhookId,
        user_id: userId,
        event_type: eventType,
        payload,
        attempt: 0,
        max_retries: 5,
        next_retry_at: new Date(Date.now() + 1000).toISOString(), // 1 second delay for first retry
        status: 'pending',
        original_log_id: logId,
      });

    if (error) {
      console.error('Error scheduling retry:', error);
    } else {
      console.log(`Scheduled retry for webhook ${webhookId}`);
    }
  } catch (error) {
    console.error('Error scheduling retry:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Require internal secret since this function is called server-to-server only
  const providedSecret = req.headers.get('X-Internal-Secret');
  if (!internalSecret || providedSecret !== internalSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: WebhookPayload = await req.json();
    console.log('Processing webhook for event:', payload.eventType);

    // Get active webhooks for this user and event type
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', payload.userId)
      .eq('is_active', true)
      .contains('events', [payload.eventType]);

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError);
      throw webhooksError;
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('No active webhooks found for event:', payload.eventType);
      return new Response(
        JSON.stringify({ message: 'No webhooks to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send webhooks in parallel
    const webhookResults = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          // SSRF Protection: Validate the webhook URL before making request
          const urlValidation = isUrlSafe(webhook.url);
          if (!urlValidation.safe) {
            console.warn(`Webhook ${webhook.id} blocked - unsafe URL: ${urlValidation.reason}`);
            
            await supabase.from('webhook_logs').insert({
              webhook_id: webhook.id,
              event_type: payload.eventType,
              payload: payload.data,
              response_status: 0,
              response_body: `Blocked: ${urlValidation.reason}`,
              user_id: payload.userId,
            });
            
            return { 
              success: false, 
              webhookId: webhook.id, 
              error: `URL validation failed: ${urlValidation.reason}` 
            };
          }

          // Create signature using secret key
          const signature = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(JSON.stringify(payload.data) + webhook.secret_key)
          );
          const signatureHex = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

          console.log(`Sending webhook to: ${webhook.url}`);

          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': signatureHex,
              'X-Webhook-Event': payload.eventType,
            },
            body: JSON.stringify(payload.data),
          });

          const responseBody = await response.text();
          console.log(`Webhook response status: ${response.status}`);

          // Log webhook delivery
          const { data: logEntry } = await supabase.from('webhook_logs').insert({
            webhook_id: webhook.id,
            event_type: payload.eventType,
            payload: payload.data,
            response_status: response.status,
            response_body: responseBody.substring(0, 1000),
            user_id: payload.userId,
          }).select('id').single();

          // If failed (status >= 400), schedule for retry
          if (response.status >= 400) {
            console.log(`Webhook failed with status ${response.status}, scheduling retry`);
            await scheduleRetry(
              supabase,
              webhook.id,
              payload.userId,
              payload.eventType,
              payload.data,
              logEntry?.id
            );
            return { success: false, webhookId: webhook.id, status: response.status, scheduledRetry: true };
          }

          return { success: true, webhookId: webhook.id, status: response.status };
        } catch (error: any) {
          console.error(`Error sending webhook ${webhook.id}:`, error);

          // Log failed delivery
          const { data: logEntry } = await supabase.from('webhook_logs').insert({
            webhook_id: webhook.id,
            event_type: payload.eventType,
            payload: payload.data,
            response_status: 0,
            response_body: error.message,
            user_id: payload.userId,
          }).select('id').single();

          // Schedule for retry on network errors
          await scheduleRetry(
            supabase,
            webhook.id,
            payload.userId,
            payload.eventType,
            payload.data,
            logEntry?.id
          );

          return { success: false, webhookId: webhook.id, error: error.message, scheduledRetry: true };
        }
      })
    );

    const results = webhookResults.map((result, index) => ({
      webhookId: webhooks[index].id,
      result: result.status === 'fulfilled' ? result.value : { success: false, error: result.reason },
    }));

    return new Response(
      JSON.stringify({
        message: 'Webhooks processed',
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in webhook-handler:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing webhooks' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
