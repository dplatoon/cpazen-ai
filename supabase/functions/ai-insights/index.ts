import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with anon key for auth verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        insights: ['AI insights require OpenAI API key configuration.'],
        dataAnalyzed: { message: 'OpenAI API key not configured' }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create service client for data access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get yesterday's data for analysis - FILTERED BY USER
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
    const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString();

    // Fetch performance data filtered by user's campaigns
    const { data: clicksData } = await supabase
      .from('clicks')
      .select(`
        *,
        campaigns!inner (
          name,
          user_id,
          offers (
            name,
            network,
            payout
          )
        ),
        conversions (
          payout,
          status
        )
      `)
      .eq('campaigns.user_id', user.id)
      .gte('created_at', yesterdayStart)
      .lte('created_at', yesterdayEnd);

    if (!clicksData || clicksData.length === 0) {
      return new Response(JSON.stringify({ 
        insights: ['No data available for analysis yesterday. Start driving traffic to see insights!']
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process data for analysis
    const totalClicks = clicksData.length;
    const totalConversions = clicksData.filter(c => c.conversions && c.conversions.length > 0).length;
    const totalRevenue = clicksData.reduce((sum, c) => 
      sum + (c.conversions && c.conversions[0]?.payout || 0), 0
    );
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0;
    const epc = totalClicks > 0 ? (totalRevenue / totalClicks) : 0;

    // Group by campaign
    const campaignStats = clicksData.reduce((acc, click) => {
      const campaignName = click.campaigns.name;
      if (!acc[campaignName]) {
        acc[campaignName] = {
          clicks: 0,
          conversions: 0,
          revenue: 0,
          offer: click.campaigns.offers?.name || 'Unknown',
          network: click.campaigns.offers?.network || 'Unknown'
        };
      }
      acc[campaignName].clicks++;
      if (click.conversions && click.conversions.length > 0) {
        acc[campaignName].conversions++;
        acc[campaignName].revenue += click.conversions[0].payout;
      }
      return acc;
    }, {});

    // Group by traffic source
    const trafficSources = clicksData.reduce((acc, click) => {
      const source = click.referrer || 'Direct';
      if (!acc[source]) acc[source] = { clicks: 0, conversions: 0 };
      acc[source].clicks++;
      if (click.conversions && click.conversions.length > 0) acc[source].conversions++;
      return acc;
    }, {});

    // Group by GEO
    const geoStats = clicksData.reduce((acc, click) => {
      const country = click.country || 'Unknown';
      if (!acc[country]) acc[country] = { clicks: 0, conversions: 0 };
      acc[country].clicks++;
      if (click.conversions && click.conversions.length > 0) acc[country].conversions++;
      return acc;
    }, {});

    // Create analysis prompt
    const analysisData = {
      summary: {
        totalClicks,
        totalConversions,
        totalRevenue: totalRevenue.toFixed(2),
        conversionRate: conversionRate.toFixed(2),
        epc: epc.toFixed(2)
      },
      topCampaigns: Object.entries(campaignStats)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .slice(0, 5),
      trafficSources: Object.entries(trafficSources)
        .sort(([,a], [,b]) => b.clicks - a.clicks)
        .slice(0, 5),
      topGeos: Object.entries(geoStats)
        .sort(([,a], [,b]) => b.clicks - a.clicks)
        .slice(0, 5)
    };

    const prompt = `
    Analyze this CPA affiliate marketing performance data from yesterday and provide 3 actionable optimization insights:

    PERFORMANCE SUMMARY:
    - Total Clicks: ${totalClicks}
    - Total Conversions: ${totalConversions}
    - Total Revenue: $${totalRevenue.toFixed(2)}
    - Conversion Rate: ${conversionRate.toFixed(2)}%
    - EPC (Earnings Per Click): $${epc.toFixed(2)}

    TOP CAMPAIGNS:
    ${analysisData.topCampaigns.map(([name, stats]) => 
      `${name}: ${stats.clicks} clicks, ${stats.conversions} conversions, $${stats.revenue.toFixed(2)} revenue (${stats.offer} - ${stats.network})`
    ).join('\n')}

    TOP TRAFFIC SOURCES:
    ${analysisData.trafficSources.map(([source, stats]) => 
      `${source}: ${stats.clicks} clicks, ${stats.conversions} conversions`
    ).join('\n')}

    TOP GEOS:
    ${analysisData.topGeos.map(([geo, stats]) => 
      `${geo}: ${stats.clicks} clicks, ${stats.conversions} conversions`
    ).join('\n')}

    Provide exactly 3 bullet points with specific, actionable optimization recommendations for improving performance.
    `;

    // Call OpenAI API
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
            content: 'You are an expert CPA affiliate marketing optimization consultant. Provide specific, actionable insights based on performance data.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid OpenAI response');
    }

    const insights = data.choices[0].message.content
      .split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().match(/^\d+\./))
      .map(line => line.replace(/^[•\-\d\.]\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 3);

    console.log(`AI Insights generated for user ${user.id}:`, insights);

    return new Response(JSON.stringify({ 
      insights,
      dataAnalyzed: analysisData.summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ai-insights:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});