-- Update get_audit_logs_admin function to support date range filtering
CREATE OR REPLACE FUNCTION public.get_audit_logs_admin(
  p_limit integer DEFAULT 100, 
  p_offset integer DEFAULT 0, 
  p_action_filter text DEFAULT NULL, 
  p_user_filter uuid DEFAULT NULL,
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  user_email text, 
  action text, 
  entity_type text, 
  entity_id text, 
  details jsonb, 
  ip_address text, 
  user_agent text, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    p.email as user_email,
    al.action,
    al.entity_type,
    al.entity_id,
    al.details,
    al.ip_address,
    al.user_agent,
    al.created_at
  FROM public.audit_logs al
  LEFT JOIN public.profiles p ON al.user_id = p.user_id
  WHERE (p_action_filter IS NULL OR al.action = p_action_filter)
  AND (p_user_filter IS NULL OR al.user_id = p_user_filter)
  AND (p_start_date IS NULL OR al.created_at >= p_start_date)
  AND (p_end_date IS NULL OR al.created_at <= p_end_date)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;