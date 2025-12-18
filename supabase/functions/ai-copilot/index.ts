import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages, campaignContext } = await req.json();
    
    // If campaignContext provided with campaignId, verify user owns the campaign
    if (campaignContext?.campaignId) {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('user_id')
        .eq('id', campaignContext.campaignId)
        .single();
      
      if (campaignError || !campaign || campaign.user_id !== user.id) {
        console.error('Campaign access denied:', campaignError?.message);
        return new Response(
          JSON.stringify({ error: 'Campaign not found or access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    const systemPrompt = `You are an AI assistant specialized in CPA (Cost Per Action) affiliate marketing campaign optimization. You help marketers analyze and improve their campaign performance.

Current Campaign Context:
${campaignContext ? `
- Campaign: ${campaignContext.campaignName || 'Unknown'}
- Clicks: ${campaignContext.kpis?.clicks?.toLocaleString() || 'N/A'}
- Conversions: ${campaignContext.kpis?.conversions || 'N/A'}
- Revenue: $${campaignContext.kpis?.revenue?.toFixed(2) || 'N/A'}
- Cost: $${campaignContext.kpis?.cost?.toFixed(2) || 'N/A'}
- Profit: $${campaignContext.kpis?.profit?.toFixed(2) || 'N/A'}
- CPA: $${campaignContext.kpis?.cpa?.toFixed(2) || 'N/A'}
- ROAS: ${campaignContext.kpis?.roas?.toFixed(2) || 'N/A'}x
- Conversion Rate: ${campaignContext.kpis?.conversionRate?.toFixed(2) || 'N/A'}%
- Health Score: ${campaignContext.health?.score || 'N/A'}/100 (${campaignContext.health?.label || 'Unknown'})
- Health Reason: ${campaignContext.health?.reason || 'N/A'}
- Pending Recommendations: ${campaignContext.recommendations?.filter((r: any) => r.status === 'new').length || 0}
` : 'No campaign data available.'}

Guidelines:
- Be concise and actionable in your responses
- Focus on data-driven insights
- Suggest specific optimizations based on the metrics
- When CPA is high, suggest bid adjustments, targeting changes, or creative tests
- When profit is negative, prioritize cost reduction strategies
- When ROAS is good, suggest scaling strategies
- Always consider the health score and its reason in your analysis`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Copilot error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
