-- ==============================================================================
-- ⏱️ XSendFlow Automated Server-Side Campaign Dispatcher (pg_cron & Database Webhook)
-- ==============================================================================

-- 1. Enable required extensions for background cron execution and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Campaigns table schema enhancements for daily limits and timezone scheduling
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS window_start TEXT DEFAULT '10:00',
ADD COLUMN IF NOT EXISTS window_end TEXT DEFAULT '14:00',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York (EST)',
ADD COLUMN IF NOT EXISTS is_24_hours BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS daily_limit INT DEFAULT 150,
ADD COLUMN IF NOT EXISTS delay_seconds INT DEFAULT 40,
ADD COLUMN IF NOT EXISTS daily_sent_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sent_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 3. Recipients table schema enhancements for queue management
ALTER TABLE public.recipients
ADD COLUMN IF NOT EXISTS sender_used TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 4. Function: Reset daily sent counts at 00:00 UTC
CREATE OR REPLACE FUNCTION reset_daily_campaign_limits()
RETURNS void AS $$
BEGIN
  UPDATE public.campaigns
  SET daily_sent_count = 0, last_sent_date = CURRENT_DATE
  WHERE last_sent_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 5. Schedule pg_cron jobs
-- A. Reset daily limits every day at midnight (00:00 UTC)
SELECT cron.schedule(
  'xsendflow_reset_daily_limits',
  '0 0 * * *',
  'SELECT reset_daily_campaign_limits();'
);

-- B. Trigger the Serverless Campaign Dispatcher endpoint every minute
-- (Replace APP_URL and CRON_SECRET with your production environment variables)
SELECT cron.schedule(
  'xsendflow_minute_dispatch_pulse',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://xsendflow.com/api/cron/dispatch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.cron_secret', true), 'xsendflow_secret_pulse')
      ),
      body := jsonb_build_object('source', 'pg_cron_worker', 'timestamp', now())
    );
  $$
);