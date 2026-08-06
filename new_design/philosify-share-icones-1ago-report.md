# SHARING — padronizar os ícones dos apps nos logos originais

**Instrução:** 1 Ago · **Execução:** 1 Ago
**Branch:** `redesign/v2` · **Commit:** `813f86e`
**Deploy:** Pages `9a47b5a5`

---

## 1. Diagnóstico — o problema não era o componente, era o CSS

Procurei implementações divergentes do botão de compartilhar e não encontrei nenhuma: **existe um único componente**, `site/src/components/sharing/ShareButton.jsx`, usado por todos os módulos — Music, News, Cinema, Literature, Community/Debates e o `/app` legado. Ele já aponta para os assets oficiais em `site/public/`:

```
/WhatsApp.svg          /telegram-logo.svg     /messenger-logo.svg
/whatsapp-business.png /wechat-logo.svg       /line-logo.svg
/kakaotalk-logo.svg    /viber-logo.svg        /copy-icon.svg
```

**A divergência estava na folha de estilo.** Quatro arquivos carregavam uma cópia byte-a-byte do mesmo bloco, e cada cópia fazia duas coisas com o logo:

```css
.v2 .pg-music .sharetray .share-button__icon-img{
  width:20px;height:20px;display:block;filter:grayscale(1)}   /* ← aqui */
```

`grayscale(1)` **remove a cor da marca**. É por isso que o mesmo arquivo `WhatsApp.svg` parecia um ícone desenhado no Music e o logo oficial no Debates: em Debates não havia cópia nenhuma — `ideas.css` só acrescenta `margin-top:16px` —, então o logo caía na regra base de `utilities.css`, que é a que respeita a marca.

**Resposta ao que você pediu para reportar: existiam 2 apresentações divergentes**, não cinco. Uma é a regra base (`utilities.css`, 48 px, redonda, sombra suave, cor original) — a do Debates. A outra é o override de 20 px em cinza, replicado em quatro arquivos.

### Fonte canônica (item 1)

| Camada | Arquivo | Papel |
|---|---|---|
| Assets oficiais | `site/public/*.svg` `.png` | os logos em si |
| Componente | `src/components/sharing/ShareButton.jsx` | já era único |
| **Estilo do logo** | **`src/styles/utilities.css` → `.share-button__icon-img`** | **a regra do Debates — agora a única** |

---

## 2. O que foi feito (itens 2, 3 e 4)

**Apagados** os quatro blocos duplicados — `v2-pages/music.css`, `news.css`, `cinema.css`, `literature.css` (8 linhas cada, 32 no total), mais os comentários de seção que sobraram dizendo "monochrome", que agora seriam mentira.

**Criado um bloco único** em `v2-components.css`, com a moldura da bandeja e a tipografia do rótulo — chrome v2, nada que toque o logo:

```css
.v2 .sharetray{border:1px solid var(--line);background:var(--bgcell);margin-top:14px}
.v2 .sharetray .share-button__container{align-items:flex-start;gap:14px;padding:18px 20px}
.v2 .sharetray .share-button__container p{...micro-caixa-alta...}
```

Repare no que **não** está ali: nenhuma regra de `width`, `height`, `border-radius`, `filter` ou borda de botão. Isso é deliberado — o logo desce da regra única de `utilities.css`, a mesma que o Debates sempre usou. Um lugar para mudar, como você pediu no item 3.

**Item 4 — uso correto dos assets.** Cor original preservada (o `grayscale` era exatamente a violação), proporção 1:1 nos 48 px originais, e a área de proteção mantida pelo `padding: 8px` do botão mais o `gap` da linha. A moldura de 1 px que os módulos desenhavam ao redor de cada logo saiu junto: encostava na marca.

---

## 3. Verificação em produção (item 5)

**Prova exaustiva no build.** Em todo o CSS publicado existe **uma única** regra para o logo, e ela não tem `grayscale`:

```
1  share-button__icon-img{width:48px;height:48px;border-radius:50%;
                          filter:drop-shadow(0 2px 8px rgba(0,0,0,.15))}
```

O `grayscale(1)` que sobrou no bundle está em `.collective-item__img` e `.collective-detail__artist-img` — capas de álbum no Collective, não logo de app. Correto manter.

**Prova ao vivo em philosify.org.** Medi o estilo computado do mesmo logo em dois contextos, na página real:

| Superfície | largura | raio | filtro |
|---|---|---|---|
| Debates — logos renderizados de verdade (9 ícones) | 47,99 px | 50 % | `drop-shadow(…)` |
| `/music` — sonda dentro de `.sharetray` | 47,99 px | 50 % | `drop-shadow(…)` |
| `/ideas` — sonda de controle | 47,99 px | 50 % | `drop-shadow(…)` |

Idênticos, incluindo a ausência de filtro de cor. Os nove logos renderizados no Debates conferidos um a um: `/WhatsApp.svg`, `/whatsapp-business.png`, `/telegram-logo.svg` … todos a 48 px, sem grayscale.

**Desktop e mobile:** a regra sobrevivente não tem media query e nenhum arquivo de módulo a sobrescreve mais — o mesmo logo, no mesmo tamanho, nos dois. A linha usa `flex-wrap`, então no celular ela quebra em mais linhas em vez de encolher o logo. Esse comportamento é o do Debates, que agora é o de todos.

### Superfícies padronizadas

| Superfície | Antes | Agora |
|---|---|---|
| Música | 20 px, cinza | oficial |
| Notícias | 20 px, cinza | oficial |
| Cinema | 20 px, cinza | oficial |
| Literatura | 20 px, cinza | oficial |
| Painel de filósofos (nos 4 módulos) | 20 px, cinza | oficial |
| Debates / Colóquio | **já era oficial** | inalterado (virou o padrão) |
| Community (DebatePanel) | já era oficial | inalterado |
| `/app` (v1 legado) | já era oficial | inalterado |

---

## 4. Duas coisas que preciso te dizer

**(a) Isto abre uma exceção na Design Law, e a exceção é sua.** A Law congelada é monocromática; o `grayscale(1)` era a aplicação literal dela aos logos de terceiros. Você determinou que o padrão é o Debates, que sempre exibiu as marcas coloridas — então o site inteiro passa a ter os logos dos apps em cor, como ilhas de cor num sistema monocromático. Não tratei como conflito a levantar porque você não escolheu entre duas leituras: apontou a superfície que já estava em produção e mandou padronizar por ela. Registro aqui para ficar explícito no histórico da Law, não para reabrir.

**(b) Duas superfícies da sua lista não têm botão de compartilhar nenhum.** O permalink da análise (`/a/:slug`) e a página nova do painel (`/panel/:id`) renderizam a análise e o CTA, mas nunca tiveram tray de compartilhamento — nem na v1. Não havia ícone divergente para padronizar ali. **Não adicionei**, porque criar um botão que não existe é funcionalidade nova, não padronização. Se quiser, é rápido: o componente e o tray já estão prontos, é plugar. Diz e eu faço.

---

## 5. Fechando pendências da instrução anterior

Enquanto verificava, consegui um debate e um painel reais e fechei as três provas que faltavam no relatório de cards OG.

**Debate** (`65ae019c…`), card em pt e en pelo mesmo link:

```
título  Nenhuma causa — nem mesmo o amor divino ou a verdade sagrada — … · Debates · Philosify
título  No cause—not even divine love or holy truth—ever justifies … · Debates · Philosify
```

**Painel** (`a043a203…`):

```
<html lang="pt">
título  Quatro restaurantes e uma volta ao mundo sem sair do balcão — Estadão · Painel de Filósofos · Philosify
desc    Friedrich Nietzsche, Frederick Douglass, Friedrich Hayek · SECÇÃO 1 — OS FACTOS …
imagem  https://philosify.org/brand/philosify-og-card.png
```

**`/panel/:id` renderizado:** abri em produção. Painel completo — cabeçalho com os três filósofos, as cinco seções, o CTA. A rota funciona.

**E uma resposta que você tinha pedido:** você perguntou se o pt-PT valia só para o News. **Não.** Repare na descrição do painel acima: "SECÇÃO", "OS FACTOS", "objecto", "gastronómica" — é pt-PT. O **painel de filósofos também gerava em pt-PT**. A correção de código já cobre isso (`philosopher-panel-template.js` foi uma das seis superfícies do commit `d85d07c`), então painéis novos saem em pt-BR. Esse aí é cache antigo — entra na mesma contagem de purga que continua pendente.

---

## 6. Pendências

- Índice `pricing_config_active_unique` — nunca confirmado criado. Único item bloqueante da auditoria de fechamento.
- Diff consolidado do guia do News (pt-BR + `<hl>`) — aguarda aprovação, nada subiu ao KV.
- Análises e painéis em cache gerados em pt-PT — SQL de contagem pronto, nunca rodado, nada purgado.
- Botão de compartilhar em `/a/:slug` e `/panel/:id` — aguarda sua decisão (seção 4b).
- `new_design/` inteiro está **fora do git**.
