-- ============================================================
-- UNSAFE ZONE SESSIONS — Multiple conversations with turn limits
-- Replaces single-conversation model with session-based tracking.
-- Cost: 10 credits per session, max 20 turns, history preserved.
-- ============================================================

-- Drop old single-conversation table if migrating
-- (Keep data by migrating existing rows to new table first if needed)
-- DROP TABLE IF EXISTS unsafe_zone_conversations;

-- New sessions table
CREATE TABLE IF NOT EXISTS unsafe_zone_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  turn_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for finding user's active session quickly
CREATE INDEX IF NOT EXISTS idx_unsafe_zone_sessions_user_active 
  ON unsafe_zone_sessions(user_id, status) 
  WHERE status = 'active';

-- Index for history queries
CREATE INDEX IF NOT EXISTS idx_unsafe_zone_sessions_user_created 
  ON unsafe_zone_sessions(user_id, created_at DESC);

-- RLS
ALTER TABLE unsafe_zone_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON unsafe_zone_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON unsafe_zone_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON unsafe_zone_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON unsafe_zone_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Migrate existing conversations to new table (run once)
-- INSERT INTO unsafe_zone_sessions (user_id, messages, turn_count, status, created_at, updated_at)
-- SELECT 
--   user_id, 
--   messages, 
--   COALESCE(jsonb_array_length(messages) / 2, 0),
--   'active',
--   created_at,
--   updated_at
-- FROM unsafe_zone_conversations
-- ON CONFLICT DO NOTHING;
