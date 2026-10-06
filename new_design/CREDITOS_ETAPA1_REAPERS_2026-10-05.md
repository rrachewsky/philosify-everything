# CRÉDITOS · ETAPA 1 · Reapers escrevem o reembolso no extrato (migração gated)

**Status:** APLICADO E PROVADO pelo Bob em 06/10/2026 (SQL Editor de produção). Etapa 1b executada em 06/10 (§ 8-9). Proposta redigida em 05/10.
**Alvo:** `public.cleanup_stale_reservations` e `public.cleanup_user_stale_reservations` passam a inserir a linha `type='refund'` em `credit_history` por reserva varrida, exatamente como os espelhos-alvo de 25/08 (`db/functions/cleanup_stale_reservations.sql`, `db/functions/cleanup_user_stale_reservations.sql`).
**Regras:** todo SQL abaixo é colado pelo Bob no SQL Editor de produção; eu não executo nada. Pré-flight só leitura → OK → bloco `BEGIN…COMMIT` → verificação → prova funcional → espelhos seguem o banco.

---

## 1. Evidência (o que o repo e o banco dizem)

| Data | Fato | Fonte |
|---|---|---|
| 21/08 | Reaper global passa a devolver o crédito (antes só marcava `released`). Sem linha de extrato | `migrations/cleanup_stale_reservations_refund.sql`, commit `663a60d` |
| 25/08 | `migrations/credit_refund_history.sql` (3 funções: `release_reservation` + 2 reapers, cada uma com INSERT best-effort em `credit_history`). SQL Editor devolveu "Success"; espelhos atualizados no commit `d871ed7` | `migrations/credit_refund_history.sql`; cabeçalhos dos espelhos |
| 27/08 | Diagnóstico prova que o "Success" não chegou ao banco: `release_reservation` ainda morria com `free_remaining is ambiguous`, e as 4 devoluções do reaper em 27/08 não geraram linha nenhuma em `credit_history` | `docs/DIAGNOSTICO_RESERVAS_CREDITO_2026-08-27.md:45,54` |
| 29/08 | `release_reservation` reconstruída (drop de overloads + CREATE, com o INSERT de refund). Verificada em produção. **Só ela** | `migrations/tarefa2_item1_release_reservation.sql`; `db/functions/release_reservation.sql` |
| 22/09 | Dump `pg_get_functiondef`: os dois reapers vivos **não têm** o INSERT nem as variáveis `v_purchased/v_free/v_total`. `release_reservation` viva **tem** | `db/functions/*.LIVE_2026-09-22.sql`; `db/INVENTARIO_2026-09-22.md` § I-1b (linhas 146-149) e fila I-4 item 1 |

**Leitura:** a verdade a manter é o **alvo de 25/08** (o repo). O banco ficou com os corpos de 21/08 (global) e pré-25/08 (por usuário). Efeito prático hoje: toda reserva varrida por timeout devolve o crédito **sem linha de extrato**. Isso fura o Extrato da Etapa 3 antes de ele nascer.

**Quem chama os reapers (todos pelo worker, `callRpc` com `SUPABASE_SERVICE_KEY` → `service_role`):**

| Função | Chamador | Idade passada |
|---|---|---|
| `cleanup_stale_reservations(p_max_age_minutes)` | cron `*/5` do worker, `api/index.js:4576` (`scheduled()`) | 10 min |
| `cleanup_user_stale_reservations(p_user_id, p_age_minutes)` | `api/index.js:761,2984,3394` (preâmbulos) · `:1895,1953` · `api/src/handlers/colloquium-user.js:604,739,896` | 0, 2 e default 2 min |

Assinaturas vivas (inventário, linhas 76-77) **idênticas** às dos alvos: `(p_max_age_minutes integer) RETURNS integer` e `(p_user_id uuid, p_age_minutes integer) RETURNS TABLE(released_count integer, new_total integer, message text)`. Um overload de cada. Logo `CREATE OR REPLACE` substitui de fato (a lição de 25/08 era drift de assinatura em `release_reservation`; aqui não há drift, e o pré-flight confirma).

**Dependências já provadas em produção (pré-flight 0a-0g de 27-28/08, `docs/TAREFA2_ITEM1_RELEASE_RESERVATION.md`):** `credit_history.type` é enum `transaction_type` com label `'refund'`; `status` é varchar; sem CHECKs em `credit_history`; `credits.total` é `GENERATED ALWAYS AS (purchased + free_remaining)` (as funções leem `total` depois do UPDATE, nunca escrevem); `credit_type` em `credit_reservations` vale `'free'` ou `'paid'` (`reserve_credit.sql:44`), então o `CASE WHEN credit_type = 'paid'` do alvo está correto. O pré-flight abaixo repete só o que custa uma query.

## 2. O que muda e o que não muda

**Muda** (nas duas funções, igual ao alvo de 25/08):
- 3 variáveis novas: `v_purchased`, `v_free`, `v_total`.
- Depois do `UPDATE credit_reservations … status='released'`, um sub-bloco `BEGIN … EXCEPTION WHEN OTHERS THEN RAISE WARNING … END` que lê o saldo pós-reembolso e insere em `credit_history`: `type='refund'`, `amount=1`, snapshots before/after derivados do saldo lido, `status='completed'`, `metadata = {reservation_id, reason ('timeout' | 'user_timeout_cleanup'), credit_type}`. Falha do INSERT vira WARNING nos Postgres Logs e **nunca** desfaz nem bloqueia o reembolso.

**Não muda:** reembolso, `SKIP LOCKED` do global, `FOR UPDATE` do por-usuário, `release_reason`, retornos, `SECURITY DEFINER`, `search_path`, ACL (não toco; o pré-flight só registra). O `EXCEPTION WHEN OTHERS` externo do reaper por usuário (devolve `0, 0, SQLERRM`) é do corpo vivo e do alvo; fica. O reaper não preenche a coluna enum `reason` (só `release_reason`), igual ao vivo e ao alvo; a `release_reservation` preenche. Anoto isso para a Etapa 2, item 5 (origem de cada movimento), não aqui.

**Diferença de forma entre os dois INSERTs de refund que vão coexistir:** `release_reservation` (29/08) grava também `analysis_id` e `metadata.mapped_reason`; os reapers não têm análise nem mapeamento. Mesmo `type`, mesmos snapshots, mesma `metadata.reservation_id`. O extrato lê igual.

## 3. Pré-flight (só leitura, colar a saída)

```sql
-- P1. Fingerprint das duas funções vivas. Esperado: 2 linhas, overloads = 1 cada,
--     tem_refund_insert = f nas duas, src = 893 (global) e 1353 (por usuário),
--     assinaturas iguais às do inventário (I-1b, linhas 76-77).
SELECT p.proname                                                AS funcao,
       count(*) OVER (PARTITION BY p.proname)                   AS overloads,
       pg_get_function_identity_arguments(p.oid)                AS assinatura,
       pg_get_function_result(p.oid)                            AS retorno,
       pg_get_functiondef(p.oid) ~ 'refund history insert failed' AS tem_refund_insert,
       length(p.prosrc)                                         AS src,
       p.prosecdef                                              AS secdef,
       p.proacl                                                 AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('cleanup_stale_reservations', 'cleanup_user_stale_reservations')
ORDER BY p.proname;

-- P2. Dependências do INSERT. Esperado: 1 linha com tem_refund = t, total_gerado = 'ALWAYS'.
SELECT EXISTS (
         SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
         WHERE t.typname = 'transaction_type' AND e.enumlabel = 'refund'
       ) AS tem_refund,
       (SELECT is_generated FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'credits' AND column_name = 'total') AS total_gerado;

-- P3. Linhas de refund hoje, por origem. Esperado: só 'reason' vindas da release_reservation
--     (analysis_failed, cached, …); ZERO com reason 'timeout' ou 'user_timeout_cleanup'.
--     (Prova do sintoma: reapers nunca escreveram.)
SELECT metadata->>'reason' AS reason, count(*) AS linhas, max(created_at) AS ultima
FROM credit_history
WHERE type = 'refund'
GROUP BY 1 ORDER BY 2 DESC;
```

**Condições de parada:** P1 com `overloads > 1` ou assinatura diferente → parar (drift; precisa do padrão drop-all de 29/08). P1 com `tem_refund_insert = t` em alguma → parar (o banco mudou desde 22/09; reavaliar). P1 com `src` diferente de 893/1353 → colar o `pg_get_functiondef` inteiro antes de seguir. P2 com `tem_refund = f` → parar (`ALTER TYPE … ADD VALUE 'refund'` fora de transação, antes). P2 com `total_gerado = 'NEVER'` → parar (corpo assume gerada).

## 4. Migração (uma transação; só após OK do Bob e pré-flight limpo)

```sql
BEGIN;

-- ============================================================
-- 1. Reaper global (cron */5 do worker, idade 10 min)
--    Corpo = db/functions/cleanup_stale_reservations.sql (alvo de 25/08)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_stale_reservations(p_max_age_minutes integer DEFAULT 5)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_r RECORD;
  v_purchased INTEGER;
  v_free INTEGER;
  v_total INTEGER;
BEGIN
  FOR v_r IN
    SELECT id, user_id, credit_type
    FROM credit_reservations
    WHERE status = 'pending'
      AND created_at < NOW() - (p_max_age_minutes || ' minutes')::INTERVAL
    FOR UPDATE SKIP LOCKED
  LOOP
    IF v_r.credit_type = 'free' THEN
      UPDATE credits
      SET free_remaining = free_remaining + 1,
          updated_at = NOW()
      WHERE user_id = v_r.user_id;
    ELSE
      UPDATE credits
      SET purchased = purchased + 1,
          updated_at = NOW()
      WHERE user_id = v_r.user_id;
    END IF;

    UPDATE credit_reservations
    SET status = 'released',
        released_at = NOW(),
        release_reason = 'timeout'
    WHERE id = v_r.id;

    -- Statement line for the refund. Best-effort: never blocks the sweep.
    BEGIN
      SELECT total, purchased, free_remaining
      INTO v_total, v_purchased, v_free
      FROM credits
      WHERE user_id = v_r.user_id;
      INSERT INTO credit_history (
        user_id, type, amount,
        purchased_before, purchased_after,
        free_before, free_after,
        total_before, total_after,
        status, metadata
      ) VALUES (
        v_r.user_id, 'refund', 1,
        v_purchased - (CASE WHEN v_r.credit_type = 'paid' THEN 1 ELSE 0 END), v_purchased,
        v_free - (CASE WHEN v_r.credit_type = 'free' THEN 1 ELSE 0 END), v_free,
        v_total - 1, v_total,
        'completed',
        jsonb_build_object('reservation_id', v_r.id, 'reason', 'timeout', 'credit_type', v_r.credit_type)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'refund history insert failed for reservation %: %', v_r.id, SQLERRM;
    END;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$;

-- ============================================================
-- 2. Reaper por usuário (preâmbulos do worker, idade 0-2 min)
--    Corpo = db/functions/cleanup_user_stale_reservations.sql (alvo de 25/08)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_user_stale_reservations(p_user_id uuid, p_age_minutes integer DEFAULT 5)
 RETURNS TABLE(released_count integer, new_total integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_released_count INTEGER := 0;
  v_reservation RECORD;
  v_new_total INTEGER;
  v_purchased INTEGER;
  v_free INTEGER;
  v_total INTEGER;
BEGIN
  -- Find and release stale reservations for this user
  FOR v_reservation IN
    SELECT id, credit_type
    FROM credit_reservations
    WHERE user_id = p_user_id
      AND status = 'pending'
      AND created_at < NOW() - (p_age_minutes || ' minutes')::INTERVAL
    FOR UPDATE
  LOOP
    -- Refund credit
    IF v_reservation.credit_type = 'free' THEN
      UPDATE credits
      SET free_remaining = free_remaining + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE credits
      SET purchased = purchased + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;

    -- Mark as released
    UPDATE credit_reservations
    SET status = 'released',
        release_reason = 'user_timeout_cleanup',
        released_at = NOW()
    WHERE id = v_reservation.id;

    -- Statement line for the refund. Best-effort: never blocks the sweep.
    BEGIN
      SELECT total, purchased, free_remaining
      INTO v_total, v_purchased, v_free
      FROM credits
      WHERE user_id = p_user_id;
      INSERT INTO credit_history (
        user_id, type, amount,
        purchased_before, purchased_after,
        free_before, free_after,
        total_before, total_after,
        status, metadata
      ) VALUES (
        p_user_id, 'refund', 1,
        v_purchased - (CASE WHEN v_reservation.credit_type = 'paid' THEN 1 ELSE 0 END), v_purchased,
        v_free - (CASE WHEN v_reservation.credit_type = 'free' THEN 1 ELSE 0 END), v_free,
        v_total - 1, v_total,
        'completed',
        jsonb_build_object('reservation_id', v_reservation.id, 'reason', 'user_timeout_cleanup', 'credit_type', v_reservation.credit_type)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'refund history insert failed for reservation %: %', v_reservation.id, SQLERRM;
    END;

    v_released_count := v_released_count + 1;
  END LOOP;

  -- Get new total
  SELECT total INTO v_new_total
  FROM credits
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT
    v_released_count,
    COALESCE(v_new_total, 0),
    format('Released %s reservations for user', v_released_count)::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 0, 0, SQLERRM::TEXT;
END;
$function$;

COMMIT;

-- Assinaturas não mudam; o PostgREST não precisa, mas é o empurrão de praxe.
NOTIFY pgrst, 'reload schema';
```

Não rodar duas vezes: a segunda rodada é inofensiva aqui (`CREATE OR REPLACE` idempotente), mas a regra da casa continua.

## 5. Verificação estrutural (só leitura, logo após o COMMIT)

```sql
-- Esperado: 2 linhas, overloads = 1, tem_refund_insert = t, tem_snapshot = t,
-- assinatura e retorno iguais ao P1, acl igual ao P1 (não tocado).
SELECT p.proname                                                   AS funcao,
       count(*) OVER (PARTITION BY p.proname)                      AS overloads,
       pg_get_function_identity_arguments(p.oid)                   AS assinatura,
       pg_get_functiondef(p.oid) ~ 'refund history insert failed'  AS tem_refund_insert,
       pg_get_functiondef(p.oid) ~ 'v_total - 1, v_total'          AS tem_snapshot,
       length(p.prosrc)                                            AS src,
       p.proacl                                                    AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('cleanup_stale_reservations', 'cleanup_user_stale_reservations')
ORDER BY p.proname;
```

## 6. Prova funcional (bloco DO, padrão da casa: tudo roda e **tudo é desfeito** pelo `RAISE EXCEPTION` final)

O bloco reserva 1 crédito de verdade por `reserve_credit`, envelhece a reserva em 10 minutos, chama o reaper por usuário (idade 5), confere crédito devolvido **e** linha `refund` com `reservation_id` certo; repete com o reaper global. Termina sempre em `RAISE EXCEPTION`, que desfaz a transação inteira: nenhuma reserva, nenhum saldo e nenhuma linha de extrato ficam no banco. A mensagem do erro é o laudo: começa com `TESTE OK` ou com `FALHOU`.

Usuário de teste: por padrão o usuário com saldo mais recente (`credits.total > 0`). Para fixar o seu, troque a subquery de `v_uid` pelo seu UUID.

```sql
DO $t$
DECLARE
  v_uid        uuid;
  v_t0         integer;  -- saldo antes
  v_t1         integer;  -- saldo após reservar
  v_t2         integer;  -- saldo após varrer
  v_res        uuid;
  v_ok         boolean;
  v_msg        text;
  v_rc         integer;
  v_hist       integer;
  v_laudo      text := '';
BEGIN
  SELECT user_id INTO v_uid FROM credits WHERE total > 0 ORDER BY updated_at DESC LIMIT 1;
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FALHOU: nenhum usuario com total > 0 para o teste'; END IF;

  -- ---------- A. reaper por usuario ----------
  SELECT total INTO v_t0 FROM credits WHERE user_id = v_uid;
  SELECT success, reservation_id, message INTO v_ok, v_res, v_msg FROM reserve_credit(v_uid);
  IF NOT v_ok THEN RAISE EXCEPTION 'FALHOU A0: reserve_credit: %', v_msg; END IF;
  SELECT total INTO v_t1 FROM credits WHERE user_id = v_uid;
  IF v_t1 <> v_t0 - 1 THEN RAISE EXCEPTION 'FALHOU A1: saldo apos reservar = % (esperado %)', v_t1, v_t0 - 1; END IF;

  UPDATE credit_reservations SET created_at = now() - interval '10 minutes' WHERE id = v_res;

  SELECT released_count, message INTO v_rc, v_msg FROM cleanup_user_stale_reservations(v_uid, 5);
  IF v_rc <> 1 THEN RAISE EXCEPTION 'FALHOU A2: released_count = % (%)', v_rc, v_msg; END IF;
  SELECT total INTO v_t2 FROM credits WHERE user_id = v_uid;
  IF v_t2 <> v_t0 THEN RAISE EXCEPTION 'FALHOU A3: saldo apos varrer = % (esperado %)', v_t2, v_t0; END IF;

  SELECT count(*) INTO v_hist FROM credit_history
  WHERE user_id = v_uid AND type = 'refund'
    AND metadata->>'reservation_id' = v_res::text
    AND metadata->>'reason' = 'user_timeout_cleanup'
    AND total_after = total_before + 1 AND total_after = v_t0;
  IF v_hist <> 1 THEN RAISE EXCEPTION 'FALHOU A4: linhas refund para a reserva % = % (esperado 1)', v_res, v_hist; END IF;
  v_laudo := format('A (por usuario): reserva %s, saldo %s->%s->%s, 1 linha refund user_timeout_cleanup', v_res, v_t0, v_t1, v_t2);

  -- ---------- B. reaper global ----------
  SELECT success, reservation_id, message INTO v_ok, v_res, v_msg FROM reserve_credit(v_uid);
  IF NOT v_ok THEN RAISE EXCEPTION 'FALHOU B0: reserve_credit: %', v_msg; END IF;
  UPDATE credit_reservations SET created_at = now() - interval '10 minutes' WHERE id = v_res;

  v_rc := cleanup_stale_reservations(5);   -- varre tambem reservas reais > 5 min; tudo desfeito no fim
  IF v_rc < 1 THEN RAISE EXCEPTION 'FALHOU B1: cleanup_stale_reservations devolveu %', v_rc; END IF;
  IF (SELECT status FROM credit_reservations WHERE id = v_res) <> 'released' THEN
    RAISE EXCEPTION 'FALHOU B2: reserva de teste nao foi varrida';
  END IF;
  SELECT total INTO v_t2 FROM credits WHERE user_id = v_uid;
  IF v_t2 <> v_t0 THEN RAISE EXCEPTION 'FALHOU B3: saldo apos varrer = % (esperado %)', v_t2, v_t0; END IF;

  SELECT count(*) INTO v_hist FROM credit_history
  WHERE user_id = v_uid AND type = 'refund'
    AND metadata->>'reservation_id' = v_res::text
    AND metadata->>'reason' = 'timeout'
    AND total_after = total_before + 1 AND total_after = v_t0;
  IF v_hist <> 1 THEN RAISE EXCEPTION 'FALHOU B4: linhas refund para a reserva % = % (esperado 1)', v_res, v_hist; END IF;
  v_laudo := v_laudo || format(' | B (global): reserva %s varrida (count=%s), saldo %s, 1 linha refund timeout', v_res, v_rc, v_t2);

  -- Desfaz tudo (reservas, saldo, extrato). A mensagem e o laudo.
  RAISE EXCEPTION 'TESTE OK (tudo desfeito) :: %', v_laudo;
END $t$;
```

Leitura da saída: `ERROR: TESTE OK (tudo desfeito) :: A (...) | B (...)` é o resultado esperado. `ERROR: FALHOU …` aponta o elo. Qualquer `WARNING: refund history insert failed …` no painel de mensagens é falha do INSERT e vai aparecer também como `FALHOU A4/B4`. Rodar antes da migração, se quiser o "antes": falha em `A4` (0 linhas), a prova do sintoma.

Depois do teste, uma leitura para confirmar que nada ficou: 

```sql
-- Esperado: 0 linhas (o DO desfez tudo).
SELECT id, status, created_at FROM credit_reservations
WHERE created_at > now() - interval '15 minutes' AND release_reason IN ('timeout','user_timeout_cleanup')
  AND released_at > now() - interval '2 minutes';
```

## 7. Rollback exato (recria os corpos vivos de 22/09; os `.LIVE` somem do repo na 1b, por isso ficam aqui)

```sql
BEGIN;

CREATE OR REPLACE FUNCTION public.cleanup_stale_reservations(p_max_age_minutes integer DEFAULT 5)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DECLARE
    v_count INTEGER := 0;
    v_r RECORD;
  BEGIN
    FOR v_r IN
      SELECT id, user_id, credit_type
      FROM credit_reservations
      WHERE status = 'pending'
        AND created_at < NOW() - (p_max_age_minutes || ' minutes')::INTERVAL
      FOR UPDATE SKIP LOCKED
    LOOP
      IF v_r.credit_type = 'free' THEN
        UPDATE credits
        SET free_remaining = free_remaining + 1,
            updated_at = NOW()
        WHERE user_id = v_r.user_id;
      ELSE
        UPDATE credits
        SET purchased = purchased + 1,
            updated_at = NOW()
        WHERE user_id = v_r.user_id;
      END IF;

      UPDATE credit_reservations
      SET status = 'released',
          released_at = NOW(),
          release_reason = 'timeout'
      WHERE id = v_r.id;

      v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
  END;
  $function$;

CREATE OR REPLACE FUNCTION public.cleanup_user_stale_reservations(p_user_id uuid, p_age_minutes integer DEFAULT 5)
 RETURNS TABLE(released_count integer, new_total integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_released_count INTEGER := 0;
  v_reservation RECORD;
  v_new_total INTEGER;
BEGIN
  -- Find and release stale reservations for this user
  FOR v_reservation IN
    SELECT id, credit_type
    FROM credit_reservations
    WHERE user_id = p_user_id
      AND status = 'pending'
      AND created_at < NOW() - (p_age_minutes || ' minutes')::INTERVAL
    FOR UPDATE
  LOOP
    -- Refund credit
    IF v_reservation.credit_type = 'free' THEN
      UPDATE credits
      SET free_remaining = free_remaining + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE credits
      SET purchased = purchased + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;

    -- Mark as released
    UPDATE credit_reservations
    SET status = 'released',
        release_reason = 'user_timeout_cleanup',
        released_at = NOW()
    WHERE id = v_reservation.id;

    v_released_count := v_released_count + 1;
  END LOOP;

  -- Get new total
  SELECT total INTO v_new_total
  FROM credits
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT
    v_released_count,
    COALESCE(v_new_total, 0),
    format('Released %s reservations for user', v_released_count)::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 0, 0, SQLERRM::TEXT;
END;
$function$;

COMMIT;
```

## 8. Etapa 1b (depois de aplicado e verificado; sem commit até ordem)

1. Apagar `db/functions/cleanup_stale_reservations.LIVE_2026-09-22.sql` e `cleanup_user_stale_reservations.LIVE_2026-09-22.sql` (banco passa a bater com os espelhos).
2. Cabeçalho dos dois espelhos: trocar "Applied 25 Aug 2026" por "Aplicado pelo Bob em DD/10/2026 (SQL Editor), verificado: tem_refund_insert = t, prova funcional TESTE OK; o 'Success' de 25/08 nunca chegou ao banco (I-1b de 22/09)". Rollback aponta para este arquivo § 7.
3. `db/INVENTARIO_2026-09-22.md`: I-1b linhas 146-147 e 396-397 → **RESOLVIDO DD/10**; fila I-4 item 1 → RESOLVIDO; apontar para este arquivo.
4. `migrations/credit_refund_history.sql`: nota de cabeçalho "parte 1 superada por tarefa2_item1 (29/08); partes 2 e 3 aplicadas via new_design/CREDITOS_ETAPA1_REAPERS_2026-10-05.md § 4". Sem mexer no corpo.
5. Commit sugerido, só por ordem: `db: reapers escrevem o reembolso em credit_history (alvo de 25/08 aplicado)`.

## 9. Registro

| Passo | Data | Resultado |
|---|---|---|
| Evidência + proposta redigida | 05/10 | este arquivo; nada aplicado |
| Pré-flight P1-P3 | 06/10 | P1: 2 funções, overloads = 1, tem_refund_insert = false, src 893/1353, ACL postgres + service_role. P2: tem_refund = true, total_gerado = ALWAYS. P3: só `cached_review` e `failed`; **zero** `timeout`/`user_timeout_cleanup` (sintoma provado) |
| OK do Bob | 06/10 | dado após o pré-flight limpo |
| BEGIN…COMMIT aplicado | 06/10 | Success |
| Verificação § 5 | 06/10 | tem_refund_insert = true e tem_snapshot = true nas duas; src 1863/2443; assinaturas e ACL intocados |
| Prova funcional § 6 | 06/10 | `TESTE OK (tudo desfeito) :: A: res 056223a6-… saldo 5>4>5 1 refund user_timeout_cleanup \| B: res b908454f-… count 1 saldo 5 1 refund timeout` |
| Etapa 1b (espelhos, inventário) | 06/10 | `.LIVE` removidos; cabeçalhos dos 2 espelhos; inventário I-1b e fila item 1 RESOLVIDO; nota em `migrations/credit_refund_history.sql`. Commit por ordem do Bob |
