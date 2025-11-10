import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  userId: string;
  eventType: string;
  data: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
          await supabase.from('webhook_logs').insert({
            webhook_id: webhook.id,
            event_type: payload.eventType,
            payload: payload.data,
            response_status: response.status,
            response_body: responseBody.substring(0, 1000), // Limit response body size
            user_id: payload.userId,
          });

          return { success: true, webhookId: webhook.id, status: response.status };
        } catch (error) {
          console.error(`Error sending webhook ${webhook.id}:`, error);

          // Log failed delivery
          await supabase.from('webhook_logs').insert({
            webhook_id: webhook.id,
            event_type: payload.eventType,
            payload: payload.data,
            response_status: 0,
            response_body: error.message,
            user_id: payload.userId,
          });

          return { success: false, webhookId: webhook.id, error: error.message };
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
  } catch (error) {
    console.error('Error in webhook-handler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});