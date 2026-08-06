# Auditoria de fechamento — o que falta no Philosify

**31 Jul 2026** · levantamento, **nada implementado**
**Produção:** frontend `b2f5d245` (commit `08eb46f`) · Worker `7218f432` · Ateliê `78040814`

---

## Método e limites

O que consegui verificar **ao vivo em produção** está marcado ✅ com a evidência.
O que só pude verificar **no código/deploy** está marcado ⚙️. O que **não consegui
verificar** está marcado ❓ com o motivo — e não é tratado como feito.

**Três coisas eu não alcanço desta máquina:**

1. **Qualquer conteúdo atrás de login** — análise real, anúncio renderizado,
   fluxo de compra. O navegador desta sessão não está autenticado, e eu não peço
   nem uso credencial sua.
2. **Supabase** — sem `.dev.vars`, sem chave. Não sei o que está nas tabelas.
3. **KV** — mesma razão. Ver a ressalva do item 2 sobre por que ainda assim
   posso afirmar que nada foi aplicado.

---

## 1. WP7 v3 — itens 1 a 9

| # | Item | Estado | Evidência |
|---|---|---|---|
| 1 | Resume pós-compra | ⚙️ no ar | `pendingAction` presente em 7 páginas v2 (Cinema, Ideas, Literature, Music, News, Quiz, UnsafeZone). Fluxo ponta a ponta exige compra real — não verificado |
| 2 | Trilho de compartilhamento | ⚙️ no ar | `sharetray`/share buttons em 6 arquivos, incluindo os 4 módulos de análise. Render exige análise concluída — não verificado |
| 3 | Eras/Escolas mortas | ⚙️ no ar | Pills com valores reais, painel portalizado, pré-seleção one-shot |
| 4 | Ticker ilegível | ✅ **verificado** | `.tick.brk .roll > *` com `animation: v2tkroll 270s` — duração derivada do conteúdo real, não fixa |
| 5 | Terms/Privacy 18 locales | ⚙️ no ar | Deploy `f3dde23c`; nl/pl/tr traduzidos, cláusula de prevalência nos 17 não-EN |
| 6 | Seis perguntas | ⚠️ **parcial** | Ver seção 2 |
| 7 | Tag de anúncio ilegal | ✅ **verificado** | `.ad-slot__label` = Inter, 10px, 500, `letter-spacing .18em`, `color: var(--ink-low)`. Sem ciano, sem Orbitron. Card: `1px dashed var(--line-strong)`, `radius 0`, `bg-cell` — conforme Ateliê §3 |
| 8 | Barra de progresso magenta | ✅ **verificado** | `--progress: #D6158C`; `.state .bar i { background: var(--progress) }` |
| 9 | Placeholders serifados | ✅ **verificado** | `.v2 input, .v2 textarea { font-family: var(--fu) !important; font-weight: 400 !important }` |

**Nenhum item 1–9 está fora do ar.** O 6 é o único incompleto, e por decisão sua.

---

## 2. Item 6 — as seis perguntas

### Container OS FATOS — regra no ar, efeito não verificado

✅ A regra está viva em produção:

```
.v2 .pg-news .facts .prose :where(strong,b)
  → font-family: var(--fu); font-weight: 500; font-size: 15px; color: var(--ink-text)
```

❌ **A regra é no-op. Roberto verificou: os rótulos não existem.**

A correção de 31 Jul pressupunha que os rótulos chegavam como marcação de ênfase
e só precisavam ser repintados. **A premissa era falsa** — não há o que pintar.
CSS não cria conteúdo.

### Por que não existem

`api/src/ai/prompts/news-analysis-template.js:133-139` lista as seis perguntas
como **orientação analítica**, não como formato de saída:

```
Establish the objective facts using the 5W+H framework:
- What: What happened? ...
- Who: Who are the actors involved? ...
```

Em seguida manda escrever *"as ONE cohesive analytical essay, not bullet points
or fragmented sections"*. O modelo obedece: entrega prosa corrida, sem rótulo
nenhum. Nunca houve rótulo para estilizar.

### O caminho limpo existe, e respeita a restrição

A instrução de formato está em **código** (`news-analysis-template.js`), não no
guia filosófico do KV — o guia é injetado como contexto, mas quem define o
formato de saída é o template. Portanto:

> Fazer os rótulos existirem **não envolve o guia nem a tag `<hl>`** — é edição
> de um arquivo de prompt. Exatamente a restrição que Roberto escreveu no item 4.

**Mas muda a forma do texto**, e isso é decisão editorial dele: OS FATOS deixa de
ser um ensaio corrido e passa a ser um briefing de seis entradas rotuladas.

**Duas consequências a aceitar antes:**

1. **Análises já em cache nunca terão rótulo** — notas são imutáveis. Só as novas.
2. Os rótulos precisam sair em `<strong>` HTML, não em markdown `**`, porque o
   `Prose` do NewsPage não converte markdown — sairiam asteriscos na tela.

**Estado: aguardando decisão de Roberto. Nada tocado.**

### `<hl>` na prosa corrida — intacto, como ordenado

✅ **Nada foi aplicado em guia ou KV.** Três evidências independentes:

1. O draft `new_design/philosify-guide-hl-addition-draft.md` está **untracked e
   sem modificação desde 30 Jul 16:20**.
2. `api/guides/` não recebe commit desde `75aadc0` (**24 Jul**) — anterior ao
   próprio draft.
3. KV só muda por `wrangler kv:key put` explícito. **Nenhum foi executado** em
   nenhuma sessão, e os arquivos de guia no repositório estão intocados — não
   existe conteúdo novo que pudesse ter subido.

✅ O frontend já está pronto e esperando: `.v2 hl { color: var(--silver) }`
confirmado ao vivo. Enquanto o guia não mudar, nenhuma análise carrega a tag e
nada muda visualmente.

---

## 3. Bug da Joana

### ⚠️ Correção de premissa

> A instrução diz "o cache limpo (os dois detectores retornaram zero)".
> **Isso não aconteceu.**

A auditoria retroativa **nunca foi executada**. Você decidiu explicitamente não
rodá-la: *"não vou fazer a auditoria. vou apenas deletar Joana do supabase"*.
Não houve detector nenhum, e portanto não houve retorno zero.

**Consequências honestas:**

- ❓ **O cache não foi auditado.** Não sei se há outras análises contaminadas.
- ❓ **Não sei se a Joana foi deletada.** Sem acesso ao banco, não posso conferir.
  Você nunca confirmou ter feito.

### O que ESTÁ confirmado

✅ **As duas validações no ar** (Worker `7218f432`):

| Fonte | Validação | Verificação |
|---|---|---|
| Genius | artista **e** título, nos 10 primeiros resultados | commit `71c52b5`, deploy confirmado |
| Letras.mus.br | página **após redirecionamento** conferida contra o título pedido | testado ao vivo: Joana → recusada; Realize e Imagine → aceitos |

✅ Recusa honesta: 404 `LYRICS_NOT_FOUND`, mensagem em 19 locales, crédito liberado.

⚙️ A ferramenta de auditoria existe, está deployada e **nunca foi usada** — ver
dívida técnica.

---

## 4. Preços do Ateliê

### ✅ Escada correta, confirmada ao vivo

`/api/ads/pricing`, lido agora:

| | 5s | 10s | 15s | 20s | 30s |
|---|---|---|---|---|---|
| Sidebar CPM | $10 | $20 | $30 | $40 | $60 |
| Taxa de criação | $150 | $250 | $350 | $450 | $650 |

Constellation CPM: $8. **Bate exatamente com o esperado.**

### ❓ Índice único — NÃO confirmado

`pricing_config_active_unique` — **você nunca disse que rodou**, e eu não consigo
inspecionar o catálogo do Postgres. Enquanto não existir, nada impede que uma
nova semeadura de preços por cima da atual reproduza o embaralhamento de abril.

**É o único item verdadeiramente bloqueante desta auditoria.**

### ✅ Ateliê no ar, sem erro

`ads.philosify.org` carrega, em português, com o seletor de 18 idiomas, sem
mensagem de erro no corpo. ❓ A opção de 30s na interface exige login de
anunciante — não verificada ponta a ponta.

---

## 5. Regressões residuais do walk

| Regressão | Estado | Evidência |
|---|---|---|
| Resume pós-compra restaurando o ponto exato | ⚙️ no ar | `getPendingAction`/`setPendingAction` em 7 páginas v2, com tipos distintos por ação (`cinema-analysis`, `film-panel`, etc.) |
| Sistema de sharing restaurado | ⚙️ no ar | Trilho presente nos 4 módulos de análise + Ideas |

❓ Nenhum dos dois verificado ponta a ponta: um exige compra real, o outro exige
análise concluída. Ambos exigiriam login.

---

## 6. Dívida técnica

### Resíduo de paleta

| Item | Onde | Gravidade |
|---|---|---|
| `#9c9ca3` fixo | `styles/ads.css:121,128` | Cosmético. Era o tom de `--ink-mid`; virou órfão quando o token subiu para `#D2D2D9`. Fora do escopo do lint por desenho |
| Violeta `#c4b5fd` | `styles/music-sidebar.css:941,958,1026` | **Dormente** — verifiquei ao vivo que o arquivo não carrega nas rotas v2. Invisível, mas é paleta v1 no repositório |

### Código morto e superfície não usada

- **`/api/admin/lyrics-audit` e `/purge`** — deployados, gated por
  `X-Admin-Secret`, **nunca usados**. Superfície nova para um trabalho que você
  decidiu não fazer. Ou usar, ou remover.
- **`api/scripts/lyrics-audit.mjs`** — idem.

### Lint

- **72 erros + 3 avisos** em `site/src` (eslint). Pré-existentes, concentrados em
  `components/history/` — variáveis não usadas, `performance` não declarado.
  Removi 2 nesta sessão (imports mortos do `BATTLE_COLORS`); não introduzi nenhum.

### TODOs reais no código

- `api/src/handlers/collective-comments.js:36,121,303` — `const lang = 'en'; //
  TODO: Extract from request headers/params`. **Três ocorrências**: comentários
  do Coletivo estão presos ao inglês.

### Documentação que não bate com o repositório

- **`supabase_schema.sql` não existe.** O CLAUDE.md o cita como referência do
  schema. Foi exatamente o que me impediu de te dar a ordem de deleção da Joana
  com segurança — não sei se `translations` e `user_analysis_requests` têm
  `ON DELETE CASCADE`.
- **`api/.dev.vars` não existe.** Documentado como o caminho de dev local;
  sem ele, nada roda localmente contra banco ou APIs externas.

### Versionamento

- **`new_design/` inteiro está untracked** — 30+ arquivos, incluindo a Design
  Law, todos os mockups, o draft do `<hl>` e **todos os relatórios**. Um `git
  clean` apaga o registro inteiro do redesign.
- `new_design/Supabase Snippet Untitled query.csv` — arquivo solto, provavelmente
  descartável.

### Outros

- Bundle principal ~2 MB (aviso de chunk > 500 kB no build).
- `utils/analysisDelay.js` — o comentário ainda afirma que uma compra de 30s
  significa 32 segundos de espera. Você contestou o efeito e tinha razão: é piso
  contado do início, não atraso somado. O comentário ficou desatualizado.

---

## 7. Branch `redesign/v2` vs `main`

```
main ......... 0 commits que a v2 não tenha
redesign/v2 . 69 commits à frente
```

**Não há divergência.** `main` está parada em `75aadc0` (24 Jul) e a v2 é
superconjunto estrito — o merge seria **fast-forward**, sem conflito.

**Mas há um risco operacional:** `main` é a branch padrão do repositório e a
produção serve a v2 desde 30 de julho. Quem clonar o repositório hoje recebe
código que não é o que está no ar, e um rollback de emergência para `main`
voltaria dois dias e meio de correções — incluindo os dois consertos de letra e
todo o WP7. **Pronto para merge tecnicamente; a decisão é sua.**

---

## 8. Defeitos notados e ainda não reportados

### `getOrCreateSong` nunca atualiza a letra de uma música existente

`api/src/db/songs.js` — quando a música já existe, retorna o id e **não toca em
`lyrics`**. Consequência: uma música cuja letra foi gravada errada mantém o texto
errado no registro **para sempre**, mesmo depois de uma reanálise correta. Não
afeta a análise (a letra é sempre rebuscada no Genius/Letras), mas o registro
continua afirmando algo falso — e era exatamente por isso que a purga previa
zerar o campo.

### `/api/ads/pricing` continua "última linha vence"

O código não desempata linhas do mesmo grupo. Com o índice único, isso vira
irrelevante. **Sem o índice, o defeito de abril está apenas adormecido.**

### `Prose` não converte markdown

`NewsPage.jsx` embrulha texto simples em parágrafos, mas **não converte `**`**.
Se algum campo de análise vier com markdown cru, o leitor vê asteriscos. Não
observei acontecer — não tenho como, sem login —, mas o caminho existe.

### Ritmo da barra nas notícias

`analysisProgress` usa janela esperada de 45 s no scan de notícias, enquanto a
janela mínima de revelação é 20 s. Numa análise em cache a barra revela o
resultado em torno de 66%. Honesto (nunca finge 100%), mas visivelmente
inacabado. Cosmético.

---

## LISTA PRIORIZADA

### 🔴 Bloqueante — depende de você

| | O quê | Por quê |
|---|---|---|
| 1 | **Criar `pricing_config_active_unique`** | Sem ele, o embaralhamento de preços volta na próxima semeadura. É o único item que pode custar dinheiro de novo |
| 2 | **Decidir sobre o cache de análises** | Nunca foi auditado. Não sei se a Joana saiu nem se há outras contaminadas. A ferramenta está pronta e nunca foi usada |

### 🟠 Importante — depende de você

| | O quê |
|---|---|
| 3 | **Ler o draft do `<hl>`** — o item 6 do WP7 fica parcial até isso |
| 4 | **Decidir se OS FATOS vira briefing rotulado** — confirmado que os rótulos não existem; fazê-los existir é edição do prompt (código, não guia), mas muda a forma do texto. Ver seção 2 |
| 5 | **Decidir o merge `redesign/v2` → `main`** — fast-forward, sem conflito |
| 6 | **Versionar `new_design/`** — hoje um `git clean` apaga a Design Law e todos os relatórios |

### 🟡 Médio — código, mas depende de decisão sua

| | O quê |
|---|---|
| 7 | Endpoints de auditoria de letra: usar ou remover |
| 8 | `getOrCreateSong` não atualiza letra de música existente |
| 9 | Três TODOs de idioma nos comentários do Coletivo |
| 10 | `supabase_schema.sql` citado no CLAUDE.md mas inexistente |

### ⚪ Cosmético

| | O quê |
|---|---|
| 11 | `#9c9ca3` órfão em `ads.css` |
| 12 | Violeta dormente em `music-sidebar.css` (invisível, verificado) |
| 13 | 72 erros de eslint pré-existentes |
| 14 | Comentário desatualizado em `analysisDelay.js` |
| 15 | Barra de notícias revelando em ~66% no cache |
| 16 | Bundle de 2 MB sem code-splitting |

### Fora de código, pendências antigas

- `www.philosify.org` retornando 522 (painel Cloudflare) — **não reverificado
  hoje**: o curl recebe 403 de proteção de bot em todos os domínios, o que
  impede distinguir 522 de funcionamento normal.
- Cloudflare Web Analytics — ativar no painel.

---

## Uma nota sobre o que esta auditoria não cobre

Tudo que exige sessão autenticada ficou fora: compra, análise real, anúncio
renderizado, resume ponta a ponta. São justamente os caminhos onde um defeito
custa dinheiro ou credibilidade. **Nenhum deles foi verificado por mim em
produção nesta sessão** — os itens 1, 2, 5 e a metade do 6 estão apoiados em
leitura de código e confirmação de deploy, não em observação do comportamento.
