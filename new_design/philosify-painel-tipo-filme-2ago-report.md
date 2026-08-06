# BUG — Painel de Filósofos trata filme como música

**Instrução:** 2 Ago · **Diagnóstico e auditoria:** 2 Ago
**Branch:** `redesign/v2` · **Nada foi corrigido nem purgado.** Este relatório é o que você pediu ver antes.

---

## 1. Diagnóstico — a causa exata

### O tipo NÃO se perde. O template o joga fora.

Rastreei o caminho inteiro e o `mediaType` chega íntegro até a última porta:

| Etapa | Arquivo | O que faz com o tipo |
|---|---|---|
| Frontend | `hooks/useCinemaSidebar.js:290` | envia `mediaType: 'cinema'`, com `artist = director`, `description = overview`, `categories = genres` |
| Validação | `philosopher-panel.js:84` | **rejeita** qualquer coisa fora de `music/literature/news/cinema` — não há default silencioso aqui |
| Chave de cache | `philosopher-panel.js:126` | inclui `${mediaType}` |
| Roteamento | `philosopher-panel.js:174` | `news` → template próprio; **todo o resto** → `buildPhilosopherPanelPrompt`, recebendo `mediaType` como parâmetro |
| **Template** | **`philosopher-panel-template.js:39-41`** | **descarta** |

O default silencioso está nestas três linhas:

```js
const isBook = mediaType === 'literature';
const workType = isBook ? 'book' : 'song';
const creatorLabel = isBook ? 'Author' : 'Artist';
```

É um **binário**: literatura → livro, **tudo o mais → música**. `cinema` cai no `else`.

### O que o modelo recebe quando o filme entra

A variável `workType` aparece **cerca de 15 vezes** no prompt. Um filme é apresentado assim:

```
"...a panel of distinguished philosophers analyzing a song"
═══ SONG TO ANALYZE ═══
Title: A Lista de Schindler
Artist: Steven Spielberg
(No lyrics available — analyze based on your knowledge of this song...)
═══ END SONG ═══

For songs:
  - How do the lyrics reflect or contradict their philosophical framework?
  ...
Evaluate the song's philosophical significance...
```

O diretor vira **"Artist"**. O filme vira **"SONG"**. E o modelo é instruído a analisar **letras**.

**Agrava:** o ramo `else` usa só `lyrics`. Os campos `description` (a sinopse) e `categories` (os gêneros) que o frontend envia corretamente para o cinema são **descartados**. O modelo fica sem nenhum metadado do filme *e* é informado de que aquilo é uma canção sem letra disponível.

**A ironia:** as linhas 185-190 do mesmo prompt trazem orientação específica para cinema — *"BIOGRAPHICAL VS. FICTIONAL FILMS"*, com Szpilman e "O Pianista" citados nominalmente. Alguém acrescentou nuances de cinema na cauda e nunca corrigiu o `workType` no topo. O prompt se contradiz: manda analisar uma canção e depois explica como julgar um filme biográfico.

O JSDoc do arquivo confessa (linha 17): `@param {'music'|'literature'} params.mediaType`. O template foi escrito para dois tipos. O cabeçalho diz "song, book, news, or film" — aspiração, não implementação.

### (c) É consistente

**100% dos painéis de cinema**, sempre, desde que o módulo existe. Não é intermitente e não depende de caminho: há um só caminho.

| Tipo | Rota do prompt | Correto? |
|---|---|---|
| Música | ramo `else` → "song" | ✅ é música mesmo |
| Literatura | ramo `isBook` → "book" | ✅ |
| Notícias | `buildNewsPanelPrompt` (arquivo próprio) | ✅ |
| **Cinema** | ramo `else` → **"song"** | ❌ |

A análise principal do filme está correta porque ela **não passa por aqui** — usa o pipeline de `cinema-analyze.js`, com prompt próprio. Só o painel compartilha o template binário.

---

## 2. Auditoria retroativa — só leitura, nada apagado

Varri os **215 registros do KV**: 55 painéis (`panel:<uuid>`) e 43 chaves de cache.

**Método.** Separei dois tipos de sinal, porque marcador musical num painel de filme pode ser legítimo — *Whiplash* é sobre um baterista, trilha sonora existe:

- **Estrutural** — o texto chama a obra de canção: *"esta canção"*, *"as letras"*, *"a melodia"*, *"this song"*, *"the lyrics"*. É a corrupção.
- **Incidental** — palavras de música que um filme pode usar legitimamente. Reportado, nunca presumido culpado.

### Resultado por tipo

| Tipo | Painéis | Com marcador estrutural | Só incidental |
|---|---|---|---|
| Música | 16 | 16 | 0 |
| **Cinema** | **21** | **10** | 0 |
| Notícias | 15 | 0 | 3 |
| Literatura | 3 | 0 | 1 |

Música com 16/16 é o controle: são canções, devem falar de canção. Notícias e Literatura estão **limpos** — confirmam que o defeito é exclusivo do cinema, como o código previa.

### Os painéis de cinema contaminados

Um dos 10 é **falso positivo** e o excluo: *The Odyssey* (en, `926fa212`) diz *"the civilization that first sang this song"* — refere-se ao épico homérico sendo cantado. Legítimo.

**Restam 9 contaminados de verdade:**

| # | Filme | Diretor | Idioma | Data | id | hits |
|---|---|---|---|---|---|---|
| 1 | O Agente Secreto | Kleber Mendonça Filho | pt | 19/03 | `fa71cd00` | 11 |
| 2 | Forrest Gump | — | pt | 12/04 | `e5acf8de` | 9 |
| 3 | The Super Mario Galaxy Movie | — | pt | 15/04 | `e73a57b7` | 9 |
| 4 | O Agente Secreto | Kleber Mendonça Filho | pt | 19/03 | `379b7866` | 8 |
| 5 | Matrix | Lana Wachowski | pt | 18/03 | `4b23c985` | 6 |
| 6 | **O Padrinho** | Francis Ford Coppola | pt | **02/08 — hoje** | `b563b7ba` | 5 |
| 7 | Música no Coração | Robert Wise | pt | 17/03 | `49d80c24` | 4 |
| 8 | Música no Coração | Robert Wise | pt | 17/03 | `dab2c7c9` | 3 |
| 9 | A Lista de Schindler | Steven Spielberg | pt | 17/03 | `7a41cba5` | 2 |

**Modelo:** o blob do painel guarda `id, mediaType, title, artist, philosophers, objectivist, analysis, lang, createdAt` — **não guarda o modelo usado**. Não posso reportar essa coluna sem inventá-la. Se quiser rastreabilidade de modelo nos painéis futuros, é um campo a acrescentar.

### As frases, para você julgar

```
O Agente Secreto  →  "Esta canção, 'O Agente Secreto', de Kleber Mendonça Filho, revela…"
Forrest Gump      →  "Ah, esta canção! Ela captura algo que sempre me fascinou…"
Matrix            →  "Esta canção 'Matrix', de Lana Wachowski, concretiza uma visão…"
O Padrinho        →  "…a comoção que esta música desperta; sua simplicidade é como uma equação…"
Música no Coração →  "Esta canção, ou melhor, este musical 'Música no Coração', concretiza…"
A Lista de Schindler → "…a música projeta um universo onde a virtude é punida e a sobrevivência…"
```

Duas coisas para reparar:

**O Padrinho é de hoje, 2 de agosto.** O defeito não é histórico — está gerando painéis errados agora.

**Em "Música no Coração" o modelo se corrigiu no meio da frase** — *"Esta canção, ou melhor, este musical"*. É a prova de que o prompt o empurrou para o erro e o conhecimento próprio dele o puxou de volta. Nos outros oito, não puxou.

**A Lista de Schindler é o mais grave filosoficamente:** o veredito julga "a música" por projetar um universo onde a virtude é punida. É um juízo objetivista aplicado a uma obra que o modelo foi levado a acreditar que era outra coisa.

### Os 12 painéis de cinema sem marcador

*O Náufrago, The Fountainhead (×2), Patton, O Pianista (×3), O Padrinho (17/03), 2001, Relatos Selvagens, A Lista de Schindler (19/03), The Odyssey.*

Amostrei três: leem-se corretamente — *"O filme Patton concretiza…"*, *"Esta obra, 2001: Odisseia no Espaço, de Stanley Kubrick…"*.

**Mas é preciso ser exato sobre o que isso significa:** os 21 foram gerados com o prompt errado, sem exceção — o caminho de código é incondicional. Os 12 estão limpos porque o modelo se recuperou por conhecimento próprio, **não porque receberam o contexto certo**. São limpos por sorte, não por desenho. A decisão de purgar só os 9 ou os 21 é sua; a diferença é 12 × 3 créditos de regeração contra o risco de manter painéis produzidos sob premissa falsa.

---

## 3. O que eu faria na correção — **não executado, aguardando você**

1. Trocar o binário por resolução explícita por tipo, com vocabulário próprio: filme → cinematografia, narrativa, direção, atuação; livro → prosa, tema; música → letra, melodia.
2. Usar `description` e `categories` no ramo de cinema — hoje o frontend os envia e o template os descarta.
3. `creatorLabel` correto: **Director** para filme, **Author** para livro, **Artist** para música.
4. **Falhar alto** se o tipo não resolver: recusar o painel e **liberar as 3 reservas de crédito**, em vez de assumir música. Hoje não há esse caminho porque o `else` engole tudo.
5. Corrigir o JSDoc, que documenta dois tipos para um template que atende quatro.

Não toquei em nada. Você pediu para ver o diagnóstico e a lista antes.

---

## 4. Decisões que preciso de você

1. **Purgar os 9 comprovados, ou os 21 de cinema?** (soft-delete, como na Joana — cuidado com a chave de cache: o idioma faz parte dela, então purgar `panel:<uuid>` sem purgar `panelcache:cinema:...` faria o cache antigo ressuscitar na próxima requisição. Purgo os dois lados do mesmo painel.)
2. **Autorizo seguir com a correção** da seção 3?
3. Acrescentar o campo `model` ao blob do painel, para a próxima auditoria ter rastreabilidade?

---

## 5. Pendências abertas

- **Parte B — purga do cache pt-PT:** ainda parada na contagem, aguardando aval. Independente desta.
- Índice `pricing_config_active_unique` — nunca confirmado criado.
- Diff consolidado do guia do News (pt-BR + `<hl>`) — aguarda aprovação.
- Veredito em inglês na página `/cinema` do módulo (relatório de idioma, 2 Ago).
- `new_design/` inteiro está **fora do git**.

---

## Apêndice — auditoria completa dos 55 painéis

Levantado em 2 Ago via `GET /api/panel/:id` sobre as 55 chaves `panel:<uuid>` do KV. Somente leitura.

`estrut.` = ocorrências de expressões que chamam a obra de canção ("esta canção", "as letras", "a melodia", "this song", "the lyrics"). `incid.` = palavras de música que podem ser legítimas.

### CINEMA — 21 painéis, 10 com marcador estrutural

| Obra | Autor/Diretor | Idioma | Data | estrut. | incid. | id |
|---|---|---|---|---|---|---|
| O Agente Secreto | Kleber Mendonça Filho | pt | 19/03 | **11** | 6 | `fa71cd00` |
| Forrest Gump | — | pt | 12/04 | **9** | 11 | `e5acf8de` |
| The Super Mario Galaxy Movie | — | pt | 15/04 | **9** | 5 | `e73a57b7` |
| O Agente Secreto | Kleber Mendonça Filho | pt | 19/03 | **8** | 7 | `379b7866` |
| Matrix | Lana Wachowski | pt | 18/03 | **6** | 6 | `4b23c985` |
| O Padrinho | Francis Ford Coppola | pt | 02/08 | **5** | 8 | `b563b7ba` |
| Música no Coração | Robert Wise | pt | 17/03 | **4** | 10 | `49d80c24` |
| Música no Coração | Robert Wise | pt | 17/03 | **3** | 5 | `dab2c7c9` |
| A Lista de Schindler | Steven Spielberg | pt | 17/03 | **2** | 2 | `7a41cba5` |
| The Odyssey | Christopher Nolan | en | 24/07 | **1** | 3 | `926fa212` |
| O Náufrago | Robert Zemeckis | pt | 17/03 | 0 | 0 | `122b14d4` |
| The Fountainhead | King Vidor | pt | 13/04 | 0 | 0 | `35c6f11e` |
| The Fountainhead | King Vidor | pt | 13/04 | 0 | 0 | `1e7b0979` |
| Patton | Franklin J. Schaffner | pt | 17/03 | 0 | 0 | `1bdd6741` |
| O Pianista | Roman Polanski | pt | 19/03 | 0 | 0 | `2e517a64` |
| O Pianista | Roman Polanski | pt | 19/03 | 0 | 0 | `6226f534` |
| O Padrinho | Francis Ford Coppola | pt | 17/03 | 0 | 0 | `95df2d25` |
| O Pianista | Roman Polanski | pt | 17/03 | 0 | 0 | `a03a59f4` |
| 2001: Odisseia no Espaço | Stanley Kubrick | pt | 18/03 | 0 | 0 | `a3bd8963` |
| Relatos Selvagens | Damián Szifron | pt | 17/03 | 0 | 0 | `a4d7cc94` |
| A Lista de Schindler | Steven Spielberg | pt | 19/03 | 0 | 0 | `c68dbffc` |

### MUSIC — 16 painéis, 16 com marcador estrutural

| Obra | Autor/Diretor | Idioma | Data | estrut. | incid. | id |
|---|---|---|---|---|---|---|
| Unjust War | Bob Rach, Lygia | en | 19/03 | **16** | 13 | `b0c19918` |
| My Way | Frank Sinatra | en | 24/07 | **15** | 19 | `b50f3a2c` |
| Eleanor Rigby | The Beatles | en | 21/03 | **14** | 15 | `49c8ee12` |
| The Fate of Ophelia | Taylor Swift | en | 19/03 | **13** | 11 | `46b0fc23` |
| Porto Alegre É Demais | Isabela Fogaça | pt | 21/04 | **13** | 16 | `6448265c` |
| Blank Slate | Bob Rach, Lygia | en | 19/03 | **13** | 11 | `af246cb9` |
| End of Beginning | Djo | en | 19/03 | **11** | 12 | `6b98ebd7` |
| Imagine | John Lennon | en | 24/07 | **10** | 8 | `726a37bd` |
| Heroine | Bob Rach, Lygia | en | 19/03 | **9** | 7 | `f0c23364` |
| Glass, Concrete & Stone | David Byrne | pt | 21/04 | **8** | 12 | `1dd166dd` |
| The Fate of Ophelia | Taylor Swift | pt | 30/07 | **6** | 11 | `11e005d0` |
| The Fate of Ophelia | Taylor Swift | pt | 31/07 | **6** | 10 | `b219b371` |
| I Just Might | Bruno Mars | pt | 21/07 | **6** | 7 | `c249aaad` |
| Wonderwall | Oasis | pt | 10/05 | **5** | 7 | `19f0d3c2` |
| Sei Que Tu Me Odeia | Anitta, Mc Danny, HITMAKER | pt | 19/03 | **5** | 6 | `704f0ce9` |
| We Will Rock You | Queen | pt | 29/03 | **4** | 4 | `08f6b283` |

### NEWS — 15 painéis, 0 com marcador estrutural

| Obra | Autor/Diretor | Idioma | Data | estrut. | incid. | id |
|---|---|---|---|---|---|---|
| Grupo de parlamentares lança Bancada da Esqu | InfoMoney | pt | 30/07 | 0 | 0 | `14e3997c` |
| Marco Bezzecchi crasht net zoals in Assen: M | Telegraaf | nl | 11/07 | 0 | 0 | `140e9397` |
| Estudante ganha celular após colegas e profe | G1 | pt | 20/03 | 0 | 0 | `54c4538c` |
| Cimeira: líderes europeus querem Trump a pro | Expresso | pt | 19/03 | 0 | 0 | `67052728` |
| Petrobras diz que importadores estão desvian | Folha de S.Paulo | pt | 19/03 | 0 | 0 | `68e20318` |
| PF intima amiga de Lulinha e mais 30 pessoas | InfoMoney | pt | 10/04 | 0 | 0 | `7789aa91` |
| Norman Finkelstein ecoa velhos estereótipos  | Folha de S.Paulo | pt | 11/06 | 0 | 0 | `7535f6b4` |
| Guerra no Irã: com vários líderes iranianos  | BBC | pt | 25/03 | 0 | 0 | `7b0de4ab` |
| Chefe do contraterrorismo dos EUA renuncia e | CNN Brasil | pt | 17/03 | 0 | 3 | `94890e3d` |
| Argentina: o polêmico decreto de Milei para  | BBC | pt | 31/07 | 0 | 0 | `9def0f74` |
| Quatro restaurantes e uma volta ao mundo sem | Estadão | pt | 31/07 | 0 | 0 | `a043a203` |
| Lula anuncia Dario Durigan como substituto d | Valor Econômico | pt | 19/03 | 0 | 7 | `a246c3ce` |
| Guerra no Irã pega fundos multimercados surf | InfoMoney | pt | 26/03 | 0 | 0 | `abe07cae` |
| Relação Brasil-EUA está "muito melhor" e côn | CNN Brasil | pt | 08/04 | 0 | 1 | `ac1786f5` |
| Nervous investors await Micron earnings as c | Reuters | en | 24/06 | 0 | 0 | `dac276d0` |

### LITERATURE — 3 painéis, 0 com marcador estrutural

| Obra | Autor/Diretor | Idioma | Data | estrut. | incid. | id |
|---|---|---|---|---|---|---|
| THE WIDOW | John Grisham | pt | 15/04 | 0 | 0 | `0b7bea25` |
| O grego, o frade e a heroína | Roberto Rachewsky | pt | 14/04 | 0 | 1 | `681088e9` |
| A revolta de Atlas | Ayn Rand | pt | 12/04 | 0 | 0 | `e0ec9f82` |

