import { supabase } from '@/integrations/supabase/client';

export async function seedDemoData(userId: string) {
  try {
    // Create 5 demo offers first
    const offers = [
      {
        name: "Premium Credit Card",
        network: "ClickBank",
        payout: 50.00,
        currency: "USD",
        countries: ["US"],
        daily_cap: 100,
        status: "active",
        offer_url: "https://example.com/credit-card",
        user_id: userId
      },
      {
        name: "Shopify 14-Day Trial",
        network: "ShareASale",
        payout: 25.00,
        currency: "USD",
        countries: ["US", "CA", "GB"],
        daily_cap: 200,
        status: "active",
        offer_url: "https://example.com/shopify",
        user_id: userId
      },
      {
        name: "Puzzle Game Install",
        network: "MaxBounty",
        payout: 2.50,
        currency: "USD",
        countries: ["US", "CA", "GB", "AU"],
        daily_cap: 1000,
        status: "active",
        offer_url: "https://example.com/game",
        user_id: userId
      },
      {
        name: "Keto Diet Trial",
        network: "ClickBank",
        payout: 35.00,
        currency: "USD",
        countries: ["US"],
        daily_cap: 50,
        status: "active",
        offer_url: "https://example.com/keto",
        user_id: userId
      },
      {
        name: "Dating Site Premium",
        network: "CJ Affiliate",
        payout: 15.00,
        currency: "USD",
        countries: ["US", "CA", "GB", "AU", "NZ"],
        daily_cap: 150,
        status: "active",
        offer_url: "https://example.com/dating",
        user_id: userId
      }
    ];

    const { data: insertedOffers, error: offersError } = await supabase
      .from('offers')
      .insert(offers)
      .select();

    if (offersError) throw offersError;

    // Create 5 demo campaigns
    const campaigns = insertedOffers!.map((offer, index) => ({
      name: [
        "Finance - Credit Card Offers (US)",
        "E-commerce - Shopify Trial",
        "Gaming - Mobile App Install",
        "Health - Weight Loss Trial",
        "Dating - Premium Membership"
      ][index],
      status: index === 3 ? "paused" : "active",
      user_id: userId,
      tracking_domain: "track.cpazen.com",
      offer_id: offer.id,
      cost_model: "CPA",
      redirect_mode: "302",
      created_at: new Date(Date.now() - (30 - index * 5) * 24 * 60 * 60 * 1000).toISOString()
    }));

    const { data: insertedCampaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .insert(campaigns)
      .select();

    if (campaignsError) throw campaignsError;

    // Generate realistic click data (30 days worth)
    const clicks: any[] = [];
    const conversions: any[] = [];
    
    insertedCampaigns!.forEach((campaign, campaignIndex) => {
      const offer = insertedOffers![campaignIndex];
      const daysBack = 30;
      const clicksPerDay = [50, 75, 100, 125, 150][campaignIndex];
      
      for (let day = daysBack; day >= 0; day--) {
        const dailyClicks = Math.floor(clicksPerDay * (0.8 + Math.random() * 0.4));
        
        for (let i = 0; i < dailyClicks; i++) {
          const timestamp = new Date(Date.now() - day * 24 * 60 * 60 * 1000 + Math.random() * 24 * 60 * 60 * 1000);
          const clickId = crypto.randomUUID();
          
          const countries = offer.countries || ["US"];
          const country = countries[Math.floor(Math.random() * countries.length)];
          
          clicks.push({
            campaign_id: campaign.id,
            user_id: userId,
            click_id: clickId,
            ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            user_agent: getUserAgent(),
            country: country,
            os: getOS(),
            browser: getBrowser(),
            device: getDevice(),
            referrer: getReferrer(),
            is_bot: Math.random() > 0.95,
            bot_score: Math.random() > 0.95 ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30),
            created_at: timestamp.toISOString()
          });
          
          // Generate conversions (2-8% conversion rate depending on campaign)
          const conversionRate = [0.04, 0.06, 0.08, 0.02, 0.05][campaignIndex];
          if (Math.random() < conversionRate) {
            conversions.push({
              campaign_id: campaign.id,
              user_id: userId,
              click_id: clickId,
              payout: offer.payout,
              currency: offer.currency,
              status: Math.random() > 0.1 ? "approved" : "pending",
              created_at: new Date(timestamp.getTime() + Math.random() * 3600000).toISOString()
            });
          }
        }
      }
    });

    // Insert clicks in batches of 1000
    for (let i = 0; i < clicks.length; i += 1000) {
      const batch = clicks.slice(i, i + 1000);
      const { error: clicksError } = await supabase.from('clicks').insert(batch);
      if (clicksError) throw clicksError;
    }

    // Insert conversions
    const { error: conversionsError } = await supabase.from('conversions').insert(conversions);
    if (conversionsError) throw conversionsError;

    return {
      campaigns: insertedCampaigns!.length,
      clicks: clicks.length,
      conversions: conversions.length
    };
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

function getUserAgent() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

function getOS() {
  const os = ['Windows', 'macOS', 'iOS', 'Android'];
  return os[Math.floor(Math.random() * os.length)];
}

function getBrowser() {
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
  return browsers[Math.floor(Math.random() * browsers.length)];
}

function getDevice() {
  const devices = ['desktop', 'mobile', 'tablet'];
  const weights = [0.6, 0.3, 0.1];
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random < sum) return devices[i];
  }
  return devices[0];
}

function getReferrer() {
  const referrers = [
    'https://www.facebook.com/',
    'https://www.google.com/search',
    'https://www.tiktok.com/',
    'https://www.instagram.com/',
    'https://t.co/',
    'direct'
  ];
  return referrers[Math.floor(Math.random() * referrers.length)];
}
