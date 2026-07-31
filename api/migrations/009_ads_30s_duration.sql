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

-- 4. Creative fee for the new slot -------------------------------------
-- WITHOUT THIS ROW A 30s BUY IS UNDERCHARGED. The quote builder falls back
-- to 15000 when no creative_fee row matches the duration (inventory.js:
-- `feeData?.[0]?.price_cents || 15000`), which is the FIVE-second fee — so a
-- 30s Philosify-produced creative would bill $150 instead of its real price.
--
-- The existing ladder rises $100 per 5 seconds:
--   5s = $150 · 10s = $250 · 15s = $350 · 20s = $450
-- which puts 30s at $650. CHANGE 65000 HERE IF THE RATE CARD SAYS OTHERWISE.
-- placement is NULL for creative fees, matching the four seeded rows (006).
INSERT INTO ads.pricing_config (pricing_type, placement, duration, price_cents)
SELECT 'creative_fee', NULL, 30, 65000
WHERE NOT EXISTS (
  SELECT 1 FROM ads.pricing_config
  WHERE pricing_type = 'creative_fee'
    AND duration = 30
    AND is_active = true
);

COMMIT;

-- Verify -----------------------------------------------------------------
-- SELECT placement, duration, price_cents
-- FROM ads.pricing_config
-- WHERE pricing_type = 'cpm' AND is_active = true
-- ORDER BY placement, duration;
