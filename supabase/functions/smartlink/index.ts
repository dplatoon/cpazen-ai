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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const affiliateId = url.searchParams.get('aff') || url.pathname.split('/').pop();
    const subId = url.searchParams.get('sub');

    // Get geo and device info from request
    const country = req.headers.get('cf-ipcountry') || 
                    req.headers.get('x-vercel-ip-country') || 'US';
    const userAgent = req.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 'unknown';

    // Find best offer for this traffic profile
    // Priority: geo match > payout > conversion rate > daily cap not reached
    const { data: offers, error } = await supabase
      .from('offers')
      .select('id, name, offer_url, payout, currency, countries, daily_cap, status')
      .eq('status', 'active')
      .order('payout', { ascending: false });

    if (error || !offers || offers.length === 0) {
      console.error('Smartlink: No active offers found', error);
      return new Response('No offers available', { status: 404, headers: corsHeaders });
    }

    // Score each offer based on traffic match
    const scoredOffers = offers.map(offer => {
      let score = 0;

      // Geo match: +10 if country matches, +5 if no geo restriction (worldwide)
      if (offer.countries && offer.countries.length > 0) {
        if (offer.countries.includes(country)) {
          score += 10;
        } else {
          score -= 100; // Disqualify if geo doesn't match
        }
      } else {
        score += 5; // Worldwide offer
      }

      // Payout: higher payout = higher score
      score += Math.min(offer.payout * 2, 20);

      return { ...offer, score };
    });

    // Filter out disqualified offers and sort by score
    const validOffers = scoredOffers
      .filter(o => o.score > 0)
      .sort((a, b) => b.score - a.score);

    if (validOffers.length === 0) {
      return new Response('No matching offers for your region', { 
        status: 404, headers: corsHeaders 
      });
    }

    // Pick the best offer (with some randomization among top 3 for A/B testing)
    const topOffers = validOffers.slice(0, Math.min(3, validOffers.length));
    const selectedOffer = topOffers[Math.floor(Math.random() * topOffers.length)];

    // Record the smartlink click
    const { data: clickData } = await supabase
      .from('clicks')
      .insert({
        campaign_id: null, // Smartlink clicks don't have a specific campaign
        user_id: affiliateId || null,
        ip_address: ip,
        user_agent: userAgent.slice(0, 500),
        os: isMobile ? (userAgent.includes('Android') ? 'Android' : 'iOS') : 'Desktop',
        browser: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : 'Other',
        country: country,
        sub_id: subId || 'smartlink',
        bot_score: 0,
      })
      .select('click_id')
      .single();

    // Build redirect URL
    let redirectUrl = selectedOffer.offer_url;
    if (clickData?.click_id) {
      redirectUrl = redirectUrl.replace('{click_id}', clickData.click_id);
      redirectUrl = redirectUrl.replace('{clickid}', clickData.click_id);
    }
    if (subId) {
      const sep = redirectUrl.includes('?') ? '&' : '?';
      redirectUrl += `${sep}sub_id=${encodeURIComponent(subId)}`;
    }

    // Log smartlink selection for analytics
    console.log(`Smartlink: ${country}/${isMobile ? 'mobile' : 'desktop'} → ${selectedOffer.name} ($${selectedOffer.payout})`);

    // 302 redirect to selected offer
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, 'Location': redirectUrl },
    });

  } catch (error) {
    console.error('Smartlink error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
