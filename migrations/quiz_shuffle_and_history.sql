-- ============================================================
-- QUIZ: Shuffle support + cross-session history
-- ============================================================

-- Store the current question, shuffled correct answer, and reverse shuffle map
-- so the answer handler knows which letter is correct and can reverse-map user answers
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS current_question_id UUID;
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS current_correct_answer TEXT;
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS current_shuffle_reverse JSONB DEFAULT '{}';

-- Function to get question IDs a user answered correctly across ALL sessions
-- Used to prevent repeating questions the user already knows
CREATE OR REPLACE FUNCTION get_user_correct_question_ids(p_user_id UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(array_agg(DISTINCT qa.question_id), '{}')
  FROM quiz_answers qa
  JOIN quiz_sessions qs ON qs.id = qa.session_id
  WHERE qs.user_id = p_user_id
    AND qa.is_correct = true;
$$;
