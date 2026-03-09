# Deploy Credits System - Complete Setup Guide

## 🎯 Objective
Set up a **reliable and robust** credit system that works in both development and production.

---

## ✅ Step 1: Deploy Database Schema

### 1.1 Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **Philosify**
3. Click **SQL Editor** in the left sidebar

### 1.2 Execute Schema
1. Click **New Query**
2. Copy the entire contents of `supabase_credits_schema_fixed.sql`
3. Paste into the query editor
4. Click **Run** (or press Ctrl+Enter)

### 1.3 Verify Tables Created
Click **Table Editor** and verify these tables exist:
- ✅ `user_credits`
- ✅ `credit_transactions`
- ✅ `stripe_webhooks`
- ✅ `email_outbox`

### 1.4 Verify RPC Functions
Run this query to check all functions exist:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'consume_credit',
    'refund_credit',
    'process_stripe_payment',
    'process_stripe_refund',
    'get_user_balance',
    'initialize_user_credits'
  )
ORDER BY routine_name;
```

**Expected result:** All 6 functions listed

---

## ✅ Step 2: Initialize Existing Users

### 2.1 Check Users Without Credits
```sql
SELECT u.id, u.email, uc.user_id
FROM auth.users u
LEFT JOIN user_credits uc ON u.id = uc.user_id
WHERE uc.user_id IS NULL;
```

### 2.2 Initialize All Existing Users
```sql
INSERT INTO user_credits (user_id, purchased_credits, free_credits_remaining)
SELECT id, 0, 2
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

### 2.3 Verify Initialization
```sql
SELECT COUNT(*) as total_users_with_credits FROM user_credits;
SELECT COUNT(*) as total_auth_users FROM auth.users;
```

**Both counts should match!**

---

## ✅ Step 3: Test RPC Functions

### 3.1 Test consume_credit
```sql
-- Replace with your test user ID
SELECT * FROM consume_credit(
  p_user_id := 'YOUR_USER_ID_HERE'::UUID,
  p_song := 'Test Song - Test Artist',
  p_model := 'test'
);
```

**Expected:**
```
success | new_total | used_free | error_message
--------|-----------|-----------|---------------
true    | 1         | true      | null
```

### 3.2 Test refund_credit
```sql
SELECT * FROM refund_credit(
  p_user_id := 'YOUR_USER_ID_HERE'::UUID,
  p_credit_type := 'free',
  p_reason := 'test_refund'
);
```

**Expected:**
```
success | new_total | error_message
--------|-----------|---------------
true    | 2         | null
```

### 3.3 Verify Transaction Logs
```sql
SELECT
  type,
  amount,
  total_before,
  total_after,
  created_at
FROM credit_transactions
WHERE user_id = 'YOUR_USER_ID_HERE'::UUID
ORDER BY created_at DESC
LIMIT 5;
```

---

## ✅ Step 4: Configure Environment Variables

### 4.1 Local Development (.dev.vars)
File: `api/.dev.vars` (already exists)

Verify it contains:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_10=price_...
STRIPE_PRICE_ID_20=price_...
STRIPE_PRICE_ID_50=price_...
CHECKOUT_SUCCESS_URL=http://localhost:3001/payment/success
CHECKOUT_CANCEL_URL=http://localhost:3001/payment/cancel
```

### 4.2 Production (Cloudflare Secrets Store)
Already configured via dashboard - verify in:
https://dash.cloudflare.com → Workers & Pages → Account Settings → Secrets Store

---

## ✅ Step 5: Test Complete Flow Locally

### 5.1 Start Backend
```bash
cd api
npm run dev
```

**Expected output:**
```
Ready on http://127.0.0.1:8787
```

### 5.2 Start Frontend
```bash
cd site
npm run dev
```

**Expected output:**
```
Local: http://localhost:3001
```

### 5.3 Test Balance Endpoint
Open browser console and run:
```javascript
fetch('http://localhost:8787/api/balance', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
.then(r => r.json())
.then(console.log)
```

**Expected:**
```json
{
  "userId": "uuid-xxx",
  "credits": 0,
  "freeRemaining": 2,
  "total": 2
}
```

### 5.4 Test Analysis (Credit Consumption)
1. Login to the app
2. Search for a song (e.g., "Imagine - John Lennon")
3. Click **Analyze**
4. Check browser console for logs:
```
[Credits] Processing gpt4 analysis for uuid-xxx
[Credits] Consumed free credit for uuid-xxx. New total: 1
```

5. Verify balance updates in header: **1 CREDIT • 1 FREE**

### 5.5 Test Stripe Payment Flow
1. Click on balance → Payment modal opens
2. Click **10 Credits - $6.00**
3. Redirected to Stripe checkout
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. Redirected to success page
7. **Check console:**
```
[PaymentSuccess] Verifying payment session: cs_test_xxx
[Payment] Verification result: {success: true, credits: 10, newBalance: 11}
```

8. Verify balance: **11 CREDITS • 1 FREE**

---

## ✅ Step 6: Production Deployment

### 6.1 Deploy Backend
```bash
cd api
wrangler deploy --env production
```

**Save the Worker URL** (e.g., `https://philosify-api.workers.dev`)

### 6.2 Configure Stripe Webhook (Production)
1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. **Endpoint URL:** `https://philosify-api.workers.dev/api/stripe-webhook`
4. **Events to send:**
   - ✅ `checkout.session.completed`
   - ✅ `charge.refunded`
5. Click **Add endpoint**
6. Copy **Signing secret** (`whsec_xxx`)
7. Update in Cloudflare Secrets Store:
   - Go to https://dash.cloudflare.com
   - Workers & Pages → Account Settings → Secrets Store
   - Update `STRIPE_WEBHOOK_SECRET` with new value

### 6.3 Deploy Frontend
```bash
cd site
wrangler pages deploy . --project-name=philosify-frontend
```

### 6.4 Update Production URLs
In Cloudflare Secrets Store, update:
- `CHECKOUT_SUCCESS_URL`: `https://philosify.org/payment/success`
- `CHECKOUT_CANCEL_URL`: `https://philosify.org/payment/cancel`

---

## ✅ Step 7: Production Testing

### 7.1 Test Payment Flow
1. Go to https://philosify.org
2. Login
3. Purchase credits (use test mode)
4. Verify credits added immediately

### 7.2 Check Webhook Logs
```bash
cd api
wrangler tail --env production
```

Look for:
```
[Stripe] Webhook event: checkout.session.completed
[Stripe] ✓ Credited 10 credits to user xxx, new balance: 15
```

### 7.3 Verify Database
In Supabase SQL Editor:
```sql
-- Check recent purchases
SELECT
  u.email,
  ct.type,
  ct.amount,
  ct.total_after,
  ct.created_at
FROM credit_transactions ct
JOIN auth.users u ON ct.user_id = u.id
WHERE ct.type = 'purchase'
ORDER BY ct.created_at DESC
LIMIT 10;

-- Check webhook processing
SELECT
  stripe_session_id,
  credits_granted,
  status,
  processed_at
FROM stripe_webhooks
ORDER BY received_at DESC
LIMIT 10;
```

---

## ✅ Step 8: Monitoring & Health Checks

### 8.1 Set Up Monitoring Queries

**Daily health check:**
```sql
-- Users with negative credits (should be 0)
SELECT COUNT(*) as users_with_negative_credits
FROM user_credits
WHERE purchased_credits < 0 OR free_credits_remaining < 0;

-- Inconsistent totals (should be 0)
SELECT COUNT(*) as inconsistent_totals
FROM user_credits
WHERE total_credits != (purchased_credits + free_credits_remaining);

-- Failed webhooks (investigate if > 0)
SELECT COUNT(*) as failed_webhooks
FROM stripe_webhooks
WHERE status = 'failed';

-- Pending webhooks older than 1 hour (investigate if > 0)
SELECT COUNT(*) as stuck_webhooks
FROM stripe_webhooks
WHERE status = 'pending'
  AND received_at < NOW() - INTERVAL '1 hour';
```

### 8.2 Alert Thresholds
- ⚠️ Users with negative credits: **0** (investigate immediately)
- ⚠️ Inconsistent totals: **0** (investigate immediately)
- ⚠️ Failed webhooks: **< 5** per day (acceptable)
- ⚠️ Stuck webhooks: **0** (investigate after 1 hour)

---

## 🔧 Troubleshooting

### Issue: Balance shows 0 after signup
**Solution:**
```sql
-- Run initialize function
SELECT initialize_user_credits('USER_ID'::UUID);
```

### Issue: Credits not added after payment
**Symptoms:** Success page shows error, balance unchanged

**Check:**
1. Browser console for verification errors
2. API logs: `wrangler tail`
3. Stripe webhook logs
4. Supabase `stripe_webhooks` table

**Manual fix:**
```sql
-- Check if webhook was received
SELECT * FROM stripe_webhooks WHERE stripe_session_id = 'cs_xxx';

-- If not, manually process
SELECT process_stripe_payment(
  p_stripe_session_id := 'cs_xxx',
  p_stripe_price_id := 'price_xxx',
  p_user_id := 'user-id'::UUID,
  p_credits := 10,
  p_event_type := 'manual_fix',
  p_metadata := '{"source": "admin_fix"}'::JSONB
);
```

### Issue: Duplicate credit grants
**Check:**
```sql
SELECT
  stripe_session_id,
  COUNT(*) as grant_count
FROM credit_transactions
WHERE type = 'purchase'
GROUP BY stripe_session_id
HAVING COUNT(*) > 1;
```

**This should return 0 rows** (idempotency working)

### Issue: Analysis consumes credit but fails
**Check refund log:**
```sql
SELECT * FROM credit_transactions
WHERE type = 'refund'
ORDER BY created_at DESC
LIMIT 10;
```

**If no refund recorded, manually refund:**
```sql
SELECT refund_credit(
  p_user_id := 'user-id'::UUID,
  p_credit_type := 'paid', -- or 'free'
  p_reason := 'manual_admin_refund'
);
```

---

## 📊 Success Criteria

After deployment, verify:

- ✅ New users get 2 free credits automatically
- ✅ Balance displays correctly on login
- ✅ Analysis consumes 1 credit (free first, then paid)
- ✅ Failed analysis refunds credit automatically
- ✅ Payment adds credits immediately (< 5 seconds)
- ✅ Success page shows verification status
- ✅ Webhook processes payments correctly
- ✅ No duplicate credit grants (idempotency working)
- ✅ Transaction log complete for all operations
- ✅ No negative credit balances
- ✅ All totals consistent (purchased + free = total)

---

## 🎉 System Status

Once all steps complete:

```
Credit System Status: ✅ PRODUCTION READY

Components:
- Database Schema: ✅ Deployed
- RPC Functions: ✅ Active (6/6)
- API Endpoints: ✅ Running
  - /api/balance
  - /api/analyze (with credit consumption)
  - /api/verify-payment
  - /api/stripe-webhook
- Frontend: ✅ Deployed
- Monitoring: ✅ Set Up

Reliability Features:
- ✅ Atomic operations (race condition free)
- ✅ Idempotent payment processing
- ✅ Automatic refunds on failure
- ✅ Transaction audit trail
- ✅ Database constraints (no negative credits)
- ✅ Client-side payment verification
- ✅ Webhook fallback mechanism

Security:
- ✅ JWT authentication required
- ✅ Session ownership verification
- ✅ Stripe signature verification
- ✅ Rate limiting active
- ✅ SQL injection protected
```

---

**Next:** Test the complete flow and monitor for 24 hours to ensure stability.
