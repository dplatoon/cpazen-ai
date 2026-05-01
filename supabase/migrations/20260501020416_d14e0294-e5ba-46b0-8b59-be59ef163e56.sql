
-- 1) Add missing SELECT policy on user_2fa
CREATE POLICY "Users can view their own 2FA settings"
ON public.user_2fa
FOR SELECT
USING (auth.uid() = user_id);

-- 2) Explicit INSERT policy on user_roles preventing self-elevation
CREATE POLICY "Users can self-assign affiliate role only"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role = 'affiliate'::app_role
);

-- 3) Lock down SECURITY DEFINER / helper function execution
-- Revoke from anon and authenticated where appropriate. Admin-only functions
-- already check has_role internally; we additionally remove anon access.
REVOKE EXECUTE ON FUNCTION public.admin_delete_offer(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_create_offer(text, text, numeric, text, text, text[], integer, text, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_update_offer(uuid, text, text, numeric, text, text, text[], integer, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_status(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_all_users_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_all_offers_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_activity_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_audit_logs_admin(integer, integer, text, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_audit_logs_admin(integer, integer, text, uuid, timestamptz, timestamptz) FROM anon, public;

-- Internal/system helpers should never be called via PostgREST by clients
REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, jsonb, text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_login_rate_limit(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.reset_login_rate_limit(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_rate_limits() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_postback_rate_limits() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_postback_security_token(uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_security_token_for_click(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_network_account_by_postback_key(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_2fa_status(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.aggregate_click_stats() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.aggregate_conversion_stats() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_offer_url() FROM anon, authenticated, public;
