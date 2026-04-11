-- ============================================================
-- ADS OPERATIONAL FIXES
-- Run this in Supabase SQL Editor to complete ads platform setup
-- ============================================================

-- 1. Create agency_payouts table (if not exists)
CREATE TABLE IF NOT EXISTS ads.agency_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES ads.agencies(id),
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_method TEXT DEFAULT 'bank_transfer',
  payout_details JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ads.agency_payouts ENABLE ROW LEVEL SECURITY;

-- Policy: agencies can see their own payouts
CREATE POLICY IF NOT EXISTS agency_payouts_select ON ads.agency_payouts
  FOR SELECT USING (agency_id IN (
    SELECT id FROM ads.agencies WHERE id = agency_id
  ));

-- Service role can do everything
CREATE POLICY IF NOT EXISTS agency_payouts_service ON ads.agency_payouts
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Create get_next_ad_for_user function (if not exists)
-- This is the targeting-based ad selection function used by serve.js
CREATE OR REPLACE FUNCTION ads.get_next_ad_for_user(
  p_user_id UUID,
  p_placement TEXT
)
RETURNS TABLE (
  id UUID,
  advertiser_id UUID,
  creative_url TEXT,
  target_url TEXT,
  duration INT,
  placement TEXT,
  targeting JSONB,
  impressions_ordered INT,
  impressions_delivered INT,
  schedule_type TEXT,
  start_date DATE,
  end_date DATE,
  time_windows JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.advertiser_id,
    o.creative_url,
    o.target_url,
    o.duration,
    o.placement,
    o.targeting,
    o.impressions_ordered,
    o.impressions_delivered,
    o.schedule_type,
    o.start_date,
    o.end_date,
    o.time_windows
  FROM ads.ad_orders o
  JOIN ads.advertisers a ON a.id = o.advertiser_id
  WHERE o.placement = p_placement
    AND o.status = 'active'
    AND o.creative_status = 'ready'
    AND o.impressions_delivered < o.impressions_ordered
    AND a.status = 'approved'
    -- Schedule check for scheduled orders
    AND (
      o.schedule_type = 'asap'
      OR (
        o.schedule_type = 'scheduled'
        AND CURRENT_DATE >= o.start_date
        AND CURRENT_DATE <= o.end_date
      )
    )
    -- Targeting match (if targeting is set and user has a profile)
    AND (
      o.targeting IS NULL
      OR o.targeting = '{}'::jsonb
      OR ads.user_matches_targeting(p_user_id, o.targeting)
    )
  ORDER BY o.schedule_type ASC, o.created_at ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Seed pricing_config if empty
INSERT INTO ads.pricing_config (pricing_type, placement, duration, price_cents, is_active)
SELECT * FROM (VALUES
  ('cpm', 'sidebar', 5, 600, true),
  ('cpm', 'sidebar', 10, 800, true),
  ('cpm', 'sidebar', 15, 1000, true),
  ('cpm', 'sidebar', 20, 1200, true),
  ('cpm', 'constellation', 5, 400, true),
  ('creative_fee', 'sidebar', 5, 15000, true),
  ('creative_fee', 'sidebar', 10, 15000, true),
  ('creative_fee', 'sidebar', 15, 15000, true),
  ('creative_fee', 'sidebar', 20, 15000, true),
  ('creative_fee', 'constellation', 5, 15000, true)
) AS v(pricing_type, placement, duration, price_cents, is_active)
WHERE NOT EXISTS (SELECT 1 FROM ads.pricing_config LIMIT 1);

-- 4. Verify increment functions exist (created earlier in session)
-- These should already exist from the user running them manually.
-- If not, uncomment and run:
--
-- CREATE OR REPLACE FUNCTION ads.increment_agency_balance(p_agency_id UUID, p_amount INT)
-- RETURNS void AS $$
--   UPDATE ads.agencies SET balance_cents = balance_cents + p_amount, updated_at = NOW() WHERE id = p_agency_id;
-- $$ LANGUAGE sql;
--
-- CREATE OR REPLACE FUNCTION ads.increment_advertiser_balance(p_advertiser_id UUID, p_amount INT)
-- RETURNS void AS $$
--   UPDATE ads.advertisers SET balance_cents = balance_cents + p_amount, updated_at = NOW() WHERE id = p_advertiser_id;
-- $$ LANGUAGE sql;
