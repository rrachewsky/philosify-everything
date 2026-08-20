# Ordem de limpeza geral — execução completa (19-20 ago 2026)

**Estado ao fim do turno: Stages 1, 2, 3, 5 e 6 executados e deployados
(worker `3be860c0`, Pages `4485a1f2`). Stage 4 parado no GATE de SQL — os
comandos exatos estão na seção 4 e aguardam seu aval; nada tocou o Supabase.**

Commits, por preocupação (6.1):

```
3938c56  Ticker: single sliding line on mobile (19 ago, já existia)
2d27554  (a) Ticker items keep 44px tap areas; Legal cross-doc link finally renders
d2f4563  (b) Cron: one heavy sweep per invocation; News translation gets JSON mode
75131b9  (c) Panel media whitelist derives from the template MEDIA table
593257b  (d) credit_history gains analysis_id on write; panel INSERT failures log loudly
7ef4737  (f) PanelPermalink: share text routes by mediaType
a1723eb  (b2) News: take the first complete JSON array, not the outermost slice
```

O (b2) nasceu da verificação: o tail de produção pegou o parser novo ainda
falhando em 2 de 6 ciclos (detalhe na seção 2.2) — corrigido e redeployado
(worker `abbf8ebe`, segundo deploy do worker; o Pages continua em um só).

O commit (e) — dump das funções SQL — depende da extração do banco (gate).

---

## STAGE 1 — ticker, touch, legal

**1.1** Fix do ticker (`3938c56`) incluído no deploy do Pages. Nada refeito.

**1.2 Touch targets de ~44px sem inflar a linha.** Padding de 17px em cima e
embaixo dos itens do feed (`a`, `.bk-item`), cancelado por margem negativa —
a linha continua 11px visual, a caixa de toque vira 45px. Detalhe que o plano
original não previa: **overflow corta hit-testing na padding box**, então cada
wrapper com overflow no caminho (`.tkbody`, `.roll`, `.t50-strip`) carrega o
mesmo padding/margem. Segundo detalhe: a regra precisou ficar DEPOIS do bloco
base `.bk-item` (que tem `padding:0` e venceria o cascade — foi exatamente o
que aconteceu na primeira tentativa, pego na verificação).
**Verificado a 360px** (História e Música, dev + build de produção via
pages.dev): linha 11px, mesma linha para rótulo e itens, `elementFromPoint`
acerta o item a ±14px do texto e erra a +25px — alvo efetivo ≈45px.

**1.3 Link Privacy/Terms do Legal.** Escolhi **mover para o corpo da página e
apagar a prop morta**, não ressuscitar o `stat` do Ticker. Razões: (i) o C.4
aposentou o slot direito do ticker — reintroduzi-lo para uma página contradiz
a anatomia universal recém-imposta; (ii) com o contrato de linha única, um
link DENTRO do ticker seria cortado em viewport estreito ("Last updated // 27
Jul 2026 · Privacy Policy →" não cabe em 360px), e link interativo cortado é
pior que texto cortado. O link vive agora num bloco `.crossdoc` abaixo do
reading well, com o registro visual que a regra morta do ticker especificava
(silver, uppercase, tracking .18em). Verificado: renderiza ("Política de
Privacidade →" → `/pp`), ticker do Legal continua 11px.

## STAGE 2 — incidentes do worker

**Nota de método:** o "station log" com as propostas ranqueadas não está no
repositório nem no new_design/ — procurei por subrequest/cron/parse em todos
os relatórios. Implementei as propostas como reformuladas na sua ordem.

**2.1 Cap de subrequests do cron.** No minuto 0 das horas 0/6/12/18, uma
única invocação carregava breaking news + Top Books + Top Cinema + History
Graph + varredura da Constellation (e os leves de 5 em 5). Cada varredura
pesada agora tem janela própria de 5 minutos — orçamento próprio:

| Varredura | Antes | Agora |
|---|---|---|
| Breaking news | min 0/20/40 | min 0/20/40 (inalterado) |
| Constellation Tier 2 | min 0/30 | min 5/35 |
| Top Books (6h) | min 0 | min 10 |
| Top Cinema (3h) | min 0 | min 15 |
| History Graph (6h) | min 0 | min 25 |

Cinema e Graph não estavam no trio nomeado mas dividiam a mesma invocação —
mesma classe, mesmo remédio. Os jobs leves de 5-em-5 (ceifador de reservas,
colóquio, auto-verdicts) ficaram onde estavam.

**2.2 Falhas de parse na tradução de manchetes.** Três reforços em
`summarizeArticles` (headlines.js), fallback intacto:
1. `responseMimeType: "application/json"` no generationConfig;
2. strip de fences + validação `Array.isArray` antes de usar;
3. **(b2, pós-verificação)** extração do **primeiro array completo por
   profundidade de colchetes** (string-aware). A primeira versão recortava do
   primeiro `[` ao último `]`; o tail de produção mostrou o modelo às vezes
   emitindo um array válido seguido de uma segunda cópia (duplicada ou
   truncada) — o recorte abraçava as duas e morria com "unexpected character
   after JSON" (2 falhas em 6 ciclos: 04:20 e 05:01 UTC). O scan por
   profundidade devolve o primeiro array e ignora o resto; array truncado
   continua lançando para o fallback. Coberto por 7 casos de teste do scanner
   rodados em node antes do deploy.
Qualquer falha continua caindo no `return articles` — sem tradução é melhor
que quebrado.

**Verificação (pós-deploy, tail de produção, 20 ago):**

- **Breaking news pós-fix b2:** ciclos 17:20, 21:00 e 21:20 UTC limpos —
  `Translated + summarized 26/26/28 articles into "en"`, zero erro de parse
  desde o deploy `abbf8ebe`. (Pré-b2, o tail da madrugada registrou 2 falhas
  em 6 ciclos: 04:20 e 05:01 — foi o que motivou o scanner por profundidade.)
- **Constellation:** janelas 21:05 (e 03:35/04:05/04:35/05:05 na madrugada)
  rodando sozinhas no slot minuto-5/35, sweep completo, 0 erros.
- **Top Cinema:** janela 21:15 UTC observada ao vivo — fetch TMDB completo
  (trending movie/tv + top_rated), 50 filmes, 36/50 enriquecidos com atores,
  **nenhum erro de subrequest** na invocação isolada.
- **Top Books:** janela 18:10 não capturada ao vivo (o tail caiu no intervalo
  17:25–20:50), mas verificada **por artefato**: o payload de
  `/api/books/top` carrega `fetchedAt: 2026-08-20T18:10:20.514Z` — exatamente
  a janela minuto-10 da hora 18, com 50 livros no cache. O sweep rodou
  sozinho na invocação dele e completou.
- **History Graph:** única janela não observada (18:25 caiu no mesmo buraco
  do tail; o `fetchedAt` do KV não serve de prova porque o TTL de 2h expira
  antes e qualquer GET reconstrói). Evidência por simetria: o gate é
  idêntico ao do Books (hora%6, janela de 5 min), que está confirmado, e o
  build em si funciona (GET em 21:32 reconstruiu 126 nós/107 arestas na
  hora). Confirmação ao vivo possível na janela 00:25 UTC, se quiser.
- **Negativo também confirma:** nas janelas fora de slot (17:25, 20:50,
  20:55...) só os jobs leves dispararam — nenhum sweep pesado fora da
  própria janela.

## STAGE 3 — matador da classe de bug

`PANEL_MEDIA_TYPES = Object.keys(MEDIA)` exportado do template; a lista
branca do handler virou `["news", ...PANEL_MEDIA_TYPES]` (news roteia para o
news-panel-template no mesmo if/else). As duas listas não podem mais
divergir: tipo novo no MEDIA entra na API automaticamente; tipo removido sai.

**Testes (14, todos verdes)** — `philosopher-panel-template.test.js` +
`philosopher-panel.test.js`:
- todo tipo declarado no MEDIA monta prompt (e cinema fala língua de cinema:
  "FILM TO ANALYZE", "MOTION PICTURE");
- tipo desconhecido (`podcast`, `undefined`, `null`, `""`) lança
  `UNSUPPORTED_MEDIA_TYPE` — recusa, nunca default;
- handler: tipo válido passa fim-a-fim (3 reservas → 3 confirmações, zero
  releases); tipo desconhecido recusa com 400 ANTES de reservar;
- **o dia da divergência**: com a lista branca sabotada no teste para aceitar
  `podcast`, o template lança depois das 3 reservas e o catch devolve as 3 —
  a rede de segurança funciona.

Vermelho pré-existente e não relacionado: `i18n-errors.test.js` falha 2 casos
(valores EN duplicados entre chaves de erro; string vazia) — já falhava antes
de qualquer mudança minha. Anotado, não investigado (sua regra).

## STAGE 4 — banco. **GATE: SQL aguardando seu aval.**

Nada foi executado no Supabase — não tenho credencial nenhuma (confirmado: só
`.dev.vars.example` no repo; o etapas já registrava "a service key que só
você tem"). Os comandos estão versionados no repo e reproduzidos aqui.

**4.1 — `migrations/panel_analyses_add_cinema.sql`:**
```sql
ALTER TABLE panel_analyses
  DROP CONSTRAINT panel_analyses_media_type_check;

ALTER TABLE panel_analyses
  ADD CONSTRAINT panel_analyses_media_type_check
  CHECK (media_type IN ('music', 'literature', 'news', 'cinema'));
```
(Se o DROP reclamar do nome: `SELECT conname FROM pg_constraint WHERE
conrelid = 'panel_analyses'::regclass AND contype = 'c';`)
Sem backfill dos 21 — propriedade nunca foi registrada, não invento.
O lado código já está no ar: o INSERT agora checa `response.ok` e loga status
+ corpo do PostgREST em falha (era o silêncio que escondeu este bug: fetch
não lança em 400, e o código logava "Saved" com a constraint recusando).
**Até você rodar o SQL, painéis de cinema seguem só no KV — mas agora
gritando no log a cada tentativa.**

**4.2 — `migrations/credit_history_analysis_id.sql`:**
```sql
ALTER TABLE credit_history
  ADD COLUMN IF NOT EXISTS analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL;
```
Decisão de implementação que precisa do seu de-acordo: o D3 provou que a
linha nasce no INSERT dentro da função `confirm_reservation`, **cujo corpo só
existe no banco**. Não edito às cegas uma função SECURITY DEFINER do núcleo
financeiro. Então a população é **no worker, no mesmo request**: o
`confirmReservation` agora faz PATCH da linha recém-criada com o
`analysis_id` (junto do patch de descrição que já existia), com log alto de
sucesso/falha. Os 7 call sites que têm UUID passam `userId` para o filtro
funcionar mesmo sem `history_id`. De brinde, morreu um `return;` solto que
fazia `confirmReservation` retornar `undefined` quando não havia filtro.
Depois que o 4.3 versionar o corpo da função, mover o write para dentro do
INSERT é o follow-up limpo.
**Verificação pendente** (precisa de uma cobrança real): uma análise nova →
`SELECT analysis_id FROM credit_history ORDER BY created_at DESC LIMIT 1;`
— ou o log `[Credits] credit_history patched (analysis_id)` no tail.
**Atenção:** até a coluna existir, cada confirmação de análise vai logar
`credit_history patch FAILED: 400` no tail — alto e inofensivo, some quando
o SQL rodar.

**4.3 — `db/extract_credit_functions.sql`** (só leitura, rode quando quiser):
```sql
SELECT p.proname AS function_name,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'reserve_credit',
    'confirm_reservation',
    'release_reservation',
    'cleanup_stale_reservations',
    'cleanup_user_stale_reservations'
  )
ORDER BY p.proname;
```
"Proceed without waiting" não foi possível: extração exige rodar SQL, e SQL
é seu. Cole a saída e eu verso cada função em `db/functions/<nome>.sql`
(commit (e)). Incluí `cleanup_user_stale_reservations` (o worker também a
chama); `create_share_token`/`get_shared_analysis` estão na mesma situação se
quiser aproveitar a viagem.

## STAGE 5 — sharing

**5.1** `PanelPermalink` roteia o shareText por `mediaType`: news → 📰,
cinema → 🎬 `shareFilmText`, literature → 📚 `shareLiteratureText`, música →
🎵. As duas chaves existem nas 18 línguas — **zero strings novas**, nada para
aprovar. Verificado no navegador com painel de cinema stubado: a URL do
WhatsApp sai "🎬 Check out the philosophical analysis of The Fountainhead by
King Vidor…".

**5.2** **Já estava implementado** — a decisão "interface segue o conteúdo" é
o commit `890d5f0` (2 ago): a guarda de `preferredLanguage` que o seu :260
referenciava foi substituída pelo hook `useSharedContentLanguage`, incondicional,
nas duas páginas (`SharedAnalysis.jsx:78`, `PanelPermalink.jsx:35`), e o
controle de idioma continua visível (NavAccount é o chrome default do
PageShell). Não reimplementei; **verifiquei**: visitante com preferência
`pt` abrindo painel `en` → chrome vira inglês, `preferredLanguage` do
visitante permanece `pt`, e se ele trocar de língua no meio da leitura a
escolha dele vence (cleanup do hook). Comportamento exato da sua decisão.

## STAGE 6 — deploys, verificação, registro

- Worker: `wrangler deploy --env production` → versão `3be860c0`.
- Pages: build + deploy → `4485a1f2` (branch production → philosify.org).
- `/api/health` 200. `/api/user-history` sem token → 401 (rota viva; o 200
  autenticado fica para a sua sessão — não tenho JWT seu, e não devo ter).
- Ticker a 360px no build de produção (pages.dev, o philosify.org bloqueia
  navegador automatizado no challenge): linha 11px, tap 45px — screenshot em
  `printscreen 02 ticker-mobile/history-360-PRODUCTION.png`. **Confirmação em
  aparelho real é sua.**
- Painel de cinema entrando em `panel_analyses`: **bloqueado pelo gate 4.1**
  — entra na verificação pós-SQL.
- Link compartilhado com texto/idioma certos: verificado pré-deploy (acima);
  em produção precisa de um id de painel real — teste com um link seu.

## Achados no caminho (anotados, não executados — sua regra)

1. `CinemaPage.jsx:543` — o share da ANÁLISE de filme (não painel) também usa
   `shareMusicText` 🎵. Mesma classe do 5.1, fora do escopo que você definiu
   (PanelPermalink). Uma linha para trocar por `shareFilmText` quando quiser.
2. `i18n-errors.test.js` — 2 falhas pré-existentes (EN duplicado entre
   chaves; string vazia). Não relacionadas.
3. `CLAUDE.md` desatualizado: aponta `supabase_schema.sql` na raiz (não
   existe; o schema de referência é `migrations/schema_reference.sql`) e diz
   que o worker é `philosify-api` (produção é `philosify-api-production`).
4. O cron nas horas 8/11/14/17/20/23 roda `handleColloquiumCron` em TODAS as
   12 invocações de 5-em-5 daquela hora (o gate é só `hour`); presumo
   idempotência interna, não verifiquei — fora de escopo.
5. `LegalPage` importava `Link` só para a prop morta; o import continua usado
   pelo novo bloco `.crossdoc`.

## Pendências em aberto

| # | O quê | De quem |
|---|---|---|
| 1 | Rodar 4.1 + 4.2 no SQL Editor (aprovação = rodar) | Roberto |
| 2 | Rodar a extração 4.3 e colar a saída | Roberto |
| 3 | Versionar as funções extraídas (`db/functions/`) + commit (e) | eu, após o 2 |
| 4 | Verificação pós-SQL: painel de cinema em `panel_analyses` + `analysis_id` numa cobrança real | eu/Roberto |
| 5 | ~~Tail da janela Books/Cinema/Graph~~ **feito 20 ago**: Books 18:10 por artefato (`fetchedAt`), Cinema 21:15 ao vivo; só o Graph resta por simetria (janela 00:25 UTC se quiser prova ao vivo) | — |
| 6 | Ticker 360px em aparelho real | Roberto |
