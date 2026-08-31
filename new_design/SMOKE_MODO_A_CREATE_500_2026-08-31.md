# Smoke MODO A — POST /api/underground → 500 (create post)

**Data:** 2026-08-31 · **Status:** diagnóstico em andamento · **Sem deploy, sem commit.**
**Deploy vigente:** worker `bd431173` · site `7a2d6bbf`.

---

## 1. Sintoma (relato do Bob)

- `POST /api/underground` responde **500 nas 3 contas**.
- `underground_posts` continua com **0 linhas** → morre **antes/no INSERT**.
- Sala está **bootstrapada** (1 linha com `encrypted_room_key`) e o **composer aceso** →
  a entrega da room key voltou a funcionar (problema anterior resolvido).

---

## 2. Handler do create — leitura de código

`api/src/handlers/underground.js` · `handleCreateUndergroundPost` (linhas **235–412**).

Caminho para um post de topo (sem reply):
1. auth (237) → rate limit (251) → `space_access` select **`"id, nickname"`** (267–272)
2. valida `access` (274) e `nickname` (283)
3. lê body: `encrypted_content`, `nonce`, `reply_to_id` (292–296)
4. valida E2E: exige `encrypted_content` + `nonce` string (299–311) — senão **400** `E2E_REQUIRED`
5. valida tamanho (312–322)
6. monta `insertData` (349–357): `{ user_id, nickname, content:null, encrypted_content, nonce, is_encrypted:true, reply_to_id }`
7. **INSERT** `underground_posts` + `.select(...).single()` (359–365)
8. erro do insert → log **`[Underground] Create failed: <msg>`** (368) → 500
9. throw → catch → log **`[Underground] Create exception: <msg> <stack>`** (404) → 500

## 3. Suspeitos do Bob — veredito por código

| # | Suspeita | Veredito | Evidência |
|---|---|---|---|
| 1 | Referência residual removida no MODO A (ReferenceError runtime) | **Improvável nesta rota** | Constantes usadas (`MAX_ENCRYPTED_LENGTH` 29, `MAX_NONCE_LENGTH` 30, `UUID_REGEX` 34) definidas; imports 15–27 resolvem. Se ocorresse, cairia no catch como `Create exception:` — o tail confirma. |
| 2 | Create ainda lendo `access.encrypted_room_key` / campo que o GET deixou de trazer | **DESCARTADO** | O select do create é `space_access → "id, nickname"` (269). Não toca `encrypted_room_key`. |
| 3 | Broadcast pré-insert | **DESCARTADO** | Handler **não tem broadcast**. Do build do `insertData` (349) vai direto ao INSERT (359). Nada roda antes que possa lançar. |

## 4. Hipótese principal — INSERT rejeitado pelo banco

- Body chega **válido** (front manda `encrypted_content`+`nonce` snake_case em
  `site/src/services/api/underground.js:100–104`; worker lê 294–295). Passou a validação E2E,
  senão seria **400**, não 500 → **a morte é no próprio INSERT** (branch `Create failed:` 368).
- **Correlação decisiva (SMOKE2):** o create-500 anterior foi **`content NOT NULL`** (corrigido pelo 1a).
  Logo o INSERT já chegava à avaliação de **constraint de coluna** → a **RLS WITH CHECK já passava**.
- Com `content` agora nulável e o MODO A ainda gravando `content:null`, o bloqueio migrou para
  **a próxima constraint da fila** em `underground_posts`: outro **NOT NULL sem default** que o
  `insertData` não preenche, ou um **CHECK**. `0 linhas jamais` reforça: nunca houve INSERT bem-sucedido.

## 5. Probe único (produção) — isola a causa em uma rodada

```sql
-- (1) Colunas: NOT NULL sem default que o insert do worker NÃO preenche?
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='underground_posts'
ORDER BY ordinal_position;

-- (2) CHECK / FK constraints
SELECT conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid='public.underground_posts'::regclass AND contype IN ('c','f');

-- (3) Políticas RLS (foco em INSERT / with_check)
SELECT policyname, cmd, roles, with_check
FROM pg_policies
WHERE schemaname='public' AND tablename='underground_posts';

-- (4) TESTE do INSERT exato do worker, como service role (ignora RLS),
--     em transação revertida. FALHOU → causa é coluna/CHECK (a msg nomeia).
--     PASSOU → causa é RLS (olhar policy #3).
BEGIN;
INSERT INTO underground_posts
  (user_id, nickname, content, encrypted_content, nonce, is_encrypted, reply_to_id)
VALUES
  ((SELECT user_id FROM space_access WHERE space='underground' LIMIT 1),
   'probe', NULL, 'Zm9v', 'YmFy', true, NULL);
ROLLBACK;
```

**Interpretação:**
- Probe (4) **FALHA** → causa é **coluna/CHECK**; a mensagem nomeia a coluna. Conserto = `ALTER` cirúrgico (ou ajuste no `insertData`), fora do caminho RLS.
- Probe (4) **PASSA** → causa é **RLS**; olhar `with_check` da policy de INSERT em (3).

## 6. Tail (paralelo)

`wrangler tail --env production` aberto (bg `bzr0o7la6`, arquivo `scratchpad/create_tail.jsonl`).
Ao Bob disparar **um** post, capturo a linha exata (`Create failed:` vs `Create exception:`) e cruzo com o probe.

## 7. Próximo passo

Com a saída do probe **ou** a linha do tail → fecho **arquivo:linha + diff** neste mesmo arquivo (seção 8) e levo pro OK. **Sem deploy até o OK.**

---

## 8. CAUSA-RAIZ CONFIRMADA (tail de produção)

Post disparado em 2026-08-31 04:41 UTC (POST `/api/underground`, BR). O tail capturou o
branch `Create failed:` (linha 368) com a mensagem **exata do banco**:

```
[Underground] Create failed:
record "new" has no field "message"
```

**Interpretação:** erro clássico de **trigger PL/pgSQL** — uma função de trigger em
`underground_posts` referencia **`NEW.message`**, coluna que **não existe** nesta tabela.
`message` é herança da era `underground_messages` (o plano `.opencode/plans/community-spaces.md:358–362`
define `underground_messages.message TEXT NOT NULL`). A tabela foi reconstruída como
`underground_posts` (`content`/`encrypted_content`/`nonce`), mas **a trigger que faz o broadcast
de realtime no banco nunca foi atualizada** e ainda lê `NEW.message`.

**Por que é a trigger de broadcast (não o worker):**
- O handler do worker **não tem broadcast** (confirmado na seção 2) — quem emite o evento
  `new-post` no canal `underground` é uma **trigger no banco** (padrão Supabase "broadcast from
  database" via `realtime.send`/`realtime.broadcast_changes`).
- O front (`site/src/hooks/useUnderground.js:49–68`) escuta `channel('underground').on('broadcast',{event:'new-post'})`
  e lê `payload.encrypted_content` + `payload.nonce` — ou seja, **o broadcast tem que existir** e
  carregar ciphertext. A trigger é real; só está com o nome de coluna errado.

**Por que encaixa 100% com o histórico:**
- É trigger **AFTER INSERT**. No SMOKE2, a checagem `content NOT NULL` falhava **antes** de a
  trigger rodar → erro era "content NOT NULL" (corrigido pelo 1a).
- Depois do 1a: NOT NULL passa → a linha chega ao estágio AFTER → a trigger dispara → lê
  `NEW.message` → **erro → rollback → 0 linhas** → 500. Explica `0 linhas jamais`.

**Não é** referência residual no worker (suspeito 1), nem RLS, nem coluna/CHECK da própria tabela.
É **objeto de banco** (trigger) fora do código versionado.

## 9. SQL para extrair a trigger (produção) — preciso da fonte pra escrever o diff

```sql
-- (A) Triggers em underground_posts + definição
SELECT t.tgname, pg_get_triggerdef(t.oid) AS trigger_def
FROM pg_trigger t
WHERE t.tgrelid = 'public.underground_posts'::regclass
  AND NOT t.tgisinternal;

-- (B) Fonte das funções chamadas por essas triggers (onde está o NEW.message)
SELECT p.proname, pg_get_functiondef(p.oid) AS func_src
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.underground_posts'::regclass
  AND NOT t.tgisinternal;
```

## 10. Plano de correção (a detalhar após ver a fonte)

Estratégia provável — **corrigir a função da trigger** (fix DB-only, cirúrgico), trocando
`NEW.message` pelas colunas MODO A que o front espera no payload do broadcast
(`id`, `nickname`, `encrypted_content`, `nonce`, `is_encrypted`, `created_at`, `reply_to_id`,
`reaction_*`) e mantendo topic `underground` / event `new-post`. **Sem tocar o worker.**
Versionar a função corrigida em `migrations/` (o repo hoje não tem essa trigger).

Alternativa (se a fonte revelar algo pior): dropar a trigger e mover o broadcast pro worker
pós-insert. Só considero se a correção da função não for viável.

**Decisão do diff exato aguarda a saída do SQL (A)+(B).** Sem deploy até o OK.

---

## 11. RESOLUÇÃO (Bob, 2026-08-31)

Create **destravado** — a função da trigger **`broadcast_underground_post`** foi **corrigida**
(campos do MODO A no lugar de `NEW.message`/`reaction_clap`; `EXCEPTION WHEN OTHERS` não-bloqueante),
**não** dropada. Confirma a causa-raiz da seção 8 (o segundo campo obsoleto — `reaction_clap` —
some junto). Posts passaram a persistir (existem `TEST`/`TEST2` da THEPRODUCER).

**Pendente de registro:** versionar a fonte de produção da função (`pg_get_functiondef`) em
`migrations/broadcast_underground_post.sql` — SQL de dump em
`MODO_A_ADMIN_SESSION_DIFF_2026-08-31.md` §6. Sem isso, a correção vive só no banco (não versionada).
