import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { webhook_id, payload } = await req.json();

    if (!webhook_id || !payload) {
      throw new Error('Missing webhook_id or payload');
    }

    // Get webhook details
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhook_id)
      .eq('user_id', user.id)
      .single();

    if (webhookError || !webhook) {
      throw new Error('Webhook not found');
    }

    console.log(`Testing webhook: ${webhook.name} (${webhook.url})`);

    // Generate signature for test
    const timestamp = Date.now().toString();
    const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;
    const signature = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`${webhook.secret_key}${signaturePayload}`)
    );
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Send test request
    const startTime = Date.now();
    let responseStatus: number | null = null;
    let responseBody = '';

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CPAzen-Signature': signatureHex,
          'X-CPAzen-Timestamp': timestamp,
          'X-CPAzen-Event': payload.event_type || 'test',
          'User-Agent': 'CPAzen-Webhook-Tester/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      responseStatus = response.status;
      responseBody = await response.text();
      
      console.log(`Webhook test response: ${responseStatus} - ${responseBody.substring(0, 100)}`);
    } catch (error) {
      console.error('Webhook test error:', error);
      responseBody = error instanceof Error ? error.message : 'Unknown error';
    }

    const responseTime = Date.now() - startTime;

    // Log the test
    const { error: logError } = await supabase
      .from('webhook_test_logs')
      .insert({
        user_id: user.id,
        webhook_id: webhook_id,
        test_payload: payload,
        response_status: responseStatus,
        response_body: responseBody.substring(0, 1000), // Limit to 1000 chars
        response_time_ms: responseTime,
      });

    if (logError) {
      console.error('Failed to log webhook test:', logError);
    }

    return new Response(
      JSON.stringify({
        success: responseStatus !== null && responseStatus >= 200 && responseStatus < 300,
        response_status: responseStatus,
        response_body: responseBody,
        response_time_ms: responseTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in test-webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});