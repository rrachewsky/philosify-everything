-- 4.3 / D3 — extract the credit RPCs so the database stops being the only copy
-- READ-ONLY. Run in the Supabase SQL Editor and paste the full output back;
-- each function then lands as db/functions/<name>.sql in the repo.
--
-- The four functions of the order plus cleanup_user_stale_reservations,
-- which the worker also calls (system map: "no DDL in the repo" for all of
-- them). create_share_token / get_shared_analysis are in the same situation
-- (sharing, not credits) — extract them too if you want them versioned in
-- the same pass.

SELECT p.proname AS function_name,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'reserve_credit',
    'confirm_reservation',
    'release_reservation',
    'cleanup_stale_reservations',
    'cleanup_user_stale_reservations'
  )
ORDER BY p.proname;
