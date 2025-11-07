import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { campaignId } = await req.json();

    // Fetch campaign performance data
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        offers (name, payout, currency)
      `)
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError) throw campaignError;

    // Fetch recent clicks and conversions
    const { data: clicks } = await supabase
      .from('clicks')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const { data: conversions } = await supabase
      .from('conversions')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const totalClicks = clicks?.length || 0;
    const totalConversions = conversions?.length || 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const totalRevenue = conversions?.reduce((sum, c) => sum + Number(c.payout || 0), 0) || 0;

    // Prepare prompt for AI
    const prompt = `Analyze this affiliate marketing campaign and provide optimization recommendations:

Campaign: ${campaignData.name}
Offer: ${campaignData.offers?.name}
Payout: ${campaignData.offers?.currency} ${campaignData.offers?.payout}

Performance (Last 7 Days):
- Total Clicks: ${totalClicks}
- Total Conversions: ${totalConversions}
- Conversion Rate: ${conversionRate.toFixed(2)}%
- Total Revenue: ${campaignData.offers?.currency} ${totalRevenue.toFixed(2)}

Traffic Source: ${campaignData.traffic_source || 'Not specified'}
Target Countries: ${campaignData.countries?.join(', ') || 'Not specified'}
Status: ${campaignData.status}

Please provide:
1. Top 3 actionable optimization recommendations
2. Estimated impact for each recommendation (high/medium/low)
3. Priority level (1-3, with 1 being highest)
4. Specific implementation steps

Format as JSON with this structure:
{
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "impact": "high|medium|low",
      "priority": 1|2|3,
      "steps": ["string"]
    }
  ]
}`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert affiliate marketing optimization consultant. Provide actionable, data-driven recommendations.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI request failed');
    }

    const aiData = await aiResponse.json();
    const recommendations = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({
      success: true,
      campaignData: {
        name: campaignData.name,
        metrics: {
          clicks: totalClicks,
          conversions: totalConversions,
          conversionRate: conversionRate.toFixed(2),
          revenue: totalRevenue.toFixed(2),
          currency: campaignData.offers?.currency
        }
      },
      ...recommendations
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-campaign-optimizer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
