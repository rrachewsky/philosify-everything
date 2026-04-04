-- ============================================================
-- QUIZ: Remove fixed letter IDs from options
-- ============================================================
-- Changes options structure from:
--   [{"id": "a", "text": "..."}, {"id": "b", "text": "..."}]
--   correct_answer: "b"
--   wrong_explanations: {"a": "...", "c": "...", "d": "..."}
-- To:
--   [{"text": "...", "correct": true}, {"text": "..."}, ...]
--   wrong_explanations: {"0": "...", "2": "...", "3": "..."} (indices, not letters)
-- ============================================================

BEGIN;

-- Step 1: Transform options - remove "id" field, add "correct": true to the correct option
UPDATE quiz_questions
SET options = (
  SELECT jsonb_agg(
    CASE 
      WHEN (opt->>'id') = correct_answer 
      THEN jsonb_build_object('text', opt->>'text', 'correct', true)
      ELSE jsonb_build_object('text', opt->>'text')
    END
    ORDER BY opt->>'id'  -- Preserve original order a, b, c, d
  )
  FROM jsonb_array_elements(options) AS opt
)
WHERE options IS NOT NULL;

-- Step 2: Transform wrong_explanations keys from letters (a,b,c,d) to indices (0,1,2,3)
-- Letter 'a' -> index 0, 'b' -> 1, 'c' -> 2, 'd' -> 3
UPDATE quiz_questions
SET wrong_explanations = (
  SELECT jsonb_object_agg(
    CASE key
      WHEN 'a' THEN '0'
      WHEN 'b' THEN '1'
      WHEN 'c' THEN '2'
      WHEN 'd' THEN '3'
      ELSE key  -- Keep as-is if already numeric
    END,
    value
  )
  FROM jsonb_each(wrong_explanations)
)
WHERE wrong_explanations IS NOT NULL;

-- Step 3: Drop the now-obsolete correct_answer column
ALTER TABLE quiz_questions DROP COLUMN IF EXISTS correct_answer;

-- Note: translations.options and translations.wrong_explanations still have old format
-- The code handles both formats during a transition period
-- Old translations will continue to work (code checks for both "id" and "correct" fields)

COMMIT;
