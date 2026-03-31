-- ============================================================
-- Migration: Ads Platform Schema
-- ============================================================
-- Self-service advertising platform for Philosify
-- Advertisers are SEPARATE from Philosify users
-- ============================================================

-- Create ads schema
CREATE SCHEMA IF NOT EXISTS ads;

-- ============================================================
-- ADVERTISERS TABLE
-- ============================================================
-- Separate auth from Philosify users - email/password based
CREATE TABLE ads.advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- bcrypt hash
  company_name TEXT NOT NULL,
  website TEXT,
  contact_email TEXT,
  
  -- Account status: pending (needs vetting), approved, rejected, suspended
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  
  -- AI vetting score (0-100). >=80 auto-approves, <80 queued for owner veto
  vetting_score INTEGER,
  vetting_reason TEXT,
  vetted_at TIMESTAMPTZ,
  vetted_by TEXT,  -- 'ai' or owner email
  
  -- Balance in cents (prepaid model)
  balance_cents INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_advertisers_email ON ads.advertisers(email);
CREATE INDEX idx_advertisers_status ON ads.advertisers(status);

-- ============================================================
-- AD CAMPAIGNS TABLE
-- ============================================================
CREATE TABLE ads.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES ads.advertisers(id) ON DELETE CASCADE,
  
  -- Campaign details
  name TEXT NOT NULL,
  placement TEXT NOT NULL CHECK (placement IN ('sidebar', 'constellation')),
  duration INTEGER NOT NULL CHECK (duration IN (5, 10, 15, 20)),  -- seconds
  target_url TEXT NOT NULL,
  creative_url TEXT NOT NULL,  -- R2 URL
  
  -- Budget and spending (in cents)
  budget_cents INTEGER NOT NULL CHECK (budget_cents >= 1000),  -- min $10
  spent_cents INTEGER NOT NULL DEFAULT 0,
  
  -- CPM rate at time of creation (in cents, per 1000 impressions)
  cpm_cents INTEGER NOT NULL,
  
  -- Status: pending (awaiting approval), active, paused, exhausted, rejected
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'exhausted', 'rejected')),
  
  -- Stats
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  
  -- FIFO ordering - earlier created = higher priority
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ
);

CREATE INDEX idx_campaigns_advertiser ON ads.ad_campaigns(advertiser_id);
CREATE INDEX idx_campaigns_status ON ads.ad_campaigns(status);
CREATE INDEX idx_campaigns_placement ON ads.ad_campaigns(placement);
-- FIFO serving: active campaigns ordered by creation time
CREATE INDEX idx_campaigns_fifo ON ads.ad_campaigns(placement, status, created_at) 
  WHERE status = 'active';

-- ============================================================
-- AD IMPRESSIONS TABLE
-- ============================================================
-- Tracks each impression for billing and analytics
CREATE TABLE ads.ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ads.ad_campaigns(id) ON DELETE CASCADE,
  
  -- User who saw the ad (NULL if anonymous, but we only show to logged-in non-premium)
  user_id UUID,  -- References auth.users but no FK to keep ads schema independent
  
  -- Impression details
  placement TEXT NOT NULL,
  duration INTEGER NOT NULL,
  
  -- Cost charged for this impression (in cents, = cpm_cents / 1000)
  cost_cents INTEGER NOT NULL,
  
  -- Click tracking
  clicked BOOLEAN NOT NULL DEFAULT FALSE,
  clicked_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_impressions_campaign ON ads.ad_impressions(campaign_id);
CREATE INDEX idx_impressions_created ON ads.ad_impressions(created_at);
CREATE INDEX idx_impressions_user ON ads.ad_impressions(user_id) WHERE user_id IS NOT NULL;

-- ============================================================
-- ADVERTISER TRANSACTIONS TABLE
-- ============================================================
-- Payment history and balance changes
CREATE TABLE ads.advertiser_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES ads.advertisers(id) ON DELETE CASCADE,
  
  -- Transaction type
  type TEXT NOT NULL CHECK (type IN ('deposit', 'campaign_spend', 'refund', 'adjustment')),
  
  -- Amount in cents (positive for deposits, negative for spending)
  amount_cents INTEGER NOT NULL,
  
  -- Running balance after transaction
  balance_after_cents INTEGER NOT NULL,
  
  -- Description/reference
  description TEXT,
  
  -- Stripe reference for deposits
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  
  -- Campaign reference for spending
  campaign_id UUID REFERENCES ads.ad_campaigns(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_advertiser ON ads.advertiser_transactions(advertiser_id);
CREATE INDEX idx_transactions_created ON ads.advertiser_transactions(created_at);
CREATE INDEX idx_transactions_stripe ON ads.advertiser_transactions(stripe_payment_intent_id) 
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================================
-- ADVERTISER SESSIONS TABLE
-- ============================================================
-- JWT session tokens (separate from Supabase auth)
CREATE TABLE ads.advertiser_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES ads.advertisers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,  -- SHA-256 hash of the JWT
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

CREATE INDEX idx_sessions_advertiser ON ads.advertiser_sessions(advertiser_id);
CREATE INDEX idx_sessions_token ON ads.advertiser_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON ads.advertiser_sessions(expires_at);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get next ad to serve (FIFO within placement)
CREATE OR REPLACE FUNCTION ads.get_next_ad(p_placement TEXT)
RETURNS TABLE (
  campaign_id UUID,
  advertiser_id UUID,
  creative_url TEXT,
  target_url TEXT,
  duration INTEGER,
  cpm_cents INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.advertiser_id,
    c.creative_url,
    c.target_url,
    c.duration,
    c.cpm_cents
  FROM ads.ad_campaigns c
  JOIN ads.advertisers a ON a.id = c.advertiser_id
  WHERE c.placement = p_placement
    AND c.status = 'active'
    AND a.status = 'approved'
    AND c.spent_cents < c.budget_cents
    AND a.balance_cents > 0
  ORDER BY c.created_at ASC  -- FIFO
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Record impression and charge
CREATE OR REPLACE FUNCTION ads.record_impression(
  p_campaign_id UUID,
  p_user_id UUID,
  p_placement TEXT,
  p_duration INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_campaign RECORD;
  v_cost_cents INTEGER;
  v_impression_id UUID;
BEGIN
  -- Get campaign details
  SELECT c.*, a.balance_cents as advertiser_balance
  INTO v_campaign
  FROM ads.ad_campaigns c
  JOIN ads.advertisers a ON a.id = c.advertiser_id
  WHERE c.id = p_campaign_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;
  
  -- Calculate cost (CPM / 1000)
  v_cost_cents := CEIL(v_campaign.cpm_cents::NUMERIC / 1000);
  
  -- Check if advertiser has balance
  IF v_campaign.advertiser_balance < v_cost_cents THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Check if campaign has budget
  IF v_campaign.spent_cents + v_cost_cents > v_campaign.budget_cents THEN
    -- Mark campaign as exhausted
    UPDATE ads.ad_campaigns SET status = 'exhausted', updated_at = NOW()
    WHERE id = p_campaign_id;
    RAISE EXCEPTION 'Campaign budget exhausted';
  END IF;
  
  -- Create impression record
  INSERT INTO ads.ad_impressions (campaign_id, user_id, placement, duration, cost_cents)
  VALUES (p_campaign_id, p_user_id, p_placement, p_duration, v_cost_cents)
  RETURNING id INTO v_impression_id;
  
  -- Update campaign stats
  UPDATE ads.ad_campaigns
  SET impressions = impressions + 1,
      spent_cents = spent_cents + v_cost_cents,
      updated_at = NOW()
  WHERE id = p_campaign_id;
  
  -- Deduct from advertiser balance
  UPDATE ads.advertisers
  SET balance_cents = balance_cents - v_cost_cents,
      updated_at = NOW()
  WHERE id = v_campaign.advertiser_id;
  
  -- Record transaction
  INSERT INTO ads.advertiser_transactions (
    advertiser_id, type, amount_cents, balance_after_cents, description, campaign_id
  )
  SELECT 
    v_campaign.advertiser_id,
    'campaign_spend',
    -v_cost_cents,
    balance_cents,
    'Impression: ' || v_campaign.name,
    p_campaign_id
  FROM ads.advertisers
  WHERE id = v_campaign.advertiser_id;
  
  RETURN v_impression_id;
END;
$$ LANGUAGE plpgsql;

-- Record click on impression
CREATE OR REPLACE FUNCTION ads.record_click(p_impression_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE ads.ad_impressions
  SET clicked = TRUE, clicked_at = NOW()
  WHERE id = p_impression_id AND NOT clicked;
  
  IF FOUND THEN
    -- Update campaign click count
    UPDATE ads.ad_campaigns c
    SET clicks = clicks + 1, updated_at = NOW()
    FROM ads.ad_impressions i
    WHERE i.id = p_impression_id AND c.id = i.campaign_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Add funds to advertiser balance
CREATE OR REPLACE FUNCTION ads.add_funds(
  p_advertiser_id UUID,
  p_amount_cents INTEGER,
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_stripe_checkout_session_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update balance
  UPDATE ads.advertisers
  SET balance_cents = balance_cents + p_amount_cents,
      updated_at = NOW()
  WHERE id = p_advertiser_id
  RETURNING balance_cents INTO v_new_balance;
  
  -- Record transaction
  INSERT INTO ads.advertiser_transactions (
    advertiser_id, type, amount_cents, balance_after_cents, 
    description, stripe_payment_intent_id, stripe_checkout_session_id
  )
  VALUES (
    p_advertiser_id, 'deposit', p_amount_cents, v_new_balance,
    'Funds added via Stripe', p_stripe_payment_intent_id, p_stripe_checkout_session_id
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CPM PRICING TABLE (for reference/flexibility)
-- ============================================================
CREATE TABLE ads.cpm_pricing (
  placement TEXT NOT NULL,
  duration INTEGER NOT NULL,
  cpm_cents INTEGER NOT NULL,
  PRIMARY KEY (placement, duration)
);

-- Insert current pricing
INSERT INTO ads.cpm_pricing (placement, duration, cpm_cents) VALUES
  ('sidebar', 5, 1000),   -- $10 CPM
  ('sidebar', 10, 2000),  -- $20 CPM
  ('sidebar', 15, 3000),  -- $30 CPM
  ('sidebar', 20, 4000),  -- $40 CPM
  ('constellation', 5, 800);  -- $8 CPM

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
-- Service role has full access (API uses service key)
GRANT USAGE ON SCHEMA ads TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ads TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ads TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ads TO service_role;
