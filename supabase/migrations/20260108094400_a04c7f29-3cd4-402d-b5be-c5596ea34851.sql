-- Fix overly permissive RLS policies on system tables
-- These tables should only be accessed by edge functions with service_role key
-- service_role bypasses RLS, so we can safely use (false) to block regular user access

-- 1. Fix audit_logs INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (false);

-- 2. Fix notification_logs INSERT policy  
DROP POLICY IF EXISTS "System can insert notification logs" ON public.notification_logs;
CREATE POLICY "System can insert notification logs"
ON public.notification_logs
FOR INSERT
WITH CHECK (false);

-- 3. Fix webhook_retry_queue ALL policy
DROP POLICY IF EXISTS "System can manage retry queue" ON public.webhook_retry_queue;
CREATE POLICY "System can manage retry queue"
ON public.webhook_retry_queue
FOR ALL
USING (false)
WITH CHECK (false);