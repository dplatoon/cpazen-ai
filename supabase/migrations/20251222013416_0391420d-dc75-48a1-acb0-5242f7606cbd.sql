-- Enable realtime for clicks and conversions tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.clicks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_logs;