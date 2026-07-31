-- ============================================================
-- ADS — ADD THE 30s VIDEO DURATION STANDARD
-- ============================================================
-- Adds 30 to the sellable duration ladder for the sidebar placement.
-- Constellation stays fixed at 5s (its frame is a 227x302 card).
-- Safe to re-run: constraints are recreated and the price row is
-- inserted only when absent.
-- ============================================================

BEGIN;

-- 1. Campaigns: widen the duration ladder ------------------------------
ALTER TABLE ads.ad_campaigns
  DROP CONSTRAINT IF EXISTS ad_campaigns_duration_check;

ALTER TABLE ads.ad_campaigns
  ADD CONSTRAINT ad_campaigns_duration_check
  CHECK (duration IN (5, 10, 15, 20, 30));

-- 2. Orders: same ladder -----------------------------------------------
ALTER TABLE ads.ad_orders
  DROP CONSTRAINT IF EXISTS ad_orders_duration_check;

ALTER TABLE ads.ad_orders
  ADD CONSTRAINT ad_orders_duration_check
  CHECK (duration IN (5, 10, 15, 20, 30));

-- 3. Price for the new slot --------------------------------------------
-- Follows the existing ladder: $10 per 5 seconds (5s=$10 ... 20s=$40),
-- so 30s = $60 CPM. Change price_cents here if the rate card differs.
INSERT INTO ads.pricing_config (pricing_type, placement, duration, price_cents)
SELECT 'cpm', 'sidebar', 30, 6000
WHERE NOT EXISTS (
  SELECT 1 FROM ads.pricing_config
  WHERE pricing_type = 'cpm'
    AND placement = 'sidebar'
    AND duration = 30
    AND is_active = true
);

COMMIT;

-- Verify -----------------------------------------------------------------
-- SELECT placement, duration, price_cents
-- FROM ads.pricing_config
-- WHERE pricing_type = 'cpm' AND is_active = true
-- ORDER BY placement, duration;
