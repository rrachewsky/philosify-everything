# SHARING — card OG em inglês + rota compartilhada na UI antiga

**Instrução:** 31 Jul · **Execução e deploy:** 31 Jul · **Relatório:** 1 Ago
**Branch:** `redesign/v2` · **Commits:** `1c41fd5` (defeito 2), `1bc5c6c` + `4a69a16` (defeito 1)
**Deploys:** Pages `ed73ec5a` → `bd628a15` → **`dce52b91`** · Worker `a9dd4804`
**Verificado em produção com link real:** `https://philosify.org/a/uWvB7ml5`

---

## 1. Defeito 2 (prioridade máxima) — `/a/:id` servia a UI v1

### Diagnóstico: por que ficou em v1

A migração de 30 Jul trocou as **páginas de módulo** (`/music`, `/news`, `/cinema`, `/literature`, `/unsafe-zone`…) para os componentes v2 em `site/src/pages/v2/`. O permalink público não é uma página de módulo: é um componente separado, `site/src/pages/SharedAnalysis.jsx`, montado em duas rotas próprias:

```
site/src/Router.jsx:142   <Route path="/a/:slug"    element={<SharedAnalysis />} />
site/src/Router.jsx:143   <Route path="/shared/:id" element={<SharedAnalysis />} />
```

Como ele não estava na lista de páginas de módulo, ninguém tocou nele. Continuou renderizando o `ResultsContainer` v1, com `/logo.png` e o gradiente violeta. Ou seja: **não foi uma regressão, foi uma omissão de escopo** — a rota que é a porta de entrada de quem nunca viu o Philosify ficou sendo a única superfície pública ainda na marca antiga.

Agrava: essa rota é a **primeira** impressão de um visitante que chega por WhatsApp. Todas as outras superfícies v1 restantes só são vistas por quem já entrou.

### O que foi feito

`SharedAnalysis.jsx` foi reescrito para v2 preservando integralmente a lógica de acesso — token, expiração, teto de visualizações, tracking de referral. Só a camada de renderização mudou:

| Antes (v1) | Depois (v2) |
|---|---|
| `ResultsContainer` + `Header` v1 | `PageShell` |
| `/logo.png`, gradiente violeta | Lockup oficial, `--bg` monocromático |
| markup próprio | `pg-music` (pilha de veredito) ou `pg-news` (4 boxes) |
| CSS inline duplicado | as **mesmas** classes CSS das páginas de módulo |

Decisão deliberada: reusar `music.css` / `news.css` em vez de escrever estilo novo. Existe **uma** fonte de estilo — se a página de módulo mudar, o permalink acompanha sozinho, sem risco de divergir de novo.

Os estados de erro passaram a ser distintos: link **expirado** e link que **atingiu o teto de visualizações** têm cópia própria (antes eram a mesma mensagem genérica).

---

## 2. Defeito 1 — card OG em inglês

### Diagnóstico

philosify.org é Cloudflare **Pages** com `_redirects` `/* /index.html 200`. Todo caminho devolve o **mesmo `index.html` estático**, cujas metatags são fixas:

```html
site/index.html:34  <meta property="og:title" content="Philosify - Algorithmic Philosophical System…">
```

O crawler do WhatsApp/Telegram/Slack **não executa JavaScript**. Ele lê o HTML cru e vai embora. Então qualquer coisa que o React faça depois — inclusive trocar título por idioma — é invisível para ele. O card era o slogan genérico em inglês para toda análise, em todo idioma. Não havia nada a "consertar" no React: o problema é anterior ao React.

### Solução

Dois componentes, ambos novos:

**a) `GET /api/share-preview/a/:slug`** (`api/src/handlers/share-preview.js`) — somente leitura.

- Resolve o slug em `share_tokens` → `analysis_id`; aceita também UUID direto (para `/shared/:id`).
- **Nunca conta uma visualização.** Não passa pelo RPC `get_shared_analysis`, que incrementa o contador. Um link é pré-visualizado por WhatsApp, Telegram, Slack e todo crawler que o toca — contar isso queimaria o teto do link antes de um humano abrir. Lê a linha direto, nunca escreve.
- A descrição é o **texto da própria análise** (`metadata.the_facts` no News, senão `summary`/`philosophical_analysis`), já no idioma em que a análise foi gerada. Não há camada de tradução para divergir: análise em português → card em português, por construção.

**b) Pages Functions** `site/functions/a/[slug].js` e `site/functions/shared/[id].js`.

- Buscam o `index.html` via `env.ASSETS.fetch` e reescrevem com `HTMLRewriter`: `og:title`, `og:description`, `og:url`, o par `twitter:*`, `<meta name="description">`, `<title>` e o atributo `lang` do `<html>`.
- Interceptam **só** `/a/*` e `/shared/*`. Nenhuma outra rota muda de caminho.
- Se o preview falhar por qualquer motivo, devolvem o `index.html` intocado. Uma falha de card nunca custa a página ao visitante.
- O SPA continua bootando normal: é o mesmo documento, com as metatags trocadas na saída. Humano e crawler recebem um documento só.

**og:image:** `https://philosify.org/brand/philosify-og-card.png` — arquivo de 29 Jul, da **nova** identidade, presente em `public/brand/` e em `dist/brand/`. Confirmado. Não é o card antigo.

Cobertura de idiomas: o card sai no idioma da análise, seja qual for — não é uma tabela de 18 locales a manter, é o texto original. Isso cobre os 18 sem lista.

---

## 3. O defeito por trás do defeito — as Pages Functions nunca rodaram

Com o link real (`/a/uWvB7ml5`, análise do Estadão sobre Zema, em pt) a verificação mostrou que o card **continuava em inglês**, apesar do deploy. O endpoint de preview respondia certo:

```json
{"ok":true,"lang":"pt","title":"Análise | Inviável nas urnas, Zema disputa Planalto… — Estadão",
 "description":"O quê: O governador Romeu Zema foi confirmado como candidato…","classification":"news"}
```

Mas o HTML servido por philosify.org era o `index.html` cru, com o slogan em inglês. A Pages Function não estava sendo invocada.

**Causa:** existe `site/public/_worker.js` (de 23 Mar, o fallback de SPA). Esse arquivo coloca o projeto em **modo avançado** do Pages — e enquanto ele existe, **o Cloudflare ignora o diretório `functions/` inteiro**. As duas Functions foram compiladas, enviadas no bundle e nunca executadas. O deploy dizia "Success" o tempo todo.

Isto é exatamente o tipo de falha que um deploy verde esconde: nada quebra, o recurso simplesmente não existe.

**Correção** (commit `4a69a16`): a reescrita foi movida para dentro do `_worker.js`, antes do fallback de SPA, e o diretório `functions/` foi apagado — voltou a haver **um** ponto de entrada. O `_worker.js` ganhou o comentário explicando por que a lógica mora ali, para ninguém tentar "organizar" isso de volta em `functions/` no futuro.

Aproveitado no caminho: `setAttribute` do `HTMLRewriter` já escapa o valor, então o `escapeAttr` da versão anterior teria produzido `&amp;amp;` em títulos com `&`. Removido. E `twitter:url` foi incluído no mapa (tinha ficado de fora, apontando para a home).

---

## 4. Verificação em produção — link real, feita e passando

Deploy final: Pages `dce52b91`.

**Card OG** — `curl` com UA de crawler do Facebook em `https://philosify.org/a/uWvB7ml5`:

```
<html lang="pt">
<title>Análise | Inviável nas urnas, Zema disputa Planalto… — Estadão | Philosify</title>
og:type        article
og:url         https://philosify.org/a/uWvB7ml5
og:title       Análise | Inviável nas urnas, Zema disputa Planalto… — Estadão | Philosify
og:description O quê: O governador Romeu Zema foi confirmado como candidato do Partido Novo…
og:image       https://philosify.org/brand/philosify-og-card.png
twitter:*      idem
```

Título e descrição **em português**, tirados da própria análise. Era exatamente o defeito relatado.

**Controles** (para provar que nada mais mudou de caminho):
- `/news` → segue com o card genérico em inglês. ✅
- `/a/naoexiste123` → HTTP 200, página intacta, card genérico. Degrada sem quebrar e sem contar visualização. ✅

**Página renderizada** (aberta no navegador em produção): v2 completo. Os quatro boxes do News na ordem — **Os Fatos** com as seis perguntas rotuladas (O quê / Quem / Quando / Onde / Como / Por quê), **Análise da Fonte**, **Acertos, Erros e Omissões** com as três seções presentes, **Opinião do Philosify** —, prova do guia (`Guia 3.0 LITE` + SHA-256) e o CTA de conversão no rodapé. Nenhuma "Page not available": o conteúdo aparece inteiro. Sem gradiente violeta, sem `/logo.png`.

Isso também responde ao item 4 da sua instrução: **o "Page not available" do print não era a análise.** A análise carrega. Era o embed — ou o link de painel do item abaixo.

`max_views` é `NULL` por padrão (ilimitado), então a verificação não gastou cota do seu link.

---

## 5. Achado durante a verificação — permalink de PAINEL e de DEBATE está quebrado

A instrução mandava verificar **todos** os tipos de permalink, incluindo painel de filósofos. Verificando o código, achei um defeito **independente dos dois acima e não corrigido**:

O botão de compartilhar do painel e do debate não gera um permalink do site. Gera uma URL da **API**:

```
site/src/pages/v2/MusicPage.jsx:736       ${config.apiUrl}/api/share-preview/panel/${id}?lang=xx
site/src/pages/v2/NewsPage.jsx:854        (idem)
site/src/pages/v2/CinemaPage.jsx:624      (idem)
site/src/pages/v2/LiteraturePage.jsx:776  (idem)
site/src/pages/v2/ideas/DebateDetail.jsx:130       .../share-preview/debate/${id}
site/src/pages/v2/ideas/ColloquiumDetail.jsx:328   (idem)
+ 4 ocorrências nos sidebars v1 (music, cinema, literature)
```

Esse endpoint (`api/index.js:3856`) devolve uma página HTML de rodapé com as metatags e:

```html
<meta http-equiv="refresh" content="1;url=https://philosify.org">
```

Ou seja, quem clica no painel compartilhado: cai em `api.philosify.org`, vê um `<h1>` cru por um segundo, e é jogado na **home** — não no painel. **O conteúdo compartilhado é inalcançável.** O card aparece (as metatags estão lá, e essas já saem no idioma pedido), mas o link não leva a lugar nenhum.

Isso é candidato forte a ser a origem do "Page not available" do seu print — mais provável que o embed do Spotify.

**Não corrigi.** A correção exige criar rotas SPA de permalink para painel e debate (`/panel/:id`, `/debate/:id`) e apontar os 10 pontos de `shareUrl` para elas — é trabalho novo, fora do escopo dos dois defeitos que você mandou consertar. **Aguarda sua decisão.**

---

## 6. Estado e pendências

| Item | Estado |
|---|---|
| `/a/:slug` e `/shared/:id` em v2 | ✅ verificado em produção |
| Endpoint de preview sem contar visualização | ✅ verificado (Worker `a9dd4804`) |
| Reescrita OG executando de fato | ✅ verificado com link real (Pages `dce52b91`) |
| Card em português na análise em português | ✅ verificado |
| og:image na nova marca | ✅ confirmado |
| Conteúdo aparece (não era "Page not available") | ✅ verificado |
| Permalink de painel/debate leva à home | ⛔ **achado novo, não corrigido, aguarda decisão** |

**Pendências herdadas, sem relação com esta entrega e ainda abertas:**

- Índice `pricing_config_active_unique` — nunca confirmado criado. É o único item realmente bloqueante da auditoria de fechamento.
- Diff consolidado do guia do News (pt-BR + `<hl>`) — aguarda sua aprovação, nada subiu ao KV.
- Contagem de análises em cache geradas em pt-PT — SQL pronto, nunca rodado.
- `new_design/` inteiro está **fora do git**. Um `git clean` apaga a Design Law, os mockups e todos estes relatórios.
