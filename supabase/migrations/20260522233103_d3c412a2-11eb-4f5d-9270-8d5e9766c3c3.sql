-- Unschedule previous job if exists (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('ingest-rss-every-6h');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'ingest-rss-every-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--9485936a-5d3f-455b-8e71-b4358943797a.lovable.app/api/public/hooks/ingest-rss',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptcHFvZnNwaHZpcmp1YmR1ZmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjk0NjcsImV4cCI6MjA5NDgwNTQ2N30.j70ywOnRa46IW2LA2U3f-Hd5VJiCK_i9UGxdqJxI9qc'
    ),
    body := jsonb_build_object('source', 'cron'),
    timeout_milliseconds := 60000
  ) as request_id;
  $$
);