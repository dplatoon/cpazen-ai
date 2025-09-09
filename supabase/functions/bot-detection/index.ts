import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { click_id, user_agent, ip } = await req.json();

    if (!click_id || !user_agent || !ip) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      // Fallback to basic detection
      const botScore = basicBotDetection(user_agent, ip);
      await updateBotScore(click_id, botScore);
      
      return new Response(JSON.stringify({ bot_score: botScore }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Advanced AI-powered bot detection
    const prompt = `
    Analyze this web request and provide a bot likelihood score (0-100):
    
    User Agent: ${user_agent}
    IP: ${ip}
    
    Consider these factors:
    - Browser signatures and versions
    - User agent patterns typical of bots
    - Common bot user agents
    - Suspicious patterns in the request
    
    Return ONLY a number between 0-100 where:
    - 0-20: Very likely human
    - 21-40: Probably human
    - 41-60: Uncertain
    - 61-80: Probably bot
    - 81-100: Very likely bot
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a bot detection expert. Analyze user agents and IP patterns to detect automated traffic. Respond with only a number 0-100.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 10,
        temperature: 0.1
      }),
    });

    const data = await response.json();
    const botScore = parseInt(data.choices[0]?.message?.content?.trim()) || 50;

    // Update the click record with bot score
    await updateBotScore(click_id, botScore);

    return new Response(JSON.stringify({ bot_score: botScore }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in bot-detection:', error);
    
    // Fallback detection on error
    const { click_id, user_agent } = await req.json().catch(() => ({}));
    if (click_id && user_agent) {
      const fallbackScore = basicBotDetection(user_agent, '');
      await updateBotScore(click_id, fallbackScore);
      
      return new Response(JSON.stringify({ bot_score: fallbackScore }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Bot detection failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Basic bot detection fallback
function basicBotDetection(userAgent: string, ip: string): number {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
    /facebook/i, /twitter/i, /linkedin/i,
    /googlebot/i, /bingbot/i, /yandex/i
  ];

  const suspiciousPatterns = [
    /headless/i, /phantom/i, /selenium/i,
    /automated/i, /test/i, /monitor/i
  ];

  let score = 0;

  // Check for bot patterns
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      score += 30;
      break;
    }
  }

  // Check for suspicious patterns
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      score += 25;
    }
  }

  // Check user agent length (very short or very long can be suspicious)
  if (userAgent.length < 20 || userAgent.length > 500) {
    score += 15;
  }

  // Check for missing common browser components
  if (!userAgent.includes('Mozilla') && !userAgent.includes('AppleWebKit')) {
    score += 20;
  }

  return Math.min(score, 100);
}

// Update bot score in database
async function updateBotScore(clickId: string, botScore: number) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from('clicks')
      .update({ bot_score: botScore })
      .eq('click_id', clickId);

    console.log(`Updated bot score for click ${clickId}: ${botScore}`);
  } catch (error) {
    console.error('Error updating bot score:', error);
  }
}