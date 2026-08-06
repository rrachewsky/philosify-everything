# SHARING — idioma segue o remetente + Cinema e Literatura deixam de ser invisíveis

**Instrução:** 2 Ago · **Execução:** 2 Ago
**Branch:** `redesign/v2` · **Commit:** `890d5f0`
**Deploys:** Worker `c1e2ca85` · Pages `8f3aa8b9`

Regra aplicada, sua: *o card e a página compartilhada ficam no idioma em que a análise foi gerada — o do remetente. Quem recebe e quer outra língua escolhe e pede uma análise nova. Não construir camada de tradução.*

---

## 1. As quatro pontas — todas corrigidas e verificadas ao vivo

### Ponta 1 · `/debate/:id` descartava o `?lang=`

Não era uma linha. O `Router.jsx` descartava o parâmetro, mas a `IdeasPage` **nunca leu `lang`** — repassar sem alguém para consumir não mudaria nada. Foram os dois lados.

O `DebateDeepLink` agora carrega o parâmetro, e a `IdeasPage` o aplica **só quando há um debate deep-linkado** (`/ideas` sozinho é a página do próprio visitante e mantém a língua dele).

**Prova em produção** — visitante com preferência `en`, link compartilhado em francês:

```
abri   philosify.org/debate/65ae019c…?lang=fr
virou  philosify.org/ideas?debate=65ae019c…&lang=fr    ← o parâmetro sobreviveu
página <html lang="fr">
tela   "IDÉES · COLLOQUE >>> QUOTIDIEN PAR LE SYSTÈME · DÉBATS >>> PAR LES UTILISATEURS"
```

Antes: card em francês, página em português. Agora os dois em francês.

### Ponta 2 · `/panel/:id` nunca alinhava o idioma

O `panel.lang` vinha no blob e era ignorado. Agora a interface segue o texto do painel — que é o único caminho possível, já que o idioma está na **chave de cache** do painel (`philosopher-panel.js:126`): painel em outra língua é outro painel, com outro id, a 3 créditos.

**Prova** — visitante com preferência `en`, painel gerado em pt:

```
<html lang="pt">   preferredLanguage: "en"
cabeçalho  "Painel de Filósofos // Friedrich Nietzsche · Frederick Douglass · Friedrich Hayek"
CTA        "Quer analisar suas músicas favoritas?"
```

### Ponta 3 · `/a/` e `/shared/` só alinhavam quem nunca escolhera idioma

Removida a guarda `preferredLanguage`. A página compartilhada agora segue o conteúdo **sempre**.

**E o defeito que estava embaixo dela:** o `i18n/config.js` persiste **toda** mudança de idioma em `localStorage.preferredLanguage`, no listener `languageChanged`. O código antigo checava a preferência antes de chamar, mas a chamada em si **gravava** — uma única visita a um link compartilhado em português trocava o site inteiro daquele visitante para português, para sempre. Sobrescrever a preferência global era exatamente o que sua regra proíbe.

O hook novo (`useSharedContentLanguage`) captura o valor antes e o repõe depois — inclusive repondo "ausente", para quem nunca escolheu nada.

**Prova** — forcei a preferência para `en` e abri uma análise em pt:

```
preferência antes   "en"
página              <html lang="pt">   CTA "Quer analisar suas músicas favoritas?"
bandeja             "Compartilhe com seus amigos. | Basta clicar abaixo."
preferência depois  "en"    ← intacta
```

A preferência real sua (`pt`) foi restaurada ao fim do teste; conferi que não sobrou nenhuma chave de sonda.

### Ponta 4 · `shareNewsText` anunciava um painel que não existia

Criada `shareNewsAnalysisText` nos **18 locales**, derivada da redação de música de cada idioma, sem o autor. A chave de painel ficou intacta.

```
painel   📰 Confira o Painel dos Filósofos sobre: {{title}} | Philosify   (inalterada)
análise  📰 Confira a análise filosófica de {{title}} no Philosify!       (nova)
```

Eram **dois** pontos emitindo a frase errada, não um: `NewsPage.jsx:780` e `ResultsContainer.jsx:535` (a tela legada do `/app`). Os dois trocados. Conferido no bundle publicado: o chunk `pt` em produção é byte-idêntico ao local e traz a chave nova; o `NewsPage` referencia as duas chaves (análise e painel), o `/app` só a de análise.

---

## 2. O Whiplash — não era o card, era a tabela

Você pediu para garantir que `/shared/:id` passasse pelo mesmo gerador de OG que `/a/`. **Ele já passava**: o `_worker.js` intercepta `/(a|shared|panel|debate)/` e mapeia `shared → a`. O card genérico tinha outra causa, mais grave.

**Cinema e Literatura não moram em `analyses`.** Música e Notícias vão para `analyses`; Cinema para `film_analyses`; Literatura para `book_analyses`. Não há escrita dupla — verifiquei os três inserts. E **todo** resolvedor por id consultava só `analyses`:

| Caminho | Consultava | Resultado para um filme |
|---|---|---|
| `analysisCard` (card OG) | `analyses` | `ok:false` → card genérico em inglês |
| `GET /shared/:uuid` | `analyses` | 404 |
| `GET /api/shared/:uuid` | `analyses` | 404 |
| `getSharedAnalysis` (token) | `analyses` | "Analysis not found" |

Ou seja: **a página estava quebrada também**, não só a prévia. E há um terceiro efeito — o `POST /api/share` delega ao RPC `create_share_token`, cujo `analysis_id` referencia `analyses`; para um filme o RPC recusa, o `ShareButton` cai no fallback `/shared/:uuid`, e é por isso que o seu link do Whiplash tinha esse formato em vez de `/a/:slug`.

**Correção:** um módulo único, `api/src/sharing/analysis-lookup.js`, que procura nas três tabelas e achata a obra e o autor (`songs(title,artist)`, `films:film_id(title,director)`, `books:book_id(title,author)`) para o formato que o frontend já lê. Os quatro caminhos acima passaram a usá-lo.

**Verificado:** a página do Whiplash abre em produção — título, diretor, veredito, bandeja de compartilhar com os 9 logos. Antes dizia "análise não encontrada".

### Um defeito que a correção deixou à vista

Com a página finalmente renderizando, apareceu o veredito **em inglês** ("Moderately Revolutionary") no meio de uma página em português. Cinema e Literatura guardam o veredito em inglês canônico e não mandam cópia localizada; a `SharedAnalysis` exibia o valor cru. Corrigido reusando o helper `classificationLabel` que já existe — não criei um quarto mapa; o mapa `classification → chave i18n` já está duplicado em três arquivos.

Agora: `Moderadamente Revolucionária`, igual ao card.

**Fica registrado, fora do escopo:** a página `/cinema` do módulo tem o mesmo defeito e continua exibindo o veredito em inglês (`CinemaPage.jsx:500` passa o valor cru). É anterior a esta instrução e não é superfície de compartilhamento. Diz se quer que eu feche.

---

## 3. Gerador de OG — de cinco para um

Havia **quatro** emissores de HTML com meta OG escritos à mão no `api/index.js`, além do gerador atual:

| # | Onde | O que tinha de errado |
|---|---|---|
| 1 | branch de bot em `/shared/:uuid` | `<html lang="en">` fixo, vocabulário só de música (`analysis.song`), "Philosophical analysis:" em inglês cru, sem veredito, redirecionava para a home |
| 2 | branch de bot em `/api/shared/:slug` | idêntico ao 1 |
| 3 | stub legado `/api/share-preview/debate/:id` | tabela de rótulos própria, **6 locales** contra os 18 do gerador atual |
| 4 | stub legado `/api/share-preview/panel/:id` | idem, mais emojis por mídia decididos ali |

Os quatro foram removidos. Os dois stubs legados continuam respondendo — há links de outras pessoas no WhatsApp apontando para eles — mas agora só fornecem o transporte: o conteúdo vem do mesmo `resolveShareCard`, e o visitante é encaminhado ao permalink real. As tabelas de rótulo de 6 locales sumiram junto com o `escapeHtml` que só elas usavam.

**Prova:** em todo o código-fonte do `api/` restou **uma única** ocorrência de `og:title`, em `share-preview.js`. E o stub legado do painel agora devolve exatamente o título do gerador único:

```
<html lang="pt">
<title>Quatro restaurantes e uma volta ao mundo sem sair do balcão — Estadão · Painel de Filósofos · Philosify</title>
```

---

## 4. O card real de cada módulo, em produção

Todos com user-agent de crawler, direto em `philosify.org`:

| Módulo | `lang` | `og:title` |
|---|---|---|
| **Música** | `pt` | My Way - 2008 Remastered — Frank Sinatra · **Extremamente Revolucionária** · Philosify |
| **Cinema** | `pt` | Whiplash: Nos Limites — Damien Chazelle · **Moderadamente Revolucionária** · Philosify |
| **Literatura** | `pt` | Obras completas de Monteiro Lobato — José Bento Monteiro Lobato · **Moderadamente Revolucionária** · Philosify |
| **Notícias** | `pt` | Análise \| Inviável nas urnas, Zema disputa Planalto… — Estadão · Philosify |
| **Painel** (notícia) | `pt` | Quatro restaurantes e uma volta ao mundo sem sair do balcão — Estadão · **Painel de Filósofos** · Philosify |
| **Painel** (música) | `pt` | The Fate of Ophelia — Taylor Swift · **Painel de Filósofos** · Philosify |
| **Debate** `?lang=pt` | `pt` | Nenhuma causa — nem mesmo o amor divino… · **Debates** · Philosify |
| **Debate** `?lang=fr` | `fr` | Aucune cause, pas même l'amour divin… · **Débats** · Philosify |

O formato é o que você pediu: `<obra> — <autor> · <veredito> · Philosify`. Notícias sai sem veredito porque `classification` ali guarda o tipo de mídia (`"news"`), e o `isVerdict()` o descarta — correto.

As descrições saem no idioma do conteúdo, com o veredito e o começo do racional.

---

## 5. Duas coisas que preciso te dizer

**(a) Cinema e Literatura não geram link curto `/a/:slug`.** O `share_tokens.analysis_id` referencia `analyses`, então o RPC recusa um id de filme ou livro e o botão cai no `/shared/:uuid`. O link **funciona** agora — card e página —, mas por esse caminho **não há rastreamento de indicação**, que é o que o token carrega. Fechar isso exige mexer na FK do banco, e eu não toco no schema sem você. Diz se quer que eu prepare a migração para sua revisão.

**(b) Repassar um `/a/:slug` preserva a indicação de quem compartilhou primeiro.** Quem recebe e repassa está propagando o token original — os créditos de indicação continuam indo para o primeiro divulgador. É consequência de reusar o link em vez de cunhar outro (cunhar exige sessão, e o visitante em geral não tem). Registro porque é uma decisão de produto, não um bug.

---

## 6. Pendências

- **Parte B — purga do cache pt-PT:** ainda parada na contagem, aguardando seu aval, como você definiu. A descrição do card do painel acima ainda mostra "SECÇÃO 1 — OS FACTOS" e "objecto": é o mesmo cache.
- Índice `pricing_config_active_unique` — nunca confirmado criado. Único item bloqueante da auditoria de fechamento.
- Diff consolidado do guia do News (pt-BR + `<hl>`) — aguarda aprovação, nada subiu ao KV.
- Veredito em inglês na página `/cinema` do módulo (seção 2).
- Mapa `classification → chave i18n` duplicado em 3 arquivos.
- `new_design/` inteiro está **fora do git**. Um `git clean` apaga a Design Law, os mockups e todos estes relatórios.
