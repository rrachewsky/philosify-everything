# Realtime — coleta SQL para fechar as pendências do post-mortem (08/09)

**Data:** 2026-09-08 · **Status:** aguardando execução no SQL Editor (somente leitura — nenhum comando altera nada).
Origem: `REALTIME_POSTMORTEM_2026-09-06.md` (pendências: Bloco 3a, higiene de repo, defeito aberto do Collective).

## O que este pacote fecha

| # | Pendência | Bloco SQL |
|---|---|---|
| 1 | **Bloco 3a** — pra quais tópicos a trigger de `chat_messages` broadcasta hoje (fecha a assimetria do Collective e decide Opção A × B) | 1 e 2 |
| 2 | **Trigger do DM** achada fora do repo na Etapa 1 — versionar | 3 |
| 3 | Espelho byte-a-byte de `is_underground_member` / `is_collective_member` (`db/functions/`) | 4 e 5 |
| 4 | Espelho da migração `realtime_policies_security_definer.sql` (policies recriadas 06/09) | 6 |

Com o resultado colado aqui, eu escrevo os espelhos no repo (`migrations/` + `db/functions/`) sem inventar nada.

## SQL (colar inteiro no SQL Editor; rodar como está — tudo SELECT)

```sql
-- 1) Triggers de chat_messages (definições)
SELECT t.tgname, pg_get_triggerdef(t.oid) AS trigger_def
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'chat_messages' AND NOT t.tgisinternal;

-- 2) Corpo das funções dessas triggers (mostra os realtime.send: tópico/evento/private)
SELECT DISTINCT p.proname, pg_get_functiondef(p.oid) AS function_def
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public' AND c.relname = 'chat_messages' AND NOT t.tgisinternal;

-- 3) Triggers da tabela de DM + corpo (versionar; a Etapa 1 achou fora do repo)
SELECT c.relname AS tabela, t.tgname, pg_get_triggerdef(t.oid) AS trigger_def,
       pg_get_functiondef(p.oid) AS function_def
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND c.relname IN ('direct_messages', 'dm_messages', 'dm_conversations', 'messages')
  AND NOT t.tgisinternal;

-- 4) Funções definer aplicadas 06/09 (espelho byte-a-byte)
SELECT p.proname, pg_get_functiondef(p.oid) AS function_def
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_underground_member', 'is_collective_member');

-- 5) ACL das funções (pra espelhar os GRANT/REVOKE exatos)
SELECT p.proname, p.proacl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_underground_member', 'is_collective_member');

-- 6) Policies vigentes de realtime.messages (espelho da migração)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'realtime' AND tablename = 'messages'
ORDER BY policyname;
```

## Fora deste pacote (continuam pendentes, dependem de você)

- **Teste negativo do Underground:** conta **sem** underground não deve receber broadcast (a definer retorna false).
- **Decisão A × B do Collective** (post-mortem, "Correção proposta — NÃO aplicar sem OK"): o bloco 1–2 acima
  informa a escolha — se a trigger do `agora` já vive em `chat_messages`, a **Opção B** é uma edição pequena nela;
  senão, **Opção A** (backend emite por REST com service key, espelhando o DM).
