# CRÉDITOS · ETAPA 2-C · `confirm_reservation` v2 (origem dentro da RPC) — migração gated

**Status:** BANCO APLICADO E PROVADO pelo Bob em 07/10/2026 (SQL Editor de produção); espelho e inventário atualizados em 07/10. Worker (§ 8) pendente de diff → OK → deploy. Proposta redigida em 06/10.
**Decisões já dadas (OK de 06/10, `CREDITOS_ETAPA2_AUDITORIA_2026-10-06.md` § 4):** drop-all + CREATE (lição de 25/08); vocabulário fechado de `source`; alinhar aos irmãos (`SECURITY DEFINER`, `search_path`, `#variable_conflict use_column`); **remover** o `EXCEPTION WHEN OTHERS` externo; snapshots inalterados (item 3 vai para o extrato).
**Sequência:** pré-flight (só leitura) → parecer → `BEGIN…COMMIT` → verificação → prova funcional → espelho segue o banco → depois o worker (confirm.js + 14 pontos + idade 0→2 + quiz) num deploy só.

---

## 1. Ponto de partida (vivo, conferido)

`public.confirm_reservation(p_reservation_id uuid, p_analysis_id text) RETURNS TABLE(success boolean, message text, total integer, purchased integer, free integer)`, `plpgsql`, **sem** `SECURITY DEFINER`, sem `search_path`, 1 overload, `src = 2114`, 0 triggers (inventário I-1b linha 78; espelho `db/functions/confirm_reservation.sql` idêntico ao dump de 22/09). Único chamador: `api/src/credits/confirm.js:30` via `callRpc` com service key → `service_role`.

O corpo atual grava `analysis_id = p_analysis_id::uuid` em `credit_reservations` e em `credit_history`, e `metadata = {reservation_id, analysis_id, credit_type}`. Falha de qualquer natureza cai no `EXCEPTION WHEN OTHERS` e volta como `success=false, message=SQLERRM` (engolida pelo worker em `confirm.js:35-38`).

**Risco que o desenho expôs (pré-flight decide):** `credit_history.analysis_id` tem FK para `analyses(id) ON DELETE SET NULL` (pré-flight 0e de 28/08, `docs/TAREFA2_ITEM1_RELEASE_RESERVATION.md`). Livro, cinema e news confirmam com uuids de `book_analyses`/`film_analyses`/news (`api/index.js:3453`, `cinema-analyze.js:118,160,429`, `news-analyze.js:97`). Se a FK existir como registrado, esses INSERTs violam a FK, o catch genérico devolve `success=false`, a reserva fica `pending` e o reaper devolve o crédito em 10 min: **cobrança zero em livro/cinema/news com cache**. O P4/P5 abaixo medem isso. O corpo v2 grava o uuid na FK **só quando existe em `analyses`** e guarda o id bruto em `metadata.analysis_id` (texto) para o extrato ligar pela `source`.

## 2. O que muda no corpo

| | v1 (vivo) | v2 (proposta) |
|---|---|---|
| Assinatura | `(p_reservation_id uuid, p_analysis_id text)` | `(p_reservation_id uuid, p_analysis_id text, p_source text DEFAULT NULL, p_description text DEFAULT NULL, p_batch_id uuid DEFAULT NULL)`. Chamada antiga com 2 args continua válida: o worker pode ser deployado **depois** |
| Retorno | `TABLE(success, message, total, purchased, free)` | **igual** (`confirm.js:117-125` lê `total/purchased/free`) |
| Segurança | sem definer, sem search_path | `SECURITY DEFINER`, `SET search_path TO 'public'`, `#variable_conflict use_column`, referências com alias (`r.`, `c.`) |
| `analysis_id` | `p_analysis_id::uuid` cru (22P02 se não for uuid; worker zera antes) | `v_analysis_uuid` = cast só se casar com regex de uuid; gravado em `credit_reservations.analysis_id` e `credit_history.analysis_id` **só se existir em `analyses`** (`v_analysis_fk`). Texto bruto sempre em `metadata.analysis_id` |
| `credit_reservations` | `status='confirmed', analysis_id, confirmed_at` | idem + `reason = 'success'::reservation_reason` (enum tem o label, 0b de 28/08; `release_reservation` já preenche o dela) |
| `metadata` | `{reservation_id, analysis_id, credit_type}` | idem `\|\| jsonb_strip_nulls({source, description, batch_id})` |
| Erro | `EXCEPTION WHEN OTHERS → FALSE, SQLERRM` | **sem catch externo**: erro de SQL aborta o RPC, PostgREST devolve 400 com SQLERRM, `confirm.js:118` loga a mensagem inteira |
| ACL | o que P1 mostrar | `REVOKE … FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role` (como 29/08; com DEFINER a função não pode ficar executável por `authenticated`) |
| Snapshots | derivados no confirm | **inalterados** (decisão B) |

**Vocabulário de `p_source`** (fechado; o worker só manda estes): `music, book, cinema, news, news_sources, panel, colloquium_access, colloquium_participate, colloquium_philosopher, colloquium_propose, open_debate, quiz, space, unsafe_zone`. A RPC **não valida** a lista (texto livre em `metadata`); validar criaria um ponto de falha de cobrança por typo. A lista mora no worker, numa constante única.

## 3. Pré-flight (só leitura, colar a saída)

```sql
-- P1. Fingerprint. Esperado: 1 linha, overloads = 1, assinatura 'p_reservation_id uuid, p_analysis_id text',
--     secdef = f, src = 2114, tem_catch = t. Anotar acl (NULL = default: EXECUTE para PUBLIC).
SELECT p.proname, count(*) OVER () AS overloads,
       pg_get_function_identity_arguments(p.oid) AS assinatura,
       pg_get_function_result(p.oid) AS retorno,
       p.prosecdef AS secdef, length(p.prosrc) AS src,
       pg_get_functiondef(p.oid) ~ 'SELECT FALSE, SQLERRM' AS tem_catch,
       p.proacl AS acl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'confirm_reservation';

-- P2. Enum reservation_reason tem 'success' (vai para credit_reservations.reason). Esperado: success|cached|failed|timeout.
SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typname = 'reservation_reason' ORDER BY e.enumsortorder;

-- P3. Colunas que o corpo toca em credit_reservations. Esperado: analysis_id uuid, confirmed_at timestamptz,
--     reason reservation_reason (USER-DEFINED), status, credit_type, user_id.
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'credit_reservations'
ORDER BY ordinal_position;

-- P4. FKs em analysis_id (as duas tabelas). Decide a guarda v_analysis_fk.
SELECT c.conrelid::regclass AS tabela, c.conname, pg_get_constraintdef(c.oid) AS def
FROM pg_constraint c
WHERE c.contype = 'f' AND c.conrelid IN ('public.credit_history'::regclass, 'public.credit_reservations'::regclass)
ORDER BY 1, 2;

-- P5. Medida do risco do § 1: reservas devolvidas por timeout nos últimos 30 dias, por motivo.
--     Muitos 'timeout' (cron) sem incidente conhecido = confirms falhando em silêncio.
SELECT r.release_reason, r.status, count(*) AS n, min(r.created_at) AS primeira, max(r.created_at) AS ultima
FROM credit_reservations r
WHERE r.created_at > now() - interval '30 days'
GROUP BY 1, 2 ORDER BY 3 DESC;

-- P6. Linhas 'analysis' sem analysis_id nos últimos 30 dias (medida do item 4 antes da v2).
SELECT count(*) FILTER (WHERE analysis_id IS NULL) AS sem_analysis_id,
       count(*) FILTER (WHERE metadata ? 'description') AS com_description,
       count(*) AS total
FROM credit_history
WHERE type = 'analysis' AND created_at > now() - interval '30 days';
```

**Condições de parada:** P1 com `overloads > 1` → o DO drop-all do § 4 resolve, mas colar a saída antes. P1 com `src <> 2114` ou `secdef = t` → o banco mudou desde 22/09; colar `pg_get_functiondef` inteiro. P2 sem `success` → tirar a linha `reason = 'success'` do UPDATE. P3 sem `confirmed_at` ou `reason` → ajustar o UPDATE. P4 com FK em `credit_reservations.analysis_id` → a guarda `v_analysis_fk` vale para as duas tabelas (já é assim no corpo); sem FK nenhuma → a guarda é só conservadora, fica. P1 com `acl` contendo `anon`/`authenticated` explicitamente → registrar; o REVOKE do § 4 fecha.

## 4. Migração (uma transação; só após parecer + pré-flight colado)

```sql
BEGIN;

-- 1. Drop de TODOS os overloads (padrão 29/08). CREATE OR REPLACE com assinatura nova criaria um
--    segundo overload e o PostgREST passaria a responder 300 (ambíguo) para a chamada do worker.
DO $do$
DECLARE v_fn RECORD;
BEGIN
  FOR v_fn IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'confirm_reservation'
  LOOP
    EXECUTE format('DROP FUNCTION public.%I(%s)', v_fn.proname, v_fn.args);
    RAISE NOTICE 'dropped: %(%)', v_fn.proname, v_fn.args;
  END LOOP;
END $do$;

-- 2. confirm_reservation v2
CREATE FUNCTION public.confirm_reservation(
  p_reservation_id uuid,
  p_analysis_id    text,
  p_source         text DEFAULT NULL,
  p_description    text DEFAULT NULL,
  p_batch_id       uuid DEFAULT NULL
)
 RETURNS TABLE(success boolean, message text, total integer, purchased integer, free integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_user_id            UUID;
  v_credit_type        VARCHAR(10);
  v_reservation_status VARCHAR(20);
  v_purchased          INTEGER;
  v_free               INTEGER;
  v_total              INTEGER;
  v_analysis_uuid      UUID;   -- p_analysis_id quando é uuid sintaticamente
  v_analysis_fk        UUID;   -- v_analysis_uuid quando existe em analyses (FK)
BEGIN
  -- Id de análise: uuid só se tiver forma de uuid; FK só se existir em analyses.
  -- O texto bruto vai sempre para metadata.analysis_id (livro/cinema/news ligam por lá + source).
  IF p_analysis_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_analysis_uuid := p_analysis_id::uuid;
    SELECT a.id INTO v_analysis_fk FROM analyses a WHERE a.id = v_analysis_uuid;
  END IF;

  SELECT r.user_id, r.credit_type, r.status
  INTO v_user_id, v_credit_type, v_reservation_status
  FROM credit_reservations r
  WHERE r.id = p_reservation_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Reservation not found'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  -- Idempotente: já confirmada devolve sucesso com o saldo atual, sem nova linha
  IF v_reservation_status = 'confirmed' THEN
    SELECT c.total, c.purchased, c.free_remaining INTO v_total, v_purchased, v_free
    FROM credits c WHERE c.user_id = v_user_id;
    RETURN QUERY SELECT TRUE, 'Already confirmed'::TEXT, v_total, v_purchased, v_free;
    RETURN;
  END IF;

  IF v_reservation_status = 'released' THEN
    RETURN QUERY SELECT FALSE, 'Reservation was already released'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  UPDATE credit_reservations r
  SET status       = 'confirmed',
      reason       = 'success'::reservation_reason,
      analysis_id  = v_analysis_fk,
      confirmed_at = NOW()
  WHERE r.id = p_reservation_id;

  SELECT c.total, c.purchased, c.free_remaining
  INTO v_total, v_purchased, v_free
  FROM credits c
  WHERE c.user_id = v_user_id;

  -- Linha de extrato do consumo. Snapshots como na v1 (decisão B de 06/10: o extrato recalcula).
  INSERT INTO credit_history (
    user_id, type, amount,
    purchased_before, purchased_after,
    free_before, free_after,
    total_before, total_after,
    status, metadata, analysis_id
  ) VALUES (
    v_user_id, 'analysis', -1,
    v_purchased + (CASE WHEN v_credit_type = 'paid' THEN 1 ELSE 0 END), v_purchased,
    v_free      + (CASE WHEN v_credit_type = 'free' THEN 1 ELSE 0 END), v_free,
    v_total + 1, v_total,
    'completed',
    jsonb_build_object(
      'reservation_id', p_reservation_id,
      'analysis_id',    p_analysis_id,
      'credit_type',    v_credit_type
    ) || jsonb_strip_nulls(jsonb_build_object(
      'source',      p_source,
      'description', p_description,
      'batch_id',    p_batch_id
    )),
    v_analysis_fk
  );

  RETURN QUERY SELECT TRUE, 'Reservation confirmed'::TEXT, v_total, v_purchased, v_free;
END;
$function$;
-- SEM "EXCEPTION WHEN OTHERS" externo (decisão C de 06/10): erro real de SQL aborta o RPC
-- e chega com SQLERRM ao log do worker (api/src/credits/confirm.js:118).

-- 3. ACL worker-only (DEFINER não pode ficar executável por anon/authenticated)
REVOKE ALL ON FUNCTION public.confirm_reservation(uuid, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_reservation(uuid, text, text, text, uuid) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
```

Entre o `COMMIT` e o deploy do worker, a chamada atual com 2 args (`{p_reservation_id, p_analysis_id}`) casa com a única função pelos defaults. Nenhuma janela quebrada.

## 5. Verificação estrutural (só leitura, logo após)

```sql
-- Esperado: 1 linha, overloads = 1, assinatura com p_source/p_description/p_batch_id, secdef = t,
-- tem_diretiva = t, sem_catch = t, grava_source = t, guarda_fk = t, acl só owner + service_role.
SELECT p.proname, count(*) OVER () AS overloads,
       pg_get_function_identity_arguments(p.oid)                     AS assinatura,
       p.prosecdef                                                    AS secdef,
       pg_get_functiondef(p.oid) ~  '#variable_conflict use_column'   AS tem_diretiva,
       pg_get_functiondef(p.oid) !~ 'SELECT FALSE, SQLERRM'           AS sem_catch,
       pg_get_functiondef(p.oid) ~  '''source'', *p_source'           AS grava_source,
       pg_get_functiondef(p.oid) ~  'v_analysis_fk'                   AS guarda_fk,
       length(p.prosrc) AS src, p.proacl AS acl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'confirm_reservation';
```

## 6. Prova funcional (DO; tudo desfeito pelo `RAISE EXCEPTION` final)

Seis casos sobre reservas reais de `reserve_credit`, no usuário com saldo mais recente (trocar a subquery de `v_uid` pelo seu UUID se quiser). Nada persiste.

```sql
DO $t$
DECLARE
  v_uid   uuid;
  v_t0    integer;
  v_res   uuid;
  v_ok    boolean;
  v_msg   text;
  v_tot   integer;
  v_an    uuid;    -- uma análise real de analyses
  v_fake  uuid := gen_random_uuid();
  v_batch uuid := gen_random_uuid();
  v_row   record;
  v_n     integer;
  v_laudo text := '';
BEGIN
  SELECT user_id INTO v_uid FROM credits WHERE total >= 5 ORDER BY updated_at DESC LIMIT 1;
  IF v_uid IS NULL THEN RAISE EXCEPTION 'FALHOU: nenhum usuario com total >= 5'; END IF;
  SELECT id INTO v_an FROM analyses WHERE deleted_at IS NULL LIMIT 1;
  IF v_an IS NULL THEN RAISE EXCEPTION 'FALHOU: analyses vazia'; END IF;
  SELECT total INTO v_t0 FROM credits WHERE user_id = v_uid;

  -- A. id não-uuid + source/description/batch → analysis_id NULL, metadata completa
  SELECT reservation_id INTO v_res FROM reserve_credit(v_uid);
  SELECT success, message, total INTO v_ok, v_msg, v_tot
    FROM confirm_reservation(v_res, 'quiz:start:teste', 'quiz', 'Quiz start (teste)', v_batch);
  IF NOT v_ok THEN RAISE EXCEPTION 'FALHOU A1: %', v_msg; END IF;
  SELECT * INTO v_row FROM credit_history WHERE metadata->>'reservation_id' = v_res::text;
  IF v_row.type <> 'analysis' OR v_row.amount <> -1 OR v_row.analysis_id IS NOT NULL
     OR v_row.metadata->>'source' <> 'quiz' OR v_row.metadata->>'description' <> 'Quiz start (teste)'
     OR v_row.metadata->>'batch_id' <> v_batch::text OR v_row.metadata->>'analysis_id' <> 'quiz:start:teste'
     OR v_row.total_after <> v_t0 - 1 THEN
    RAISE EXCEPTION 'FALHOU A2: linha = %', to_jsonb(v_row);
  END IF;
  SELECT status, reason::text INTO v_row FROM credit_reservations WHERE id = v_res;
  IF v_row.status <> 'confirmed' OR v_row.reason <> 'success' THEN RAISE EXCEPTION 'FALHOU A3: reserva %', to_jsonb(v_row); END IF;
  v_laudo := 'A ok';

  -- B. uuid real de analyses → FK preenchida nas duas tabelas
  SELECT reservation_id INTO v_res FROM reserve_credit(v_uid);
  SELECT success, message INTO v_ok, v_msg FROM confirm_reservation(v_res, v_an::text, 'music', NULL, NULL);
  IF NOT v_ok THEN RAISE EXCEPTION 'FALHOU B1: %', v_msg; END IF;
  SELECT * INTO v_row FROM credit_history WHERE metadata->>'reservation_id' = v_res::text;
  IF v_row.analysis_id IS DISTINCT FROM v_an OR v_row.metadata->>'source' <> 'music' OR v_row.metadata ? 'description' THEN
    RAISE EXCEPTION 'FALHOU B2: linha = %', to_jsonb(v_row);
  END IF;
  IF (SELECT analysis_id FROM credit_reservations WHERE id = v_res) IS DISTINCT FROM v_an THEN RAISE EXCEPTION 'FALHOU B3'; END IF;
  v_laudo := v_laudo || ' | B ok';

  -- C. uuid de OUTRA tabela (livro/cinema/news) → sem erro, FK NULL, texto em metadata
  SELECT reservation_id INTO v_res FROM reserve_credit(v_uid);
  SELECT success, message INTO v_ok, v_msg FROM confirm_reservation(v_res, v_fake::text, 'cinema', 'Filme (teste)', NULL);
  IF NOT v_ok THEN RAISE EXCEPTION 'FALHOU C1: %', v_msg; END IF;
  SELECT * INTO v_row FROM credit_history WHERE metadata->>'reservation_id' = v_res::text;
  IF v_row.analysis_id IS NOT NULL OR v_row.metadata->>'analysis_id' <> v_fake::text OR v_row.metadata->>'source' <> 'cinema' THEN
    RAISE EXCEPTION 'FALHOU C2: linha = %', to_jsonb(v_row);
  END IF;
  v_laudo := v_laudo || ' | C ok (uuid estrangeiro nao quebra)';

  -- D. forma antiga da chamada (2 args) continua valendo
  SELECT reservation_id INTO v_res FROM reserve_credit(v_uid);
  SELECT success, message INTO v_ok, v_msg FROM confirm_reservation(v_res, NULL);
  IF NOT v_ok THEN RAISE EXCEPTION 'FALHOU D1: %', v_msg; END IF;
  SELECT * INTO v_row FROM credit_history WHERE metadata->>'reservation_id' = v_res::text;
  IF v_row.metadata ? 'source' OR v_row.metadata ? 'batch_id' THEN RAISE EXCEPTION 'FALHOU D2: %', to_jsonb(v_row); END IF;
  v_laudo := v_laudo || ' | D ok (2 args)';

  -- E. idempotencia: confirmar de novo nao cria linha
  SELECT success, message INTO v_ok, v_msg FROM confirm_reservation(v_res, NULL, 'quiz', NULL, NULL);
  IF NOT v_ok OR v_msg <> 'Already confirmed' THEN RAISE EXCEPTION 'FALHOU E1: % %', v_ok, v_msg; END IF;
  SELECT count(*) INTO v_n FROM credit_history WHERE metadata->>'reservation_id' = v_res::text;
  IF v_n <> 1 THEN RAISE EXCEPTION 'FALHOU E2: % linhas', v_n; END IF;
  v_laudo := v_laudo || ' | E ok';

  -- F. reserva liberada nao confirma
  SELECT reservation_id INTO v_res FROM reserve_credit(v_uid);
  PERFORM release_reservation(v_res, 'failed', NULL);
  SELECT success, message INTO v_ok, v_msg FROM confirm_reservation(v_res, NULL, 'quiz', NULL, NULL);
  IF v_ok OR v_msg <> 'Reservation was already released' THEN RAISE EXCEPTION 'FALHOU F1: % %', v_ok, v_msg; END IF;
  v_laudo := v_laudo || ' | F ok';

  SELECT total INTO v_tot FROM credits WHERE user_id = v_uid;
  RAISE EXCEPTION 'TESTE OK (tudo desfeito) :: % :: saldo %->% (4 confirmados, 1 devolvido)', v_laudo, v_t0, v_tot;
END $t$;
```

Esperado: `ERROR: TESTE OK (tudo desfeito) :: A ok | B ok | C ok (uuid estrangeiro nao quebra) | D ok (2 args) | E ok | F ok :: saldo N->N-4 (…)`. `FALHOU x` aponta o elo. O usuário de teste precisa de 5 créditos só dentro da transação; nada fica.

Teste do "antes" (opcional, mostra o risco do § 1 na v1): rodar só o caso C contra a função atual. Se P4 confirmar a FK, a v1 devolve `success=false` com `violates foreign key constraint`.

## 7. Rollback exato (recria a v1 de 22/09)

```sql
BEGIN;
DO $do$
DECLARE v_fn RECORD;
BEGIN
  FOR v_fn IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'confirm_reservation'
  LOOP
    EXECUTE format('DROP FUNCTION public.%I(%s)', v_fn.proname, v_fn.args);
  END LOOP;
END $do$;

CREATE OR REPLACE FUNCTION public.confirm_reservation(p_reservation_id uuid, p_analysis_id text)
 RETURNS TABLE(success boolean, message text, total integer, purchased integer, free integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_user_id UUID;
  v_credit_type VARCHAR(10);
  v_reservation_status VARCHAR(20);
  v_purchased INTEGER;
  v_free INTEGER;
  v_total INTEGER;
BEGIN
  SELECT user_id, credit_type, status
  INTO v_user_id, v_credit_type, v_reservation_status
  FROM credit_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Reservation not found'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  IF v_reservation_status = 'confirmed' THEN
    SELECT c.total, c.purchased, c.free_remaining INTO v_total, v_purchased, v_free
    FROM credits c WHERE c.user_id = v_user_id;
    RETURN QUERY SELECT TRUE, 'Already confirmed'::TEXT, v_total, v_purchased, v_free;
    RETURN;
  END IF;

  IF v_reservation_status = 'released' THEN
    RETURN QUERY SELECT FALSE, 'Reservation was already released'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  UPDATE credit_reservations
  SET status = 'confirmed',
      analysis_id = p_analysis_id::uuid,
      confirmed_at = NOW()
  WHERE id = p_reservation_id;

  SELECT c.total, c.purchased, c.free_remaining
  INTO v_total, v_purchased, v_free
  FROM credits c
  WHERE c.user_id = v_user_id;

  INSERT INTO credit_history (
    user_id, type, amount,
    purchased_before, purchased_after,
    free_before, free_after,
    total_before, total_after,
    status, metadata, analysis_id
  ) VALUES (
    v_user_id, 'analysis', -1,
    v_purchased + (CASE WHEN v_credit_type = 'paid' THEN 1 ELSE 0 END), v_purchased,
    v_free + (CASE WHEN v_credit_type = 'free' THEN 1 ELSE 0 END), v_free,
    v_total + 1, v_total,
    'completed',
    jsonb_build_object('reservation_id', p_reservation_id, 'analysis_id', p_analysis_id, 'credit_type', v_credit_type),
    p_analysis_id::uuid
  );

  RETURN QUERY SELECT TRUE, 'Reservation confirmed'::TEXT, v_total, v_purchased, v_free;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM::TEXT, 0, 0, 0;
END;
$function$;
-- ACL: devolver ao que o P1 mostrou (se acl era NULL, nada a fazer: default = EXECUTE para PUBLIC).
COMMIT;
NOTIFY pgrst, 'reload schema';
```

O worker antigo (2 args) e o novo (5 args) funcionam contra a v1? O novo **não**: PostgREST não acha função com `p_source` → 404. Rollback da RPC exige rollback do worker junto (`wrangler rollback`), ou vice-versa só se a ordem for SQL primeiro, worker depois, que é a ordem aprovada.

## 8. Depois do banco (worker; diff próprio para OK, no mesmo deploy)

1. `api/src/credits/confirm.js`: `confirmReservation(env, reservationId, analysisId, userId, { source, description, batchId } = {})` → RPC com `p_source/p_description/p_batch_id`; PATCH (linhas 48-108) removido; `const CREDIT_SOURCES = Object.freeze({...})` com os 14 valores.
2. 14 pontos de confirm recebem `source`/`description`; painel, colóquio (N), espaços e zona insegura geram `batchId` por operação.
3. `api/index.js:2984` e `:3394`: idade `0 → 2` (decisão A; `:761` fica 0, é o cancel explícito).
4. `api/src/handlers/quiz.js`: confirm de `:711` desce para depois de `getValidatedQuestion` (`:715`), antes da resposta; o release de `:718` passa a liberar uma reserva ainda `pending` (adendo do Bob).
5. `release.js:5`: comentário morto sai.
6. Espelho `db/functions/confirm_reservation.sql` = corpo v2 com cabeçalho; inventário linha 78 e 143 atualizados.
7. Commits sugeridos (por ordem): `db: confirm_reservation v2 grava origem do consumo (source, description, batch)` após a verificação do banco; `creditos: origem em todo confirm, quiz cobra so com pergunta, preambulo nao varre reserva em voo` após o aceite do deploy.

## 9. Registro

| Passo | Data | Resultado |
|---|---|---|
| Proposta redigida | 06/10 | este arquivo; nada aplicado |
| Pré-flight P1-P6 | 07/10 | P1: 1 overload, assinatura v1, secdef = f, src 2114, tem_catch = t, **ACL com PUBLIC/anon/authenticated** (EXECUTE aberto, achado de 25/08 confirmado). P2: `success\|cached\|failed\|timeout`. P3: todas as colunas presentes (`status` é enum `reservation_status`; cast implícito já provado em produção). **P4: FK `analysis_id → analyses` NAS DUAS tabelas — achado comercial confirmado**: na v1, confirms de livro/cinema/news com uuid estrangeiro estouravam a FK, o catch engolia, o reaper devolvia o crédito (cobrança zero nessas rotas). P5: tráfego de teste em 30 dias (6 confirmed, 2 timeout, 1 user_cleanup, 1 cached); estrago comercial ~zero porque o beta não abriu. P6: 6/6 linhas de consumo sem `analysis_id`, 0 com `description` — o PATCH nunca rodou |
| Parecer do Bob | 07/10 | dado após o pré-flight |
| BEGIN…COMMIT | 07/10 | Success |
| Verificação § 5 | 07/10 | overloads = 1, 5 parâmetros, secdef = t, tem_diretiva = t, sem_catch = t, grava_source = t, guarda_fk = t, src 2543, ACL postgres + service_role |
| Prova funcional § 6 | 07/10 | em 2 metades (a colagem cortava o bloco único): `TESTE 1/2 OK (tudo desfeito) :: A ok \| B ok \| C ok` e `TESTE 2/2 OK (tudo desfeito) :: D ok (2 args) \| E ok \| F ok`. **6/6** |
| Espelho + inventário | 07/10 | `db/functions/confirm_reservation.sql` = v2 com cabeçalho; inventário linhas 78 e 143. Commit por ordem do Bob |
