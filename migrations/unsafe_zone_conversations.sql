-- ============================================================
-- UNSAFE ZONE CONVERSATIONS — Protected server-side storage
-- Each user has ONE conversation. Row-level security enforced.
-- ============================================================

CREATE TABLE IF NOT EXISTS unsafe_zone_conversations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: users can only access their own conversation
ALTER TABLE unsafe_zone_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own conversation"
  ON unsafe_zone_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation"
  ON unsafe_zone_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation"
  ON unsafe_zone_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversation"
  ON unsafe_zone_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypasses RLS (used by API handlers)
