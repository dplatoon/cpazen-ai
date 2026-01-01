-- Add columns for network offer sync to offers table
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS network_offer_id text,
ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone;

-- Add auto_sync column to network_accounts table
ALTER TABLE public.network_accounts 
ADD COLUMN IF NOT EXISTS auto_sync boolean DEFAULT false;

-- Create index for network_offer_id lookups
CREATE INDEX IF NOT EXISTS idx_offers_network_offer_id ON public.offers(network_offer_id);

-- Create index for finding offers that need sync
CREATE INDEX IF NOT EXISTS idx_offers_last_synced ON public.offers(last_synced_at) WHERE last_synced_at IS NOT NULL;