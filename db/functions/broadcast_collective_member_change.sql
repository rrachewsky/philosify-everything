-- Espelho de produção 16/09/2026 — origem não versionada (trigger criada fora do repo).
-- Fonte: dump A/B do Bob (pg_get_functiondef + pg_get_triggerdef), new_design/DUMPS_AB_TRIGGER_MEMBER_JOINED_2026-09-16.md
-- NÃO reaplicar; documentação. Eventos 'member-joined' / 'member-left' em 'collective:<group_id>'.

CREATE OR REPLACE FUNCTION public.broadcast_collective_member_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    BEGIN
      PERFORM realtime.send(
        jsonb_build_object(
          'id', NEW.id,
          'group_id', NEW.group_id,
          'user_id', NEW.user_id,
          'joined_at', NEW.joined_at
        ),
        'member-joined',
        'collective:' || NEW.group_id::text,
        TRUE
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'broadcast_collective_member_change failed: %', SQLERRM;
    END;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    BEGIN
      PERFORM realtime.send(
        jsonb_build_object(
          'id', OLD.id,
          'group_id', OLD.group_id,
          'user_id', OLD.user_id
        ),
        'member-left',
        'collective:' || OLD.group_id::text,
        TRUE
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'broadcast_collective_member_change failed: %', SQLERRM;
    END;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$

-- Trigger (pg_get_triggerdef):
-- CREATE TRIGGER broadcast_collective_member_trigger AFTER INSERT OR DELETE ON public.collective_members FOR EACH ROW EXECUTE FUNCTION broadcast_collective_member_change()
