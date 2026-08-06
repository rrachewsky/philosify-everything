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
