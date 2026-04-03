-- ============================================================
-- QUIZ NICKNAMES - Display names for leaderboard
-- ============================================================

-- Quiz profiles table for nicknames
CREATE TABLE IF NOT EXISTS quiz_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint on nickname (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_profiles_nickname_unique
  ON quiz_profiles(LOWER(nickname));

-- Auto-generate nickname trigger: "Player #<sequence>"
CREATE SEQUENCE IF NOT EXISTS quiz_player_number_seq START 1;

-- Updated leaderboard view with nicknames
CREATE OR REPLACE VIEW quiz_leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY qs.score DESC, qs.max_streak DESC, qs.ended_at ASC) as rank,
  COALESCE(qp.nickname, 'Player #' || DENSE_RANK() OVER (ORDER BY qs.user_id)) as nickname,
  qs.score,
  qs.total_correct,
  qs.total_wrong,
  qs.max_streak,
  qs.ended_at::DATE as achieved_date
FROM quiz_sessions qs
LEFT JOIN quiz_profiles qp ON qp.user_id = qs.user_id
WHERE qs.status = 'completed' AND qs.score > 0
ORDER BY qs.score DESC, qs.max_streak DESC, qs.ended_at ASC
LIMIT 100;

-- Updated user rank function with nickname
CREATE OR REPLACE FUNCTION get_user_quiz_rank(p_user_id UUID)
RETURNS TABLE(rank BIGINT, score INTEGER, best_streak INTEGER, nickname TEXT)
LANGUAGE sql
STABLE
AS $$
  WITH ranked AS (
    SELECT 
      qs.user_id,
      MAX(qs.score) as score,
      MAX(qs.max_streak) as best_streak,
      ROW_NUMBER() OVER (ORDER BY MAX(qs.score) DESC, MAX(qs.max_streak) DESC) as rank
    FROM quiz_sessions qs
    WHERE status = 'completed' AND qs.score > 0
    GROUP BY qs.user_id
  )
  SELECT 
    r.rank, 
    r.score, 
    r.best_streak,
    COALESCE(qp.nickname, 'Player #' || r.rank) as nickname
  FROM ranked r
  LEFT JOIN quiz_profiles qp ON qp.user_id = r.user_id
  WHERE r.user_id = p_user_id;
$$;
