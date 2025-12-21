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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { domainId } = await req.json();
    
    if (!domainId) {
      return new Response(JSON.stringify({ error: 'Domain ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get domain details
    const { data: domain, error: domainError } = await supabase
      .from('tracking_domains')
      .select('*')
      .eq('id', domainId)
      .eq('user_id', user.id)
      .single();

    if (domainError || !domain) {
      return new Response(JSON.stringify({ error: 'Domain not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Verifying domain:', domain.domain);

    // Perform DNS lookup
    let verified = false;
    let message = '';

    try {
      // Check CNAME record
      const expectedTarget = 'rdajybqalmsdycxsruon.supabase.co';
      
      // Use DNS-over-HTTPS for verification
      const dnsResponse = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${domain.domain}&type=CNAME`,
        {
          headers: {
            'Accept': 'application/dns-json',
          },
        }
      );

      if (dnsResponse.ok) {
        const dnsData = await dnsResponse.json();
        console.log('DNS response:', JSON.stringify(dnsData));

        if (dnsData.Answer && dnsData.Answer.length > 0) {
          const cnameRecords = dnsData.Answer.filter((a: any) => a.type === 5);
          for (const record of cnameRecords) {
            const target = record.data?.replace(/\.$/, ''); // Remove trailing dot
            if (target === expectedTarget) {
              verified = true;
              message = 'CNAME record verified successfully';
              break;
            }
          }
          if (!verified) {
            message = `CNAME record found but points to wrong target. Expected: ${expectedTarget}`;
          }
        } else {
          // Check for TXT record as alternative
          const txtResponse = await fetch(
            `https://cloudflare-dns.com/dns-query?name=_cpazen.${domain.domain}&type=TXT`,
            {
              headers: {
                'Accept': 'application/dns-json',
              },
            }
          );

          if (txtResponse.ok) {
            const txtData = await txtResponse.json();
            if (txtData.Answer && txtData.Answer.length > 0) {
              for (const record of txtData.Answer) {
                if (record.data?.includes(domain.verification_token)) {
                  verified = true;
                  message = 'TXT record verified successfully';
                  break;
                }
              }
            }
          }

          if (!verified) {
            message = 'No valid DNS records found. Please add the CNAME or TXT record.';
          }
        }
      } else {
        message = 'DNS lookup failed. Please try again later.';
      }
    } catch (dnsError) {
      console.error('DNS verification error:', dnsError);
      message = 'DNS verification failed. Please check your domain configuration.';
    }

    // Update domain status
    const { error: updateError } = await supabase
      .from('tracking_domains')
      .update({
        verification_status: verified ? 'verified' : 'failed',
        verified_at: verified ? new Date().toISOString() : null,
      })
      .eq('id', domainId);

    if (updateError) {
      console.error('Failed to update domain status:', updateError);
    }

    return new Response(JSON.stringify({
      verified,
      message,
      domain: domain.domain,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Verify domain error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
