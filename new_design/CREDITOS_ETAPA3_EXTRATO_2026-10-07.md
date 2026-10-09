# CRÉDITOS · ETAPA 3 · Extrato do usuário — proposta para OK

**Status:** OK do Bob (A-E) em 08/10/2026 · código pronto e verificado localmente · aguardando os 2 deploys (comandos do Bob) e o aceite do § 5.
**Base:** HEAD `0760f77` (worker com origem em todo confirm, v2 da RPC no banco). Decisões já dadas: B de 06/10 (saldo resultante calculado no worker), itens 1-6 da ordem de 07/10 (endpoint paginado por cursor, evoluir a aba Histórico do AccountModal, caminho do dinheiro intocado, rótulos ×18 cirúrgicos, lotes como um item, "carregar mais").
**Sequência após o OK:** diff do worker → diff do site → vitest + lint + build → deploy do worker (comando do Bob) → deploy do site (comando do Bob) → aceite → 2 commits.

---

## 0. Terreno levantado (o que existe hoje)

| Peça | Hoje | Destino |
|---|---|---|
| Aba **Histórico** do AccountModal (`AccountModal.jsx:516-566`, `useAccountHistory.js`) | mistura 2 fontes: `/api/user-history` (análises, painéis, debates, quiz, zona insegura; clicáveis) + `/api/history` (só `purchase/signup_bonus/promo/refund`; consumos **escondidos** em `isDisplayableCreditType`) | vira **Extrato**: uma fonte, `credit_history` via endpoint novo; consumos aparecem com origem; linhas de análise continuam clicáveis pelo `analysis_id`/`source` |
| `/api/history` (`api/index.js:1771-1818`) | consumidor único: `useAccountHistory.js:110` | **aposentar** no mesmo deploy do worker (sem outro consumidor; `grep` confirma) |
| `/api/user-history` (`handlers/user-history.js`) | consumidor: modal **HISTÓRICO** do menu da conta (`CommerceModals.jsx:44,137-172`, evento `v2-open-history`), lista "o que você fez" e reabre a análise | **fica**. Separação limpa: menu Histórico = o que você fez; aba Extrato = o que você pagou |
| `/api/transactions` + `useTransactions.js` | 0 consumidores no site; casamento temporal ±30 s | fora deste ciclo (achado colateral 6, OK próprio) |
| Clique no saldo do header (`NavAccount.jsx:86-93`) | dispara `v2-open-buy-credits` | **intocado** |
| Modal Comprar (`CommerceModals.jsx:99-135`) | rodapé `.mnote` com a nota de preços + saldo | ganha link discreto **"Ver extrato"** que fecha o modal e dispara `v2-open-statement` → `NavAccount` abre o AccountModal na aba |
| `AccountModal` | aba inicial fixa `'history'` (`:64`); sem prop de aba inicial | ganha `initialTab` opcional; `NavAccount` escuta `v2-open-statement` |
| i18n | `account.*` e `transactions.*` legados (sem origem fina); títulos de módulo em `v2.<módulo>.title` | bloco novo `account.statement.*` ×18 |

Fato relevante para o saldo: `reserve_credit` debita o saldo **sem** linha de extrato; a linha nasce no confirm (−1) ou no release (+1 refund, que anula um débito que nunca apareceu). Logo, a qualquer instante: `credits.total = Σ amount(credit_history) − reservas pendentes`. Daí o ponto de partida do saldo resultante: `saldo_atual + pendentes`.

## 1. Contrato do `GET /api/credits/history`

**Auth:** cookie HttpOnly via `getUserFromAuth` (padrão das 26 rotas do worker); dados via `pg()` com service key (`utils/pg.js`), filtrando `user_id` do token. Sem RLS no caminho; o filtro é do servidor.

**Query:** `limit` (1-50, default 30) · `before` (ISO `created_at` do último item cru da página anterior) · `before_id` (uuid do mesmo). Sem os dois = primeira página.

**Resposta (exemplo real, usuário com painel, cinema, refund do reaper, compra Stripe e linhas antigas):**

```json
{
  "success": true,
  "balance": { "total": 41, "purchased": 40, "free_remaining": 1, "pending": 0 },
  "items": [
    { "id": "7c1e…", "at": "2026-10-07T19:12:03.118Z", "kind": "charge", "source": "panel",
      "description": "Oppenheimer (cinema)", "amount": -3, "count": 3, "batch_id": "b9a0…",
      "balance_after": 41, "link": { "kind": "panel", "id": "d3f1…" } },
    { "id": "5a77…", "at": "2026-10-07T19:07:41.502Z", "kind": "charge", "source": "cinema",
      "description": "As Quatro Mudas do Mundo Antigo", "amount": -1, "count": 1, "batch_id": null,
      "balance_after": 44, "link": { "kind": "analysis", "mediaType": "cinema", "id": "e21c…" } },
    { "id": "3b02…", "at": "2026-10-06T22:40:10.000Z", "kind": "refund", "source": null,
      "description": null, "reason": "timeout", "amount": 1, "count": 1, "batch_id": null,
      "balance_after": 45, "link": null },
    { "id": "9d4e…", "at": "2026-09-29T13:01:55.000Z", "kind": "purchase", "source": null,
      "description": null, "amount": 40, "count": 1, "receipt_url": "https://pay.stripe.com/receipts/…",
      "balance_after": 44, "link": null },
    { "id": "11aa…", "at": "2026-09-22T10:15:00.000Z", "kind": "charge", "source": null,
      "description": null, "amount": -1, "count": 1, "batch_id": null,
      "balance_after": 4, "link": null },
    { "id": "00f3…", "at": "2026-08-30T09:00:00.000Z", "kind": "bonus", "source": null,
      "description": null, "amount": 2, "count": 1, "balance_after": 2, "link": null }
  ],
  "next": { "before": "2026-08-30T09:00:00.000Z", "before_id": "00f3…" }
}
```

`next = null` quando acabou. `kind` deriva do `type` e do sinal: `analysis` → `charge`; `refund` com `amount > 0` → `refund`; `refund` com `amount < 0` (Stripe) → `chargeback`; `purchase` → `purchase`; `signup_bonus` → `bonus`; qualquer outro `type` (`admin_grant_credits`, `promo`) → `adjustment`. `source` vem de `metadata.source` (null nas linhas anteriores a 07/10). `reason` vem de `metadata.reason` nos refunds. `link` só quando há como reabrir: `analysis_id` preenchido (música) → `{kind:'analysis', mediaType:'music'}`; `metadata.analysis_id` com forma de uuid + `source ∈ {book, cinema, news}` → `{kind:'analysis', mediaType}`; `source = panel` → `{kind:'panel', id: metadata.analysis_id}`; `source` de colóquio/debate → `{kind:'debate', id}` extraído de `description = "thread:<uuid>"`. Quiz, espaços, zona insegura, compras, refunds: `link: null`.

**Cálculo no worker, por requisição:**
1. `credits` do usuário (`purchased, free_remaining, total`) e `pending = count(credit_reservations where user_id and status='pending')`.
2. Página crua: `credit_history?user_id=eq.U&order=created_at.desc,id.desc&limit=L+10` com `created_at=lte.before` quando há cursor; descarta linhas com `created_at == before && id >= before_id` (desempate do cursor composto sem usar `or(` do PostgREST, que o helper `pg()` bloqueia por segurança).
3. **Lotes no worker** (item 5, decisão proposta: agrupar aqui, não no cliente). Linhas consecutivas com o mesmo `batch_id` viram um item (`amount` somado, `count`, `at` = a mais recente). Se o lote está cortado no fim da página, o worker busca mais `limit=5` com o mesmo cursor até fechar o lote; o cursor `next` é sempre a **última linha crua** consumida. Por quê no worker: a página passa a ter semântica de itens inteiros, o cliente não lida com lote partido entre páginas, o `balance_after` do lote é calculado uma vez e a lista é um `map` burro. Agrupar no cliente exigiria vazar a lógica de borda de página para o React.
4. **Saldo resultante** (item 6, decisão B): `start = balance.total + pending − Σ amount(linhas cruas mais novas que o cursor)`. Primeira página: a soma é zero. Páginas seguintes: `credit_history?user_id=eq.U&created_at=gt.before&select=amount` (uma leitura leve; `created_at = before` com `id > before_id` entra também). Depois, descendo pela página: `balance_after(item) = running` antes de subtrair; `running −= item.amount`. Para um lote, `balance_after` é o saldo **após o lote**.

**Erros:** 401 sem cookie; 400 cursor malformado; 500 com `{ success:false, error }` se o PostgREST falhar.

## 2. Wireframe textual da aba

Cabeçalho do modal igual ao de hoje (`MINHA CONTA`). Abas: **PERFIL · EXTRATO · NOTIFICAÇÕES · SEGURANÇA** (a aba muda de nome; mesma posição).

```
EXTRATO                                                  Saldo · 41   ← .acct-sec + numeral em --silver (Law §2.3)
───────────────────────────────────────────────────────────────────────
07 out 19:12   Painel de Filósofos · Oppenheimer (cinema)      −3     41
07 out 19:07   Análise de filme · As Quatro Mudas do Mundo…    −1     44   ›   ← clicável (link)
06 out 22:40   Crédito devolvido · tempo esgotado              +1     45
29 set 13:01   Compra de créditos                             +40     44   [recibo]
22 set 10:15   Análise                                         −1      4        ← linha antiga sem source
30 ago 09:00   Bônus de cadastro                               +2      2
───────────────────────────────────────────────────────────────────────
                         [ carregar mais ]                               ← só se next != null
```

- Grade de 4 colunas por linha: data (`.acct-date`, `--ink-low`) · movimento (`.acct-desc`, `--ink-hi`, 1 linha com ellipsis; rótulo pela `source` + ` · ` + `description` quando houver) · valor (`.acct-amt`, `tabular-nums`; `+` em `--ink-hi`, `−` em `--ink-mid`, como hoje) · saldo (`.acct-bal`, `--ink-mid`, `tabular-nums`). Sem cartões, sem cor nova, sem ícones/emojis (os pictogramas atuais saem).
- Mobile (≤ 640 px): data e saldo descem para uma segunda linha em `--ink-low` (`"07 out 19:12 · saldo 41"`), movimento e valor ficam na primeira.
- Estados: carregando (`account.statement.loading`), vazio (`account.statement.empty`), erro (`account.statement.error` + link "tentar de novo"), fim da lista sem botão. Botão "carregar mais" é `.aspeed`-like: texto, sem borda, `--mid` → `--ink` no hover; desabilitado enquanto carrega.
- Linha clicável (`link != null`): mantém `.clickable` + seta `›` como hoje e chama `onViewAnalysis(id, mediaType, kind)` / `onViewDebate(id)` já existentes em `NavAccount` (`:28-60`).
- Recibo: `[recibo]` reaproveita `.acct-receipt` existente quando `receipt_url` vier.
- Modal Comprar: abaixo da nota de preços, link `.aspeed`-like `Ver extrato` → fecha o modal de compra e dispara `v2-open-statement`.

## 3. Chaves i18n novas (×18, método cirúrgico)

Bloco `account.statement` (ao lado de `account.history`, que fica para o menu). Terminologia: títulos de módulo já existentes em `v2.<módulo>.title` (MÚSICA, CINEMA, LITERATURA, NOTÍCIAS, IDEIAS, QUIZ, ZONA INSEGURA), `transactions.*` para compra/bônus/reembolso.

| chave | pt | en |
|---|---|---|
| `title` | Extrato | Statement |
| `balance` | Saldo | Balance |
| `colDate` / `colMovement` / `colAmount` / `colBalance` | Data / Movimento / Valor / Saldo | Date / Movement / Amount / Balance |
| `loading` | Carregando extrato… | Loading statement… |
| `empty` | Nenhum movimento ainda | No movements yet |
| `error` | Não foi possível carregar o extrato | Could not load the statement |
| `retry` | Tentar de novo | Try again |
| `loadMore` | Carregar mais | Load more |
| `receipt` | Recibo | Receipt |
| `legacyCharge` | Análise | Analysis |
| `source.music` | Análise de música | Music analysis |
| `source.book` | Análise de livro | Book analysis |
| `source.cinema` | Análise de filme | Film analysis |
| `source.news` | Análise de notícia | News analysis |
| `source.news_sources` | Fontes de notícias | News sources |
| `source.panel` | Painel de Filósofos | Philosophers' Panel |
| `source.colloquium_access` | Colóquio · acesso | Colloquium · access |
| `source.colloquium_participate` | Colóquio · participação | Colloquium · participation |
| `source.colloquium_philosopher` | Colóquio · filósofo | Colloquium · philosopher |
| `source.colloquium_propose` | Colóquio · proposta | Colloquium · proposal |
| `source.open_debate` | Debate aberto | Open debate |
| `source.quiz` | Quiz | Quiz |
| `source.space` | Acesso a espaço | Space access |
| `source.unsafe_zone` | Zona Insegura | Unsafe Zone |
| `kind.purchase` | Compra de créditos | Credit purchase |
| `kind.bonus` | Bônus de cadastro | Signup bonus |
| `kind.refund` | Crédito devolvido | Credit returned |
| `kind.chargeback` | Reembolso Stripe | Stripe refund |
| `kind.adjustment` | Ajuste | Adjustment |
| `reason.timeout` / `reason.user_timeout_cleanup` | tempo esgotado | timed out |
| `reason.cached` / `reason.cached_review` / `reason.already_owned` | análise já existia | analysis already existed |
| `reason.failed` / `reason.analysis_failed` / outros | análise falhou | analysis failed |
| `v2.commerce.viewStatement` | Ver extrato | View statement |

Total: 37 chaves × 18 idiomas. Descrição livre (`description`) nunca é traduzida: é o título da obra, o nome do filósofo, `thread:<id>` vira só o rótulo da source. Linhas antigas sem `source` e `type = analysis` → `legacyCharge`. Nos 16 idiomas restantes, a tradução segue a terminologia das chaves `v2.<módulo>.title` e `transactions.*` já existentes em cada arquivo (script valida que toda chave existe em todos os 18 e que nenhuma colide).

Renome da aba: `account.history` **continua existindo** (menu, textos legados); a aba usa `account.statement.title`.

## 4. Plano de migração do hook e do legado

1. `useAccountHistory.js` → **`useCreditStatement.js`** novo (fetch do endpoint, `items`, `balance`, `loadMore`, `hasMore`, `loading`, `error`, `refresh`; escuta `credits-changed` como hoje e recarrega a primeira página). `useAccountHistory.js` sai junto com `/api/user-history` da aba: a aba deixa de buscar análises. O modal HISTÓRICO do menu continua com o seu fetch próprio em `CommerceModals.jsx`.
2. `AccountModal.jsx`: aba `history` → `statement`; render novo (§ 2); `formatDescription`, `renderRight`, `getDebateThreadId`, `stripPictographs` saem; `initialTab` prop.
3. `NavAccount.jsx`: escuta `v2-open-statement` → `setAcctOpen(true)` + `initialTab='statement'`.
4. `CommerceModals.jsx`: link "Ver extrato" no modal Comprar.
5. `api/index.js`: rota nova `GET /api/credits/history` (handler em `api/src/handlers/credit-statement.js`, puro e testável: `groupBatches(rows)`, `withRunningBalance(items, start)`, `deriveKind(row)`, `deriveLink(row)`); rota `/api/history` **removida** no mesmo deploy. Prefixo `/api/credits/` não colide com nada hoje.
6. `account.css`: `.acct-row` passa a 4 colunas (`grid-template-columns: auto minmax(0,1fr) auto auto`), `.acct-bal` novo, `.acct-more` (botão), media query ≤ 640 px. Só tokens.
7. Fora deste ciclo, registrado: `/api/transactions` + `useTransactions.js` (mortos), `/api/user-history` segue.

Ordem de deploy: **worker primeiro** (endpoint novo coexiste com `/api/history` até o site trocar; a remoção de `/api/history` pode ir no mesmo deploy porque o site velho em cache, com `index.html` network-first, só fica vivo até o F5; se o Bob preferir zero risco, a remoção vai no deploy seguinte). Depois o site.

## 5. Plano de teste

**Unitário (vitest, `api/src/handlers/credit-statement.test.js`, fixtures sem rede):**
1. Linhas antigas sem `source`: `kind='charge'`, `source=null`, `link=null`; `analysis_id` preenchido → `link.kind='analysis', mediaType='music'`.
2. Lote do painel: 3 linhas com o mesmo `batch_id` → 1 item, `amount=-3`, `count=3`, `at` da mais recente, `balance_after` = saldo após as 3.
3. Lote cortado pela página: 2 linhas na página, a 3ª além do `limit` → o worker estende e devolve o lote inteiro; `next` aponta para a 3ª linha crua.
4. Refund dos reapers: `type=refund, amount=+1, metadata.reason=timeout` → `kind='refund', reason='timeout'`. Refund da `release_reservation` (`reason=cached_review`) idem.
5. Compra Stripe: `type=purchase, amount=+40, metadata.receipt_url` → `kind='purchase'`, `receipt_url` propagado. Chargeback: `type=refund, amount=-40, stripe_session_id` → `kind='chargeback'`.
6. Saldo resultante: fixtures `total=41, pending=0` e a sequência do § 1 → `[41, 44, 45, 44, 4, 2]`; com `pending=1` → tudo +1. Página 2: `start = total + pending − Σ(mais novas)` confere com o `balance_after` do último item da página 1 menos o seu `amount`.
7. `deriveKind` para `admin_grant_credits` (`type` livre) → `adjustment`; `signup_bonus` → `bonus`.
8. Cursor: `before/before_id` descarta a própria linha do cursor e linhas com `created_at` igual e `id` maior.

**Site (lint + build):** `npm run lint`, `npm run build`; chaves ×18 validadas por script (presença e ausência de colisão).

**Aceite em produção (conta do Bob):**
1. Abrir a conta → aba **Extrato**: saldo do cabeçalho igual ao do header; primeira linha é o painel de 07/10 19:12 como **um** item `−3`; a de cinema de 19:07 com `−1` e seta; clicar reabre o filme.
2. Rolar até o fundo → "carregar mais" → página 2 continua o saldo sem salto (último saldo da página 1 − valor = primeiro da página 2 + seu valor).
3. Linhas antigas (antes de 07/10) aparecem como "Análise" sem seta, exceto música com `analysis_id`.
4. Refund do reaper, se houver, como "Crédito devolvido · tempo esgotado" `+1`; compra Stripe com `[recibo]` abrindo o recibo.
5. Trocar o idioma (en, es, ja) → rótulos e estados localizados; descrições livres iguais.
6. Modal Comprar → "Ver extrato" fecha a compra e abre a conta na aba. Clique no saldo do header continua abrindo a compra.
7. `/api/history` → 404 (aposentado); modal HISTÓRICO do menu segue listando análises.

## 6. Commits (por ordem, após aceite)

1. `extrato: GET /api/credits/history com lotes e saldo resultante; /api/history aposentado` (worker + teste).
2. `extrato: aba do extrato no v2 (origem localizada x18, saldo por linha, carregar mais)` (site + i18n + css).

## 7. O que peço de OK

- **A.** Contrato do § 1, incluindo lotes agrupados **no worker** e `kind` derivado (`charge/refund/chargeback/purchase/bonus/adjustment`).
- **B.** Aba renomeada para Extrato, só movimentos de crédito; análises sem cobrança ficam no modal HISTÓRICO do menu (que não muda).
- **C.** Rótulos do § 3 (pt/en como referência; os 16 seguem a terminologia local).
- **D.** `/api/history` removido no deploy do worker (ou no seguinte, à sua escolha); `/api/transactions` fica para OK próprio.
- **E.** Ordem: worker → site, dois comandos de deploy, aceite § 5, dois commits.

## 8. Registro

| Passo | Data | Resultado |
|---|---|---|
| Proposta redigida | 07/10 | este arquivo; nenhum código |
| OK do Bob (A-E) | 08/10 | A-E aprovados sem ajuste; `/api/history` sai no MESMO deploy do worker; o md entra no commit 1 |
| Diff do worker | 08/10 | `api/src/handlers/credit-statement.js` (handler puro + rota) · `credit-statement.test.js` (21 testes) · `api/index.js` (rota nova, `/api/history` removido, −52 linhas) |
| Diff do site | 08/10 | `useCreditStatement.js` (novo; `useAccountHistory.js` apagado) · `AccountModal.jsx` (aba Extrato, `initialTab`) · `NavAccount.jsx` (`v2-open-statement`) · `CommerceModals.jsx` (link Ver extrato) · `account.css` + `v2-components.css` (só tokens) |
| i18n ×18 | 08/10 | **36 chaves** (não 37: as variantes de `reason.*` do § 3 colapsaram em 3 baldes `timeout/cached/failed`, mapeados no cliente) · inserção cirúrgica por script (texto, CRLF preservado) · validação: toda chave presente e não vazia nos 18, nenhuma chave pré-existente alterada, nada além das 36 |
| vitest (api) | 08/10 | 13 arquivos, 160 testes, 0 falhas |
| lint + build (site) | 08/10 | eslint limpo nos arquivos tocados (baseline do repo segue com 92 problemas pré-existentes, inalterado) · `lint:tokens` OK · `vite build` OK · `wrangler deploy --dry-run --env production` OK |
| smoke local | 08/10 | `wrangler dev`: `/api/credits/history` → 401 sem cookie · `/api/history` → 404 |
| Deploy worker | 08/10 | version c6acfeb9-c9a1-4980-baf4-40479c3fbd2f · prod: /api/health ok · /api/credits/history → 401 sem cookie · /api/history → 404 |
| Deploy site | 09/10 | pages deploy e8b8ec3d (branch production) · bundle assets/index-CnBHb3rj.js · curl em philosify.org cai no challenge do Cloudflare (403), verificação do domínio feita no navegador |
| Aceite § 5 | 09/10 | ACEITE do Bob: aba em Configurações da conta verificada; lote do painel agrupado em um item −3; filme clicável; linhas antigas rotuladas; saldo por linha sem salto |
| Commits | 09/10 | (1) worker + teste + este md: fc653e7 · (2) site + i18n + css: o commit que traz esta linha |

## 9. Ajustes encontrados ao escrever o código (contrato aprovado mantido)

1. **A soma "mais novas que o cursor" inclui a linha do cursor.** O teste de salto entre páginas pegou: a página 2 começa *depois* do cursor, logo tudo que é mais novo **ou igual** ao cursor já foi consumido. `sumNewerThan` usa `id >= before_id` no empate de `created_at`. O exemplo do § 1 tinha aritmética errada nas duas últimas linhas; a identidade está certa.
2. **`reason` em 3 baldes** no cliente (`timeout`, `cached`, `failed`), não uma chave por variante: mesmo texto, menos chaves. O worker segue devolvendo o `reason` cru.
3. **`link` do painel leva `mediaType`** lido do sufixo `(cinema|literature|news|music)` da descrição, já traduzido para o vocabulário do `NavAccount.viewAnalysis` (`literature → book`); sem isso o painel de literatura abriria em /music.
4. **Descrições internas não chegam à tela:** `thread:<uuid>` e `start:/continue:<id>` (quiz) são removidos no cliente; a nota em inglês de `news_sources` idem. Títulos e nomes de filósofos ficam.
5. **Cabeçalho de colunas** (chaves `col*` do § 3) renderizado no desktop e escondido no mobile.
6. **`initialTab` do AccountModal** é `profile` quando aberto pelo menu (antes a aba inicial era Histórico); `statement` só via `v2-open-statement`.

## 10. Comandos de deploy (ordem: worker → site)

```bash
cd api && wrangler deploy --env production
cd site && npm run build && wrangler pages deploy dist --project-name=philosify-frontend --branch=production
```
