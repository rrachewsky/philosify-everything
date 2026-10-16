# POLIMENTO · P1 · `colloquium.js` — fim das escritas manuais de `reply_count`

**Status:** DIFF PARA OK do Bob · 13/10/2026 · aplicado **só no working tree** (nada commitado, nada em produção; `git checkout -- api/` desfaz).
**Origem:** colateral do V1 (`VASSOURA_2026-10-12_V1_FORUM_REPLY_COUNT.md` § 1.4): a trigger única `update_thread_reply_stats` é a dona do contador desde 12/10; o código ainda escrevia `reply_count` à mão.

---

## 1. Achado ao abrir o arquivo: são OITO escritas, não quatro

O grep do V1 estava cortado em 12 linhas. Todas as escritas de `reply_count` em `forum_threads` no worker estão em `colloquium.js` (`forum.js` e `colloquium-user.js` só leem):

| Linha (antes) | Função | Escrita | Efeito com a trigger |
|---|---|---|---|
| 3927 | `generateAllPhilosopherReplies` | `reply_count: succeeded` (absoluto) | sobrescreve o valor da trigger pelo mesmo valor; redundante |
| 4092 | `generateAllPhilosopherRebuttals` | lê `reply_count` **depois** dos inserts e grava `existingCount + succeeded` | soma a contagem da trigger à dela: lote contado 2× |
| 4330 | `createColloquium` | `reply_count: 2` (absoluto) | correto só se há exatamente 2 replies; a trigger já fez isso |
| 4511 | `addPhilosopherReply` | `(existingReplies).length + 1` | redundante; +1 a mais se `existingReplies` vier depois do insert |
| 4714 | `createUserColloquium` | `reply_count: selectedPhilosophers.length` (absoluto) | conta filósofos selecionados, não replies inseridas (falhas não descontam) |
| 5081 | `generateImmediateFirstReply` | `reply_count: 1` (absoluto) | zera qualquer reply anterior do usuário para 1 |
| 5279 | `checkPendingUserProposedReplies` (resposta escalonada) | `existingReplies.length + 1` | redundante |
| 5502 | `checkPendingUserProposedReplies` (resposta pendente) | lê `reply_count` e grava `freshCount + 1` | soma a contagem da trigger à dela: 2× |

A assinatura "+1 fixo" da amostra do pré-flight de 12/10 (15 colóquios) casa com as escritas absolutas que contam o que não é reply, ou com o +1 depois de a trigger já ter contado.

## 2. O que o diff faz

- Remove as 8 escritas de `reply_count`. **Tudo o mais nos mesmos PATCHes fica:** `last_reply_at` (redundante com a trigger, inofensivo; preservado como pedido) e `metadata` (`philosopher_index`, `next_philosopher_at`, `rebuttals_complete`, `pending_responses`).
- Remove as duas leituras que só existiam para o contador (`existingCount` em 4085, `freshCount` em 5495) e tira `reply_count` dos dois `select` correspondentes; os GET continuam porque `metadata` é usada.
- Comentário no primeiro ponto explicando a propriedade do contador; nos outros, uma nota curta.
- 11 substituições; 0 escritas de `reply_count` restantes (as 3 ocorrências que sobram são comentários).

## 3. Verificação local

| Passo | Resultado |
|---|---|
| `node --check colloquium.js` | OK |
| vitest (api) | 14 arquivos, 168 testes, 0 falhas |
| `wrangler deploy --dry-run --env production` | OK |
| `git diff --stat` | 1 arquivo, +9 / −20 |

## 4. Após o deploy: SQL de correção final (gated, para o Bob)

Os colóquios criados entre a migração do V1 (12/10) e este deploy podem ter recebido +1 de novo pelas escritas absolutas. Mesma forma do V1b, uma transação:

```sql
-- P1 CORREÇÃO FINAL — rodar DEPOIS do deploy do worker. Uma transação.
BEGIN;

-- (a) quantas divergem antes
WITH real AS (SELECT thread_id, count(*) AS n FROM public.forum_replies GROUP BY thread_id)
SELECT count(*) FILTER (WHERE t.reply_count <> COALESCE(r.n, 0)) AS divergentes_antes,
       sum(t.reply_count) AS soma_contadores, sum(COALESCE(r.n, 0)) AS soma_real
FROM public.forum_threads t LEFT JOIN real r ON r.thread_id = t.id;

-- (b) iguala à contagem real
UPDATE public.forum_threads t
SET    reply_count = r.n
FROM   (SELECT thread_id, count(*) AS n FROM public.forum_replies GROUP BY thread_id) r
WHERE  r.thread_id = t.id AND t.reply_count <> r.n;

UPDATE public.forum_threads t
SET    reply_count = 0
WHERE  t.reply_count <> 0
  AND  NOT EXISTS (SELECT 1 FROM public.forum_replies fr WHERE fr.thread_id = t.id);

-- (c) verificação (esperado 0)
WITH real AS (SELECT thread_id, count(*) AS n FROM public.forum_replies GROUP BY thread_id)
SELECT count(*) AS divergentes_depois
FROM public.forum_threads t LEFT JOIN real r ON r.thread_id = t.id
WHERE t.reply_count <> COALESCE(r.n, 0);

COMMIT;  -- ou ROLLBACK;
```

## 5. Diff (working tree, `git diff` em 13/10/2026)

```diff
diff --git a/api/src/handlers/colloquium.js b/api/src/handlers/colloquium.js
index ea66480..f2345c8 100644
--- a/api/src/handlers/colloquium.js
+++ b/api/src/handlers/colloquium.js
@@ -3920,11 +3920,13 @@ export async function generateAllPhilosopherReplies(
     }
   }
 
-  // Update reply count
+  // Touch last_reply_at only. reply_count is OWNED by the forum_replies trigger
+  // (update_thread_reply_stats, single since 12/10/2026): every manual write here
+  // either double-counted the trigger or counted the opening post as a reply
+  // (P1, new_design/POLIMENTO_2026-10-13_P1_COLLOQUIUM_REPLY_COUNT.md).
   await pg(env, "PATCH", "forum_threads", {
     filter: `id=eq.${threadId}`,
     body: {
-      reply_count: succeeded,
       last_reply_at: new Date().toISOString(),
     },
   });
@@ -4074,22 +4076,19 @@ export async function generateAllPhilosopherRebuttals(
     (r) => r.status === "fulfilled" && r.value?.success,
   ).length;
 
-  // Update reply count and mark rebuttals complete
+  // Mark rebuttals complete (reply_count: trigger-owned, see generateAllPhilosopherReplies)
   const currentThread = await pg(env, "GET", "forum_threads", {
     filter: `id=eq.${threadId}`,
-    select: "reply_count,metadata",
+    select: "metadata",
     limit: 1,
   });
 
-  const existingCount =
-    currentThread && currentThread[0] ? currentThread[0].reply_count || 0 : 0;
   const existingMeta =
     currentThread && currentThread[0] ? currentThread[0].metadata || {} : {};
 
   await pg(env, "PATCH", "forum_threads", {
     filter: `id=eq.${threadId}`,
     body: {
-      reply_count: existingCount + succeeded,
       last_reply_at: new Date().toISOString(),
       metadata: {
         ...existingMeta,
@@ -4327,7 +4326,6 @@ async function createColloquium(env) {
           },
         },
       },
-      reply_count: 2,
     },
   });
 
@@ -4499,7 +4497,7 @@ async function addPhilosopherReply(env) {
     // Notify frontend of new reply
     await broadcastColloquiumEvent(env, thread.id, "new-reply");
 
-    // Update philosopher_index and reply_count
+    // Update philosopher_index (reply_count: trigger-owned)
     // Use currentIndex (which may have skipped user-added philosophers)
     await pg(env, "PATCH", "forum_threads", {
       filter: `id=eq.${thread.id}`,
@@ -4508,7 +4506,6 @@ async function addPhilosopherReply(env) {
           ...metadata,
           philosopher_index: currentIndex + 1,
         },
-        reply_count: (existingReplies || []).length + 1,
         last_reply_at: new Date().toISOString(),
       },
     });
@@ -4707,11 +4704,10 @@ export async function createUserColloquium(
     }
   }
 
-  // Update reply count
+  // Touch last_reply_at only (reply_count: trigger-owned)
   await pg(env, "PATCH", "forum_threads", {
     filter: `id=eq.${thread.id}`,
     body: {
-      reply_count: selectedPhilosophers.length,
       last_reply_at: new Date().toISOString(),
     },
   });
@@ -5078,7 +5074,6 @@ export async function generateImmediateFirstReply(env, threadId) {
             ? true
             : freshMeta.rebuttals_complete,
       },
-      reply_count: 1,
       last_reply_at: new Date().toISOString(),
     },
   });
@@ -5276,7 +5271,6 @@ export async function checkPendingUserProposedReplies(env) {
                       ? true
                       : meta.rebuttals_complete,
                 },
-                reply_count: existingReplies.length + 1,
                 last_reply_at: new Date().toISOString(),
               },
             });
@@ -5483,23 +5477,18 @@ export async function checkPendingUserProposedReplies(env) {
             // Re-read thread metadata to avoid stale overwrites
             const freshThread = await pg(env, "GET", "forum_threads", {
               filter: `id=eq.${thread.id}`,
-              select: "metadata,reply_count",
+              select: "metadata",
               limit: 1,
             });
             const freshMeta =
               freshThread && freshThread[0]
                 ? freshThread[0].metadata || {}
                 : meta;
-            const freshCount =
-              freshThread && freshThread[0]
-                ? freshThread[0].reply_count || 0
-                : 0;
 
             await pg(env, "PATCH", "forum_threads", {
               filter: `id=eq.${thread.id}`,
               body: {
                 metadata: { ...freshMeta, pending_responses: updatedPR },
-                reply_count: freshCount + 1,
                 last_reply_at: new Date().toISOString(),
               },
             });
```

## 6. Registro

| Passo | Data | Resultado |
|---|---|---|
| Diff aplicado no working tree + vitest + dry-run | 13/10 | este arquivo |
| OK do Bob no diff | 15/10 | aprovado: 8 escritas fora, last_reply_at e metadata preservados |
| Deploy worker | 15/10 | wrangler deploy --env production pelo comando do Bob; /api/health ok (version ID no chat) |
| SQL de correção final (Bob) | 15/10 | correção desnecessária: saída (a) divergentes_antes = 0, somas 618 = 618; nenhum colóquio divergiu entre o V1b e o deploy; UPDATE não executado |
| Commit + push | 16/10 | ACEITE do Bob · commit colloquium: trigger e dona do reply_count (o commit que traz esta linha) |
