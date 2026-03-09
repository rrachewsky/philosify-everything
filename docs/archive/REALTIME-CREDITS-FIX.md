# Real-Time Credit Addition Fix

## Problem

After purchasing credits through Stripe, credits were **not added immediately** to the user's account. Users had to manually run scripts or wait indefinitely for credits to appear.

### Root Cause

1. **Local Development**: Stripe webhooks cannot reach `localhost:8787`, so the webhook handler never executes
2. **Production**: Even in production, webhook delivery can be delayed (seconds to minutes)
3. **No Fallback**: The success page only fetched balance but didn't trigger credit addition

## Solution

Added a **client-side payment verification endpoint** that the success page calls immediately when the user returns from Stripe.

### How It Works

```
User completes payment on Stripe
  ↓
Stripe redirects to: /payment/success?credits=10&session_id=cs_xxx
  ↓
PaymentSuccess page loads
  ↓
Calls: POST /api/verify-payment { sessionId: "cs_xxx" }
  ↓
Backend:
  1. Retrieves session from Stripe API
  2. Verifies payment status = "paid"
  3. Verifies session belongs to authenticated user
  4. Calls process_stripe_payment RPC (idempotent)
  5. Credits added to database
  ↓
Success page fetches updated balance
  ↓
User sees credits immediately
```

### Key Features

✅ **Idempotent** - Safe to call multiple times (uses same RPC as webhook)
✅ **Secure** - Verifies session belongs to authenticated user
✅ **Fast** - Happens immediately when user returns from Stripe
✅ **Compatible** - Works for both local dev and production
✅ **Webhook-friendly** - If webhook fires first, verification returns "already processed"

## Files Changed

### Backend (api/)

1. **`api/index.js`** - Added `/api/verify-payment` endpoint
   - Lines 201-320: New manual verification endpoint
   - Line 189: Updated success URL to include `session_id` parameter
   - Line 222: Stripe session retrieval with line_items expanded

### Frontend (site/)

1. **`site/src/services/api/payment.js`** - New payment verification service
   - `verifyPayment(sessionId)` function

2. **`site/src/services/api/index.js`** - Export payment service
   - Added `export * from './payment.js'`

3. **`site/src/pages/PaymentSuccess.jsx`** - Updated success page
   - Lines 23-67: Automatic payment verification on mount
   - Lines 113-149: UI shows verification status

## Testing

### Local Development Test

1. Start API: `cd api && npm run dev`
2. Start frontend: `cd site && npm run dev`
3. Login and purchase credits
4. After Stripe redirect, success page should:
   - Show "Verifying payment..." spinner
   - Call `/api/verify-payment` automatically
   - Credits added to database
   - Show updated balance immediately

### Production Test

Same flow as local dev, but webhook will also fire:
- If verification happens first: credits added, webhook returns "already processed"
- If webhook happens first: credits added, verification returns "already processed"
- Either way: user gets credits immediately

## API Endpoint Details

### POST `/api/verify-payment`

**Request:**
```json
{
  "sessionId": "cs_test_abc123xyz789"
}
```

**Response (Success):**
```json
{
  "success": true,
  "alreadyProcessed": false,
  "credits": 10,
  "newBalance": 15
}
```

**Response (Already Processed):**
```json
{
  "success": true,
  "alreadyProcessed": true,
  "credits": 10,
  "newBalance": 15
}
```

**Security:**
- Requires authentication (JWT token)
- Verifies session belongs to authenticated user
- Only processes if payment_status = "paid"
- Uses same idempotent RPC as webhook

## Database Operations

Both webhook and manual verification use the same RPC function:

```sql
SELECT process_stripe_payment(
  p_stripe_session_id := 'cs_test_abc123xyz789',
  p_stripe_price_id := 'price_xxx',
  p_user_id := 'user-uuid',
  p_credits := 10,
  p_event_type := 'manual_verification', -- or 'checkout.session.completed'
  p_metadata := '{"tier": "10", "verified_by": "client"}'::JSONB
);
```

**Idempotency Check:**
- RPC checks `stripe_webhooks` table for existing `stripe_session_id`
- If exists and status='completed': returns early with `already_processed=true`
- If new: inserts webhook record with status='processing', adds credits, updates to 'completed'

## Console Logs

### Success Flow
```
[PaymentSuccess] Verifying payment session: cs_test_abc123xyz789
[Stripe] Manual verification for session: cs_test_abc123xyz789
[Stripe] ✓ Manually credited 10 credits to user uuid-456, new balance: 15
[PaymentSuccess] Payment verified successfully: {credits: 10, newBalance: 15, alreadyProcessed: false}
[Balance] Fetched: {credits: 5, free: 0, total: 15}
```

### Already Processed Flow
```
[PaymentSuccess] Verifying payment session: cs_test_abc123xyz789
[Stripe] Manual verification for session: cs_test_abc123xyz789
[Stripe] Session cs_test_abc123xyz789 already processed
[PaymentSuccess] Payment verified successfully: {credits: 10, newBalance: 15, alreadyProcessed: true}
[Balance] Fetched: {credits: 5, free: 0, total: 15}
```

## Benefits

1. **Immediate Feedback** - Users see credits appear instantly
2. **No Manual Scripts** - No need to run `add-10-credits.js` anymore
3. **Development-Friendly** - Works in local dev without webhook tunneling
4. **Production-Ready** - Handles webhook race conditions gracefully
5. **User Experience** - Success page shows verification status with spinner

## Migration Notes

- **No database changes required** - Uses existing RPC functions
- **No env variables needed** - Uses existing Stripe configuration
- **Backward compatible** - Webhook handler unchanged, still works
- **Safe to deploy** - Idempotency ensures no duplicate credits

## Related Files

- Database schema: `supabase_credits_schema_fixed.sql` (lines 229-382: `process_stripe_payment` RPC)
- Webhook handler: `api/index.js` (lines 322-400)
- Payment audit: `MONETIZATION-AUDIT.md`
- Effects guide: `MONETIZATION-EFFECTS-GUIDE.md`

---

**Status:** ✅ FIXED
**Date:** 2025-11-15
**Issue:** Credits not added immediately after Stripe payment
**Solution:** Client-side payment verification endpoint
