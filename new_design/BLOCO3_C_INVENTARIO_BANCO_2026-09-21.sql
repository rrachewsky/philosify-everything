-- ============================================================================
-- Bloco 3(c) — INVENTÁRIO do banco: todos os objetos ainda fora do repo
-- ============================================================================
-- SOMENTE LEITURA. Nenhum bloco altera nada. Colar cada bloco no SQL Editor do
-- Supabase e trazer a saída integral (copiar como texto/CSV, não como print).
--
-- Escopo (decisão do Bob, 21/09): funções de `public` e `audit`, triggers
-- não-internas, policies RLS por tabela. Os blocos I-0 e I-4 são de apoio
-- (contagens e contexto) para conferir se a colagem veio completa.
--
-- Como o resultado é usado: cada função vira db/functions/<schema>.<nome>.sql,
-- cada trigger db/triggers/<schema>.<tabela>.<tgname>.sql, cada tabela com
-- policies db/policies/<schema>.<tabela>.sql — e os 6 espelhos já existentes em
-- db/functions/ são DIFFADOS contra o corpo vivo, nunca sobrescritos em silêncio.
-- ============================================================================


-- ############################################################################
-- I-0 — CONTAGENS (para conferir a completude dos blocos seguintes)
-- ############################################################################
SELECT 'funcoes_public'  AS item, count(*) AS n
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
UNION ALL
SELECT 'funcoes_audit', count(*)
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'audit'
  AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
UNION ALL
SELECT 'triggers_nao_internas', count(*)
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal AND n.nspname IN ('public', 'audit', 'auth', 'storage', 'realtime')
UNION ALL
SELECT 'policies', count(*) FROM pg_policies WHERE schemaname IN ('public', 'audit', 'storage', 'realtime')
UNION ALL
SELECT 'tabelas_public_com_rls', count(*)
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
UNION ALL
SELECT 'tabelas_public_sem_rls', count(*)
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;


-- ############################################################################
-- I-1a — FUNÇÕES: lista (public + audit), sem corpo — um índice para conferir
-- ############################################################################
-- Exclui funções que pertencem a extensões (pg_depend deptype 'e'): essas o
-- repo não precisa espelhar (pgcrypto, uuid-ossp, etc.).
SELECT n.nspname AS schema,
       p.proname  AS funcao,
       pg_get_function_identity_arguments(p.oid) AS args,
       pg_get_function_result(p.oid) AS retorno,
       l.lanname AS linguagem,
       CASE p.prokind WHEN 'f' THEN 'function' WHEN 'p' THEN 'procedure'
                      WHEN 'a' THEN 'aggregate' WHEN 'w' THEN 'window' END AS tipo,
       p.prosecdef AS security_definer,
       length(p.prosrc) AS tamanho_corpo,
       (SELECT count(*) FROM pg_trigger t WHERE t.tgfoid = p.oid AND NOT t.tgisinternal) AS usada_por_triggers
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname IN ('public', 'audit')
  AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
ORDER BY 1, 2, 3;


-- ############################################################################
-- I-1b — FUNÇÕES: corpo completo (pg_get_functiondef) — public + audit
-- ############################################################################
-- Se a saída ficar grande demais para o SQL Editor, rodar duas vezes com o
-- filtro de schema (só 'public', depois só 'audit'), ou fatiar por proname
-- (ex.: AND p.proname < 'm', depois AND p.proname >= 'm').
-- Cada linha = um arquivo db/functions/<schema>.<funcao>.sql.
SELECT n.nspname AS schema,
       p.proname  AS funcao,
       pg_get_function_identity_arguments(p.oid) AS args,
       pg_get_functiondef(p.oid) AS definicao
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'audit')
  AND p.prokind IN ('f', 'p')
  AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
ORDER BY 1, 2, 3;


-- ############################################################################
-- I-2 — TRIGGERS não-internas: definição + função chamada
-- ############################################################################
-- Inclui 'auth' porque on_auth_user_created / _email_updated / _metadata_updated
-- vivem em auth.users com função em public. 'storage' e 'realtime' entram só
-- para não ficar cego; se vierem vazios, melhor.
-- Cada linha = um arquivo db/triggers/<schema>.<tabela>.<tgname>.sql.
SELECT n.nspname AS schema,
       c.relname  AS tabela,
       t.tgname,
       t.tgenabled AS enabled,            -- 'O' = habilitada (origin), 'D' = desabilitada
       fn.nspname || '.' || p.proname AS funcao,
       pg_get_triggerdef(t.oid) AS definicao
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace fn ON fn.oid = p.pronamespace
WHERE NOT t.tgisinternal
  AND n.nspname IN ('public', 'audit', 'auth', 'storage', 'realtime')
ORDER BY 1, 2, 3;


-- ############################################################################
-- I-3 — POLICIES RLS por tabela (public + audit + storage + realtime)
-- ############################################################################
-- Cada tabela = um arquivo db/policies/<schema>.<tabela>.sql com todas as suas
-- policies, mais a linha "ALTER TABLE … ENABLE ROW LEVEL SECURITY" se rls = true.
-- roles: '{public}' = todos; '{authenticated}', '{service_role}', etc.
SELECT pol.schemaname AS schema,
       pol.tablename  AS tabela,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       pol.policyname,
       pol.permissive,
       pol.roles,
       pol.cmd,
       pol.qual        AS using_expr,
       pol.with_check  AS with_check_expr
FROM pg_policies pol
JOIN pg_namespace n ON n.nspname = pol.schemaname
JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = pol.tablename
WHERE pol.schemaname IN ('public', 'audit', 'storage', 'realtime')
ORDER BY 1, 2, 5;


-- ############################################################################
-- I-4 — CONTEXTO (apoio): tabelas sem RLS, tabelas com RLS e zero policy,
--       publicações realtime, e tabelas do schema audit
-- ############################################################################
-- I-4a) Tabelas de public SEM RLS (cada uma é uma decisão a registrar)
SELECT n.nspname AS schema, c.relname AS tabela, 'SEM RLS' AS situacao
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'audit') AND c.relkind = 'r' AND NOT c.relrowsecurity
UNION ALL
-- I-4b) Tabelas COM RLS mas ZERO policy (= bloqueadas para anon/authenticated; só service_role passa)
SELECT n.nspname, c.relname, 'RLS ON, 0 policies'
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'audit') AND c.relkind = 'r' AND c.relrowsecurity
  AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = n.nspname AND p.tablename = c.relname)
ORDER BY 1, 2;

-- I-4c) Publicações realtime (postgres_changes)
SELECT pubname, schemaname, tablename
FROM pg_publication_tables
ORDER BY 1, 2, 3;

-- I-4d) Tabelas e views do schema audit (o repo só conhece audit.archive_underground_post)
SELECT c.relname, c.relkind,
       CASE c.relkind WHEN 'r' THEN (SELECT count(*) FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) END AS colunas
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'audit' AND c.relkind IN ('r', 'v', 'm')
ORDER BY 1;
