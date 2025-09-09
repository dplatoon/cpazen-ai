-- Add updated_at triggers for all tables
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversions_updated_at
  BEFORE UPDATE ON public.conversions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rules_updated_at
  BEFORE UPDATE ON public.rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraints for data integrity
ALTER TABLE public.clicks ADD CONSTRAINT unique_click_id UNIQUE (click_id);
ALTER TABLE public.conversions ADD CONSTRAINT unique_conversion_click_id UNIQUE (click_id);

-- Add performance indexes
CREATE INDEX idx_clicks_campaign_id_created_at ON public.clicks (campaign_id, created_at DESC);
CREATE INDEX idx_clicks_created_at ON public.clicks (created_at DESC);
CREATE INDEX idx_conversions_click_id ON public.conversions (click_id);
CREATE INDEX idx_campaigns_user_id_status ON public.campaigns (user_id, status);
CREATE INDEX idx_offers_status ON public.offers (status);

-- Add trigger to auto-create profiles (fix the missing trigger issue)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();