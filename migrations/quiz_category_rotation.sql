-- ============================================================
-- QUIZ: Category-aware question selection
-- ============================================================
-- Adds RPC function to fetch questions filtered by category.
-- Used by the category rotation logic so the quiz cycles evenly
-- through all 14 categories instead of picking at random.
-- ============================================================

-- Fetch a random question for a specific category + difficulty
CREATE OR REPLACE FUNCTION get_quiz_question_by_category(
  p_difficulty INTEGER,
  p_category TEXT,
  p_excluded_ids UUID[]
)
RETURNS quiz_questions
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM quiz_questions
  WHERE active = true
    AND difficulty = p_difficulty
    AND category = p_category
    AND id != ALL(p_excluded_ids)
  ORDER BY random()
  LIMIT 1;
$$;

-- Index for fetching by category + difficulty (speeds up the RPC)
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category_difficulty
  ON quiz_questions(category, difficulty) WHERE active = true;
