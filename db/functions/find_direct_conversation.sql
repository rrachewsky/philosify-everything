-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.find_direct_conversation(p_user_a uuid, p_user_b uuid)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.id
  FROM dm_conversations c
  JOIN dm_conversation_members m1 ON m1.conversation_id = c.id AND m1.user_id = p_user_a
  JOIN dm_conversation_members m2 ON m2.conversation_id = c.id AND m2.user_id = p_user_b
  WHERE c.type = 'direct'
  LIMIT 1;
$function$
