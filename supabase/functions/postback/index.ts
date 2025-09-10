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

    // Get click data to verify it exists
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .select('click_id, campaign_id')
      .eq('click_id', click_id)
      .single();

    if (clickError || !clickData) {
      return new Response(JSON.stringify({ error: 'Click not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify security token using secure server-side validation
    if (security_token) {
      const { data: isValid, error: validationError } = await supabase
        .rpc('validate_postback_security_token', {
          click_id_param: click_id,
          provided_token: security_token
        });
      
      if (validationError) {
        console.error('Error validating security token:', validationError);
        return new Response(JSON.stringify({ error: 'Security validation failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (!isValid) {
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
      status
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