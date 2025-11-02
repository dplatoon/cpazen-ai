-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'affiliate',
  company_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  secret_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  offer_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  daily_budget NUMERIC(10,2),
  total_budget NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  network TEXT,
  payout NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  countries TEXT[],
  daily_cap INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  offer_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clicks table
CREATE TABLE public.clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sub_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device TEXT,
  os TEXT,
  browser TEXT,
  is_bot BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversions table
CREATE TABLE public.conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  click_id UUID NOT NULL REFERENCES public.clicks(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payout NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for campaigns
CREATE POLICY "Users can view their own campaigns"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for offers
CREATE POLICY "Users can view their own offers"
  ON public.offers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own offers"
  ON public.offers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offers"
  ON public.offers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offers"
  ON public.offers FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for clicks
CREATE POLICY "Users can view their own clicks"
  ON public.clicks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clicks"
  ON public.clicks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for conversions
CREATE POLICY "Users can view their own conversions"
  ON public.conversions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversions"
  ON public.conversions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get masked secret key
CREATE OR REPLACE FUNCTION public.get_user_secret_key_masked()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key TEXT;
BEGIN
  SELECT secret_key INTO key
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF key IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return masked version (first 8 chars + ... + last 4 chars)
  RETURN substring(key from 1 for 8) || '...' || substring(key from length(key) - 3 for 4);
END;
$$;

-- Function to rotate secret key
CREATE OR REPLACE FUNCTION public.rotate_user_secret_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_key TEXT;
BEGIN
  new_key := encode(gen_random_bytes(32), 'hex');
  
  UPDATE public.profiles
  SET secret_key = new_key
  WHERE user_id = auth.uid();
  
  RETURN new_key;
END;
$$;

-- Function to generate security token for click
CREATE OR REPLACE FUNCTION public.generate_security_token_for_click(click_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a unique token for this click
  token := encode(gen_random_bytes(32), 'hex');
  RETURN token;
END;
$$;

-- Function to get available offers
CREATE OR REPLACE FUNCTION public.get_available_offers()
RETURNS TABLE (
  id UUID,
  name TEXT,
  network TEXT,
  payout NUMERIC,
  currency TEXT,
  countries TEXT[],
  daily_cap INTEGER,
  status TEXT,
  offer_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.network,
    o.payout,
    o.currency,
    o.countries,
    o.daily_cap,
    o.status,
    o.offer_url,
    o.created_at,
    o.updated_at
  FROM public.offers o
  WHERE o.user_id = auth.uid()
  AND o.status = 'active';
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_offers_user_id ON public.offers(user_id);
CREATE INDEX idx_clicks_campaign_id ON public.clicks(campaign_id);
CREATE INDEX idx_clicks_user_id ON public.clicks(user_id);
CREATE INDEX idx_conversions_click_id ON public.conversions(click_id);
CREATE INDEX idx_conversions_campaign_id ON public.conversions(campaign_id);
CREATE INDEX idx_conversions_user_id ON public.conversions(user_id);