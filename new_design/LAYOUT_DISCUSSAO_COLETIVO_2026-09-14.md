# Coletivo — layout do painel de discussão (composer inacessível / 1/3 vazio) · 14/09

**Status:** OK do Bob (14/09) → diffs APLICADOS → build → deploy Pages **`79d904a0-c410-4823-bc45-ac58aabd1c47`**
(Production, branch production; `philosify.org` já serve `CommunityPage-C12l92h6.css` com as regras novas).
Aguardando aceite do Bob (Edge reduzido, Edge/Chrome maximizados, passada em Ágora/Pessoas/Underground). Sem commit
até o aceite.
**Sintoma (Bob, dois prints):** (a) Edge em janela reduzida: textarea aparece, mas COMENTAR + contador 0/2000 ficam
inacessíveis, sem scroll que alcance; (b) Chrome/Edge em janela grande: o painel termina no COMENTAR e sobra ~1/3 de
tela vazia abaixo, com a lista de comentários espremida (comentário cortado sob o composer).

## Causa (medida em produção, Chrome, viewport 1680×839)

| Elemento | Regra | Medida |
|---|---|---|
| `.panelhost` (host das 5 abas) | `height:min(70vh,760px)` — `site/src/styles/v2-pages/community.css:28-30` | 587px (70vh) |
| `.analysis-discussion__header` | fixo | 50px |
| `.analysis-discussion__summary` | fixo (card da análise) | 162px + 12px margem |
| `.analysis-discussion__input` (composer) | fixo | 155px |
| **overhead fixo** | | **379px** |
| `.analysis-discussion__comments` | `flex:1;overflow-y:auto` (`community-panels.css:721`) | **206px visíveis para 429px de conteúdo** |
| página abaixo do painel | `.pg-community{margin-bottom:70px}` + `.page{padding-bottom:60px}` | 259px de página vazia |

- **(a)** Em janela reduzida o painel fica em 70vh. Quando 70vh < 379px (viewport < ~542px), a lista vai a zero e o
  **composer ultrapassa o fundo do painel**, que tem `overflow:hidden` — nada rola até ele. Emulado com o painel a
  392px (o que 70vh dá num viewport de 560px): lista com 20px, composer 7px além do fundo do painel.
- **(b)** Em janela grande o painel está preso a `min(70vh,760px)`: num viewport de 1440px ele ocupa 760px e sobram
  ~380px vazios; a lista continua dividindo o painel com 379px de overhead fixo.
- O `useCollective`/`group_chat_messages` não entram aqui; a tela é `AnalysisDiscussion.jsx` dentro do
  `.panelhost` compartilhado (`CommunityPage.jsx:249`).

## Fix (princípio do Bob): painel em coluna flex ocupando a altura disponível; a lista cresce e rola; composer no rodapé

- A página da Comunidade vira coluna flex com `min-height:100dvh`; a seção `.pg-community` e o `.panelhost` recebem
  `flex:1 1 0px` → o painel **enche o viewport** em janela grande.
- Piso `min-height:max(480px,70vh)`: em laptop mantém exatamente os 587px de hoje; em janela reduzida o painel não
  encolhe abaixo de 480px, o composer fica **inteiro dentro do painel** e a página rola até ele (antes, o corte era
  interno ao `overflow:hidden`, sem scroll possível).
- `flex-basis:0px` (não `0%`) é o que impede o painel de crescer até o conteúdo das abas com listas longas
  (Ágora/Underground/Pessoas continuam rolando por dentro — verificado).
- `.analysis-discussion__comments{min-height:0}` explícito: a lista é quem rola.
- Escopo com `:has()` para não alterar as outras páginas v2 (`.page` continua bloco nelas). Suporte: Chrome/Edge 105+,
  Safari 15.4+, Firefox 121+.
- O host é compartilhado pelas 5 abas → a geometria muda para todas **apenas em janela grande** (enchem o viewport);
  no viewport real de laptop as medidas ficaram idênticas às de hoje (tabela abaixo). Ágora/Underground/DM: **nenhum
  arquivo de código tocado**, só o CSS do host.

### Diff — `site/src/styles/v2-pages/community.css`

```diff
-.v2 .pg-community{margin-top:22px;margin-bottom:70px}
+.v2 .pg-community{margin-top:22px;margin-bottom:0;flex:1 1 0px;display:flex;flex-direction:column}
+
+/* The community page is a viewport-tall flex column so the panel host can
+   grow to the space available (Bob's ruling, 14 Sep): big window = the
+   panel fills the viewport; small window = a 480px floor keeps the composer
+   whole and the page scrolls to it. Scoped with :has() so other v2 pages
+   keep their block layout. */
+.v2 .page:has(> .pg-community){display:flex;flex-direction:column;box-sizing:border-box;
+ min-height:100vh;min-height:100dvh;padding-bottom:24px}
@@
-.v2 .pg-community .panelhost{position:relative;display:flex;flex-direction:column;
- height:min(70vh,760px);margin-top:16px;border:1px solid var(--line);
- background:var(--bgcell);overflow:hidden}
+.v2 .pg-community .panelhost{position:relative;display:flex;flex-direction:column;
+ flex:1 1 0px;min-height:max(480px,70vh);margin-top:16px;border:1px solid var(--line);
+ background:var(--bgcell);overflow:hidden}
@@
 @media (max-width:700px){
-  .v2 .pg-community .panelhost{height:min(76vh,700px)}
+  .v2 .pg-community .panelhost{min-height:max(480px,76vh)}
 }
```

### Diff — `site/src/styles/v2-pages/community-panels.css`

```diff
-.v2 .analysis-discussion__comments{flex:1;overflow-y:auto;padding:10px 16px}
+.v2 .analysis-discussion__comments{flex:1;min-height:0;overflow-y:auto;padding:10px 16px}
```

## Medidas com o fix injetado na página (produção, sem deploy)

| Estado | Painel | Lista de comentários | Composer dentro do painel | Página |
|---|---|---|---|---|
| **Antes** viewport real 1680×839 | 587 | 206 visíveis / 429 (rola) | sim | 259px vazios abaixo |
| **Antes** reduzida (painel 392 = 70vh@560) | 392 | **20** / 429 | **não** (7px além do fundo) | — |
| **Depois** viewport real 1680×839 | 587 (igual) | 206 / 429 (rola) | sim | 157px abaixo (footer) |
| **Depois** janela grande (100dvh=1440 emulado) | **1109** | **728 / 728, sem scroll** | sim | 0 vazio; footer segue |
| **Depois** reduzida (100dvh=560 emulado) | **480** (piso) | 99 / 429 (rola) | **sim** | página rola até o composer |

Regressão nas outras abas com o fix (viewport real): Ágora 587 (scroller `chat-messages` 520/824), Mensagens 587,
Pessoas 587 (`people-panel` 585/3113), Underground 587 (`underground-posts` 414/3506) — idênticas a hoje.

## Screenshots (`new_design/printscreen_layout_discussao_2026-09-14/`)

1. `01_antes_viewport_real_1680x839.jpg` — hoje, discussão aberta.
2. `02_antes_reduzida_emulada_painel392.jpg` — reprodução do print do Edge: lista de 20px, composer cortado.
3. `03_depois_viewport_real_1680x839.jpg` — fix, viewport real (mesma altura de hoje).
4. `04_depois_reduzida_emulada_painel480.jpg` — fix, reduzida: 1º comentário inteiro + composer inteiro.

**Limitações honestas:** a extensão do Chrome **não conseguiu redimensionar a janela** (maximizada; `innerWidth`
ficou em 1680 em todas as tentativas). Os estados "reduzida" e "grande" foram **emulados** fixando a altura do painel
/ da página no valor que `70vh` / `100dvh` dariam naqueles viewports — a única regra dependente do viewport é essa,
então a reprodução é fiel em altura; **~380px de largura e Edge não foram testados aqui** → ficam para o aceite do Bob
no Edge reduzido, como combinado.

## Ajuste fino (OK do Bob, 14/09) — lista nunca abaixo de ~4 comentários

Queixa: no piso de 480px a lista ficava com 99px. Ajuste aplicado e deployado (**Pages
`1d15eafa-aba6-43e6-ab14-a802490dc685`**, junto com o fix do cache do Underground):
- `community-panels.css`: `.analysis-discussion__comments{min-height:12.5rem}` (era `0`).
- `community.css`: piso do host **quando a discussão está aberta** —
  `.panelhost:has(> .analysis-discussion){min-height:max(600px,70vh)}` (mobile ≤700px: `max(600px,76vh)`).
  600 = header 50 + card 174 + lista 200 (+20 de padding) + composer 155 (+ borda). Sem esse piso, o
  `min-height` da lista só faria o composer estourar o `overflow:hidden` do painel; com ele, o excedente cresce o
  painel e a **página** rola, como o Bob pediu.

Revalidação em produção (Chrome, fix já deployado; reduzida/grande emuladas pela altura, como antes):

| Estado | Painel | Lista | Composer dentro | Página rola |
|---|---|---|---|---|
| real 1680×839 | **600** (piso > 70vh=587) | **219** (200 + padding) / 531, rola | sim | sim (docH 1009) |
| reduzida emulada (100dvh=560, 70vh=392) | **600** | **219** / 531, rola | sim | sim |
| grande emulada (100dvh=1440) | 1109 | 728/728 sem scroll | sim | footer segue |

Screenshot: `05_depois_ajuste_piso600_reduzida_emulada.jpg`. (A análise de teste passou de 4 para 5 comentários — o
aceite do Bob no realtime deixou um.)

## Após OK
Aplicar os dois diffs → `npm run build` → `wrangler pages deploy dist --project-name=philosify-frontend
--branch=production` → aceite do Bob no Edge reduzido (COMENTAR e 0/2000 alcançáveis; lista rola; janela grande sem
o terço vazio) → commit "layout do coletivo: painel de discussão ocupa o viewport, lista rola, composer fixo".
