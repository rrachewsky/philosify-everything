# Dumps A/B — trigger `member-joined` / `member-left` de `public.collective_members`

**Espelho verbatim de produção, extraído pelo Bob em 16/09/2026** (SQL Editor do Supabase; saídas de
`pg_get_functiondef` e `pg_get_triggerdef`). Origem não versionada: a função e a trigger foram criadas fora do repo e
só existiam no banco. Este arquivo é documentação — **não reaplicar**.

Versionado em: `migrations/collective_comments_realtime_broadcast.sql` (seção ESPELHO) e
`db/functions/broadcast_collective_member_change.sql`. Contexto: `new_design/TRIGGER_MEMBER_JOINED_ESPELHO_2026-09-16.md`.

## DUMP A — `pg_get_functiondef`

```sql
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
```

## DUMP B — `pg_get_triggerdef`

```sql
CREATE TRIGGER broadcast_collective_member_trigger AFTER INSERT OR DELETE ON public.collective_members FOR EACH ROW EXECUTE FUNCTION broadcast_collective_member_change()
```
