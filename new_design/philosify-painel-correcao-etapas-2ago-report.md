# Correção do painel de filósofos — diário de etapas

**Instrução:** 2 Ago (babysteps) · **Branch:** `redesign/v2`
**Base:** `philosify-painel-tipo-filme-2ago-report.md`

Regra em vigor: uma etapa por vez, parada e relatório ao fim de cada uma.
**Nada foi alterado, apagado, commitado nem deployado.**

---

## ETAPA 0 — Permalinks · CONCLUÍDA (só leitura)

### 0.1 Antes de tudo: a coluna `hits` não é acesso

A instrução lê a coluna `hits` do relatório anterior como indício de acesso externo. **Ela não é isso.** `hits` é a contagem de ocorrências do marcador linguístico no texto do painel — quantas vezes o texto chama o filme de canção. É medida de gravidade da contaminação, não de visitas.

Não distingue acesso externo de interno porque não mede acesso nenhum. No apêndice do relatório anterior as colunas estão nomeadas `estrut.` e `incid.` justamente por isso; no corpo eu escrevi "hits" e induzi a leitura errada. Corrigido aqui.

### 0.2 Os 21 têm permalink? Todos. E isso não é propriedade de cada um.

`/panel/:id` é rota **pública, sem autenticação**, e os painéis são gravados no KV **sem TTL** (`philosopher-panel.js:246` — *"user paid credits, analysis must be permanent"*).

Ou seja: **qualquer** `panel:<uuid>` que exista no KV é acessível por permalink neste momento, tenha alguém compartilhado ou não. Os 21 de cinema estão todos nessa condição. Não há um subconjunto "com permalink" e outro "sem".

A pergunta útil é outra: **alguém chegou a compartilhar algum deles?** Essa é que não tem resposta.

### 0.3 Não existe registro de compartilhamento de painel

O botão de compartilhar de painel **não cunha token**. Ele escreve a URL direta:

```
shareUrl={`${window.location.origin}/panel/${panel.id}`}
```

(`CinemaPage.jsx:623`, e igual em Music, News, Literature.)

Quando há `shareUrl` direto, o `ShareButton` devolve a URL e **não chama** `POST /api/share` (`ShareButton.jsx:15`). Logo não há linha em `share_tokens` — e nem poderia haver: `share_tokens.analysis_id` referencia `analyses`, e um id de painel não está lá.

**Consequência:** o sistema não guarda em lugar nenhum que um link de painel foi gerado ou entregue a alguém.

### 0.4 Não existe registro de acesso

- `GET /api/panel/:id` (`api/index.js:3645-3657`) é leitura pura do KV: sem contador, sem incremento, sem gravação de qualquer espécie.
- Não há coluna de visualização em `panel_analyses`.
- O worker **não tem** binding de Analytics Engine, nem `logpush`, nem `tail_consumers` (conferido em `api/wrangler.toml`).

Existe contagem de visualização no sistema, mas é de **análise compartilhada por token** (o RPC `get_shared_analysis`), caminho pelo qual painel não passa.

### 0.5 O único lugar onde um id de painel poderia estar registrado

Compartilhar por **DM**. O `ShareToDMButton` recebe o id do painel como `analysisId` (`CinemaPage.jsx:587`) e a modal envia uma mensagem `analysis_share` para a conversa, com esse id no corpo (`ShareAnalysisToDMModal.jsx:114` → `dmService.shareAnalysis`). A modal tenta antes `POST /api/share`; para um id de painel isso falha e o `shareSlug` fica nulo, **mas a mensagem é enviada assim mesmo**, com o id cru.

O `ShareToCommunityButton` **não** registra nada: ele só procura e abre o coletivo do artista, não posta a análise.

**Não consegui completar essa consulta.** A extensão do Chrome parou de responder depois de várias tentativas e não insisti. E há um limite que a consulta não resolveria de qualquer forma: pela sessão autenticada eu só enxergo as **suas** conversas — se outro usuário tivesse compartilhado um desses painéis por DM, isso não apareceria.

### 0.6 Conclusão da etapa

| Pergunta | Resposta |
|---|---|
| Quais dos 21 têm permalink? | **Todos os 21**, por construção da rota — não é distinção entre eles |
| Quais foram efetivamente compartilhados? | **Não é verificável.** Painel não cunha token e não deixa registro |
| Há registro de acesso externo? | **Não existe.** Rota de leitura pura, sem contador e sem analytics |
| `hits` distingue externo de interno? | Não mede acesso; é contagem de marcador de texto (ver 0.1) |
| Falta algo? | Mensagens de DM contendo id de painel — consulta não concluída, e ainda assim cobriria só a sua conta |

**Recomendação para a ETAPA 4, para sua decisão:** como não há como saber quais foram compartilhados, e como a única evidência possível é parcial por natureza, o caminho seguro é **preservar o `id` nos 21**, regerando no lugar em vez de apagar e recriar. Custa o mesmo (36 créditos), e elimina o risco de alguém com um link cair num 404. Apagar-e-recriar só seria defensável se déssemos por certo que nenhum foi compartilhado — e essa certeza não existe.

---

## Divergência encontrada — preciso te dizer antes de seguir

A regra 6 manda parar se algo não corresponder ao relatório. Isto não contradiz o relatório, mas apareceu agora e afeta a ETAPA 4.

**`panel_analyses` não aceita `cinema`.** `migrations/panel_history.sql:8`:

```sql
media_type TEXT NOT NULL CHECK (media_type IN ('music', 'literature', 'news')),
```

O handler grava nessa tabela **dentro de um `try` sem tratamento** (`philosopher-panel.js:252`), logo a rejeição do CHECK é engolida em silêncio. Se a constraint estiver mesmo assim no banco de produção, **nenhum painel de cinema jamais entrou no histórico do Supabase** — os 21 existem só no KV.

Indício quantitativo, não prova: o KV tem 55 painéis; o seu histórico devolveu 35 registros de painel. A diferença de 20 é próxima demais dos 21 de cinema para ser coincidência.

**Não confirmei** porque a consulta que faltou é a mesma que a extensão derrubou. Fica registrado como pendência de verificação, não como fato.

**Por que importa para a ETAPA 4:** se a regeração preservar o `id` (recomendação acima), nada muda — continuam só no KV, como já estão. Se fosse apagar e recriar, os painéis novos também não entrariam no histórico, pelo mesmo CHECK. E de todo modo isto é um bug próprio, fora do escopo desta instrução: `cinema` foi acrescentado ao produto e a constraint nunca foi atualizada. **Não toquei.**

---

## Aguardando

1. Aval para a **ETAPA 1** (correção do template).
2. Sua decisão sobre a mecânica da ETAPA 4 à luz de 0.6 — preservar o `id` nos 21, ou apagar e recriar.
3. Se quer que eu retome a consulta de DM e a confirmação da constraint quando o navegador voltar, ou se seguimos sem elas.

---

## ETAPA 1 — Correção do template · CONCLUÍDA

**Arquivo alterado:** `api/src/ai/prompts/philosopher-panel-template.js` — **único**.
`philosopher-panel.js` **não foi tocado** (validação, chave de cache e roteamento continuam como estavam).
**Sem commit, sem deploy.** `+125 / −39`.

### 1.1 Falha alta — o `else` não existe mais

O binário virou tabela explícita:

```js
const media = MEDIA[mediaType];
if (!media) throw new UnsupportedMediaTypeError(mediaType);
```

`MEDIA` tem `music`, `literature`, `cinema`. Não há ramo que absorva o resto.

**Por que um `throw` no template cumpre "liberar as 3 reservas":** conferi o caminho antes de escrever. O prompt é montado em `philosopher-panel.js:174`, dentro do `try` que começa em `:169` — depois da reserva dos créditos e **antes** de qualquer chamada de modelo. O `catch` em `:303` percorre `reservations` e chama `releaseReservation(..., "failed")` em todas. Então a exceção:

- devolve os 3 créditos,
- não gasta um único token de IA,
- responde `ANALYSIS_FAILED`.

Foi por isso que não precisei alterar o handler, como você determinou. A falha alta coube inteira no template.

**Provado localmente** (montagem de prompt, sem rede, sem IA, sem créditos):

```
mediaType="news"     → UnsupportedMediaTypeError (UNSUPPORTED_MEDIA_TYPE)
mediaType="podcast"  → UnsupportedMediaTypeError
mediaType=undefined  → UnsupportedMediaTypeError
mediaType=null       → UnsupportedMediaTypeError
mediaType=""         → UnsupportedMediaTypeError
```

Nenhum deles vira música. `news` lança aqui porque o roteamento correto o desvia antes (`:174`); se algum dia alguém quebrar esse desvio, o painel recusa em vez de mentir.

### 1.2 Vocabulário por tipo

| Tipo | `workType` | `creatorLabel` | Cabeçalho | Lente |
|---|---|---|---|---|
| `music` | song | Artist | `SONG` | letra, melodia, entrega |
| `literature` | book | Author | `BOOK` | tese, causalidade, prosa, tema |
| `cinema` | film | **Director** | `FILM` | narrativa, direção, cinematografia, montagem, atuação |
| `news` | — | — | — | rota própria, **não tocada** |

As ~15 ocorrências de `workType` no corpo do prompt continuam interpoladas — agora resolvem para `film` no cinema. Varri o arquivo: todo vocabulário musical restante está confinado ao bloco `music`, ao JSDoc, ao parâmetro `lyrics` e à instrução **negativa** do ramo de cinema.

Acrescentei ainda uma regra final explícita, que não existia:

```
- The work under analysis is a FILM. Refer to it as such throughout.
  Do not describe it using the vocabulary of another art form.
```

### 1.3 Sinopse e gêneros entram no prompt

O ramo antigo lia só `lyrics` e descartava `description` e `categories`. O ramo de cinema agora os usa, e diz ao modelo o que ele está lendo:

```
═══ FILM TO ANALYZE ═══
Title: A Lista de Schindler
Director: Steven Spielberg
Genres: Drama, História, Guerra
Synopsis: Um empresário alemão salva mais de mil judeus durante o Holocausto.
═══ END FILM ═══

IMPORTANT: This is a MOTION PICTURE, not a song and not a book. …
Never refer to it as a song, and never discuss "lyrics" — discuss scenes, shots,
performances and dramatic structure.
```

Esse bloco é a saída real do builder, montada localmente com a correção.

### 1.4 A cauda de cinema mudou de lugar

`BIOGRAPHICAL VS. FICTIONAL FILMS` estava no corpo compartilhado, chegando a painéis de música e de livro que não têm uso para ela. Passou para `MEDIA.cinema.extraGuidance` — só o painel de filme a recebe.

**Deixei onde estava** o bloco `THE ETHICS OF EMERGENCIES`, que cita "O Pianista". Ele não é instrução sobre cinema: é doutrina objetivista sobre emergências, ilustrada com um filme. Vale para qualquer mídia que trate de sobrevivência sob perseguição. Se você discordar, mudo.

### 1.5 JSDoc

`{'music'|'literature'}` → `{'music'|'literature'|'cinema'}`, com nota de que notícias têm builder próprio, `@throws` documentado, e `description`/`categories` redescritos como servindo livro **e** filme.

### Asserções locais — todas passaram

```
OK  cinema diz FILM TO ANALYZE          OK  cinema tem a cauda biográfico-vs-ficcional
OK  cinema diz "Director:"              OK  música NÃO tem essa cauda
OK  cinema NÃO diz "Artist:"            OK  livro NÃO tem essa cauda
OK  cinema NÃO diz "SONG TO ANALYZE"    OK  música continua SONG/Artist
OK  cinema traz a sinopse               OK  livro continua BOOK/Author
OK  cinema traz os gêneros              OK  cinema fecha com "The work under analysis is a FILM"
OK  cinema usa "film" no corpo
```

Isto é montagem de prompt, não geração. **A geração real de painel e a prova de devolução dos créditos ficam para a ETAPA 2**, como você definiu.

### Aguardando

Aval para a ETAPA 2. Nada deployado — a correção está só na árvore de trabalho.

---

## Ajuste ratificado da ETAPA 1

`THE ETHICS OF EMERGENCIES` permanece no corpo compartilhado, com a citação rotulada como ilustração externa:

```
Example (an OUTSIDE illustration, not the work under analysis): Władysław Szpilman,
as portrayed in the film "The Pianist", was in an EMERGENCY — the Holocaust. …
```

Em painel de música ou de livro, agora é impossível ler "O Pianista" como a obra em análise.

---

## ETAPA 2 — PARADA. Executei o que era possível; o resto está bloqueado.

### 2.1 — Prompt montado ✅ · Painel gerado ❌ (bloqueado)

**O prompt final, montado pelo template corrigido, com o guia real de produção** (20 446 caracteres, puxado do KV) e o payload que o `useCinemaSidebar.js` envia:

```
You are Philosify's Philosopher Panel — a panel of distinguished philosophers
analyzing a film through their unique philosophical lenses.
…
═══ FILM TO ANALYZE ═══
Title: A Lista de Schindler
Director: Steven Spielberg
Genres: Drama, História, Guerra
Synopsis: Na Polônia ocupada durante a Segunda Guerra Mundial, o industrial alemão
Oskar Schindler gradualmente se preocupa com sua força de trabalho judaica após
testemunhar a perseguição pelos nazistas.
═══ END FILM ═══

IMPORTANT: This is a MOTION PICTURE, not a song and not a book. …
Never refer to it as a song, and never discuss "lyrics" — discuss scenes, shots,
performances and dramatic structure.
…
  For films:
  - What would they say about the story the film tells and the values it dramatizes?
  - How do the direction, cinematography, editing and score serve — or undercut — that worldview?
  …
- The work under analysis is a FILM. Refer to it as such throughout.
  Do not describe it using the vocabulary of another art form.
```

Contagem no prompt de 32 939 caracteres: **`film` 17×**, `song` 2×, `lyric` 1× — e as três ocorrências de vocabulário musical são as instruções **negativas** ("not a song", "never discuss lyrics"). `Director:`, `Genres:` e `Synopsis:` presentes, como você pediu para ler.

**O painel gerado eu não consegui produzir.** Motivo, e não é escolha minha:

| Caminho | Por que não serve |
|---|---|
| Deploy do worker | **Proibido** pela regra 5 desta instrução |
| `wrangler dev` local | `api/.dev.vars` **não existe** nesta máquina — sem chaves de IA, sem Supabase |
| `wrangler dev --remote` | Rodaria o código local com os bindings de produção sem substituir o worker vivo, mas a requisição precisa de sessão autenticada, e o cookie de `philosify.org` não é enviado para uma origem `localhost` |
| Pedir suas chaves | **Proibido** pela regra permanente — nunca peço credencial no chat |

Não inventei o texto de um painel para preencher a lacuna. Um painel "gerado" por mim não seria prova de nada.

### 2.1 — a comparação com `7a41cba5`, até onde a evidência alcança

Puxei o painel corrompido inteiro (`7695` caracteres, 17/03, filósofos Leonard Peikoff, Sêneca e Sigmund Freud) e localizei exatamente onde a contaminação caiu. **Não é onde se esperaria.**

**O veredito, em si, não chama a obra de canção.** Ele diz *"obra"*, *"peça"*, *"A Lista de Schindler"*. Vocabulário limpo.

**A contaminação está nas seções dos filósofos — e é ela que sustenta o veredito:**

> **Peikoff:** "critico a ausência de um herói que triunfe pela integração racional de existência, razão e valores; em vez disso, **a música** projeta um universo onde a virtude é punida e a sobrevivência depende de concessões à irracionalidade coletiva. Esta obra serve como DIM **Misintegration (M)**…"

> **Freud:** "**A melodia melancólica**, com seu tom regressivo e repetitivo, é o equivalente sonoro dos sonhos como realização de desejos reprimidos…"

Duas coisas graves aqui:

1. **A classificação DIM "Misintegration" de Peikoff é justificada por uma frase sobre "a música".** O veredito então herda esse juízo: *"seu senso de vida é ambivalente, com triunfo pírrico que induz passividade cultural"*.
2. **A contribuição inteira de Freud analisa uma melodia que não foi dada a ele.** Não é o comentário sobre a trilha de John Williams — é o tratamento da obra como se seu meio primário fosse sonoro. Um dos três filósofos do painel produziu análise de um objeto inexistente.

**Resposta parcial à sua pergunta** — *o erro alterou o juízo filosófico ou só a nomenclatura?* A evidência disponível diz: **não foi só nomenclatura**. O vocabulário do veredito ficou limpo, mas as premissas de que ele deriva estão contaminadas, e um terço do painel analisou outra coisa. Se a **conclusão** muda — se o veredito corrigido ainda classificaria como Misintegration — isso só a geração corrigida responde. É exatamente o que ficou bloqueado.

### 2.2 — não é executável como especificado. É um achado, não uma falha de execução.

Reli a ordem do handler antes de tentar:

```
:64  auth → :72 rate limit → :78-89 VALIDAÇÃO → :98 filósofos → :129 cache → :150 RESERVA
```

**A validação vem antes da reserva.** E `:84` é uma lista branca estrita: `music | literature | news | cinema`. Os quatro estão tratados a jusante — `news` desviado em `:174`, os outros três em `MEDIA`.

**Consequência: nenhuma entrada que passe por `:84` pode falhar no template.** O `throw` da ETAPA 1.1 é **inalcançável pela superfície da API**.

Portanto, do seu roteiro de 2.2:

| O que você pediu | O que acontece de verdade |
|---|---|
| custo líquido ZERO | ✅ verdade — mas porque `:84` rejeita **antes** de reservar |
| "as 3 reservas com estado failed" | ❌ **impossível** — com tipo inválido não se cria reserva nenhuma |

Isso não significa que 1.1 esteja incompleta. Significa que ela é **defesa em profundidade**: a lista branca de `:84` é a primeira linha, o `throw` é a segunda, para o dia em que alguém acrescentar um tipo em `:84` e esquecer o `MEDIA`. Foi para isso que você a pediu — "conserta a classe do bug". Que ela seja hoje inalcançável é o estado saudável.

O disparo real com `mediaType:"podcast"` eu **não completei**: a extensão do Chrome parou de responder em duas tentativas e não insisti. Ele documentaria a rejeição em `:84`, não a ETAPA 1.1.

**Para provar 1.1 em execução real** só há um caminho: criar de propósito uma divergência entre `:84` e `MEDIA` — por exemplo remover `cinema` do `MEDIA` na árvore de trabalho, disparar um painel de cinema, observar as 3 reservas voltarem, e restaurar. Custo líquido zero, mas exige quebrar a correção de propósito e rodar contra créditos de produção. **Não fiz.** A regra 6 manda reportar divergência, não improvisar em cima dela.

---

## Aguardando — três decisões

1. **Deploy do worker para destravar a 2.1.** A mudança é retrocompatível: música e livro montam prompt idêntico ao de hoje (conferido nas asserções), notícias não passa pelo arquivo, cinema é o único que muda. Sem deploy, não há painel gerado.
   *Efeito colateral a considerar:* gerar o painel de Schindler cria um **22º painel de cinema no KV**, que entra na conciliação da ETAPA 4.
2. **Prova de 1.1 em execução:** autoriza a divergência controlada descrita acima, ou aceita a prova unitária (5 tipos, todos lançando `UNSUPPORTED_MEDIA_TYPE`) somada ao fato de o caminho ser inalcançável por desenho?
3. **`api/.dev.vars` não existe** nesta máquina. Se você quiser que eu consiga testar localmente daqui em diante, precisa criá-lo a partir de `.dev.vars.example` — **você**, não eu; eu não peço nem recebo chave no chat.

Nada deployado, nada commitado, nada apagado. A correção segue só na árvore de trabalho.

---

## ETAPA 2 (continuação) — deploy feito, geração NÃO confirmada. PARADO.

### Correção que você apontou — procede

O comentário do `build-schindler-prompt.mjs` dizia usar os filósofos de `7a41cba5` e a lista trazia Rand/Kant/Camus. O painel corrompido usou **Leonard Peikoff, Sêneca e Sigmund Freud** — eu mesmo tinha impresso isso. Script corrigido para os três certos, com nota no código explicando por que a identidade do painel importa: com filósofos diferentes, qualquer mudança de veredito poderia vir da troca, não da correção.

Prompt remontado e conferido: os três nomes presentes.

### Verificação de cache antes de disparar

A chave que a requisição geraria —
`panelcache:cinema:a lista de schindler:steven spielberg:leonard peikoff,seneca,sigmund freud:pt`
— **não existe** no KV. A única chave de Schindler em cache é de `ayn rand,immanuel kant,seneca`. Logo seria cache MISS e geração nova, a 3 créditos, como você previu. (Se existisse, a requisição teria devolvido o painel corrompido de graça e a etapa não provaria nada — por isso conferi antes.)

### Deploy

`api/src/ai/prompts/philosopher-panel-template.js` era o **único** arquivo não commitado em `api/`. Worker de produção: **`200b03f0-b6ac-4e4c-981c-534c13b76f94`**.

### A geração — disparada uma vez, resultado desconhecido

Disparei a requisição (cinema, A Lista de Schindler, Steven Spielberg, sinopse e gêneros, Peikoff/Sêneca/Freud, pt). A extensão do Chrome estourou o timeout de 45 s — esperado, porque a geração leva mais que isso — e em seguida a aba parou de responder de vez. Não consegui ler o resultado guardado em `window.__panelResult`.

**Não redisparei.** Um segundo disparo custaria mais 3 créditos e poderia gerar dois painéis.

**O que a evidência independente diz:** listei o KV de novo e comparei com a listagem de antes. 215 → 218 chaves. As três novas são:

```
ai_cap:c7ab2dcd…:2026-08-03           (contador diário, rotina)
sec_alert:daily:2026-08-03            (rotina)
panel:88764006-afd4-4b42-b5b5-468f14854751
panelcache:music:conselho:almir guineto:aristotle,arthur schopenhauer,auberon herbert:pt
```

Busquei o painel novo: é **de música** — "Conselho", de Almir Guineto, 18:03 de hoje. **Não é o meu.** É tráfego real da plataforma.

**Nenhum painel de cinema foi criado.** Não há `panel:` novo de cinema nem a chave `panelcache:cinema:a lista de schindler:…peikoff…`. Como o handler grava as duas chaves no mesmo `Promise.all`, a ausência das duas indica que a geração **não chegou a concluir**.

**O que eu não sei:** se a requisição chegou ao servidor e falhou (caso em que o `catch` de `:303` devolveu os 3 créditos), ou se nunca saiu da aba congelada. Não tenho como distinguir sem ler o saldo, e o navegador não responde.

### Um efeito colateral favorável, não planejado

O painel de música das 18:03 foi gerado **depois** do deploy, pelo template corrigido. Conferi: 8 158 caracteres, 8 marcadores de canção — correto, é música mesmo — e abre com *"Eis um samba que, sob sua alegria de superfície…"*.

É prova de produção, com tráfego real, de que a correção **não regrediu o caminho de música**. Era o risco principal do deploy.

### 2.2 — ENCERRADA conforme sua determinação

Aceita a prova unitária (`news`, `podcast`, `undefined`, `null`, `""` — todos lançando `UNSUPPORTED_MEDIA_TYPE`). Não quebrei a correção, não removi `cinema` do `MEDIA`, não disparei tipo inválido contra produção.

**Registro para constar:** o `throw` da 1.1 é **defesa em profundidade e hoje inalcançável pela API**, porque `philosopher-panel.js:84` valida contra lista branca estrita **antes** de `:150` reservar os créditos. Nenhuma entrada que passe por `:84` pode falhar no `MEDIA`. A guarda existe para o dia em que essas duas listas saírem de sincronia.

### Anotado para etapa futura — NÃO executado

Derivar a lista branca de `:84` das chaves de `MEDIA` (ou uma asserção que falhe se divergirem) eliminaria a classe inteira do bug. Exige tocar `philosopher-panel.js`, que segue fora de escopo. Fica como candidato.

### Preciso de você para destravar

O navegador é o único caminho para uma requisição autenticada, e está inutilizável há várias tentativas. Duas coisas:

1. **Confere seu saldo.** Se caiu 3 e não voltou, a requisição chegou e ficou pendurada — me diz e eu investigo o crédito antes de qualquer coisa. Se está intacto, a requisição não consumiu nada e podemos redisparar limpo.
2. **Recarrega ou fecha a aba travada** (`/history`) e me avisa. Aí redisparo a geração uma única vez.

Nada commitado. O deploy do worker foi o único ato irreversível desta etapa, e foi o que você autorizou.

---

## ETAPA 2 — CONCLUÍDA. Painel gerado e comparado. PARADO.

### Correção de método que você exigiu

Eu havia escrito que o painel "Conselho / Almir Guineto" era **"tráfego real da plataforma"**. Isso não estava apurado — pode ser você testando, e essa é a faixa demo do vídeo de Música. A formulação correta é: **gerado por uma sessão não identificada, depois do deploy**. A conclusão sobre música não ter regredido continua válida; a atribuição de origem é que era invenção minha. É o mesmo erro de `hits` → "acesso".

### Como o painel apareceu — a listagem do KV mentia

Sua leitura estava certa: a ausência das chaves não provava morte da requisição. Mas o KV também não a revelou depois. Reliste após reliste (12 sondagens ao longo de ~9 minutos): **nenhuma chave nova**. Só quando li o estado guardado na aba é que apareceu `status: 200`.

**A listagem `kv key list` é eventualmente consistente e ficou atrasada em relação à escrita.** Registro isso porque é armadilha para a ETAPA 4: não dá para usar a listagem como confirmação de gravação.

**Contabilidade dos créditos — sem cobrança dupla:**

```
saldo antes:   18   (7 comprados + 11 grátis)
saldo depois:  15   (7 comprados +  8 grátis)   → 3 créditos, uma só cobrança
resposta:      status 200, cached: false
```

`cached: false` prova que o **primeiro** disparo nunca chegou a gerar: se tivesse gerado, o segundo — payload idêntico — teria batido no cache de `:129` e voltado de graça. Exatamente a garantia que você desenhou.

### O painel novo — REGISTRAR PARA A ETAPA 4

> **`4f20208a-02cd-4e72-83e2-0a57bba66a2b`**
> **Painel de teste da ETAPA 2 — é o 22º painel de cinema no KV.**
> A Lista de Schindler · Steven Spielberg · Peikoff, Sêneca, Freud · pt · 04/08 · 9 526 caracteres.
> Gerado **já com a correção**. Na conciliação da ETAPA 4 ele **não** deve ser purgado — é a linha de base nova, não um contaminado.

**Marcadores de canção: 0.** Contra 2 no `7a41cba5`. E o texto passou a falar a língua do cinema: *filme* 6×, *Spielberg* 5×, *plano* 2×, *cena* 2×, *preto e branco* 2×.

### Comparação dirigida — `7a41cba5` (corrompido) × `4f20208a` (corrigido)

Mesmo filme, mesmo diretor, **mesmos três filósofos**, mesmo idioma. A única variável é o prompt.

#### a) Peikoff ainda classifica como DIM Misintegration?

**A classificação mudou de objeto.** Não de rótulo — de alvo.

| | Onde ele aplica *Misintegração* |
|---|---|
| Corrompido | **à obra**: "em vez disso, **a música** projeta um universo onde a virtude é punida… **Esta obra** serve como DIM Misintegration (M)" |
| Corrigido | **ao nazismo**: "O nazismo é *Misintegração* levada ao extremo: integração por meios irracionais — o coletivismo racial, a mística do sangue e do solo" |

No corrigido, a obra não é misintegrada — ela **retrata** a misintegração. E a avaliação estética inverte-se: "a menina de vermelho é uma *recriação seletiva* magistral: a abstração 'cada vida é um universo' tornada percepto".

#### b) Freud ainda analisa som?

**Não. Passou inteiramente para encenação e desempenho.**

| | O que Freud analisa |
|---|---|
| Corrompido | "**A melodia melancólica**, com seu tom regressivo e repetitivo, é o equivalente sonoro dos sonhos como realização de desejos reprimidos" |
| Corrigido | Göth atirando da sacada ("o *id* desregrado pelo poder absoluto"), a fixação por Helen Hirsch, a cena da menina de vermelho como "retorno do recalcado", o colapso final sobre o distintivo de ouro como "*superego* tornado tirano" |

Esta é a mudança mais limpa das três, e a mais diretamente atribuível: no painel corrompido Freud **não tinha material de filme nenhum** — nem sinopse, nem gêneros —, então analisou o único objeto que o prompt lhe ofereceu, uma melodia inexistente.

#### c) O veredito muda de conclusão ou só de fundamentação?

**Muda de conclusão. E não é sutil.**

| | Juízo final |
|---|---|
| Corrompido | "conteúdo misto… **falha em afirmar uma metafísica benevolente**: seu senso de vida é ambivalente, com triunfo pírrico que **induz passividade cultural**… promove resignação ao altruísmo e ao luto eterno, **minando a vida como fim-em-si**. Sobrevive como alerta, **mas não como combustível para o florescimento humano**" |
| Corrigido | "**obra grandiosa, e sua grandeza é, no fundo, uma grandeza *moral***"… "Salvá-los **não foi trair seu autointeresse; foi realizá-lo em sua forma mais alta**"… "Esteticamente, a obra é uma *recriação seletiva* **soberba**" |

A crítica não desapareceu — ela **encolheu de alvo**. No corrompido, o altruísmo contamina a obra inteira. No corrigido, restringe-se a **uma cena**: "Onde o filme tropeça é no dilaceramento final… Cena poderosíssima, e filosoficamente venenosa". O resto é celebrado.

E aparece um argumento que o corrompido não tinha: o corrigido invoca a distinção biográfico-versus-ficcional — "Por documentar o que realmente aconteceu a pessoas reais, o filme não deve ser cobrado por não idealizar". É a cauda que a ETAPA 1.4 moveu para o ramo de cinema, funcionando.

**Você mandou não fabricar diferença onde não houvesse. Não fabriquei — mas devo o contra-argumento:** isto é **uma** amostra. Geração de LLM é estocástica; duas execuções do mesmo prompt divergem. Não posso atribuir 100% da mudança de veredito à correção com n=1.

O que **é** atribuível com segurança, porque decorre do que mudou no prompt e não de sorte amostral:

- **zero marcadores de canção** — o prompt agora proíbe explicitamente;
- **Freud analisando cenas** — antes ele não recebia material de filme algum;
- **sinopse e gêneros presentes** — mudança determinística, não estatística.

O deslocamento do veredito é **consistente** com a correção e **coerente** com as duas mudanças acima, mas para afirmá-lo como efeito isolado seria preciso repetir a geração. Não repeti: custaria mais 3 créditos e você não autorizou.

### 2.2 — encerrada conforme sua determinação

Prova unitária aceita. Não quebrei a correção, não removi `cinema` do `MEDIA`, não disparei tipo inválido contra produção. Registrado: o `throw` é defesa em profundidade, hoje **inalcançável pela API** porque `:84` valida contra lista branca **antes** de `:150` reservar.

### Anotado para etapa futura — não executado

Derivar a lista branca de `:84` das chaves de `MEDIA`, ou uma asserção que falhe se saírem de sincronia, elimina a classe inteira. Exige tocar `philosopher-panel.js`, fora de escopo.

### Estado

Deploy do worker `200b03f0` feito (autorizado). **Nada commitado. Nada apagado. Não segui para a ETAPA 3.**

---

# RESTRIÇÕES DURAS PARA A ETAPA 4

Registradas por determinação do Roberto ao fechar a ETAPA 2. Valem sobre qualquer coisa que eu venha a propor depois.

## R1 — A listagem do KV é eventualmente consistente e NÃO prova nada

Fato observado nesta etapa: **12 sondagens ao longo de ~9 minutos não mostraram nada, enquanto a escrita já tinha sido bem-sucedida.** O painel existia; a listagem não o via.

Isso corta para os dois lados, e **o segundo é o perigoso**:

- a listagem **não confirma que uma ESCRITA aconteceu**;
- a listagem **não confirma que um APAGAMENTO aconteceu**.

Um painel que *parece* purgado pode continuar vivo. Um painel que *parece* vivo pode já ter sumido.

**Regra operacional:** na ETAPA 4, **toda verificação é leitura por chave** — `wrangler kv key get <chave>` ou `GET /api/panel/:id`, um a um. **Nunca** diff de listagens.
**Proibido reportar resultado de purga a partir de diff de listagem.**

## R2 — O painel de teste sai da lista por id, nunca por atributo

`4f20208a-02cd-4e72-83e2-0a57bba66a2b` compartilha **título, diretor e idioma** com o corrompido `7a41cba5`. A única diferença é o conjunto de filósofos.

Qualquer filtro por título, por diretor, por "todos os painéis de cinema" ou por padrão de chave **apanharia o painel de teste junto** — e ele é a linha de base corrigida, gerado com 3 créditos.

**Regra operacional:** a lista-alvo da ETAPA 4 é composta de **21 ids literais, escritos à mão**. Sem casamento de padrão, sem "todo cinema", sem filtro de título. A exclusão do painel de teste é por ausência da lista, não por regra.

### Lista-alvo congelada — os 21 ids da ETAPA 4

Extraída da auditoria de 2 Ago, anterior à geração do painel de teste. Conferido: **`4f20208a` não está nela**.

| # | id | obra | estrut. |
|---|---|---|---|
| 1 | `fa71cd00-0f7d-4da5-a343-3aca1000c065` | O Agente Secreto | **11** |
| 2 | `e5acf8de-9066-42ae-b9f6-7b42c1607efd` | Forrest Gump | **9** |
| 3 | `e73a57b7-e0d8-4f4f-b250-ee39e5abf468` | The Super Mario Galaxy Movie | **9** |
| 4 | `379b7866-355f-46e4-abbb-67bafa0e6111` | O Agente Secreto | **8** |
| 5 | `4b23c985-0738-476c-bd8b-22246588a773` | Matrix | **6** |
| 6 | `b563b7ba-a59a-450f-a94b-4bd202ada892` | O Padrinho | **5** |
| 7 | `49d80c24-d59b-461c-9f62-f83a66bc90b1` | Música no Coração | **4** |
| 8 | `dab2c7c9-893f-4293-8925-5bb8c7354ce3` | Música no Coração | **3** |
| 9 | `7a41cba5-2965-4963-b78a-58a3227ebc5e` | A Lista de Schindler | **2** |
| 10 | `926fa212-2d82-488c-861b-1e0d9e50aafa` | The Odyssey | **1** |
| 11 | `122b14d4-01bd-4c9b-afb3-cd7ede0a2bd9` | O Náufrago | 0 |
| 12 | `35c6f11e-054a-42a7-9961-3629ade514c8` | The Fountainhead | 0 |
| 13 | `1e7b0979-4996-4066-97a0-c8e9f3ded177` | The Fountainhead | 0 |
| 14 | `1bdd6741-03c1-4c36-8b96-2ce6fa5da495` | Patton | 0 |
| 15 | `2e517a64-8f5d-4e6d-aa86-28c6e1b23537` | O Pianista | 0 |
| 16 | `6226f534-fca6-4443-9008-598e57622075` | O Pianista | 0 |
| 17 | `95df2d25-2d19-4001-9a51-89ff480b45f8` | O Padrinho | 0 |
| 18 | `a03a59f4-64bd-4aa4-ae40-2c54b54def3a` | O Pianista | 0 |
| 19 | `a3bd8963-57f3-43e0-abdb-0c7cf2bc343f` | 2001: Odisseia no Espaço | 0 |
| 20 | `a4d7cc94-f9a0-4bdc-9990-c21f6874c903` | Relatos Selvagens | 0 |
| 21 | `c68dbffc-9d92-4995-8ebd-2b60324ed48a` | A Lista de Schindler | 0 |

**Não incluir, em hipótese alguma:**

```
4f20208a-02cd-4e72-83e2-0a57bba66a2b   ← painel de teste da ETAPA 2, já corrigido
```

Cada um dos 21 tem **duas superfícies** a tratar (`panel:<uuid>` e a `panelcache:cinema:…` correspondente), sujeitas ao portão de confirmação da constraint de `panel_analyses` que a ETAPA 4 exige antes de qualquer ação.

## R3 — Sobre o n=1 da ETAPA 2

Fechado pelo Roberto, e ele tem razão: a cadeia causal é determinística, não estatística. Freud analisou uma melodia porque o prompt antigo lhe deu **zero metadados de filme** — é input faltante, não variância de amostragem. A classificação DIM de Peikoff estava predicada em "a música"; corrigida a premissa, ela recai sobre o nazismo. Um veredito erguido sobre premissas corrigidas divergir de um erguido sobre premissas falsas é a consequência esperada.

**Não haverá segunda geração.** Três créditos por tranquilidade não são evidência.

---

# MAPA DE SUPERFÍCIES DA ETAPA 4 — só leitura, nada apagado

## Anotações que você mandou fixar antes de travar a lista

**#10 `926fa212` (The Odyssey) — marcador 1 = FALSO POSITIVO CONHECIDO, não contaminação.**
A frase é *"the civilization that first sang this song"*, referindo-se ao épico homérico **sendo cantado**, não ao filme tratado como canção. Identificado e excluído dos 9 pela auditoria de 2 Ago. **Permanece nos 21** — o caminho de código era incondicional, então ele foi gerado sob o prompt errado como todos os outros. Mas a coluna de marcador está prestes a virar critério de conferência, e sem esta anotação alguém contaria **10 contaminados em vez de 9**.

**R2 estendido — o caso concreto dos três Schindler.**
`c68dbffc` é o **segundo** Schindler entre os 21. Somando `7a41cba5` e o painel-base da ETAPA 2 `4f20208a`, são **três painéis com mesmo título, mesmo diretor e mesmo idioma** — e um deles jamais pode ser tocado. Qualquer filtro por atributo apanharia os três. É por isso que a lista-alvo é de ids literais.

## Método — e por que ele não é opcional

A chave de `panelcache` guarda uma **cópia inteira do painel, inclusive o `id`**. Uma chave pode ter sido sobrescrita por geração posterior e pertencer hoje a outro painel. Então computei a chave a partir dos campos de cada painel (algoritmo idêntico ao de `philosopher-panel.js:123-126`) e **li cada chave individualmente** (`wrangler kv key get`, 21 leituras), comparando o `id` guardado. Nenhum diff de listagem — R1.

## O que a leitura revelou

| Situação | Quantos |
|---|---|
| chave existe e pertence ao painel | **9** |
| chave **não existe** — painel tem uma superfície só | **8** |
| chave existe mas pertence a **outro** painel | **4** |

### O achado que muda a mecânica

> **`7a41cba5` (Schindler corrompido) computa uma chave que hoje guarda `4f20208a` — o painel-base da ETAPA 2.**

Mesmo filme, mesmo diretor, mesmo idioma e **mesmo conjunto de filósofos** ⇒ mesma chave. A geração de teste de ontem a sobrescreveu. **Apagar "a chave de cache do 7a41cba5" apagaria a do painel corrigido.** Não é hipótese: é o estado atual do KV.

Os outros três desencontros são pares do mesmo filme com o mesmo conjunto de filósofos, em que a geração mais recente ficou com a chave: `379b7866`→`fa71cd00`, `35c6f11e`→`1e7b0979`, `a03a59f4`→`2e517a64`.

**Regra que decorre:** onde a chave pertence a outro painel, a ETAPA 4 trata **somente** `panel:<uuid>`. A chave é do dono, não do alvo.

## Tabela — 21 linhas, uma a uma, nunca por filme

| # | painel `panel:<uuid>` | obra | estrut. | 2ª superfície (`panelcache:`) | ação |
|---|---|---|---|---|---|
| 1 | `fa71cd00-0f7d-4da5-a343-3aca1000c065` | O Agente Secreto | **11** | existe e é dele | tratar **as duas** |
| 2 | `e5acf8de-9066-42ae-b9f6-7b42c1607efd` | Forrest Gump | **9** | existe e é dele | tratar **as duas** |
| 3 | `e73a57b7-e0d8-4f4f-b250-ee39e5abf468` | The Super Mario Galaxy Mov | **9** | existe e é dele | tratar **as duas** |
| 4 | `379b7866-355f-46e4-abbb-67bafa0e6111` | O Agente Secreto | **8** | existe mas é de `fa71cd00` | tratar **só o painel** — NÃO tocar a chave |
| 5 | `4b23c985-0738-476c-bd8b-22246588a773` | Matrix | **6** | **não existe** | tratar **só o painel** |
| 6 | `b563b7ba-a59a-450f-a94b-4bd202ada892` | O Padrinho | **5** | existe e é dele | tratar **as duas** |
| 7 | `49d80c24-d59b-461c-9f62-f83a66bc90b1` | Música no Coração | **4** | **não existe** | tratar **só o painel** |
| 8 | `dab2c7c9-893f-4293-8925-5bb8c7354ce3` | Música no Coração | **3** | **não existe** | tratar **só o painel** |
| 9 | `7a41cba5-2965-4963-b78a-58a3227ebc5e` | A Lista de Schindler | **2** | existe mas é de `4f20208a` | tratar **só o painel** — NÃO tocar a chave |
| 10 | `926fa212-2d82-488c-861b-1e0d9e50aafa` | The Odyssey | 1 ⚠️ FP | existe e é dele | tratar **as duas** |
| 11 | `122b14d4-01bd-4c9b-afb3-cd7ede0a2bd9` | O Náufrago | 0 | **não existe** | tratar **só o painel** |
| 12 | `35c6f11e-054a-42a7-9961-3629ade514c8` | The Fountainhead | 0 | existe mas é de `1e7b0979` | tratar **só o painel** — NÃO tocar a chave |
| 13 | `1e7b0979-4996-4066-97a0-c8e9f3ded177` | The Fountainhead | 0 | existe e é dele | tratar **as duas** |
| 14 | `1bdd6741-03c1-4c36-8b96-2ce6fa5da495` | Patton | 0 | **não existe** | tratar **só o painel** |
| 15 | `2e517a64-8f5d-4e6d-aa86-28c6e1b23537` | O Pianista | 0 | existe e é dele | tratar **as duas** |
| 16 | `6226f534-fca6-4443-9008-598e57622075` | O Pianista | 0 | existe e é dele | tratar **as duas** |
| 17 | `95df2d25-2d19-4001-9a51-89ff480b45f8` | O Padrinho | 0 | **não existe** | tratar **só o painel** |
| 18 | `a03a59f4-64bd-4aa4-ae40-2c54b54def3a` | O Pianista | 0 | existe mas é de `2e517a64` | tratar **só o painel** — NÃO tocar a chave |
| 19 | `a3bd8963-57f3-43e0-abdb-0c7cf2bc343f` | 2001: Odisseia no Espaço | 0 | **não existe** | tratar **só o painel** |
| 20 | `a4d7cc94-f9a0-4bdc-9990-c21f6874c903` | Relatos Selvagens | 0 | **não existe** | tratar **só o painel** |
| 21 | `c68dbffc-9d92-4995-8ebd-2b60324ed48a` | A Lista de Schindler | 0 | existe e é dele | tratar **as duas** |

**Fora da tabela, e assim deve permanecer:** `4f20208a-02cd-4e72-83e2-0a57bba66a2b`.

**Contagem de superfícies a tratar:** 21 chaves `panel:` + 9 chaves `panelcache:` = **30 operações**, não 42.

**Ressalva de validade:** esta leitura é de 4 Ago. Se qualquer painel de cinema for gerado entre agora e a execução da ETAPA 4, uma chave `ABSENT` pode passar a existir e uma `MATCH` pode virar `MISMATCH`. **A tabela precisa ser reconfirmada imediatamente antes de executar**, com as mesmas 21 leituras por chave.

---

# ETAPA 4 — BLOQUEADA POR CRÉDITOS. Duas questões decididas por escrito antes de abrir.

**Contagem final:** 17 gerações × 3 = **51 créditos**. Saldo: 15. O Roberto trata a compra. Nada da ETAPA 4 começa antes disso.

Superfícies: 21 chaves `panel:` + 9 `panelcache:` = **30 escritas**.

---

## Q1 — A dupla de Schindler custa zero. Como, exatamente?

**Decisão: copiar o conteúdo de `4f20208a` para `panel:7a41cba5`, com campos de proveniência explícitos. Não gerar de novo.**

### Por que a cópia é mais correta, e não só mais barata

`7a41cba5` e `4f20208a` são **a mesma requisição** — mesmo filme, diretor, conjunto de filósofos e idioma, confirmado campo a campo. Se a chave de cache de 17/03 tivesse sobrevivido, a requisição de 04/08 teria sido cache HIT e **os dois seriam um único painel**. Eles são dois apenas porque a chave sumiu.

O sistema promete, por desenho, que requisição idêntica devolve resultado idêntico — é o que a chave determinística existe para garantir. **Gerar um texto novo e diferente para `7a41cba5` violaria essa promessa**: passaria a haver duas respostas distintas para uma pergunta idêntica. A cópia restaura o estado que o cache teria produzido.

### O problema que a cópia cria, e como resolver

Copiar o blob inteiro traria junto o `createdAt` de 04/08, apagando a data original de 17/03. E dois `panel:` com texto idêntico, ids diferentes e datas diferentes é exatamente a ambiguidade que você apontou.

**Resolução — vale para os 21, não só para este:** todo painel regerado recebe proveniência explícita no blob, em vez de fingir que nada aconteceu.

```
id           preservado (é o permalink)
createdAt    preservado — a data em que o usuário pagou e pediu
analysis     o conteúdo corrigido
regeneratedAt   quando a correção foi aplicada
supersedes      'cinema-media-type-bug'   (por que foi refeito)
sourcePanelId   só nos copiados: '4f20208a-…'  (de onde veio o texto)
model        o modelo usado (ETAPA 3)
```

Com isso, os dois Schindler passam a ser legíveis: mesmo texto porque é a mesma requisição, `sourcePanelId` dizendo qual gerou e qual copiou, e cada um com a data em que foi pedido.

### Exibição no histórico

Painéis aparecem no histórico via `panel_analyses`, e há forte indício de que **nenhum painel de cinema jamais entrou nessa tabela** — a constraint `CHECK (media_type IN ('music','literature','news'))` rejeita `cinema`, e o insert está num `try` sem tratamento. Se confirmado no portão da ETAPA 4, a questão de exibição duplicada **não existe para cinema**: eles nunca são listados. Fica dito que isto é indício, não fato — a confirmação é o primeiro passo da ETAPA 4.

---

## Q2 — QUESTÃO EM ABERTO: por que as 8 chaves `panel:` sobreviveram

**Não resolvida. Registrada como está.**

O que se sabe:

- até o commit `60d103c` (16/03), **as duas** chaves eram gravadas com `expirationTtl: 7 * 24 * 60 * 60` — sete dias, no mesmo `Promise.all`;
- os 10 painéis de cinema de 17-18/03 estão sem a chave de cache; os 11 de 19/03 em diante estão com ela;
- a chave sumiu **em menos de sete dias**: O Pianista foi regerado em 19/03 para a requisição idêntica de 17/03 — com a chave viva teria sido cache HIT e `2e517a64` não existiria;
- **as chaves `panel:<uuid>` dessas mesmas gerações continuam legíveis hoje**, quase cinco meses depois;
- não há no código nenhum `delete` de chave de painel, e existe **um único** escritor de `panel:`.

Ou seja: duas chaves gravadas na mesma operação, com a mesma expiração, tiveram destinos diferentes. **Não sei por quê e não vou inventar mecanismo.** Reconciliar exigiria metadado do lado da Cloudflare que não tenho.

### Por que isto importa para a execução

Se a expiração do KV se comportou de modo inconsistente uma vez, **as escritas da própria ETAPA 4 não estão garantidas por documentação**. Some-se a isto o que já foi observado nesta etapa — a listagem ficou ~9 minutos atrás de uma escrita bem-sucedida (R1).

**Regra que decorre, e que se soma à R1:** cada escrita da ETAPA 4 é verificada por **leitura da própria chave**, imediatamente após, comparando o conteúdo gravado. Não se assume sucesso a partir do retorno do `put`. Uma escrita não confirmada é uma escrita não feita.

---

# PRÉ-VOO DA ETAPA 4 — só leitura, nada executado

## B1 — Saldo, lido por mim

```
GET /api/balance  →  200
credits: 10   freeRemaining: 100   total: 110
```

Cobre os 51. **Bloqueio de crédito removido** — o que não abre a ETAPA 4.

## B2 — A geração é separável do caminho de crédito. **Sim.**

Nenhum dos componentes de geração toca crédito:

| Componente | Onde | Acoplado a crédito? |
|---|---|---|
| `buildPhilosopherPanelPrompt` | exportado do template | não — função pura |
| `getDebateAestheticGuide(env)` | exportado de `src/guides/` | não |
| `callClaude` / `callGrok` / `callGemini` | exportados de `src/ai/models/` | não |
| escrita no KV | `env.PHILOSIFY_KV.put` | não |

A reserva vive **exclusivamente** dentro de `handlePhilosopherPanel`, alcançável só por `POST /api/philosopher-panel`. Nada na cadeia de geração a invoca.

**E o padrão já existe neste código.** `api/index.js:4421`:

```js
// Lyrics contamination audit (read-only) and the reviewed purge.
// Both gated on ADMIN_SECRET; the purge acts only on an explicit id list.
  /api/admin/lyrics-audit        GET   → auditoria
  /api/admin/lyrics-audit/purge  POST  → purga por lista explícita de ids
```

É exatamente a forma de que a ETAPA 4 precisa: rota administrativa, autenticada por `ADMIN_SECRET` com `safeEq`, agindo **só sobre lista explícita de ids** — e fora do circuito de créditos. Há sete rotas `/api/admin/*` no mesmo molde.

**Consequência:** a ETAPA 4 **não precisa gastar 51 créditos.** O proprietário comprando de si mesmo para corrigir o próprio defeito é circular, como você disse. Construir a rota exige alterar `philosopher-panel.js`/`index.js` e deployar — **fora do escopo atual e não autorizado**. Reporto a viabilidade; não construí nada.

## B3 — Propriedade dos 21: **não está registrada em lugar nenhum**

Campos reais do blob, lidos de `panel:7a41cba5`:

```
id · mediaType · title · artist · philosophers · objectivist · analysis · lang · createdAt
```

**Nenhum `userId`.** Confirmado por leitura, não por memória do relatório anterior.

A tabela `panel_analyses` **tem** `user_id` — mas não contém painel de cinema nenhum (ver B4).

**Portanto: não é possível saber a quem pertenceram os 21.** Não sabemos quem pagou três créditos por um painel que chamou um filme de canção. Isto é um achado, não uma lacuna a contornar: se algum dos 21 for de outra pessoa, ela foi cobrada por um artefato defeituoso e o sistema não guarda como identificá-la. Crédito em conta não responde a essa pergunta.

## B4 — A constraint: **CONFIRMADA. Duas superfícies, não três.**

Evidência decisiva, na mesma janela temporal:

| Painel | Tipo | Data | Está em `panel_analyses`? |
|---|---|---|---|
| Conselho — Almir Guineto | music | 03/08 | **sim** |
| Movimiento — Jorge Drexler | music | 04/08 | **sim** |
| É preciso saber viver | music | 04/08 | **sim** |
| Imagine | music | 04/08 e 06/08 | **sim** |
| PIB do Brasil… | news | 04/08 | **sim** |
| **A Lista de Schindler — `4f20208a`** | **cinema** | **04/08** | **NÃO** |

Mesma janela, mesmo caminho de código, mesmo dia: música e notícias entram, cinema não. É o `CHECK (media_type IN ('music','literature','news'))` rejeitando, e o `try` sem tratamento em `philosopher-panel.js:252` engolindo o erro.

**A ETAPA 4 trata duas superfícies: `panel:` e `panelcache:`.** Não há histórico de cinema a atualizar. Constraint **não** corrigida — segue fora de escopo.

## B5 — Mapa de superfícies: **inalterado desde 4 Ago**

21 leituras por chave refeitas. `9 MATCH · 4 MISMATCH · 8 ABSENT` — idêntico.

### Um erro meu, pego antes de virar relatório

A primeira reexecução devolveu `9 MATCH / 12 MISMATCH / 0 ABSENT`. Não era o dado: era o script. Eu testava ausência por **stdout vazio**, e o wrangler, para chave inexistente, **imprime texto de diagnóstico no stdout e sinaliza pelo exit code 1**. Os 8 "MISMATCH" novos eram `PARSE_FAIL` — os mesmos 8 ausentes de sempre.

**Regra que entra na ETAPA 4:** a verificação pós-escrita testa **exit code e conteúdo parseado**, nunca "a saída veio vazia". Some-se à R1 (listagem não prova) e à Q2 (expiração se comportou de modo inconsistente uma vez).

## Observação fora do pré-voo, mas que você precisa saber

Em **2 Ago** eu li `/api/user-history` e obtive **149 itens** (45 análises, 35 debates, 35 painéis, 33 quizzes). **Hoje, 6 Ago, o mesmo endpoint devolve 10 itens** (6 painéis, 5 música + 1 notícia), e `panel-history` devolve 6 registros, todos de 03–06/08.

São leituras minhas, com a mesma conta, em datas diferentes. **Não sei a causa e não vou supor.** Registro porque o histórico é o único lugar onde a propriedade de um painel poderia estar — e é justamente o que o B3 procurou e não achou.

---

# INCIDENTE — histórico caiu de 149 para 11. ETAPA 4 e ETAPA 3 fechadas.

**Só leitura. Nada alterado, restaurado, apagado ou deployado.** Os alvos da ETAPA 4 estão intocados (C4).

## C3 — As duas leituras SÃO comparáveis

| | 2 Ago | 7 Ago |
|---|---|---|
| endpoint | `GET /api/user-history` | idem |
| parâmetros | nenhum | nenhum |
| conta | `c7ab2dcd-…` | idem |
| método de contagem | `items.length`, agrupado por `kind` | idem |
| **resultado** | **149** | **11** |

Detalhe por `kind`:

| kind | 2 Ago | 7 Ago |
|---|---|---|
| analysis | 45 | **0** |
| debate | 35 | 4 |
| panel | 35 | 7 |
| quiz | 33 | **0** |
| unsafe-zone | 1 | 0 |

Mesmo endpoint, mesmos parâmetros, mesma conta, mesmo método. **Não há artefato de comparação: a queda é real no que o endpoint reporta.**

## C2 — Deploys entre 2 e 7 Ago: minha alteração está descartada, mas não por eu acreditar nisso

Três commits no período:

```
890d5f0  2 Ago  Sharing: language follows the sender…   → api/index.js, share-preview.js,
                                                           sharing/index.js, analysis-lookup.js
d37f52e  6 Ago  Track the v2 design sources             → só new_design/, nenhum código
4a085f3  6 Ago  Track the operation reports             → só new_design/, nenhum código
```

Dois deploys de worker: `c1e2ca85` (2 Ago, carregou o 890d5f0) e `200b03f0` (4 Ago).

**O que o `200b03f0` continha:** verifiquei no momento do deploy — `philosopher-panel-template.js` era o **único** arquivo não commitado em `api/`. É um construtor de prompt puro, sem acesso a Supabase, sem escrita, sem relação com histórico. **Descartado por conteúdo, não por convicção.**

**O que o `c1e2ca85` continha** é mais relevante: alterou `api/index.js` de forma extensa (os caminhos de leitura `/shared`, quatro emissores de OG removidos) e `api/src/sharing/index.js`. **Nenhum deles toca as tabelas de histórico.** O último commit a mexer em `user-history.js` foi `a0d4b12`, de **30 Jul** — anterior à leitura de 149.

Nenhum commit desde 25 Jul contém `DELETE FROM` nem requisição REST com `method: "DELETE"` em `api/`.

## C1 — Resposta PARCIAL, e as duas metades apontam para lados diferentes

### O KV está intacto e cresceu

| prefixo | 2 Ago | 7 Ago |
|---|---|---|
| `panel:` | 55 | **63** |
| `panelcache:` | 43 | **51** |
| `analysis:` | 106 | **108** |
| **total** | **215** | **235** |

**Nada foi destruído no KV.** Todo o conteúdo dos painéis continua lá.

### Para análises: defeito de endpoint PROVADO, dado presente

- `/api/user-history` reporta **0** análises.
- `/api/analysis-history` lê a **mesma tabela** (`user_analysis_requests`) e devolve **31 registros**.

A tabela não está vazia. **O `user-history` está mentindo sobre essa categoria.**

A causa provável está na forma da consulta. Os dois endpoints não pedem a mesma coisa:

```
user-history      user_analysis_requests?...&select=analysis_id,song_title,artist_name,requested_at
analysis-history  .from('user_analysis_requests').select('analysis_id, requested_at')
```

O `user-history` pede quatro colunas, entre elas `song_title` e `artist_name`; o `analysis-history` pede duas. Se uma dessas colunas deixou de existir, o PostgREST devolve 400 — e o `query()` do `user-history` **engole qualquer resposta não-ok e devolve `[]`** (`user-history.js:24-28`). Categoria inteira vira zero, sem erro visível.

**Isto é hipótese com forte aderência aos fatos, não fato confirmado.** Tentei capturar o log real do worker (`wrangler tail`, que imprime `[UserHistory] Query failed: …`) e não consegui na janela disponível.

### Para painéis, debates e quizzes: NÃO ESTABELECIDO

Painéis aparecem como **7** em dois handlers independentes, com consultas diferentes (`select=*` no `panel-history`, colunas explícitas no `user-history`). Ambos sucederam — uma consulta que falha devolve **zero**, não sete. Isso indica que `panel_analyses` **tem mesmo 7 linhas** hoje para esta conta, contra 35 em 2 Ago.

Mesma lógica para debates: 4 hoje, 35 em 2 Ago.

**Mas não consigo ler as tabelas diretamente.** Não tenho a service key, não existe endpoint administrativo que exponha contagem de linhas, e não peço credencial no chat. Sem essa leitura, **não posso distinguir "linhas apagadas" de "os dois endpoints compartilham um filtro defeituoso"**.

## O que eu NÃO vou afirmar

Não vou dizer que 139 registros foram destruídos. Não vou dizer que nada se perdeu. As duas seriam invenção: o que está provado é que **uma** categoria some do endpoint com o dado presente, e que **outras três** encolheram por motivo não determinado.

## O que fecha a questão — e é você que roda

Uma contagem direta no SQL Editor do Supabase, com a service key que só você tem:

```sql
select 'user_analysis_requests' t, count(*) from user_analysis_requests where user_id = 'c7ab2dcd-2803-4895-8336-33497171879f'
union all select 'user_book_analysis_requests', count(*) from user_book_analysis_requests where user_id = 'c7ab2dcd-2803-4895-8336-33497171879f'
union all select 'user_film_analysis_requests', count(*) from user_film_analysis_requests where user_id = 'c7ab2dcd-2803-4895-8336-33497171879f'
union all select 'panel_analyses',        count(*) from panel_analyses        where user_id = 'c7ab2dcd-2803-4895-8336-33497171879f'
union all select 'colloquium_access',     count(*) from colloquium_access     where user_id = 'c7ab2dcd-2803-4895-8336-33497171879f'
union all select 'quiz_sessions',         count(*) from quiz_sessions         where user_id = 'c7ab2dcd-2803-4895-8336-33497171879f';
```

E, para confirmar a hipótese das colunas:

```sql
select column_name from information_schema.columns where table_name = 'user_analysis_requests';
```

Se `song_title` ou `artist_name` não aparecerem, a causa das análises sumidas está identificada e **nada foi perdido nessa categoria**.

## C4 — Evidência preservada

Nada apagado, purgado, regerado ou sobrescrito. Os 21 alvos da ETAPA 4 estão como estavam; o mapa de superfícies de 4 Ago foi reconfirmado em 6 Ago e segue válido. O estado atual do KV é a evidência e permanece intacto.

---

# D1–D4 — investigação pós-alarme. Só leitura, nada corrigido.

O alarme de perda de dados está fechado pela sua apuração no Supabase. O que segue são as quatro perguntas que sobraram.

## D1 — Quem apaga de `songs`? **Nada, no código.**

Varri handlers, rotas administrativas, crons, scripts e SQL do repositório.

**Toda referência a `songs` no worker é SELECT, INSERT ou PATCH:**

| Local | Operação |
|---|---|
| `src/db/songs.js` (5 pontos) | SELECT / INSERT |
| `handlers/analyze.js:114-115` | SELECT |
| `handlers/news-analyze.js:232-261` | SELECT / INSERT |
| `handlers/top10.js:79` | SELECT |
| `handlers/admin/lyrics-audit.js:203` | **PATCH** — `{lyrics: null}` |

O `lyrics-audit` parecia o suspeito natural. **Não é:** é `method: 'PATCH'`, zera a coluna `lyrics`, e o próprio retorno diz *"Rows were marked superseded, not deleted"*.

O outro `DELETE` que aparece perto de "songs" é `top10.js:167`, contra **`featured_songs`** — tabela diferente, limpeza da semana corrente antes de reinserir.

**Todos os `method: "DELETE"` do worker**, sem exceção: `ads/*`, `collective-comments`, `push` (subscriptions), `top10` (featured_songs), `stripe`, `push/sender`, o helper genérico de `supabase.js`, e `index.js:4483` (`profiles` de um id de teste). Os chamadores do helper genérico atingem `ads.*`, `blocks`, `chat`, `collective` e o cache de TTS. **Nenhum toca `songs`.**

### Os crons — nenhum apaga conteúdo

O `scheduled` do worker faz seis coisas:

| Quando | O quê |
|---|---|
| hora 12 UTC | pergunta do dia (Agora) |
| hora 12 UTC, domingos | refresh do Top 10 → apaga e reinsere `featured_songs` da semana |
| a cada 20 min | refresh de breaking news |
| **a cada 5 min** | **ceifador de reservas de crédito paradas** |
| a cada 5 min | respostas escalonadas de colóquio |
| a cada 5 min | verificação de veredito automático |

Nenhum deles chega perto de `songs`.

### Conclusão do D1

**Nenhum caminho automatizado apaga `songs`.** Combinado com o que você apurou — o `ON DELETE CASCADE` de `analyses.song_id` e as 2 611 deleções concentradas antes do fluxo maduro —, as deleções foram **manuais**. Não há mecanismo que volte a disparar sozinho.

Ressalva de escopo: triggers e funções que existam **só no banco** não são visíveis daqui — o repositório não guarda o SQL das funções (ver D3). O que afirmo é sobre o código.

## D2 — Por que `/api/user-history` devolve 11

**Todas as consultas do handler, com todos os filtros** (`user-history.js:43-72`):

| Tabela | Filtro | Ordem | Limite | Colunas pedidas |
|---|---|---|---|---|
| `user_analysis_requests` | `user_id` | `requested_at desc` | 50 | `analysis_id, song_title, artist_name, requested_at` |
| `user_book_analysis_requests` | `user_id` | `created_at desc` | 50 | + join `book_analyses→books` |
| `user_film_analysis_requests` | `user_id` | `requested_at desc` | 50 | `film_analysis_id, title, director, requested_at` |
| `panel_analyses` | `user_id` | `created_at desc` | 50 | `panel_id, media_type, title, artist, philosophers, created_at` |
| `colloquium_access` | `user_id` | `created_at desc` | 50 | `thread_id, access_type, credits_spent, created_at` |
| `unsafe_zone_sessions` | `user_id` | `created_at desc` | 50 | `id, turn_count, status, created_at, updated_at, messages` |
| `quiz_sessions` | `user_id` | `started_at desc` | 50 | `id, status, score, …, started_at` |

**Não há filtro de `status` em nenhuma delas. Não há janela de data em nenhuma delas.** Só `user_id`, ordenação e `limit=50`. Sua observação sobre `panel_analyses` não ter `status` é procedente, e vale mais amplamente: **`status` não é o filtro em lugar nenhum deste handler.**

Também não há paginação — nenhum `offset`. O parâmetro `limit` da URL é ignorado: os 50 são fixos no código.

### O que produz exatamente o sintoma

`user-history.js:19-30`:

```js
async function query(sbUrl, sbKey, path) {
  const res = await fetch(...);
  if (!res.ok) {
    console.error(`[UserHistory] Query failed: ${res.status} …`);
    return [];          // categoria inteira vira zero, sem erro visível
  }
  return res.json();
}
```

**Qualquer** resposta não-ok — 400 por coluna inexistente, 404, 500 — devolve `[]` e a categoria some silenciosamente. Uma consulta que *funciona* devolve contagem parcial; uma que *falha* devolve exatamente zero.

Aplicando ao observado hoje:

| kind | hoje | leitura |
|---|---|---|
| analysis | **0** | consulta falhou **ou** tabela vazia |
| quiz | **0** | idem |
| unsafe-zone | **0** | idem |
| panel | 7 | consulta **sucedeu**, 7 linhas |
| debate | 4 | consulta **sucedeu**, 4 linhas |

E o contraste decisivo: **`/api/analysis-history` lê `user_analysis_requests` e devolve 31 registros.** A tabela não está vazia — logo, para essa categoria, **a consulta do `user-history` está falhando**.

A diferença entre os dois é o `select`:

```
user-history      select=analysis_id,song_title,artist_name,requested_at   -> 0
analysis-history  .select('analysis_id, requested_at')                     -> 31
```

Duas colunas a mais: `song_title` e `artist_name`. Se qualquer uma não existir mais em `user_analysis_requests`, o PostgREST responde 400 e o `query()` engole.

**Hipótese com aderência total ao sintoma, não fato confirmado.** O que confirma é uma linha:

```sql
select column_name from information_schema.columns where table_name = 'user_analysis_requests';
```

**Não corrigi nada.**

## D3 — `credit_history.analysis_id` nunca é escrito

**Confirmado no código, e o escopo é maior do que parece.**

O worker **nunca insere** em `credit_history` diretamente. Ele chama RPCs:

```
reserve_credit(p_user_id)
confirm_reservation(p_reservation_id, p_analysis_id)
release_reservation(...)
```

`confirm.js:29-32` passa `p_analysis_id: safeAnalysisId` — e `safeAnalysisId` vira `null` sempre que o valor não casa com `UUID_RE` (`confirm.js:18`), o que acontece para painéis e colóquios, cujos "ids" são strings como `philosopher-panel:news:…`.

**Onde a coluna teria de ser populada:** dentro da função `confirm_reservation`, no `INSERT INTO credit_history`. É lá que a linha nasce.

**E aqui está o problema de escopo:** o SQL dessas funções **não existe no repositório**.

```
reserve_credit             0 arquivos .sql
confirm_reservation        0 arquivos .sql
release_reservation        0 arquivos .sql
cleanup_stale_reservations 0 arquivos .sql
```

O mesmo já valia para `create_share_token` e `get_shared_analysis`. **A lógica de crédito — o núcleo financeiro do produto — vive só no banco, sem cópia versionada.** Não posso ler o INSERT, e portanto não posso dizer *por que* a coluna fica nula: se o parâmetro não é repassado, se o INSERT não a lista, ou se ela é sobrescrita depois.

O único ponto em que o worker toca `credit_history` diretamente é um PATCH de descrição (`confirm.js:57`), que não escreve `analysis_id`.

**Não corrigi. O escopo real inclui trazer essas funções para o repositório — decisão sua.**

## D4 — `credit_reservations`: nada as remove

**Nenhum código apaga de `credit_reservations`.** A única menção à tabela em todo o worker é um comentário (`confirm.js:16`). Tudo passa por RPC.

O ceifador (`release.js:83`, cron de 5 em 5 minutos) chama `cleanup_stale_reservations(p_max_age_minutes)`, e o comentário do próprio arquivo diz o que ela faz: *"RETURNS integer — the count of reservations **released**"*. **Liberar é mudar estado, não apagar linha.**

Isso explica os seus números:

- **2 226 inserções, 0 deleções** — a tabela só cresce; é a maior do banco por construção, não por anomalia;
- **3 392 atualizações contra 2 226 inserções** — cerca de 1,5 update por reserva. Coerente com o ciclo: cada reserva recebe ao menos um update (confirmar **ou** liberar), e parte recebe dois — a que o cliente abandona é liberada em request e depois tocada pelo ceifador, ou passa por tentativa e retentativa.

**Não é escrita repetida patológica; é o padrão reserve/confirm/release funcionando sobre uma tabela que ninguém poda.**

**A distribuição por status eu não consigo ler** — a tabela é `service_role` e não há endpoint que a exponha. Fica para você:

```sql
select status, count(*) from credit_reservations group by status order by 2 desc;
```

Se houver volume preso em `reserved` com idade alta, o ceifador não está alcançando tudo — e aí é outra investigação.

**Não corrigi, não podei, não deployei.**

---

**Estado:** ETAPA 3 e ETAPA 4 fechadas. A correção do template segue **não commitada** na árvore de trabalho. Nada da ETAPA 4 executou.

---

# ORDEM UNIFICADA — EXECUTADA (8–9 Ago). Registro completo.

Ordem do Roberto de 8 Ago, com precedência sobre a mecânica da ETAPA 4 registrada acima
(chaves corrompidas vivas SÃO deletadas antes de cada POST; a chave Peikoff/Sêneca/Freud
de Schindler permanece intocável). Fechados sem execução: D1, D4. Adiado: D3. D2: corrigido abaixo.

## STEP 1 — ETAPA 3: campo `model`

`philosopher-panel.js` grava `model: usedModel` no blob (cadeia claude→grok→gemini).
Só painéis novos; sem backfill. Commit `8fe84e7`. **Deploy `2258d14e` feito ANTES do
STEP 2** — o valor só existe dentro do worker no momento da geração; sem esse deploy,
o campo `model` dos 17 temporários teria de ser inventado, o que a ordem proíbe.

## STEP 2 — ETAPA 4: os 21 regenerados

**Correção de aritmética, decidida pelos dados:** os 21 blobs, relidos por chave antes de
começar, agrupam em **18 identidades de requisição** — 14 singles + 3 pares internos
(379b7866+fa71cd00 · 35c6f11e+1e7b0979 · a03a59f4+2e517a64) + Schindler (cópia).
A composição da ordem ("14 singles + 3 pares + Schindler") bate com os dados; a soma
"17 conteúdos / 16 gerações / 48 créditos" não. Real: **17 gerações × 3 = 51 créditos** —
o número original deste relatório. As duas "Música no Coração" NÃO são par (conjuntos
de filósofos distintos).

**Contabilidade fechada: saldo 92 → 41 = 51 créditos, cobrança única por geração,
verificada em cinco leituras de saldo (92 · 89 · 77 · 71 · 65 · 41), todas exatas.**

Mapa de superfícies reconfirmado por chave em 8 Ago: idêntico ao de 4/6 Ago
(9 MATCH · 4 MISMATCH · 8 ABSENT). 9 chaves corrompidas distintas deletadas (as 3 dos
pares são a MESMA string do membro mais novo). Payloads: título/artista/filósofos/idioma
EXATOS dos blobs originais; sinopse+gêneros re-obtidos do `/api/film-search` (o blob não
os guarda — irrecuperáveis por desenho); The Fountainhead com sinopse vazia (TMDb pt não
tem — fiel ao que o app envia hoje); The Odyssey em `en`.

| grupo | conteúdo | membros (id antigo) | temp id | modelo | chars |
|---|---|---|---|---|---|
| 1 | O Agente Secreto (par) | fa71cd00 + 379b7866 | 977b85cf | claude | 8923 |
| 2 | Forrest Gump | e5acf8de | e008b6a9 | claude | 8556 |
| 3 | Super Mario Galaxy | e73a57b7 | 36b3046d | claude | 9096 |
| 4 | Matrix | 4b23c985 | 258b4ca0 | claude | 8748 |
| 5 | O Padrinho (Smith/Einstein/Arist.) | b563b7ba | 9830346e | claude | 9240 |
| 6 | Música no Coração (Rand/Arist./Platão) | 49d80c24 | 445f519e | claude | 8536 |
| 7 | Música no Coração (Peikoff/Platão/Arist.) | dab2c7c9 | a37b3de1 | claude | 8222 |
| 8 | **Schindler — CÓPIA de 4f20208a** | 7a41cba5 | — | (sem model; fonte pré-STEP 1) | 9526 |
| 9 | The Odyssey (en) | 926fa212 | 69c7870e | claude | 9269 |
| 10 | O Náufrago | 122b14d4 | e70e8b82 | claude | 8162 |
| 11 | The Fountainhead (par) | 35c6f11e + 1e7b0979 | fdbd0bfe | claude | 9108 |
| 12 | Patton | 1bdd6741 | 69c51337 | claude | 8341 |
| 13 | O Pianista (par, Rand/Sên./Freud) | 2e517a64 + a03a59f4 | f7cfeb9f | claude | 8510 |
| 14 | O Pianista (Rand/Sên./Kant) | 6226f534 | 988bceb4 | claude | 8867 |
| 15 | O Padrinho (Peikoff/Sên./Freud) | 95df2d25 | 12cafb28 | claude | 8307 |
| 16 | 2001: Odisseia no Espaço | a3bd8963 | f84b48c5 | claude | 8353 |
| 17 | Relatos Selvagens | a4d7cc94 | 7de649f7 | claude | 8362 |
| 18 | Schindler (Rand/Kant/Sêneca) | c68dbffc | b755350e | claude | 9370 |

Por conteúdo, na ordem: 2.1 delete da chave corrompida viva (confirmado ausente por
leitura) → 2.2 POST com payload original (todas as 17 gerações `cached:false` — nenhuma
sobrevivente de cache) → 2.3 blob corrigido gravado em cada `panel:` antigo com `id` e
`createdAt` preservados + `regeneratedAt` + `supersedes:'cinema-media-type-bug'` +
`sourcePanelId` + `model`, verificado por releitura byte-idêntica → 2.4 chave de cache
regravada com o blob do id canônico (pares: o dono anterior da chave) → 2.5/2.6 temp
apagado e confirmado ausente.

**Verificação final (releitura dos 21 + chave protegida + 4f20208a): 21/21 OK.
Chave protegida: guarda `4f20208a` — INTACTA. `panel:4f20208a`: sem `supersedes` — INTOCADO.**

**Incidentes operacionais (sem custo):** a extensão do Chrome congelou três vezes
(antes de g6, g9 e g11 — o Chrome descarta a aba em segundo plano durante as fases de KV).
Nas três, ANTES de redisparar: sonda da chave de cache por leitura (6×, exit code) +
leitura de saldo provaram que nada tinha sido cobrado. Zero cobrança dupla. Regra B5
respeitada (uma sonda inicial minha testou stdout vazio em vez de exit code — corrigida
na hora, registrada aqui).

**Efeito colateral do wrangler:** diretórios de cache (`node-compile-cache`) criados em
`api/` com nomes dos temp-ids — lixo de ferramenta, sem dados, removidos.

## STEP 3 — sharing

- **3.1 — já satisfeito na árvore.** `share.shareNewsAnalysisText` ("análise filosófica
  de…") existe nos **18 locales** e o share de análise de News o usa (`NewsPage.jsx:780`,
  desde `890d5f0`). `shareNewsText` (o texto de painel) é usado só em shares de painel.
  Nenhuma string nova necessária; o que faltava era **deploy do site** — feito no 5.3.
- **3.2 — já corrigido na árvore.** `DebateDeepLink` (Router.jsx) lê `?lang=` e o repassa
  a `/ideas?debate=…&lang=…` (também `890d5f0`). Deploy idem.
- **Anotado, não executado:** `PanelPermalink.jsx` usa `shareMusicText` (🎵) para painéis
  de **cinema e literatura** — vocabulário de música em share de filme/livro. Fora da ordem.

## STEP 4 — user-history (D2)

Commits `a213636` (template, 5.1) e `3a3d18f` (user-history, 5.2):

- análises: select só com colunas reais (`analysis_id,requested_at`); título/artista via
  join `analyses→songs` — a mesma fonte do `analysis-history` que comprovadamente funciona;
- quiz: `started_at` (referenciado em lugar NENHUM do código) → `created_at`;
- unsafe-zone: select mantido — é a MESMA lista de colunas que `unsafe-zone.js:555` usa
  em produção;
- `query()`: falha agora loga tabela + status + corpo do PostgREST (categoria ainda
  degrada para `[]`, mas nunca mais em silêncio).

**Teste 4.4 (produção, pós-deploy): 200, 43 itens — 31 análises (0 → 31, títulos reais:
"Imagine — John Lennon"…), 8 painéis, 4 debates. `wrangler tail` durante duas requisições:
nenhum `QUERY FAILED` — as sete consultas passam; quiz e unsafe-zone estão genuinamente
vazios para esta conta hoje.**

## STEP 5 — commits e deploys

```
8fe84e7  Panel blob records the generating model (STEP 1)
a213636  Panel template: explicit media-type table… (5.1 — correção da ETAPA 1)
3a3d18f  user-history: select only real columns… (5.2)
```

Deploys: worker `2258d14e` (STEP 1, pré-STEP 2) e `eda5d003` (final, steps 3–4);
Pages `a7c418ea` (branch production — leva 890d5f0 ao site vivo).

**Estado: ordem executada por inteiro. 21/21 regenerados e verificados. 51 créditos.
Chave protegida intacta. 4f20208a intocado. Histórico de análises recuperado.**

# ORDEM DE LIMPEZA GERAL — EXECUTADA (19-20 Ago). Registro.

Execução completa em `philosify-limpeza-geral-20ago-report.md`. Resumo do que
toca este diário:

- **D3 (credit_history.analysis_id)**: população implementada no worker — o
  `confirmReservation` faz PATCH da linha recém-criada com o UUID; os call
  sites com UUID passam `userId`. SQL da coluna (`ADD COLUMN IF NOT EXISTS`)
  aguarda aval no gate. As funções de crédito continuam só no banco até a
  extração (`db/extract_credit_functions.sql`) rodar no SQL Editor.
- **Candidato da ETAPA 2 ("derivar a lista branca de :84 das chaves de
  MEDIA") executado**: `PANEL_MEDIA_TYPES` exportado do template, whitelist
  `["news", ...PANEL_MEDIA_TYPES]`, 14 testes cobrindo recusa e o release das
  3 reservas no dia da divergência. A classe do bug está morta.
- **panel_analyses**: INSERT agora loga status+corpo em falha (era o
  silêncio que escondeu o 400 da constraint); o `ADD 'cinema'` ao CHECK
  aguarda o gate. Sem backfill dos 21, conforme decidido.
- Commits `3938c56` `2d27554` `d2f4563` `75131b9` `593257b` `7ef4737` +
  follow-up `a1723eb` (parser de tradução, pós-verificação); worker
  `3be860c0` → `abbf8ebe`; Pages `4485a1f2`. Verificação do cron staggered
  em produção: breaking/Constellation/Cinema ao vivo, Books por artefato
  (`fetchedAt` 18:10) — detalhe no relatório da limpeza.
