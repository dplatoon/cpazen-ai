import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeClickPayload {
  clickId: string;
  userId: string;
  campaignId: string;
  ipAddress: string;
  userAgent: string;
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

    const payload: AnalyzeClickPayload = await req.json();
    console.log('Analyzing click for fraud:', payload.clickId);

    let fraudScore = 0;
    const fraudIndicators: string[] = [];

    // 1. Check click velocity from same IP (suspicious if > 10 clicks in 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentClicks, error: clicksError } = await supabase
      .from('clicks')
      .select('id')
      .eq('ip_address', payload.ipAddress)
      .gte('created_at', oneMinuteAgo);

    if (clicksError) {
      console.error('Error checking click velocity:', clicksError);
    } else if (recentClicks && recentClicks.length > 10) {
      fraudScore += 30;
      fraudIndicators.push('high_click_velocity');
      console.log(`High click velocity detected: ${recentClicks.length} clicks in 1 minute`);
    }

    // 2. Check for bot patterns in user agent
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i
    ];
    if (botPatterns.some(pattern => pattern.test(payload.userAgent))) {
      fraudScore += 40;
      fraudIndicators.push('bot_user_agent');
      console.log('Bot user agent detected');
    }

    // 3. Check conversion velocity (suspicious if conversion happens too quickly)
    const { data: quickConversions, error: convError } = await supabase
      .from('conversions')
      .select('created_at, clicks(created_at)')
      .eq('click_id', payload.clickId);

    if (!convError && quickConversions && quickConversions.length > 0) {
      const conversion = quickConversions[0];
      if (conversion.clicks && Array.isArray(conversion.clicks)) {
        const click = conversion.clicks[0];
        if (click) {
          const clickTime = new Date(click.created_at).getTime();
          const convTime = new Date(conversion.created_at).getTime();
          const timeDiff = (convTime - clickTime) / 1000; // seconds

          if (timeDiff < 2) {
            fraudScore += 35;
            fraudIndicators.push('instant_conversion');
            console.log(`Instant conversion detected: ${timeDiff}s`);
          }
        }
      }
    }

    // 4. Check for geographic inconsistencies (clicks from same IP but different countries)
    const { data: geoClicks, error: geoError } = await supabase
      .from('clicks')
      .select('country')
      .eq('ip_address', payload.ipAddress)
      .neq('country', null)
      .limit(10);

    if (!geoError && geoClicks && geoClicks.length > 1) {
      const uniqueCountries = new Set(geoClicks.map(c => c.country));
      if (uniqueCountries.size > 2) {
        fraudScore += 25;
        fraudIndicators.push('geo_inconsistency');
        console.log(`Geographic inconsistency detected: ${uniqueCountries.size} countries`);
      }
    }

    // Update click with fraud score and indicators
    const { error: updateError } = await supabase
      .from('clicks')
      .update({
        fraud_score: fraudScore,
        fraud_indicators: fraudIndicators,
      })
      .eq('id', payload.clickId);

    if (updateError) {
      console.error('Error updating click fraud score:', updateError);
    }

    // Create fraud alert if score is high
    if (fraudScore >= 50) {
      console.log(`Creating fraud alert for click ${payload.clickId}, score: ${fraudScore}`);
      
      const severity = fraudScore >= 80 ? 'high' : fraudScore >= 60 ? 'medium' : 'low';
      
      const { error: alertError } = await supabase
        .from('fraud_alerts')
        .insert({
          user_id: payload.userId,
          click_id: payload.clickId,
          campaign_id: payload.campaignId,
          alert_type: 'suspicious_activity',
          severity,
          description: `Fraud score: ${fraudScore}. Indicators: ${fraudIndicators.join(', ')}`,
          metadata: {
            fraud_score: fraudScore,
            fraud_indicators: fraudIndicators,
            ip_address: payload.ipAddress,
          },
        });

      if (alertError) {
        console.error('Error creating fraud alert:', alertError);
      }
    }

    return new Response(
      JSON.stringify({
        clickId: payload.clickId,
        fraudScore,
        fraudIndicators,
        alertCreated: fraudScore >= 50,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fraud-detection:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});