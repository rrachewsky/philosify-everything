# VASSOURA · V1 · `forum_replies` com trigger dupla — diagnóstico + migração gated

**Status:** RESOLVIDO · banco migrado e provado pelo Bob em 12/10/2026 · espelhos e inventário atualizados em 13/10 (V1c).
**Fila:** inventário de 22/09 (`db/INVENTARIO_2026-09-22.md:188`, "Fila de decisão" item 1 das triggers).

---

## 1. Diagnóstico (V1a)

### 1.1 As duas triggers (espelhos `db/triggers/`, dump de 22/09 via `pg_get_triggerdef`)

| Trigger | Definição | Função |
|---|---|---|
| `trg_update_thread_reply_stats` | `AFTER INSERT OR DELETE ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION update_thread_reply_stats()` | `db/functions/update_thread_reply_stats.sql` |
| `trigger_update_thread_stats` | **idêntica**, mesma tabela, mesmos eventos, mesma função | idem |

A função (`update_thread_reply_stats`, 575 bytes, `SET search_path TO 'public'`): em INSERT faz `reply_count = reply_count + 1` e `last_reply_at = NEW.created_at`; em DELETE faz `reply_count = GREATEST(reply_count − 1, 0)` e recalcula `last_reply_at` pelo `MAX(created_at)` restante. Duas triggers → **cada INSERT soma 2, cada DELETE subtrai 2** (com piso em 0, o que ainda deixa resíduo quando o par insert/delete não é simétrico).

### 1.2 Desde quando

**Não há história no repo.** Nenhuma migração versionada cria qualquer das duas (`grep` em `migrations/`, `database/`, `api/`, `*.sql`: os nomes só aparecem nos espelhos de 28/09 e no inventário). O próprio esquema de `forum_threads`/`forum_replies` não está versionado: só policies e a função espelhadas. Logo as duas nasceram **direto no SQL Editor**, provavelmente a mesma migração colada duas vezes com nomes diferentes (uma com o prefixo `trg_` igual ao nome da função, outra com `trigger_` e o nome encurtado). O inventário de 22/09 é o primeiro registro das duas; a idade real só o banco sabe: o **oid** de `pg_trigger` ordena a criação (maior oid = criada depois). O pré-flight traz os dois.

Nenhuma das duas segue a convenção dominante do banco (`*_trigger`: `archive_*_trigger`, `broadcast_*_trigger`). Entre as duas, `trg_update_thread_reply_stats` carrega o nome exato da função; `trigger_update_thread_stats` é a que diverge. **Candidata ao DROP: `trigger_update_thread_stats`**, salvo se o oid disser que ela é a original (aí a decisão é sua; o efeito é o mesmo).

### 1.3 O defeito é visível hoje?

Sim, por construção: `reply_count` é lido pelo site em `DebatePanel.jsx:72,171` ("N respostas" na lista e no painel de debates/colóquios) e pelo worker em `forum.js`, `colloquium-user.js` (listagens de threads). Toda resposta de usuário entra por `POST forum_replies` (via PostgREST) **sem** escrita manual do contador → +2 por resposta.

Confirmação numérica depende do banco (as tabelas não têm leitura pública; o SELECT abaixo é para você). Esperado: threads com respostas só de usuários em **exatamente o dobro**; threads de colóquio em valores **mistos**, porque `colloquium.js` também escreve `reply_count` por `PATCH` (§ 1.4), ora corrigindo, ora piorando.

### 1.4 Agravante no código (registro, fora deste SQL)

`api/src/handlers/colloquium.js` insere réplicas de filósofos com `POST forum_replies` (trigger dispara) **e depois escreve `reply_count` à mão**:

| Linha | Escrita | Efeito com a trigger |
|---|---|---|
| 3927 (`generateAllPhilosopherReplies`) | `reply_count: succeeded` (absoluto) | sobrescreve o valor da trigger pelo certo |
| 4092 (`generateAllPhilosopherRebuttals`) | lê `reply_count` **depois** dos inserts e grava `existingCount + succeeded` | soma a contagem da trigger **mais** a dela: com 1 trigger, 2× o lote; com 2, 3× |
| 4330 (`createColloquium`) | `reply_count: 2` (absoluto) | ok |
| 4502 (`addPhilosopherReply`) | `(existingReplies).length + 1` | ok se `existingReplies` veio antes do insert |

Com a trigger como dona do contador, essas escritas são redundantes e a de 4092 é errada. **Proposta colateral (OK próprio, commit de código separado):** remover as quatro escritas de `reply_count` do `colloquium.js` e deixar só a trigger. Não entra no V1b.

## 2. Pré-flight — SQL para o Bob rodar (somente leitura)

```sql
-- V1 PRÉ-FLIGHT (somente leitura). Colar as 3 saídas no chat.

-- (1) As triggers de forum_replies, verbatim, com oid (maior oid = criada depois)
SELECT t.oid, t.tgname, t.tgenabled, pg_get_triggerdef(t.oid) AS definicao
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'forum_replies' AND NOT t.tgisinternal
ORDER BY t.oid;

-- (2) Divergência reply_count × contagem real
WITH real AS (SELECT thread_id, count(*) AS n FROM public.forum_replies GROUP BY thread_id)
SELECT count(*)                                                                   AS threads,
       count(*) FILTER (WHERE t.reply_count = COALESCE(r.n, 0))                   AS iguais,
       count(*) FILTER (WHERE COALESCE(r.n, 0) > 0 AND t.reply_count = 2 * r.n)   AS exatamente_dobro,
       count(*) FILTER (WHERE t.reply_count <> COALESCE(r.n, 0)
                         AND NOT (COALESCE(r.n, 0) > 0 AND t.reply_count = 2 * r.n)) AS outras_divergencias,
       sum(t.reply_count)                                                          AS soma_contadores,
       sum(COALESCE(r.n, 0))                                                       AS soma_real
FROM public.forum_threads t
LEFT JOIN real r ON r.thread_id = t.id;

-- (3) Amostra das divergências (15 mais recentes)
WITH real AS (SELECT thread_id, count(*) AS n FROM public.forum_replies GROUP BY thread_id)
SELECT t.id, t.category, t.created_at::date AS criado, t.reply_count AS gravado, COALESCE(r.n, 0) AS real
FROM public.forum_threads t
LEFT JOIN real r ON r.thread_id = t.id
WHERE t.reply_count <> COALESCE(r.n, 0)
ORDER BY t.created_at DESC
LIMIT 15;
```

## 3. Migração (V1b) — gated: só após as saídas do § 2 e o seu OK

Uma transação. O `DROP` abaixo assume `trigger_update_thread_stats` como redundante; se a saída (1) mostrar que ela tem o **menor** oid (é a original), troque o nome no `DROP` pela outra: o efeito é idêntico.

```sql
-- V1b MIGRAÇÃO — uma transação; abortar tudo se qualquer verificação falhar.
BEGIN;

-- 1. Uma trigger só
DROP TRIGGER IF EXISTS trigger_update_thread_stats ON public.forum_replies;

-- 2. Contadores = contagem real (threads com respostas)
UPDATE public.forum_threads t
SET    reply_count = r.n
FROM   (SELECT thread_id, count(*) AS n FROM public.forum_replies GROUP BY thread_id) r
WHERE  r.thread_id = t.id AND t.reply_count <> r.n;

-- 3. Threads sem nenhuma resposta → 0
UPDATE public.forum_threads t
SET    reply_count = 0
WHERE  t.reply_count <> 0
  AND  NOT EXISTS (SELECT 1 FROM public.forum_replies fr WHERE fr.thread_id = t.id);

-- 4. Verificação (as duas devem dar 1 e 0; se não, ROLLBACK)
SELECT count(*) AS triggers_restantes
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'forum_replies' AND NOT t.tgisinternal;

WITH real AS (SELECT thread_id, count(*) AS n FROM public.forum_replies GROUP BY thread_id)
SELECT count(*) AS divergentes
FROM public.forum_threads t LEFT JOIN real r ON r.thread_id = t.id
WHERE t.reply_count <> COALESCE(r.n, 0);

COMMIT;  -- ou ROLLBACK;
```

## 4. Prova funcional (após o COMMIT) — tudo desfeito por ROLLBACK

```sql
-- V1b PROVA — insere 1 resposta num thread real, mede +1 exato, desfaz com ROLLBACK.
BEGIN;
DO $$
DECLARE
  v_thread  uuid;
  v_user    uuid;
  v_before  integer;
  v_after   integer;
  v_reply   uuid;
BEGIN
  SELECT id, user_id, reply_count INTO v_thread, v_user, v_before
  FROM public.forum_threads ORDER BY created_at DESC LIMIT 1;

  INSERT INTO public.forum_replies (thread_id, user_id, content)
  VALUES (v_thread, v_user, 'prova V1b — será desfeita') RETURNING id INTO v_reply;

  SELECT reply_count INTO v_after FROM public.forum_threads WHERE id = v_thread;
  RAISE NOTICE 'INSERT: antes=% depois=% (esperado +1)', v_before, v_after;
  IF v_after <> v_before + 1 THEN RAISE EXCEPTION 'contador andou % em vez de 1', v_after - v_before; END IF;

  DELETE FROM public.forum_replies WHERE id = v_reply;
  SELECT reply_count INTO v_after FROM public.forum_threads WHERE id = v_thread;
  RAISE NOTICE 'DELETE: voltou para % (esperado %)', v_after, v_before;
  IF v_after <> v_before THEN RAISE EXCEPTION 'contador não voltou: %', v_after; END IF;
END $$;
ROLLBACK;  -- nada fica no banco; os NOTICEs são a prova
```

Se `forum_replies` tiver colunas NOT NULL além de `thread_id, user_id, content`, o INSERT da prova falha com o nome da coluna; me devolva a mensagem e eu ajusto.

## 5. Depois (V1c)

- Apagar `db/triggers/public.forum_replies.trigger_update_thread_stats.sql` (ou o espelho da trigger removida) e tirar o aviso "DUAS triggers" do espelho restante, com a data da migração.
- Inventário `db/INVENTARIO_2026-09-22.md`: item 1 da fila de triggers → **RESOLVIDO 12/10**, com os números do § 2 (antes) e do § 3 (depois).
- Commit: `forum: trigger unica de reply_count e contadores corrigidos` (espelhos + inventário + este md).

## 6. Registro

| Passo | Data | Resultado |
|---|---|---|
| V1a diagnóstico + SQL | 12/10 | este arquivo |
| Pré-flight rodado pelo Bob | 12/10 | (1) oid 137391 `trigger_update_thread_stats` (original) · 142867 `trg_update_thread_reply_stats` (colada depois) · (2) 384 threads, 282 iguais, 86 em dobro exato, 16 mistas, somas 712 vs 608 · (3) amostra: 15 colóquios com +1 fixo (assinatura da escrita absoluta do `colloquium.js`, não das triggers; reforça o colateral da fila) |
| OK do Bob no V1b | 13/10 | aprovado como proposto; DROP de trigger_update_thread_stats salvo oid; correção retroativa na mesma transação; colateral do colloquium.js vai para a fila com OK próprio (fora do V1b) |
| Migração + verificação | 12/10 | Success · DROP de `trigger_update_thread_stats` (mantida a decisão: sobrevive a com o nome da função) · UPDATE dos contadores · triggers_restantes=1, divergentes=0 |
| Prova funcional | 12/10 | Success: INSERT +1 exato, DELETE devolveu, ROLLBACK limpo |
| V1c espelhos + inventário + commit | 13/10 | espelho da dropada removido; espelho da restante e da função anotados; inventário item 1 RESOLVIDO; commit `forum: trigger unica de reply_count e contadores corrigidos` |
