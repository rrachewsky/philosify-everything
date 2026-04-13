# Proportional Fill-Rate Ad System

## Overview

Philosify's ad system guarantees **100% fill rate** with **budget-weighted proportional distribution**. No ad slot is ever empty. Advertisers receive impressions proportional to their investment, with intelligent rotation and targeting.

## Core Principles

### 1. **100% Fill Rate Guarantee**
- Every ad request returns an ad (never `null`)
- If no paid campaigns exist → show house ads (Philosify promotional content)
- If all campaigns are frequency-capped for a user → rotate to least-recently-shown

### 2. **Budget-Weighted Distribution**
- Each campaign receives impressions **proportional to `total_cents` (budget invested)**
- Example:
  - Campaign A: $1,000 budget → 10% of all impressions
  - Campaign B: $9,000 budget → 90% of all impressions
- Distribution is global (across all users), not per-user

### 3. **Soft Frequency Cap with Rotation**
- Users see max **3 impressions** of the same campaign per day
- After hitting cap → system rotates to next-priority campaign
- Prevents ad fatigue while maintaining proportional distribution

### 4. **Weighted Hybrid Targeting**
- **Prefer** campaigns targeting the user's profile
- **Fallback** to untargeted campaigns if all targeted campaigns are capped
- **Never** return empty slot due to targeting restrictions

### 5. **Always-On Campaigns Only**
- Proportional system requires `schedule_type = 'asap'`
- Scheduled campaigns (specific dates/times) are **excluded** from proportional distribution
- Ensures consistent fill rate across all hours/days

---

## Algorithm Details

### Proportional Selection Algorithm

Located in: `api/src/handlers/ads/serve.js` → `selectProportionalAd()`

```
For each ad request:

1. Fetch all active orders (status=active, creative_status=ready, schedule_type=asap)
2. Calculate each order's:
   - target_proportion = order.total_cents / sum(all_orders.total_cents)
   - actual_proportion = order_impressions_today / total_impressions_today
   - deficit = target_proportion - actual_proportion

3. Get user's impression history today (for soft frequency cap)
4. Filter out orders user has seen ≥3 times today
5. Apply targeting preferences:
   - Prioritize targeted campaigns matching user profile (+0.1 deficit bonus)
   - Fallback to untargeted campaigns if all targeted are capped
6. Sort by deficit (highest first = most behind target)
7. Return order with highest deficit
```

### Deficit Calculation

**Deficit** = How far behind its proportional target a campaign is

- **Positive deficit** → campaign needs more impressions
- **Negative deficit** → campaign is ahead of target

**Example:**
- Campaign A has 20% target proportion, 10% actual → deficit = +0.10 (needs more)
- Campaign B has 80% target proportion, 90% actual → deficit = -0.10 (ahead)
- **Campaign A is selected** (higher deficit)

### Targeting Bonus

Campaigns with targeting that match the user get **+0.1 bonus** to deficit:
- Ensures targeted campaigns are preferred when eligible
- Prevents wasteful impressions on mis-targeted users
- Maintains proportional distribution when targeting overlaps

---

## House Ads

When no paid campaigns are available, the system serves **house ads**.

### House Ad Configuration

Located in: `api/src/handlers/ads/serve.js` → `serveHouseAd()`

```javascript
const houseAds = {
  sidebar: {
    5: { creative_url: '...', target_url: 'https://philosify.org/premium', ... },
    10: { creative_url: '...', target_url: 'https://philosify.org/premium', ... },
    15: { creative_url: '...', target_url: 'https://philosify.org/premium', ... },
    20: { creative_url: '...', target_url: 'https://philosify.org/premium', ... },
  },
  constellation: {
    5: { creative_url: '...', target_url: 'https://philosify.org/premium', ... },
  },
};
```

### House Ad Characteristics

- **No impression tracking** (`impression_token = null`, `is_house_ad = true`)
- **No billing** (free promotional content)
- **No frequency cap** (can be shown unlimited times)
- **Promotes Philosify features** (e.g., Premium subscription)

### Frontend Handling

`site/src/components/ads/InlineAdSlot.jsx` checks `ad.is_house_ad`:
```javascript
if (ad?.is_house_ad) {
  // Skip impression recording
  // Skip click tracking
  // No impression_token validation
}
```

---

## Campaign Requirements

For a campaign to participate in proportional distribution:

| Requirement | Value | Reason |
|-------------|-------|--------|
| `status` | `active` | Only live campaigns |
| `creative_status` | `ready` | Creative must be approved/uploaded |
| `schedule_type` | `asap` | No scheduling (always-on) |
| `impressions_delivered` | `< impressions_ordered` | Budget not exhausted |
| `total_cents` | `> 0` | Must have budget data |

### Creating Compatible Campaigns

When creating campaigns for proportional distribution:

```javascript
// ✅ CORRECT - Always-on campaign
{
  "status": "active",
  "creative_status": "ready",
  "schedule_type": "asap", // ← Always-on
  "total_cents": 50000, // $500 budget
  "impressions_ordered": 50000
}

// ❌ WRONG - Scheduled campaign (excluded from proportional)
{
  "status": "active",
  "creative_status": "ready",
  "schedule_type": "scheduled", // ← Will be skipped
  "start_date": "2026-05-01",
  "end_date": "2026-05-31"
}
```

---

## Monitoring & Diagnostics

### Key Metrics to Track

1. **Campaign Distribution Accuracy**
   ```sql
   SELECT 
     o.id,
     o.name,
     o.total_cents,
     COUNT(i.id) as impressions_today,
     o.total_cents::float / SUM(o.total_cents) OVER () as target_proportion,
     COUNT(i.id)::float / SUM(COUNT(i.id)) OVER () as actual_proportion
   FROM ads.ad_orders o
   LEFT JOIN ads.ad_impressions i ON i.order_id = o.id AND i.created_at >= CURRENT_DATE
   WHERE o.status = 'active' AND o.schedule_type = 'asap'
   GROUP BY o.id, o.name, o.total_cents;
   ```

2. **Soft Cap Hit Rate**
   ```sql
   -- How many users are hitting the soft cap (3 impressions/day)?
   SELECT 
     order_id,
     COUNT(DISTINCT user_id) as users_at_cap
   FROM (
     SELECT order_id, user_id, COUNT(*) as imp_count
     FROM ads.ad_impressions
     WHERE created_at >= CURRENT_DATE
     GROUP BY order_id, user_id
     HAVING COUNT(*) >= 3
   ) capped
   GROUP BY order_id;
   ```

3. **House Ad Serve Rate**
   ```sql
   -- Should be 0% if campaigns are active
   SELECT 
     COUNT(*) FILTER (WHERE order_id IS NULL) as house_ads,
     COUNT(*) as total_serves,
     (COUNT(*) FILTER (WHERE order_id IS NULL)::float / COUNT(*)) * 100 as house_ad_percentage
   FROM ads.ad_impressions
   WHERE created_at >= CURRENT_DATE;
   ```

### Diagnostic Queries

**Check campaign weights:**
```sql
SELECT 
  name,
  total_cents,
  total_cents::float / SUM(total_cents) OVER () as weight_percentage
FROM ads.ad_orders
WHERE status = 'active' AND schedule_type = 'asap';
```

**Check daily distribution:**
```sql
SELECT 
  o.name,
  COUNT(i.id) as impressions,
  o.total_cents / 100.0 as budget_dollars,
  (COUNT(i.id)::float / SUM(COUNT(i.id)) OVER ()) * 100 as actual_percentage
FROM ads.ad_orders o
LEFT JOIN ads.ad_impressions i ON i.order_id = o.id AND i.created_at >= CURRENT_DATE
WHERE o.status = 'active'
GROUP BY o.id, o.name, o.total_cents;
```

---

## Edge Cases

### Case 1: Single Active Campaign
- Campaign gets 100% of impressions
- Soft cap still applies (3 per user/day)
- After cap, user sees house ads (no other campaigns to rotate to)

### Case 2: All Campaigns Exhausted
- All campaigns hit `impressions_delivered >= impressions_ordered`
- System serves house ads for all requests
- No empty ad slots

### Case 3: User Doesn't Match Any Targeting
- All campaigns have targeting, user matches none
- System shows untargeted campaigns (if any exist)
- Fallback to any campaign (targeting relaxed)
- Ultimate fallback: house ads

### Case 4: Zero Active Campaigns
- New platform, no advertisers yet
- System serves house ads 100% of the time
- Once first campaign launches, proportional distribution begins

---

## Migration from Old System

### Old System (Removed)
- ❌ Hard frequency cap (`FREQUENCY_CAP_PER_DAY = 3`)
- ❌ FIFO ordering (first-created campaigns prioritized)
- ❌ Empty ad slots when cap hit (`ad: null`)
- ❌ Scheduled campaigns mixed with always-on

### New System (Current)
- ✅ Soft frequency cap with rotation
- ✅ Budget-weighted proportional distribution
- ✅ 100% fill rate (house ads fallback)
- ✅ Always-on campaigns only

### Breaking Changes
- **Frontend**: Must handle `is_house_ad: true` flag
- **Database**: Campaigns must have `schedule_type = 'asap'` to participate
- **Billing**: House ads are not billed (no `impression_token`)

---

## FAQ

**Q: Why proportional distribution instead of highest-CPM-first?**  
A: Proportional ensures all advertisers get fair exposure. Highest-CPM-first would exhaust top bidders quickly, leaving low-budget campaigns starved.

**Q: Why global proportional instead of per-user?**  
A: Simpler implementation, faster queries, and achieves the same goal (fair budget distribution) across the user base.

**Q: What happens if advertiser budget changes mid-campaign?**  
A: `total_cents` is set at campaign creation and remains fixed. Changing it requires creating a new campaign or admin intervention.

**Q: Can I adjust the soft frequency cap?**  
A: Yes, change `SOFT_FREQUENCY_CAP = 3` in `serve.js`. Higher values = more repetition, lower fill-rate issues with few campaigns.

**Q: How do I create house ad creatives?**  
A: Upload images/videos to Cloudflare R2 (public bucket), update URLs in `serveHouseAd()` function. Recommended sizes: 800x600px (sidebar), 400x400px (constellation).

**Q: Why are scheduled campaigns excluded?**  
A: Scheduling creates unpredictable availability (e.g., campaign only runs 9am-5pm). This would cause fill-rate gaps and proportional drift. Always-on campaigns ensure 24/7 availability.

---

## Future Enhancements

### Planned
- [ ] Admin dashboard showing real-time proportional distribution
- [ ] Auto-alert when campaign deficit exceeds ±20% (needs rebalancing)
- [ ] A/B testing for house ad creatives
- [ ] Predictive pacing (slow down fast-spending campaigns to extend lifetime)

### Under Consideration
- [ ] Per-user proportional distribution (more complex, better targeting)
- [ ] Dynamic soft cap (adjust based on campaign count)
- [ ] "Premium" targeting tier (pay more for guaranteed matching)
- [ ] Geofencing for regional campaigns (separate proportional pools by country)

---

## Support

For issues with proportional distribution:
1. Check diagnostic queries above
2. Verify campaigns have `schedule_type = 'asap'`
3. Confirm `total_cents` is set correctly
4. Review logs for `[Ads]` messages

**Contact:** Bob Rach (philosify@philosify.org)
