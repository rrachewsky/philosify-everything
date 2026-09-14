# Collective — rastreio do INSERT do chat e do emissor de `member-joined` (11/09)

**Data:** 2026-09-11 · **Modo:** somente leitura (nada editado) · **Origem:** pergunta do Bob após constatar
`group_chat_messages` = 0 linhas (trigger nova em tabela morta) e `chat_messages` = 4 linhas, todas com
`message_type ≠ 'chat'`.

## Resposta curta

1. **`POST /api/groups/:id/chat` grava em `group_chat_messages`** (não em `chat_messages`) — mas **ninguém no site
   chama essa rota**. A tabela está vazia porque a rota é código morto herdado (feature "analysis groups" com invite code).
2. **O chat real do Collective é `collective_comments`**, via `POST /api/collective/analyses/:id/comments`.
   Nenhuma trigger/broadcast conhecida cobre essa tabela — por isso nada chega ao vivo.
3. **O `member-joined` em `collective:7d701686…` só pode vir de trigger de banco** (`realtime.send`) sobre a tabela
   **`collective_members`**. Não está no repo. Worker e cliente **não emitem nada** para `collective:*`.
4. O post-mortem de 06/09 mapeou errado o caminho (`chat.js:handleSendMessage → chat_messages`). Correção abaixo.

## 1. Caminho REAL do `POST /api/groups/:id/chat` → INSERT

| Elo | Arquivo:linha | Evidência |
|---|---|---|
| Roteamento | `api/index.js:1098-1106` | regex `^/api/groups/([0-9a-f-]+)/chat$`; `POST` → `handleSendGroupMessage(request, env, origin, groupChatMatch[1])` |
| Import do handler | `api/index.js:116-125` | `handleSendGroupMessage` vem de **`./src/handlers/groups.js`** (não de `chat.js`) |
| Handler | `api/src/handlers/groups.js:395` | `export async function handleSendGroupMessage(...)` |
| Verificação de membro | `groups.js:412-421` | `from('group_members')` — tabela da feature legada, **não** `collective_members` |
| **INSERT** | `groups.js:445-452` | `.from('group_chat_messages').insert({ group_id, user_id, display_name, message })` |
| Colunas gravadas | idem | **só** `group_id`, `user_id`, `display_name`, `message`. **Sem `message_type`, sem `metadata`.** |
| Select de retorno | `groups.js:453` | `id, user_id, display_name, message, created_at` |

**Cliente dessa rota:** `site/src/services/api/groups.js:120-135` (`sendGroupMessage`) e `:96-113` (`getGroupChat`).
`groupsService` **não é importado por nenhum componente ou hook** (grep em `site/src`: só o próprio arquivo, linhas
7-9 e 185-196). Logo **nenhuma requisição chega** em `/api/groups/:id/chat` a partir do site v2 → 0 linhas em
`group_chat_messages` é o esperado, não uma falha.

**Por que a trigger nova ficou em "tabela morta":** ela foi criada em `group_chat_messages` seguindo o mapeamento
do post-mortem, que apontava `/api/groups/:id/chat` como o envio do Collective. Esse mapeamento estava errado em
dois pontos: (a) o handler é `groups.js`, não `chat.js`; (b) a rota não é usada pelo Collective.

## 2. Correção do post-mortem de 06/09

O trecho "**Envio:** `useCollective.sendMessage` → `collectiveService.sendCollectiveMessage` → `POST /api/groups/:id/chat`
→ `chat.js:handleSendMessage` → INSERT em `chat_messages`" está **incorreto em toda a cadeia**:

- `useCollective` (`site/src/hooks/useCollective.js`) é **código morto**: exportado em `hooks/index.js:14`, mas
  **nenhum componente/página o importa** (grep `useCollective` em `site/src` → só `hooks/index.js` e o próprio hook;
  `git log -S "useCollective("` → só o commit inicial `56dcbf0`, ou seja, nunca teve chamador neste repo).
- O hook chama `collectiveService.getCollectiveChat` (`:122`), `sendCollectiveMessage` (`:144`) e `kickMember`
  (`:169`) — **nenhuma dessas funções existe** em `site/src/services/api/collective.js` (export em `:300-322`:
  `browseCollectives, getMyCollectives, joinCollective, getCollectiveDetail, getCollectiveAnalyses, leaveCollective,
  getComments, addComment, deleteComment`). Se fosse montado, lançaria `TypeError`.
- **Bundle de produção confirma:** `site/dist/assets/*.js` (build de 02/09) **não contém `member-joined`** em nenhum
  asset; a única ocorrência de `collective:` em `CommunityPage-*.js` é o rótulo de aba
  `collective:"The Collective"` (objeto `Pt`), não um tópico de canal.
- `chat.js:handleSendMessage` (`api/src/handlers/chat.js:127-213`) é a **Ágora** (`POST /api/chat`), grava em
  `chat_messages` **sem `message_type`** (`:185-191`: `user_id, display_name, message, reply_to_id`) → o valor fica no
  **DEFAULT da coluna**, que **não está versionado no repo** (nenhum `.sql`/`.md` define `chat_messages`;
  `dm.js:495,720` e `useDM.js:698` tratam ausência como `'text'`). O único escritor que seta `message_type` é
  `daily-question.js:172-185` (`'system'`, metadata `question_of_the_day`). Ou seja: as 4 linhas de `chat_messages`
  são Ágora/pergunta-do-dia, **sem relação com o Collective**, e "≠ 'chat'" é esperado — o app nunca escreve `'chat'`.

## 3. O que o Collective realmente faz hoje (UI v2)

`CommunityPage.jsx:24,205` → `CollectivePanel.jsx:25` → `CollectiveDetail.jsx` → `CollectiveFeed.jsx` +
`AnalysisDiscussion.jsx`. Nenhum desses arquivos importa `realtime`, `channel(`, `subscribe` ou `broadcast`
(grep vazio em `site/src/components/collective/*.jsx`). Tudo é **fetch por API**:

| Ação | Cliente | Rota | Handler | Tabela / colunas |
|---|---|---|---|---|
| Entrar | `collective.js:57` `joinCollective` | `POST /api/collective/join` (`index.js:1228-1233`) | `collective.js:102` | **`collective_members`** `insert({ group_id, user_id })` (`:140-145`) + `rpc('increment_collective_member_count')` (`:153`) |
| Comentar (o "chat") | `AnalysisDiscussion.jsx:69` `addComment` | `POST /api/collective/analyses/:id/comments` (`index.js:1274-1283`) | `collective-comments.js:115` | **`collective_comments`** `insert({ collective_analysis_id, user_id, parent_id, display_name, content, encrypted_content, nonce, is_encrypted })` (`:213-231`) |
| Apagar comentário | `AnalysisDiscussion.jsx:100` | `DELETE /api/collective/comments/:id` | `collective-comments.js:302` | `collective_comments` (`:376`) |
| Sair | `CollectiveDetail.jsx:68` | `POST /api/collective/:id/leave` | `collective.js:258` | `collective_members` delete (`:279`) |

**Nenhum handler de `collective.js` / `collective-comments.js` faz broadcast** (grep `broadcast|realtime` nos dois
arquivos → zero). Os únicos emissores REST do worker (`fetch(${url}/realtime/v1/api/broadcast)`) são
`dm.js:1131,1250,1590` e `colloquium.js:138` (`broadcastColloquiumEvent`).

## 4. Emissor do `member-joined` (o gabarito)

**Por eliminação, com evidência:**

| Mecanismo | Existe para `collective:*`? | Evidência |
|---|---|---|
| Worker por REST `/realtime/v1/api/broadcast` | **Não** | grep `broadcast` em `api/src`: só `dm.js`, `colloquium.js`, `forum.js` (colloquium). `collective.js`/`collective-comments.js` → zero |
| Cliente `channel.send` | **Não** | grep `.send({` em `site/src`: só `useDM.js:280` (typing). Nenhum componente do Collective assina canal |
| **Trigger de banco (`realtime.send`)** | **Sim (único restante)** | REST não deixa linha em `realtime.messages`; `realtime.send` deixa. Se o Bob viu `member-joined` em `collective:7d701686…`, veio de `realtime.send` numa trigger |

**Worker deployado confere com o repo:** o último bundle de deploy (`api/.wrangler/tmp/deploy-Ta9Exn/index.js`,
02/09) tem 3 referências a `group_chat_messages` (as mesmas de `groups.js`), **nenhuma string `collective:` de
tópico** (a única é a mensagem de log `Error adding to collective:`) e 4 chamadas a `/realtime/v1/api/broadcast`
(colloquium + 3 do DM). Não há versão em produção que emita para `collective:*`.

**Tabela da trigger:** a única tabela em que o fluxo vivo do Collective insere um membro é **`collective_members`**
(`collective.js:140-145`). `group_members` (rota `/api/groups/join`, `groups.js:218-225`) não é chamada pelo site.
Logo a trigger é **AFTER INSERT ON `public.collective_members`**, emitindo tópico `'collective:' || NEW.group_id`,
evento `'member-joined'`, `private = TRUE` — o mesmo formato de `broadcast_underground_post`
(`migrations/broadcast_underground_post.sql`: `realtime.send(jsonb, 'new-post', 'underground', TRUE)` dentro de
`BEGIN … EXCEPTION WHEN OTHERS THEN RAISE WARNING`).

**A trigger não está no repo** (grep `member-joined`/`collective_members` em `*.sql` → nada; a única menção de
realtime para `collective_members` é o plano `.opencode/plans/community-spaces.md:262`, que previa
`ALTER PUBLICATION supabase_realtime ADD TABLE collective_members` — postgres_changes, **não** broadcast; não é o
mecanismo observado). Mesma situação da trigger do DM (achada fora do repo na Etapa 1).

### SQL para cravar (somente SELECT; colar no SQL Editor)

```sql
-- A) Quem emite para collective:* — todas as triggers cujo corpo cita 'collective:'
SELECT c.relname AS tabela, t.tgname, pg_get_triggerdef(t.oid) AS trigger_def,
       pg_get_functiondef(p.oid) AS function_def
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public' AND NOT t.tgisinternal
  AND pg_get_functiondef(p.oid) ILIKE '%collective:%';

-- B) Triggers das três tabelas envolvidas (esperado: algo em collective_members; nada em collective_comments;
--    a "trigger nova" em group_chat_messages)
SELECT c.relname AS tabela, t.tgname, pg_get_triggerdef(t.oid) AS trigger_def
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND NOT t.tgisinternal
  AND c.relname IN ('collective_members', 'collective_comments', 'group_chat_messages', 'group_members')
ORDER BY c.relname, t.tgname;

-- C) Confirma que o tópico observado é um collective_groups.id (e não analysis_groups.id)
SELECT 'collective_groups' AS origem, id, artist_name FROM public.collective_groups WHERE id::text LIKE '7d701686%'
UNION ALL
SELECT 'analysis_groups', id, name FROM public.analysis_groups WHERE id::text LIKE '7d701686%';

-- D) Linhas recentes em realtime.messages por tópico/evento (confirma o que já atravessa)
SELECT topic, event, private, count(*), max(inserted_at)
FROM realtime.messages
WHERE topic LIKE 'collective:%'
GROUP BY 1,2,3 ORDER BY 5 DESC;

-- E) DEFAULT de message_type em chat_messages (fecha o "≠ 'chat'")
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='chat_messages' AND column_name='message_type';
```

## 5. Consequência para o conserto (para decisão do Bob — NÃO aplicado)

- A "trigger nova" em `group_chat_messages` não vai disparar nunca pelo site v2. Mover o mecanismo para a tabela
  que recebe as mensagens: **`collective_comments`** (AFTER INSERT, e AFTER DELETE para `comment-deleted`).
- O tópico precisa do `group_id`, que **não está em `collective_comments`** — a linha tem `collective_analysis_id`;
  a trigger precisa de `SELECT group_id FROM collective_analyses WHERE id = NEW.collective_analysis_id`
  (o handler faz isso em JS em `collective-comments.js:145-152`).
- Receptor: hoje **nenhum** componente do Collective assina `collective:<gid>`. `AnalysisDiscussion.jsx` precisa
  assinar (padrão de `useUnderground.js:42-97`) — sem isso, a trigger grava em `realtime.messages` e ninguém ouve.
  O `useCollective.js` morto não serve como está (chama funções inexistentes e espera evento `new-message` com
  shape de chat, não de comentário).
- Espelhar a trigger de `collective_members` (dump do bloco A/B) em `migrations/` junto com a nova, para não repetir
  a pendência do DM.

## Arquivos consultados (read-only)

`api/index.js` (1085-1130, 1215-1300) · `api/src/handlers/groups.js` · `api/src/handlers/chat.js` (120-215) ·
`api/src/handlers/collective.js` · `api/src/handlers/collective-comments.js` · `api/src/handlers/daily-question.js`
(165-195) · `site/src/hooks/useCollective.js` · `site/src/hooks/useChat.js` · `site/src/services/api/collective.js` ·
`site/src/services/api/groups.js` · `site/src/components/collective/*.jsx` · `site/src/pages/v2/CommunityPage.jsx` ·
`site/dist/assets/CommunityPage-Ba_HKXkK.js` · `migrations/broadcast_underground_post.sql` ·
`.opencode/plans/community-spaces.md` · `new_design/REALTIME_POSTMORTEM_2026-09-06.md` ·
`new_design/REALTIME_FECHAMENTO_COLETA_SQL_2026-09-08.md` · `new_design/BLOCO1_REALTIME_DIAGNOSTICO_2026-09-01.md`.
