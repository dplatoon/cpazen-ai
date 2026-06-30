import { serve } from "https://deno.land/std@0.214.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// bKash API endpoints
const BKASH_URLS = {
  sandbox: {
    token: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant',
    b2p: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/payment/b2cPayment',
    query: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/payment/query',
  },
  production: {
    token: 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant',
    b2p: 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/payment/b2cPayment',
    query: 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/payment/query',
  }
};

interface BkashCredentials {
  app_key: string;
  app_secret: string;
  username: string;
  password: string;
}

// Get bKash auth token
async function getBkashToken(creds: BkashCredentials, env: 'sandbox' | 'production'): Promise<string> {
  const url = BKASH_URLS[env].token;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'username': creds.username,
      'password': creds.password,
    },
    body: JSON.stringify({
      app_key: creds.app_key,
      app_secret: creds.app_secret,
    }),
  });

  const data = await response.json();
  
  if (!data.id_token) {
    throw new Error(`bKash token failed: ${data.statusMessage || JSON.stringify(data)}`);
  }

  return data.id_token;
}

// Execute B2P (Business to Person) transfer
async function executeBkashB2P(
  token: string,
  creds: BkashCredentials,
  env: 'sandbox' | 'production',
  params: {
    amount: number;
    receiverMSISDN: string;
    invoiceNumber: string;
  }
) {
  const url = BKASH_URLS[env].b2p;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token,
      'X-APP-Key': creds.app_key,
    },
    body: JSON.stringify({
      amount: params.amount.toFixed(2),
      currency: 'BDT',
      receiverMSISDN: params.receiverMSISDN,
      invoiceNumber: params.invoiceNumber,
      merchantInvoiceNumber: params.invoiceNumber,
    }),
  });

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, withdrawal_id, transaction_id, batch_withdrawal_ids } = body;

    // Get bKash gateway config
    const { data: gatewayConfig } = await supabase
      .from('payment_gateway_configs')
      .select('*')
      .eq('gateway', 'bkash')
      .eq('is_active', true)
      .single();

    if (!gatewayConfig) {
      return new Response(JSON.stringify({ 
        error: 'bKash gateway not configured. Go to Admin > Settings to add bKash API credentials.' 
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const creds = gatewayConfig.credentials as BkashCredentials;
    const env = gatewayConfig.environment as 'sandbox' | 'production';

    // ═══════════════════════════════════════════════
    // ACTION: Single payout
    // ═══════════════════════════════════════════════
    if (action === 'single_payout' && withdrawal_id) {
      // Initiate payout record
      const { data: txnId, error: initError } = await supabase.rpc('initiate_bkash_payout', {
        p_withdrawal_id: withdrawal_id,
        p_admin_id: user.id,
      });

      if (initError) {
        return new Response(JSON.stringify({ error: initError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get transaction details
      const { data: txn } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', txnId)
        .single();

      if (!txn) {
        return new Response(JSON.stringify({ error: 'Transaction not found' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        // Get bKash token
        const token = await getBkashToken(creds, env);

        // Execute B2P transfer
        const bkashResult = await executeBkashB2P(token, creds, env, {
          amount: txn.net_amount,
          receiverMSISDN: txn.recipient_number,
          invoiceNumber: `CPZ-${txnId.slice(0, 8).toUpperCase()}`,
        });

        console.log('bKash B2P result:', JSON.stringify(bkashResult));

        // Determine success or failure
        const isSuccess = bkashResult.statusCode === '0000' || bkashResult.transactionStatus === 'Completed';
        
        // Complete the payout
        await supabase.rpc('complete_payout', {
          p_txn_id: txnId,
          p_status: isSuccess ? 'success' : 'failed',
          p_gateway_txn_id: bkashResult.trxID || bkashResult.paymentID || null,
          p_gateway_response: bkashResult,
          p_error_message: isSuccess ? null : (bkashResult.statusMessage || 'bKash transfer failed'),
        });

        return new Response(JSON.stringify({
          success: isSuccess,
          transaction_id: txnId,
          gateway_txn_id: bkashResult.trxID || bkashResult.paymentID,
          amount: txn.net_amount,
          recipient: txn.recipient_number,
          message: isSuccess ? 'Payment sent successfully' : bkashResult.statusMessage,
        }), {
          status: isSuccess ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (bkashError: any) {
        // Mark transaction as failed
        await supabase.rpc('complete_payout', {
          p_txn_id: txnId,
          p_status: 'failed',
          p_gateway_txn_id: null,
          p_gateway_response: { error: bkashError.message },
          p_error_message: bkashError.message,
        });

        return new Response(JSON.stringify({
          success: false,
          transaction_id: txnId,
          error: bkashError.message,
        }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ═══════════════════════════════════════════════
    // ACTION: Batch payout (multiple withdrawals at once)
    // ═══════════════════════════════════════════════
    if (action === 'batch_payout' && batch_withdrawal_ids?.length > 0) {
      // Create batch
      const { data: batch, error: batchError } = await supabase
        .from('payout_batches')
        .insert({
          batch_name: `Batch-${new Date().toISOString().split('T')[0]}-${batch_withdrawal_ids.length}`,
          gateway: 'bkash',
          transaction_count: batch_withdrawal_ids.length,
          status: 'processing',
          created_by: user.id,
        })
        .select()
        .single();

      if (batchError || !batch) {
        return new Response(JSON.stringify({ error: 'Failed to create batch' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let token: string;
      try {
        token = await getBkashToken(creds, env);
      } catch (tokenError: any) {
        return new Response(JSON.stringify({ error: `bKash auth failed: ${tokenError.message}` }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const results = [];
      let successCount = 0;
      let failedCount = 0;
      let totalAmount = 0;
      let totalFee = 0;

      for (const wId of batch_withdrawal_ids) {
        try {
          // Initiate
          const { data: txnId } = await supabase.rpc('initiate_bkash_payout', {
            p_withdrawal_id: wId,
            p_admin_id: user.id,
          });

          const { data: txn } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('id', txnId)
            .single();

          if (!txn) { failedCount++; continue; }

          // Execute with 1-second delay between requests (bKash rate limit)
          await new Promise(resolve => setTimeout(resolve, 1000));

          const bkashResult = await executeBkashB2P(token, creds, env, {
            amount: txn.net_amount,
            receiverMSISDN: txn.recipient_number,
            invoiceNumber: `CPZ-${txnId.slice(0, 8).toUpperCase()}`,
          });

          const isSuccess = bkashResult.statusCode === '0000' || bkashResult.transactionStatus === 'Completed';

          await supabase.rpc('complete_payout', {
            p_txn_id: txnId,
            p_status: isSuccess ? 'success' : 'failed',
            p_gateway_txn_id: bkashResult.trxID || null,
            p_gateway_response: bkashResult,
            p_error_message: isSuccess ? null : bkashResult.statusMessage,
          });

          if (isSuccess) {
            successCount++;
            totalAmount += txn.net_amount;
            totalFee += txn.fee;
          } else {
            failedCount++;
          }

          results.push({
            withdrawal_id: wId,
            transaction_id: txnId,
            success: isSuccess,
            amount: txn.net_amount,
            recipient: txn.recipient_number,
            bkash_trx: bkashResult.trxID,
          });
        } catch (err: any) {
          failedCount++;
          results.push({ withdrawal_id: wId, success: false, error: err.message });
        }
      }

      // Update batch
      await supabase
        .from('payout_batches')
        .update({
          total_amount: totalAmount,
          total_fee: totalFee,
          success_count: successCount,
          failed_count: failedCount,
          status: failedCount === 0 ? 'completed' : successCount === 0 ? 'failed' : 'partial',
          completed_at: new Date().toISOString(),
        })
        .eq('id', batch.id);

      return new Response(JSON.stringify({
        batch_id: batch.id,
        total: batch_withdrawal_ids.length,
        success: successCount,
        failed: failedCount,
        total_amount: totalAmount,
        results,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══════════════════════════════════════════════
    // ACTION: Check transaction status
    // ═══════════════════════════════════════════════
    if (action === 'check_status' && transaction_id) {
      const { data: txn } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transaction_id)
        .single();

      return new Response(JSON.stringify(txn), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('bKash payout error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
