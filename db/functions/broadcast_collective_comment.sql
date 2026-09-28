-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada so em SQL/migrations do repo. Usada por 1 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.broadcast_collective_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_group_id uuid;
BEGIN
  BEGIN
    SELECT ca.group_id INTO v_group_id
    FROM public.collective_analyses ca
    WHERE ca.id = NEW.collective_analysis_id;

    IF v_group_id IS NULL THEN
      RAISE WARNING '[broadcast_collective_comment] No group for analysis %', NEW.collective_analysis_id;
      RETURN NEW;
    END IF;

    PERFORM realtime.send(
      jsonb_build_object(
        'id',                     NEW.id,
        'collective_analysis_id', NEW.collective_analysis_id,
        'group_id',               v_group_id,
        'user_id',                NEW.user_id,
        'parent_id',              NEW.parent_id,
        'display_name',           NEW.display_name,
        'content',                CASE WHEN COALESCE(NEW.is_encrypted, false) THEN NULL ELSE NEW.content END,
        'encrypted_content',      CASE WHEN COALESCE(NEW.is_encrypted, false) THEN NEW.encrypted_content ELSE NULL END,
        'nonce',                  CASE WHEN COALESCE(NEW.is_encrypted, false) THEN NEW.nonce ELSE NULL END,
        'is_encrypted',           COALESCE(NEW.is_encrypted, false),
        'created_at',             NEW.created_at
      ),
      'new-comment',
      'collective:' || v_group_id::text,
      TRUE
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[broadcast_collective_comment] Failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$function$
