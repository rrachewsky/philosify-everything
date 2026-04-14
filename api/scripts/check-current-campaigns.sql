-- ============================================================
-- CHECK CURRENT CAMPAIGNS AND THEIR PROPORTIONAL DISTRIBUTION
-- ============================================================
-- Run this in Supabase SQL Editor
-- ============================================================

-- Active campaigns eligible for proportional distribution
SELECT 
  o.id,
  o.name,
  a.company_name as advertiser,
  o.placement,
  o.total_cents / 100.0 as budget_dollars,
  o.impressions_ordered,
  o.impressions_delivered,
  o.impressions_ordered - o.impressions_delivered as impressions_remaining,
  o.status,
  o.creative_status,
  o.schedule_type,
  o.created_at
FROM ads.ad_orders o
LEFT JOIN ads.advertisers a ON a.id = o.advertiser_id
WHERE o.status = 'active'
  AND o.creative_status = 'ready'
  AND o.schedule_type = 'asap'
  AND o.impressions_delivered < o.impressions_ordered
ORDER BY o.placement, o.total_cents DESC;

-- Calculate proportional distribution by placement
WITH active_orders AS (
  SELECT 
    o.id,
    o.name,
    o.placement,
    o.total_cents,
    a.company_name as advertiser
  FROM ads.ad_orders o
  LEFT JOIN ads.advertisers a ON a.id = o.advertiser_id
  WHERE o.status = 'active'
    AND o.creative_status = 'ready'
    AND o.schedule_type = 'asap'
    AND o.impressions_delivered < o.impressions_ordered
)
SELECT 
  placement,
  name,
  advertiser,
  total_cents / 100.0 as budget_dollars,
  (total_cents::float / SUM(total_cents) OVER (PARTITION BY placement) * 100)::decimal(5,2) as target_percentage,
  CASE 
    WHEN (total_cents::float / SUM(total_cents) OVER (PARTITION BY placement)) >= 0.5 THEN 'MAJORITY (≥50%)'
    WHEN (total_cents::float / SUM(total_cents) OVER (PARTITION BY placement)) >= 0.25 THEN 'SIGNIFICANT (25-50%)'
    WHEN (total_cents::float / SUM(total_cents) OVER (PARTITION BY placement)) >= 0.10 THEN 'MODERATE (10-25%)'
    ELSE 'MINOR (<10%)'
  END as share_level
FROM active_orders
ORDER BY placement, total_cents DESC;

-- Summary by placement
SELECT 
  placement,
  COUNT(*) as active_campaigns,
  SUM(total_cents) / 100.0 as total_budget_dollars,
  SUM(impressions_ordered) as total_impressions_ordered,
  SUM(impressions_delivered) as total_impressions_delivered
FROM ads.ad_orders
WHERE status = 'active'
  AND creative_status = 'ready'
  AND schedule_type = 'asap'
  AND impressions_delivered < impressions_ordered
GROUP BY placement
ORDER BY placement;
