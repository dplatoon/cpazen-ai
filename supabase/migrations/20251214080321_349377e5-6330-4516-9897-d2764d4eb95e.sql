-- Block direct INSERT from users - service role only via edge functions
CREATE POLICY "Block user inserts on retry queue"
ON public.webhook_retry_queue
FOR INSERT
WITH CHECK (false);

-- Block direct UPDATE from users - service role only via edge functions
CREATE POLICY "Block user updates on retry queue"
ON public.webhook_retry_queue
FOR UPDATE
USING (false);

-- Block direct DELETE from users - service role only via edge functions
CREATE POLICY "Block user deletes on retry queue"
ON public.webhook_retry_queue
FOR DELETE
USING (false);