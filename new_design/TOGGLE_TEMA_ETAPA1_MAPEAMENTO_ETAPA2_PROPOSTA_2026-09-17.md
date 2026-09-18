# Toggle de tema (BLACK / WHITE) — Etapa 1 mapeamento · Etapa 2 proposta · 17/09/2026

**Requisito do Bob:** o toggle NUNCA pode cobrir conteúdo ou controles. **Etapa 1 somente leitura; Etapa 2 é proposta
para OK. Nada alterado, nada commitado.** Capturas em `new_design/printscreen_toggle_2026-09-17/`.

## ETAPA 1 — Mapeamento

### 1.1 Onde é renderizado

| Item | Localização |
|---|---|
| Componente | `site/src/components/v2/ThemeBar.jsx` (21 linhas): `<div class="themebar" role="group">` com dois `<button>` (Black / White), chama `setTheme()` de `site/src/utils/theme.js` |
| Montagem | **só na landing**: `site/src/pages/v2/LandingPage.jsx:105` (`<ThemeBar />` depois do `</div>` da `.page`, antes de `<V2ModalsHost />`) e `site/src/pages/V2Gallery.jsx:197` (galeria `/dev/v2`, existe só em DEV) |
| Persistência | `localStorage.philosify_theme`; aplica `body.t-white` + repinta o canvas; `initTheme()` no boot |
| CSS | `site/src/styles/v2-components.css:356-362` (base), `:373` (≤600px `bottom:12px`), `:385` (`bottom:calc(18px + safe-area-inset-bottom)`), `:420` (≤640px `padding:13px 18px` nos botões, alvo de toque) |

### 1.2 Como é posicionado

```
.v2 .themebar{position:fixed; bottom:18px; left:50%; transform:translateX(-50%); z-index:5; …}
```

Flutuante, **fixed, centrado horizontalmente, colado ao fundo do viewport**. Nada reserva espaço para ele: a `.page` da
landing não tem `padding-bottom` extra no desktop (no mobile ≤640px tem `padding-bottom:48px`, que só vale para o fim
do documento, não para o percurso da rolagem). Medidas: desktop 165×40px; mobile 173×58px (alvo de toque 44px+).

Consequência estrutural: **em qualquer viewport em que a landing precise rolar, a faixa dos últimos 58–70px do viewport
está permanentemente coberta pelo toggle durante a rolagem.** O que aparece sob ele depende só do tamanho da janela.

### 1.3 Em quais páginas aparece

Verificado em produção (Chrome do Bob, logado, `document.querySelector('.themebar')` em cada rota):

| Rota | `.themebar` no DOM | Elementos `position:fixed` na metade inferior |
|---|---|---|
| `/` (landing) | **sim** | themebar + os dois cantos do HUD (24×24px, decorativos) |
| `/music` (módulo) | não | só os dois cantos do HUD |
| `/community` (Coletivo) | não | só os cantos |
| `/methodology` | não | só os cantos |
| `/tos` | não | só os cantos |

**O toggle existe apenas na landing.** Nas páginas de módulo, no Coletivo (com ou sem discussão aberta — o componente
não está na árvore dessas rotas), em `/methodology` e `/tos` não há nada flutuante além dos cantos decorativos do HUD.
Se o Bob viu sobreposição em "outras páginas", o que cobre conteúdo lá não é este toggle; preciso de um print para
identificar (candidatos: player de áudio fixo, composer do Coletivo, ticker).

Nota: a landing é a rota `/` para TODOS, logado ou não (o build serve a mesma `LandingPage`); o toggle é, portanto, o
único ponto de troca de tema do site e fica visível antes do login.

### 1.4 Levantamento das sobreposições (medido por DOM: interseção do retângulo do toggle com cards e links)

Ambiente: build de produção (`dist/` do deploy `92d7aae`) servido local em `localhost:4173`, viewports emulados
(a janela de automação no Chrome do Bob não aceita redimensionar). Idioma PT, deslogado (landing como cartão de visita).

| Caso | Viewport | Colunas | O que o toggle cobre | Captura |
|---|---|---|---|---|
| A · produção, janela do Bob | 1680×839 (zoom 80%) | 3 | **nada** — a página cabe quase inteira (rolagem de 33px); o toggle fica abaixo do rodapé | `00_producao_landing_1680x839_bob_logado_sem_sobreposicao.jpg` |
| B · desktop laptop | 1366×768 (viewport 1348×708) | 3 | **card COMUNIDADE** ao carregar (40px de interseção, os 40px do toggle inteiros); rolando 80–120px, cobre **Privacidade · Metodologia** do rodapé (10–12px); só livre nos últimos 30px da rolagem | `01_landing_desktop_1366x768_scroll40_sobre_comunidade.jpg` |
| C · desktop estreito / tablet | 820×700 | 2 | ao carregar: IDEIAS e HISTÓRIA (29px); rolando: QUIZ + COMUNIDADE (40px); **ZONA INSEGURA inteira (40px) por 120px de rolagem** (y 200–280); depois Comprar Créditos · Termos · Privacidade (6px) | `04_landing_820_2colunas_sobre_zona_insegura.jpg` |
| D · mobile | 380×740 (DPR 2, touch) | 1 | percurso inteiro de 1017px de rolagem: NOTÍCIAS → IDEIAS → HISTÓRIA → QUIZ → COMUNIDADE → **ZONA INSEGURA** (y 720–900) → rodapé philosify.org · Ads Ateliê · Comprar Créditos (37px, quase o link inteiro) → Privacidade · Metodologia; só livre nos últimos ~60px | `02_landing_mobile_380_sobre_zona_insegura.jpg`, `03_landing_mobile_380_sobre_rodape.jpg` |

Leitura: **no desktop maximizado do Bob não há sobreposição; em qualquer janela menor (laptop 1366×768 sem
maximizar, DevTools aberto, tablet) e em todo mobile o toggle cobre cards e links do rodapé durante a rolagem** — o
caso "sobre ZONA INSEGURA" reproduz em 2 colunas (C) e no mobile (D). O rodapé é o mais atingido: a última linha de
links (Privacidade · Metodologia — o ponto de entrada da Metodologia recém-publicado) fica sob o toggle em B, C e D.

## ETAPA 2 — Proposta (para OK)

### Opções

| | Opção | Sobrepõe? | Acessível antes do login? | Custo | Contra |
|---|---|---|---|---|---|
| **(a)** | **Toggle inline no rodapé da landing**, na mesma linha de philosify.org · Ads Ateliê · … · Metodologia · © 2026 — deixa de ser `fixed`, vira um item do fluxo | **nunca** (está no fluxo, empurra em vez de cobrir) | **sim** (rodapé da landing é público) | 1 componente movido + ~6 linhas de CSS; `ThemeBar` ganha variante `inline` | perde a presença "sempre à mão"; o Bob precisa rolar até o rodapé para trocar — na landing isso é ≤1 tela no desktop e ~1000px no mobile |
| (b) | Toggle no menu da conta (header) | nunca | **não** — o menu da conta só existe logado; a landing deslogada (cartão de visita) perderia a troca de tema; exigiria um segundo ponto para visitantes | médio | duplica o controle (visitante vs logado) ou tira o tema do visitante |
| (c) | Manter flutuante, reservar espaço (`padding-bottom` ≈ 80px na `.page` + safe-area) | **continua cobrindo durante a rolagem** — o padding só garante que o FIM do documento não fique sob ele; no percurso (casos C e D) os cards continuam sendo cobertos | sim | 2 linhas de CSS | não cumpre o requisito "NUNCA cobre": um elemento `fixed` cobre por definição tudo que passa sob ele ao rolar |

### Recomendação: **(a) — rodapé inline**

É a única das três que satisfaz o requisito literalmente (nada `fixed` = nada coberto), mantém a troca de tema
acessível ao visitante deslogado, e a landing continua sendo a única página com o toggle (comportamento atual, agora
no fluxo). Forma proposta:

- `FooterV2` da landing recebe o `<ThemeBar variant="inline" />` como último item do `nav`, depois de "© 2026",
  separado por um gap maior (ou alinhado à direita no desktop via `margin-left:auto`, à esquerda no mobile onde o
  rodapé já vira coluna, `≤640px`).
- CSS: `.v2 .themebar.inline{position:static;transform:none;…}` (mesmo pill, mesmos botões, mesmo `.on`); as regras
  `fixed`/`bottom`/safe-area deixam de existir (a variante flutuante sai do CSS junto — não fica código morto).
- Remover o `<ThemeBar />` solto de `LandingPage.jsx:105`; `V2Gallery` (DEV) recebe a mesma variante.
- Mobile: o rodapé já é `flex-direction:column`; o toggle vira a última linha, alvo de toque 44px mantido pelo
  `padding:13px 18px` existente.

Se o Bob preferir o toggle "sempre à mão" (argumento a favor de manter flutuante), a única forma de não cobrir nada é
**(c) + esconder o toggle enquanto rola e reexibir só no fim do documento** — mais lógica e um comportamento que
aparece/some; não recomendo.

### Impacto

- Nenhuma mudança de comportamento do tema (mesma `setTheme`, mesmo `localStorage`).
- Nenhuma tradução nova (Black / White são rótulos fixos, como hoje).
- Apenas landing + galeria DEV; módulos, Coletivo, `/methodology`, `/tos` não são tocados.

## ETAPA 3 (após OK) — sem executar

diff (`ThemeBar.jsx`, `LandingPage.jsx`, `FooterV2`/landing, `v2-components.css`, `V2Gallery.jsx`) → build → deploy
`--branch=production` → capturas antes/depois em desktop 1366×768 e 380px: landing, `/music`, `/community` → aceite
do Bob. Babysteps; sem commit sem ordem.
