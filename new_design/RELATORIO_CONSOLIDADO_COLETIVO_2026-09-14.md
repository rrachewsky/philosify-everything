# Relatório consolidado — ciclo Coletivo/Underground · 11–14/09/2026

**Escopo:** tudo o que foi feito, provado e deixado pendente entre o rastreio do chat do Coletivo (11/09) e o
destravamento do Underground no Chrome (14/09). Cada seção aponta o relatório detalhado correspondente.
**Regra do ciclo:** Ágora, Underground e DM intocáveis em código — respeitada (nenhum arquivo deles foi editado).

## 0. Estado do repositório neste momento (14/09)

| Item | Estado |
|---|---|
| Branch | `redesign/v2` |
| Último commit | **`eac229e`** — "realtime do coletivo: comentarios ao vivo (trigger em collective_comments + listener)" — enviado ao remoto, sem atribuição de IA |
| Modificados, não commitados | `site/src/styles/v2-pages/community.css` (+12/−3), `site/src/styles/v2-pages/community-panels.css` (+1/−1) — o fix do layout, **deployado**, aguardando aceite para commit |
| Novos, não rastreados (deste ciclo) | `new_design/LAYOUT_DISCUSSAO_COLETIVO_2026-09-14.md`, `new_design/UNDERGROUND_CHROME_CARREGANDO_2026-09-14.md`, `new_design/printscreen_layout_discussao_2026-09-14/` (4 jpg), este relatório |
| Worker (`philosify-api`, prod) | **sem deploy neste ciclo** — última versão de 30/08 |
| Site (Pages `philosify-frontend`, Production) | `f918ec90` (listener do Coletivo) → **`79d904a0`** (CSS do layout, atual) |
| Banco (prod, aplicado pelo Bob) | 2 triggers novas em `collective_comments` (+ a de archive pré-existente) |

---

## 1. Realtime do Coletivo — comentários ao vivo · RESOLVIDO, aceito, commitado

### 1.1 O que estava errado (rastreio 11/09)
- O post-mortem de 06/09 mapeou o envio do Coletivo como `POST /api/groups/:id/chat → chat.js → chat_messages`.
  **Errado nos três elos:** a rota vai para `groups.js:handleSendGroupMessage` e grava em
  `group_chat_messages` (`groups.js:445-452`); e **ninguém chama essa rota** — `groupsService`
  (`site/src/services/api/groups.js`) não tem importadores, e `useCollective.js` é código morto (nenhum componente
  o importa; chama `getCollectiveChat`/`sendCollectiveMessage`/`kickMember`, que não existem no serviço; o bundle de
  produção não contém `member-joined`). A trigger criada em `group_chat_messages` ficou **preparada-para-nada**.
- `chat_messages` (4 linhas, `message_type ≠ 'chat'`) é Ágora + pergunta do dia; o app nunca escreve `'chat'`
  (o handler da Ágora não seta `message_type`; o DEFAULT da coluna não está versionado).
- **O Coletivo real são os comentários em análises:** `AnalysisDiscussion.jsx` → `POST
  /api/collective/analyses/:id/comments` (`index.js:1274-1283`) → `collective-comments.js:handleAddComment`
  → **INSERT em `collective_comments`** (`:213-231`; colunas `collective_analysis_id, user_id, parent_id,
  display_name, content, encrypted_content, nonce, is_encrypted`; `group_id` não está na linha — resolvido via
  `collective_analyses`). **Nunca teve realtime em ponta nenhuma:** sem trigger, sem broadcast no handler, sem
  assinante no cliente (um único GET ao abrir a discussão; envio/apagar só alteram estado local). A "assimetria"
  de 06/09 era eco local do remetente + re-fetch ao reabrir/F5.
- O `member-joined` que trafega em `collective:<gid>` vem de **trigger não-versionada em `collective_members`**
  (única emissão possível por eliminação: worker sem broadcast para `collective:*`, cliente sem `channel.send`,
  `realtime.send` é o único que deixa linha em `realtime.messages`). Serviu de gabarito e prova de que a policy
  definer de 06/09 autoriza o tópico.

### 1.2 Conserto (padrão Underground)
- **Banco** (aplicado pelo Bob 11/09, verificado: 3 triggers em `collective_comments`): funções
  `broadcast_collective_comment` (AFTER INSERT → `new-comment`) e `broadcast_collective_comment_deleted`
  (AFTER DELETE → `comment-deleted`), `SECURITY DEFINER`, `search_path=''`, `realtime.send(payload, evento,
  'collective:'||group_id, TRUE)` em `BEGIN…EXCEPTION WHEN OTHERS THEN RAISE WARNING`; payload snake_case, sem
  plaintext quando cifrado. Espelho: `migrations/collective_comments_realtime_broadcast.sql`.
- **Cliente** (`site/src/components/collective/AnalysisDiscussion.jsx`): assina `collective:${groupId}` privado
  após `loadData` conhecer o grupo (`waitForAuth → getRealtimeClient → channel({private:true}) → subscribe`),
  filtra `collective_analysis_id`, mapeia para o shape do `CommentThread`, decripta E2E com
  `cryptoService.decryptCollectiveMessage`, `isMine` por `user.id`, dedupe por `id` (eco do POST), delete remove
  pai e filhos. Deploy Pages `f918ec90`.
- **Aceite do Bob:** comentário atravessou ao vivo entre janelas. **Commit `eac229e`** (+ post-mortem de 06/09
  anotado com o desfecho real + relatórios).

Detalhes: `COLLECTIVE_CHAT_RASTREIO_INSERT_2026-09-11.md`, `COLLECTIVE_COMENTARIOS_ETAPA1_2026-09-11.md`,
`COLLECTIVE_COMENTARIOS_ETAPA2_PROPOSTA_2026-09-11.md`, `REALTIME_POSTMORTEM_2026-09-06.md` (seção "DESFECHO REAL").

---

## 2. Layout do painel de discussão · APLICADO e DEPLOYADO, aguardando aceite

### 2.1 Causa (medida em produção, Chrome, viewport 1680×839)
- `.panelhost` (host das 5 abas) tinha `height:min(70vh,760px)` (`community.css:28-30`) — altura fixa que ignora o
  viewport.
- Overhead fixo da discussão: header 50 + card da análise 174 + composer 155 = **379px**; sobravam **206px** para a
  lista (429px de conteúdo) e **259px de página vazia** abaixo.
- **(a) janela reduzida:** 70vh < 379px → lista a zero, composer ultrapassa o fundo do painel (`overflow:hidden`),
  nada rola até ele. Emulado a 392px: lista 20px, botão 7px além do fundo.
- **(b) janela grande:** teto de 760px → terço vazio; lista espremida.

### 2.2 Fix (princípio do Bob) — diff aplicado
`community.css`: página da Comunidade vira coluna flex `min-height:100dvh` (escopo `:has(> .pg-community)`,
padding-bottom 24px); `.pg-community{flex:1 1 0px; display:flex; flex-direction:column; margin-bottom:0}`;
`.panelhost{flex:1 1 0px; min-height:max(480px,70vh)}` (mobile ≤700px: `max(480px,76vh)`).
`community-panels.css`: `.analysis-discussion__comments{min-height:0}`.
`flex-basis:0px` (não `0%`) é o que impede o painel de crescer até o conteúdo das abas com listas longas.

### 2.3 Medidas (fix injetado na página antes do deploy)

| Estado | Painel | Lista | Composer dentro | Página |
|---|---|---|---|---|
| Antes, viewport real 839 | 587 | 206/429 rola | sim | 259px vazios |
| Antes, reduzida (painel 392) | 392 | **20**/429 | **não** | — |
| Depois, viewport real 839 | 587 (igual) | 206/429 rola | sim | footer segue |
| Depois, grande (100dvh=1440 emulado) | **1109** | **728/728 sem scroll** | sim | 0 vazio |
| Depois, reduzida (100dvh=560 emulado) | **480** piso | 99/429 rola | **sim** | rola até o composer |

Regressão nas outras abas (viewport real): Ágora 587 (`chat-messages` 520/824), Mensagens 587, Pessoas 587
(`people-panel` 585/3113), Underground 587 (`underground-posts` 414/3506) — idênticas a antes.

### 2.4 Deploy e pendência
- Build OK; `CommunityPage-C12l92h6.css` com as regras; **Pages `79d904a0-c410-4823-bc45-ac58aabd1c47`**
  (Production); `philosify.org` já serve.
- **Limitação honesta:** a extensão não redimensiona a janela do Chrome (maximizada) — reduzida/grande foram
  **emuladas** pela altura do painel/página; ~380px e Edge **não** testados aqui.
- **Aguardando aceite do Bob:** Edge reduzido (COMENTAR + 0/2000 alcançáveis, lista rola), Edge/Chrome maximizados
  (sem terço vazio), passada em Ágora/Pessoas/Underground. Depois: commit
  "layout do coletivo: painel de discussão ocupa o viewport, lista rola, composer fixo".

Detalhes + screenshots: `LAYOUT_DISCUSSAO_COLETIVO_2026-09-14.md`, `printscreen_layout_discussao_2026-09-14/`.

---

## 3. Underground preso em "CARREGANDO CONFISSÕES…" no Chrome · DIAGNOSTICADO, destravado, fix durável para OK

### 3.1 Veredito
**Lock de entrada do cache HTTP do Chrome.** Um request antigo de `GET /api/underground` (e de
`/api/dm/conversations`) ficou pendente no perfil (a aba travada do Bob); todo request novo para a **mesma URL em
`cache:'default'`** — o modo que os serviços do site usam — entra na fila desse lock indefinidamente. O Edge tem
cache próprio. **Não** é bundle velho (era o `index-DXMZXeKC.js` do deploy 79d904a0), **não** é SW (desregistrado,
página sem controller, travou igual), **não** é servidor (401 em 0,24s sem cookie; 200 em 471ms autenticado, URL
idêntica, 82s após o load, enquanto o do hook seguia pendente por >4 min sem 524).

### 3.2 Prova do mecanismo (mesma aba, concorrente, timeout 15s)

| URL | `cache` | Resultado |
|---|---|---|
| `/api/underground` | `default` | AbortError aos 15,7s |
| `/api/underground` | `no-store` | 200 em 266ms |
| `/api/underground` | `reload` (= Ctrl+Shift+R) | 200 em 815ms |
| `/api/dm/conversations` | `default` | AbortError aos 15,7s |
| `/api/dm/conversations` | `no-store` | 200 em 297ms |

Por que a API entra no cache: `jsonResponse` (`api/src/utils/response.js:11-27`) **não manda `Cache-Control`**
(`/api/health` ao vivo: só `Content-Type`, `Vary`, `X-Content-Type-Options`) → Chrome trata como cacheável por
heurística e cria entrada por URL. **29 GETs** em `site/src/services/api/*.js` vão sem `cache:`.
Origem provável do writer preso: 503 tardios registrados pelo rastreador da extensão ~13:36 UTC nessas duas rotas
(soluço transitório do servidor). `wrangler tail` crasha no Windows (`UV_HANDLE_CLOSING`) — sem log do worker.

**Bob (14/09): "Destravou"** com a ação imediata (fechar a aba presa / hard reload) — confirma o mecanismo.

### 3.3 Fix durável — DIFF PARA OK (nada aplicado)
- **Servidor** `api/src/utils/response.js`: `'Cache-Control': 'no-store'` nos headers do `jsonResponse` (elimina a
  classe inteira; deploy do worker `cd api && wrangler deploy --env production`). Conferir se `errorResponse` passa
  por `jsonResponse`; se não, mesmo header lá.
- **Cliente, mínimo:** `cache:'no-store'` em `services/api/underground.js:52-55` (`getPosts`) e
  `services/api/dm.js:27-30` (`getConversations`). Os outros 27 GETs ficam cobertos pelo header do servidor;
  padronizar num wrapper `apiFetch` é higiene de fila.
- **Opcional:** timeout (`AbortController` ~15s) em `useUnderground.loadPosts` (`:125-148`) → vira erro em vez de
  "carregando" eterno.
- Aceite: F5 **simples** no Chrome carrega; DevTools → resposta de `/api/underground` com `Cache-Control: no-store`.

Detalhes: `UNDERGROUND_CHROME_CARREGANDO_2026-09-14.md`.

---

## 4. Fila registrada (nada executado)

| # | Item | Origem | Ação |
|---|---|---|---|
| 1 | **OK + deploy do fix do cache** (§3.3) | Underground 14/09 | worker + site |
| 2 | **Aceite do layout** (§2.4) → commit dos 2 CSS + relatórios + screenshots | Layout 14/09 | commit |
| 3 | Dump A/B da trigger de `collective_members` (`member-joined`) → colar no placeholder de `migrations/collective_comments_realtime_broadcast.sql` (+ `db/functions/` se preferir) | Etapa 2 | versionar |
| 4 | Teste negativo: conta **não-membro** não recebe `new-comment` em `collective:<gid>` | Etapa 2 | teste |
| 5 | **Bloco 3 — limpeza do caminho morto:** trigger órfã em `group_chat_messages`; tabelas `analysis_groups`, `group_members`, `group_chat_messages` (confirmar vazias); `api/src/handlers/groups.js` + rotas `index.js:1078-1121` + import `:116-125`; `site/src/services/api/groups.js`; `site/src/hooks/useCollective.js` + export `hooks/index.js:14` | Rastreio 11/09 | remover |
| 6 | `useAuth` é hook com **46 consumidores** → 10× `/auth/session` + 10× `/auth/realtime-token` por carga (todas 200; churn de refresh no worker/Supabase Auth). Virar contexto/singleton | Underground 14/09 | higiene |
| 7 | Padronizar `cache:'no-store'` nos 29 GETs de `services/api/*.js` (wrapper) | Underground 14/09 | higiene |
| 8 | Timeout em `loadPosts` do Underground (§3.3 opcional) | Underground 14/09 | opcional |
| 9 | Relatórios não rastreados de outros fios (`docs/*`, `COMMIT_CONSOLIDADO_CICLO_STAGING_2026-09-02.md`, `METODOLOGIA_ETAPA1_MAPEAMENTO_2026-09-01.md`, `philosify-modules-review.html`, `printscreen 01/`) — decidir se entram em commit | git status | decisão |

## 4b. Ciclo de fechamento (OK integral do Bob, 14/09) — EXECUTADO, aguardando aceite

| Item | Feito | Verificado |
|---|---|---|
| Fix do cache (a) | `Cache-Control: no-store` no `jsonResponse` (`errorResponse` passa por ele) | ao vivo: `/api/health` e `/api/underground` (401) respondem `Cache-Control: no-store` |
| Fix do cache (b) | `cache:'no-store'` em `underground.js:getPosts` e `dm.js:getConversations` | bundle `CommunityPage-Buu0g5vq.js` |
| Timeout (c) | `useUnderground.loadPosts`: `AbortController` 15s → erro "Timed out loading confessions. Please try again." | eslint OK |
| Worker | dry-run OK → **deploy prod, versão `ada20c36-6e58-4b43-a7ec-6860cf6e4ed4`** | — |
| Ajuste do layout | lista `min-height:12.5rem` + piso do host com discussão `max(600px,70vh)` | real 839: painel 600 / lista 219 / composer dentro / página rola; grande 1109 / lista 728 |
| Site | build único → **Pages `1d15eafa-aba6-43e6-ab14-a802490dc685`** (Production) | `philosify.org` serve `index-CQgqBmcQ.js` + `CommunityPage-DSrvNevN.css` |
| Prova do no-store | Underground em aba nova do Chrome, load normal | carregou (177 posts), resposta com `no-store` |

**Roteiro de aceite do Bob (pendente):** Edge reduzido (lista com ≥4 comentários ou rolando com altura digna +
COMENTAR alcançável); Edge/Chrome maximizados (sem terço vazio); F5 simples no Chrome carregando o Underground;
passada em Ágora/Pessoas/Underground.

## 4c. Plano de staging do commit do ciclo (para OK após o aceite — NÃO executado)

Nada dos arquivos abaixo está no `.gitignore` (`git check-ignore` vazio; 29 jpg/png já rastreados em `new_design/`,
então os screenshots entram sem `-f`). Fora do commit, por serem de outros fios: `docs/*`,
`new_design/COMMIT_CONSOLIDADO_CICLO_STAGING_2026-09-02.md`, `METODOLOGIA_ETAPA1_MAPEAMENTO_2026-09-01.md`,
`philosify-modules-review.html`, `printscreen 01/`.

```bash
git add \
  site/src/styles/v2-pages/community.css \
  site/src/styles/v2-pages/community-panels.css \
  api/src/utils/response.js \
  site/src/services/api/underground.js \
  site/src/services/api/dm.js \
  site/src/hooks/useUnderground.js \
  new_design/LAYOUT_DISCUSSAO_COLETIVO_2026-09-14.md \
  new_design/UNDERGROUND_CHROME_CARREGANDO_2026-09-14.md \
  new_design/RELATORIO_CONSOLIDADO_COLETIVO_2026-09-14.md \
  new_design/printscreen_layout_discussao_2026-09-14/
git commit -m "layout do coletivo ocupa o viewport; api sem cache http (no-store) e timeout no underground"
git push origin redesign/v2
```
(6 arquivos de código + 3 relatórios + 5 screenshots; mensagem sem atribuição de IA, como sempre.)

## 5. Arquivos deste ciclo

- **Código commitado (`eac229e`):** `site/src/components/collective/AnalysisDiscussion.jsx`,
  `migrations/collective_comments_realtime_broadcast.sql`.
- **Código deployado, não commitado:** `site/src/styles/v2-pages/community.css`,
  `site/src/styles/v2-pages/community-panels.css`.
- **Relatórios (`new_design/`):** `COLLECTIVE_CHAT_RASTREIO_INSERT_2026-09-11.md`,
  `COLLECTIVE_COMENTARIOS_ETAPA1_2026-09-11.md`, `COLLECTIVE_COMENTARIOS_ETAPA2_PROPOSTA_2026-09-11.md`,
  `REALTIME_POSTMORTEM_2026-09-06.md` (anotado), `LAYOUT_DISCUSSAO_COLETIVO_2026-09-14.md`,
  `UNDERGROUND_CHROME_CARREGANDO_2026-09-14.md`, este arquivo; screenshots em
  `printscreen_layout_discussao_2026-09-14/` (01 antes real, 02 antes reduzida emulada, 03 depois real,
  04 depois reduzida emulada).

## 4d. Re-verificação do estado vivo (15/09, ao receber o OK integral do Bob)

O OK de 15/09 repetia o ciclo de fechamento do §4b, que já estava executado e deployado em 14/09. Nada foi
re-aplicado nem re-deployado; o que se fez foi conferir, item a item, que o estado vivo corresponde ao pedido.

| Verificação | Resultado |
|---|---|
| Worker prod (`wrangler deployments list --env production`) | versão ativa **`ada20c36-6e58-4b43-a7ec-6860cf6e4ed4`**, criada 2026-09-14 17:07 UTC (anterior: `84873c9e`, 02/09) |
| `GET /api/health` e `GET /api/underground` (sem cookie) ao vivo | ambos com `Cache-Control: no-store` (`errorResponse` passa por `jsonResponse`, então o 404/401 também leva o header) |
| Pages Production (`wrangler pages deployment list`) | **`1d15eafa-aba6-43e6-ab14-a802490dc685`** é a mais recente (21 h), branch `production`, commit-base `eac229e` |
| `philosify.org` (UA de navegador) | serve `index-CQgqBmcQ.js` + `index-DPyk0jk7.css` — os do build de 14/09 |
| Regra da lista | `.analysis-discussion__comments{flex:1;min-height:12.5rem;...}` presente no `index-DPyk0jk7.css` ao vivo (o `community-panels.css` cai no chunk compartilhado porque `ShareAnalysisToDMModal.jsx` também o importa; a `CommunityPage-DSrvNevN.css` carrega só o `community.css`: piso `max(480px,70vh)` e `:has(>.analysis-discussion){min-height:max(600px,70vh)}`) |
| Timeout do Underground | string "Timed out loading confessions" presente em `CommunityPage-Buu0g5vq.js` (local = deployado) |
| Working tree vs. deploy | fontes modificadas às 14:05–14:06 de 14/09; `dist/` gerado às 14:08 → o build deployado é exatamente o working tree atual, sem drift |
| `.gitignore` | `git check-ignore` vazio para os 3 relatórios e a pasta de screenshots (agora 5 jpg: o 05 é a medida do piso 600) |

**Desvio declarado em relação ao roteiro do Bob:** o roteiro previa o painel reduzido a ~579px (379 de overhead +
200 de lista). O implementado usa piso de **600px** no host quando a discussão está aberta — 21px acima —
porque o `.panelhost > *{min-height:0}` deixa o `.analysis-discussion` encolher abaixo do seu conteúdo e o
`overflow:hidden` do host cortaria o composer; o piso explícito no host é o que garante "lista ≥ 200 + composer
inteiro". Medido em 14/09: painel 600 / lista 219 / composer dentro / página rola.

**Pendente e fora do meu alcance:** o aceite do Bob (§4b, roteiro) e, com ele, o OK para o commit do §4c.
