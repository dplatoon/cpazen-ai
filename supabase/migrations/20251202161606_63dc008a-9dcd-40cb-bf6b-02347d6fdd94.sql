-- Create function for admins to get all offers
CREATE OR REPLACE FUNCTION public.get_all_offers_admin()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  name text,
  network text,
  payout numeric,
  currency text,
  countries text[],
  daily_cap integer,
  status text,
  offer_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  owner_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    o.id,
    o.user_id,
    o.name,
    o.network,
    o.payout,
    o.currency,
    o.countries,
    o.daily_cap,
    o.status,
    o.offer_url,
    o.created_at,
    o.updated_at,
    p.email as owner_email
  FROM public.offers o
  LEFT JOIN public.profiles p ON o.user_id = p.user_id
  ORDER BY o.created_at DESC;
END;
$$;

-- Create function for admins to create offers for any user or as global offers
CREATE OR REPLACE FUNCTION public.admin_create_offer(
  p_name text,
  p_offer_url text,
  p_payout numeric,
  p_network text DEFAULT NULL,
  p_currency text DEFAULT 'USD',
  p_countries text[] DEFAULT NULL,
  p_daily_cap integer DEFAULT NULL,
  p_status text DEFAULT 'active',
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_offer_id uuid;
  target_user_id uuid;
BEGIN
  -- Only allow admins
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Use provided user_id or fall back to admin's own id
  target_user_id := COALESCE(p_user_id, auth.uid());

  INSERT INTO public.offers (
    user_id, name, offer_url, payout, network, currency, countries, daily_cap, status
  ) VALUES (
    target_user_id, p_name, p_offer_url, p_payout, p_network, p_currency, p_countries, p_daily_cap, p_status
  )
  RETURNING id INTO new_offer_id;

  RETURN new_offer_id;
END;
$$;

-- Create function for admins to update any offer
CREATE OR REPLACE FUNCTION public.admin_update_offer(
  p_offer_id uuid,
  p_name text DEFAULT NULL,
  p_offer_url text DEFAULT NULL,
  p_payout numeric DEFAULT NULL,
  p_network text DEFAULT NULL,
  p_currency text DEFAULT NULL,
  p_countries text[] DEFAULT NULL,
  p_daily_cap integer DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  UPDATE public.offers
  SET
    name = COALESCE(p_name, name),
    offer_url = COALESCE(p_offer_url, offer_url),
    payout = COALESCE(p_payout, payout),
    network = COALESCE(p_network, network),
    currency = COALESCE(p_currency, currency),
    countries = COALESCE(p_countries, countries),
    daily_cap = COALESCE(p_daily_cap, daily_cap),
    status = COALESCE(p_status, status),
    updated_at = now()
  WHERE id = p_offer_id;

  RETURN FOUND;
END;
$$;

-- Create function for admins to delete any offer
CREATE OR REPLACE FUNCTION public.admin_delete_offer(p_offer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  DELETE FROM public.offers WHERE id = p_offer_id;
  RETURN FOUND;
END;
$$;

-- Create function to get public/global offers for affiliates
CREATE OR REPLACE FUNCTION public.get_global_offers()
RETURNS TABLE(
  id uuid,
  name text,
  network text,
  payout numeric,
  currency text,
  countries text[],
  daily_cap integer,
  status text,
  offer_url text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return all active offers (affiliates can see offers created by admins)
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
    o.created_at
  FROM public.offers o
  INNER JOIN public.user_roles ur ON o.user_id = ur.user_id
  WHERE o.status = 'active'
  AND ur.role = 'admin'
  ORDER BY o.created_at DESC;
END;
$$;