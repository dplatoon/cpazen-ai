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
    // Validate internal secret to prevent unauthorized access
    const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const providedSecret = req.headers.get('X-Internal-Secret');

    if (internalSecret && providedSecret !== internalSecret) {
      console.error("Unauthorized: Invalid internal secret");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: AnalyzeClickPayload = await req.json();
    console.log('Analyzing click for fraud:', payload.clickId);

    let fraudScore = 0;
    const fraudIndicators: string[] = [];

    // Get user's fraud patterns for ML-based detection
    const { data: fraudPatterns } = await supabase
      .from('fraud_patterns')
      .select('*')
      .eq('user_id', payload.userId)
      .gte('confidence_score', 60); // Only use patterns with 60%+ confidence

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

      // Check if this matches a learned pattern
      const velocityPattern = fraudPatterns?.find(
        (p: any) => p.pattern_type === 'click_velocity'
      );
      if (velocityPattern) {
        const boost = Math.round(velocityPattern.confidence_score / 10);
        fraudScore += boost;
        fraudIndicators.push('ml_velocity_pattern_match');
        
        // Update pattern last triggered
        await supabase
          .from('fraud_patterns')
          .update({ last_triggered_at: new Date().toISOString() })
          .eq('id', velocityPattern.id);
      } else {
        // Create new pattern to learn from
        await supabase.from('fraud_patterns').insert({
          user_id: payload.userId,
          pattern_type: 'click_velocity',
          pattern_data: { clicks_per_minute: recentClicks.length, ip_address: payload.ipAddress },
          confidence_score: 50, // Start with medium confidence
        });
      }
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

            // Check for conversion time pattern
            const conversionPattern = fraudPatterns?.find(
              (p: any) => p.pattern_type === 'conversion_time'
            );
            if (conversionPattern) {
              const boost = Math.round(conversionPattern.confidence_score / 10);
              fraudScore += boost;
              fraudIndicators.push('ml_conversion_pattern_match');
              
              await supabase
                .from('fraud_patterns')
                .update({ last_triggered_at: new Date().toISOString() })
                .eq('id', conversionPattern.id);
            } else {
              await supabase.from('fraud_patterns').insert({
                user_id: payload.userId,
                pattern_type: 'conversion_time',
                pattern_data: { time_to_convert_seconds: timeDiff },
                confidence_score: 50,
              });
            }
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

        // Check geo anomaly pattern
        const geoPattern = fraudPatterns?.find(
          (p: any) => p.pattern_type === 'geo_anomaly'
        );
        if (geoPattern) {
          fraudScore += 10;
          fraudIndicators.push('ml_geo_pattern_match');
        }
      }
    }

    // 5. Device fingerprint anomaly detection
    const { data: deviceClicks, error: deviceError } = await supabase
      .from('clicks')
      .select('id')
      .eq('user_agent', payload.userAgent)
      .eq('ip_address', payload.ipAddress)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

    if (!deviceError && deviceClicks && deviceClicks.length > 50) {
      fraudScore += 20;
      fraudIndicators.push('device_fingerprint_anomaly');
      
      const fingerprintPattern = fraudPatterns?.find(
        (p: any) => p.pattern_type === 'device_fingerprint'
      );
      if (fingerprintPattern) {
        fraudScore += 10;
        fraudIndicators.push('ml_fingerprint_pattern_match');
      } else {
        await supabase.from('fraud_patterns').insert({
          user_id: payload.userId,
          pattern_type: 'device_fingerprint',
          pattern_data: { clicks_per_hour: deviceClicks.length, user_agent: payload.userAgent, ip: payload.ipAddress },
          confidence_score: 50,
        });
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