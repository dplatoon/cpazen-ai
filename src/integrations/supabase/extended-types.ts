// Extended types for new tables added via migrations
// These supplement the auto-generated types.ts until `supabase gen types` is run

export interface AffiliateOfferApplication {
  id: string;
  affiliate_id: string;
  offer_id: string;
  status: 'pending' | 'approved' | 'rejected';
  tracking_link: string | null;
  custom_payout: number | null;
  applied_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  method_type: 'bkash' | 'nagad' | 'rocket' | 'paypal' | 'wise' | 'bank_wire' | 'usdt_trc20' | 'usdt_erc20';
  account_name: string;
  account_number: string;
  is_primary: boolean;
  currency: string;
  extra_details: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AffiliateEarning {
  id: string;
  affiliate_id: string;
  campaign_id: string | null;
  offer_id: string | null;
  click_id: string | null;
  conversion_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  description: string | null;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
}

export interface WithdrawalRequest {
  id: string;
  affiliate_id: string;
  amount: number;
  currency: string;
  payment_method_id: string;
  status: 'pending' | 'processing' | 'paid' | 'rejected' | 'cancelled';
  admin_note: string | null;
  transaction_ref: string | null;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

export interface PaymentGatewayConfig {
  id: string;
  gateway: 'bkash' | 'nagad' | 'sslcommerz' | 'stripe' | 'paypal';
  environment: 'sandbox' | 'production';
  credentials: Record<string, any>;
  is_active: boolean;
  daily_limit: number;
  per_txn_limit: number;
  min_payout: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  withdrawal_id: string | null;
  affiliate_id: string;
  gateway: string;
  gateway_txn_id: string | null;
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  recipient_number: string;
  recipient_name: string | null;
  status: 'initiated' | 'pending' | 'success' | 'failed' | 'reversed';
  gateway_response: any;
  error_message: string | null;
  initiated_at: string;
  completed_at: string | null;
  created_by: string | null;
}

export interface PayoutBatch {
  id: string;
  batch_name: string;
  gateway: string;
  total_amount: number;
  total_fee: number;
  transaction_count: number;
  success_count: number;
  failed_count: number;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}
