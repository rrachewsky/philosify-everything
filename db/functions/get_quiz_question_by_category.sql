-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.get_quiz_question_by_category(p_difficulty integer, p_category text, p_excluded_ids uuid[])
 RETURNS quiz_questions
 LANGUAGE sql
 STABLE
AS $function$
  SELECT * FROM quiz_questions
  WHERE active = true
    AND difficulty = p_difficulty
    AND category = p_category
    AND id != ALL(p_excluded_ids)
  ORDER BY random()
  LIMIT 1;
$function$
