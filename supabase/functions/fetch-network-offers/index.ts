import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MaxBountyOffer {
  id: number;
  name: string;
  payout: number;
  countries: string[];
  preview_url: string;
  tracking_url: string;
  status: string;
}

interface EverflowOffer {
  network_offer_id: number;
  name: string;
  payout: { amount: number };
  countries: { code: string }[];
  tracking_url: string;
  status: string;
}

interface NetworkOffer {
  network_offer_id: string;
  name: string;
  payout: number;
  currency: string;
  countries: string[];
  offer_url: string;
  status: string;
  network: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { network_account_id } = await req.json();

    if (!network_account_id) {
      return new Response(JSON.stringify({ error: 'network_account_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get network account with credentials
    const { data: account, error: accountError } = await supabase
      .from('network_accounts')
      .select('*')
      .eq('id', network_account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      console.error('Account fetch error:', accountError);
      return new Response(JSON.stringify({ error: 'Network account not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = account.config_json as Record<string, unknown>;
    const apiKey = account.api_key as string | null;
    let offers: NetworkOffer[] = [];

    console.log(`Fetching offers for network: ${account.network_type}, has API key: ${!!apiKey}`);

    if (account.network_type === 'maxbounty') {
      offers = await fetchMaxBountyOffers(apiKey, account.external_id);
    } else if (account.network_type === 'everflow') {
      offers = await fetchEverflowOffers(apiKey, account.external_id);
    } else {
      // For networks without API support, return demo offers
      offers = generateDemoOffers(account.network_type, account.name);
    }

    console.log(`Found ${offers.length} offers for ${account.network_type}`);

    return new Response(JSON.stringify({ 
      success: true, 
      offers,
      network: account.network_type,
      account_name: account.name,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching network offers:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch offers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchMaxBountyOffers(apiKey: string | null, affiliateId: string | null): Promise<NetworkOffer[]> {
  if (!apiKey) {
    console.log('No MaxBounty API key, returning demo offers');
    return generateDemoOffers('maxbounty', 'MaxBounty');
  }

  try {
    // MaxBounty API endpoint
    const response = await fetch(`https://www.maxbounty.com/api/v1/offers`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`MaxBounty API error: ${response.status}`);
      return generateDemoOffers('maxbounty', 'MaxBounty');
    }

    const data = await response.json();
    const offers = data.offers || data || [];

    return offers.map((offer: MaxBountyOffer) => ({
      network_offer_id: String(offer.id),
      name: offer.name,
      payout: offer.payout,
      currency: 'USD',
      countries: offer.countries || [],
      offer_url: offer.tracking_url?.replace('{s2}', '{click_id}') || offer.preview_url,
      status: offer.status === 'active' ? 'active' : 'paused',
      network: 'maxbounty',
    }));
  } catch (error) {
    console.error('MaxBounty API error:', error);
    return generateDemoOffers('maxbounty', 'MaxBounty');
  }
}

async function fetchEverflowOffers(apiToken: string | null, networkId: string | null): Promise<NetworkOffer[]> {
  if (!apiToken || !networkId) {
    console.log('No Everflow API credentials, returning demo offers');
    return generateDemoOffers('everflow', 'Everflow');
  }

  try {
    // Everflow API endpoint
    const response = await fetch(`https://api.everflow.io/v1/networks/${networkId}/offers`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`Everflow API error: ${response.status}`);
      return generateDemoOffers('everflow', 'Everflow');
    }

    const data = await response.json();
    const offers = data.offers || data || [];

    return offers.map((offer: EverflowOffer) => ({
      network_offer_id: String(offer.network_offer_id),
      name: offer.name,
      payout: offer.payout?.amount || 0,
      currency: 'USD',
      countries: offer.countries?.map((c: { code: string }) => c.code) || [],
      offer_url: offer.tracking_url?.replace('{transaction_id}', '{click_id}') || '',
      status: offer.status === 'active' ? 'active' : 'paused',
      network: 'everflow',
    }));
  } catch (error) {
    console.error('Everflow API error:', error);
    return generateDemoOffers('everflow', 'Everflow');
  }
}

function generateDemoOffers(networkType: string, networkName: string): NetworkOffer[] {
  // Generate realistic demo offers based on network type
  const demoOffers: Record<string, NetworkOffer[]> = {
    maxbounty: [
      {
        network_offer_id: 'mb-demo-1',
        name: 'Premium Survey - US Only',
        payout: 2.50,
        currency: 'USD',
        countries: ['US'],
        offer_url: 'https://track.maxbounty.com/click?pid={affiliate_id}&offer_id=1234&s2={click_id}',
        status: 'active',
        network: 'maxbounty',
      },
      {
        network_offer_id: 'mb-demo-2',
        name: 'Credit Score Check - High Converting',
        payout: 35.00,
        currency: 'USD',
        countries: ['US', 'CA'],
        offer_url: 'https://track.maxbounty.com/click?pid={affiliate_id}&offer_id=5678&s2={click_id}',
        status: 'active',
        network: 'maxbounty',
      },
      {
        network_offer_id: 'mb-demo-3',
        name: 'Insurance Quote Lead',
        payout: 12.00,
        currency: 'USD',
        countries: ['US'],
        offer_url: 'https://track.maxbounty.com/click?pid={affiliate_id}&offer_id=9012&s2={click_id}',
        status: 'active',
        network: 'maxbounty',
      },
    ],
    everflow: [
      {
        network_offer_id: 'ef-demo-1',
        name: 'Mobile App Install - iOS',
        payout: 1.80,
        currency: 'USD',
        countries: ['US', 'GB', 'CA', 'AU'],
        offer_url: 'https://track.everflow.io/click?offer_id=1&transaction_id={click_id}',
        status: 'active',
        network: 'everflow',
      },
      {
        network_offer_id: 'ef-demo-2',
        name: 'Subscription Trial - Streaming Service',
        payout: 25.00,
        currency: 'USD',
        countries: ['US', 'GB'],
        offer_url: 'https://track.everflow.io/click?offer_id=2&transaction_id={click_id}',
        status: 'active',
        network: 'everflow',
      },
    ],
    shareasale: [
      {
        network_offer_id: 'sas-demo-1',
        name: 'E-commerce - Fashion Store',
        payout: 15.00,
        currency: 'USD',
        countries: ['US', 'CA', 'GB'],
        offer_url: 'https://shareasale.com/r.cfm?b=1234&u={affiliate_id}&m=5678&afftrack={click_id}',
        status: 'active',
        network: 'shareasale',
      },
    ],
    cj: [
      {
        network_offer_id: 'cj-demo-1',
        name: 'Tech Retailer - Electronics',
        payout: 8.00,
        currency: 'USD',
        countries: ['US'],
        offer_url: 'https://www.anrdoezrs.net/links/{publisher_id}/type/dlg/sid/{click_id}',
        status: 'active',
        network: 'cj',
      },
    ],
    clickbank: [
      {
        network_offer_id: 'cb-demo-1',
        name: 'Digital Course - Health & Fitness',
        payout: 45.00,
        currency: 'USD',
        countries: ['US', 'CA', 'GB', 'AU'],
        offer_url: 'https://hop.clickbank.net/?affiliate={account}&vendor=product&tid={click_id}',
        status: 'active',
        network: 'clickbank',
      },
    ],
  };

  return demoOffers[networkType] || [];
}
