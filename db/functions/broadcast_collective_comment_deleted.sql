-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada so em SQL/migrations do repo. Usada por 1 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.broadcast_collective_comment_deleted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_collective_id UUID;
BEGIN
  SELECT ca.group_id INTO v_collective_id
  FROM public.collective_analyses ca
  WHERE ca.id = OLD.collective_analysis_id;
  IF v_collective_id IS NOT NULL THEN
    BEGIN
      PERFORM realtime.send(
        jsonb_build_object(
          'id', OLD.id,
          'action', 'deleted'
        ),
        'comment-deleted',
        'collective:' || v_collective_id::text,
        TRUE
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[broadcast_collective_comment_deleted] Failed: %', SQLERRM;
    END;
  END IF;

  RETURN OLD;
END;
$function$
