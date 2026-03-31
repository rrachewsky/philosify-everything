CREATE SCHEMA IF NOT EXISTS ads;

CREATE TABLE ads.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  user_id UUID UNIQUE,
  agency_name TEXT NOT NULL,
  contact_name TEXT,
  website TEXT,
  phone TEXT,
  country_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  vetting_score INTEGER,
  vetting_reason TEXT,
  vetted_at TIMESTAMPTZ,
  vetted_by TEXT,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  total_earned_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE ads.advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  user_id UUID UNIQUE,
  company_name TEXT NOT NULL,
  website TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  vetting_score INTEGER,
  vetting_reason TEXT,
  vetted_at TIMESTAMPTZ,
  vetted_by TEXT,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  agency_id UUID REFERENCES ads.agencies(id) ON DELETE SET NULL,
  agency_commission_pct NUMERIC(5,2) DEFAULT 15.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE ads.ad_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES ads.advertisers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  placement TEXT NOT NULL,
  duration INTEGER NOT NULL,
  impressions_ordered INTEGER NOT NULL DEFAULT 1000,
  impressions_delivered INTEGER NOT NULL DEFAULT 0,
  target_url TEXT NOT NULL,
  creative_type TEXT NOT NULL DEFAULT 'self',
  creative_url TEXT,
  creative_status TEXT NOT NULL DEFAULT 'pending',
  creative_brief TEXT,
  schedule_type TEXT NOT NULL DEFAULT 'asap',
  start_date DATE,
  end_date DATE,
  time_windows JSONB DEFAULT '[]',
  targeting JSONB DEFAULT '{}',
  cpm_cents INTEGER NOT NULL DEFAULT 1000,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ads.ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID,
  order_id UUID REFERENCES ads.ad_orders(id),
  user_id UUID,
  placement TEXT NOT NULL,
  duration INTEGER NOT NULL,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  clicked BOOLEAN NOT NULL DEFAULT FALSE,
  clicked_at TIMESTAMPTZ,
  token_nonce TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ads.advertiser_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES ads.advertisers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  balance_after_cents INTEGER NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ads.agency_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES ads.agencies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  balance_after_cents INTEGER NOT NULL,
  description TEXT,
  order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ads.inventory_forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL,
  placement TEXT NOT NULL,
  estimated_impressions INTEGER NOT NULL DEFAULT 5000,
  reserved_impressions INTEGER NOT NULL DEFAULT 0,
  actual_impressions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(forecast_date, placement)
);

CREATE TABLE ads.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_type TEXT NOT NULL,
  placement TEXT,
  duration INTEGER,
  price_cents INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_impressions_token_nonce ON ads.ad_impressions(token_nonce) WHERE token_nonce IS NOT NULL;

INSERT INTO ads.pricing_config (pricing_type, placement, duration, price_cents) VALUES
  ('cpm', 'sidebar', 5, 1000),
  ('cpm', 'sidebar', 10, 2000),
  ('cpm', 'sidebar', 15, 3000),
  ('cpm', 'sidebar', 20, 4000),
  ('cpm', 'constellation', 5, 800);

GRANT USAGE ON SCHEMA ads TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ads TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ads TO service_role;
