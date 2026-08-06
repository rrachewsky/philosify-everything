# Bug da letra errada (Joana) — auditoria e limpeza do cache

**Data:** 31 Jul 2026 · **Commits:** `71c52b5` (Genius), `f4bd771` (auditoria), `c74448d` (Letras)
**Worker:** versão `7218f432`
**Estado:** ferramentas no ar, **nada purgado** — aguardando revisão do Roberto.

> **Achado tardio e grave:** o conserto do Genius não fechava o buraco. A fonte
> de fallback tinha o mesmo defeito e continuou entregando a faixa errada até
> `c74448d`. Detalhes na seção 1.

---

## 1. Confirmação do conserto e a regra exata

### Não existe limiar de similaridade — e isso é deliberado

A regra é determinística, não percentual.

**Título.** Normaliza dos dois lados: minúsculas, acentos removidos via NFD,
conteúdo entre `[...]` e `(...)` descartado, sufixo após ` - ` cortado,
pontuação virada em espaço, espaços colapsados. Aceita em exatamente dois casos:

1. **Igualdade** após normalização;
2. o mais curto ser **prefixo do mais longo terminando em fronteira de palavra**,
   com mínimo de 4 caracteres.

Assim "Joana (Ao Vivo)" casa com "Joana", e "Eu" nunca casa com "Eu Sei".

**Artista.** Reduzido a letras e dígitos minúsculos, com contenção mútua —
tolera "Bob Rach" contra "Bob Rach & Band".

**Janela.** Os 10 primeiros resultados, em até três formulações de busca
(título + artista simplificado, título + artista completo, título sozinho com
validação de artista).

> Um limiar percentual seria pior, não melhor: aceita quase-acertos, e é
> justamente o "quase" que produziu a Joana. A regra atual erra para o lado da
> recusa.

### Correção a um relato anterior: existem DUAS fontes, e a segunda também estava quebrada

Eu havia descrito o fluxo com uma fonte só, e depois afirmei que a segunda era
"segura por construção". **As duas afirmações estavam erradas.**

1. **Genius** — validado por artista + título, como acima. Corrigido em `71c52b5`.
2. **Letras.mus.br** — acionada quando o Genius devolve nada.

Eu supus que o Letras fosse imune por endereçar a música por URL exata. Testei
contra o site ao vivo e ele **redireciona** um slug desconhecido para outra
música do mesmo artista, respondendo **200 com letra de verdade**:

```
/bob-rach/joana.html                     -> /bob-rach/realize-feat-the-galt-sisters/
/bob-rach/musica-que-nao-existe-xyz.html -> /bob-rach/realize-feat-the-galt-sisters/
```

Qualquer slug inexistente daquele artista cai na mesma página. É o mesmo defeito
do Genius por mecanismo diferente — e significa que, **mesmo com o conserto do
Genius no ar, pedir Joana ainda produzia a letra de Realize** pelo fallback.

**Corrigido em `c74448d`** (Worker `7218f432`): a página alcançada após os
redirecionamentos é verificada contra o título pedido, usando a mesma regra
`titleMatches`, com o slug canônico da URL e a tag `<title>` como testemunhas
independentes. Nenhuma das duas casando é recusa.

Verificado ao vivo após o conserto:

| Pedido | Onde a página cai | Resultado |
|---|---|---|
| Joana / Bob Rach | Realize (feat. The Galt Sisters) | **recusado** |
| Realize / Bob Rach | Realize (feat. The Galt Sisters) | aceito |
| Imagine / John Lennon | Imagine | aceito |

**A recusa só acontece quando as duas fontes falham** — agora com as duas
validando de verdade.

### Decisão do Roberto (31 Jul): manter Genius + Letras.mus.br

Levantei que o Spotify **não** pode ser fonte de letra — a Web API pública não
expõe letras, e o que os apps mostram vem licenciado do Musixmatch por endpoint
privado que exige sessão de usuário. Levantei também que o `spotify_id` já dá
identidade exata da faixa, e que o `external_ids.isrc` de `/v1/tracks/{id}`
permitiria buscar letra por **identidade** em provedor licenciado, em vez de por
nome — o que tornaria esta classe de defeito impossível, e não apenas detectável.

**Descartado por ora.** As duas fontes atuais permanecem, agora com validação em
ambas. Fica registrado que o fluxo continua encontrando letra por nome, com o
`spotify_id` do usuário sendo descartado no passo da busca — a validação fecha o
buraco, mas a arquitetura ainda é de palpite verificado.

### Consequência para a limpeza do cache

Como as duas fontes produziam a mesma faixa errada, não dá para saber por qual
delas a análise da Joana entrou — não há log daquela execução. Isso não muda o
que precisa ser feito, mas muda o alcance: análises que "escaparam" do conserto
do Genius podiam continuar contaminadas pelo Letras até `c74448d`.

### O que acontece na recusa

| Aspecto | Comportamento |
|---|---|
| HTTP | 404, código `LYRICS_NOT_FOUND` |
| Mensagem | Localizada nos 19 locales |
| PT hoje | *"A letra de «X» por «Y» não foi encontrada ou é inválida."* |
| Crédito | Reserva **liberada** — `releaseReservation` com motivo `failed` |
| Análise | Não roda. Nenhuma letra substituta, em hipótese alguma |

Se você quiser exatamente a redação *"Letra não disponível para esta música"*,
é troca em 19 arquivos — peça e eu faço.

---

## 2. Auditoria retroativa

### Por que não rodei

Esta máquina não tem `.dev.vars` — sem chave do Supabase e sem token do Genius.
Construí a auditoria onde os segredos já existem, no Worker, e não peço o
`ADMIN_SECRET` por chat.

### Método

Para cada música em cache, reproduzo **os dois algoritmos sobre a mesma lista de
resultados**:

- **Antigo** (até 31 Jul): primeiro acerto de **artista**. Título nunca conferido.
- **Novo** (em produção): primeiro acerto de **artista + título**.

Quando discordam, a análise armazenada foi escrita sobre a faixa que o antigo
escolheu.

| Veredito | Significado |
|---|---|
| `no_title_match` | Genius tem o artista mas **não** a música — a forma exata da Joana. Sinal mais forte. |
| `wrong_pick` | Os dois acham algo, mas faixas diferentes. |
| `ok` | Os dois convergem na mesma faixa. |
| `no_artist_hit` | Nada casou o artista; a letra pode ter vindo do fallback Letras. Julgar à mão. |
| `search_failed` | Genius não respondeu nessa passada. Repetir a janela. |

Para garantir que a auditoria julga pela regra **de produção** e não por uma
imitação dela, as funções de `genius.js` foram exportadas e a auditoria importa
as mesmas — `normalizeTitle`, `titleMatches`, `artistMatches`.

### Ressalva honesta

É uma reprodução contra o índice **atual** do Genius, não uma gravação da época.
O índice muda com o tempo. O resultado é **evidência para revisão**, nunca
deleção automática.

### Como rodar

O segredo sai da variável de ambiente e nunca é impresso nem gravado em arquivo.

```powershell
$env:PHILOSIFY_ADMIN_SECRET = "<seu admin secret>"
node api/scripts/lyrics-audit.mjs
```

Saídas em `api/scripts/out/` (pasta no gitignore — seus dados não vão ao repo):

- `lyrics-audit.md` — tabela: música, artista, veredito, o que foi analisado,
  o que deveria ser, modelos
- `lyrics-audit.json` — o mesmo em bruto
- `purge-candidates.json` — ids prontos para a etapa 3

---

## 3. Purga — pronta, travada na sua revisão

**Nada foi purgado.** O endpoint só age sobre uma **lista explícita de ids**;
sem ids, recusa com 400.

### Decisão que você deve avaliar: supersede em vez de delete

A purga marca `status = 'superseded'` em vez de deletar. O sistema já tinha esse
mecanismo, e ele atinge seu objetivo melhor que a deleção:

- a busca em cache exige `status = 'published'`;
- a análise contaminada **deixa de ser servida**;
- uma nova e correta é gerada no próximo pedido;
- o registro **não é destruído**.

A imutabilidade fica honrada: a linha não é apagada, é **destronada**. Se ainda
assim você preferir deleção dura, é sua chamada.

### Como purgar, depois de revisar

Apague do arquivo os ids que quiser **preservar**, depois:

```powershell
node api/scripts/lyrics-audit.mjs --purge api/scripts/out/purge-candidates.json
```

Com `clearLyrics: true` ele também zera a letra contaminada gravada na tabela
`songs`, para o registro parar de afirmar algo falso.

---

## 4. Prevenção

### Letra ausente é estado de primeira classe

Registrado no ponto da recusa em `analyze.js`, com o histórico do defeito, para
ninguém reintroduzir o fallback silencioso.

### Os outros módulos

| Módulo | Fonte | Situação |
|---|---|---|
| **Cinema** | TMDb | **Imune.** A análise é dirigida por `tmdb_id`, que vem da escolha do usuário, e os detalhes vêm por **id exato**. Não há busca por título no fluxo de análise — logo não há "pega o primeiro do diretor". |
| **Literatura** | Google Books | **Tinha o mesmo defeito, corrigido.** `getBookMetadata` fazia literalmente `// Return first match` sem conferir título. Agora valida com a mesma regra e recusa se nenhum volume casar. |
| **Música** | Genius | Corrigido em `71c52b5` — validação de artista + título nos 10 primeiros. |
| **Música** | Letras.mus.br | Corrigido em `c74448d` — a página após redirecionamento é verificada contra o título pedido. Era o mesmo defeito, e sobreviveu ao primeiro conserto. |

A exposição da Literatura era bem menor que a do Genius: a consulta é escopada
por campo (`intitle:` + `inauthor:`) e o caminho só é alcançado quando falta o
`google_books_id` da escolha do usuário. Mas o buraco existia.

### A diferença que explica por que música foi catastrófica

Em música **a letra é o objeto analisado** — a faixa errada corrompe a análise
inteira. Em cinema e literatura a sinopse é suplementar: a IA analisa a obra
pelo próprio conhecimento. Por isso música era o ponto único de falha grave.

---

## Arquivos

```
api/src/lyrics/genius.js                   exporta a regra (sem mudança de comportamento)
api/src/lyrics/letras.js                   verificação da página após redirecionamento
api/src/lyrics/audit.js                    NOVO — reprodução dos dois algoritmos
api/src/handlers/admin/lyrics-audit.js     NOVO — GET relatório, POST purga
api/scripts/lyrics-audit.mjs               NOVO — runner local
api/scripts/.gitignore                     NOVO — out/ fora do repo
api/index.js                               2 rotas, ambas sob X-Admin-Secret
api/src/books/metadata.js                  validação de título no fallback
api/src/handlers/analyze.js                recusa documentada
```

Ambos os endpoints foram verificados em produção: retornam 403 sem o segredo.
