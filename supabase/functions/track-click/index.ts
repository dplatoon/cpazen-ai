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
    const url = new URL(req.url);
    const campaignId = url.pathname.split('/').pop();
    const subId = url.searchParams.get('sub');
    
    if (!campaignId) {
      return new Response('Campaign ID required', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign and offer details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        offers (
          offer_url,
          status
        )
      `)
      .eq('id', campaignId)
      .eq('status', 'active')
      .single();

    if (campaignError || !campaign) {
      return new Response('Campaign not found or inactive', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    // Extract request info for tracking
    const userAgent = req.headers.get('user-agent') || '';
    const ip = req.headers.get('x-forwarded-for') || 
              req.headers.get('x-real-ip') || 
              'unknown';
    const referrer = req.headers.get('referer') || '';
    
    // Parse user agent info (simplified)
    const getOSFromUA = (ua: string): string => {
      if (ua.includes('Windows')) return 'Windows';
      if (ua.includes('Mac OS')) return 'macOS';
      if (ua.includes('Linux')) return 'Linux';
      if (ua.includes('Android')) return 'Android';
      if (ua.includes('iOS')) return 'iOS';
      return 'Unknown';
    };

    const getBrowserFromUA = (ua: string): string => {
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Safari')) return 'Safari';
      if (ua.includes('Edge')) return 'Edge';
      return 'Unknown';
    };

    // Insert click record
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .insert({
        campaign_id: campaignId,
        ip: ip,
        user_agent: userAgent,
        os: getOSFromUA(userAgent),
        browser: getBrowserFromUA(userAgent),
        referrer: referrer,
        sub_id: subId,
        bot_score: 0 // Will be updated by bot detection
      })
      .select('click_id')
      .single();

    if (clickError) {
      console.error('Error inserting click:', clickError);
      // Still redirect even if tracking fails
    }

    const clickId = clickData?.click_id;
    
    // Asynchronously trigger bot detection (non-blocking)
    if (clickId) {
      const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
      fetch(`${supabaseUrl}/functions/v1/bot-detection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': internalSecret || '',
        },
        body: JSON.stringify({
          click_id: clickId,
          user_agent: userAgent,
          ip: ip
        })
      }).catch(error => {
        console.error('Bot detection failed:', error);
      });
    }

    // Build redirect URL with click_id macro replacement
    let redirectUrl = campaign.offers.offer_url;
    if (clickId) {
      redirectUrl = redirectUrl.replace('{click_id}', clickId);
      redirectUrl = redirectUrl.replace('{clickid}', clickId);
    }
    
    // Add sub_id if provided
    if (subId) {
      const separator = redirectUrl.includes('?') ? '&' : '?';
      redirectUrl += `${separator}sub_id=${encodeURIComponent(subId)}`;
    }

    console.log(`Click tracked: ${clickId} for campaign ${campaignId}`);

    // Perform redirect based on campaign settings
    if (campaign.redirect_mode === 'meta') {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${redirectUrl}">
          <title>Redirecting...</title>
        </head>
        <body>
          <p>Redirecting...</p>
          <script>window.location.href="${redirectUrl}";</script>
        </body>
        </html>
      `;
      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    } else {
      // 302 redirect (default)
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl
        }
      });
    }

  } catch (error) {
    console.error('Error in track-click:', error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: corsHeaders
    });
  }
});