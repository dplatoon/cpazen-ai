-- Add status column to profiles for account enable/disable
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Create function to get all users with their roles (admin only)
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE(
  user_id uuid,
  email text,
  company_name text,
  timezone text,
  status text,
  role text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.company_name,
    p.timezone,
    p.status,
    COALESCE(ur.role::text, 'affiliate') as role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Create function to update user role (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_role(p_user_id uuid, p_role app_role)
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

  -- Prevent admin from changing their own role
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  -- Update or insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) 
  DO UPDATE SET role = p_role;

  RETURN true;
END;
$$;

-- Create function to update user status (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_status(p_user_id uuid, p_status text)
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

  -- Prevent admin from disabling their own account
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own status';
  END IF;

  -- Validate status
  IF p_status NOT IN ('active', 'disabled', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status. Must be: active, disabled, or suspended';
  END IF;

  UPDATE public.profiles
  SET status = p_status, updated_at = now()
  WHERE user_id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Create function to get user activity (admin only)
CREATE OR REPLACE FUNCTION public.get_user_activity_admin(p_user_id uuid)
RETURNS TABLE(
  activity_type text,
  description text,
  metadata jsonb,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  (
    SELECT 
      'campaign'::text as activity_type,
      'Created campaign: ' || c.name as description,
      jsonb_build_object('campaign_id', c.id, 'status', c.status) as metadata,
      c.created_at
    FROM public.campaigns c
    WHERE c.user_id = p_user_id
  )
  UNION ALL
  (
    SELECT 
      'click'::text as activity_type,
      'Click from ' || COALESCE(cl.country, 'Unknown') as description,
      jsonb_build_object('click_id', cl.id, 'ip', cl.ip_address, 'device', cl.device) as metadata,
      cl.created_at
    FROM public.clicks cl
    WHERE cl.user_id = p_user_id
    ORDER BY cl.created_at DESC
    LIMIT 50
  )
  UNION ALL
  (
    SELECT 
      'conversion'::text as activity_type,
      'Conversion: $' || cv.payout::text as description,
      jsonb_build_object('conversion_id', cv.id, 'status', cv.status) as metadata,
      cv.created_at
    FROM public.conversions cv
    WHERE cv.user_id = p_user_id
  )
  ORDER BY created_at DESC
  LIMIT 100;
END;
$$;