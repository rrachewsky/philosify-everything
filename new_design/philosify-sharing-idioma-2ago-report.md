# SHARING — o que ainda quebra a regra de idioma

**Data:** 2 Ago · **Branch:** `redesign/v2`
**Regra de referência (sua):** *tudo que é compartilhado deve estar na língua escolhida pelo usuário.*

Este relatório é levantamento, não execução. Nada foi alterado para produzir estes achados.
O estado da Parte A (botão de compartilhar nos permalinks) está na seção 7.

---

## 0. Antes de tudo: qual usuário?

Um compartilhamento tem duas pessoas, e a regra lê diferente para cada uma.

| Leitura | O que significa | Custo |
|---|---|---|
| **A — quem compartilha** | o card e a página saem no idioma de quem mandou o link | quase tudo já funciona; faltam 4 pontas |
| **B — quem recebe** | o card e a página saem no idioma de quem abriu | exige camada de tradução que **não existe**; painéis custam 3 créditos por idioma |

Isso não é preciosismo meu: as duas leituras levam a trabalhos de tamanho completamente diferente, e a lista de defeitos muda conforme a resposta. Separei os achados por leitura.

**Recomendo a leitura A** como regra vigente, com a B como meta declarada — porque a A é alcançável esta semana e a B depende de uma decisão de arquitetura e de custo por token que é sua, não minha. O motivo técnico está na seção 1.

---

## 1. A causa raiz: análises não têm tradução — têm cópias

O `CLAUDE.md` na raiz descreve uma tabela `translations` ("mesmos scores, traduz só o texto"). **Essa tabela não existe.** Varri as 40 tabelas que a API toca e todos os `.sql` do repositório: não há `translations` para análises. Os únicos `translations` no backend são uma coluna JSONB em `quiz_questions` e o `metadata.translations` dos debates.

O que existe de verdade: **uma linha por `(song_id, language, model)`**.

`api/src/handlers/analyze.js:162` — o `language` está *dentro* do filtro de cache:

```js
const analysisUrl = `${supabaseUrl}/rest/v1/analyses?song_id=eq.${songRecord.id}` +
  `&language=eq.${lang}&model=eq.${model}&status=eq.published&limit=1&select=*,metadata`;
```

Consequência direta: pedir a mesma música em outro idioma é **cache MISS → geração nova de IA → linha nova, id novo**. Não há tradução em lugar nenhum de `analyze.js` (zero ocorrências de `translat` no arquivo).

**O que isso implica para o link compartilhado:** um `/a/:slug` aponta para **uma linha**, que está em **um idioma**. Não há o que traduzir — só o que gerar de novo.

E é por isso que a leitura A já funciona quase toda: quem compartilha estava lendo a linha do próprio idioma, então o token aponta para a linha certa. O card sair "no idioma da análise" **é** sair no idioma de quem compartilhou.

O mesmo vale para painel, e pior: `philosopher-panel.js:126` põe o idioma na chave de cache —

```js
const cacheKey = `panelcache:${mediaType}:${title}:${artist}:${philosophers}:${lang}`;
```

— então um painel em outro idioma é **outro painel, com outro id e outro permalink, a 3 créditos**. Painel é um artefato monolíngue por construção.

Debate é a exceção: `forum_threads.metadata.translations.title[lang]` / `.content[lang]`. É a única entidade multilíngue do sistema.

---

## 2. Defeitos sob a leitura A (quem compartilha) — 4 pontas abertas

### A1. `/debate/:id?lang=xx` — a SPA joga o idioma fora · **o mais grave**

É o único caso em que o sistema **tem** a tradução, carrega o parâmetro no link, acerta o card… e perde tudo na porta.

`site/src/Router.jsx:105`:

```js
function DebateDeepLink() {
  const { debateId } = useParams();
  return <Navigate to={`/ideas?debate=${debateId}`} replace />;
}
```

O `?lang=` **não é repassado**. Prova em produção, mesmo debate, dois idiomas:

```
share-card/debate/65ae019c…?lang=fr → "Aucune cause, pas même l'amour divin…  · Débats"
share-card/debate/65ae019c…?lang=pt → "Nenhuma causa — nem mesmo o amor divino… · Debates"
```

O card obedece. A página abre no idioma que o visitante tiver salvo. Alguém compartilha em francês, o card chega em francês, o destinatário clica e cai em português. **Correção: uma linha.**

### A2. `PanelPermalink` não alinha o idioma da interface

`site/src/pages/v2/PanelPermalink.jsx:42` busca o painel sem idioma nenhum e nunca usa o `panel.lang` que vem no blob. O resultado é uma página misturada **sempre**: o texto do painel no idioma de geração, e a moldura (`t('philosopherPanel.button')`, o CTA, os rótulos) no idioma do visitante.

`SharedAnalysis.jsx:259` já tem o alinhamento; `PanelPermalink` nasceu sem. Correção: portar o mesmo bloco.

### A3. `SharedAnalysis` só alinha quem **nunca** escolheu idioma

`site/src/pages/SharedAnalysis.jsx:260`:

```js
const hasPreferred = !!localStorage.getItem('preferredLanguage');
if (!hasPreferred) { … await i18n.changeLanguage(analysisLang); }
```

Quem já escolheu um idioma alguma vez — ou seja, todo usuário recorrente — mantém a interface na língua dele e lê a análise na língua dela. É exatamente a página misturada que o comentário logo acima diz estar evitando.

Aqui a regra de decisão importa: sob a leitura A a interface deveria seguir a análise (o visitante está lendo *o conteúdo de outra pessoa*); sob a leitura B, o inverso. **É a única das quatro pontas que precisa da sua decisão antes de eu mexer** — as outras três são correção seja qual for a leitura.

### A4. Defeito de texto: a mensagem de análise anuncia um painel

`share.shareNewsText` está redigida como mensagem de painel:

```
pt: "📰 Confira o Painel dos Filósofos sobre: {{title}} | Philosify"
```

…e o `NewsPage.jsx:780` a usa para compartilhar a **análise** de notícia, não o painel. É a frase do link que você me mandou anteontem: *"📰 Confira o Painel dos Filósofos sobre: Análise | Inviável nas urnas…"* — era uma análise.

Evitei o problema no permalink (ver seção 7), mas o módulo News continua emitindo. Como é uma chave só, a correção limpa é **criar uma chave separada para análise de notícia nos 18 locales** — mudança de copy, portanto sua decisão, não minha.

---

## 3. Defeitos sob a leitura B (quem recebe) — os três acima, mais estes

### B1. O card ignora o idioma pedido em análise e painel · **provado em produção**

`handleShareCard` lê o `?lang=` (`share-preview.js:172`) e o entrega **só** ao `debateCard` (`:176`). `analysisCard` e `panelCard` não o recebem.

```
share-card/a/uWvB7ml5              → lang "pt"
share-card/a/uWvB7ml5?lang=fr      → lang "pt"   ← ignorado
share-card/a/uWvB7ml5?lang=en      → lang "pt"   ← ignorado
share-card/panel/a043a203…?lang=fr → lang "pt"   ← ignorado
share-card/debate/65ae019c…?lang=fr→ lang "fr"   ← obedece
```

Sob a leitura A isso é correto e o comentário do arquivo o defende explicitamente. Sob a B é defeito.

### B2. Nenhum link de análise ou painel carrega o idioma

São **20 construtores de URL de compartilhamento** no frontend. Só os 4 de debate carregam `?lang=`:

| Rota | Quantos pontos | Carrega `lang`? |
|---|---|---|
| `/a/:slug` e `/shared/:id` | 5 | **não** |
| `/panel/:id` | 11 | **não** |
| `/debate/:id` | 4 | **sim** |

O servidor também não: `api/src/sharing/index.js:92` devolve `${baseUrl}/a/${slug}` sem idioma.

### B3. As rotas de leitura não aceitam idioma

- `GET /api/shared/:slug` e `/shared/:uuid` (`api/index.js:2619`, `:2795`): nenhum `searchParams`, nenhum `Accept-Language`. Devolvem a linha como está.
- `getSharedAnalysis(env, slug, viewerUserId)` (`api/src/sharing/index.js:124`): a assinatura não tem idioma.
- `GET /api/panel/:id` (`api/index.js:3803`): devolve o blob do KV inteiro, sem olhar idioma.

### B4. E o custo, que é o ponto real

Para servir a leitura B em análises seria preciso **criar a camada que não existe** — traduzir e guardar o texto (há um `POST /api/translate` com Gemini que poderia ser reaproveitado) ou gerar de novo. Para painéis não há saída barata: **3 créditos por idioma**, id novo, permalink novo.

Ou seja: a leitura B não é uma correção, é uma funcionalidade nova com custo recorrente de token. Por isso a recomendação da seção 0.

---

## 4. Fora da regra de idioma, mas dentro do sharing

- **Cache pt-PT** (Parte B da sua instrução): o texto compartilhado sai em português de Portugal em registros antigos — "SECÇÃO", "OS FACTOS", "objecto". O código já emite pt-BR desde `d85d07c`; o cache não. Contagem ainda não rodada, aguarda seu aval. Isto é violação de idioma *dentro* do conteúdo, não do roteamento.
- **`/a/:slug` recompartilhado preserva o referral do primeiro divulgador.** Quem recebe e repassa está propagando o token do original — os créditos de indicação vão para quem compartilhou primeiro. É consequência de reusar o link em vez de cunhar outro (cunhar exige sessão, e o visitante em geral não tem). Não sei se é o que você quer; registro para você decidir.

---

## 5. Resumo em uma tabela

| # | Defeito | Leitura A | Leitura B | Custo |
|---|---|---|---|---|
| A1 | `/debate/:id` perde o `?lang=` na SPA | defeito | defeito | 1 linha |
| A2 | `PanelPermalink` não alinha idioma | defeito | defeito | ~10 linhas |
| A3 | `SharedAnalysis` só alinha quem nunca escolheu | **decisão sua** | **decisão sua** | ~5 linhas |
| A4 | `shareNewsText` anuncia painel numa análise | defeito | defeito | copy, 18 locales |
| B1 | card ignora `?lang=` em análise e painel | correto | defeito | médio |
| B2 | links de análise e painel sem `?lang=` | irrelevante | defeito | 16 pontos |
| B3 | rotas de leitura sem idioma | correto | defeito | médio |
| B4 | não há tradução de análise; painel custa 3 créditos | — | **arquitetura** | alto, recorrente |

---

## 6. O que eu faria, na ordem

1. **A1** — repassar o `?lang=` no `DebateDeepLink`. Uma linha, fecha o único caso em que o sistema já tem a tradução e a joga fora.
2. **A2** — alinhar o idioma no `PanelPermalink`, igual ao `SharedAnalysis`.
3. **A3** — depois de você me dizer se a interface segue o conteúdo ou o visitante.
4. **A4** — chave de copy separada, se você aprovar o texto.
5. **Parte B (pt-PT)** — a contagem, que já está autorizada a rodar como leitura.
6. **B1–B4** — só se você decidir pela leitura B, e aí como projeto, não como correção.

Nada disso foi executado. Aguardo.

---

## 7. Estado da Parte A (botão de compartilhar nos permalinks) — no ar

**Deploys:** Pages `351c19e0`, depois `f1c71f5c`.

Verificado em produção nas duas páginas: a bandeja aparece **depois do conteúdo e antes do CTA**, com os **9 logos oficiais** carregados, **48 px, raio 50 %, drop-shadow, sem grayscale** — a regra única de `utilities.css`, intacta (uma só ocorrência no CSS publicado). Componente existente, nenhum CSS por módulo.

Links gerados, capturados interceptando o `window.open` na página real:

```
/panel/a043a203…  → https://philosify.org/panel/a043a203-2aad-4e45-a705-f8a6b0f709e7
/a/uWvB7ml5       → https://philosify.org/a/uWvB7ml5
```

São as próprias rotas SPA v2, que o `_worker.js` já reescreve com as meta OG localizadas.

**Uma correção no meio do caminho:** o `/a/:slug` estava emitindo a frase de painel do A4. Troquei pelo texto padrão de análise do próprio componente — é o único que vale para música, notícia, cinema e livro na mesma rota. O bundle publicado confirma: `SharedAnalysis-B3iKVOpj.js` em produção não referencia mais `shareNewsText`.

A bandeja fica **aberta**, não sob um link "Share" como nos módulos: aqui não há `ActionsRow` para acioná-la, e o visitante que chegou pelo link é justamente quem precisa achá-la sem procurar.

---

## 8. Pendências herdadas, ainda abertas

- Índice `pricing_config_active_unique` — nunca confirmado criado. Único item bloqueante da auditoria de fechamento.
- Diff consolidado do guia do News (pt-BR + `<hl>`) — aguarda aprovação, nada subiu ao KV.
- Contagem pt-PT — não rodada.
- `new_design/` inteiro está **fora do git**. Um `git clean` apaga a Design Law, os mockups e todos estes relatórios.
