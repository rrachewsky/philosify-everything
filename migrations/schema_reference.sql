-- ============================================================
-- PHILOSIFY - CLEAN DATABASE ARCHITECTURE
-- ============================================================
-- Purpose: Complete database redesign with optimal structure
-- Date: 2025-11-29
-- Status: REVIEW BEFORE EXECUTION
--
-- What this does:
-- 1. Renames existing tables (user_credits → credits, etc.) [MUST BE FIRST!]
-- 2. Creates new tables if they don't exist (profiles, etc.)
-- 3. Migrates data from user_profiles → profiles
-- 4. Fixes analyses table (add model column, fix unique constraint)
-- 5. Sets up auto-sync triggers and RLS policies
-- 6. Removes all unused/duplicate tables
-- ============================================================

-- ============================================================
-- STEP 1: RENAME EXISTING TABLES (DO THIS FIRST!)
-- ============================================================
-- CRITICAL: Renaming must happen BEFORE creating new tables
-- Otherwise CREATE TABLE IF NOT EXISTS will create empty tables
-- and the renames will be skipped, causing DATA LOSS!

-- ------------------------------------------------------------
-- Rename CREDITS (user_credits → credits)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits' AND table_schema = 'public') THEN
    -- Rename user_credits to credits
    ALTER TABLE user_credits RENAME TO credits;

    -- Rename columns to match new schema
    ALTER TABLE credits RENAME COLUMN purchased_credits TO purchased;
    ALTER TABLE credits RENAME COLUMN free_credits_remaining TO free_remaining;

    -- Drop old total_credits column if exists (we'll use generated column)
    ALTER TABLE credits DROP COLUMN IF EXISTS total_credits;

    -- Add generated column for total
    ALTER TABLE credits ADD COLUMN IF NOT EXISTS total INTEGER GENERATED ALWAYS AS (purchased + free_remaining) STORED;

    -- Update constraint names
    ALTER TABLE credits RENAME CONSTRAINT user_credits_pkey TO credits_pkey;
    ALTER TABLE credits RENAME CONSTRAINT user_credits_user_id_fkey TO credits_user_id_fkey;

    RAISE NOTICE 'Renamed user_credits → credits';
  END IF;
END $$;

-- ------------------------------------------------------------
-- Rename CREDIT_HISTORY (credit_transactions → credit_history)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_transactions' AND table_schema = 'public') THEN
    -- Rename credit_transactions to credit_history
    ALTER TABLE credit_transactions RENAME TO credit_history;

    -- Rename constraint
    ALTER TABLE credit_history RENAME CONSTRAINT credit_transactions_pkey TO credit_history_pkey;
    ALTER TABLE credit_history RENAME CONSTRAINT credit_transactions_user_id_fkey TO credit_history_user_id_fkey;

    RAISE NOTICE 'Renamed credit_transactions → credit_history';
  END IF;
END $$;

-- ------------------------------------------------------------
-- Rename WEBHOOKS (stripe_webhooks → webhooks)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_webhooks' AND table_schema = 'public') THEN
    -- Rename stripe_webhooks to webhooks
    ALTER TABLE stripe_webhooks RENAME TO webhooks;

    -- Rename constraint
    ALTER TABLE webhooks RENAME CONSTRAINT stripe_webhooks_pkey TO webhooks_pkey;
    ALTER TABLE webhooks RENAME CONSTRAINT stripe_webhooks_user_id_fkey TO webhooks_user_id_fkey;

    RAISE NOTICE 'Renamed stripe_webhooks → webhooks';
  END IF;
END $$;

-- ------------------------------------------------------------
-- Rename EMAIL_QUEUE (email_outbox → email_queue)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_outbox' AND table_schema = 'public') THEN
    -- Rename email_outbox to email_queue
    ALTER TABLE email_outbox RENAME TO email_queue;

    -- Rename constraint
    ALTER TABLE email_queue RENAME CONSTRAINT email_outbox_pkey TO email_queue_pkey;
    ALTER TABLE email_queue RENAME CONSTRAINT email_outbox_user_id_fkey TO email_queue_user_id_fkey;

    RAISE NOTICE 'Renamed email_outbox → email_queue';
  END IF;
END $$;

-- ============================================================
-- STEP 2: CREATE NEW TABLES (IF THEY DON'T EXIST)
-- ============================================================
-- After renames above, these tables should already exist
-- CREATE IF NOT EXISTS is safe fallback for new installations

-- ------------------------------------------------------------
-- PROFILES: User preferences and Stripe integration
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Auto-synced from auth.users (managed by triggers)
  email TEXT NOT NULL,
  display_name TEXT, -- Synced from auth.users metadata (full_name/name/email fallback)

  -- User preferences
  preferred_language TEXT DEFAULT 'en',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles with preferences (Stripe uses email from auth.users)';
COMMENT ON COLUMN profiles.email IS 'Auto-synced from auth.users via trigger';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ------------------------------------------------------------
-- CREDITS: User credit balances (purchased + free)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Credit balances
  purchased INTEGER NOT NULL DEFAULT 0 CHECK (purchased >= 0),
  free_remaining INTEGER NOT NULL DEFAULT 2 CHECK (free_remaining >= 0 AND free_remaining <= 2),
  total INTEGER GENERATED ALWAYS AS (purchased + free_remaining) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE credits IS 'User credit balances (purchased + free)';
COMMENT ON COLUMN credits.purchased IS 'Purchased credits (unlimited)';
COMMENT ON COLUMN credits.free_remaining IS 'Free credits remaining (max 2)';
COMMENT ON COLUMN credits.total IS 'Total credits available (auto-calculated)';

-- Index
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);

-- ------------------------------------------------------------
-- CREDIT_HISTORY: Complete audit log of credit changes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction type
  type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'consume', 'refund', 'signup_bonus')),
  amount INTEGER NOT NULL, -- Positive for add, negative for subtract

  -- Snapshots (before/after state)
  purchased_before INTEGER NOT NULL,
  purchased_after INTEGER NOT NULL,
  free_before INTEGER NOT NULL,
  free_after INTEGER NOT NULL,
  total_before INTEGER NOT NULL,
  total_after INTEGER NOT NULL,

  -- Payment details (for purchases)
  stripe_session_id VARCHAR(255),
  stripe_price_id VARCHAR(255),

  -- Analysis details (for consumption)
  song_analyzed VARCHAR(500),
  model_used VARCHAR(50),

  -- Status
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  -- Metadata
  metadata JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE credit_history IS 'Complete audit log of all credit transactions';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_type ON credit_history(type);
CREATE INDEX IF NOT EXISTS idx_credit_history_created_at ON credit_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_history_stripe_session ON credit_history(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- ------------------------------------------------------------
-- SONGS: Music catalog with Spotify metadata
-- ------------------------------------------------------------
-- Note: Keep existing songs table, just clean it up
-- We'll add ALTER statements later to remove redundant columns

-- ------------------------------------------------------------
-- ANALYSES: Philosophical evaluations of songs
-- ------------------------------------------------------------
-- Note: Keep existing analyses table, just fix the unique constraint
-- We'll add ALTER statements later

-- ------------------------------------------------------------
-- ANALYSIS_REQUESTS: Audit trail of who requested what
-- ------------------------------------------------------------
-- Note: Already created by RLS deployment, keep as-is

-- ------------------------------------------------------------
-- SHARE_TOKENS: Shareable analysis links
-- ------------------------------------------------------------
-- Note: Keep existing table, it's fine

-- ------------------------------------------------------------
-- WEBHOOKS: Stripe webhook processing log
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhooks (
  stripe_session_id VARCHAR(255) PRIMARY KEY,

  -- Webhook details
  event_type VARCHAR(100) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,

  -- User
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Processing status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  credits_granted INTEGER,
  transaction_id UUID REFERENCES credit_history(id),

  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Error handling
  error_message TEXT,
  attempts INTEGER DEFAULT 0,

  -- Raw webhook data
  metadata JSONB
);

COMMENT ON TABLE webhooks IS 'Stripe webhook processing log';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_received_at ON webhooks(received_at DESC);

-- ------------------------------------------------------------
-- EMAIL_QUEUE: Outbound email queue
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Email details
  email_type VARCHAR(100) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,

  -- Payload (for templating)
  payload JSONB,

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Error handling
  last_error TEXT,

  -- External email provider ID
  provider_message_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

COMMENT ON TABLE email_queue IS 'Outbound email queue with retry logic';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at DESC);

-- ============================================================
-- STEP 3: MIGRATE DATA FROM OLD TABLES
-- ============================================================

-- ------------------------------------------------------------
-- Migrate to PROFILES
-- ------------------------------------------------------------
INSERT INTO profiles (user_id, email, preferred_language, created_at, updated_at)
SELECT
  u.id AS user_id,
  u.email,
  COALESCE(up.preferred_language, 'en') AS preferred_language,
  COALESCE(up.created_at, u.created_at) AS created_at,
  COALESCE(up.updated_at, NOW()) AS updated_at
FROM auth.users u
LEFT JOIN user_profiles up ON up.id = u.id
ON CONFLICT (user_id) DO UPDATE SET
  preferred_language = EXCLUDED.preferred_language,
  updated_at = EXCLUDED.updated_at;

-- NOTE: Table renames (credits, credit_history, webhooks, email_queue)
-- already happened in STEP 1 above. No additional migration needed.

-- ============================================================
-- STEP 4: FIX ANALYSES TABLE
-- ============================================================

-- Add model as actual column (move from metadata JSONB)
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS model VARCHAR(50);

-- Migrate existing model data from metadata to column
UPDATE analyses
SET model = COALESCE(generated_by, metadata->>'model', 'gpt4')
WHERE model IS NULL;

-- Make model NOT NULL
ALTER TABLE analyses ALTER COLUMN model SET NOT NULL;

-- Drop wrong unique constraints
DROP INDEX IF EXISTS unique_analysis;
DROP INDEX IF EXISTS analyses_song_lang_version_unique;

-- Add correct unique constraint (song + language + model)
-- This ensures: Same song + same AI model = ONE cached analysis
CREATE UNIQUE INDEX IF NOT EXISTS unique_analysis_by_model
ON analyses(song_id, language, model);

-- Remove redundant columns
ALTER TABLE analyses DROP COLUMN IF EXISTS song_title;
ALTER TABLE analyses DROP COLUMN IF EXISTS artist;
ALTER TABLE analyses DROP COLUMN IF EXISTS spotify_id;
ALTER TABLE analyses DROP COLUMN IF EXISTS generated_by; -- Now using 'model' column instead

-- Add index on model for faster queries
CREATE INDEX IF NOT EXISTS idx_analyses_model ON analyses(model);

COMMENT ON TABLE analyses IS 'Philosophical evaluations of songs (one per song+language+model)';
COMMENT ON COLUMN analyses.model IS 'AI model identifier (e.g. gpt4, gpt4.1, gpt5, claude-sonnet-4.0, claude-sonnet-4.5, grok-4)';

-- ============================================================
-- STEP 5: CLEAN UP SONGS TABLE
-- ============================================================

-- Remove redundant columns
ALTER TABLE songs DROP COLUMN IF EXISTS analysis;
ALTER TABLE songs DROP COLUMN IF EXISTS lang;
ALTER TABLE songs DROP COLUMN IF EXISTS scores;
ALTER TABLE songs DROP COLUMN IF EXISTS song;

COMMENT ON TABLE songs IS 'Music catalog with Spotify metadata';

-- ============================================================
-- STEP 6: SET UP AUTO-SYNC TRIGGERS
-- ============================================================

-- ------------------------------------------------------------
-- Trigger 1: Create profile when user signs up
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile (with display_name from auth metadata)
  INSERT INTO profiles (user_id, email, display_name, preferred_language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    updated_at = NOW();

  -- Create credits record (10 free credits for new users)
  INSERT INTO credits (user_id, purchased, free_remaining)
  VALUES (NEW.id, 0, 10)
  ON CONFLICT (user_id) DO NOTHING;

  -- Log signup bonus
  INSERT INTO credit_history (
    user_id,
    type,
    amount,
    purchased_before, purchased_after,
    free_before, free_after,
    total_before, total_after,
    status
  ) VALUES (
    NEW.id,
    'signup_bonus',
    10,
    0, 0,
    0, 10,
    0, 10,
    'completed'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ------------------------------------------------------------
-- Trigger 2: Sync email when auth.users email changes
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE profiles
    SET
      email = NEW.email,
      updated_at = NOW()
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_profile_email();

-- ------------------------------------------------------------
-- Trigger 3: Sync display_name when user updates metadata
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_profile_display_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
    UPDATE profiles
    SET
      display_name = COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.email
      ),
      updated_at = NOW()
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_metadata_updated ON auth.users;

CREATE TRIGGER on_auth_user_metadata_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION sync_profile_display_name();

-- ------------------------------------------------------------
-- Trigger 4: Update updated_at timestamp
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old triggers if exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_credits_updated_at ON credits;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STEP 7: SET UP ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analysis_requests ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own credits" ON credits;
DROP POLICY IF EXISTS "Users can view own history" ON credit_history;
DROP POLICY IF EXISTS "Service role full access on profiles" ON profiles;
DROP POLICY IF EXISTS "Service role full access on credits" ON credits;
DROP POLICY IF EXISTS "Service role full access on credit_history" ON credit_history;
DROP POLICY IF EXISTS "Service role full access on webhooks" ON webhooks;
DROP POLICY IF EXISTS "Service role full access on email_queue" ON email_queue;
DROP POLICY IF EXISTS "Public can view songs" ON songs;
DROP POLICY IF EXISTS "Service role can manage songs" ON songs;
DROP POLICY IF EXISTS "Public can view published analyses" ON analyses;
DROP POLICY IF EXISTS "Service role can manage analyses" ON analyses;
DROP POLICY IF EXISTS "Users can view own shares" ON share_tokens;
DROP POLICY IF EXISTS "Users can create shares" ON share_tokens;
DROP POLICY IF EXISTS "Users can delete own shares" ON share_tokens;
DROP POLICY IF EXISTS "Service role full access on share_tokens" ON share_tokens;
DROP POLICY IF EXISTS "Users can view own analysis requests" ON user_analysis_requests;
DROP POLICY IF EXISTS "Service role full access on user_analysis_requests" ON user_analysis_requests;

-- ------------------------------------------------------------
-- PROFILES policies
-- ------------------------------------------------------------
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- CREDITS policies
-- ------------------------------------------------------------
CREATE POLICY "Users can view own credits"
  ON credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on credits"
  ON credits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- CREDIT_HISTORY policies
-- ------------------------------------------------------------
CREATE POLICY "Users can view own history"
  ON credit_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on credit_history"
  ON credit_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- WEBHOOKS policies (admin only)
-- ------------------------------------------------------------
CREATE POLICY "Service role full access on webhooks"
  ON webhooks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- EMAIL_QUEUE policies (admin only)
-- ------------------------------------------------------------
CREATE POLICY "Service role full access on email_queue"
  ON email_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- SONGS policies (public catalog for search/browsing)
-- ------------------------------------------------------------
CREATE POLICY "Anyone can view songs"
  ON songs FOR SELECT
  USING (true);

CREATE POLICY "Service role full access on songs"
  ON songs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- ANALYSES policies (users only see analyses they paid for)
-- ------------------------------------------------------------
CREATE POLICY "Users can view paid analyses"
  ON analyses FOR SELECT
  TO authenticated
  USING (
    -- User can see analysis if they've paid for it (exists in user_analysis_requests)
    EXISTS (
      SELECT 1 FROM user_analysis_requests
      WHERE user_analysis_requests.analysis_id = analyses.id
      AND user_analysis_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on analyses"
  ON analyses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- SHARE_TOKENS policies
-- ------------------------------------------------------------
CREATE POLICY "Users can view own shares"
  ON share_tokens FOR SELECT
  USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can create shares"
  ON share_tokens FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can delete own shares"
  ON share_tokens FOR DELETE
  USING (auth.uid() = created_by_user_id);

CREATE POLICY "Service role full access on share_tokens"
  ON share_tokens FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- USER_ANALYSIS_REQUESTS policies (audit trail)
-- ------------------------------------------------------------
CREATE POLICY "Users can view own requests"
  ON user_analysis_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on user_analysis_requests"
  ON user_analysis_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================================

-- Public tables (read-only for authenticated/anon)
GRANT SELECT ON songs TO authenticated, anon;
GRANT SELECT ON analyses TO authenticated, anon;

-- User-private tables (RLS enforces own rows only)
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON credits TO authenticated;
GRANT SELECT ON credit_history TO authenticated;

-- Service role retains ALL privileges
GRANT ALL ON profiles TO service_role;
GRANT ALL ON credits TO service_role;
GRANT ALL ON credit_history TO service_role;
GRANT ALL ON webhooks TO service_role;
GRANT ALL ON email_queue TO service_role;
GRANT ALL ON songs TO service_role;
GRANT ALL ON analyses TO service_role;

-- ============================================================
-- STEP 9: CREATE VIEWS
-- ============================================================

-- ------------------------------------------------------------
-- USER_PROFILES view: Safe public-facing view (no auth.users exposure)
-- Used by DM system, People panel, and conversation enrichment
-- NO SECURITY DEFINER - uses caller's permissions
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  user_id AS id,
  display_name
FROM profiles;

-- No anon access (unauthenticated users cannot query this)
REVOKE ALL ON public.user_profiles FROM anon;
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO service_role;

-- ============================================================
-- STEP 10: DELETE OLD/UNUSED TABLES
-- ============================================================

-- Drop zombie tables (NO DATA WE NEED)
DROP TABLE IF EXISTS analyses_backup CASCADE;
DROP TABLE IF EXISTS analysis_revisions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS analysis_feedback CASCADE;
DROP TABLE IF EXISTS guide_docs CASCADE;
DROP TABLE IF EXISTS search_logs CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;

-- Drop old duplicate tables (DATA ALREADY MIGRATED)
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;

-- Drop referrals if unused
DROP TABLE IF EXISTS referrals CASCADE;

-- ============================================================
-- STEP 10: VERIFICATION QUERIES
-- ============================================================

-- Check all tables exist
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'credits', 'credit_history', 'webhooks', 'email_queue', 'songs', 'analyses', 'share_tokens', 'user_analysis_requests')
ORDER BY tablename;

-- Check all policies exist
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check data counts
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL SELECT 'credits', COUNT(*) FROM credits
UNION ALL SELECT 'credit_history', COUNT(*) FROM credit_history
UNION ALL SELECT 'songs', COUNT(*) FROM songs
UNION ALL SELECT 'analyses', COUNT(*) FROM analyses
UNION ALL SELECT 'webhooks', COUNT(*) FROM webhooks
UNION ALL SELECT 'email_queue', COUNT(*) FROM email_queue
UNION ALL SELECT 'share_tokens', COUNT(*) FROM share_tokens
UNION ALL SELECT 'user_analysis_requests', COUNT(*) FROM user_analysis_requests;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

SELECT '✅ MIGRATION COMPLETE - New clean architecture ready!' as status;
