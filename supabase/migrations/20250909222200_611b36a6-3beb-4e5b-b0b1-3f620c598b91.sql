-- Drop and recreate get_available_offers function with complete offer fields
DROP FUNCTION public.get_available_offers();

CREATE OR REPLACE FUNCTION public.get_available_offers()
RETURNS TABLE (
  id uuid,
  name text,
  network text,
  countries text[],
  currency text,
  payout numeric,
  daily_cap integer,
  status text,
  offer_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.name,
    o.network,
    o.countries,
    o.currency,
    o.payout,
    o.daily_cap,
    o.status,
    o.offer_url,
    o.created_at,
    o.updated_at
  FROM public.offers o
  WHERE o.status = 'active'
  AND auth.uid() IS NOT NULL; -- Must be authenticated
$$;