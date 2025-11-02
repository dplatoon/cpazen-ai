-- Add foreign key relationship from campaigns to offers
ALTER TABLE public.campaigns
ADD CONSTRAINT campaigns_offer_id_fkey 
FOREIGN KEY (offer_id) 
REFERENCES public.offers(id) 
ON DELETE SET NULL;