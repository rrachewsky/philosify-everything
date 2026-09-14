# Collective — comentários ao vivo: Etapa 2 (proposta para OK) · 11/09

**Status:** PROPOSTA — nada aplicado (nem no banco, nem em `migrations/`, nem no site).
**Base:** `COLLECTIVE_COMENTARIOS_ETAPA1_2026-09-11.md` (aceito pelo Bob).
**Regra mantida:** Ágora, Underground e DM intocáveis — nenhum arquivo deles é tocado.
**Pendência de entrada:** os dumps A–E **não vieram anexados** na mensagem. O item 3 (espelho da trigger de
`collective_members`) fica com placeholder até o dump A/B chegar; os itens 1 e 2 não dependem dele.

---

## 1. SQL — triggers em `collective_comments` (padrão `broadcast_underground_post`)

Arquivo proposto: **`migrations/collective_comments_realtime_broadcast.sql`**. Mesmo molde de
`migrations/broadcast_underground_post.sql`: `SECURITY DEFINER`, `search_path=''`, `realtime.send(payload, evento,
tópico, TRUE)` dentro de `BEGIN … EXCEPTION WHEN OTHERS THEN RAISE WARNING` (nunca derruba o INSERT/DELETE).

Decisões embutidas:
- **Tópico** `'collective:' || group_id` — o mesmo que a policy definer de 06/09 autoriza e em que o
  `member-joined` já trafega. `group_id` vem de `collective_analyses` (não existe na linha do comentário).
- **Payload snake_case** (como o Underground; o cliente mapeia para camelCase). Inclui `collective_analysis_id`
  para a tela filtrar por análise (tópico é por grupo) e `user_id` para o cliente calcular `isMine`.
- **Zero-knowledge preservado:** se `is_encrypted`, emite só `encrypted_content`/`nonce` e `content = NULL`
  (o mesmo que o handler faz na resposta, `collective-comments.js:275-282`); se plaintext, emite `content`.
- **Sem grupo resolvido** (análise apagada em cascata etc.) → só `RAISE WARNING` e retorna; não emite tópico vazio.

```sql
-- ============================================================
-- collective_comments — broadcast de realtime (Collective: comentários em análises)
-- ------------------------------------------------------------
-- Padrão: migrations/broadcast_underground_post.sql (SECURITY DEFINER, search_path='',
-- realtime.send(..., private=TRUE), EXCEPTION não-bloqueante).
-- Tópico: 'collective:<group_id>' — autorizado pela policy definer de realtime.messages
-- (is_collective_member, 06/09), já comprovado em produção pelo evento 'member-joined'.
-- group_id NÃO está em collective_comments: resolvido via collective_analyses.
-- Eventos: 'new-comment' (AFTER INSERT) e 'comment-deleted' (AFTER DELETE).
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
```

**Verificação pós-aplicação (somente SELECT):**
```sql
-- triggers instaladas
SELECT t.tgname, pg_get_triggerdef(t.oid)
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'collective_comments' AND NOT t.tgisinternal;

-- após postar um comentário de teste: linha deve aparecer aqui
SELECT topic, event, private, inserted_at, payload->>'collective_analysis_id' AS analysis
FROM realtime.messages
WHERE topic LIKE 'collective:%' AND event IN ('new-comment','comment-deleted')
ORDER BY inserted_at DESC LIMIT 10;
```

Observação sobre o DELETE: `handleDeleteComment` apaga por REST com service-role (`collective-comments.js:326-343`);
trigger `AFTER DELETE` dispara do mesmo jeito. Apagar um comentário-pai com replies em cascata dispara uma vez por
linha — o cliente já remove pai e filhos ao receber o id do pai (filtro por `id` e `parentId`).

---

## 2. Diff do cliente — `site/src/components/collective/AnalysisDiscussion.jsx`

Padrão `useUnderground.js:42-97`: `waitForAuth → getRealtimeClient → channel(private) → on(...) → subscribe`,
com `cancelled` flag e `removeChannel` no cleanup. Assina **depois** que `loadData` conhece o `groupId`.
Handlers só mexem no estado (sem re-fetch). Dedupe por `id` cobre o eco local do remetente. Decriptação usa
`cryptoService.decryptCollectiveMessage(encryptedContent, nonce, groupId)` — a mesma função que o serviço usa em
`decryptCommentIfNeeded` (`collective.js:137-166`), reproduzida aqui porque ela é privada do módulo.

```diff
--- a/site/src/components/collective/AnalysisDiscussion.jsx
+++ b/site/src/components/collective/AnalysisDiscussion.jsx
@@ -1,9 +1,12 @@
 // AnalysisDiscussion - View analysis details and comment thread
 // Shows analysis info at top with 2-level threaded comments below
-import { useState, useEffect, useCallback } from 'react';
+import { useState, useEffect, useCallback, useRef } from 'react';
 import { useTranslation } from 'react-i18next';
 import { collectiveService } from '../../services/api/collective.js';
+import * as cryptoService from '@/services/crypto';
+import { useAuth } from '../../hooks/useAuth.js';
+import { getRealtimeClient, waitForAuth } from '../../services/realtime.js';
 import { CommentThread } from './CommentThread.jsx';
 import { ConfirmModal } from '../common/ConfirmModal.jsx';

 const MAX_COMMENT_LENGTH = 2000;
@@ -26,6 +29,7 @@ function calculatePhilosophicalNote(finalScore) {

 export function AnalysisDiscussion({ collectiveAnalysisId, onBack, onUserClick }) {
   const { t } = useTranslation();
+  const { user } = useAuth();
   const [analysis, setAnalysis] = useState(null);
   const [groupId, setGroupId] = useState(null); // For E2E encryption
   const [comments, setComments] = useState([]);
@@ -35,6 +39,8 @@ export function AnalysisDiscussion({ collectiveAnalysisId, onBack, onUserClick }
   const [sending, setSending] = useState(false);
   const [replyingTo, setReplyingTo] = useState(null); // { id, displayName }
   const [deleteTarget, setDeleteTarget] = useState(null); // commentId to delete
+  const channelRef = useRef(null);
+  const clientRef = useRef(null);

   // Load analysis and comments (with E2E decryption)
   const loadData = useCallback(async () => {
@@ -56,6 +62,86 @@ export function AnalysisDiscussion({ collectiveAnalysisId, onBack, onUserClick }
     loadData();
   }, [loadData]);

+  // Realtime: comentários ao vivo no tópico privado do grupo (padrão useUnderground).
+  // A trigger AFTER INSERT em collective_comments emite 'new-comment' (snake_case) para
+  // 'collective:<groupId>'; AFTER DELETE emite 'comment-deleted'. O tópico é por grupo,
+  // então filtramos por collective_analysis_id. Sem re-fetch: só estado local.
+  useEffect(() => {
+    if (!groupId || !collectiveAnalysisId) return;
+
+    let cancelled = false;
+
+    async function initRealtime() {
+      try {
+        await waitForAuth(); // token antes de assinar canal privado
+        if (cancelled) return;
+
+        const sb = await getRealtimeClient();
+        if (cancelled) return;
+        clientRef.current = sb;
+
+        const channel = sb
+          .channel(`collective:${groupId}`, { config: { private: true } })
+          .on('broadcast', { event: 'new-comment' }, async ({ payload }) => {
+            if (!payload || payload.collective_analysis_id !== collectiveAnalysisId) return;
+
+            // Mapeia snake_case da trigger para o shape que CommentThread consome
+            const incoming = {
+              id: payload.id,
+              userId: payload.user_id,
+              parentId: payload.parent_id,
+              displayName: payload.display_name,
+              isEncrypted: !!payload.is_encrypted,
+              encryptedContent: payload.is_encrypted ? payload.encrypted_content : null,
+              nonce: payload.is_encrypted ? payload.nonce : null,
+              createdAt: payload.created_at,
+              isMine: !!user?.id && payload.user_id === user.id,
+              content: payload.is_encrypted ? null : payload.content,
+            };
+
+            // E2E: payload traz só ciphertext — decripta aqui (mesma função do serviço)
+            if (incoming.isEncrypted) {
+              const decrypted = await cryptoService.decryptCollectiveMessage(
+                incoming.encryptedContent,
+                incoming.nonce,
+                groupId
+              );
+              if (decrypted) {
+                incoming.content = decrypted;
+                incoming.decrypted = true;
+              } else {
+                incoming.content = '[Unable to decrypt]';
+                incoming.decryptionFailed = true;
+              }
+            }
+            if (cancelled) return;
+
+            setComments((prev) => {
+              if (prev.some((c) => c.id === incoming.id)) return prev; // eco do remetente
+              return [...prev, incoming];
+            });
+          })
+          .on('broadcast', { event: 'comment-deleted' }, ({ payload }) => {
+            if (!payload || payload.collective_analysis_id !== collectiveAnalysisId) return;
+            setComments((prev) =>
+              prev.filter((c) => c.id !== payload.id && c.parentId !== payload.id)
+            );
+          })
+          .subscribe((status, err) => {
+            console.log(
+              '[AnalysisDiscussion] Subscription status:',
+              status,
+              err ? `error: ${err.message}` : ''
+            );
+          });
+
+        channelRef.current = channel;
+      } catch (err) {
+        console.error('[AnalysisDiscussion] Realtime init error:', err);
+      }
+    }
+
+    initRealtime();
+
+    return () => {
+      cancelled = true;
+      if (channelRef.current && clientRef.current) {
+        clientRef.current.removeChannel(channelRef.current);
+      }
+      channelRef.current = null;
+    };
+  }, [groupId, collectiveAnalysisId, user?.id]);
+
   // Submit a new comment or reply (with E2E encryption)
   const handleSubmit = async () => {
     const content = newComment.trim();
```

Notas do diff:
- `@/services/crypto` é o mesmo alias já usado por `useUnderground.js:9` e `services/api/collective.js:14`.
- `useAuth` só fornece `user.id` para `isMine` (botão de apagar). Sem `user`, `isMine=false` — seguro.
- Dependência `user?.id` no effect: se a sessão mudar, reassina; na prática não muda com a tela aberta.
- Nada muda em `CommentThread.jsx`, no serviço nem no handler.

---

## 3. Migração versionando as duas triggers + registro do Bloco 3

**Arquivo:** `migrations/collective_comments_realtime_broadcast.sql` (item 1) — a parte nova.

**Espelho da trigger de `collective_members` (`member-joined`):** vai no **mesmo arquivo**, numa seção
`-- ESPELHO (não reaplicar): trigger existente em collective_members`, **byte-a-byte do dump A/B**. Como o dump não
chegou, o espaço fica assim até você colar:

```sql
-- ============================================================
-- ESPELHO — trigger existente em public.collective_members (emite 'member-joined'
-- para 'collective:<group_id>'). Encontrada em produção, fora do repo (11/09).
-- Conteúdo = saída de pg_get_triggerdef + pg_get_functiondef (dump A/B).
-- NÃO reaplicar; documentação apenas.
-- ============================================================
-- <<< COLAR AQUI O DUMP A/B >>>
```

(Se preferir o padrão de `db/functions/`, o corpo da função vai também em
`db/functions/<nome_da_funcao>.sql` — mesmo tratamento de `release_reservation`.)

**Registro para o Bloco 3 (limpeza do caminho morto — NÃO executar agora):**

| # | Item | Onde | Ação futura |
|---|---|---|---|
| 1 | Trigger órfã criada em `group_chat_messages` (preparada-para-nada) | banco | `DROP TRIGGER` + `DROP FUNCTION` (nome: pegar do dump B) |
| 2 | Tabelas legadas `analysis_groups`, `group_members`, `group_chat_messages` | banco | confirmar vazias (dump) → `DROP` |
| 3 | Handler `api/src/handlers/groups.js` | worker | remover arquivo |
| 4 | Rotas `/api/groups*` | `api/index.js:1078-1121` + import `:116-125` | remover |
| 5 | `site/src/services/api/groups.js` (`groupsService`) | site | remover (sem importadores) |
| 6 | `site/src/hooks/useCollective.js` + export `hooks/index.js:14` | site | remover (dead code; chama funções inexistentes) |

O Bloco 3 ganha seu próprio arquivo quando for a vez; aqui é só o registro.

---

## 4. Aceite proposto (duas janelas, mesma análise do Coletivo)

1. Aplicar item 1 no SQL Editor (após OK). Rodar a verificação de triggers.
2. Deploy do site com o diff do item 2 (`npm run build` + `wrangler pages deploy dist --project-name=philosify-frontend
   --branch=production`).
3. Chrome e Edge, contas diferentes, mesma discussão aberta. Comentar no Chrome → **aparece no Edge sem F5**;
   responder no Edge → aparece no Chrome. Apagar no Chrome → some no Edge.
4. Console do receptor: `[AnalysisDiscussion] Subscription status: SUBSCRIBED`.
5. `realtime.messages`: linhas `collective:<gid>` / `new-comment` (e `comment-deleted`).
6. Negativo: conta **não-membro** não recebe (policy definer devolve false).
7. Ágora, Underground e DM: smoke rápido de que nada mudou (nenhum arquivo deles foi tocado).

## Fora de escopo (por regra)
Sem alteração em Ágora/Underground/DM; sem mexer no handler de comentários; sem deletar nada do caminho morto.
