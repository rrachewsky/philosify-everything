-- ============================================================
-- collective_comments — broadcast de realtime (Collective: comentários em análises)
-- ------------------------------------------------------------
-- APLICADO em produção pelo Bob em 2026-09-11 (SQL Editor) e verificado: a tabela
-- collective_comments ficou com 3 triggers — a de archive pré-existente (não tocada)
-- + as duas abaixo. Este arquivo é o espelho.
--
-- Padrão: migrations/broadcast_underground_post.sql (SECURITY DEFINER, search_path='',
-- realtime.send(..., private=TRUE), EXCEPTION não-bloqueante — nunca derruba o INSERT/DELETE).
-- Tópico: 'collective:<group_id>' — autorizado pela policy definer de realtime.messages
-- (is_collective_member, 06/09), já comprovado em produção pelo evento 'member-joined'.
-- group_id NÃO está em collective_comments: resolvido via collective_analyses.
-- Eventos: 'new-comment' (AFTER INSERT) e 'comment-deleted' (AFTER DELETE).
-- Cliente: site/src/components/collective/AnalysisDiscussion.jsx (filtra por
-- collective_analysis_id; decripta E2E no cliente; dedupe por id).
-- Zero-knowledge: se is_encrypted, emite só encrypted_content/nonce e content=NULL.
-- Diagnóstico: new_design/COLLECTIVE_COMENTARIOS_ETAPA1_2026-09-11.md e
--              new_design/COLLECTIVE_COMENTARIOS_ETAPA2_PROPOSTA_2026-09-11.md
-- ============================================================

-- ---------- AFTER INSERT → 'new-comment' ----------
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
$function$;

DROP TRIGGER IF EXISTS broadcast_collective_comment_trigger ON public.collective_comments;
CREATE TRIGGER broadcast_collective_comment_trigger
  AFTER INSERT ON public.collective_comments
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_collective_comment();

-- ---------- AFTER DELETE → 'comment-deleted' ----------
CREATE OR REPLACE FUNCTION public.broadcast_collective_comment_deleted()
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
    WHERE ca.id = OLD.collective_analysis_id;

    IF v_group_id IS NULL THEN
      -- análise já removida (cascade): ninguém está na tela dela; nada a emitir
      RETURN OLD;
    END IF;

    PERFORM realtime.send(
      jsonb_build_object(
        'id',                     OLD.id,
        'collective_analysis_id', OLD.collective_analysis_id,
        'group_id',               v_group_id,
        'parent_id',              OLD.parent_id
      ),
      'comment-deleted',
      'collective:' || v_group_id::text,
      TRUE
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[broadcast_collective_comment_deleted] Failed: %', SQLERRM;
  END;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS broadcast_collective_comment_deleted_trigger ON public.collective_comments;
CREATE TRIGGER broadcast_collective_comment_deleted_trigger
  AFTER DELETE ON public.collective_comments
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_collective_comment_deleted();

-- ============================================================
-- VERIFICAÇÃO (somente SELECT)
-- ============================================================
-- SELECT t.tgname, pg_get_triggerdef(t.oid)
-- FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
-- WHERE c.relname = 'collective_comments' AND NOT t.tgisinternal;
--
-- SELECT topic, event, private, inserted_at, payload->>'collective_analysis_id' AS analysis
-- FROM realtime.messages
-- WHERE topic LIKE 'collective:%' AND event IN ('new-comment','comment-deleted')
-- ORDER BY inserted_at DESC LIMIT 10;

-- ============================================================
-- ESPELHO — trigger existente em public.collective_members (emite 'member-joined'
-- para 'collective:<group_id>'). Encontrada em produção, fora do repo (11/09).
-- Conteúdo = saída de pg_get_triggerdef + pg_get_functiondef (dump A/B do Bob).
-- NÃO reaplicar; documentação apenas.
-- ============================================================
-- <<< PENDENTE: colar aqui o dump A/B quando chegar >>>
