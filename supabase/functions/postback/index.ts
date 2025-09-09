import { serve } from "https://deno.land/std@0.214.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      click_id, 
      payout, 
      status = 'pending',
      security_token,
      ...rawData 
    } = await req.json();

    if (!click_id) {
      return new Response(JSON.stringify({ error: 'click_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get click and associated campaign/user info
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .select(`
        *,
        campaigns (
          user_id,
          profiles!inner (
            secret_key
          )
        )
      `)
      .eq('click_id', click_id)
      .single();

    if (clickError || !clickData) {
      return new Response(JSON.stringify({ error: 'Click not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify security token if provided
    if (security_token) {
      const secretKey = clickData.campaigns.profiles.secret_key;
      
      // Create hash using Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(click_id + secretKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const expectedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (security_token !== expectedToken) {
        return new Response(JSON.stringify({ error: 'Invalid security token' }), {
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
        payout: parseFloat(payout) || 0,
        status: status,
        network_postback_raw: rawData
      }, {
        onConflict: 'click_id'
      })
      .select()
      .single();

    if (conversionError) {
      console.error('Error upserting conversion:', conversionError);
      return new Response(JSON.stringify({ error: 'Failed to record conversion' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Conversion recorded:', {
      click_id,
      payout,
      status,
      user_id: clickData.campaigns.user_id
    });

    return new Response(JSON.stringify({ 
      success: true, 
      conversion_id: conversion.id,
      message: 'Conversion recorded successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in postback:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});