# Composer do Coletivo — rodapé fixo do painel de discussão · PROPOSTA PARA OK · 15/09/2026

**Requisito definitivo do Bob (15/09):** textarea + contador 0/2000 + COMENTAR permanentemente visíveis na
discussão do Coletivo — qualquer janela, zoom, navegador, estado do textarea. Nunca atrás de scroll.
**Escopo:** só o composer (`AnalysisDiscussion`). Realtime aceito; Ágora/Underground/DM intocados.
**Estado:** commit do ciclo anterior feito (`8907601`, push em `redesign/v2`). **Nada deste diff aplicado.**

## 1. Evidência e diagnóstico

Prints A/B do Bob (Edge, mesma janela): A = composer inteiro; B = textarea maior, painel corta abaixo dele,
contador e botão fora, sem scroll que os alcance. A variável é a altura do textarea (grip nativo `resize:vertical`
ou espaço concedido pelo layout).

Por que acontece (código atual, `community-panels.css:700-744`):
- `.analysis-discussion` é coluna flex com `overflow:hidden` — o que não cabe é **cortado**, não rolado.
- `.analysis-discussion__input` não tem `flex-shrink:0`, não é coluna flex, e o textarea tem `resize:vertical`
  **sem `max-height`**: arrastado (ou crescido), ele estica o composer; o excedente sai pelo fundo do painel e o
  `overflow:hidden` come contador + botão. Nada no composer reserva a linha do rodapé.
- A lista (`__comments`) tem `min-height:12.5rem` (piso de 14/09) — em painel curto ela **compete** com o
  composer em vez de ceder.
- O card da análise (`__summary`) é rígido (`min-height:auto`): nunca cede.

Fatos da shell que decidem o encaixe no viewport: `.hdr` é `position:fixed` e `.page` já leva
`padding-top = var(--hdrh)+30px`; `.page:has(> .pg-community)` é coluna `min-height:100dvh` (border-box,
padding-bottom 24) e `.panelhost` é `flex:1 1 0px`. Logo o painel **cabe dentro do primeiro viewport** — o que
sobra para ele é `100dvh − (136 header + título/ticker + 22 + abas + 16 + 24)`. O footer da página vem depois e
não interfere. `box-sizing:border-box` é global (`base.css:14`); root font 16px.

## 2. Fix por natureza (não mais pisos)

Estrutura-alvo (exatamente a do requisito): coluna flex → header (`flex-shrink:0`) + card (o único que **cede**:
`flex:0 1 auto; min-height:56px; overflow-y:auto`) + LISTA (`flex:1 1 0px; min-height:0; overflow-y:auto` —
o único que rola por padrão) + COMPOSER (`flex-shrink:0`, coluna flex; dentro dele a linha contador+botão é
`flex-shrink:0`).

Como o composer nunca pode exceder o painel: `.analysis-discussion` vira **container de tamanho**
(`container-type:size`) e o textarea recebe `max-height:calc(100cqh − 230px)` — altura do painel menos tudo o
que é inegociável ao redor (header 50 + card mínimo 68 + chrome do composer 77 + linha "respondendo a" 30 =
225, com 5px de folga). Assim: header + card-mínimo + composer ≤ 100% do painel **em qualquer estado**, inclusive
com o grip arrastado ao máximo (o grip para no `max-height`). Fallback `max-height:40vh` para navegador sem
unidades de container (todos os atuais têm: Chrome/Edge 105+, Safari 16+, Firefox 110+).

Ordem de quem cede quando falta altura: lista (até 0) → card (até a linha do score, rola por dentro) → textarea
(até `min-height:72px`, ~2 linhas a 16px mobile / ~2,4 a 14px desktop, rola por dentro). Contador+botão nunca.

Piso do host com discussão aberta: `310px` = 230 + 72 + 8 (abaixo disso não existe layout que caiba, e a página
rola — só em viewports com menos de ~310px de sobra, isto é, janelas abaixo de ~620px de altura total).
Substitui o `max(600px,70vh)` de 14/09; o `70vh` não faz falta porque o painel é `flex:1` de uma coluna `100dvh`.

O chrome de 77px do composer já conta o botão a **44px** (regra `button{min-height:44px}` de `responsive.css:57-61`
em ≤560px — o hazard registrado); em desktop sobra folga.

## 3. Diff proposto (para OK — não aplicado)

### `site/src/styles/v2-pages/community-panels.css`

```diff
-.v2 .analysis-discussion{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
-.v2 .analysis-discussion__header{display:flex;align-items:center;gap:12px;padding:12px 16px;
- border-bottom:1px solid var(--line)}
+/* discussion thread — column: header + card + LIST (the only scroller) + COMPOSER
+   (fixed footer of the panel, never behind scroll — Bob's ruling 15 Sep).
+   container-type:size lets the textarea cap itself against the panel height
+   (cqh), so header + card-min + composer always fit inside the panel. */
+.v2 .analysis-discussion{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;
+ container-type:size}
+.v2 .analysis-discussion__header{flex-shrink:0;display:flex;align-items:center;gap:12px;
+ padding:12px 16px;border-bottom:1px solid var(--line)}
@@
-.v2 .analysis-discussion__summary{margin:12px 16px 0;border:1px solid var(--line);
- background:var(--bg-cell);padding:14px 16px}
+/* The analysis card is what yields on short panels: shrinks down to the
+   score/song row and scrolls inside. Never the composer. */
+.v2 .analysis-discussion__summary{flex:0 1 auto;min-height:56px;overflow-y:auto;
+ margin:12px 16px 0;border:1px solid var(--line);background:var(--bg-cell);padding:14px 16px}
@@
-/* The list never collapses below ~4 comments; the host floor for the
-   discussion (community.css) grows the panel and the page scrolls. */
-.v2 .analysis-discussion__comments{flex:1;min-height:12.5rem;overflow-y:auto;padding:10px 16px}
-.v2 .analysis-discussion__input{padding:12px 16px;border-top:1px solid var(--line)}
-.v2 .analysis-discussion__replying{display:flex;align-items:center;gap:6px;margin-bottom:8px;
- font:400 11px var(--f-ui);color:var(--ink-mid)}
+/* The list takes whatever is left and is the only element that scrolls. */
+.v2 .analysis-discussion__comments{flex:1 1 0px;min-height:0;overflow-y:auto;padding:10px 16px}
+/* Composer: incompressible footer of the panel. Column so the textarea can be
+   capped while the counter+button row keeps its full height. */
+.v2 .analysis-discussion__input{flex-shrink:0;display:flex;flex-direction:column;
+ padding:12px 16px;border-top:1px solid var(--line)}
+.v2 .analysis-discussion__replying{flex-shrink:0;display:flex;align-items:center;gap:6px;
+ margin-bottom:8px;font:400 11px var(--f-ui);color:var(--ink-mid)}
@@
 .v2 .analysis-discussion__textarea{width:100%;padding:10px 14px;background:var(--bg-inset);
  border:1px solid var(--line);border-radius:var(--radius-input);color:var(--ink-text);
- font:400 14px/1.5 var(--f-ui);resize:vertical;box-sizing:border-box}
+ font:400 14px/1.5 var(--f-ui);resize:vertical;box-sizing:border-box;flex-shrink:0;
+ /* ~2 lines minimum; grows (typing or resize grip) only up to what the panel
+    can hold with header + card-min + counter/button row reserved:
+    50 + 68 + 77 + 30 ("replying to" line) = 225 → 230px. Scrolls inside past that. */
+ min-height:72px;overflow-y:auto;
+ max-height:40vh;                    /* fallback: no container-query units */
+ max-height:calc(100cqh - 230px)}
@@
-.v2 .analysis-discussion__input-footer{display:flex;align-items:center;justify-content:space-between;
- margin-top:8px}
+.v2 .analysis-discussion__input-footer{flex-shrink:0;display:flex;align-items:center;
+ justify-content:space-between;margin-top:8px}
```

### `site/src/styles/v2-pages/community.css`

```diff
-/* Discussion open: floor = header + analysis card + 12.5rem list + composer,
-   so the list keeps ~4 comments and the composer stays inside the panel
-   (the page scrolls to it on short windows). */
-.v2 .pg-community .panelhost:has(> .analysis-discussion){min-height:max(600px,70vh)}
+/* Discussion open: the composer is the panel's fixed footer and the panel
+   fits the viewport (flex:1 of the 100dvh page column). The floor is the
+   smallest layout that still holds header + card-min + 2-line composer
+   (230 + 72 + 8); below it the page scrolls — only on windows shorter
+   than ~620px in total. */
+.v2 .pg-community .panelhost:has(> .analysis-discussion){min-height:310px}
@@
 @media (max-width:700px){
   .v2 .pg-community .panelhost{min-height:max(480px,76vh)}
-  .v2 .pg-community .panelhost:has(> .analysis-discussion){min-height:max(600px,76vh)}
+  .v2 .pg-community .panelhost:has(> .analysis-discussion){min-height:310px}
 }
```

Sem mudança de JSX (`rows={3}` continua como altura inicial; `resize:vertical` fica, agora limitado — se o Bob
preferir tirar o grip, é `resize:none` na mesma linha).

## 4. Onde as constantes podem estar erradas (e o que fazer)

As reservas (50 / 68 / 77 / 30 → 230; piso 310) foram derivadas do CSS, não medidas. Na aplicação, antes do
build, medir no DevTools o header, o card mínimo e o rodapé do composer a 100% e 125% de zoom e a 380px de largura;
se algum passar do reservado, subir os 230px/310px na mesma proporção. Errar para mais só custa lista; errar para
menos reabre o corte. O toast de erro (transitório, ~50px, entre card e lista) **não** está reservado: como é
irmão do card e da lista, quem paga por ele é a lista e depois o card, não o composer — a confirmar na medição
com um erro forçado; se cortar, reservar +50 no cap do textarea.

## 5. Teste (critério binário do Bob)

Edge e Chrome, redimensionando ao vivo de maximizado à menor janela utilizável; largura ~380px; zoom 100% e 125%;
grip do textarea arrastado ao máximo; com e sem "respondendo a"; textarea vazio e com 2000 caracteres.
**Reprovado se existir um estado em que COMENTAR não esteja visível sem scroll.** Screenshots: reduzido / médio /
maximizado × 2 navegadores + grip no máximo → `new_design/printscreen_composer_2026-09-15/`.
Regressão: Ágora / Pessoas / Underground (regra do host não muda para eles: `max(480px,70vh)`).

## 6. Sequência

1. ✔ commit `8907601` + push (ciclo anterior).
2. **este diff → OK do Bob.**
3. aplicar → medir constantes → build → `wrangler pages deploy dist --project-name=philosify-frontend
   --branch=production` → deployment id → aceite no Edge.
4. commit próprio: "composer do coletivo: rodapé fixo do painel, textarea limitado ao painel, card cede".
