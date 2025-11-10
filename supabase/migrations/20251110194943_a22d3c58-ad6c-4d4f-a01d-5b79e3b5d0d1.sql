-- Create webhooks table for user-configured webhook endpoints
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['conversion']::TEXT[],
  secret_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhooks
CREATE POLICY "Users can view their own webhooks"
  ON public.webhooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhooks"
  ON public.webhooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks"
  ON public.webhooks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks"
  ON public.webhooks FOR DELETE
  USING (auth.uid() = user_id);

-- Create webhook_logs table to track webhook deliveries
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for webhook_logs
CREATE POLICY "Users can view their own webhook logs"
  ON public.webhook_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Create fraud_alerts table
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  click_id UUID REFERENCES public.clicks(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fraud_alerts
CREATE POLICY "Users can view their own fraud alerts"
  ON public.fraud_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all fraud alerts"
  ON public.fraud_alerts FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update fraud alerts"
  ON public.fraud_alerts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Add fraud_score to clicks table
ALTER TABLE public.clicks 
ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fraud_indicators JSONB DEFAULT '[]'::jsonb;

-- Create index for fraud detection queries
CREATE INDEX IF NOT EXISTS idx_clicks_fraud_score ON public.clicks(fraud_score);
CREATE INDEX IF NOT EXISTS idx_clicks_ip_created ON public.clicks(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON public.fraud_alerts(status, created_at);

-- Create trigger for webhooks updated_at
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();