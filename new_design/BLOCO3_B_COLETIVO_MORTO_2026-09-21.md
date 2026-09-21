# Bloco 3(b) — Limpeza do caminho morto do Coletivo · PROPOSTA · 21/09/2026

**Branch:** `redesign/v2` · **Base:** `59a8ec6` (fechamento do Bloco 3(a)) · **Status:** **proposta para OK do Bob — NADA aplicado.**
Working tree intocado (só os três arquivos desta proposta, untracked). Banco intocado (nenhum SQL executado).

Origem: item (b) do Bloco 3, registrado em `COLLECTIVE_COMENTARIOS_ETAPA2_PROPOSTA_2026-09-11.md` (tabela "Registro para o
Bloco 3", itens 1–6) e reafirmado em `TRIGGER_MEMBER_JOINED_ESPELHO_2026-09-16.md` ("pedem dumps próprios").

---

## 1. Resumo

Existem dois "Coletivos" no repositório. O **vivo** (`collective.js`, `collective-comments.js`, tabelas `collective_*`,
`collectiveService`, componentes em `components/collective/`) é o que o site v2 usa. O **legado** (`groups.js`, rotas
`/api/groups*`, tabelas `analysis_groups` / `group_members` / `group_chat_messages`, `groupsService`, `useCollective`)
é código morto: nenhuma tela chama, nenhuma rota é invocada pelo site, e o hook chama três métodos que **não existem**
no serviço vivo. A trigger criada em `group_chat_messages` em 11/09 nunca disparou nem vai disparar.

Proposta em duas partes independentes, cada uma com seu próprio OK:

| Parte | O quê | Entrega | Reversível? |
|---|---|---|---|
| **B1 — código** | Remover 3 arquivos + 2 blocos em `api/index.js` + 2 linhas de barrel | `BLOCO3_B_COLETIVO_MORTO_2026-09-21.patch` (−1018 linhas, 0 adições) | Sim: `git revert` |
| **B2 — banco** | DROP das 3 tabelas vazias + função da trigger órfã | `BLOCO3_B_COLETIVO_MORTO_2026-09-21.sql` (3 passos, gated) | **Não** (tabelas vazias; recriar exige DDL de 1-G) |

B1 e B2 não dependem uma da outra. B1 pode ir antes; B2 pode esperar quanto o Bob quiser.

---

## 2. Prova de que é código morto (B1)

### 2.1 Backend — `api/src/handlers/groups.js` (559 linhas, 8 handlers)

| Handler | Rota em `api/index.js` | Tabelas que toca |
|---|---|---|
| `handleCreateGroup` | `POST /api/groups` (l.1080) | `analysis_groups`, `group_members` |
| `handleListGroups` | `GET /api/groups` (l.1083) | `group_members`, `analysis_groups` |
| `handleJoinGroup` | `POST /api/groups/join` (l.1086) | `analysis_groups`, `group_members` |
| `handleGetGroupDetail` | `GET /api/groups/:id` (l.1091) | `group_members`, `analysis_groups`, `group_chat_messages`, `analyses` (leitura) |
| `handleGetGroupChat` | `GET /api/groups/:id/chat` (l.1098) | `group_members`, `group_chat_messages` |
| `handleSendGroupMessage` | `POST /api/groups/:id/chat` (l.1101) | `group_members`, `group_chat_messages` |
| `handleLeaveGroup` | `POST /api/groups/:id/leave` (l.1108) | `analysis_groups`, `group_members` |
| `handleKickMember` | `DELETE /api/groups/:id/members/:uid` (l.1115) | `analysis_groups`, `group_members` |

**Importadores de `handlers/groups.js`:** só `api/index.js:125` (import) — o único hit fora de `.wrangler/tmp` (bundles antigos).
**Testes que citam groups/handleCreateGroup/handleListGroups em `api/src/**/*.test.js`:** 0.
**Referências a `/api/groups` no `api/` fora de `index.js` e `groups.js`:** 0 (nem `wrangler.toml`, nem `api/docs`, nem `proxy.js`, nem push).
**Helpers que só `groups.js` usa e ficariam órfãos:** nenhum — `jsonResponse`, `sanitizeMessage`, `getSupabaseForUser`,
`addRefreshedCookieToResponse`, `checkRateLimit` seguem usados por `chat.js`, `forum.js` e outros. `generateInviteCode`
é local ao arquivo.

### 2.2 Frontend — `site/src/services/api/groups.js` (196 linhas)

Exporta `createGroup, getMyGroups, joinGroup, getGroupDetail, getGroupChat, sendGroupMessage, leaveGroup, kickMember`,
o objeto `groupsService` e `default`. Todos chamam `/api/groups*`.

| Verificação | Resultado |
|---|---|
| `import ... from '.../services/api/groups'` em `site/src` | **0** |
| `groupsService` fora do próprio arquivo | **0** |
| Barrel `services/api/index.js:8` (`export * from './groups.js'`) | é o único re-export |
| Consumidores do barrel `@/services/api` | 5 arquivos (`useAnalysis`, `useCredits`, `useLocalizedPricing`, `useSpotifySearch`, `PaymentSuccess`) — importam `analyzeSong`, `getBalance`, `fetchLocalizedPricing`, `searchSongs`, `verifyPayment`; **nenhum nome de groups** |
| String `/api/groups` em `site/src` | só o comentário de cabeçalho do próprio arquivo |

Hits de nome por `grep -w` que **não** são deste módulo (registrado para não confundir): `createGroup`/`leaveGroup` em
`MessagesPanel.jsx`, `ChatView.jsx`, `ConversationList.jsx`, `NewGroupModal.jsx`, `useDM.js` são o **grupo de DM**
(`dm.createGroup`, chaves i18n `community.dm.*`) — feature viva, fora do escopo.

### 2.3 Frontend — `site/src/hooks/useCollective.js` (202 linhas)

| Verificação | Resultado |
|---|---|
| `import ... useCollective` em `site/src` (fora do barrel) | **0** |
| Barrel `hooks/index.js:14` | é o único re-export |
| Consumidores de `useCollective` via barrel | **0** (nenhum componente usa `useCollective(`) |
| Métodos que o hook chama em `collectiveService` | `getCollectiveDetail` ✅ existe · `leaveCollective` ✅ existe · **`getCollectiveChat` ✗ não existe** · **`sendCollectiveMessage` ✗ não existe** · **`kickMember` ✗ não existe** |
| Canal realtime que assina | `collective:<gid>` com eventos `new-message` / `member-joined` / `member-left` / `comment-deleted` — o vivo emite `member-joined`, `new-comment`, `comment-deleted`; o hook nunca é montado, então nunca assinou nada |

Os componentes de `components/collective/*` usam `collectiveService` diretamente (`CollectiveDetail`, `CollectiveList`,
`CollectiveFeed`, `AnalysisDiscussion`, `CreateCollectiveModal`, `JoinCollectiveModal`) — nenhum passa pelo hook.

### 2.4 Histórico

Os três arquivos nasceram no commit inicial do fork (`56dcbf0`, 08/03/2026) e só foram tocados pelos dois commits de
hardening de segurança (`f6a357e` 08/04, `48a7f47` 10/04). Nunca ganharam consumidor.

---

## 3. Patch B1 — conteúdo exato

`new_design/BLOCO3_B_COLETIVO_MORTO_2026-09-21.patch` — gerado a partir de cópias, **`git apply --check` limpo contra
`59a8ec6`**, md5 `808b9c73cf5c604e9f5550fe54d9d1b8`.

| Arquivo | Mudança |
|---|---|
| `api/index.js` | −10 (bloco `import { handleCreateGroup … } from "./src/handlers/groups.js"`, l.116–125) e −49 (bloco de rotas "Group analysis" + "Group detail + chat routes", l.1079–1127, até o comentário `USER PROFILE`) |
| `api/src/handlers/groups.js` | **removido** (−559) |
| `site/src/hooks/index.js` | −1 (`export { useCollective }`) |
| `site/src/hooks/useCollective.js` | **removido** (−202) |
| `site/src/services/api/groups.js` | **removido** (−196) |
| `site/src/services/api/index.js` | −1 (`export * from './groups.js'`) |
| **Total** | **6 arquivos, 0 inserções, 1018 remoções** |

Nada mais é tocado: não há traduções, CSS, docs ou testes ligados ao módulo. Após o patch, `grep -rn groups api/index.js` = 0.

### 3.1 Validação feita (worktree isolado em `scratchpad/`, patch aplicado, `node_modules` do tree principal por junction; worktree já removido)

| Checagem | Baseline `59a8ec6` | Com o patch |
|---|---|---|
| `site`: `eslint . --ext js,jsx` | 93 problemas (90 erros, 3 avisos) — todos pré-existentes | **93 problemas, idênticos** (nenhum novo, nenhum a menos) |
| `site`: `vite build` | ok | **ok** (`✓ built in 26.78s`, `index-C1lN8zyT.js`) |
| `site`: `vitest run` | "No test files found" (exit 1, pré-existente) | idem |
| `api`: `vitest run` | 11 arquivos / 134 testes | **11 / 134 passando** |
| `api`: `wrangler deploy --dry-run --env production` | empacota, 4255 KiB | **empacota**, 4272 KiB (diferença = caminho mais longo do worktree embutido no bundle; não é regressão) |
| Importadores residuais de `handlers/groups`, `useCollective`, `services/api/groups` | — | **0** |

### 3.2 Efeito em produção após deploy do B1

- `GET/POST /api/groups*` passam a cair no 404 padrão do worker. Como ninguém chama, nenhum usuário nota.
- Site: bundle sem os dois módulos (tree-shaking já os excluía na prática por falta de importador; a diferença de tamanho é nula ou desprezível).
- **Não muda** nada no Coletivo vivo, no DM (grupos de DM continuam), no realtime.

### 3.3 Sequência proposta para B1 (com OK)

1. `git apply new_design/BLOCO3_B_COLETIVO_MORTO_2026-09-21.patch`
2. `cd api && npx vitest run` (esperado 134 ✓) · `cd site && npx vite build` (esperado ✓)
3. Deploy worker: `cd api && wrangler deploy --env production`
4. Deploy site: `cd site && wrangler pages deploy dist --project-name=philosify-frontend --branch=production`
5. Smoke: `/community` logado (Coletivo lista/detalhe/comentários), DM com grupo, `curl -s -o /dev/null -w '%{http_code}' https://api.philosify.org/api/groups` → 404 (ou 401 se o auth vier antes; ambos valem)
6. Commit único (sugestão): `coletivo: remove caminho morto (/api/groups, groups.js, useCollective, groupsService)` + este md + patch + sql
7. Rollback: `git revert` + redeploy; Pages tem o deployment `691468b1…` de 20/09 como alvo.

---

## 4. Banco B2 — SQL gated

`new_design/BLOCO3_B_COLETIVO_MORTO_2026-09-21.sql`. Três colagens separadas no SQL Editor do Supabase.

**O que eu NÃO tenho:** contagem ao vivo das três tabelas. Não há `api/.dev.vars` nesta máquina e a proposta não usa
credenciais. A única evidência de "vazia" até aqui é o rastreio de 11/09 (`group_chat_messages` = 0 linhas). Por isso o
passo 1 é obrigatório e o passo 2 **re-verifica tudo sozinho** antes de dropar.

### Passo 1 — pré-flight (só SELECT; nada muda)

| Bloco | Pergunta | Esperado | Se diferente |
|---|---|---|---|
| 1-A | `count(*)` das 3 tabelas | 3 linhas, `rows = 0` | **parar**; decidir o que fazer com as linhas |
| 1-B | triggers nas 3 tabelas + `pg_get_triggerdef` + `pg_get_functiondef` | só a trigger órfã em `group_chat_messages` (função `broadcast_group_chat_message` ou o nome real) | anotar; o passo 2 dropa o que achar aqui |
| 1-C | a função da trigger é usada por trigger de **outra** tabela? | 0 linhas | **parar**; a função não pode cair |
| 1-D | FKs de outras tabelas apontando **para** as 3 | 0 linhas | **parar** |
| 1-E | views dependentes | 0 linhas | **parar** |
| 1-F | outras funções cujo corpo cita as 3 tabelas | 0 linhas | **parar** |
| 1-G | policies RLS, índices, constraints, publicações, colunas | informativo — **colar no fechamento** (é o DDL de rollback) | — |
| 1-H | contagens de `collective_groups/members/analyses/comments` | linha de base para o 3-D | — |

### Passo 2 — DROP gated (uma colagem, um `DO $$`)

Refaz, dentro da mesma transação, os gates 0 (existem), 1 (0 linhas), 2 (0 FK externa), 3 (0 view), 4 (função não usada
fora), 5 (0 outra função citando). Qualquer falha → `RAISE EXCEPTION`, transação desfeita, nada alterado.
Só então: `DROP TABLE group_chat_messages`, `group_members`, `analysis_groups` (filhas primeiro, **sem CASCADE** — uma
dependência não prevista aborta em vez de arrastar) e `DROP FUNCTION` das funções de trigger coletadas do catálogo
(assinatura exata, sem CASCADE). Nunca dropa um nome digitado à mão: o nome `broadcast_group_chat_message` só aparece
no 3-B como verificação.

### Passo 3 — verificação (só SELECT)

| Bloco | Esperado |
|---|---|
| 3-A | 0 linhas (tabelas não existem) |
| 3-B | 0 linhas (nenhuma função com o nome informado nem com corpo citando as tabelas) |
| 3-C | 0 linhas (sem policy/publicação órfã) |
| 3-D | mesmas contagens do 1-H; triggers de `collective_*` inalteradas (`broadcast_collective_member_trigger`, `broadcast_collective_comment_trigger`, `broadcast_collective_comment_deleted_trigger`) |

### Riscos de B2

| Risco | Mitigação |
|---|---|
| Tabela não está vazia | Gate 1 aborta; decisão volta ao Bob |
| Algo que não enxerguei depende da tabela (FK, view, função) | Gates 2/3/5 + ausência de CASCADE: aborta com a mensagem do gate |
| Função da trigger é compartilhada | Gate 4 aborta |
| Dropar antes do B1 ir ao ar | Irrelevante: as rotas não são chamadas. Mas a ordem sugerida é B1 primeiro (ou junto) para não ter rota viva apontando para tabela inexistente |
| Irreversível | Tabelas vazias → só a estrutura se perde; o 1-G devolve colunas/índices/policies para recriar se um dia for preciso |

---

## 5. O que fica fora (registrado, não proposto)

- `site/src/crypto/group.js`, `collective_group_keys`, `crypto.js`: são o E2E do Coletivo **vivo**. Não tocar.
- Grupos de DM (`useDM.createGroup`, `group_conversations`, `NewGroupModal`, `GroupMembersModal`): feature viva. Não tocar.
- Fila herdada do 3(a): `useCinemaSidebar.js:18` (`refreshBalance` inexistente) e `useDM` 2× `/api/dm/conversations` — próximos itens, não este.
- `.opencode/plans/community-spaces.md` cita `ALTER PUBLICATION … collective_members` — plano antigo, sem relação com as tabelas legadas.

---

## 6. Decisões pedidas ao Bob

1. **B1** — OK para aplicar o patch, validar, deployar worker + site e commitar?
2. **B2** — OK para colar o **passo 1** no SQL Editor e trazer o resultado? (o passo 2 pede um segundo OK, com o passo 1 em mãos)
3. Ordem: B1 e depois B2 (sugerida), ou os dois no mesmo ciclo?
