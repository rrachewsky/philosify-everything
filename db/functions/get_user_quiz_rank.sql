-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.get_user_quiz_rank(p_user_id uuid)
 RETURNS TABLE(rank bigint, score integer, best_streak integer, nickname text)
 LANGUAGE sql
 STABLE
AS $function$
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
$function$
