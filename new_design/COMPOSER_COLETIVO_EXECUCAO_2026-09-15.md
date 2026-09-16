# Composer do Coletivo — execução, medidas e deploy · 15/09/2026

**Requisito (Bob, 15/09):** textarea + contador + COMENTAR permanentemente visíveis na discussão do Coletivo —
qualquer janela, zoom, navegador, estado do textarea. Critério binário. Grip: **manter `resize:vertical`
limitado pelo `max-height`** (decisão do Bob).
**Proposta aprovada:** `COMPOSER_COLETIVO_PROPOSTA_2026-09-15.md` (diff em `community-panels.css` + `community.css`).
**Estado:** aplicado, medido em produção, deployado. **Não commitado** (commit próprio após o aceite).

## 1. Deploy

| Item | Valor |
|---|---|
| Pages Production (final) | **`247c63f7-9efb-44e7-ac28-80997c1b05e1`** — `philosify.org` serve `index-BKaHppnG.css` + `CommunityPage--rE3KIak.css` + `index-BZSZXFlt.js` |
| Deploy intermediário | `8cf343eb-ea19-4d13-aa80-5808b38d9109` (mesma lógica; só o fundo do toast em overlay era `--bg-cell`, quase transparente — trocado por `--bg-inset`) |
| Worker | sem mudança (`ada20c36`, 14/09) |
| Commit-base | `8907601` (ciclo anterior, já no remoto) |

## 2. O que foi medido e o que mudou em relação ao diff aprovado

A proposta reservava **230px** ao redor do textarea e piso de **310px** no host, "a confirmar na medição".
Medido em produção (Chrome, 1680×839, conta do Bob, discussão "The Sound of Silence" do coletivo Simon & Garfunkel):

| Peça | Reservado na proposta | Medido | Nota |
|---|---|---|---|
| Header da discussão | 50 | **50** | ok |
| Card da análise (mínimo) | 68 (56 + 12 margem) | 76 no pior caso; **41** compacto | ver tier abaixo |
| Chrome do composer (padding 24 + borda 1 + margem 8 + botão) | 77 (botão 44) | 63 desktop (botão 30); 77 a ≤560px (botão 44) | ok, reserva pelo maior |
| Linha "respondendo a" + margem | 30 | **28** | ok |
| **Padding da lista** | 0 | **20** | `min-height:0` não elimina o padding (border-box) — **não estava na conta** |
| **Toast de erro + margens** | 0 | **51** | **não estava na conta** |

**Primeira rodada (230/310) reprovou no pior caso:** grip no máximo + "respondendo a" + toast → botão a 852px com o
painel terminando em 815 (**37px cortados**). Exatamente o tipo de estado que o critério binário pega.

**Correções aplicadas (além do diff aprovado — sinalizadas):**
1. **Toast vira overlay** (`position:absolute` sobre o topo do card, `z-index:2`, fundo `--bg-inset`): não ocupa
   fluxo, logo não pode empurrar nada. Retira 51px da conta.
2. **Reserva do textarea = 250px** (`max-height:calc(100cqh − 250px)`): 50 + 68 + 20 + 28 + 77 = 243 + folga.
3. **Card compacto por container query** (`@container (max-height:339px)`): em painel abaixo de ~340px o card
   perde vertente e escolas e fica só com a linha nota + música (**41–46px**). É o "colapsa" do item 3 do Bob,
   sem JS.
4. **Piso do host com discussão = 300px** (era 380 na segunda rodada, 310 na proposta): 50 + 46 + 20 + 28 + 77 +
   72 (textarea ~2 linhas) = 293.
5. **Compactação do chrome da página em viewport baixo** (`community.css`, `@media (max-height:720px)` +
   `.page:has(.analysis-discussion)`): título COMUNIDADE, trilho, ticker e subline somem, padding-top do `.page`
   cai de 30 para 10, margens do painel encolhem; **as abas ficam**. Só com a discussão aberta. Motivo: acima
   do painel há **308px** de chrome (header fixa 136 + título/ticker 84 + abas 36 + subline/margens) — sem isso, o
   botão ficava a 675px do topo em qualquer janela abaixo de ~712px e a página rolava. Com a compactação o topo
   do painel vai de 308 para **164px**. **Isto está fora do "exclusivamente o composer" do enunciado** — foi a
   única forma de cumprir o critério em janela reduzida; reverter é apagar um bloco de 8 linhas.

## 3. Medidas finais (código deployado, sem injeção; pior caso = grip no máximo + "respondendo a" + toast)

| Estado | Topo do painel | Painel | Card | Lista | Textarea (cap) | Fundo do botão | Fundo do painel | Botão visível |
|---|---|---|---|---|---|---|---|---|
| Maximizado 1680×839, limpo | 308 | 508 | 113 | 183/225 rola | 85 (255,5) | 802 | 815 | **sim** |
| Maximizado, grip no máximo | 308 | 508 | 105 | 20 | **256 = cap** | 802 | 815 | **sim** |
| Maximizado, pior caso | 308 | 508 | 76 | 20 | 206 | 802 | 815 | **sim** |
| Médio emulado 671 (≈ zoom 125% em 839), limpo, compactação | **164** | 483 | 113 | 158 rola | 85 | 634 | 647 | **sim** |
| Reduzido emulado 600, pior caso, compactação | 164 | 412 | 77 | 20 | 160 | 563 | 576 | **sim** |
| Reduzido emulado 500, pior caso, compactação | 164 | 312 | **41 compacto** | 50 | **72 = mínimo** | 463 | 476 | **sim** |
| Reduzido emulado 460, pior caso, compactação | 164 | **300 = piso** | 41 | 38 | 72 | 451 | 464 | **sim** |
| Largura 380 emulada (fonte 16px, botão 44px), 600 | 199 (abas em 2 linhas) | 377 | 63 | 20 | 125 | 563 | 576 | **sim** |
| Largura 380 emulada, 470, pior caso | 199 | 300 | 41 | 24 | 72 | 486 | 499 | dentro do painel; **página rola 16px** |

Limite físico: com a compactação, o composer cabe no primeiro ecrã para **viewport ≥ ~464px** de altura (164 +
300); a 380px de largura, **≥ ~500px** (as abas quebram em duas linhas). Abaixo disso a página rola e o painel
fica no piso de 300 — nesse piso o composer continua inteiro **dentro do painel** (nunca cortado), só não cabe
no ecrã junto com a header fixa de 106px.

**Ordem de quem cede, confirmada:** lista (183 → 20) → card (113 → 76 → 41) → textarea (256 → 72). Contador e botão:
30px em todos os estados; 44px na regra de toque.

## 4. Limitações honestas da medição

- A extensão **não redimensiona a janela maximizada** do Chrome (o `resize_window` retornou sucesso e a viewport
  seguiu 1680×839). Reduzido/médio foram **emulados** forçando a altura da coluna `.page` — fiel para o painel
  (ele é `flex:1` dessa coluna) — e a compactação de `max-height:720px` foi **injetada** nesses estados porque a
  media query real olha a viewport verdadeira. Largura 380 idem (largura do `.page` + regras mobile injetadas).
- **Edge não testado aqui** (sem extensão). Zoom 125% real não é acionável pela extensão; o equivalente
  geométrico (viewport 839/1,25 = 671) foi medido.
- Screenshots são todos do Chrome; a coluna "Edge" do roteiro fica para o aceite do Bob.
- O toast de erro foi **forçado por DOM** (div inserida), não por erro real do servidor.

## 5. Screenshots (`new_design/printscreen_composer_2026-09-15/`)

- `00_antes_do_ajuste_pior_caso_injetado_839.jpg` — primeira rodada (230/310), pior caso, ainda com o toast em fluxo
- `01_chrome_maximizado_1680x839_limpo.jpg`
- `02_chrome_maximizado_grip_no_maximo.jpg` — textarea no cap, lista cede, composer inteiro
- `03_chrome_medio_emulado_671_compactacao.jpg` — título/ticker/subline cedem, abas ficam
- `04_chrome_reduzido_emulado_500_pior_caso.jpg` — card compacto, toast em overlay, textarea a 2 linhas, botão inteiro

## 6. Aceite do Bob (critério binário) e commit

Roteiro: Edge e Chrome, redimensionar ao vivo de maximizado à menor janela utilizável; ~380px de largura; zoom 100 e
125%; grip arrastado ao máximo; com "respondendo a"; textarea com 2000 caracteres. Reprovado se existir estado com
COMENTAR fora do ecrã sem scroll (ressalva: viewport < ~464px de altura, ver §3).
Regressão: Ágora / Pessoas / Underground (host deles inalterado: `max(480px,70vh)`; a compactação só atua com
discussão aberta).

Staging do commit próprio (após o aceite):
```bash
git add site/src/styles/v2-pages/community-panels.css site/src/styles/v2-pages/community.css \
  new_design/COMPOSER_COLETIVO_PROPOSTA_2026-09-15.md new_design/COMPOSER_COLETIVO_EXECUCAO_2026-09-15.md \
  new_design/printscreen_composer_2026-09-15/
git commit -m "composer do coletivo: rodape fixo do painel, textarea limitado ao painel, card cede"
git push origin redesign/v2
```
(`git check-ignore` vazio para todos; sem atribuição de IA.)
