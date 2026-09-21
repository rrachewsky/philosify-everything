-- ============================================================================
-- Bloco 3(b) — Coletivo legado: DROP das tabelas mortas + trigger órfã
-- ============================================================================
-- Tabelas alvo (public): analysis_groups, group_members, group_chat_messages
-- Trigger/função alvo: broadcast_group_chat_message (nome informado pelo Bob;
--                      o passo 1-B confirma o nome real — o passo 2 só dropa o
--                      que o próprio bloco encontrar no catálogo, nunca um nome
--                      digitado à mão)
--
-- Três passos, três colagens separadas no SQL Editor do Supabase:
--   PASSO 1  pré-flight   — só SELECT. Nada muda. Cada bloco tem o valor esperado.
--   PASSO 2  drop gated   — um único DO $$ ... $$ que refaz as checagens do passo 1
--                            e ABORTA (RAISE EXCEPTION) se qualquer uma falhar.
--                            Sem CASCADE: qualquer dependência não prevista aborta.
--   PASSO 3  verificação  — só SELECT. Cada bloco tem o valor esperado.
--
-- NÃO executar o passo 2 se qualquer linha do passo 1 sair diferente do esperado.
-- NÃO executar nada sem o OK do Bob.
-- ============================================================================


-- ############################################################################
-- PASSO 1 — PRÉ-FLIGHT (somente leitura)
-- ############################################################################

-- 1-A) As três tabelas existem e estão vazias.
--      Esperado: 3 linhas, rows = 0 em todas.
SELECT 'analysis_groups'     AS tabela, count(*) AS rows FROM public.analysis_groups
UNION ALL
SELECT 'group_members',                 count(*)         FROM public.group_members
UNION ALL
SELECT 'group_chat_messages',           count(*)         FROM public.group_chat_messages;

-- 1-B) Triggers nas três tabelas + função que cada uma chama + corpo.
--      Esperado: apenas a trigger órfã em group_chat_messages
--      (função broadcast_group_chat_message ou similar). Anotar tgname e função.
SELECT c.relname AS tabela, t.tgname, p.proname AS funcao,
       pg_get_triggerdef(t.oid) AS trigger_def,
       pg_get_functiondef(p.oid) AS function_def
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public' AND NOT t.tgisinternal
  AND c.relname IN ('analysis_groups', 'group_members', 'group_chat_messages')
ORDER BY 1, 2;

-- 1-C) A função da trigger órfã é usada por alguma trigger FORA das três tabelas?
--      Esperado: 0 linhas. (Se houver, a função NÃO pode ser dropada.)
SELECT p.proname AS funcao, c.relname AS tabela_externa, t.tgname
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND p.oid IN (
    SELECT t2.tgfoid FROM pg_trigger t2
    JOIN pg_class c2 ON c2.oid = t2.tgrelid
    JOIN pg_namespace n2 ON n2.oid = c2.relnamespace
    WHERE n2.nspname = 'public' AND NOT t2.tgisinternal
      AND c2.relname IN ('analysis_groups', 'group_members', 'group_chat_messages'))
  AND c.relname NOT IN ('analysis_groups', 'group_members', 'group_chat_messages');

-- 1-D) FKs de OUTRAS tabelas apontando PARA as três (dependências de entrada).
--      Esperado: 0 linhas. FKs de saída (group_members → analysis_groups,
--      → auth.users, → analyses) são esperadas e somem com a tabela.
SELECT con.conname, src.relname AS tabela_origem, tgt.relname AS aponta_para,
       pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con
JOIN pg_class tgt ON tgt.oid = con.confrelid
JOIN pg_class src ON src.oid = con.conrelid
JOIN pg_namespace n ON n.oid = tgt.relnamespace
WHERE con.contype = 'f' AND n.nspname = 'public'
  AND tgt.relname IN ('analysis_groups', 'group_members', 'group_chat_messages')
  AND src.relname NOT IN ('analysis_groups', 'group_members', 'group_chat_messages');

-- 1-E) Views / materialized views que dependem das três tabelas.
--      Esperado: 0 linhas.
SELECT DISTINCT dep_ns.nspname AS schema, dep.relname AS view_dependente, dep.relkind
FROM pg_depend d
JOIN pg_rewrite r ON r.oid = d.objid
JOIN pg_class dep ON dep.oid = r.ev_class
JOIN pg_namespace dep_ns ON dep_ns.oid = dep.relnamespace
JOIN pg_class base ON base.oid = d.refobjid
JOIN pg_namespace base_ns ON base_ns.oid = base.relnamespace
WHERE base_ns.nspname = 'public'
  AND base.relname IN ('analysis_groups', 'group_members', 'group_chat_messages')
  AND dep.oid <> base.oid;

-- 1-F) Funções cujo corpo cita as três tabelas — além das funções de trigger do 1-B.
--      Esperado: 0 linhas.
SELECT n.nspname, p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND (p.prosrc ILIKE '%analysis_groups%'
    OR p.prosrc ILIKE '%group_members%'
    OR p.prosrc ILIKE '%group_chat_messages%')
  AND p.oid NOT IN (
    SELECT t.tgfoid FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace cn ON cn.oid = c.relnamespace
    WHERE cn.nspname = 'public' AND NOT t.tgisinternal
      AND c.relname IN ('analysis_groups', 'group_members', 'group_chat_messages'));

-- 1-G) Informativo (somem junto com a tabela; registrar para o rollback):
--      policies RLS, índices, constraints, publicações realtime, colunas.
SELECT 'policy' AS tipo, tablename AS tabela, policyname AS nome, cmd::text AS detalhe
FROM pg_policies WHERE schemaname = 'public'
  AND tablename IN ('analysis_groups', 'group_members', 'group_chat_messages')
UNION ALL
SELECT 'index', tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname = 'public'
  AND tablename IN ('analysis_groups', 'group_members', 'group_chat_messages')
UNION ALL
SELECT 'constraint', c.relname, con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('analysis_groups', 'group_members', 'group_chat_messages')
UNION ALL
SELECT 'publication', tablename, pubname, ''
FROM pg_publication_tables WHERE schemaname = 'public'
  AND tablename IN ('analysis_groups', 'group_members', 'group_chat_messages')
ORDER BY 1, 2, 3;

SELECT table_name, ordinal_position, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('analysis_groups', 'group_members', 'group_chat_messages')
ORDER BY 1, 2;

-- 1-H) Linha de base do Coletivo VIVO (não muda com o passo 2; comparar no passo 3).
SELECT 'collective_groups' AS tabela, count(*) AS rows FROM public.collective_groups
UNION ALL SELECT 'collective_members',  count(*) FROM public.collective_members
UNION ALL SELECT 'collective_analyses', count(*) FROM public.collective_analyses
UNION ALL SELECT 'collective_comments', count(*) FROM public.collective_comments;


-- ############################################################################
-- PASSO 2 — DROP GATED (uma única colagem; aborta inteiro se algo falhar)
-- ############################################################################
-- Só rodar com: 1-A rows = 0 nas três, 1-C = 0, 1-D = 0, 1-E = 0, 1-F = 0.
-- O bloco refaz todas essas checagens; se alguma falhar, RAISE EXCEPTION e
-- nada é alterado (o DO inteiro roda em uma transação).
--
-- HISTÓRICO (21/09/2026): a PRIMEIRA versão deste bloco abortou em produção com
--   SQLSTATE 2BP01 (dependent_objects_still_exist) no DROP TABLE sem CASCADE:
--   a policy RLS "Members can view their groups" (em analysis_groups) referencia
--   group_members no seu USING — dependência cruzada entre as próprias tabelas
--   mortas, que o pré-flight listava (1-G) mas não tratava como gate.
--   Foi o gate anti-CASCADE funcionando como desenhado: nada foi alterado.
--   Versão canônica abaixo (corrigida pelo supervisor, executada com sucesso):
--   dropa as policies das 3 tabelas ANTES dos DROP TABLE, colhidas de
--   pg_policies em loop (nunca por nome digitado); o resto é idêntico.

DO $$
DECLARE
  v_tables text[] := ARRAY['analysis_groups', 'group_members', 'group_chat_messages'];
  v_t      text;
  v_n      bigint;
  v_fn     record;
  v_pol    record;
  v_fns    oid[] := ARRAY[]::oid[];
BEGIN
  -- Gate 0: as três tabelas existem (se alguma já não existir, aborta:
  -- estado difere do pré-flight → reavaliar, não improvisar).
  FOREACH v_t IN ARRAY v_tables LOOP
    IF to_regclass('public.' || v_t) IS NULL THEN
      RAISE EXCEPTION 'GATE 0: tabela public.% não existe — estado difere do pré-flight', v_t;
    END IF;
  END LOOP;

  -- Gate 1: zero linhas em cada tabela.
  FOREACH v_t IN ARRAY v_tables LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', v_t) INTO v_n;
    IF v_n <> 0 THEN
      RAISE EXCEPTION 'GATE 1: public.% tem % linha(s) — abortado', v_t, v_n;
    END IF;
  END LOOP;

  -- Gate 2: nenhuma FK de fora apontando para as três.
  SELECT count(*) INTO v_n
  FROM pg_constraint con
  JOIN pg_class tgt ON tgt.oid = con.confrelid
  JOIN pg_class src ON src.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = tgt.relnamespace
  WHERE con.contype = 'f' AND n.nspname = 'public'
    AND tgt.relname = ANY (v_tables) AND NOT (src.relname = ANY (v_tables));
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'GATE 2: % FK(s) externa(s) apontam para as tabelas — abortado', v_n;
  END IF;

  -- Gate 3: nenhuma view dependente.
  SELECT count(DISTINCT dep.oid) INTO v_n
  FROM pg_depend d
  JOIN pg_rewrite r ON r.oid = d.objid
  JOIN pg_class dep ON dep.oid = r.ev_class
  JOIN pg_class base ON base.oid = d.refobjid
  JOIN pg_namespace bn ON bn.oid = base.relnamespace
  WHERE bn.nspname = 'public' AND base.relname = ANY (v_tables) AND dep.oid <> base.oid;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'GATE 3: % view(s) dependem das tabelas — abortado', v_n;
  END IF;

  -- Coleta as funções de trigger das três tabelas ANTES do drop (as triggers
  -- somem com a tabela; a função ficaria órfã).
  FOR v_fn IN
    SELECT DISTINCT p.oid, p.proname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE n.nspname = 'public' AND NOT t.tgisinternal AND c.relname = ANY (v_tables)
  LOOP
    -- Gate 4: a função não pode estar em uso por trigger de outra tabela.
    SELECT count(*) INTO v_n
    FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    WHERE NOT t.tgisinternal AND t.tgfoid = v_fn.oid AND NOT (c.relname = ANY (v_tables));
    IF v_n <> 0 THEN
      RAISE EXCEPTION 'GATE 4: função % é usada por trigger de outra tabela — abortado', v_fn.proname;
    END IF;
    v_fns := v_fns || v_fn.oid;
    RAISE NOTICE 'função de trigger marcada para drop: %', v_fn.proname;
  END LOOP;

  -- Gate 5: nenhuma outra função cita as tabelas (além das de trigger acima).
  SELECT count(*) INTO v_n
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND (p.prosrc ILIKE '%analysis_groups%' OR p.prosrc ILIKE '%group_members%'
         OR p.prosrc ILIKE '%group_chat_messages%')
    AND NOT (p.oid = ANY (v_fns));
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'GATE 5: % função(ões) citam as tabelas — abortado', v_n;
  END IF;

  -- Policies RLS das 3 tabelas ANTES dos DROP TABLE (ver HISTÓRICO/2BP01 acima).
  -- Colhidas do catálogo; somem de qualquer forma com a tabela, mas a policy de
  -- analysis_groups que cita group_members impede o DROP sem CASCADE.
  FOR v_pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = ANY (v_tables)
    ORDER BY tablename, policyname
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', v_pol.policyname, v_pol.schemaname, v_pol.tablename);
    RAISE NOTICE 'policy removida: %.% / %', v_pol.schemaname, v_pol.tablename, v_pol.policyname;
  END LOOP;

  -- DROP (filhas primeiro; sem CASCADE — dependência inesperada aborta aqui).
  DROP TABLE public.group_chat_messages;
  DROP TABLE public.group_members;
  DROP TABLE public.analysis_groups;
  RAISE NOTICE 'tabelas removidas: group_chat_messages, group_members, analysis_groups';

  -- DROP das funções de trigger agora órfãs (assinatura exata, sem CASCADE).
  FOR v_fn IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args, n.nspname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.oid = ANY (v_fns)
  LOOP
    EXECUTE format('DROP FUNCTION %I.%I(%s)', v_fn.nspname, v_fn.proname, v_fn.args);
    RAISE NOTICE 'função removida: %.%(%)', v_fn.nspname, v_fn.proname, v_fn.args;
  END LOOP;
END
$$;


-- ############################################################################
-- PASSO 3 — VERIFICAÇÃO (somente leitura)
-- ############################################################################

-- 3-A) As três tabelas não existem mais. Esperado: 0 linhas.
SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND relname IN ('analysis_groups', 'group_members', 'group_chat_messages');

-- 3-B) Nenhuma função órfã sobrou (pelo nome informado e por corpo). Esperado: 0 linhas.
SELECT n.nspname, p.proname
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'broadcast_group_chat_message'
   OR (n.nspname NOT IN ('pg_catalog', 'information_schema')
       AND (p.prosrc ILIKE '%analysis_groups%' OR p.prosrc ILIKE '%group_members%'
            OR p.prosrc ILIKE '%group_chat_messages%'));

-- 3-C) Nenhuma policy / publicação órfã. Esperado: 0 linhas.
SELECT 'policy' AS tipo, tablename FROM pg_policies
WHERE tablename IN ('analysis_groups', 'group_members', 'group_chat_messages')
UNION ALL
SELECT 'publication', tablename FROM pg_publication_tables
WHERE tablename IN ('analysis_groups', 'group_members', 'group_chat_messages');

-- 3-D) Coletivo VIVO intacto: mesmas contagens do 1-H e mesmas triggers.
SELECT 'collective_groups' AS tabela, count(*) AS rows FROM public.collective_groups
UNION ALL SELECT 'collective_members',  count(*) FROM public.collective_members
UNION ALL SELECT 'collective_analyses', count(*) FROM public.collective_analyses
UNION ALL SELECT 'collective_comments', count(*) FROM public.collective_comments;

SELECT c.relname AS tabela, t.tgname, p.proname AS funcao
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public' AND NOT t.tgisinternal
  AND c.relname LIKE 'collective\_%'
ORDER BY 1, 2;
