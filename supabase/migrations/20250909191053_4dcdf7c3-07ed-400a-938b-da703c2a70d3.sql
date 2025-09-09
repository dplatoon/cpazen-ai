-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'affiliate' CHECK (role IN ('admin', 'advertiser', 'affiliate')),
  company_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  secret_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('MaxBounty', 'ClickDealer', 'Adsterra', 'Custom')),
  payout DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  countries TEXT[] DEFAULT '{}',
  daily_cap INTEGER,
  offer_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tracking_domain TEXT DEFAULT 'cpazen.com',
  redirect_mode TEXT NOT NULL DEFAULT '302' CHECK (redirect_mode IN ('302', 'meta', 'double-meta')),
  cost_model TEXT NOT NULL DEFAULT 'CPC' CHECK (cost_model IN ('CPC', 'CPM')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clicks table
CREATE TABLE public.clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  click_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  ip INET,
  user_agent TEXT,
  country TEXT,
  os TEXT,
  browser TEXT,
  referrer TEXT,
  bot_score INTEGER DEFAULT 0 CHECK (bot_score >= 0 AND bot_score <= 100),
  sub_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversions table  
CREATE TABLE public.conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  click_id UUID NOT NULL REFERENCES public.clicks(click_id) ON DELETE CASCADE,
  payout DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  network_postback_raw JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rules table for AI automation
CREATE TABLE public.rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  condition_json JSONB NOT NULL,
  action_json JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Offers policies (admins can manage, others can view active offers)
CREATE POLICY "Everyone can view active offers" ON public.offers
  FOR SELECT USING (status = 'active');
  
CREATE POLICY "Admins can manage offers" ON public.offers
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Campaigns policies (users see their own, admins see all)
CREATE POLICY "Users can view their own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'admin');
  
CREATE POLICY "Users can manage their own campaigns" ON public.campaigns
  FOR ALL USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'admin');

-- Clicks policies (based on campaign ownership)
CREATE POLICY "Users can view clicks for their campaigns" ON public.clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = clicks.campaign_id 
      AND (campaigns.user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
  );

CREATE POLICY "System can insert clicks" ON public.clicks
  FOR INSERT WITH CHECK (true);

-- Conversions policies (based on click ownership through campaigns)
CREATE POLICY "Users can view conversions for their campaigns" ON public.conversions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clicks 
      JOIN public.campaigns ON campaigns.id = clicks.campaign_id
      WHERE clicks.click_id = conversions.click_id 
      AND (campaigns.user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
  );

CREATE POLICY "System can manage conversions" ON public.conversions
  FOR ALL WITH CHECK (true);

-- Rules policies
CREATE POLICY "Users can manage their own rules" ON public.rules
  FOR ALL USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'admin');

-- Create indexes for performance
CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_clicks_campaign_id ON public.clicks(campaign_id);
CREATE INDEX idx_clicks_click_id ON public.clicks(click_id);
CREATE INDEX idx_conversions_click_id ON public.conversions(click_id);
CREATE INDEX idx_clicks_created_at ON public.clicks(created_at);
CREATE INDEX idx_conversions_created_at ON public.conversions(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_conversions_updated_at BEFORE UPDATE ON public.conversions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON public.rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'affiliate')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample offers
INSERT INTO public.offers (name, network, payout, currency, countries, offer_url) VALUES 
('Dating SOI - US Tier1', 'MaxBounty', 48.00, 'USD', ARRAY['US', 'CA', 'UK'], 'https://example.com/dating-offer'),
('Crypto Trading Platform', 'ClickDealer', 250.00, 'USD', ARRAY['US', 'CA', 'AU', 'UK'], 'https://example.com/crypto-offer'),
('Health Supplements - Global', 'Adsterra', 35.50, 'USD', ARRAY['US', 'CA', 'UK', 'AU', 'DE'], 'https://example.com/health-offer'),
('Gaming CPI - Mobile', 'Custom', 12.75, 'USD', ARRAY['US', 'CA'], 'https://example.com/gaming-offer'),
('Finance Lead Gen', 'MaxBounty', 85.00, 'USD', ARRAY['US'], 'https://example.com/finance-offer');