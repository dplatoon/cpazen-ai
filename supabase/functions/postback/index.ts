import { serve } from "https://deno.land/std@0.214.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate inputs with schema
    const postbackSchema = z.object({
      click_id: z.string().uuid('Invalid click_id format'),
      payout: z.number().min(0, 'Payout must be non-negative').max(10000, 'Payout exceeds maximum'),
      status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).default('pending'),
      security_token: z.string().min(1, 'Security token is required')
    });

    const validationResult = postbackSchema.safeParse({
      click_id: requestBody.click_id,
      payout: parseFloat(requestBody.payout),
      status: requestBody.status || 'pending',
      security_token: requestBody.security_token
    });

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { click_id, payout, status, security_token } = validationResult.data;
    const { click_id: _, payout: __, status: ___, security_token: ____, ...rawData } = requestBody;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get click data to verify it exists
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .select('click_id, campaign_id')
      .eq('click_id', click_id)
      .single();

    if (clickError || !clickData) {
      console.error('[INTERNAL] Click lookup failed:', clickError);
      return new Response(JSON.stringify({ error: 'Invalid click reference' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify security token using secure server-side validation (REQUIRED)
    const { data: isValid, error: validationError } = await supabase
      .rpc('validate_postback_security_token', {
        click_id_param: click_id,
        provided_token: security_token
      });
    
    if (validationError) {
      console.error('[INTERNAL] Token validation error:', validationError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get click details
    const { data: click, error: clickError } = await supabase
      .from('clicks')
      .select('user_id, campaign_id')
      .eq('click_id', click_id)
      .single();

    if (clickError || !click) {
      console.error('[INTERNAL] Click lookup failed:', clickError);
      return new Response(JSON.stringify({ error: 'Invalid click reference' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Upsert conversion
    const { data: conversion, error: conversionError } = await supabase
      .from('conversions')
      .upsert({
        click_id: click_id,
        campaign_id: click.campaign_id,
        user_id: click.user_id,
        payout: payout,
        status: status,
        network_postback_raw: rawData
      }, {
        onConflict: 'click_id'
      })
      .select()
      .single();

    if (conversionError) {
      console.error('[INTERNAL] Conversion recording failed:', conversionError);
      return new Response(JSON.stringify({ error: 'Operation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Conversion recorded:', {
      click_id,
      payout,
      status
    });

    // Trigger webhooks for conversion event (fire and forget)
    fetch(`${supabaseUrl}/functions/v1/webhook-handler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        userId: click.user_id,
        eventType: 'conversion',
        data: {
          conversion_id: conversion.id,
          click_id: click_id,
          campaign_id: click.campaign_id,
          payout,
          status,
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch(err => console.error('Error triggering webhook:', err));

    return new Response(JSON.stringify({ 
      success: true, 
      conversion_id: conversion.id,
      message: 'Conversion recorded successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[INTERNAL] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});