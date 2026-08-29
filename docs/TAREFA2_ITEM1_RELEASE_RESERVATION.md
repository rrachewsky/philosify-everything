# Tarefa 2, Item 1 — Correção de `release_reservation` (PROPOSTA v2, não aplicada)

**Status: OK final dado em 28/08 após pré-flight 0a–0g em produção (0d: 'refund' já existe no enum `transaction_type` — Passo 1 dispensado; 0f: `credits.total` é GENERATED → Variante A; 0c: `status` é varchar; 0g: ACL prévia já era postgres+service_role). Migração final gerada em `migrations/tarefa2_item1_release_reservation.sql`. Ainda NÃO aplicada ao banco.**

## Decisões fechadas (27/08)

1. **Mapeamento do enum `reservation_reason`**: `p_reason IN ('cached','cached_review','already_owned')` → `cached`; `p_reason LIKE '%timeout%'` → `timeout` (cobre `'timeout'` e `'user_timeout_cleanup'`); resto → `failed`.
2. **`EXCEPTION WHEN OTHERS` externo removido** — erro real de SQL aborta o RPC e aparece no log do worker.
3. **Pós-aplicação** (mediante OK, na fase "aplicar"): atualizar `migrations/release_reservation_rebuild.sql` (§2) e fazer `db/functions/release_reservation.sql` espelhar o corpo aplicado.

## Correções incorporadas nesta revisão

**A. `credit_history.type` é ENUM** (verificado no banco: `data_type = USER-DEFINED`; TECHNICAL_AUDIT.md:481 está errado). O pré-flight agora lista os labels de **todas** as colunas enum de `credit_history` (cobre `type` e, se for o caso, `status`). Se `'refund'` não for label, o `ALTER TYPE ... ADD VALUE` roda como **passo separado, antes e fora** do `BEGIN/COMMIT` — Postgres não permite usar label novo na mesma transação em que foi criado. Condição de parada: label ausente e ALTER não aplicado → não rodar a migração.

**B. `credits.total` gerada ou gravada?** O corpo principal assume coluna GERADA (`GENERATED ALWAYS AS (purchased + free_remaining) STORED`, como em `schema_reference` e no cabeçalho do rebuild). Evidência comportamental do próprio incidente: o `reserve_credit` só decrementa `free_remaining`/`purchased` e o usuário viu o total cair para 0 na hora — `total` acompanha sozinho (gerada, ou trigger equivalente). Ainda assim o pré-flight decide formalmente; se `is_generated = 'NEVER'`, usar a **variante B** do UPDATE (abaixo), senão um `SET total = ...` numa coluna gerada seria erro e, pior, sem o ajuste o saldo exibido ficaria defasado.

**C. Snapshot consistente com o IF do reembolso**: as duas linhas de before usam `CASE WHEN v_credit_type = 'free' ...` — qualquer valor não-`free` é tratado como comprado, igual ao IF.

**D. ACL é segura — prova de que `callRpc` usa a service_role key.** Cadeia completa:

- `api/src/credits/release.js:22` — único chamador do RPC em todo o repositório (grep em `api/` e `site/`; o frontend nunca toca `release_reservation`):
  ```javascript
  const result = await callRpc(env, "release_reservation", {
  ```
- `api/src/utils/supabase.js:204` — `callRpc` resolve credenciais via `getSupabaseCredentials`:
  ```javascript
  const { url, key } = await getSupabaseCredentials(env);
  ```
- `api/src/utils/supabase.js:62` — a chave é sempre a service key, nunca JWT de usuário:
  ```javascript
  const key = await getSecret(env.SUPABASE_SERVICE_KEY);
  ```
- `api/src/utils/supabase.js:24-25` — headers enviados:
  ```javascript
  apikey: key,
  Authorization: `Bearer ${key}`,
  ```

`REVOKE ... FROM PUBLIC, anon, authenticated` não afeta nenhum caminho existente.

---

## (a) SQL completo da nova função (v2)

```sql
CREATE FUNCTION public.release_reservation(
  p_reservation_id uuid,
  p_reason character varying DEFAULT 'analysis_failed'::character varying,
  p_analysis_id uuid DEFAULT NULL::uuid
)
 RETURNS TABLE(success boolean, message text, new_total integer, credits integer, free_remaining integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_user_id UUID;
  v_credit_type VARCHAR(10);
  v_reservation_status VARCHAR(20);
  v_purchased INTEGER;
  v_free INTEGER;
  v_total INTEGER;
  v_reason reservation_reason;
BEGIN
  -- Decisão 1: mapear p_reason (texto livre dos handlers) para o enum da coluna reason
  v_reason := CASE
    WHEN p_reason IN ('cached', 'cached_review', 'already_owned') THEN 'cached'::reservation_reason
    WHEN p_reason LIKE '%timeout%'                                THEN 'timeout'::reservation_reason
    ELSE 'failed'::reservation_reason
  END;

  -- Get reservation details (FOR UPDATE mantido)
  SELECT r.user_id, r.credit_type, r.status
  INTO v_user_id, v_credit_type, v_reservation_status
  FROM credit_reservations r
  WHERE r.id = p_reservation_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Reservation not found'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  -- Idempotente para já-liberada
  IF v_reservation_status = 'released' THEN
    SELECT c.total, c.purchased, c.free_remaining INTO v_total, v_purchased, v_free
    FROM credits c WHERE c.user_id = v_user_id;
    RETURN QUERY SELECT TRUE, 'Already released'::TEXT, v_total, v_purchased, v_free;
    RETURN;
  END IF;

  IF v_reservation_status = 'confirmed' THEN
    RETURN QUERY SELECT FALSE, 'Cannot release confirmed reservation'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  -- Reembolso. VARIANTE A (padrão): credits.total é coluna GERADA — não tocar nela.
  -- Se o pré-flight 0f mostrar is_generated='NEVER', usar a VARIANTE B (abaixo, comentada).
  IF v_credit_type = 'free' THEN
    UPDATE credits c
    SET free_remaining = c.free_remaining + 1, updated_at = NOW()
    WHERE c.user_id = v_user_id;
  ELSE
    UPDATE credits c
    SET purchased = c.purchased + 1, updated_at = NOW()
    WHERE c.user_id = v_user_id;
  END IF;
  -- VARIANTE B (só se total NÃO for gerada — substituir o bloco acima):
  -- IF v_credit_type = 'free' THEN
  --   UPDATE credits c
  --   SET free_remaining = c.free_remaining + 1, total = c.total + 1, updated_at = NOW()
  --   WHERE c.user_id = v_user_id;
  -- ELSE
  --   UPDATE credits c
  --   SET purchased = c.purchased + 1, total = c.total + 1, updated_at = NOW()
  --   WHERE c.user_id = v_user_id;
  -- END IF;

  UPDATE credit_reservations r
  SET status = 'released',
      reason = v_reason,
      release_reason = p_reason,
      released_at = NOW(),
      analysis_id = p_analysis_id
  WHERE r.id = p_reservation_id;

  SELECT c.total, c.purchased, c.free_remaining
  INTO v_total, v_purchased, v_free
  FROM credits c
  WHERE c.user_id = v_user_id;

  -- Linha de extrato do reembolso. Best-effort: nunca bloqueia o refund;
  -- falha vira WARNING nos Postgres Logs. Pré-flight 0c/0d garante que
  -- 'refund' é label válido do enum de type ANTES de rodar.
  BEGIN
    INSERT INTO credit_history (
      user_id, type, amount,
      purchased_before, purchased_after,
      free_before, free_after,
      total_before, total_after,
      status, metadata, analysis_id
    ) VALUES (
      v_user_id, 'refund', 1,
      v_purchased - (CASE WHEN v_credit_type = 'free' THEN 0 ELSE 1 END), v_purchased,
      v_free      - (CASE WHEN v_credit_type = 'free' THEN 1 ELSE 0 END), v_free,
      v_total - 1, v_total,
      'completed',
      jsonb_build_object(
        'reservation_id', p_reservation_id,
        'reason', p_reason,
        'mapped_reason', v_reason::text,
        'credit_type', v_credit_type
      ),
      p_analysis_id
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'release_reservation: refund history insert failed for %: %', p_reservation_id, SQLERRM;
  END;

  RETURN QUERY SELECT TRUE, 'Credit refunded'::TEXT, v_total, v_purchased, v_free;
END;
$function$;
-- Decisão 2: SEM "EXCEPTION WHEN OTHERS" externo. Erro real de SQL aborta o RPC;
-- PostgREST devolve 400 com SQLERRM, callRpc lança e release.js:45 loga tudo.
```

## (b) Diff contra `db/functions/release_reservation.sql`

```diff
--- db/functions/release_reservation.sql  (corpo-alvo no repo, nunca aplicado)
+++ proposta v2 (Tarefa 2, item 1)
@@ cabeçalho @@
--- TARGET body — NOT a verified mirror of the live function. [...]
+-- Canonical body — Tarefa 2 item 1 v2 (27 Aug 2026). Substitui o corpo vivo
+-- quebrado (free_remaining ambiguous, confirmado por pg_get_functiondef).
@@ DECLARE @@
   v_total INTEGER;
+  v_reason reservation_reason;
 BEGIN
+  v_reason := CASE
+    WHEN p_reason IN ('cached', 'cached_review', 'already_owned') THEN 'cached'::reservation_reason
+    WHEN p_reason LIKE '%timeout%'                                THEN 'timeout'::reservation_reason
+    ELSE 'failed'::reservation_reason
+  END;
+
   -- Get reservation details
-  SELECT user_id, credit_type, status
+  SELECT r.user_id, r.credit_type, r.status
   INTO v_user_id, v_credit_type, v_reservation_status
-  FROM credit_reservations
-  WHERE id = p_reservation_id
+  FROM credit_reservations r
+  WHERE r.id = p_reservation_id
   FOR UPDATE;
@@ já liberada @@
-    SELECT total, purchased, free_remaining INTO v_total, v_purchased, v_free
-    FROM credits WHERE user_id = v_user_id;
+    SELECT c.total, c.purchased, c.free_remaining INTO v_total, v_purchased, v_free
+    FROM credits c WHERE c.user_id = v_user_id;
@@ reembolso @@
   IF v_credit_type = 'free' THEN
-    UPDATE credits
-    SET free_remaining = free_remaining + 1, updated_at = NOW()
-    WHERE user_id = v_user_id;
+    UPDATE credits c
+    SET free_remaining = c.free_remaining + 1, updated_at = NOW()
+    WHERE c.user_id = v_user_id;
   ELSE
-    UPDATE credits
-    SET purchased = purchased + 1, updated_at = NOW()
-    WHERE user_id = v_user_id;
+    UPDATE credits c
+    SET purchased = c.purchased + 1, updated_at = NOW()
+    WHERE c.user_id = v_user_id;
   END IF;
   -- Mark reservation as released
-  UPDATE credit_reservations
+  UPDATE credit_reservations r
   SET status = 'released',
+      reason = v_reason,
       release_reason = p_reason,
       released_at = NOW(),
       analysis_id = p_analysis_id
-  WHERE id = p_reservation_id;
+  WHERE r.id = p_reservation_id;
   -- Get updated balance for response
-  SELECT total, purchased, free_remaining
+  SELECT c.total, c.purchased, c.free_remaining
   INTO v_total, v_purchased, v_free
-  FROM credits
-  WHERE user_id = v_user_id;
+  FROM credits c
+  WHERE c.user_id = v_user_id;
@@ INSERT credit_history (snapshots + metadata) @@
-      v_purchased - (CASE WHEN v_credit_type = 'paid' THEN 1 ELSE 0 END), v_purchased,
-      v_free - (CASE WHEN v_credit_type = 'free' THEN 1 ELSE 0 END), v_free,
+      v_purchased - (CASE WHEN v_credit_type = 'free' THEN 0 ELSE 1 END), v_purchased,
+      v_free      - (CASE WHEN v_credit_type = 'free' THEN 1 ELSE 0 END), v_free,
       v_total - 1, v_total,
       'completed',
-      jsonb_build_object('reservation_id', p_reservation_id, 'reason', p_reason, 'credit_type', v_credit_type),
+      jsonb_build_object(
+        'reservation_id', p_reservation_id,
+        'reason', p_reason,
+        'mapped_reason', v_reason::text,
+        'credit_type', v_credit_type
+      ),
       p_analysis_id
     );
   EXCEPTION WHEN OTHERS THEN
-    RAISE WARNING 'refund history insert failed for reservation %: %', p_reservation_id, SQLERRM;
+    RAISE WARNING 'release_reservation: refund history insert failed for %: %', p_reservation_id, SQLERRM;
   END;
   RETURN QUERY SELECT TRUE, 'Credit refunded'::TEXT, v_total, v_purchased, v_free;
-EXCEPTION
-  WHEN OTHERS THEN
-    RETURN QUERY SELECT FALSE, SQLERRM::TEXT, 0, 0, 0;
 END;
 $function$
```

## (c) Aplicação no Supabase

### Pré-flight (rodar ANTES, no SQL Editor, e guardar TODA a saída)

```sql
-- 0a. Fingerprint de produção: devem aparecer as 2 reservas conhecidas de 13:50:07 UTC
SELECT id, user_id, credit_type, status, release_reason, created_at
FROM credit_reservations
WHERE created_at >= '2026-08-27T13:50:00Z' AND created_at < '2026-08-27T13:51:00Z';

-- 0b. Enum reservation_reason existe e tem os labels esperados (success|cached|failed|timeout)
SELECT t.typname, e.enumlabel
FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typname = 'reservation_reason'
ORDER BY e.enumsortorder;

-- 0c. Colunas reais de credit_history (analysis_id precisa existir; anotar os USER-DEFINED)
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'credit_history'
ORDER BY ordinal_position;

-- 0d. Labels de TODAS as colunas enum de credit_history (cobre type e, se for o caso, status).
-- 'refund' precisa ser label do enum de type; 'completed' do enum de status, se status for enum.
SELECT a.attname AS coluna, t.typname AS enum_tipo, e.enumlabel
FROM pg_attribute a
JOIN pg_type t ON t.oid = a.atttypid AND t.typtype = 'e'
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE a.attrelid = 'public.credit_history'::regclass
  AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY a.attname, e.enumsortorder;

-- 0e. Constraints de credit_history (CHECKs que possam barrar o INSERT)
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.credit_history'::regclass;

-- 0f. credits.total: gerada ou gravada? (decide Variante A ou B do UPDATE)
SELECT column_name, is_generated, generation_expression
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'credits' AND column_name = 'total';

-- 0g. Pre-ACL (regra: apertar pode, abrir não)
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS assinatura, p.proacl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'release_reservation';
```

**Condições de parada / desvio:**

| Pré-flight | Resultado | Ação |
|---|---|---|
| 0a | não mostra as 2 reservas de 13:50:07 | **PARAR** — sessão não é produção |
| 0b | sem linhas, ou faltam `cached`/`failed`/`timeout` | **PARAR** — CASE do enum precisa de ajuste |
| 0c | sem coluna `analysis_id` | remover a coluna e o valor do INSERT antes de aplicar |
| 0d | enum de `type` sem label `'refund'` | rodar o **Passo 1** (ALTER TYPE) antes da migração; sem ele, **NÃO rodar** a migração |
| 0d | `status` é enum sem label `'completed'` | ajustar o valor de `status` no INSERT para um label válido |
| 0e | CHECK que exclua o INSERT proposto | **PARAR** e reportar |
| 0f | `is_generated = 'NEVER'` | usar **Variante B** do UPDATE (incrementa `total`) |
| 0f | `is_generated = 'ALWAYS'` | usar **Variante A** (padrão; `SET total` seria erro) |
| 0g | grantees `anon`/`authenticated` no ACL atual | **PARAR** e revisar antes do REVOKE |

### Passo 1 (CONDICIONAL — só se 0d mostrar que falta 'refund'; FORA de qualquer transação)

```sql
-- Substituir <enum_de_type> pelo typname que o 0d mostrou para a coluna type.
-- Deve rodar como statement isolado, SEM BEGIN: label novo não pode ser usado
-- na mesma transação em que foi criado.
ALTER TYPE public.<enum_de_type> ADD VALUE IF NOT EXISTS 'refund';

-- Confirmar antes de prosseguir:
SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typname = '<enum_de_type>' ORDER BY e.enumsortorder;
```

### Passo 2 — Migração (uma transação; SQL Editor do projeto confirmado pelo 0a)

```sql
BEGIN;

-- 2.1 Drop de TODOS os overloads (CREATE OR REPLACE não conserta duplicata — lição de 25/08)
DO $do$
DECLARE
  v_fn RECORD;
BEGIN
  FOR v_fn IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'release_reservation'
  LOOP
    EXECUTE format('DROP FUNCTION public.%I(%s)', v_fn.proname, v_fn.args);
    RAISE NOTICE 'dropped: %(%)', v_fn.proname, v_fn.args;
  END LOOP;
END $do$;

-- 2.2 [COLAR AQUI o CREATE FUNCTION completo da seção (a),
--      com a Variante A ou B conforme o pré-flight 0f]

-- 2.3 ACL worker-only (seguro: único chamador é callRpc com service key — ver seção D)
REVOKE ALL ON FUNCTION public.release_reservation(uuid, character varying, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_reservation(uuid, character varying, uuid) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- 2.4 Verificação estrutural (última query — o SQL Editor exibe o resultado)
-- Esperado: 1 linha, overloads=1, tem_diretiva=t, preenche_reason=t,
-- tem_refund_insert=t, sem_catch_generico=t, acl só owner+service_role.
SELECT p.proname AS funcao,
       count(*) OVER () AS overloads,
       pg_get_function_identity_arguments(p.oid) AS assinatura,
       pg_get_functiondef(p.oid) ~  '#variable_conflict use_column'      AS tem_diretiva,
       pg_get_functiondef(p.oid) ~  'reason = v_reason'                  AS preenche_reason,
       pg_get_functiondef(p.oid) ~  'refund history insert failed'       AS tem_refund_insert,
       pg_get_functiondef(p.oid) !~ 'SELECT FALSE, SQLERRM'              AS sem_catch_generico,
       p.proacl AS acl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'release_reservation';
```

## (d) Verificação funcional pós-aplicação

Substituir `<TEST_USER_ID>` por um usuário de teste com ≥1 crédito. O ciclo é neutro no saldo; deixa 1 reserva `released` e 1 linha `refund` no extrato (artefatos de teste, inofensivos).

```sql
-- 1. Saldo antes
SELECT purchased, free_remaining, total FROM credits WHERE user_id = '<TEST_USER_ID>';

-- 2. Ciclo reserva → release (aborta com erro visível se qualquer etapa falhar)
DO $$
DECLARE
  r RECORD;
  rel RECORD;
BEGIN
  SELECT * INTO r FROM reserve_credit('<TEST_USER_ID>'::uuid);
  IF NOT r.success THEN
    RAISE EXCEPTION 'reserve_credit falhou: %', r.message;
  END IF;
  RAISE NOTICE 'reservado: % (credit %)', r.reservation_id,
    CASE WHEN r.used_free THEN 'free' ELSE 'paid' END;

  SELECT * INTO rel FROM release_reservation(r.reservation_id, 'failed');
  RAISE NOTICE 'release: success=%, message=%, new_total=%, credits=%, free_remaining=%',
    rel.success, rel.message, rel.new_total, rel.credits, rel.free_remaining;
  IF NOT rel.success THEN
    RAISE EXCEPTION 'release_reservation falhou: %', rel.message;
  END IF;
END $$;

-- 3. Saldo restaurado (deve ser IGUAL ao passo 1 — inclusive total, cobre a dúvida B)
SELECT purchased, free_remaining, total FROM credits WHERE user_id = '<TEST_USER_ID>';

-- 4. Reserva liberada com reason (enum) E release_reason preenchidos
SELECT id, status, reason, release_reason, released_at, created_at
FROM credit_reservations
WHERE user_id = '<TEST_USER_ID>'
ORDER BY created_at DESC LIMIT 1;
-- Esperado: status='released', reason='failed', release_reason='failed'

-- 5. Lançamento do reembolso no extrato
SELECT type, amount,
       purchased_before, purchased_after,
       free_before, free_after,
       total_before, total_after,
       status, metadata, analysis_id, created_at
FROM credit_history
WHERE user_id = '<TEST_USER_ID>'
ORDER BY created_at DESC LIMIT 1;
-- Esperado: type='refund', amount=1, total_after = total_before + 1,
-- metadata com reservation_id/reason/mapped_reason/credit_type

-- 6. Mapeamento e idempotência (opcional, recomendado):
-- 6a. repetir o passo 2 trocando 'failed' por 'cached_review'
--     → passo 4 deve mostrar reason='cached', release_reason='cached_review'
-- 6b. repetir trocando por 'user_timeout_cleanup'
--     → reason='timeout', release_reason='user_timeout_cleanup'
-- 6c. chamar release_reservation duas vezes com o MESMO reservation_id:
SELECT * FROM release_reservation('<RESERVATION_ID_JA_LIBERADO>'::uuid, 'failed');
--     → success=true, message='Already released', saldo INALTERADO,
--       NENHUMA linha nova em credit_history (idempotência sem duplo reembolso)
```

## Alerta de regressão — `migrations/release_reservation_rebuild.sql`

Se esta correção for aplicada e depois alguém rodar o rebuild antigo, o §2 dele **sobrescreve** a função com o corpo sem `reason` e com o catch genérico de volta. Após a aplicação do item 1 (Decisão 3, confirmada): atualizar o §2 do rebuild com o corpo novo — ou marcá-lo como superado — e fazer `db/functions/release_reservation.sql` espelhar o corpo aplicado. Ambas as edições entram na fase "aplicar", mediante OK.
