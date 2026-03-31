-- ============================================================
-- Migration: Ads Inventory System
-- ============================================================
-- Full inventory management with reservations, scheduling,
-- and creative services
-- ============================================================

-- ============================================================
-- INVENTORY FORECAST TABLE
-- ============================================================
-- Estimated daily impressions available per placement
-- Updated periodically based on traffic patterns
CREATE TABLE ads.inventory_forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Date and placement
  forecast_date DATE NOT NULL,
  placement TEXT NOT NULL CHECK (placement IN ('sidebar', 'constellation')),
  
  -- Estimated impressions for this day/placement
  estimated_impressions INTEGER NOT NULL DEFAULT 0,
  
  -- Already reserved impressions
  reserved_impressions INTEGER NOT NULL DEFAULT 0,
  
  -- Available = estimated - reserved
  -- (computed, but stored for quick queries)
  available_impressions INTEGER GENERATED ALWAYS AS 
    (GREATEST(0, estimated_impressions - reserved_impressions)) STORED,
  
  -- Actual impressions delivered (updated daily)
  actual_impressions INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(forecast_date, placement)
);

CREATE INDEX idx_inventory_date ON ads.inventory_forecast(forecast_date);
CREATE INDEX idx_inventory_placement ON ads.inventory_forecast(placement);
CREATE INDEX idx_inventory_available ON ads.inventory_forecast(forecast_date, placement, available_impressions);

-- ============================================================
-- AD ORDERS TABLE
-- ============================================================
-- An order is a purchase of a block of impressions
CREATE TABLE ads.ad_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES ads.advertisers(id) ON DELETE CASCADE,
  
  -- Order details
  name TEXT NOT NULL,
  placement TEXT NOT NULL CHECK (placement IN ('sidebar', 'constellation')),
  duration INTEGER NOT NULL CHECK (duration IN (5, 10, 15, 20)),
  
  -- Quantity ordered
  impressions_ordered INTEGER NOT NULL CHECK (impressions_ordered >= 1000),
  impressions_delivered INTEGER NOT NULL DEFAULT 0,
  
  -- Target URL for clicks
  target_url TEXT NOT NULL,
  
  -- Creative options
  creative_type TEXT NOT NULL CHECK (creative_type IN ('self', 'philosify')),
  creative_url TEXT,  -- Set when creative is ready
  creative_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (creative_status IN ('pending', 'in_progress', 'ready', 'rejected')),
  
  -- Creative request details (for Philosify-created ads)
  creative_brief TEXT,  -- What advertiser wants
  creative_assets_url TEXT,  -- Uploaded brand assets (logo, etc.)
  creative_fee_cents INTEGER DEFAULT 0,  -- Fee for creative services
  
  -- Scheduling
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('asap', 'scheduled')),
  start_date DATE,  -- NULL for ASAP
  end_date DATE,    -- NULL for ASAP (runs until delivered)
  
  -- Time targeting (for scheduled orders)
  -- Stored as JSON array of time windows, e.g., [{"day": "monday", "start": "09:00", "end": "17:00"}]
  time_windows JSONB DEFAULT '[]'::jsonb,
  
  -- Pricing
  cpm_cents INTEGER NOT NULL,  -- CPM at time of order
  subtotal_cents INTEGER NOT NULL,  -- impressions * cpm / 1000
  creative_fee_total_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,  -- subtotal + creative fee
  
  -- Order status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Not yet paid
    'pending_creative', -- Paid, waiting for creative
    'pending_approval', -- Creative ready, awaiting review
    'approved',        -- Approved, waiting to start
    'active',          -- Currently running
    'paused',          -- Manually paused
    'completed',       -- All impressions delivered
    'cancelled',       -- Cancelled (refund issued)
    'rejected'         -- Rejected by admin
  )),
  
  -- Payment
  paid_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  
  -- Admin review
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_advertiser ON ads.ad_orders(advertiser_id);
CREATE INDEX idx_orders_status ON ads.ad_orders(status);
CREATE INDEX idx_orders_dates ON ads.ad_orders(start_date, end_date);
CREATE INDEX idx_orders_active ON ads.ad_orders(placement, status) WHERE status = 'active';

-- ============================================================
-- ORDER INVENTORY RESERVATIONS
-- ============================================================
-- Links orders to specific inventory dates
CREATE TABLE ads.order_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES ads.ad_orders(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES ads.inventory_forecast(id) ON DELETE CASCADE,
  
  -- Impressions reserved for this specific day
  reserved_impressions INTEGER NOT NULL,
  delivered_impressions INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(order_id, inventory_id)
);

CREATE INDEX idx_reservations_order ON ads.order_reservations(order_id);
CREATE INDEX idx_reservations_inventory ON ads.order_reservations(inventory_id);

-- ============================================================
-- CREATIVE REQUESTS TABLE
-- ============================================================
-- When advertiser requests Philosify to create their ad
CREATE TABLE ads.creative_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES ads.ad_orders(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL REFERENCES ads.advertisers(id) ON DELETE CASCADE,
  
  -- Brief from advertiser
  brief TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  brand_colors TEXT,  -- e.g., "#e2007a, #89CFF0"
  target_audience TEXT,
  key_message TEXT,
  call_to_action TEXT,
  
  -- Uploaded assets
  logo_url TEXT,
  additional_assets JSONB DEFAULT '[]'::jsonb,  -- Array of URLs
  
  -- Creative specs
  placement TEXT NOT NULL,
  duration INTEGER NOT NULL,
  
  -- Philosify work
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting assignment
    'in_progress',  -- Designer working on it
    'review',       -- Submitted for advertiser review
    'revision',     -- Advertiser requested changes
    'approved',     -- Advertiser approved
    'rejected'      -- Cannot fulfill request
  )),
  
  -- Drafts (multiple revisions possible)
  drafts JSONB DEFAULT '[]'::jsonb,  -- Array of {url, version, submitted_at, feedback}
  current_draft_url TEXT,
  
  -- Final approved creative
  final_url TEXT,
  
  -- Pricing
  fee_cents INTEGER NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_creative_requests_order ON ads.creative_requests(order_id);
CREATE INDEX idx_creative_requests_status ON ads.creative_requests(status);

-- ============================================================
-- PRICING CONFIGURATION
-- ============================================================
-- CPM rates and creative fees
CREATE TABLE ads.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What this price applies to
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('cpm', 'creative_fee')),
  placement TEXT,  -- NULL for creative fees
  duration INTEGER,  -- NULL for creative fees
  
  -- Price in cents
  price_cents INTEGER NOT NULL,
  
  -- Validity
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,  -- NULL = no end date
  
  -- Active flag
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default pricing
INSERT INTO ads.pricing_config (pricing_type, placement, duration, price_cents) VALUES
  -- Sidebar CPM rates (per 1000 impressions)
  ('cpm', 'sidebar', 5, 1000),   -- $10 CPM for 5 sec
  ('cpm', 'sidebar', 10, 2000),  -- $20 CPM for 10 sec
  ('cpm', 'sidebar', 15, 3000),  -- $30 CPM for 15 sec
  ('cpm', 'sidebar', 20, 4000),  -- $40 CPM for 20 sec
  -- Constellation CPM rate (fixed 5 sec)
  ('cpm', 'constellation', 5, 800),  -- $8 CPM
  -- Creative service fees
  ('creative_fee', NULL, 5, 15000),   -- $150 for 5 sec ad
  ('creative_fee', NULL, 10, 25000),  -- $250 for 10 sec ad
  ('creative_fee', NULL, 15, 35000),  -- $350 for 15 sec ad
  ('creative_fee', NULL, 20, 45000);  -- $450 for 20 sec ad

CREATE INDEX idx_pricing_active ON ads.pricing_config(pricing_type, is_active);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get current CPM for placement/duration
CREATE OR REPLACE FUNCTION ads.get_cpm_cents(p_placement TEXT, p_duration INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_cpm INTEGER;
BEGIN
  SELECT price_cents INTO v_cpm
  FROM ads.pricing_config
  WHERE pricing_type = 'cpm'
    AND placement = p_placement
    AND duration = p_duration
    AND is_active = true
    AND effective_from <= CURRENT_DATE
    AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
  ORDER BY effective_from DESC
  LIMIT 1;
  
  RETURN COALESCE(v_cpm, 1000);  -- Default $10 CPM
END;
$$ LANGUAGE plpgsql;

-- Get creative fee for duration
CREATE OR REPLACE FUNCTION ads.get_creative_fee_cents(p_duration INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_fee INTEGER;
BEGIN
  SELECT price_cents INTO v_fee
  FROM ads.pricing_config
  WHERE pricing_type = 'creative_fee'
    AND duration = p_duration
    AND is_active = true
    AND effective_from <= CURRENT_DATE
    AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
  ORDER BY effective_from DESC
  LIMIT 1;
  
  RETURN COALESCE(v_fee, 15000);  -- Default $150
END;
$$ LANGUAGE plpgsql;

-- Check inventory availability for date range
CREATE OR REPLACE FUNCTION ads.check_inventory_availability(
  p_placement TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_impressions_needed INTEGER
)
RETURNS TABLE (
  available BOOLEAN,
  total_available INTEGER,
  daily_breakdown JSONB
) AS $$
DECLARE
  v_total INTEGER := 0;
  v_breakdown JSONB := '[]'::jsonb;
  v_day RECORD;
BEGIN
  -- Get availability for each day
  FOR v_day IN
    SELECT 
      i.forecast_date,
      i.available_impressions
    FROM ads.inventory_forecast i
    WHERE i.placement = p_placement
      AND i.forecast_date BETWEEN p_start_date AND p_end_date
    ORDER BY i.forecast_date
  LOOP
    v_total := v_total + v_day.available_impressions;
    v_breakdown := v_breakdown || jsonb_build_object(
      'date', v_day.forecast_date,
      'available', v_day.available_impressions
    );
  END LOOP;
  
  RETURN QUERY SELECT 
    v_total >= p_impressions_needed,
    v_total,
    v_breakdown;
END;
$$ LANGUAGE plpgsql;

-- Reserve inventory for an order
CREATE OR REPLACE FUNCTION ads.reserve_inventory(
  p_order_id UUID,
  p_placement TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_total_impressions INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_day RECORD;
  v_remaining INTEGER := p_total_impressions;
  v_to_reserve INTEGER;
BEGIN
  -- Distribute impressions across days (proportionally)
  FOR v_day IN
    SELECT 
      i.id,
      i.forecast_date,
      i.available_impressions
    FROM ads.inventory_forecast i
    WHERE i.placement = p_placement
      AND i.forecast_date BETWEEN p_start_date AND p_end_date
      AND i.available_impressions > 0
    ORDER BY i.forecast_date
  LOOP
    IF v_remaining <= 0 THEN
      EXIT;
    END IF;
    
    -- Reserve up to available, but not more than remaining needed
    v_to_reserve := LEAST(v_day.available_impressions, v_remaining);
    
    -- Create reservation
    INSERT INTO ads.order_reservations (order_id, inventory_id, reserved_impressions)
    VALUES (p_order_id, v_day.id, v_to_reserve);
    
    -- Update inventory
    UPDATE ads.inventory_forecast
    SET reserved_impressions = reserved_impressions + v_to_reserve,
        updated_at = NOW()
    WHERE id = v_day.id;
    
    v_remaining := v_remaining - v_to_reserve;
  END LOOP;
  
  -- Return true if we reserved everything needed
  RETURN v_remaining <= 0;
END;
$$ LANGUAGE plpgsql;

-- Release inventory reservation (for cancellations)
CREATE OR REPLACE FUNCTION ads.release_inventory(p_order_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update inventory forecast
  UPDATE ads.inventory_forecast i
  SET reserved_impressions = reserved_impressions - r.reserved_impressions,
      updated_at = NOW()
  FROM ads.order_reservations r
  WHERE r.inventory_id = i.id
    AND r.order_id = p_order_id;
  
  -- Delete reservations
  DELETE FROM ads.order_reservations WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Get next ad to serve (updated for order-based system)
CREATE OR REPLACE FUNCTION ads.get_next_ad_v2(p_placement TEXT)
RETURNS TABLE (
  order_id UUID,
  advertiser_id UUID,
  creative_url TEXT,
  target_url TEXT,
  duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.advertiser_id,
    o.creative_url,
    o.target_url,
    o.duration
  FROM ads.ad_orders o
  JOIN ads.advertisers a ON a.id = o.advertiser_id
  WHERE o.placement = p_placement
    AND o.status = 'active'
    AND o.creative_status = 'ready'
    AND o.impressions_delivered < o.impressions_ordered
    AND a.status = 'approved'
    -- Check schedule
    AND (
      o.schedule_type = 'asap'
      OR (
        o.schedule_type = 'scheduled'
        AND CURRENT_DATE BETWEEN o.start_date AND o.end_date
        -- Time window check would go here (simplified for now)
      )
    )
  ORDER BY 
    -- Priority: scheduled orders first, then ASAP by creation date
    CASE WHEN o.schedule_type = 'scheduled' THEN 0 ELSE 1 END,
    o.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Record impression for order
CREATE OR REPLACE FUNCTION ads.record_order_impression(
  p_order_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_order RECORD;
  v_impression_id UUID;
  v_cost_cents INTEGER;
  v_reservation_id UUID;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM ads.ad_orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Calculate cost per impression
  v_cost_cents := CEIL(v_order.cpm_cents::numeric / 1000);
  
  -- Create impression record
  INSERT INTO ads.ad_impressions (
    campaign_id,  -- Using order_id in campaign_id field for compatibility
    user_id,
    placement,
    duration,
    cost_cents
  ) VALUES (
    p_order_id,
    p_user_id,
    v_order.placement,
    v_order.duration,
    v_cost_cents
  ) RETURNING id INTO v_impression_id;
  
  -- Update order delivery count
  UPDATE ads.ad_orders
  SET impressions_delivered = impressions_delivered + 1,
      updated_at = NOW(),
      status = CASE 
        WHEN impressions_delivered + 1 >= impressions_ordered THEN 'completed'
        ELSE status
      END
  WHERE id = p_order_id;
  
  -- Update reservation delivery count (find today's reservation)
  UPDATE ads.order_reservations r
  SET delivered_impressions = delivered_impressions + 1
  FROM ads.inventory_forecast i
  WHERE r.inventory_id = i.id
    AND r.order_id = p_order_id
    AND i.forecast_date = CURRENT_DATE;
  
  -- Update actual impressions in forecast
  UPDATE ads.inventory_forecast
  SET actual_impressions = actual_impressions + 1,
      updated_at = NOW()
  WHERE placement = v_order.placement
    AND forecast_date = CURRENT_DATE;
  
  RETURN v_impression_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED INVENTORY FORECAST (next 90 days)
-- ============================================================
-- This would normally be updated by a cron job based on traffic patterns
INSERT INTO ads.inventory_forecast (forecast_date, placement, estimated_impressions)
SELECT 
  d::date,
  p.placement,
  CASE 
    -- Weekends have less traffic
    WHEN EXTRACT(DOW FROM d) IN (0, 6) THEN
      CASE p.placement
        WHEN 'sidebar' THEN 3000
        WHEN 'constellation' THEN 1500
      END
    -- Weekdays
    ELSE
      CASE p.placement
        WHEN 'sidebar' THEN 5000
        WHEN 'constellation' THEN 2500
      END
  END as estimated_impressions
FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', INTERVAL '1 day') d
CROSS JOIN (VALUES ('sidebar'), ('constellation')) AS p(placement)
ON CONFLICT (forecast_date, placement) DO NOTHING;

-- ============================================================
-- AD PLANS TABLE (Budget-Based Campaigns)
-- ============================================================
-- A plan groups multiple orders together under one budget
CREATE TABLE ads.ad_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES ads.advertisers(id) ON DELETE CASCADE,
  
  -- Plan details
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  goal TEXT NOT NULL DEFAULT 'balanced' CHECK (goal IN ('reach', 'engagement', 'balanced')),
  
  -- Creative
  creative_type TEXT NOT NULL CHECK (creative_type IN ('self', 'philosify')),
  creative_url TEXT,
  creative_brief TEXT,
  creative_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (creative_status IN ('pending', 'in_progress', 'ready', 'rejected')),
  creative_fee_cents INTEGER NOT NULL DEFAULT 0,
  
  -- Budget and costs
  budget_cents INTEGER NOT NULL,
  total_cost_cents INTEGER NOT NULL,
  
  -- Schedule
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Associated orders (array of order IDs)
  order_ids UUID[] DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'pending_creative',
    'pending_approval',
    'approved',
    'active',
    'paused',
    'completed',
    'cancelled'
  )),
  
  -- Payment
  paid_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plans_advertiser ON ads.ad_plans(advertiser_id);
CREATE INDEX idx_plans_status ON ads.ad_plans(status);

-- Add plan_id to orders table
ALTER TABLE ads.ad_orders ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES ads.ad_plans(id);
CREATE INDEX IF NOT EXISTS idx_orders_plan ON ads.ad_orders(plan_id) WHERE plan_id IS NOT NULL;

-- Add plan_id to creative_requests table
ALTER TABLE ads.creative_requests ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES ads.ad_plans(id);

-- ============================================================
-- UPDATE EXISTING TABLES
-- ============================================================

-- Add order_id to impressions table for tracking
ALTER TABLE ads.ad_impressions 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES ads.ad_orders(id);

-- Create index for order-based queries
CREATE INDEX IF NOT EXISTS idx_impressions_order ON ads.ad_impressions(order_id) 
WHERE order_id IS NOT NULL;
