-- ============================================================
-- PHILOSIFY QUIZ - Database Schema
-- ============================================================
-- Tables for the philosophical quiz feature
-- - quiz_questions: Question bank with difficulty levels
-- - quiz_sessions: User quiz sessions
-- - quiz_answers: Individual answer tracking
-- ============================================================

-- ============================================================
-- 1. QUIZ QUESTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Question content
  category TEXT NOT NULL CHECK (category IN (
    'metaphysics', 'epistemology', 'ethics', 'politics', 
    'aesthetics', 'applied', 'history', 'american_exceptionalism',
    'virtues', 'economics', 'law', 'music', 'cinema', 'quotes'
  )),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
  question TEXT NOT NULL,
  
  -- Options stored as JSONB array: [{id: 'a', text: '...'}, ...]
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL, -- 'a', 'b', 'c', or 'd'
  
  -- Explanations
  explanation TEXT NOT NULL, -- Shown after correct answer
  wrong_explanations JSONB NOT NULL DEFAULT '{}', -- {option_id: explanation}
  
  -- Metadata
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching questions by difficulty
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty 
  ON quiz_questions(difficulty) WHERE active = true;

-- Index for fetching by category
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category 
  ON quiz_questions(category) WHERE active = true;

-- ============================================================
-- 2. QUIZ SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session state
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  current_question_number INTEGER NOT NULL DEFAULT 0, -- 0-based, resets each 10-question block
  current_difficulty INTEGER NOT NULL DEFAULT 1, -- Increases with correct answers
  current_streak INTEGER NOT NULL DEFAULT 0, -- Consecutive correct answers
  max_streak INTEGER NOT NULL DEFAULT 0, -- Best streak this session
  
  -- Scoring
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_wrong INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0, -- Calculated score with difficulty bonus
  
  -- Credits
  credits_spent INTEGER NOT NULL DEFAULT 1, -- Starts at 1 (entry fee)
  credits_earned INTEGER NOT NULL DEFAULT 0, -- From streak bonuses
  
  -- Questions answered in this session (to avoid repeats)
  answered_question_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user's sessions
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user 
  ON quiz_sessions(user_id, started_at DESC);

-- Index for active sessions
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_active 
  ON quiz_sessions(user_id) WHERE status = 'active';

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_leaderboard 
  ON quiz_sessions(score DESC, max_streak DESC) WHERE status = 'completed';

-- ============================================================
-- 3. QUIZ ANSWERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  
  -- Answer details
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  difficulty_at_time INTEGER NOT NULL,
  time_taken_ms INTEGER, -- Optional: track response time
  
  -- Timestamps
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for session's answers
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session 
  ON quiz_answers(session_id, answered_at);

-- ============================================================
-- 4. LEADERBOARD VIEW (Anonymous)
-- ============================================================
CREATE OR REPLACE VIEW quiz_leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY score DESC, max_streak DESC, ended_at ASC) as rank,
  score,
  total_correct,
  total_wrong,
  max_streak,
  ended_at::DATE as achieved_date
FROM quiz_sessions
WHERE status = 'completed' AND score > 0
ORDER BY score DESC, max_streak DESC, ended_at ASC
LIMIT 100;

-- ============================================================
-- 5. USER STATS VIEW
-- ============================================================
CREATE OR REPLACE VIEW quiz_user_stats AS
SELECT 
  user_id,
  COUNT(*) as total_sessions,
  SUM(total_correct) as lifetime_correct,
  SUM(total_wrong) as lifetime_wrong,
  MAX(score) as best_score,
  MAX(max_streak) as best_streak,
  SUM(credits_spent) as total_credits_spent,
  SUM(credits_earned) as total_credits_earned
FROM quiz_sessions
WHERE status IN ('completed', 'failed')
GROUP BY user_id;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Questions: Anyone can read active questions (via API, not direct)
CREATE POLICY quiz_questions_select ON quiz_questions
  FOR SELECT USING (active = true);

-- Sessions: Users can only see their own sessions
CREATE POLICY quiz_sessions_select ON quiz_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY quiz_sessions_insert ON quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY quiz_sessions_update ON quiz_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Answers: Users can only see their own answers
CREATE POLICY quiz_answers_select ON quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions 
      WHERE quiz_sessions.id = quiz_answers.session_id 
      AND quiz_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY quiz_answers_insert ON quiz_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_sessions 
      WHERE quiz_sessions.id = quiz_answers.session_id 
      AND quiz_sessions.user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. HELPER FUNCTIONS
-- ============================================================

-- Function to get a random question at specified difficulty (avoiding already answered)
CREATE OR REPLACE FUNCTION get_quiz_question(
  p_difficulty INTEGER,
  p_excluded_ids UUID[]
)
RETURNS quiz_questions
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM quiz_questions
  WHERE active = true
    AND difficulty = p_difficulty
    AND id != ALL(p_excluded_ids)
  ORDER BY random()
  LIMIT 1;
$$;

-- Function to get user's rank on leaderboard
CREATE OR REPLACE FUNCTION get_user_quiz_rank(p_user_id UUID)
RETURNS TABLE(rank BIGINT, score INTEGER, best_streak INTEGER)
LANGUAGE sql
STABLE
AS $$
  WITH ranked AS (
    SELECT 
      user_id,
      MAX(qs.score) as score,
      MAX(qs.max_streak) as best_streak,
      ROW_NUMBER() OVER (ORDER BY MAX(qs.score) DESC, MAX(qs.max_streak) DESC) as rank
    FROM quiz_sessions qs
    WHERE status = 'completed' AND qs.score > 0
    GROUP BY user_id
  )
  SELECT rank, score, best_streak FROM ranked WHERE user_id = p_user_id;
$$;

-- ============================================================
-- 8. UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_quiz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_updated_at();
