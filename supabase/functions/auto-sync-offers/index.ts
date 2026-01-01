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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all network accounts with auto_sync enabled and API keys
    const { data: accounts, error: accountsError } = await supabase
      .from('network_accounts')
      .select('*')
      .eq('auto_sync', true)
      .eq('is_active', true)
      .not('api_key', 'is', null);

    if (accountsError) {
      throw accountsError;
    }

    console.log(`Found ${accounts?.length || 0} accounts with auto-sync enabled`);

    const results = [];

    for (const account of accounts || []) {
      try {
        // Call the fetch-network-offers function for each account
        const response = await fetch(`${supabaseUrl}/functions/v1/fetch-network-offers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            network_account_id: account.id,
          }),
        });

        const result = await response.json();
        
        results.push({
          account_id: account.id,
          network: account.network_type,
          success: response.ok,
          offers_count: result.offers?.length || 0,
        });

        console.log(`Synced ${account.network_type} account ${account.id}: ${result.offers?.length || 0} offers`);
      } catch (error) {
        console.error(`Error syncing account ${account.id}:`, error);
        results.push({
          account_id: account.id,
          network: account.network_type,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced_accounts: results.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Auto-sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
