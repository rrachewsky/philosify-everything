# Toggle de tema — Etapa 3 executada · deploy + capturas antes/depois · 17/09/2026

**OK do Bob (17/09):** aplicar o patch, build, deploy `--branch=production`, capturas antes/depois (1366×768, 820px,
380px: landing topo e rodapé; `/music` e `/community`), flex-wrap se o 820 apertasse, reportar deployment id.
**Sem commit até o aceite — nada commitado.** Working tree: 5 arquivos modificados (o patch + o flex-wrap).

## Resultado

| Item | Valor |
|---|---|
| Patch aplicado | `new_design/TOGGLE_TEMA_ETAPA3_DIFF_2026-09-17.patch` (5 arquivos) + ajuste flex-wrap (abaixo) |
| Build | ok (29s e 17s); bundle `index-CLNTEDFY.js`, CSS `Button-O8VEPvnc.css` sem `position:fixed` no `.themebar` |
| Deploy Pages Production | **`9f1b4bb6-e5ec-4dde-8713-decd4019e456`** (base `0661fc3` + working tree) · https://9f1b4bb6.philosify-frontend.pages.dev |
| philosify.org serve o bundle novo | sim — `index-CLNTEDFY.js` (curl com UA de navegador + DOM ao vivo no Chrome do Bob) |
| Produção, DOM (Bob logado, 1680×839) | `.themebar.inline` com `position:static`, pai `footer.landing`, x 1161–1326 na mesma linha do nav (nav y 715–727, toggle y 701–741); nenhum `fixed` na metade inferior além dos 2 cantos do HUD |

## Ajuste além do patch: flex-wrap no rodapé da landing (previsto no relatório do diff)

A captura de 820px "depois" (sem flex-wrap) mostrou exatamente o caso previsto: nav (591px) e toggle (165px) na mesma
linha com **0px de folga** — o toggle encostado no "© 2026" e os links "Ads Ateliê", "Comprar Créditos" e "© 2026"
quebrando em duas linhas internamente (`depois/820_landing_pagina_inteira.jpg`). Aplicado:

```css
.v2 footer.landing{…display:flex;flex-wrap:wrap;gap:16px 22px;justify-content:space-between;align-items:center;…}
```

Efeito (medido): em 820px os 7 links voltam a uma linha (12px de altura cada) e o toggle desce para a segunda linha,
alinhado à direita (`depois/820_landing_pagina_inteira_flexwrap.jpg`). Em 1366 nada muda (nav 636 + 22 + 165 < 984,
uma linha). No ≤640px o bloco mobile já sobrescreve `gap:16px` e `flex-direction:column`.

Nota de higiene: `git apply` gravou os 5 arquivos com CRLF (autocrlf); devolvi todos a LF (`sed 's/\r$//'`), como
estavam. O `git diff` é só o conteúdo (+23 −15).

## Capturas — `new_design/printscreen_toggle_2026-09-17/antes/` e `depois/`

Build de produção servido em `localhost:4173`, viewports emulados (chrome-devtools), PT, deslogado — mesmo método
nos dois lados. "Antes" = `dist/` do deploy `d6873efd` (92d7aae); "depois" = build deste ciclo.

| Viewport | Antes | Depois | O que mudou |
|---|---|---|---|
| 1366×768 landing, página inteira | `antes/1366_landing_pagina_inteira.jpg` — pill flutuante sobre o card COMUNIDADE | `depois/1366_landing_pagina_inteira.jpg` — pill no rodapé, à direita, mesma linha dos links | toggle deixou de cobrir o card |
| 1366×768 landing, rodapé (viewport, rolado ao fim) | `antes/1366_landing_rodape.jpg` — pill sobre a linha de links | `depois/1366_landing_rodape.jpg` — links à esquerda, toggle à direita, nada sobreposto | idem |
| 820×700 (2 colunas), página inteira | `antes/820_landing_pagina_inteira.jpg` | `depois/820_landing_pagina_inteira.jpg` (apertado, 0px) → `depois/820_landing_pagina_inteira_flexwrap.jpg` (final) | toggle na 2ª linha do rodapé; ZONA INSEGURA livre |
| 380×740 mobile, página inteira | `antes/380_landing_pagina_inteira.jpg` | `depois/380_landing_pagina_inteira.jpg` — rodapé em coluna: 2 linhas de links, toggle como última linha, à esquerda, botões 44px | percurso de rolagem inteiro livre (antes cobria 6 cards + rodapé) |
| 380×740 mobile, rodapé (viewport) | (Etapa 1: `03_landing_mobile_380_sobre_rodape.jpg`) | `depois/380_landing_rodape.jpg` | idem |
| 1366 `/music` | `antes/1366_music_pagina_inteira.jpg` | `depois/1366_music_pagina_inteira.jpg` | **nada** — sem `.themebar`, rodapé philosify.org · Termos · Privacidade · Metodologia · © 2026 |
| 1366 `/community` | `antes/1366_community_pagina_inteira.jpg` | `depois/1366_community_pagina_inteira.jpg` | **nada** — sem `.themebar`, só cantos do HUD fixos |
| Produção 1680×839, Bob logado | (Etapa 1: `00_producao_landing_1680x839_…jpg`) | `depois/00_producao_1680x839_bob_logado.jpg` | toggle no rodapé, à direita |

Medidas "depois" por DOM: 1366 → toggle static x 1004–1169 (borda do footer 1175), nav 197–833, mesma linha;
820 → nav 32–668 linha 1, toggle 623–788 linha 2; 380 → footer `column`, nav 2 linhas (60px), toggle última linha
x 24–197, `margin-left:0`, botões 44×… px.

## Para o aceite do Bob

- philosify.org/ (deslogado e logado), rolar até o fim: BLACK/WHITE no rodapé, à direita no desktop, última linha no
  mobile; nada flutuando sobre cards. Trocar o tema continua funcionando (mesma `setTheme`).
- `/music`, `/community`: sem mudança.
- Após o aceite: `git add` dos 5 arquivos de código + relatórios/capturas do toggle → commit **"toggle de tema: inline
  no rodape da landing"** → push. Só com a ordem.

## Ajuste 2 (print do Bob, 17/09): rótulo do botão inativo

**Pedido:** inativo com `color:var(--dim)` (a cor dos links vizinhos do rodapé), `:hover` com `var(--ink)`, `.on`
como está; conferir o inverso no tema WHITE.

**Aplicado** em `site/src/styles/v2-components.css` (regra `.v2 .themebar button`): `--low` → `--dim`; nova regra
`.v2 .themebar button:hover{color:var(--ink)}`; `.on` intocado.

**Medido por DOM (build novo, `index-BPtGc341.js`):**

| Tema | Botão inativo | Cor computada | Link do rodapé ao lado | Botão ativo |
|---|---|---|---|---|
| BLACK | WHITE | `rgb(210,210,217)` (= `--ink-mid`) | `rgb(210,210,217)` — **idêntica** | BLACK `rgb(245,245,246)` + anel |
| WHITE | BLACK | `rgb(76,76,84)` | `rgb(76,76,84)` — **idêntica** | WHITE `rgb(10,10,12)` + anel |

Capturas: `depois/1366_rodape_tema_black_botao_dim.jpg` e `depois/1366_rodape_tema_white_botao_dim.jpg`.

**Redeploy:** Pages Production **`56caa79f-8a38-43d0-aab2-fcd5b9f211c3`** (substitui `9f1b4bb6`); philosify.org já
serve `index-BPtGc341.js`. Sem commit — aguarda o aceite do Bob; então commit único "toggle de tema: inline no rodape
da landing" com código + relatórios + capturas.
