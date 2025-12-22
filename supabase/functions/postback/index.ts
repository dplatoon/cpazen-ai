import { serve } from "https://deno.land/std@0.214.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Network-specific parameter mappings
const NETWORK_PARAM_MAPS: Record<string, {
  clickId: string[];
  payout: string[];
  status: string[];
  subId?: string[];
}> = {
  maxbounty: {
    clickId: ['s2', 'cid', 'subid2'],
    payout: ['rate', 'payout', 'amount'],
    status: ['status'],
    subId: ['s1', 'subid1'],
  },
  everflow: {
    clickId: ['transaction_id', 'tid', 'click_id'],
    payout: ['payout', 'amount', 'revenue'],
    status: ['status', 'event'],
    subId: ['sub1', 'aff_sub'],
  },
  shareasale: {
    clickId: ['afftrack', 'tracking', 'clickid'],
    payout: ['amount', 'sale_amount', 'payout'],
    status: ['newStatus', 'status'],
    subId: ['subid'],
  },
  cj: {
    clickId: ['SID', 'sid', 'click_id'],
    payout: ['commissionAmount', 'amount', 'payout'],
    status: ['correctionReason', 'status'],
    subId: ['PID', 'AID'],
  },
  clickbank: {
    clickId: ['tid', 'ctransaction', 'click_id'],
    payout: ['ctransreceipt', 'amount', 'payout'],
    status: ['ctransaction', 'status'],
    subId: ['hop'],
  },
  generic: {
    clickId: ['click_id', 'cid', 'clickid', 'transaction_id', 'tid'],
    payout: ['payout', 'amount', 'revenue', 'commission'],
    status: ['status', 'event', 'action'],
    subId: ['sub_id', 'subid', 'sub1'],
  },
};

// Rate limiting: max 3 postbacks per click_id per hour
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(supabase: any, clickId: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('postback_rate_limits')
      .select('*')
      .eq('click_id', clickId)
      .single();

    const now = new Date();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[INTERNAL] Rate limit fetch error:', fetchError);
      return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS };
    }

    if (!existing) {
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

    const firstRequestAt = new Date(existing.first_request_at);
    const windowExpired = (now.getTime() - firstRequestAt.getTime()) > RATE_LIMIT_WINDOW_MS;

    if (windowExpired) {
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

    if (existing.request_count >= RATE_LIMIT_MAX_REQUESTS) {
      return { allowed: false, remaining: 0 };
    }

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
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS };
  }
}

// Extract parameter value by trying multiple possible names
function extractParam(params: Record<string, string>, possibleNames: string[]): string | undefined {
  for (const name of possibleNames) {
    const value = params[name] || params[name.toLowerCase()] || params[name.toUpperCase()];
    if (value) return value;
  }
  return undefined;
}

// Helper function to trigger webhooks (fire-and-forget)
function triggerWebhook(supabaseUrl: string, supabaseKey: string, userId: string, eventType: string, data: any): void {
  fetch(`${supabaseUrl}/functions/v1/webhook-handler`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      userId,
      eventType,
      data,
    }),
  }).catch(err => console.error(`Error triggering ${eventType} webhook:`, err));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let click_id: string | undefined;
    let payout: number;
    let status: string;
    let security_token: string | undefined;
    let rawData: Record<string, string> = {};
    let networkAccount: any = null;
    let postbackKey: string | undefined;

    // Parse request parameters
    const url = new URL(req.url);
    
    if (req.method === 'GET') {
      url.searchParams.forEach((value, key) => {
        rawData[key] = value;
      });
    } else if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await req.json();
        rawData = Object.fromEntries(
          Object.entries(body).map(([k, v]) => [k, String(v)])
        );
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData();
        formData.forEach((value, key) => {
          rawData[key] = String(value);
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Postback received:', { method: req.method, params: Object.keys(rawData) });

    // Check for postback key routing (new method)
    postbackKey = rawData.key || rawData.postback_key || rawData.pk;
    
    if (postbackKey) {
      // Route via postback key to get network account config
      const { data: accountData, error: accountError } = await supabase
        .rpc('get_network_account_by_postback_key', { p_key: postbackKey });

      if (accountError) {
        console.error('[INTERNAL] Network account lookup error:', accountError);
      } else if (accountData && accountData.length > 0) {
        networkAccount = accountData[0];
        console.log('Network account found:', { 
          network: networkAccount.network_type,
          name: networkAccount.name 
        });
      }
    }

    // Determine which parameter map to use
    const networkType = networkAccount?.network_type || 'generic';
    const paramMap = NETWORK_PARAM_MAPS[networkType] || NETWORK_PARAM_MAPS.generic;
    
    // Use network config overrides if available
    const configJson = networkAccount?.config_json || {};
    const customClickIdParam = configJson.clickIdParam;
    const customPayoutParam = configJson.payoutParam;
    const customStatusParam = configJson.statusParam;

    // Extract parameters using network-specific or generic mappings
    const clickIdParams = customClickIdParam 
      ? [customClickIdParam, ...paramMap.clickId] 
      : paramMap.clickId;
    const payoutParams = customPayoutParam 
      ? [customPayoutParam, ...paramMap.payout] 
      : paramMap.payout;
    const statusParams = customStatusParam 
      ? [customStatusParam, ...paramMap.status] 
      : paramMap.status;

    click_id = extractParam(rawData, clickIdParams);
    const payoutStr = extractParam(rawData, payoutParams);
    const statusStr = extractParam(rawData, statusParams);
    security_token = rawData.security_token || rawData.token;

    // Validate click_id
    if (!click_id) {
      console.error('Missing click_id. Tried params:', clickIdParams);
      return new Response(JSON.stringify({ 
        error: 'Missing click_id',
        hint: `Expected one of: ${clickIdParams.join(', ')}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(click_id)) {
      console.error('Invalid click_id format:', click_id);
      return new Response(JSON.stringify({ error: 'Invalid click_id format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse payout
    payout = payoutStr ? parseFloat(payoutStr) : 0;
    if (isNaN(payout) || payout < 0) {
      payout = 0;
    }
    if (payout > 10000) {
      console.warn('Payout exceeds maximum, capping at 10000');
      payout = 10000;
    }

    // Normalize status
    const statusMap: Record<string, string> = {
      'approved': 'approved',
      'confirmed': 'approved',
      'success': 'approved',
      'sale': 'approved',
      'converted': 'approved',
      'pending': 'pending',
      'rejected': 'rejected',
      'declined': 'rejected',
      'reversed': 'rejected',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'chargeback': 'cancelled',
    };
    status = statusMap[statusStr?.toLowerCase() || ''] || 'approved';

    // Rate limit check
    const rateLimit = await checkRateLimit(supabase, click_id);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for click_id: ${click_id}`);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        message: 'Too many postback requests for this click.'
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

    // Get click data
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

    // Validate postback key belongs to same user (if using key routing)
    if (networkAccount && networkAccount.user_id !== clickData.user_id) {
      console.warn('Postback key user mismatch');
      
      // Trigger postback_failed webhook for the correct user
      triggerWebhook(supabaseUrl, supabaseKey, clickData.user_id, 'postback_failed', {
        click_id: click_id,
        campaign_id: clickData.campaign_id,
        error: 'Postback key user mismatch',
        network_type: networkType,
        timestamp: new Date().toISOString(),
      });
      
      return new Response(JSON.stringify({ error: 'Invalid postback key' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify security token if provided
    if (security_token) {
      const { data: isValid, error: validationError } = await supabase
        .rpc('validate_postback_security_token', {
          _click_id: click_id,
          _token: security_token
        });
      
      if (validationError) {
        console.error('[INTERNAL] Token validation error:', validationError);
        
        triggerWebhook(supabaseUrl, supabaseKey, clickData.user_id, 'postback_failed', {
          click_id: click_id,
          campaign_id: clickData.campaign_id,
          error: 'Security token validation failed',
          network_type: networkType,
          timestamp: new Date().toISOString(),
        });
        
        return new Response(JSON.stringify({ error: 'Authentication failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (!isValid) {
        triggerWebhook(supabaseUrl, supabaseKey, clickData.user_id, 'postback_failed', {
          click_id: click_id,
          campaign_id: clickData.campaign_id,
          error: 'Invalid security token',
          network_type: networkType,
          timestamp: new Date().toISOString(),
        });
        
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
      
      triggerWebhook(supabaseUrl, supabaseKey, clickData.user_id, 'postback_failed', {
        click_id: click_id,
        campaign_id: clickData.campaign_id,
        error: 'Failed to record conversion',
        network_type: networkType,
        timestamp: new Date().toISOString(),
      });
      
      return new Response(JSON.stringify({ error: 'Operation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Conversion recorded:', {
      click_id,
      payout,
      status,
      network: networkType,
      rate_limit_remaining: rateLimit.remaining
    });

    // Trigger conversion webhook
    triggerWebhook(supabaseUrl, supabaseKey, clickData.user_id, 'conversion', {
      conversion_id: conversion.id,
      click_id: click_id,
      campaign_id: clickData.campaign_id,
      payout,
      status,
      network_type: networkType,
      timestamp: new Date().toISOString(),
    });

    // Trigger postback_received webhook notification
    triggerWebhook(supabaseUrl, supabaseKey, clickData.user_id, 'postback_received', {
      click_id: click_id,
      campaign_id: clickData.campaign_id,
      payout,
      status,
      network_type: networkType,
      raw_params: Object.keys(rawData),
      timestamp: new Date().toISOString(),
    });

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
