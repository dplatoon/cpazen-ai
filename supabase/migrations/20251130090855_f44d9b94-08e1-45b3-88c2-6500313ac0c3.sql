-- Create IP Blacklist table
CREATE TABLE public.ip_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  reason TEXT,
  auto_detected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create IP Whitelist table
CREATE TABLE public.ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Fraud Patterns table for ML-based detection
CREATE TABLE public.fraud_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL, -- 'click_velocity', 'conversion_time', 'geo_anomaly', 'device_fingerprint'
  pattern_data JSONB NOT NULL,
  confidence_score INTEGER NOT NULL DEFAULT 0, -- 0-100
  true_positive_count INTEGER DEFAULT 0,
  false_positive_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Webhook Test Logs table
CREATE TABLE public.webhook_test_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE,
  test_payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_ip_blacklist_user_campaign ON public.ip_blacklist(user_id, campaign_id);
CREATE INDEX idx_ip_blacklist_ip ON public.ip_blacklist(ip_address);
CREATE INDEX idx_ip_whitelist_user_campaign ON public.ip_whitelist(user_id, campaign_id);
CREATE INDEX idx_ip_whitelist_ip ON public.ip_whitelist(ip_address);
CREATE INDEX idx_fraud_patterns_user_type ON public.fraud_patterns(user_id, pattern_type);
CREATE INDEX idx_webhook_test_logs_user ON public.webhook_test_logs(user_id);

-- Enable RLS
ALTER TABLE public.ip_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_test_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for IP Blacklist
CREATE POLICY "Users can view their own IP blacklist"
  ON public.ip_blacklist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own IP blacklist"
  ON public.ip_blacklist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own IP blacklist"
  ON public.ip_blacklist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own IP blacklist"
  ON public.ip_blacklist FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for IP Whitelist
CREATE POLICY "Users can view their own IP whitelist"
  ON public.ip_whitelist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own IP whitelist"
  ON public.ip_whitelist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own IP whitelist"
  ON public.ip_whitelist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own IP whitelist"
  ON public.ip_whitelist FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Fraud Patterns
CREATE POLICY "Users can view their own fraud patterns"
  ON public.fraud_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fraud patterns"
  ON public.fraud_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fraud patterns"
  ON public.fraud_patterns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fraud patterns"
  ON public.fraud_patterns FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Webhook Test Logs
CREATE POLICY "Users can view their own webhook test logs"
  ON public.webhook_test_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook test logs"
  ON public.webhook_test_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_ip_blacklist_updated_at
  BEFORE UPDATE ON public.ip_blacklist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ip_whitelist_updated_at
  BEFORE UPDATE ON public.ip_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fraud_patterns_updated_at
  BEFORE UPDATE ON public.fraud_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();