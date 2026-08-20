-- 4.2 — credit_history: analysis_id column, populated on write going forward
-- (19-20 Aug 2026 cleanup order. GATED: run only after Roberto's approval.)
--
-- D3 (etapas report): the row is born inside the confirm_reservation RPC,
-- whose INSERT never writes analysis_id — and that function's only copy
-- lives in the database. Rather than blind-editing a SECURITY DEFINER
-- financial function, the worker now PATCHes the row it just created
-- (confirm.js) with the analysis UUID, same request, best-effort.
-- This migration only guarantees the column exists. NO backfill.
--
-- ON DELETE SET NULL: the statement is an audit log; if an analysis is ever
-- hard-deleted the history row must survive with the link cleared.
--
-- If the live table already has the column, IF NOT EXISTS makes this a no-op.

ALTER TABLE credit_history
  ADD COLUMN IF NOT EXISTS analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL;

-- After confirm_reservation's body is versioned (see
-- db/extract_credit_functions.sql), moving this write INTO the RPC's INSERT
-- is the clean follow-up; the worker-side PATCH then becomes redundant.
