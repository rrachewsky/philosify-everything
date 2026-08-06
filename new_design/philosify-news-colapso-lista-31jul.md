# News — colapsar a lista ao selecionar a manchete

**31 Jul 2026** · commit `e3ce434` · **frontend `f8e54f2d`**

---

## A causa da seleção que se desfazia

O defeito não era só de rolagem. A linha da manchete escolhida continuava sendo
um alvo vivo, e o clique nela **limpava a seleção**:

```jsx
onClick={() => { if (selected) { onClear(); } else { onSelect(article); } }}
```

Com a lista inteira ainda montada, alcançar os botões de análise exigia rolar de
volta por cima de todas as manchetes — inclusive a escolhida. **Um toque
impreciso durante essa rolagem chamava `onClear()` e desfazia a escolha em
silêncio.** No celular, onde o gesto de rolagem vira `click` com facilidade, isso
acontece sozinho.

---

## Comportamento novo

### Dois estados explícitos, nenhum derivado da rolagem

| Estado | O que aparece |
|---|---|
| **LISTA** | Todas as manchetes, nenhuma escolhida |
| **ESCOLHIDA** | Só a manchete escolhida, com o caminho de volta acima dela e os botões de análise logo abaixo |

A transição é de estado, não de posição de scroll. `selected` é a única fonte da
verdade; a lista completa deixa de ser renderizada quando há escolha — não é
ocultação por CSS, os nós saem da árvore.

### A escolha é de mão única

```jsx
// Choosing is one-way: a tap on the chosen headline no longer clears it.
if (selected) return;
```

Um toque na manchete escolhida **não faz mais nada**. Desmarcar só acontece pelo
controle explícito. Nenhum gesto durante a rolagem consegue desfazer a escolha.

> **Escolha que precisa do seu aval.** Você ofereceu duas saídas — botão de voltar
> **ou** clicar na manchete de novo. Implementei só o botão, e removi o clique de
> alternância: era ele o mecanismo do defeito. Manter as duas saídas reintroduziria
> a causa. Se preferir o clique de volta, ele volta — mas o defeito volta junto.

### O caminho de volta

Um botão acima da manchete escolhida, no registro de rótulo (Inter 500,
maiúsculas, `--ink-mid`, clareando no hover e no foco de teclado):

- **`← Outras manchetes`** — quando há resultados de busca para onde voltar
- **`← Trocar notícia`** — quando a escolha veio do ticker ou de um replay de
  histórico, sem lista por trás

**A busca é preservada.** `clearAll` derruba a seleção, o resultado da análise e o
replay — **nunca `searchResults`**. Voltar devolve a lista exatamente como estava.

### Sem rolagem para chegar aos botões

Ao escolher, o bloco se traz para o topo do viewport:

```js
pickedRef.current.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
```

`scroll-margin-top: 96px` no bloco impede que a manchete fique atrás da faixa de
marca, que é fixa. `prefers-reduced-motion` é respeitado — quem pede menos
movimento recebe salto instantâneo em vez de rolagem suave.

A pilha resultante é curta: campo de busca → contagem de resultados → botão de
volta → manchete → resumo → **ANALISAR NOTÍCIA / PAINEL DE FILÓSOFOS**.

### Mobile e desktop

O comportamento é o mesmo nos dois, e é a mesma árvore de DOM — não há caminho
separado por breakpoint, então não há divergência possível entre as duas.

| | Mobile | Desktop |
|---|---|---|
| Colapso da lista | idêntico | idêntico |
| Botão de volta | idêntico, alvo de toque de 10.5px em caixa alta com `letter-spacing` largo | idêntico, com `:focus-visible` para teclado |
| Rolagem automática | `block:'start'` + margem de 96px | igual |
| Toque na escolhida | inerte | inerte |

O ganho é maior no celular, onde a lista ocupava várias telas e o gesto de
rolagem era o próprio gatilho do defeito.

---

## Um defeito adicional que isto corrigiu

Havia **dois blocos** distintos: um para seleção vinda da lista e outro para
seleção vinda do ticker ou de um replay de histórico. O segundo **não tinha
caminho de volta nenhum** — só o clique que limpava tudo. Agora as três origens
caem no mesmo bloco, então o caminho de volta existe para todas.

---

## Fluxo preservado

| Item | Situação |
|---|---|
| Disparo da análise | Intocado — `handleScan` e o painel não foram tocados |
| Resume pós-compra | Volta à mesma manchete e agora **a traz para o viewport**, porque o efeito de rolagem observa a seleção, não a origem dela |
| Slot de anúncio | Intocado — a chave continua sendo `selected.url \|\| selected.title` |
| Timer ANALISANDO | Intocado |
| Busca ao voltar | Preservada |

---

## Verificação

| | |
|---|---|
| Lint de tokens | ✅ verde, 64 arquivos |
| ESLint em `NewsPage.jsx` | ✅ limpo, nenhum erro novo |
| Build | ✅ limpo |
| CSS no ar | ✅ `.backrow` e `.picked{scroll-margin-top:96px}` confirmados em `philosify.org/news` |
| Rótulos | ✅ 18 locales, com a seta espelhada para `ar`/`he`/`fa` — em RTL o retorno aponta para a direita |

### ✅ Comportamento verificado ponta a ponta em produção

Executado em `philosify.org/news`, com busca real ("inteligência artificial",
15 resultados das fontes do usuário):

| Passo | Resultado |
|---|---|
| Busca | 15 linhas renderizadas, nenhuma escolhida |
| Clicar na 3ª manchete | **15 linhas → 1.** Bloco `.picked` presente, uma única `.cell.row.sel`, e o título bate com o que foi clicado |
| Botão de volta | Presente, com o texto **"← Outras manchetes"** |
| Clicar em voltar | **1 → 15 linhas**, `.picked` some, e o campo de busca ainda contém `"inteligência artificial"` — **a busca sobreviveu** |
| Reescolher | 15 → 1 de novo |
| **Tocar na manchete já escolhida** | **Continua escolhida** — 1 linha, `.picked` presente. O defeito original não reproduz mais |

### Altura da pilha, medida

A aba de automação reporta `innerWidth: 0` e `visibilityState: hidden`, o que
inflava as medidas (um parágrafo de 300 caracteres quebrava em 47 linhas). Medi
clonando os elementos em contêineres de largura fixa:

| | Desktop (720px) | Mobile (390px) |
|---|---|---|
| Bloco da manchete escolhida (volta + célula) | 170px | 233px |
| Resumo do artigo | 71px | 107px |
| **Soma acima dos botões** | **241px** | **340px** |

Com o bloco alinhado logo abaixo da faixa de marca, os botões começam por volta
de **340px** no desktop e **440px** no celular — dentro de qualquer viewport de
uso real. Antes, estavam abaixo de quinze manchetes.

❓ **O que não pude medir diretamente:** a posição final na tela após a rolagem
automática. `scrollIntoView` não opera em aba oculta, e a aba de automação está
nesse estado. A pilha é curta o bastante para o resultado ser previsível, mas a
rolagem em si não foi observada.
