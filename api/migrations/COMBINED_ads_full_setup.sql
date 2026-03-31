-- ============================================================
-- COMBINED ADS PLATFORM SETUP
-- Run this in Supabase SQL Editor (all at once)
-- ============================================================

-- ============================================================
-- 1. CREATE SCHEMA
-- ============================================================
CREATE SCHEMA IF NOT EXISTS ads;

-- ============================================================
-- 2. ADVERTISERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ads.advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  company_name TEXT NOT NULL,
  website TEXT,
  contact_email TEXT,
  user_id UUID UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  vetting_score INTEGER,
  vetting_reason TEXT,
  vetted_at TIMESTAMPTZ,
  vetted_by TEXT,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  agency_id UUID,
  agency_commission_pct NUMERIC(5,2) DEFAULT 15.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_advertisers_email ON ads.advertisers(email);
CREATE INDEX IF NOT EXISTS idx_advertisers_status ON ads.advertisers(status);
CREATE INDEX IF NOT EXISTS idx_advertisers_user_id ON ads.advertisers(user_id);

-- ============================================================
-- 3. AGENCIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ads.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  user_id UUID UNIQUE,
  agency_name TEXT NOT NULL,
  contact_name TEXT,
  website TEXT,
  phone TEXT,
  country_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  vetting_score INTEGER,
  vetting_reason TEXT,
  vetted_at TIMESTAMPTZ,
  vetted_by TEXT,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  total_earned_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agencies_email ON ads.agencies(email);
CREATE INDEX IF NOT EXISTS idx_agencies_status ON ads.agencies(status);
CREATE INDEX IF NOT EXISTS idx_agencies_user_id ON ads.agencies(user_id);

-- Add FK for agency_id in advertisers
ALTER TABLE ads.advertisers 
  DROP CONSTRAINT IF EXISTS advertisers_agency_id_fkey;
ALTER TABLE ads.advertisers 
  ADD CONSTRAINT advertisers_agency_id_fkey 
  FOREIGN KEY (agency_id) REFERENCES ads.agencies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_advertisers_agency ON ads.advertisers(agency_id) WHERE agency_id IS NOT NULL;

-- ============================================================
-- 4. AD ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ads.ad_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES ads.advertisers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  placement TEXT NOT NULL CHECK (placement IN ('sidebar', 'constellation')),
  duration INTEGER NOT NULL CHECK (duration IN (5, 10, 15, 20)),
  impressions_ordered INTEGER NOT NULL CHECK (impressions_ordered >= 1000),
  impressions_delivered INTEGER NOT NULL DEFAULT 0,
  target_url TEXT NOT NULL,
  creative_type TEXT NOT NULL DEFAULT 'self' CHECK (creative_type IN ('self', 'philosify')),
  creative_url TEXT,
  creative_status TEXT NOT NULL DEFAULT 'pending' CHECK (creative_status IN ('pending', 'in_progress', 'ready', 'rejected')),
  creative_brief TEXT,
  creative_assets_url TEXT,
  creative_fee_cents INTEGER DEFAULT 0,
  schedule_type TEXT NOT NULL DEFAULT 'asap' CHECK (schedule_type IN ('asap', 'scheduled')),
  start_date DATE,
  end_date DATE,
  time_windows JSONB DEFAULT '[]'::jsonb,
  targeting JSONB DEFAULT '{}'::jsonb,
  cpm_cents INTEGER NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  creative_fee_total_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_creative', 'pending_approval', 'approved', 'active', 'paused', 'completed', 'cancelled', 'rejected')),
  paid_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  rejection_reason TEXT,
  plan_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_advertiser ON ads.ad_orders(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON ads.ad_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_active ON ads.ad_orders(placement, status) WHERE status = 'active';

-- ============================================================
-- 5. AD IMPRESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ads.ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID,
  order_id UUID REFERENCES ads.ad_orders(id),
  user_id UUID,
  placement TEXT NOT NULL,
  duration INTEGER NOT NULL,
  cost_cents INTEGER NOT NULL,
  clicked BOOLEAN NOT NULL DEFAULT FALSE,
  clicked_at TIMESTAMPTZ,
  token_nonce TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_impressions_campaign ON ads.ad_impressions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_impressions_order ON ads.ad_impressions(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_impressions_created ON ads.ad_impressions(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_impressions_token_nonce ON ads.ad_impressions(token_nonce) WHERE token_nonce IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_impressions_ip_address ON ads.ad_impressions(ip_address) WHERE ip_address IS NOT NULL;

-- ============================================================
-- 6. ADVERTISER TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ads.advertiser_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES ads.advertisers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'campaign_spend', 'refund', 'adjustment')),
  amount_cents INTEGER NOT NULL,
  balance_after_cents INTEGER NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  campaign_id UUID,
  order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_advertiser ON ads.advertiser_transactions(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe ON ads.advertiser_transactions(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;

-- ============================================================
-- 7. AGENCY TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ads.agency_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES ads.agencies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('commission', 'payout', 'adjustment')),
  amount_cents INTEGER NOT NULL,
  balance_after_cents INTEGER NOT NULL,
  advertiser_id UUID REFERENCES ads.advertisers(id),
  campaign_id UUID,
  order_id UUID,
  impression_id UUID,
  payout_method TEXT,
  payout_reference TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_transactions_agency ON ads.agency_transactions(agency_id);

-- ============================================================
-- 8. INVENTORY FORECAST TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ads.inventory_forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL,
  placement TEXT NOT NULL CHECK (placement IN ('sidebar', 'constellation')),
  estimated_impressions INTEGER NOT NULL DEFAULT 0,
  reserved_impressions INTEGER NOT NULL DEFAULT 0,
  actual_impressions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(forecast_date, placement)
);

CREATE INDEX IF NOT EXISTS idx_inventory_date ON ads.inventory_forecast(forecast_date);

-- Seed inventory for next 90 days
INSERT INTO ads.inventory_forecast (forecast_date, placement, estimated_impressions)
SELECT 
  d::date,
  p.placement,
  CASE 
    WHEN EXTRACT(DOW FROM d) IN (0, 6) THEN
      CASE p.placement WHEN 'sidebar' THEN 3000 WHEN 'constellation' THEN 1500 END
    ELSE
      CASE p.placement WHEN 'sidebar' THEN 5000 WHEN 'constellation' THEN 2500 END
  END
FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', INTERVAL '1 day') d
CROSS JOIN (VALUES ('sidebar'), ('constellation')) AS p(placement)
ON CONFLICT (forecast_date, placement) DO NOTHING;

-- ============================================================
-- 9. PRICING CONFIG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ads.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('cpm', 'creative_fee')),
  placement TEXT,
  duration INTEGER,
  price_cents INTEGER NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default pricing
INSERT INTO ads.pricing_config (pricing_type, placement, duration, price_cents) VALUES
  ('cpm', 'sidebar', 5, 1000),
  ('cpm', 'sidebar', 10, 2000),
  ('cpm', 'sidebar', 15, 3000),
  ('cpm', 'sidebar', 20, 4000),
  ('cpm', 'constellation', 5, 800),
  ('creative_fee', NULL, 5, 15000),
  ('creative_fee', NULL, 10, 25000),
  ('creative_fee', NULL, 15, 35000),
  ('creative_fee', NULL, 20, 45000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. GRANT PERMISSIONS
-- ============================================================
GRANT USAGE ON SCHEMA ads TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ads TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ads TO service_role;

-- ============================================================
-- DONE!
-- ============================================================
