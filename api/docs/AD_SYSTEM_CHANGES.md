# Ad System Changes: Proportional Fill-Rate Implementation

## Summary

The ad serving system has been completely redesigned to guarantee **100% fill rate** with **budget-weighted proportional distribution**.

### Before (Old System)
- ❌ Hard frequency cap: 3 impressions per campaign per user per day
- ❌ After cap hit, ad slot returned `null` (empty)
- ❌ FIFO ordering: first-created campaigns got all traffic
- ❌ Scheduled campaigns mixed with always-on
- ❌ Small campaigns could be starved if larger campaigns consumed all daily caps

### After (New System)
- ✅ Soft frequency cap: 3 impressions then **rotate** to next campaign
- ✅ **100% fill rate**: No empty slots (house ads as fallback)
- ✅ Budget-weighted: Campaigns receive impressions proportional to `total_cents`
- ✅ Always-on only: Scheduled campaigns excluded from proportional pool
- ✅ Fair distribution: All advertisers get exposure proportional to investment

---

## Changes Made

### 1. Backend: `api/src/handlers/ads/serve.js`

**New Functions:**
- `selectProportionalAd()` - Core proportional algorithm with deficit calculation
- `serveHouseAd()` - Fallback for zero active campaigns

**Modified Functions:**
- `handleServeAd()` - Now calls proportional algorithm, guarantees non-null response
- `handleServeAdBatch()` - Uses proportional selection for batch fills

**Removed:**
- Hard frequency cap enforcement
- FIFO ordering logic
- Empty ad slot returns (`ad: null` when capped)
- Scheduled campaign serving in main flow

**Key Algorithm:**
```javascript
// For each campaign, calculate:
target_proportion = campaign.total_cents / sum(all_campaigns.total_cents)
actual_proportion = campaign_impressions_today / total_impressions_today
deficit = target_proportion - actual_proportion

// Select campaign with highest deficit (most behind target)
// Subject to soft frequency cap (3 per user/day per campaign)
```

### 2. Frontend: `site/src/components/ads/InlineAdSlot.jsx`

**Changes:**
- Skip impression tracking for house ads (`is_house_ad: true`)
- Skip click tracking for house ads
- Handle `impression_token = null` for house ads

**Code:**
```javascript
if (ad?.is_house_ad) {
  // Skip tracking for Philosify promotional content
  setHasRecordedImpression(true);
  return;
}
```

### 3. Documentation

**New Files:**
- `api/docs/PROPORTIONAL_AD_SYSTEM.md` - Complete system documentation
- `api/docs/AD_SYSTEM_CHANGES.md` - This file (migration guide)
- `api/scripts/check-ad-distribution.sql` - Diagnostic queries

---

## Migration Guide

### For Existing Campaigns

**No action required.** Existing campaigns will automatically participate in proportional distribution if they meet criteria:
- `status = 'active'`
- `creative_status = 'ready'`
- `schedule_type = 'asap'` (always-on)
- `impressions_delivered < impressions_ordered`

**Scheduled campaigns** (`schedule_type = 'scheduled'`) are **excluded** from proportional distribution. To include them, change to `asap`.

### For New Campaigns

When creating campaigns via planner or direct orders:
```javascript
{
  "schedule_type": "asap", // Required for proportional distribution
  "total_cents": 50000,    // Budget in cents ($500) - used for weighting
  "status": "active",
  "creative_status": "ready"
}
```

### For House Ads

**Creative Requirements:**
- Upload images/videos to Cloudflare R2 public bucket
- Recommended sizes:
  - Sidebar: 800x600px (landscape)
  - Constellation: 400x400px (square)
- Formats: JPEG, PNG, WebP, MP4, WebM

**Update Creative URLs:**
Edit `api/src/handlers/ads/serve.js` → `serveHouseAd()`:
```javascript
const houseAds = {
  sidebar: {
    5: { creative_url: 'https://your-r2-bucket.r2.dev/house-ads/sidebar-5s.jpg', ... },
    // ... other durations
  },
  constellation: {
    5: { creative_url: 'https://your-r2-bucket.r2.dev/house-ads/constellation-5s.jpg', ... },
  },
};
```

---

## Testing Proportional Distribution

### 1. Create Test Campaigns

```sql
-- Campaign A: $100 budget (10% target proportion)
INSERT INTO ads.ad_orders (
  advertiser_id, name, placement, duration, impressions_ordered,
  target_url, creative_url, creative_type, creative_status,
  schedule_type, total_cents, subtotal_cents, cpm_cents, status
) VALUES (
  'your-advertiser-id', 'Campaign A', 'sidebar', 10, 10000,
  'https://example.com', 'https://your-r2-bucket.r2.dev/creative-a.jpg',
  'self', 'ready', 'asap', 10000, 10000, 1000, 'active'
);

-- Campaign B: $900 budget (90% target proportion)
INSERT INTO ads.ad_orders (
  advertiser_id, name, placement, duration, impressions_ordered,
  target_url, creative_url, creative_type, creative_status,
  schedule_type, total_cents, subtotal_cents, cpm_cents, status
) VALUES (
  'your-advertiser-id', 'Campaign B', 'sidebar', 10, 90000,
  'https://example.com', 'https://your-r2-bucket.r2.dev/creative-b.jpg',
  'self', 'ready', 'asap', 90000, 90000, 1000, 'active'
);
```

### 2. Generate Test Traffic

```bash
# Serve ads to simulate users
for i in {1..100}; do
  curl "http://localhost:8787/api/ads/serve?placement=sidebar" \
    -H "cf-connecting-ip: 192.168.1.$i"  # Different IPs to simulate users
done
```

### 3. Check Distribution

```bash
# Run diagnostic script in Supabase SQL Editor
cat api/scripts/check-ad-distribution.sql | pbcopy
# Paste into Supabase SQL Editor → Run
```

**Expected Result:**
- Campaign A: ~10% of impressions
- Campaign B: ~90% of impressions
- House ads: 0% (if campaigns active)

### 4. Test Soft Frequency Cap

```bash
# Same user sees 3 impressions of Campaign B, then rotates to Campaign A
for i in {1..10}; do
  curl "http://localhost:8787/api/ads/serve?placement=sidebar&user_id=test-user-123" \
    -c cookies.txt -b cookies.txt
done
```

**Expected Result:**
- First 3 requests: Campaign B (90% weight)
- Next 3 requests: Campaign A (Campaign B is soft-capped for this user)
- After: Rotation continues proportionally

---

## Monitoring

### Daily Health Check

Run `api/scripts/check-ad-distribution.sql` in Supabase SQL Editor.

**Key Metrics to Watch:**

1. **Campaign Distribution Accuracy**
   - Target % vs Actual % should be within ±10% for healthy system
   - Large deficits indicate one campaign is starved

2. **Soft Cap Hit Rate**
   - If >50% of users hit soft cap for a campaign → increase cap or add more campaigns
   - Ideal: <30% of users hitting cap

3. **House Ad Rate**
   - Should be 0% if campaigns are active
   - >5% indicates inventory shortage (not enough campaigns)

4. **System Health**
   - 3+ active campaigns = Healthy
   - 1-2 campaigns = Limited rotation (consider recruiting advertisers)
   - 0 campaigns = House ads only (normal for new platform)

### Alerts to Set Up

1. **House Ad Rate >20%**
   - Indicates severe campaign inventory shortage
   - Action: Approve pending campaigns or recruit advertisers

2. **Campaign Deficit >30%**
   - One campaign is significantly under-delivering
   - Action: Check targeting (may be too restrictive)

3. **Zero Active Campaigns**
   - All campaigns exhausted or paused
   - Action: Notify advertisers, create new campaigns

---

## Rollback Plan

If issues arise, revert to old system:

### 1. Restore Old `serve.js`

```bash
cd api/src/handlers/ads
git checkout HEAD~1 serve.js
```

### 2. Redeploy API

```bash
cd api
npm run deploy:prod
```

### 3. Revert Frontend

```bash
cd site/src/components/ads
git checkout HEAD~1 InlineAdSlot.jsx
npm run build
npx wrangler pages deploy dist --project-name=philosify-frontend --branch=production
```

---

## FAQ

**Q: Will existing campaigns break?**  
A: No. Always-on campaigns (`schedule_type = 'asap'`) work automatically. Scheduled campaigns need manual conversion.

**Q: What happens to scheduled campaigns?**  
A: They are excluded from proportional distribution. To include them, change `schedule_type` to `'asap'` and remove date/time constraints.

**Q: How do I adjust proportions?**  
A: Change `total_cents` (budget) for a campaign. Higher budget = more impressions.

**Q: Can I disable house ads?**  
A: Not recommended (breaks 100% fill guarantee). If needed, return `{ ad: null }` in `serveHouseAd()`.

**Q: How do I add new house ad creatives?**  
A: Upload to R2, update URLs in `serveHouseAd()` function in `serve.js`.

**Q: Will users see 3x more ads now?**  
A: No. Soft cap of 3 per campaign still limits exposure. Rotation just ensures the 4th+ impression goes to a different campaign instead of empty slot.

---

## Support

**Issues?**
1. Run diagnostic script: `api/scripts/check-ad-distribution.sql`
2. Check logs for `[Ads]` messages in Cloudflare Workers
3. Verify campaigns meet criteria (`status=active`, `schedule_type=asap`, etc.)

**Contact:** Bob Rach (philosify@philosify.org)

**Documentation:**
- Full system docs: `api/docs/PROPORTIONAL_AD_SYSTEM.md`
- Diagnostic script: `api/scripts/check-ad-distribution.sql`
