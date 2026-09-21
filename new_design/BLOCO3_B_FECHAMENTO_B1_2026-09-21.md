# Bloco 3(b) — B1 (código) · fechamento · 21/09/2026

**Decisão do Bob (21/09):** B1 OK — aplicar o patch, validar, deployar worker + site, smoke, commit com a proposta +
patch + sql, push, hash. B2 (banco): OK só para o **passo 1** (pré-flight, só SELECT); o passo 2 espera o segundo OK
com o pré-flight em mãos. Ordem: B1 primeiro, B2 na sequência.

Proposta de origem: `BLOCO3_B_COLETIVO_MORTO_2026-09-21.md` (+ `.patch`, `.sql`).

## Commit

| Item | Valor |
|---|---|
| Hash | **`a9f6e5c`** (`a9f6e5c75135784c966f084fa7f4b85a5778f34f`) |
| Base | `59a8ec6` (fechamento do Bloco 3(a)) |
| Branch | `redesign/v2` — `origin/redesign/v2` aponta para ele (push confirmado por `git fetch`) |
| Autoria | Bob Rach, sem atribuição de IA (conferido no commit) |
| Mensagem | `coletivo: remove caminho morto (/api/groups, groups.js, useCollective, groupsService)` |
| Tamanho | 9 arquivos, +1555 −1018 (código: 6 arquivos, 0 inserções, 1018 remoções; docs: 3 arquivos, +1555) |
| Working tree após o push | limpo, exceto `BLOCO3_A_FECHAMENTO_2026-09-21.md` e este arquivo (untracked; commit só com ordem) |

### Conteúdo do commit

| Grupo | Arquivos |
|---|---|
| API | `api/index.js` (−59: import de `handlers/groups.js` e o bloco de rotas `/api/groups*`), `api/src/handlers/groups.js` (**removido**, −559) |
| Site | `site/src/hooks/useCollective.js` (**removido**, −202), `site/src/services/api/groups.js` (**removido**, −196), `site/src/hooks/index.js` (−1), `site/src/services/api/index.js` (−1) |
| Documentação | `BLOCO3_B_COLETIVO_MORTO_2026-09-21.md` (proposta), `.patch` (o diff aplicado, md5 `808b9c73…`), `.sql` (B2, três passos gated) |

## Validação antes do deploy (tree principal, patch aplicado)

| Checagem | Resultado |
|---|---|
| `git apply` do patch | limpo; `grep` residual de `handlers/groups`, `useCollective`, `services/api/groups`, `/api/groups` em `api/index.js`, `api/src`, `site/src` = **0** |
| `api`: `vitest run` | **12 arquivos / 139 testes passando** (a proposta citava 11/134: o worktree de validação não tinha `api/src/utils/secrets.test.js`, que é git-ignored e só existe no tree principal) |
| `site`: `vite build` | **ok**, `✓ built in 25.79s`, bundle `index-DSkDlDFa.js` |

## Deploy

| Alvo | Id | Confirmação |
|---|---|---|
| Worker `philosify-api-production` | versão **`65fa4cff-8af1-4666-9602-734ff2bf99c4`** a 100% (criada 2026-09-21T21:29:57Z) | `wrangler deployments list --env production` |
| Pages Production `philosify-frontend` | deployment **`08323e4d-d5fe-4a71-8148-9cd4922bda47`**, branch `production`, source `59a8ec6` (`--commit-dirty=true`; o commit `a9f6e5c` foi feito depois do deploy, conteúdo idêntico) | `wrangler pages deployment list` |
| philosify.org | serve **`assets/index-DSkDlDFa.js`** | `curl` com UA de browser (sem UA o Cloudflare devolve 403 — bot protection, não é do site) |

### Rollback (se precisar)

- Código: `git revert a9f6e5c` → `wrangler deploy --env production` + `vite build` + `wrangler pages deploy … --branch=production`.
- Pages direto: redeploy do deployment anterior `691468b1-1b7a-42ed-8003-83256f305528` (bundle `index-3zFarSkC.js`).
- Worker direto: `wrangler rollback` para a versão anterior `c6ac9ed4-0443-4b5c-b178-eaea5cfe01fc`.

## Smoke em produção

### Rotas mortas (curl, `Origin: https://philosify.org`, sem auth)

| Request | Status |
|---|---|
| `GET /api/groups` | **404** |
| `POST /api/groups` | **404** |
| `POST /api/groups/join` | **404** |
| `GET /api/groups/<uuid>` | **404** |
| `GET /api/groups/<uuid>/chat` | **404** |
| `POST /api/groups/<uuid>/leave` | **404** |
| `GET /api/health` | 200 `{"status":"ok"}` |
| `GET /api/collective` (rota **viva**, sem auth) | **401** — o Coletivo vivo continua respondendo |

### Coletivo vivo (Chrome, sessão do Bob `bob@bobrach.com`, `/community?tab=collective`)

| Passo | Request | Resultado |
|---|---|---|
| Lista "Meus coletivos" | (carga da aba) | Almir Guineto (2 membros · 2 análises), Simon & Garfunkel (2 · 2) |
| Detalhe Almir Guineto | `GET /api/collective/4f31a527…` | **200**; 2 análises listadas ("Conselho" 10 e 9) |
| Discussão da análise 10 | `GET /api/collective/analyses/81831a1b…/comments` | **200**; tela abre, caixa de comentário ativa |
| Discussão da análise 9 | `GET /api/collective/analyses/3aef3ce8…/comments` | **200**; comentário de Roberto Rachewsky ("BEM") renderizado, com Traduzir/Responder |
| Console (padrão `rror|ollective|404|Subscription|decrypt`) | — | **vazio** |

### DM com grupo (`/community?tab=messages`)

| Passo | Request | Resultado |
|---|---|---|
| Lista de conversas | `GET /api/dm/conversations` | **200**; 1 DM (r_rachewsky@hotmail.com) + 1 grupo ("Core", com botão "Sair do Grupo") |
| Abrir grupo "Core" | — | abre: cabeçalho "Core · 2 membros", thread vazio ("Comece a conversa!"), composer ativo. Nenhuma mensagem enviada (não era necessário para o smoke) |
| Console | — | **vazio** |

### Observação fora do escopo (pré-existente, não é regressão)

A lista de análises do Coletivo mostra contadores **"3 comments"** e **"8 comments"**, mas as discussões abrem com
**0** e **1** comentário visível, respectivamente. As duas chamadas de `/comments` devolveram 200. Hipótese: o contador
inclui comentários apagados (soft-delete) ou de outro escopo; não investigado neste bloco. Registrado para a fila.

## B2 — próximo passo (aguardando o Bob)

1. Bob cola os **8 blocos do PASSO 1** de `BLOCO3_B_COLETIVO_MORTO_2026-09-21.sql` no SQL Editor (só SELECT) e traz as saídas.
2. Esperado: 1-A `rows = 0` nas três; 1-B só a trigger órfã em `group_chat_messages`; 1-C/1-D/1-E/1-F = 0 linhas; 1-G = DDL de rollback (vai para o fechamento de B2); 1-H = linha de base do Coletivo vivo.
3. Com o pré-flight em mãos, segundo OK → PASSO 2 (DROP gated) → PASSO 3 (verificação) → fechamento de B2.

## Pendências abertas

- Este fechamento e `BLOCO3_A_FECHAMENTO_2026-09-21.md` estão **untracked**; commit só com ordem.
- Fila: contador de comentários ≠ comentários visíveis (acima); `useCinemaSidebar.js:18` (`refreshBalance` inexistente); `useDM` 2× `/api/dm/conversations`; post `09aca247…` da conta Roberto no Underground.
