-- Debug: Check ALL campaigns regardless of status
SELECT 
  o.id,
  o.name,
  a.company_name as advertiser,
  o.placement,
  o.status,
  o.creative_status,
  o.schedule_type,
  o.total_cents / 100.0 as budget_dollars,
  o.impressions_ordered,
  o.impressions_delivered,
  o.impressions_ordered - o.impressions_delivered as remaining,
  o.creative_url IS NOT NULL as has_creative,
  o.target_url IS NOT NULL as has_target
FROM ads.ad_orders o
LEFT JOIN ads.advertisers a ON a.id = o.advertiser_id
ORDER BY o.created_at DESC
LIMIT 20;

-- Check what's blocking campaigns from serving
SELECT 
  CASE 
    WHEN status != 'active' THEN 'status: ' || status
    WHEN creative_status != 'ready' THEN 'creative_status: ' || creative_status
    WHEN schedule_type != 'asap' THEN 'schedule_type: ' || schedule_type
    WHEN impressions_delivered >= impressions_ordered THEN 'exhausted'
    ELSE 'ELIGIBLE'
  END as blocking_reason,
  COUNT(*) as count
FROM ads.ad_orders
GROUP BY blocking_reason
ORDER BY count DESC;
