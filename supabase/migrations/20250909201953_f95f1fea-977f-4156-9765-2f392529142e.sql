-- Add unique constraints for data integrity (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_click_id') THEN
        ALTER TABLE public.clicks ADD CONSTRAINT unique_click_id UNIQUE (click_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_conversion_click_id') THEN
        ALTER TABLE public.conversions ADD CONSTRAINT unique_conversion_click_id UNIQUE (click_id);
    END IF;
END $$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_clicks_campaign_id_created_at ON public.clicks (campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON public.clicks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_click_id ON public.conversions (click_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id_status ON public.campaigns (user_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers (status);

-- Add trigger to auto-create profiles (most critical fix)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;