-- ============================================================
-- URGENT SECURITY FIX: Enable RLS on all unprotected tables
-- 19 tables found without Row Level Security
-- ============================================================
-- Run this IMMEDIATELY on Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. quiz_profiles — user-scoped (users can read/write own profile)
-- ============================================================
ALTER TABLE quiz_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quiz profile"
  ON quiz_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz profile"
  ON quiz_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz profile"
  ON quiz_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to quiz_profiles"
  ON quiz_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 2. graph_nodes — public read, service-role write
-- ============================================================
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read graph nodes"
  ON graph_nodes FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to graph_nodes"
  ON graph_nodes FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 3. graph_edges — public read, service-role write
-- ============================================================
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read graph edges"
  ON graph_edges FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to graph_edges"
  ON graph_edges FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 4. ALL ads.* tables — service-role ONLY
-- The API (service_role) handles all reads/writes.
-- No direct client access allowed.
-- ============================================================

-- ads.agencies
ALTER TABLE ads.agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - agencies"
  ON ads.agencies FOR ALL
  USING (auth.role() = 'service_role');

-- ads.advertisers
ALTER TABLE ads.advertisers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - advertisers"
  ON ads.advertisers FOR ALL
  USING (auth.role() = 'service_role');

-- ads.ad_orders
ALTER TABLE ads.ad_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - ad_orders"
  ON ads.ad_orders FOR ALL
  USING (auth.role() = 'service_role');

-- ads.ad_impressions
ALTER TABLE ads.ad_impressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - ad_impressions"
  ON ads.ad_impressions FOR ALL
  USING (auth.role() = 'service_role');

-- ads.advertiser_transactions
ALTER TABLE ads.advertiser_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - advertiser_transactions"
  ON ads.advertiser_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- ads.agency_transactions
ALTER TABLE ads.agency_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - agency_transactions"
  ON ads.agency_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- ads.inventory_forecast
ALTER TABLE ads.inventory_forecast ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - inventory_forecast"
  ON ads.inventory_forecast FOR ALL
  USING (auth.role() = 'service_role');

-- ads.pricing_config
ALTER TABLE ads.pricing_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - pricing_config"
  ON ads.pricing_config FOR ALL
  USING (auth.role() = 'service_role');

-- ads.ad_campaigns
ALTER TABLE ads.ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - ad_campaigns"
  ON ads.ad_campaigns FOR ALL
  USING (auth.role() = 'service_role');

-- ads.cpm_pricing
ALTER TABLE ads.cpm_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - cpm_pricing"
  ON ads.cpm_pricing FOR ALL
  USING (auth.role() = 'service_role');

-- ads.order_reservations
ALTER TABLE ads.order_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - order_reservations"
  ON ads.order_reservations FOR ALL
  USING (auth.role() = 'service_role');

-- ads.creative_requests
ALTER TABLE ads.creative_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - creative_requests"
  ON ads.creative_requests FOR ALL
  USING (auth.role() = 'service_role');

-- ads.ad_plans
ALTER TABLE ads.ad_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - ad_plans"
  ON ads.ad_plans FOR ALL
  USING (auth.role() = 'service_role');

-- ads.user_profiles (PII: country, city, behavioral data)
ALTER TABLE ads.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - user_profiles"
  ON ads.user_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- ads.targeting_options
ALTER TABLE ads.targeting_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only - targeting_options"
  ON ads.targeting_options FOR ALL
  USING (auth.role() = 'service_role');

-- ads.advertiser_sessions (may have been dropped by migration 008, safe to skip if error)
DO $$
BEGIN
  EXECUTE 'ALTER TABLE ads.advertiser_sessions ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Service role only - advertiser_sessions" ON ads.advertiser_sessions FOR ALL USING (auth.role() = ''service_role'')';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'ads.advertiser_sessions does not exist (dropped by migration 008), skipping';
END $$;

-- ads.agency_sessions (may have been dropped by migration 008, safe to skip if error)
DO $$
BEGIN
  EXECUTE 'ALTER TABLE ads.agency_sessions ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Service role only - agency_sessions" ON ads.agency_sessions FOR ALL USING (auth.role() = ''service_role'')';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'ads.agency_sessions does not exist (dropped by migration 008), skipping';
END $$;

-- ============================================================
-- VERIFICATION: Run this after the migration to confirm all tables have RLS
-- ============================================================
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname IN ('public', 'ads') 
-- ORDER BY schemaname, tablename;
