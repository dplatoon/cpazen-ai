-- Phase 1: Network Account Management

-- Network accounts table to store per-network credentials
CREATE TABLE public.network_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  network_type TEXT NOT NULL, -- 'maxbounty', 'cj', 'shareasale', 'everflow', 'clickbank'
  name TEXT NOT NULL,
  external_id TEXT, -- affiliate ID at network
  postback_secret TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  config_json JSONB DEFAULT '{}'::jsonb, -- {clickIdParam, payoutParam, statusParam, etc.}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Postback keys for secure routing (unique keys per network account)
CREATE TABLE public.postback_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  network_account_id UUID REFERENCES public.network_accounts(id) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(12), 'hex'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Custom tracking domains table
CREATE TABLE public.tracking_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'failed'
  verification_token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  dns_record_type TEXT DEFAULT 'CNAME', -- 'CNAME' or 'TXT'
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, domain)
);

-- Enable RLS
ALTER TABLE public.network_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postback_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies for network_accounts
CREATE POLICY "Users can view their own network accounts"
  ON public.network_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own network accounts"
  ON public.network_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network accounts"
  ON public.network_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network accounts"
  ON public.network_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for postback_keys
CREATE POLICY "Users can view their own postback keys"
  ON public.postback_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own postback keys"
  ON public.postback_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own postback keys"
  ON public.postback_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own postback keys"
  ON public.postback_keys FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for tracking_domains
CREATE POLICY "Users can view their own tracking domains"
  ON public.tracking_domains FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracking domains"
  ON public.tracking_domains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracking domains"
  ON public.tracking_domains FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracking domains"
  ON public.tracking_domains FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger for network_accounts
CREATE TRIGGER update_network_accounts_updated_at
  BEFORE UPDATE ON public.network_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Updated_at trigger for tracking_domains
CREATE TRIGGER update_tracking_domains_updated_at
  BEFORE UPDATE ON public.tracking_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get network account by postback key (for edge function use)
CREATE OR REPLACE FUNCTION public.get_network_account_by_postback_key(p_key TEXT)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  network_type TEXT,
  name TEXT,
  external_id TEXT,
  postback_secret TEXT,
  config_json JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    na.id,
    na.user_id,
    na.network_type,
    na.name,
    na.external_id,
    na.postback_secret,
    na.config_json
  FROM public.network_accounts na
  INNER JOIN public.postback_keys pk ON pk.network_account_id = na.id
  WHERE pk.key = p_key
  AND pk.is_active = true
  AND na.is_active = true;
END;
$$;

-- Indexes for performance
CREATE INDEX idx_network_accounts_user_id ON public.network_accounts(user_id);
CREATE INDEX idx_network_accounts_network_type ON public.network_accounts(network_type);
CREATE INDEX idx_postback_keys_key ON public.postback_keys(key);
CREATE INDEX idx_postback_keys_network_account ON public.postback_keys(network_account_id);
CREATE INDEX idx_tracking_domains_user_id ON public.tracking_domains(user_id);
CREATE INDEX idx_tracking_domains_domain ON public.tracking_domains(domain);