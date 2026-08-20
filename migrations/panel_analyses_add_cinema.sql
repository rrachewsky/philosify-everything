-- 4.1 — panel_analyses: admit 'cinema' in the media_type CHECK
-- (19-20 Aug 2026 cleanup order. GATED: run only after Roberto's approval.)
--
-- The worker whitelist and the panel template both serve cinema since 2 Aug,
-- but the table still refuses it: every cinema panel INSERT 400s and the
-- panel lives in KV only, invisible to user history. NEW panels only — the
-- 21 regenerated panels are NOT backfilled (ownership was never recorded).
--
-- The constraint was created inline on the column in panel_history.sql, so
-- it carries the default name <table>_<column>_check. If the DROP errors,
-- find the real name with:
--   SELECT conname FROM pg_constraint
--   WHERE conrelid = 'panel_analyses'::regclass AND contype = 'c';

ALTER TABLE panel_analyses
  DROP CONSTRAINT panel_analyses_media_type_check;

ALTER TABLE panel_analyses
  ADD CONSTRAINT panel_analyses_media_type_check
  CHECK (media_type IN ('music', 'literature', 'news', 'cinema'));
