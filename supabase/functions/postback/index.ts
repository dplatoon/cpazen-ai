import { serve } from "https://deno.land/std@0.214.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: max 3 postbacks per click_id per hour
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(supabase: any, clickId: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    // Try to get existing rate limit record
    const { data: existing, error: fetchError } = await supabase
      .from('postback_rate_limits')
      .select('*')
      .eq('click_id', clickId)
      .single();

    const now = new Date();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = not found, which is fine
      console.error('[INTERNAL] Rate limit fetch error:', fetchError);
      // Allow on error to not block legitimate traffic
      return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS };
    }

    if (!existing) {
      // First request for this click_id
      const { error: insertError } = await supabase
        .from('postback_rate_limits')
        .insert({
          click_id: clickId,
          request_count: 1,
          first_request_at: now.toISOString(),
          last_request_at: now.toISOString()
        });

      if (insertError) {
        console.error('[INTERNAL] Rate limit insert error:', insertError);
      }
      return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
    }

    // Check if window has expired
    const firstRequestAt = new Date(existing.first_request_at);
    const windowExpired = (now.getTime() - firstRequestAt.getTime()) > RATE_LIMIT_WINDOW_MS;

    if (windowExpired) {
      // Reset the window
      const { error: updateError } = await supabase
        .from('postback_rate_limits')
        .update({
          request_count: 1,
          first_request_at: now.toISOString(),
          last_request_at: now.toISOString()
        })
        .eq('click_id', clickId);

      if (updateError) {
        console.error('[INTERNAL] Rate limit reset error:', updateError);
      }
      return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
    }

    // Check if within limit
    if (existing.request_count >= RATE_LIMIT_MAX_REQUESTS) {
      return { allowed: false, remaining: 0 };
    }

    // Increment counter
    const { error: incrementError } = await supabase
      .from('postback_rate_limits')
      .update({
        request_count: existing.request_count + 1,
        last_request_at: now.toISOString()
      })
      .eq('click_id', clickId);

    if (incrementError) {
      console.error('[INTERNAL] Rate limit increment error:', incrementError);
    }

    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.request_count - 1 };
  } catch (error) {
    console.error('[INTERNAL] Rate limit check failed:', error);
    // Allow on error to not block legitimate traffic
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let click_id: string;
    let payout: number;
    let status: string;
    let security_token: string | undefined;
    let rawData: any = {};

    // Handle both GET (MaxBounty format) and POST (JSON format)
    if (req.method === 'GET') {
      // MaxBounty and similar networks use GET with query params
      const url = new URL(req.url);
      const cid = url.searchParams.get('cid'); // MaxBounty uses 'cid'
      const payoutParam = url.searchParams.get('payout');
      const statusParam = url.searchParams.get('status');
      const token = url.searchParams.get('security_token');

      // Validate GET parameters
      const getSchema = z.object({
        cid: z.string().uuid('Invalid click_id format'),
        payout: z.string().transform(val => parseFloat(val)).pipe(
          z.number().min(0, 'Payout must be non-negative').max(10000, 'Payout exceeds maximum')
        ),
        status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).default('approved'),
        security_token: z.string().optional()
      });

      const validationResult = getSchema.safeParse({
        cid,
        payout: payoutParam,
        status: statusParam || 'approved',
        security_token: token
      });

      if (!validationResult.success) {
        return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      click_id = validationResult.data.cid;
      payout = validationResult.data.payout;
      status = validationResult.data.status;
      security_token = validationResult.data.security_token;

      // Store all query params as raw data
      url.searchParams.forEach((value, key) => {
        rawData[key] = value;
      });

    } else if (req.method === 'POST') {
      // Traditional JSON POST format
      const requestBody = await req.json();
      
      const postbackSchema = z.object({
        click_id: z.string().uuid('Invalid click_id format'),
        payout: z.number().min(0, 'Payout must be non-negative').max(10000, 'Payout exceeds maximum'),
        status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).default('pending'),
        security_token: z.string().optional()
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

      click_id = validationResult.data.click_id;
      payout = validationResult.data.payout;
      status = validationResult.data.status;
      security_token = validationResult.data.security_token;

      const { click_id: _, payout: __, status: ___, security_token: ____, ...rest } = requestBody;
      rawData = rest;
    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limit check per click_id to prevent bulk fraud
    const rateLimit = await checkRateLimit(supabase, click_id);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for click_id: ${click_id}`);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        message: 'Too many postback requests for this click. Please try again later.'
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'Retry-After': '3600'
        }
      });
    }

    // Get click data to verify it exists
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .select('click_id, campaign_id, user_id')
      .eq('click_id', click_id)
      .single();

    if (clickError || !clickData) {
      console.error('[INTERNAL] Click lookup failed:', clickError);
      return new Response(JSON.stringify({ error: 'Invalid click reference' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify security token if provided (optional for networks like MaxBounty)
    if (security_token) {
      const { data: isValid, error: validationError } = await supabase
        .rpc('validate_postback_security_token', {
          _click_id: click_id,
          _token: security_token
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
    }

    // Upsert conversion
    const { data: conversion, error: conversionError } = await supabase
      .from('conversions')
      .upsert({
        click_id: click_id,
        campaign_id: clickData.campaign_id,
        user_id: clickData.user_id,
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
      status,
      rate_limit_remaining: rateLimit.remaining
    });

    // Trigger webhooks for conversion event (fire and forget)
    fetch(`${supabaseUrl}/functions/v1/webhook-handler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        userId: clickData.user_id,
        eventType: 'conversion',
        data: {
          conversion_id: conversion.id,
          click_id: click_id,
          campaign_id: clickData.campaign_id,
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
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(rateLimit.remaining)
      }
    });

  } catch (error) {
    console.error('[INTERNAL] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});