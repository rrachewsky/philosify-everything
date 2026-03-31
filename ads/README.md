# Philosify Ads Platform

Self-service advertising platform for Philosify.org

## Architecture

- **Frontend**: React + Vite, deployed to Cloudflare Pages (`ads.philosify.org`)
- **Backend**: Shared with main Philosify API (`api.philosify.org/api/ads/*`)
- **Database**: Supabase (separate `ads` schema)
- **Storage**: Cloudflare R2 (`/ads/` folder for creatives)
- **Payments**: Stripe (same account as main Philosify)

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5174)
npm run dev

# Make sure the API is running locally
cd ../api && npm run dev
```

## Deployment

### First-time Setup

1. **Create Cloudflare Pages Project**
   ```bash
   npx wrangler pages project create philosify-ads
   ```

2. **Set up custom domain**
   - Go to Cloudflare Dashboard → Pages → philosify-ads → Custom domains
   - Add `ads.philosify.org`

3. **Run database migration**
   - Execute `api/migrations/004_ads_platform.sql` in Supabase SQL Editor
   - **IMPORTANT**: Expose the `ads` schema in API settings:
     - Go to Supabase Dashboard → Settings → API → "Exposed schemas"
     - Add `ads` to the list (comma-separated: `public, ads`)

4. **Add secrets to Cloudflare Secrets Store**
   - `ADS_JWT_SECRET`: Generate with `openssl rand -hex 32`
   - `STRIPE_ADS_WEBHOOK_SECRET`: Create webhook at https://dashboard.stripe.com/webhooks

5. **Create Stripe webhook**
   - URL: `https://api.philosify.org/api/ads/billing/webhook`
   - Events: `checkout.session.completed`
   - Copy webhook secret to `STRIPE_ADS_WEBHOOK_SECRET`

### Deploy

```bash
# Build and deploy to Cloudflare Pages
npm run deploy

# Or manually
npm run build
npx wrangler pages deploy dist --project-name=philosify-ads
```

### Deploy API (if handlers changed)

```bash
cd ../api
npm run deploy:prod
```

## API Endpoints

### Public
- `POST /api/ads/auth/signup` - Register advertiser
- `POST /api/ads/auth/login` - Login
- `POST /api/ads/auth/logout` - Logout
- `GET /api/ads/auth/me` - Get current advertiser

### Authenticated (Advertisers)
- `GET /api/ads/campaigns` - List campaigns
- `POST /api/ads/campaigns` - Create campaign
- `GET /api/ads/campaigns/:id` - Get campaign
- `PUT /api/ads/campaigns/:id` - Update campaign
- `DELETE /api/ads/campaigns/:id` - Delete campaign
- `GET /api/ads/billing/balance` - Get balance
- `GET /api/ads/billing/transactions` - Transaction history
- `POST /api/ads/billing/checkout` - Create Stripe checkout
- `PUT /api/ads/account/profile` - Update profile
- `PUT /api/ads/account/password` - Change password
- `DELETE /api/ads/account` - Delete account
- `GET /api/ads/stats/overview` - Dashboard stats
- `POST /api/ads/creatives/upload` - Upload creative

### Ad Serving (Philosify Frontend)
- `GET /api/ads/serve?placement=sidebar` - Get ad to display
- `POST /api/ads/impression` - Record impression
- `POST /api/ads/click` - Record click

### Admin (X-Admin-Secret required)
- `GET /api/ads/admin/pending` - Pending advertisers
- `POST /api/ads/admin/approve/:id` - Approve advertiser
- `POST /api/ads/admin/reject/:id` - Reject advertiser
- `POST /api/ads/admin/suspend/:id` - Suspend advertiser
- `GET /api/ads/admin/stats` - Platform stats

## Pricing

| Placement | Duration | CPM |
|-----------|----------|-----|
| Sidebar | 5s | $10 |
| Sidebar | 10s | $20 |
| Sidebar | 15s | $30 |
| Sidebar | 20s | $40 |
| Constellation | 5s | $8 |

## Ad Serving Logic

- **FIFO**: First campaign created gets served first
- **Premium users**: Do not see ads
- **Budget**: Campaigns pause when budget exhausted
- **Balance**: Advertisers must have positive balance
