# CRÉDITOS · ETAPA 2-C · Worker: origem em todo confirm, quiz cobra só com pergunta, preâmbulo não varre reserva em voo

**Status:** DIFF para OK do Bob · 07/10/2026 · **nada aplicado**.
**Pré-condição cumprida:** `confirm_reservation` v2 viva em produção desde 07/10 (`CREDITOS_ETAPA2C_CONFIRM_V2_2026-10-06.md` § 9). A chamada atual de 2 args segue válida pelos defaults; este deploy só acrescenta.
**Decisões já dadas (06/10):** A (idade 0→2 nos dois preâmbulos), C (origem dentro da RPC, PATCH fora), adendo (quiz confirma depois da pergunta validada). Nenhuma mudança de comportamento além destas.

---

## 1. Resumo das edições

| # | Arquivo | Edição | Linhas hoje |
|---|---|---|---|
| 1 | `api/src/credits/confirm.js` | 5º parâmetro `{ source, description, batchId }`; RPC recebe `p_source/p_description/p_batch_id`; **remove** o PATCH; exporta `CREDIT_SOURCES` | 1-131 |
| 2 | `api/src/credits/index.js` | re-exporta `CREDIT_SOURCES` | 7 |
| 3 | `api/index.js` | música ×2 e livro ×2: `{ source: 'music'|'book' }`; preâmbulos `0 → 2` | 3134, 3175, 3453, 3463; 2984, 3394 |
| 4 | `api/src/handlers/cinema-analyze.js` | ×3: `{ source: 'cinema', description }` | 118, 160, 429 |
| 5 | `api/src/handlers/news-analyze.js` | ×2: `{ source: 'news', description }` + `user.userId` no 2º | 97, 383 |
| 6 | `api/src/handlers/news-preferences.js` | `{ source: 'news_sources', description }` | 373 |
| 7 | `api/src/handlers/philosopher-panel.js` | `batchId` por painel; `{ source: 'panel', description, batchId }` | 360-367 |
| 8 | `api/src/handlers/colloquium-user.js` | ×5: `source` por ação, `description`, `batchId` nos de N | 637, 781, 923, 1075, 1594 |
| 9 | `api/src/handlers/quiz.js` | confirm **depois** de `getValidatedQuestion` (start e continue); release no caminho sem pergunta; `{ source: 'quiz', description }` | 711-719, 954-960 |
| 10 | `api/src/handlers/spaces.js` | `batchId`; `{ source: 'space', description, batchId }` | 192-195 |
| 11 | `api/src/handlers/unsafe-zone.js` | `confirmAllReservations(env, ids, description, batchId)`; `{ source: 'unsafe_zone', description, batchId }` | 136-144, 446-447 |
| 12 | `api/src/credits/release.js` | comentário morto da linha 5 | 5 |

Sem mudança de rota, resposta ou i18n. `philosopher-panel.test.js` só conta chamadas (`toHaveBeenCalledTimes(3)`), não inspeciona args: segue passando.

## 2. Diffs

### 2.1 `api/src/credits/confirm.js` (arquivo inteiro após a edição)

```js
// ============================================================
// CREDITS - CONFIRM RESERVATION
// ============================================================
// Confirms a reservation. The RPC (confirm_reservation v2, 07 Oct 2026) writes
// the credit_history row itself, including the origin of the charge:
//   metadata.source      — one of CREDIT_SOURCES (closed vocabulary, lives here)
//   metadata.description — free text for the statement (title, thread, session…)
//   metadata.batch_id    — same uuid for the N confirms of one multi-credit action
//   analysis_id          — only when analysisId is a uuid that exists in `analyses`
//   metadata.analysis_id — the raw analysisId as given (book/film/news ids live here)
// No client-side PATCH anymore: the origin can no longer be lost.

import { callRpc } from "../utils/supabase.js";

export const CREDIT_SOURCES = Object.freeze({
  MUSIC: "music",
  BOOK: "book",
  CINEMA: "cinema",
  NEWS: "news",
  NEWS_SOURCES: "news_sources",
  PANEL: "panel",
  COLLOQUIUM_ACCESS: "colloquium_access",
  COLLOQUIUM_PARTICIPATE: "colloquium_participate",
  COLLOQUIUM_PHILOSOPHER: "colloquium_philosopher",
  COLLOQUIUM_PROPOSE: "colloquium_propose",
  OPEN_DEBATE: "open_debate",
  QUIZ: "quiz",
  SPACE: "space",
  UNSAFE_ZONE: "unsafe_zone",
});

/**
 * @param {string}      reservationId
 * @param {string|null} analysisId   uuid of the analysis when there is one; any descriptive id otherwise
 * @param {string|null} userId       kept for logging only
 * @param {object}      origin       { source, description, batchId } — source from CREDIT_SOURCES
 */
export async function confirmReservation(
  env,
  reservationId,
  analysisId,
  userId = null,
  { source = null, description = null, batchId = null } = {},
) {
  if (!source) {
    console.warn(`[Credits] confirmReservation without source: ${reservationId}`);
  }
  console.log(
    `[Credits] Confirming reservation: ${reservationId} -> ${source ?? "?"} / ${analysisId ?? "-"} (user ${userId ?? "-"})`,
  );

  try {
    const result = await callRpc(env, "confirm_reservation", {
      p_reservation_id: reservationId,
      p_analysis_id: analysisId ?? null,
      p_source: source,
      p_description: description,
      p_batch_id: batchId,
    });

    if (!result || !result.success) {
      const errorMsg = result?.message || "Unknown error";
      console.error(`[Credits] Confirmation failed: ${errorMsg}`);
      return { success: false, newTotal: 0, credits: 0, freeRemaining: 0 };
    }

    // The RPC returns (total, purchased, free) — see db/functions/confirm_reservation.sql.
    const newTotal = result.total ?? result.new_total;
    console.log(
      `[Credits] Reservation ${reservationId} confirmed. Balance: ${newTotal}`,
    );
    return {
      success: true,
      newTotal,
      credits: result.purchased ?? result.credits,
      freeRemaining: result.free ?? result.free_remaining,
    };
  } catch (error) {
    // v2 has no outer catch: a real SQL error arrives here with the full SQLERRM.
    console.error(`[Credits] Failed to confirm reservation: ${error.message}`);
    return { success: false, newTotal: 0, credits: 0, freeRemaining: 0 };
  }
}
```

O que sai: `UUID_RE`, `safeAnalysisId`, `description` derivada, `getSupabaseCredentials`, o GET + PATCH em `credit_history` (linhas 48-108). A RPC faz o cast só quando o texto tem forma de uuid, então o worker passa `analysisId` como está.

### 2.2 `api/src/credits/index.js`

```diff
-export { confirmReservation } from "./confirm.js";
+export { confirmReservation, CREDIT_SOURCES } from "./confirm.js";
```

### 2.3 `api/index.js`

Import: acrescentar `CREDIT_SOURCES` onde `confirmReservation` é importado de `./src/credits/index.js`.

```diff
@@ música, cache primeiro-view (3134) e análise nova (3175) @@
               balanceResult = await confirmReservation(
                 env,
                 reservation.reservationId,
                 resultData.id,
                 user.userId,
+                { source: CREDIT_SOURCES.MUSIC, description: `${song} — ${artist}` },
               );
@@ livro, cache primeiro-view (3453) e análise nova (3463) @@
-              balanceResult = await confirmReservation(env, reservation.reservationId, resultData.id, user.userId);
+              balanceResult = await confirmReservation(env, reservation.reservationId, resultData.id, user.userId, {
+                source: CREDIT_SOURCES.BOOK,
+                description: `${title} — ${author}`,
+              });
@@ preâmbulo música (2984) e livro (3394) — decisão A @@
-        // Using 0 minutes ensures cancelled request reservations are freed immediately
-        // so the user isn't double-charged on retry
-        await cleanupUserStaleReservations(env, user.userId, 0);
+        // 2 minutes (not 0): 0 swept reservations still IN FLIGHT from another feature
+        // (e.g. the 3 panel credits) and the later confirm failed. Trade-off accepted
+        // 06 Oct 2026: an orphan from an aborted attempt may hold 1 credit for up to
+        // 2 min on an immediate retry. Explicit cancel (/api/cancel-book-analysis) keeps 0.
+        await cleanupUserStaleReservations(env, user.userId, 2);
```

`song`/`artist` (rota de música) e `title`/`author` (rota de livro) são as variáveis do corpo da requisição já em escopo nos dois handlers (`api/index.js:3015,3399`); o retorno do orchestrator não traz `title`.

### 2.4 `api/src/handlers/cinema-analyze.js`

```diff
@@ 118 @@
-              await confirmReservation(env, reservation.reservationId, analysisIdToLog, userId);
+              await confirmReservation(env, reservation.reservationId, analysisIdToLog, userId, {
+                source: CREDIT_SOURCES.CINEMA, description: title,
+              });
@@ 160 @@
-        await confirmReservation(env, reservation.reservationId, analysis.id, userId);
+        await confirmReservation(env, reservation.reservationId, analysis.id, userId, {
+          source: CREDIT_SOURCES.CINEMA, description: title,
+        });
@@ 429 @@
         await confirmReservation(
           env,
           reservation.reservationId,
-          savedRecord?.id || `cinema-analysis:${title.substring(0, 50)}`,
+          savedRecord?.id || null,
           userId,
+          { source: CREDIT_SOURCES.CINEMA, description: title },
         );
```

O id de `film_analyses` continua indo em `analysisId`: a v2 guarda o texto em `metadata.analysis_id` e não força a FK. `title` vem do body (`cinema-analyze.js:48`) e está em escopo nos 3 pontos.

### 2.5 `api/src/handlers/news-analyze.js`

```diff
@@ 97 @@
-              await confirmReservation(env, reservation.reservationId, result.id, user.userId);
+              await confirmReservation(env, reservation.reservationId, result.id, user.userId, {
+                source: CREDIT_SOURCES.NEWS, description: title,
+              });
@@ 383 @@
-      await confirmReservation(env, reservation.reservationId, `news-analysis:${title.substring(0, 50)}`);
+      await confirmReservation(env, reservation.reservationId, result?.id || null, user.userId, {
+        source: CREDIT_SOURCES.NEWS, description: title,
+      });
```

### 2.6 `api/src/handlers/news-preferences.js`

```diff
       const confirm = await confirmReservation(
         env,
         reservation.reservationId,
-        "News source customization unlock"
+        null,
+        user.userId,
+        { source: CREDIT_SOURCES.NEWS_SOURCES, description: "News source customization unlock" },
       );
```

### 2.7 `api/src/handlers/philosopher-panel.js`

```diff
       // ── Confirm all credits ──
       let lastConfirm;
-      const panelDesc = `Panel: ${title.substring(0, 60)} (${mediaType})`;
+      const panelDesc = `${title.substring(0, 60)} (${mediaType})`;
+      const batchId = crypto.randomUUID(); // one statement group for the 3 credits
       for (const res of reservations) {
         lastConfirm = await confirmReservation(
           env,
           res.reservationId,
-          panelDesc,
+          panelId,
           userId,
+          { source: CREDIT_SOURCES.PANEL, description: panelDesc, batchId },
         );
       }
```

`panelId` é `crypto.randomUUID()` (`philosopher-panel.js:296`), id do painel em KV/`panel_analyses`; não existe em `analyses`, então a v2 deixa a FK NULL e guarda o texto em `metadata.analysis_id`.

### 2.8 `api/src/handlers/colloquium-user.js`

```diff
@@ 637 acesso (1 crédito) @@
       const confirmed = await confirmReservation(
         env,
         reservation.reservationId,
-        `colloquium:access:${threadId}`,
+        null,
+        userId,
+        { source: CREDIT_SOURCES.COLLOQUIUM_ACCESS, description: `thread:${threadId}` },
       );
@@ 781 participar (1-2) @@
       let lastConfirm;
+      const batchId = crypto.randomUUID();
       for (const res of reservations) {
         lastConfirm = await confirmReservation(
           env,
           res.reservationId,
-          `colloquium:participate:${threadId}`,
+          null,
+          userId,
+          { source: CREDIT_SOURCES.COLLOQUIUM_PARTICIPATE, description: `thread:${threadId}`, batchId },
         );
       }
@@ 923 filósofo (preço) @@
       let lastConfirm;
+      const batchId = crypto.randomUUID();
       for (const res of reservations) {
         lastConfirm = await confirmReservation(
           env,
           res.reservationId,
-          `colloquium:philosopher:${threadId}:${philosopher.name}`,
+          null,
+          userId,
+          { source: CREDIT_SOURCES.COLLOQUIUM_PHILOSOPHER, description: `${philosopher.name} · thread:${threadId}`, batchId },
         );
       }
@@ 1075 propor (1-2) @@
       let lastConfirm;
+      const batchId = crypto.randomUUID();
       for (const res of reservations) {
         lastConfirm = await confirmReservation(
           env,
           res.reservationId,
-          `colloquium:propose:${result.threadId}`,
+          null,
+          userId,
+          { source: CREDIT_SOURCES.COLLOQUIUM_PROPOSE, description: `thread:${result.threadId}`, batchId },
         );
       }
@@ 1594 debate aberto (N) @@
       let lastConfirm;
+      const batchId = crypto.randomUUID();
       for (const res of reservations) {
         lastConfirm = await confirmReservation(
           env,
           res.reservationId,
-          `colloquium:open-debate:${thread.id}`,
+          null,
+          userId,
+          { source: CREDIT_SOURCES.OPEN_DEBATE, description: `thread:${thread.id}`, batchId },
         );
       }
```

### 2.9 `api/src/handlers/quiz.js` (adendo do Bob)

```diff
@@ start, 711-719 @@
-    await confirmReservation(env, reservation.reservationId, `quiz:start:${session.id}`);
-
     const allExcluded = await getExcludedQuestionIds(supabase, user.userId);

     const validated = await getValidatedQuestion(supabase, env, user.userId, 1, lang, allExcluded, 0, null);

     if (!validated) {
       await releaseReservation(env, reservation.reservationId, 'quiz-no-valid-questions');
       return errorResponse('No questions available', 500, origin, env);
     }
+
+    // Charge only once a question exists (27 Aug finding 5: confirm-then-release charged without a quiz)
+    await confirmReservation(env, reservation.reservationId, null, user.userId, {
+      source: CREDIT_SOURCES.QUIZ, description: `start:${session.id}`,
+    });
@@ continue, 954-960 @@
-    await confirmReservation(env, reservation.reservationId, `quiz:continue:${sessionId}`);
-
     const allExcluded = await getExcludedQuestionIds(supabase, user.userId, session.answered_question_ids || []);
     const questionNum = (session.answered_question_ids || []).length;

     const validated = await getValidatedQuestion(supabase, env, user.userId, session.current_difficulty, lang, allExcluded, questionNum, session.question_option_maps);
-    if (!validated) return errorResponse('No more questions available', 500, origin, env);
+    if (!validated) {
+      await releaseReservation(env, reservation.reservationId, 'quiz-no-valid-questions');
+      return errorResponse('No more questions available', 500, origin, env);
+    }
+
+    await confirmReservation(env, reservation.reservationId, null, user.userId, {
+      source: CREDIT_SOURCES.QUIZ, description: `continue:${sessionId}`,
+    });
```

O `continue` hoje nem libera no caminho sem pergunta (linha 960): crédito cobrado, reserva confirmada, nada entregue. Mesmo defeito do `start`, corrigido junto. A sessão do quiz já foi criada antes (`credits_spent: 1`); se o Bob quiser, o caminho sem pergunta também apaga a sessão recém-criada, mas isso é comportamento novo e fica fora deste diff.

### 2.10 `api/src/handlers/spaces.js`

```diff
       // Confirm all credits
+      const batchId = crypto.randomUUID();
       for (const r of reservations) {
-        await confirmReservation(env, r.reservationId, `space:${space}`);
+        await confirmReservation(env, r.reservationId, null, userId, {
+          source: CREDIT_SOURCES.SPACE, description: space, batchId,
+        });
       }
```

### 2.11 `api/src/handlers/unsafe-zone.js`

```diff
-async function confirmAllReservations(env, reservationIds, description) {
+async function confirmAllReservations(env, userId, reservationIds, description) {
+  const batchId = crypto.randomUUID();
   for (const id of reservationIds) {
     try {
-      await confirmReservation(env, id, description);
+      await confirmReservation(env, id, null, userId, {
+        source: CREDIT_SOURCES.UNSAFE_ZONE, description, batchId,
+      });
@@ 446-447 @@
-    const description = `unsafe-zone:${turnInfo.isFirstTurn ? 'start' : 'extension'}:${session.id}`;
-    await confirmAllReservations(env, reservationIds, description);
+    const description = `${turnInfo.isFirstTurn ? 'start' : 'extension'}:${session.id}`;
+    await confirmAllReservations(env, user.userId, reservationIds, description);
```

### 2.12 `api/src/credits/release.js`

```diff
-// Releases reservation and returns credit to user.
-// Does NOT write to credit_history (internal audit only).
+// Releases reservation and returns credit to user. Since 29 Aug (release_reservation)
+// and 06 Oct 2026 (both reapers) every refund writes a type='refund' row to credit_history.
```

## 3. Verificação antes do deploy

1. `cd api && npx vitest run` (cobre `philosopher-panel.test.js`, que conta 3 confirms).
2. Grep de segurança: nenhum `confirmReservation(` sem 5º argumento fora de `confirm.js` e do teste; nenhum `getSupabaseCredentials` em `confirm.js`; nenhum `cleanupUserStaleReservations(env, user.userId, 0)` além do cancel explícito (`api/index.js:761`).
3. `npx wrangler deploy --dry-run --env production` (bundle fecha, sem subir).

## 4. Deploy e aceite

Comando para o Bob rodar (a sessão bloqueia deploy por padrão):

```
cd api && npx wrangler deploy --env production
```

Aceite (produção, conta do Bob; cada passo gera uma linha nova em `credit_history`):

| Passo | O que fazer | O que conferir no SQL Editor (`SELECT type, amount, analysis_id, metadata, created_at FROM credit_history WHERE user_id = '<uid>' ORDER BY created_at DESC LIMIT 10`) |
|---|---|---|
| 1 | Quiz: iniciar | linha `analysis` com `metadata.source = 'quiz'`, `description = 'start:<sessão>'`, criada **depois** da pergunta aparecer |
| 2 | Cinema ou livro com cache (primeiro view) | linha com `source = 'cinema'|'book'`, `analysis_id` **NULL** (FK), `metadata.analysis_id` com o uuid da outra tabela; **saldo debitado e reserva `confirmed`** (antes: `pending` → reaper devolvia) |
| 3 | Música nova ou cache | `source = 'music'`, `analysis_id` preenchido (existe em `analyses`) |
| 4 | Painel (3 créditos) | 3 linhas com o **mesmo** `metadata.batch_id`, `source = 'panel'` |
| 5 | `wrangler tail` durante os passos | nenhum `[Credits] confirmReservation without source`; nenhum `Confirmation failed` |

Rollback: `cd api && npx wrangler rollback` (worker anterior chama a v2 com 2 args, válido). A RPC fica.

## 5. Depois do aceite (por ordem)

Commit `creditos: origem em todo confirm, quiz cobra so com pergunta, preambulo nao varre reserva em voo` com os 12 arquivos + este md. O commit do banco (`db: confirm_reservation v2 grava origem do consumo (source, description, batch)`: espelho, inventário, md da 2-C, auditoria, status) pode sair **antes**, assim que o Bob ordenar; são independentes.

## 6. Registro

| Passo | Data | Resultado |
|---|---|---|
| Diff redigido | 07/10 | este arquivo; nada aplicado |
| OK do Bob | — | — |
| Aplicado + vitest + dry-run | — | — |
| Deploy (comando do Bob) | — | — |
| Aceite | — | — |
| Commit | — | — |
