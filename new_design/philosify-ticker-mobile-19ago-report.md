# Ticker mobile — linha única em todas as alas (19 ago 2026)

**Status: DEPLOYADO em 20 ago 2026** (ordem de limpeza geral: rodada de testes
confirmada como não iniciada, deploys liberados). Commit `3938c56` + follow-up
de touch targets `2d27554`; Pages `4485a1f2`. Verificado no build de produção a
360px: linha de 11px, alvos de toque de 45px. O texto abaixo é o registro
original da proposta (19 ago), mantido como estava.

## 1. O bug (screenshot do Roberto)

Em viewport estreito, a linha do ticker sob o título da ala quebra: "TOP 50 >>>"
aparece numa linha e os itens noutra — em TODAS as alas. Um ticker é, por definição,
uma linha única que desliza.

## 2. Causa raiz — não era (só) o flex-wrap

Reproduzido em 360px no dev server local. Dois mecanismos, ambos no CSS
compartilhado, nenhum nos componentes das páginas:

1. **`responsive.css:56-63`** — regra global de touch target: em `max-width:560px`,
   `button, a { min-height: 44px }`. Os itens do feed do ticker são `<button
   class="bk-item">` (BreakingTicker: História, News) e `<a>` (kits `.t50`: Música,
   Cinema, Literatura). Cada item virava uma caixa de 44px de altura; o texto do
   feed ficava ~2 linhas abaixo (botões centralizam verticalmente) ou acima
   (âncoras) do rótulo, que continua com 10,5px. **Não é quebra de linha flex — é a
   mesma linha flex com 44px de altura e os textos desalinhados verticalmente.**
   É por isso que em Música o rótulo aparece "abaixo dos itens".
2. **`v2-components.css:381`** — em `max-width:640px`, `.v2 .tick{flex-wrap:wrap}`
   (grupo "module template rows wrap instead of overflowing") autorizava quebra real
   da linha do ticker.

## 3. O fix — um componente, um arquivo

Todas as alas usam o mesmo kit (`components/v2/Ticker.jsx` + `BreakingTicker.jsx`,
classes `.tick/.tkbody/.roll/.t50` em `v2-components.css`). Mudanças **apenas** em
`site/src/styles/v2-components.css`:

- `.v2 .tick` ganha `flex-wrap:nowrap` explícito (item 3 da ordem);
- `.v2 .tick .tkbody` ganha `white-space:nowrap; overflow:hidden` — o contrato de
  linha única vale também para os tickers estáticos (Ideas, Community, Quiz, Legal,
  UnsafeZone): conteúdo que não cabe é cortado, não quebrado (item 1);
- novo: `.v2 .tick a, .v2 .tick .bk-item { min-height: 0 }` — neutraliza a inflação
  de 44px do `responsive.css` só dentro do ticker (especificidade 0,2,1 vence a
  regra global 0,0,1 sem `!important`);
- removido `.v2 .tick{flex-wrap:wrap;row-gap:8px}` do bloco mobile de 640px
  (`.state/.audio/.actions` continuam quebrando como antes).

Rótulos (`.lbl`, `.brklabel`) já eram `flex:none` e as pistas (`.t50-run`,
`.rollin`) já eram `white-space:nowrap` — o item 2 da ordem já estava satisfeito.
Nenhuma outra mudança de layout.

## 4. Verificação (DevTools device mode, dev server local)

Feeds de Música/Cinema stubados no navegador (a API de produção rejeita origem
localhost); História usa i18n, sem stub. Medições via getBoundingClientRect:
rótulo e itens na MESMA linha, 11px de altura, em todos os casos.

| Página | 360px | 390px | Screenshot |
|---|---|---|---|
| Música | ✓ linha única | ✓ | `printscreen 02 ticker-mobile/music-360.png`, `music-390.png` |
| Cinema | ✓ linha única | ✓ | `cinema-360.png`, `cinema-390.png` |
| História | ✓ linha única | ✓ | `history-360.png`, `history-390.png` |
| Home deslogada | sem ticker (nada a quebrar) | ✓ | `home-loggedout-360.png`, `home-loggedout-390.png` |

Regressões checadas: Ideas em 360px = linha única cortada (contrato do ticker);
Música em desktop 1280px = idêntico ao anterior (11px, uma linha). News herda o
mesmo fix (`.bk-item` tinha a mesma inflação de 44px).

## 5. Deploy pendente (1 comando, quando a rodada permitir)

```bash
cd site && npm run build && wrangler pages deploy dist --project-name=philosify-frontend --branch=production
```

Commit local no `redesign/v2` (não pushado). Depois do deploy, conferir Música em
360px num aparelho real — o desalinhamento vertical de 44px só aparece com a regra
de touch target ativa (≤560px), que o DevTools emula fielmente, mas o aparelho é a
prova final.

## 6. Fora do escopo, registrado

- Os itens do ticker perdem o alvo de toque de 44px no mobile (voltam a ~11px de
  altura). É o estado desktop de sempre e é o que a ordem pede (linha única);
  se quiser alvo de 44px SEM inflar a linha, dá para fazer com `padding` +
  `margin` negativa nos itens — fica como decisão sua, não entrou no fix.
- `LegalPage` passa `stat={...}` ao `Ticker`, mas o componente ignora essa prop
  desde a decisão C.4 (30 jul) — o link "Privacy Policy →/Terms of Service →" do
  ticker do Legal nunca renderiza. Não toquei.
