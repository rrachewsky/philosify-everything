-- ============================================================
-- PROPORTIONAL AD DISTRIBUTION DIAGNOSTIC SCRIPT
-- ============================================================
-- Run this in Supabase SQL Editor to check campaign health
-- ============================================================

-- ============================================================
-- 1. ACTIVE CAMPAIGNS OVERVIEW
-- ============================================================
SELECT 
  '=== ACTIVE CAMPAIGNS ===' as section,
  COUNT(*) as total_active_campaigns,
  SUM(total_cents) / 100.0 as total_budget_dollars,
  SUM(impressions_ordered) as total_impressions_ordered,
  SUM(impressions_delivered) as total_impressions_delivered,
  (SUM(impressions_delivered)::float / NULLIF(SUM(impressions_ordered), 0) * 100)::decimal(5,2) as delivery_percentage
FROM ads.ad_orders
WHERE status = 'active' 
  AND creative_status = 'ready'
  AND schedule_type = 'asap'
  AND impressions_delivered < impressions_ordered;

-- ============================================================
-- 2. CAMPAIGN BUDGET WEIGHTS & TARGET PROPORTIONS
-- ============================================================
WITH active_campaigns AS (
  SELECT 
    id,
    name,
    total_cents,
    impressions_ordered,
    impressions_delivered,
    placement
  FROM ads.ad_orders
  WHERE status = 'active' 
    AND creative_status = 'ready'
    AND schedule_type = 'asap'
    AND impressions_delivered < impressions_ordered
),
campaign_weights AS (
  SELECT 
    id,
    name,
    placement,
    total_cents,
    total_cents / 100.0 as budget_dollars,
    impressions_ordered,
    impressions_delivered,
    impressions_ordered - impressions_delivered as remaining_impressions,
    total_cents::float / SUM(total_cents) OVER (PARTITION BY placement) as target_proportion
  FROM active_campaigns
)
SELECT 
  '=== CAMPAIGN WEIGHTS ===' as section,
  name,
  placement,
  budget_dollars,
  (target_proportion * 100)::decimal(5,2) as target_percentage,
  impressions_ordered,
  impressions_delivered,
  remaining_impressions,
  (impressions_delivered::float / NULLIF(impressions_ordered, 0) * 100)::decimal(5,2) as completion_percentage
FROM campaign_weights
ORDER BY placement, target_proportion DESC;

-- ============================================================
-- 3. TODAY'S ACTUAL DISTRIBUTION vs TARGET
-- ============================================================
WITH active_campaigns AS (
  SELECT 
    id,
    name,
    total_cents,
    placement
  FROM ads.ad_orders
  WHERE status = 'active' 
    AND creative_status = 'ready'
    AND schedule_type = 'asap'
    AND impressions_delivered < impressions_ordered
),
campaign_weights AS (
  SELECT 
    id,
    name,
    placement,
    total_cents,
    total_cents::float / SUM(total_cents) OVER (PARTITION BY placement) as target_proportion
  FROM active_campaigns
),
today_impressions AS (
  SELECT 
    order_id,
    placement,
    COUNT(*) as impressions_today
  FROM ads.ad_impressions
  WHERE created_at >= CURRENT_DATE
  GROUP BY order_id, placement
),
today_totals AS (
  SELECT 
    placement,
    SUM(impressions_today) as total_impressions_today
  FROM today_impressions
  GROUP BY placement
)
SELECT 
  '=== TODAY\'S DISTRIBUTION ===' as section,
  cw.name,
  cw.placement,
  (cw.target_proportion * 100)::decimal(5,2) as target_percentage,
  COALESCE(ti.impressions_today, 0) as actual_impressions_today,
  COALESCE(
    (ti.impressions_today::float / NULLIF(tt.total_impressions_today, 0) * 100)::decimal(5,2),
    0
  ) as actual_percentage_today,
  (
    COALESCE(ti.impressions_today::float / NULLIF(tt.total_impressions_today, 0), 0) 
    - cw.target_proportion
  ) * 100 as deficit_percentage,
  CASE 
    WHEN COALESCE(ti.impressions_today::float / NULLIF(tt.total_impressions_today, 0), 0) < cw.target_proportion 
    THEN '⚠️ BEHIND TARGET'
    WHEN COALESCE(ti.impressions_today::float / NULLIF(tt.total_impressions_today, 0), 0) > cw.target_proportion 
    THEN '✓ AHEAD OF TARGET'
    ELSE '✓ ON TARGET'
  END as status
FROM campaign_weights cw
LEFT JOIN today_impressions ti ON ti.order_id = cw.id AND ti.placement = cw.placement
LEFT JOIN today_totals tt ON tt.placement = cw.placement
ORDER BY cw.placement, deficit_percentage;

-- ============================================================
-- 4. SOFT FREQUENCY CAP ANALYSIS
-- ============================================================
WITH user_impressions_today AS (
  SELECT 
    order_id,
    user_id,
    COUNT(*) as impression_count
  FROM ads.ad_impressions
  WHERE created_at >= CURRENT_DATE
    AND user_id IS NOT NULL
  GROUP BY order_id, user_id
)
SELECT 
  '=== SOFT CAP HIT RATE ===' as section,
  o.name,
  o.placement,
  COUNT(DISTINCT ui.user_id) FILTER (WHERE ui.impression_count >= 3) as users_at_soft_cap,
  COUNT(DISTINCT ui.user_id) as total_users_exposed,
  (COUNT(DISTINCT ui.user_id) FILTER (WHERE ui.impression_count >= 3)::float 
   / NULLIF(COUNT(DISTINCT ui.user_id), 0) * 100)::decimal(5,2) as soft_cap_hit_rate_percentage,
  CASE 
    WHEN COUNT(DISTINCT ui.user_id) FILTER (WHERE ui.impression_count >= 3)::float 
         / NULLIF(COUNT(DISTINCT ui.user_id), 0) > 0.5
    THEN '⚠️ HIGH CAP RATE (>50%)'
    ELSE '✓ HEALTHY'
  END as status
FROM ads.ad_orders o
LEFT JOIN user_impressions_today ui ON ui.order_id = o.id
WHERE o.status = 'active' 
  AND o.creative_status = 'ready'
  AND o.schedule_type = 'asap'
GROUP BY o.id, o.name, o.placement
ORDER BY soft_cap_hit_rate_percentage DESC NULLS LAST;

-- ============================================================
-- 5. HOUSE AD SERVE RATE (Should be 0% if campaigns active)
-- ============================================================
SELECT 
  '=== HOUSE AD RATE ===' as section,
  placement,
  COUNT(*) FILTER (WHERE order_id IS NULL) as house_ad_serves,
  COUNT(*) as total_serves,
  (COUNT(*) FILTER (WHERE order_id IS NULL)::float / NULLIF(COUNT(*), 0) * 100)::decimal(5,2) as house_ad_percentage,
  CASE 
    WHEN COUNT(*) FILTER (WHERE order_id IS NULL) = 0 THEN '✓ HEALTHY (0% house ads)'
    WHEN COUNT(*) FILTER (WHERE order_id IS NULL)::float / NULLIF(COUNT(*), 0) < 0.05 THEN '✓ ACCEPTABLE (<5% house ads)'
    ELSE '⚠️ HIGH HOUSE AD RATE (check campaign inventory)'
  END as status
FROM ads.ad_impressions
WHERE created_at >= CURRENT_DATE
GROUP BY placement;

-- ============================================================
-- 6. CAMPAIGNS EXCLUDED FROM PROPORTIONAL DISTRIBUTION
-- ============================================================
SELECT 
  '=== EXCLUDED CAMPAIGNS ===' as section,
  name,
  status,
  creative_status,
  schedule_type,
  CASE 
    WHEN status != 'active' THEN 'Not active'
    WHEN creative_status != 'ready' THEN 'Creative not ready'
    WHEN schedule_type != 'asap' THEN 'Scheduled (not always-on)'
    WHEN impressions_delivered >= impressions_ordered THEN 'Budget exhausted'
    ELSE 'Unknown reason'
  END as exclusion_reason,
  impressions_delivered,
  impressions_ordered
FROM ads.ad_orders
WHERE status NOT IN ('cancelled', 'rejected') -- Show everything except explicitly cancelled
  AND (
    status != 'active' 
    OR creative_status != 'ready' 
    OR schedule_type != 'asap'
    OR impressions_delivered >= impressions_ordered
  )
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================
-- 7. LAST 24 HOURS IMPRESSION TIMELINE
-- ============================================================
SELECT 
  '=== 24H IMPRESSION TIMELINE ===' as section,
  DATE_TRUNC('hour', created_at) as hour,
  o.name as campaign_name,
  COUNT(*) as impressions
FROM ads.ad_impressions i
LEFT JOIN ads.ad_orders o ON o.id = i.order_id
WHERE i.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), o.name
ORDER BY hour DESC, impressions DESC;

-- ============================================================
-- 8. TARGETING EFFECTIVENESS
-- ============================================================
WITH targeted_campaigns AS (
  SELECT 
    id,
    name,
    targeting,
    CASE 
      WHEN targeting IS NULL OR targeting::text = '{}' THEN false
      ELSE true
    END as has_targeting
  FROM ads.ad_orders
  WHERE status = 'active' 
    AND creative_status = 'ready'
    AND schedule_type = 'asap'
)
SELECT 
  '=== TARGETING STATS ===' as section,
  tc.name,
  tc.has_targeting,
  COUNT(DISTINCT i.user_id) as unique_users_reached,
  COUNT(i.id) as total_impressions,
  (COUNT(i.id)::float / NULLIF(COUNT(DISTINCT i.user_id), 0))::decimal(5,2) as avg_frequency_per_user
FROM targeted_campaigns tc
LEFT JOIN ads.ad_impressions i ON i.order_id = tc.id AND i.created_at >= CURRENT_DATE
GROUP BY tc.id, tc.name, tc.has_targeting
ORDER BY has_targeting DESC, total_impressions DESC;

-- ============================================================
-- 9. HEALTH CHECK SUMMARY
-- ============================================================
WITH health_metrics AS (
  SELECT 
    (SELECT COUNT(*) FROM ads.ad_orders 
     WHERE status = 'active' 
       AND creative_status = 'ready' 
       AND schedule_type = 'asap'
       AND impressions_delivered < impressions_ordered
    ) as active_campaigns,
    
    (SELECT COUNT(*) FILTER (WHERE order_id IS NULL)::float / NULLIF(COUNT(*), 0) * 100
     FROM ads.ad_impressions
     WHERE created_at >= CURRENT_DATE
    ) as house_ad_rate,
    
    (SELECT COUNT(DISTINCT user_id) 
     FROM ads.ad_impressions
     WHERE created_at >= CURRENT_DATE
       AND user_id IS NOT NULL
    ) as unique_users_today,
    
    (SELECT COUNT(*) 
     FROM ads.ad_impressions
     WHERE created_at >= CURRENT_DATE
    ) as total_impressions_today
)
SELECT 
  '=== SYSTEM HEALTH ===' as section,
  active_campaigns,
  CASE 
    WHEN active_campaigns = 0 THEN '⚠️ NO ACTIVE CAMPAIGNS'
    WHEN active_campaigns = 1 THEN '⚠️ ONLY 1 CAMPAIGN (limited rotation)'
    WHEN active_campaigns >= 3 THEN '✓ HEALTHY (3+ campaigns)'
    ELSE '⚠️ LOW INVENTORY (2 campaigns)'
  END as campaign_health,
  
  COALESCE(house_ad_rate, 0)::decimal(5,2) as house_ad_percentage,
  CASE 
    WHEN COALESCE(house_ad_rate, 0) = 0 THEN '✓ HEALTHY (0% house ads)'
    WHEN COALESCE(house_ad_rate, 0) < 5 THEN '✓ ACCEPTABLE (<5%)'
    WHEN COALESCE(house_ad_rate, 0) < 20 THEN '⚠️ MODERATE (5-20%)'
    ELSE '❌ CRITICAL (>20% house ads)'
  END as house_ad_health,
  
  unique_users_today,
  total_impressions_today,
  CASE 
    WHEN total_impressions_today = 0 THEN 0
    ELSE (total_impressions_today::float / NULLIF(unique_users_today, 0))::decimal(5,2)
  END as avg_ads_per_user_today,
  
  CASE 
    WHEN active_campaigns >= 3 AND COALESCE(house_ad_rate, 0) < 5 AND total_impressions_today > 0
    THEN '✅ SYSTEM HEALTHY'
    WHEN active_campaigns = 0
    THEN '❌ NO CAMPAIGNS - SERVING HOUSE ADS ONLY'
    ELSE '⚠️ CHECK WARNINGS ABOVE'
  END as overall_status
FROM health_metrics;
