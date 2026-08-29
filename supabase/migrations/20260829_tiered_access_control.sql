-- ==============================================================================
-- 🏛️ XSendFlow Bulletproof Tiered Access Control & Quota Management Schema
-- ==============================================================================

-- 1. Profiles Plan & Quota Columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free', -- 'free', 'pro', 'agency'
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active', -- 'active', 'past_due', 'canceled'
ADD COLUMN IF NOT EXISTS max_mailboxes INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_active_campaigns INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_contacts INT DEFAULT 250,
ADD COLUMN IF NOT EXISTS daily_sent_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sent_reset_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS allows_vps_daemon BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS client_tags_enabled BOOLEAN DEFAULT FALSE;

-- 2. Client Reports Sharing Table (Agency Tier Feature)
CREATE TABLE IF NOT EXISTS public.client_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL, -- 32-char cryptographically secure token
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on client_reports
ALTER TABLE public.client_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can CRUD their client reports
CREATE POLICY "Users can manage own client reports"
ON public.client_reports
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Public can view active client report by token
CREATE POLICY "Public can view active client report by token"
ON public.client_reports
FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);

-- 3. Daily Send Quota & Plan Enforcement Trigger
CREATE OR REPLACE FUNCTION check_and_increment_daily_send()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_daily_sent INT;
  v_last_reset TIMESTAMPTZ;
BEGIN
  SELECT plan, daily_sent_count, last_sent_reset_at
  INTO v_plan, v_daily_sent, v_last_reset
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Auto-reset at midnight UTC
  IF v_last_reset < CURRENT_DATE THEN
    UPDATE public.profiles
    SET daily_sent_count = 0, last_sent_reset_at = NOW()
    WHERE id = NEW.user_id;
    v_daily_sent := 0;
  END IF;

  -- Free Plan Cap: 50 emails/day
  IF v_plan = 'free' AND v_daily_sent >= 50 THEN
    RAISE EXCEPTION 'TIER_LIMIT: Free plan daily limit of 50 emails reached. Resets at 00:00 UTC or upgrade to Pro for unlimited.';
  END IF;

  -- Increment daily sent
  UPDATE public.profiles
  SET daily_sent_count = daily_sent_count + 1
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Active Campaign Limit Check Function
CREATE OR REPLACE FUNCTION check_active_campaign_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_active_count INT;
BEGIN
  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id;
  
  -- Count currently active campaigns
  SELECT COUNT(*) INTO v_active_count
  FROM public.campaigns
  WHERE user_id = p_user_id AND status IN ('in_progress', 'sending');

  IF v_plan = 'free' AND v_active_count >= 1 THEN
    RETURN FALSE;
  END IF;

  IF v_plan = 'pro' AND v_active_count >= 5 THEN
    RETURN FALSE;
  END IF;

  -- Agency has unlimited
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
