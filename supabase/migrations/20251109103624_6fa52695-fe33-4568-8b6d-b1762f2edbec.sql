-- Add notification preferences to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{
  "conversion_alerts": true,
  "daily_summary": true,
  "low_performance_alerts": true,
  "weekly_report": true,
  "email_notifications": true
}'::jsonb;

-- Create notification_logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  email_to text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  metadata jsonb
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_logs
CREATE POLICY "Users can view their own notification logs"
ON public.notification_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notification logs"
ON public.notification_logs FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);