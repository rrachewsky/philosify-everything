-- ============================================================
-- Migration: Ads Platform - Agency Support
-- ============================================================
-- Agencies can manage advertiser accounts and earn commission
-- on ad spend. Commission is auto-credited when impressions 
-- are charged (transparent to advertiser).
-- ============================================================

-- ============================================================
-- AGENCIES TABLE
-- ============================================================
CREATE TABLE ads.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- Agency details
  agency_name TEXT NOT NULL,
  contact_name TEXT,
  website TEXT,
  phone TEXT,
  
  -- Country (affects commission legality)
  country_code TEXT,  -- ISO 3166-1 alpha-2 (e.g., 'US', 'BR', 'GB')
  
  -- Account status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  
  -- Vetting (same as advertisers)
  vetting_score INTEGER,
  vetting_reason TEXT,
  vetted_at TIMESTAMPTZ,
  vetted_by TEXT,
  
  -- Commission balance (earned from client ad spend, in cents)
  balance_cents INTEGER NOT NULL DEFAULT 0,
  
  -- Total earned (lifetime)
  total_earned_cents INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_agencies_email ON ads.agencies(email);
CREATE INDEX idx_agencies_status ON ads.agencies(status);

-- ============================================================
-- AGENCY SESSIONS TABLE
-- ============================================================
CREATE TABLE ads.agency_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES ads.agencies(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

CREATE INDEX idx_agency_sessions_agency ON ads.agency_sessions(agency_id);
CREATE INDEX idx_agency_sessions_token ON ads.agency_sessions(token_hash);

-- ============================================================
-- LINK ADVERTISERS TO AGENCIES
-- ============================================================
-- Add agency relationship to advertisers table
ALTER TABLE ads.advertisers 
  ADD COLUMN agency_id UUID REFERENCES ads.agencies(id) ON DELETE SET NULL,
  ADD COLUMN agency_commission_pct NUMERIC(5,2) DEFAULT 15.00 CHECK (agency_commission_pct >= 0 AND agency_commission_pct <= 50);

-- Note: agency_commission_pct is the percentage of ad spend credited to agency
-- e.g., 15.00 means agency gets 15% of what advertiser spends
-- This comes from Philosify's revenue, NOT extra charge to advertiser

CREATE INDEX idx_advertisers_agency ON ads.advertisers(agency_id) WHERE agency_id IS NOT NULL;

-- ============================================================
-- AGENCY TRANSACTIONS TABLE
-- ============================================================
-- Track agency earnings and payouts
CREATE TABLE ads.agency_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES ads.agencies(id) ON DELETE CASCADE,
  
  -- Transaction type
  type TEXT NOT NULL CHECK (type IN ('commission', 'payout', 'adjustment')),
  
  -- Amount in cents (positive for commission, negative for payout)
  amount_cents INTEGER NOT NULL,
  
  -- Running balance after transaction
  balance_after_cents INTEGER NOT NULL,
  
  -- Reference to source
  advertiser_id UUID REFERENCES ads.advertisers(id),  -- For commission
  campaign_id UUID REFERENCES ads.ad_campaigns(id),    -- For commission
  impression_id UUID,  -- For commission (no FK to avoid perf issues)
  
  -- Payout details
  payout_method TEXT,  -- 'bank_transfer', 'paypal', etc.
  payout_reference TEXT,  -- External transaction ID
  
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agency_transactions_agency ON ads.agency_transactions(agency_id);
CREATE INDEX idx_agency_transactions_created ON ads.agency_transactions(created_at);
CREATE INDEX idx_agency_transactions_type ON ads.agency_transactions(type);

-- ============================================================
-- UPDATE IMPRESSION RECORDING TO CREDIT AGENCY
-- ============================================================
-- Modify the record_impression function to also credit agency
CREATE OR REPLACE FUNCTION ads.record_impression(
  p_campaign_id UUID,
  p_user_id UUID,
  p_placement TEXT,
  p_duration INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_campaign RECORD;
  v_advertiser RECORD;
  v_cost_cents INTEGER;
  v_commission_cents INTEGER;
  v_impression_id UUID;
BEGIN
  -- Get campaign details
  SELECT c.*, a.balance_cents as advertiser_balance, a.agency_id, a.agency_commission_pct
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
  
  -- Record advertiser transaction
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
  
  -- Credit agency commission if advertiser has agency
  IF v_campaign.agency_id IS NOT NULL AND v_campaign.agency_commission_pct > 0 THEN
    v_commission_cents := CEIL(v_cost_cents * v_campaign.agency_commission_pct / 100);
    
    IF v_commission_cents > 0 THEN
      -- Update agency balance
      UPDATE ads.agencies
      SET balance_cents = balance_cents + v_commission_cents,
          total_earned_cents = total_earned_cents + v_commission_cents,
          updated_at = NOW()
      WHERE id = v_campaign.agency_id;
      
      -- Record agency transaction
      INSERT INTO ads.agency_transactions (
        agency_id, type, amount_cents, balance_after_cents,
        advertiser_id, campaign_id, impression_id, description
      )
      SELECT 
        v_campaign.agency_id,
        'commission',
        v_commission_cents,
        balance_cents,
        v_campaign.advertiser_id,
        p_campaign_id,
        v_impression_id,
        'Commission: ' || v_campaign.agency_commission_pct || '% of ' || v_campaign.name
      FROM ads.agencies
      WHERE id = v_campaign.agency_id;
    END IF;
  END IF;
  
  RETURN v_impression_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- AGENCY PAYOUT FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION ads.request_agency_payout(
  p_agency_id UUID,
  p_amount_cents INTEGER,
  p_payout_method TEXT,
  p_payout_reference TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_agency RECORD;
  v_transaction_id UUID;
BEGIN
  -- Get agency with lock
  SELECT * INTO v_agency
  FROM ads.agencies
  WHERE id = p_agency_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agency not found';
  END IF;
  
  IF v_agency.balance_cents < p_amount_cents THEN
    RAISE EXCEPTION 'Insufficient balance for payout';
  END IF;
  
  IF p_amount_cents < 1000 THEN  -- Minimum $10 payout
    RAISE EXCEPTION 'Minimum payout is $10';
  END IF;
  
  -- Deduct from balance
  UPDATE ads.agencies
  SET balance_cents = balance_cents - p_amount_cents,
      updated_at = NOW()
  WHERE id = p_agency_id;
  
  -- Record transaction
  INSERT INTO ads.agency_transactions (
    agency_id, type, amount_cents, balance_after_cents,
    payout_method, payout_reference, description
  )
  SELECT 
    p_agency_id,
    'payout',
    -p_amount_cents,
    balance_cents,
    p_payout_method,
    p_payout_reference,
    'Payout via ' || p_payout_method
  FROM ads.agencies
  WHERE id = p_agency_id
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
GRANT ALL ON ads.agencies TO service_role;
GRANT ALL ON ads.agency_sessions TO service_role;
GRANT ALL ON ads.agency_transactions TO service_role;
