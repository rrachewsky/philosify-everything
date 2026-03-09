# Philosify Payment & Credit System
## Complete Technical Documentation

**Version:** 2.0
**Last Updated:** 2025-01-13
**Author:** Development Team

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Payment Flow](#payment-flow)
4. [Credit Pricing](#credit-pricing)
5. [Component Details](#component-details)
6. [Error Handling](#error-handling)
7. [Configuration](#configuration)
8. [Testing](#testing)

---

## System Overview

Philosify uses a credit-based payment system where users purchase credits to perform song analyses. The system integrates:

- **Frontend:** React (Vite) - User interface and state management
- **Backend:** Cloudflare Workers - API and business logic
- **Payment:** Stripe - Payment processing
- **Database:** Supabase (PostgreSQL) - Data persistence
- **Authentication:** Supabase Auth - User management

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│                      (React + Vite Frontend)                         │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ User clicks balance
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Header.jsx                                                          │
│  ┌──────────────┐                                                   │
│  │ User Profile │ ───> Shows: "10 credits • 2 free"                │
│  └──────────────┘                                                   │
│         │                                                            │
│         │ onClick                                                    │
│         ▼                                                            │
│  Opens PaymentModal                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PaymentModal.jsx                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Current Balance: 10 credits (2 free remaining)               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ 10 Credits  │  │ 20 Credits  │  │ 50 Credits  │                │
│  │   $6.00     │  │   $12.00    │  │   $30.00    │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│         │                 │                 │                        │
│         └─────────────────┴─────────────────┘                       │
│                           │                                          │
│                           │ onClick(amount)                          │
│                           ▼                                          │
│                  handlePurchase(6.00|12.00|30.00)                   │
│                           │                                          │
│                           │ Shows: "Redirecting to payment..."      │
│                           │ Disables buttons                         │
│                           ▼                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                            │ Calls purchaseCredits()
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  useCredits.js Hook                                                  │
│  - Manages credit balance state                                     │
│  - Handles purchase flow                                            │
│  - Fetches balance from API                                         │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ Calls Stripe service
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  stripe/checkout.js                                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 1. Maps amount to tier:                                      │  │
│  │    • $6.00  → tier "10"                                      │  │
│  │    • $12.00 → tier "20"                                      │  │
│  │    • $30.00 → tier "50"                                      │  │
│  │                                                               │  │
│  │ 2. Calls API endpoint:                                       │  │
│  │    POST /api/create-checkout                                 │  │
│  │    Headers: { Authorization: Bearer <JWT> }                  │  │
│  │    Body: { tier: "10"|"20"|"50" }                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Request
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE WORKER                               │
│                     (Backend API - Node.js)                          │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  /api/create-checkout endpoint (index.js:118-142)                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Step 1: Authenticate User                                    │  │
│  │   getUserFromAuth(request, env)                             │  │
│  │   → Validates JWT token                                      │  │
│  │   → Extracts userId from token                              │  │
│  │                                                               │  │
│  │ Step 2: Get Stripe Price ID                                  │  │
│  │   pickPriceIdFromRequest(env, body)                         │  │
│  │   → tier "10" → env.STRIPE_PRICE_ID_10                      │  │
│  │   → tier "20" → env.STRIPE_PRICE_ID_20                      │  │
│  │   → tier "50" → env.STRIPE_PRICE_ID_50                      │  │
│  │                                                               │  │
│  │ Step 3: Create Stripe Session                                │  │
│  │   createStripeCheckout(env, userId, priceId, urls)          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ Calls Stripe API
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  payments/stripe.js                                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ POST https://api.stripe.com/v1/checkout/sessions            │  │
│  │                                                               │  │
│  │ Form Data:                                                    │  │
│  │   mode: "payment"                                            │  │
│  │   line_items[0][price]: <price_id>                          │  │
│  │   line_items[0][quantity]: "1"                              │  │
│  │   success_url: "https://philosify.org/billing/success"      │  │
│  │   cancel_url: "https://philosify.org/billing/cancel"        │  │
│  │   client_reference_id: <userId>                             │  │
│  │   metadata[user_id]: <userId>                               │  │
│  │                                                               │  │
│  │ Response: { url, id }                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ Returns session URL
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Response to Frontend:                                               │
│  {                                                                   │
│    sessionUrl: "https://checkout.stripe.com/c/pay/cs_test_...",    │
│    sessionId: "cs_test_..."                                         │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ window.location.href = sessionUrl
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         STRIPE CHECKOUT                              │
│                    (External Payment Gateway)                        │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ User enters payment details
                            │ Card number, expiry, CVC
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Payment Processing                                                  │
│  - Stripe validates card                                            │
│  - Processes payment ($6.00/$12.00/$30.00)                          │
│  - Creates charge                                                    │
└─────────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
           Success                   Failure
                │                       │
                ▼                       ▼
    Redirect to success URL    Redirect to cancel URL
    Send webhook               No webhook sent
                │
                │ POST to /api/stripe-webhook
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  /api/stripe-webhook endpoint (index.js:145+)                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Step 1: Verify Webhook Signature                             │  │
│  │   verifyStripeWebhook(env, request)                         │  │
│  │   → HMAC SHA-256 verification                                │  │
│  │   → Uses STRIPE_WEBHOOK_SECRET                              │  │
│  │                                                               │  │
│  │ Step 2: Parse Event Data                                     │  │
│  │   event.type = "checkout.session.completed"                 │  │
│  │   userId = event.data.object.metadata.user_id               │  │
│  │   amountTotal = event.data.object.amount_total              │  │
│  │   sessionId = event.data.object.id                          │  │
│  │                                                               │  │
│  │ Step 3: Map Amount to Credits                                │  │
│  │   $6.00  → 10 credits                                        │  │
│  │   $12.00 → 20 credits                                        │  │
│  │   $30.00 → 50 credits                                        │  │
│  │                                                               │  │
│  │ Step 4: Update Supabase Database                             │  │
│  │   - Add credits to user account                              │  │
│  │   - Create transaction record                                │  │
│  │   - Update timestamp                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ Database UPDATE
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                            │
│                         (PostgreSQL)                                 │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Tables Updated:                                                     │
│                                                                      │
│  1. user_credits (or similar):                                      │
│     UPDATE user_credits                                             │
│     SET purchased_credits = purchased_credits + <amount>            │
│     WHERE user_id = <userId>                                        │
│                                                                      │
│  2. transactions (audit log):                                       │
│     INSERT INTO transactions VALUES (                               │
│       transaction_id: <uuid>,                                       │
│       user_id: <userId>,                                            │
│       amount_usd: <6.00|12.00|30.00>,                              │
│       credits_added: <10|20|50>,                                    │
│       stripe_session_id: <sessionId>,                              │
│       created_at: NOW()                                             │
│     )                                                                │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ User returns to success page
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend: Balance Refresh                                          │
│  - useCredits hook fetches new balance                             │
│  - GET /api/balance                                                 │
│  - Updates UI to show new total                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Payment Flow

### 1. User Initiates Purchase

**Location:** `site/src/components/payment/PaymentModal.jsx:69`

```javascript
onClick={() => !loading && handlePurchase(option.amount)}
```

**User Actions:**
- Clicks on credit tier box (10, 20, or 50 credits)
- Triggers purchase with amount ($6.00, $12.00, or $30.00)

### 2. Frontend Processing

**Location:** `site/src/components/payment/PaymentModal.jsx:20-32`

```javascript
const handlePurchase = async (amount) => {
  setError('');
  setLoading(true);

  try {
    await purchaseCredits(amount);
    // Redirects to Stripe, so won't execute after
  } catch (err) {
    console.error('[PaymentModal] Purchase error:', err);
    setError(err.message || t('payment.errorDefault'));
    setLoading(false);
  }
};
```

**States:**
- `loading`: Shows "Redirecting to payment..."
- `error`: Displays error message if purchase fails
- Buttons disabled during processing

### 3. Hook Processing

**Location:** `site/src/hooks/useCredits.js:44-63`

```javascript
const purchase = useCallback(async (amount) => {
  if (!user) {
    throw new Error('Must be logged in to purchase credits');
  }

  setLoading(true);
  setError(null);

  try {
    await purchaseCredits(amount);
    return { success: true };
  } catch (err) {
    console.error('[useCredits] Error purchasing credits:', err);
    setError(err.message);
    return { success: false, error: err.message };
  } finally {
    setLoading(false);
  }
}, [user]);
```

### 4. Stripe Checkout Service

**Location:** `site/src/services/stripe/checkout.js:10-54`

```javascript
export async function createCheckoutSession(amount) {
  const token = await getAccessToken();

  // Map amount to tier
  const packageInfo = CREDIT_PACKAGES.find(pkg => pkg.amount === amount);
  // { amount: 6.00, credits: 10, tier: '10' }

  const response = await fetch(`${config.apiUrl}/api/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ tier: packageInfo.tier }),
  });

  const data = await response.json();
  window.location.href = data.sessionUrl;
}
```

### 5. Backend API

**Location:** `api/index.js:118-142`

```javascript
if (url.pathname === '/api/create-checkout' && request.method === 'POST') {
  // Authenticate
  const user = await getUserFromAuth(request, env);

  // Get price ID from environment
  const body = await request.json();
  const priceId = pickPriceIdFromRequest(env, body);
  // tier "10" → env.STRIPE_PRICE_ID_10

  // Create Stripe session
  const session = await createStripeCheckout(
    env,
    user.userId,
    priceId,
    successUrl,
    cancelUrl
  );

  return jsonResponse({
    sessionUrl: session.url,
    sessionId: session.id
  });
}
```

### 6. Stripe API Call

**Location:** `api/src/payments/stripe.js:16-40`

```javascript
export async function createStripeCheckout(env, userId, priceId, successUrl, cancelUrl) {
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("success_url", successUrl);
  form.set("cancel_url", cancelUrl);
  form.set("client_reference_id", userId);
  form.set("metadata[user_id]", userId);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await env.STRIPE_SECRET_KEY.get()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  return res.json();
}
```

### 7. Webhook Processing

**Location:** `api/index.js:145+`

```javascript
if (url.pathname === '/api/stripe-webhook' && request.method === 'POST') {
  // Verify signature
  const event = await verifyStripeWebhook(env, request);

  if (event.type === 'checkout.session.completed') {
    const userId = event.data.object.metadata.user_id;
    const amountTotal = event.data.object.amount_total;

    // Map amount to credits
    const credits = amountTotal === 600 ? 10 :
                   amountTotal === 1200 ? 20 :
                   amountTotal === 3000 ? 50 : 0;

    // Update Supabase
    await updateUserCredits(userId, credits);
    await createTransaction(userId, amountTotal, credits);
  }

  return new Response('OK', { status: 200 });
}
```

---

## Credit Pricing

| Package | Credits | Price | Per Credit | Savings |
|---------|---------|-------|------------|---------|
| Small   | 10      | $6.00 | $0.60      | -       |
| Medium  | 20      | $12.00| $0.60      | -       |
| Large   | 50      | $30.00| $0.60      | -       |

**Free Credits:**
- New users: 2 free analyses
- Free credits used before purchased credits

---

## Component Details

### Frontend Components

#### PaymentModal.jsx
**Path:** `site/src/components/payment/PaymentModal.jsx`

**Props:**
- `isOpen` (boolean): Modal visibility
- `onClose` (function): Close handler

**State:**
- `loading` (boolean): Purchase in progress
- `error` (string): Error message to display

**Features:**
- Real-time balance display
- Three clickable credit tier options
- Loading indicator during redirect
- Error handling with user feedback
- Multilingual support (12 languages)

#### useCredits Hook
**Path:** `site/src/hooks/useCredits.js`

**Returns:**
```javascript
{
  balance: {
    userId: string,
    credits: number,      // Purchased credits
    freeRemaining: number,// Free credits left
    total: number         // credits + freeRemaining
  },
  loading: boolean,
  error: string | null,
  fetchBalance: () => Promise<void>,
  purchaseCredits: (amount: number) => Promise<void>,
  hasSufficientCredits: () => boolean,
  getBalanceInfo: () => Object
}
```

### Backend Components

#### Stripe Integration
**Path:** `api/src/payments/stripe.js`

**Functions:**
- `pickPriceIdFromRequest(env, body)`: Maps tier to price ID
- `createStripeCheckout(env, userId, priceId, urls)`: Creates session

#### Webhook Handler
**Path:** `api/index.js:145+`

**Events Handled:**
- `checkout.session.completed`: Payment successful
- `checkout.session.expired`: Session expired
- `charge.refunded`: Refund processed

---

## Error Handling

### Frontend Errors

#### Network Errors
**Symptom:** Can't reach API
**Message:** "Payment failed. Please try again."
**User Action:** Check internet connection, retry

#### Authentication Errors
**Symptom:** JWT expired/invalid
**Message:** "Not authenticated"
**User Action:** Re-login, retry purchase

#### Invalid Tier
**Symptom:** Wrong package selection
**Message:** "Invalid tier or priceId"
**User Action:** Refresh page, retry

### Backend Errors

#### Stripe API Errors
**Symptom:** External service issue
**Message:** "Stripe error 400: ..."
**Handling:** Log error, return 500 to frontend

#### Database Errors
**Symptom:** Supabase connection failed
**Message:** "Failed to update credits"
**Handling:** Log error, retry mechanism

### Error Flow Example

```
User clicks 10 credits box
  ↓
Frontend: setLoading(true)
  ↓
Call purchaseCredits(6.00)
  ↓
Network timeout (5 seconds)
  ↓
Catch error in PaymentModal
  ↓
setError("Payment failed. Please try again.")
setLoading(false)
  ↓
Red error message displayed
Buttons re-enabled
  ↓
User can retry
```

---

## Configuration

### Environment Variables

#### Frontend (.env.local)
```bash
VITE_API_URL=http://localhost:8787  # Local dev
# Production uses https://api.philosify.org
```

#### Backend (Cloudflare Secrets Store)

**Stripe Secrets:**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_10=price_...  # 10 credits @ $6.00
STRIPE_PRICE_ID_20=price_...  # 20 credits @ $12.00
STRIPE_PRICE_ID_50=price_...  # 50 credits @ $30.00
```

**Supabase Secrets:**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
```

**Other Secrets (16 total):**
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GROK_API_KEY`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `GENIUS_ACCESS_TOKEN`
- `ADMIN_SECRET`

### Stripe Product Setup

**Steps to configure:**
1. Create products in Stripe Dashboard
2. Set prices: $6.00, $12.00, $30.00
3. Copy price IDs (start with `price_`)
4. Add to Cloudflare Secrets Store
5. Deploy worker

---

## Testing

### Local Development

**Start both servers:**
```bash
# Terminal 1 - Frontend
cd site
npm run dev
# Runs on http://localhost:3000

# Terminal 2 - Backend
cd api
npm run dev
# Runs on http://localhost:8787
```

### Test Payment Flow

**Test Mode Setup:**
1. Use Stripe test keys (`sk_test_...`)
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date
4. Any 3-digit CVC

**Test Scenarios:**

1. **Successful Purchase:**
   - Click 10 credits box
   - Enter test card
   - Complete payment
   - Verify redirect to success URL
   - Check balance updated

2. **Failed Payment:**
   - Use declined card: `4000 0000 0000 0002`
   - Verify error message shown
   - Confirm no credits added

3. **Cancelled Payment:**
   - Click cancel on Stripe page
   - Verify redirect to cancel URL
   - Confirm no credits added

### Webhook Testing

**Using Stripe CLI:**
```bash
# Forward webhooks to local
stripe listen --forward-to http://localhost:8787/api/stripe-webhook

# Trigger test event
stripe trigger checkout.session.completed
```

**Verify:**
- Webhook received
- Signature validated
- Credits added to database
- Transaction logged

---

## Appendix

### Database Schema

```sql
-- User credits table
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  purchased_credits INTEGER DEFAULT 0,
  free_credits_remaining INTEGER DEFAULT 2,
  total_credits INTEGER GENERATED ALWAYS AS (purchased_credits + free_credits_remaining) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table (audit log)
CREATE TABLE transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount_usd DECIMAL(10, 2),
  credits_added INTEGER,
  stripe_session_id VARCHAR(255) UNIQUE,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/create-checkout` | Required | Create Stripe checkout session |
| POST | `/api/stripe-webhook` | Webhook | Process Stripe events |
| GET | `/api/balance` | Required | Get user credit balance |

### Constants Reference

**Path:** `site/src/utils/constants.js`

```javascript
export const CREDIT_PACKAGES = [
  { amount: 6.00, credits: 10, tier: '10' },
  { amount: 12.00, credits: 20, tier: '20' },
  { amount: 30.00, credits: 50, tier: '50' },
];

export const FREE_ANALYSES_COUNT = 2;
export const CREDIT_COST_PER_ANALYSIS = 0.60;
```

---

**End of Documentation**
