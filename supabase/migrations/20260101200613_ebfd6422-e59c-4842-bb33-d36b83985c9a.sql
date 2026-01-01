-- Add encrypted API key column to network_accounts
ALTER TABLE public.network_accounts 
ADD COLUMN api_key text;

-- Add comment explaining the field
COMMENT ON COLUMN public.network_accounts.api_key IS 'Encrypted API key/token for network API access';