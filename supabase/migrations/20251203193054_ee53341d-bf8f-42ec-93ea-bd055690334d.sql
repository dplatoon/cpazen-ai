-- Extend campaigns table with new fields
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS vertical text,
ADD COLUMN IF NOT EXISTS target_geo text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS devices text[] DEFAULT ARRAY['desktop', 'mobile'],
ADD COLUMN IF NOT EXISTS os text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS monthly_budget numeric,
ADD COLUMN IF NOT EXISTS target_cpa numeric,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS traffic_source_id text;

-- Create campaign_stats table for aggregated performance data
CREATE TABLE public.campaign_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  date date NOT NULL,
  traffic_source_id text,
  sub_id text,
  geo text,
  device text,
  os text,
  placement text,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  cost numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, date, traffic_source_id, sub_id, geo, device, os, placement)
);

-- Create recommendations table for AI recommendations
CREATE TABLE public.recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('pause_source', 'raise_bid', 'lower_bid', 'expand_geo', 'narrow_geo', 'adjust_cap', 'test_creative', 'pause_campaign', 'scale_campaign')),
  title text NOT NULL,
  description text NOT NULL,
  scope jsonb DEFAULT '{}',
  expected_impact jsonb DEFAULT '{}',
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'applied', 'scheduled', 'dismissed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create automation_rules table
CREATE TABLE public.automation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  condition_json jsonb NOT NULL DEFAULT '{}',
  action_json jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_triggered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create experiments table for A/B testing
CREATE TABLE public.experiments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('lander_ab', 'creative_ab', 'offer_rotation')),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed')),
  metric text NOT NULL DEFAULT 'cpa' CHECK (metric IN ('cpa', 'roas', 'conversion_rate', 'revenue')),
  variants jsonb NOT NULL DEFAULT '[]',
  winner_variant_id text,
  min_data_threshold integer DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_stats
CREATE POLICY "Users can view their own campaign stats" ON public.campaign_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own campaign stats" ON public.campaign_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own campaign stats" ON public.campaign_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own campaign stats" ON public.campaign_stats FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for recommendations
CREATE POLICY "Users can view their own recommendations" ON public.recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recommendations" ON public.recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recommendations" ON public.recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recommendations" ON public.recommendations FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for automation_rules
CREATE POLICY "Users can view their own automation rules" ON public.automation_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own automation rules" ON public.automation_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own automation rules" ON public.automation_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own automation rules" ON public.automation_rules FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for experiments
CREATE POLICY "Users can view their own experiments" ON public.experiments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own experiments" ON public.experiments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own experiments" ON public.experiments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own experiments" ON public.experiments FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_campaign_stats_updated_at BEFORE UPDATE ON public.campaign_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON public.recommendations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON public.experiments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_campaign_stats_campaign_date ON public.campaign_stats(campaign_id, date);
CREATE INDEX idx_campaign_stats_user ON public.campaign_stats(user_id);
CREATE INDEX idx_recommendations_campaign ON public.recommendations(campaign_id);
CREATE INDEX idx_recommendations_status ON public.recommendations(status);
CREATE INDEX idx_automation_rules_campaign ON public.automation_rules(campaign_id);
CREATE INDEX idx_automation_rules_active ON public.automation_rules(is_active);
CREATE INDEX idx_experiments_campaign ON public.experiments(campaign_id);
CREATE INDEX idx_experiments_status ON public.experiments(status);