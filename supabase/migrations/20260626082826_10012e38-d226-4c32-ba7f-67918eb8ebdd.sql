
ALTER PUBLICATION supabase_realtime DROP TABLE public.clicks;
ALTER PUBLICATION supabase_realtime DROP TABLE public.conversions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.webhook_logs;
ALTER PUBLICATION supabase_realtime DROP TABLE public.audit_logs;

DROP POLICY IF EXISTS "Users can self-assign affiliate role only" ON public.user_roles;

CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, jsonb, text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_login_rate_limit(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.reset_login_rate_limit(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_rate_limits() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_postback_rate_limits() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_postback_security_token(uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_security_token_for_click(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_network_account_by_postback_key(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_2fa_status(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;

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
REVOKE EXECUTE ON FUNCTION public.get_global_offers() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_available_offers() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats(uuid, date, date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_chart_data(uuid, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_top_campaigns(uuid, integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_campaign_kpis(uuid, date, date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_campaign_breakdown(uuid, text, date, date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_2fa_status() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_2fa_status_secure() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_sessions(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.register_session(text, jsonb, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.revoke_session(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.revoke_all_other_sessions(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_webhooks() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.rotate_user_secret_key() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_secret_key_masked() FROM anon, public;
