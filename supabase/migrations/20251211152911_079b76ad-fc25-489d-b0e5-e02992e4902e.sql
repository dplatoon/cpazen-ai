-- Create webhook retry queue table
CREATE TABLE public.webhook_retry_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  last_error TEXT,
  original_log_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.webhook_retry_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own retry queue"
ON public.webhook_retry_queue
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage retry queue"
ON public.webhook_retry_queue
FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes for efficient querying
CREATE INDEX idx_webhook_retry_queue_status_next_retry ON public.webhook_retry_queue(status, next_retry_at) WHERE status = 'pending';
CREATE INDEX idx_webhook_retry_queue_webhook_id ON public.webhook_retry_queue(webhook_id);
CREATE INDEX idx_webhook_retry_queue_user_id ON public.webhook_retry_queue(user_id);
CREATE INDEX idx_webhook_retry_queue_created_at ON public.webhook_retry_queue(created_at DESC);