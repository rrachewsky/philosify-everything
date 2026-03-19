-- ============================================================
-- Migration: User News Preferences
-- ============================================================
-- Allows users to customize news sources (costs 1 credit to unlock)
-- Default users see pre-selected quality outlets
-- ============================================================

CREATE TABLE IF NOT EXISTS user_news_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  unlocked BOOLEAN DEFAULT FALSE,
  enabled_sources TEXT[] DEFAULT NULL,  -- NULL = default sources, array = custom selection
  unlocked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_user_news_preferences_user_id ON user_news_preferences(user_id);

-- RLS policies
ALTER TABLE user_news_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can read own news preferences"
  ON user_news_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own news preferences"
  ON user_news_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own news preferences"
  ON user_news_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do everything (for API)
CREATE POLICY "Service role full access to news preferences"
  ON user_news_preferences FOR ALL
  USING (auth.role() = 'service_role');
