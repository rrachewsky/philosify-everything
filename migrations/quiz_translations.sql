-- ============================================================
-- QUIZ TRANSLATIONS - Add translations column
-- ============================================================
-- Structure: { "pt": { "question": "...", "options": [...], "explanation": "...", "wrong_explanations": {...} }, "es": {...} }

ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}';
