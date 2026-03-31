-- ============================================================
-- Migration: Switch Ads Platform to Supabase Auth
-- ============================================================
-- Remove custom auth in favor of Supabase Auth for both
-- advertisers and agencies. Profiles linked via user_id.
-- ============================================================

-- ============================================================
-- ADVERTISERS TABLE
-- ============================================================

-- Add user_id column to link to Supabase auth.users
ALTER TABLE ads.advertisers 
ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE;

-- Make password_hash nullable (no longer needed for new users)
ALTER TABLE ads.advertisers 
ALTER COLUMN password_hash DROP NOT NULL;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_advertisers_user_id ON ads.advertisers(user_id);

-- Drop the sessions table (Supabase handles sessions now)
DROP TABLE IF EXISTS ads.advertiser_sessions;

-- Update comments
COMMENT ON TABLE ads.advertisers IS 'Advertiser profiles linked to Supabase auth.users via user_id';
COMMENT ON COLUMN ads.advertisers.user_id IS 'Links to Supabase auth.users.id';
COMMENT ON COLUMN ads.advertisers.password_hash IS 'DEPRECATED - kept for legacy accounts, new accounts use Supabase Auth';

-- ============================================================
-- AGENCIES TABLE  
-- ============================================================

-- Add user_id column to link to Supabase auth.users
ALTER TABLE ads.agencies
ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE;

-- Make password_hash nullable (no longer needed for new users)
ALTER TABLE ads.agencies
ALTER COLUMN password_hash DROP NOT NULL;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_agencies_user_id ON ads.agencies(user_id);

-- Drop the agency sessions table if it exists
DROP TABLE IF EXISTS ads.agency_sessions;

-- Update comments
COMMENT ON TABLE ads.agencies IS 'Agency profiles linked to Supabase auth.users via user_id';
COMMENT ON COLUMN ads.agencies.user_id IS 'Links to Supabase auth.users.id';
COMMENT ON COLUMN ads.agencies.password_hash IS 'DEPRECATED - kept for legacy accounts, new accounts use Supabase Auth';

-- ============================================================
-- AD IMPRESSIONS TABLE - FRAUD PREVENTION
-- ============================================================
-- Add columns for signed token validation to prevent:
-- - Replay attacks (token_nonce)
-- - IP spoofing (ip_address)
-- ============================================================

-- Add token_nonce column (stores the nonce from signed impression token)
ALTER TABLE ads.ad_impressions
ADD COLUMN IF NOT EXISTS token_nonce TEXT;

-- Add ip_address column (for audit and validation)
ALTER TABLE ads.ad_impressions
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create unique index on token_nonce to enforce single-use tokens
-- This prevents replay attacks where the same token is used multiple times
CREATE UNIQUE INDEX IF NOT EXISTS idx_impressions_token_nonce 
ON ads.ad_impressions(token_nonce) 
WHERE token_nonce IS NOT NULL;

-- Index for IP-based analytics/fraud detection
CREATE INDEX IF NOT EXISTS idx_impressions_ip_address
ON ads.ad_impressions(ip_address)
WHERE ip_address IS NOT NULL;

-- Update comments
COMMENT ON COLUMN ads.ad_impressions.token_nonce IS 'Unique nonce from signed impression token - prevents replay attacks';
COMMENT ON COLUMN ads.ad_impressions.ip_address IS 'Client IP address for audit trail and fraud detection';
