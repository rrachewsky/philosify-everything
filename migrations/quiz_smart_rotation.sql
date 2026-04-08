-- ============================================================
-- QUIZ: Smart question rotation
-- Wrong answers go to "end of the line" (excluded for 3 sessions)
-- ============================================================

-- Get question IDs a user answered WRONG in their last N sessions.
-- These are pushed to the "end of the line" — excluded temporarily,
-- then they come back after the user has played more sessions.
CREATE OR REPLACE FUNCTION get_user_recent_wrong_question_ids(
  p_user_id UUID,
  p_last_n_sessions INTEGER DEFAULT 3
)
RETURNS UUID[]
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(array_agg(DISTINCT qa.question_id), '{}')
  FROM quiz_answers qa
  JOIN quiz_sessions qs ON qs.id = qa.session_id
  WHERE qs.user_id = p_user_id
    AND qa.is_correct = false
    AND qs.id IN (
      SELECT id FROM quiz_sessions
      WHERE user_id = p_user_id
      ORDER BY started_at DESC
      LIMIT p_last_n_sessions
    );
$$;

-- Track total answers globally for auto-generation trigger
-- (checked by the API to decide when to generate new questions)
CREATE OR REPLACE FUNCTION get_global_answer_count()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*) FROM quiz_answers;
$$;

-- ============================================================
-- QUIZ: Regional culture questions
-- At least 2 out of every 10 questions must be region-specific.
-- ============================================================

-- Add region column (nullable — NULL = universal/global question)
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS region TEXT;

-- Index for fetching region-specific questions
CREATE INDEX IF NOT EXISTS idx_quiz_questions_region 
  ON quiz_questions(region, difficulty) WHERE active = true AND region IS NOT NULL;

-- Fetch a random question for a specific region + difficulty
CREATE OR REPLACE FUNCTION get_quiz_question_for_region(
  p_difficulty INTEGER,
  p_region TEXT,
  p_excluded_ids UUID[]
)
RETURNS quiz_questions
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM quiz_questions
  WHERE active = true
    AND difficulty = p_difficulty
    AND region = p_region
    AND id != ALL(p_excluded_ids)
  ORDER BY random()
  LIMIT 1;
$$;
