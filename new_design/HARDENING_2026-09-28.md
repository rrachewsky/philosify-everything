# Ciclo de hardening — 3 achados de gravidade alta do inventário · 28/09/2026

**Origem:** `db/INVENTARIO_2026-09-22.md` § I-4, fila de decisão, itens 2, 3 e 4. **Base:** `redesign/v2` em `b9b35c0`.
**Regra:** um achado por vez, H1 → H2 → H3. Cada um: evidência → proposta → SQL gated → OK do Bob → Bob aplica no SQL Editor → verificação → próximo. **Nada no banco sem OK.** Eu não executo nada no banco.
**Ao final:** espelhos em `db/policies/` atualizados (espelho segue o banco), este relatório fechado, commit `seguranca: hardening de policies (dm, tts-audio, panel)`.

---

## Fato que muda os três casos: o site não fala com o PostgREST

Verificado em 28/09 por grep em `site/src` (fora de `node_modules`/`dist`):

| O que procurei | Resultado |
|---|---|
| `.from(` / `.rpc(` do supabase-js | **zero** ocorrências (o único `.from` é `Array.from`) |
| chamadas a `/rest/v1` ou `/storage/v1` | **zero** |
| `.storage.` | **zero** |
| `createClient` | 1, em `site/src/services/realtime.js:121`, com a anon key, usado só para `sb.channel()` / `sb.removeChannel()` (broadcast e presence) |
| envio de DM | `/api/dm*` do worker (4 chamadas) |

Ou seja: **todo acesso a dados passa pelo worker com a service key** (`api/src/utils/pg.js`, comentário da linha 2: "service role, bypasses RLS"). As policies para `anon`/`authenticated`/`public` em tabelas de dados não têm consumidor legítimo hoje. Elas existem só como superfície: qualquer pessoa com a anon key pública do site e um JWT de login pode chamar o PostgREST direto (`https://<proj>.supabase.co/rest/v1/<tabela>`), e aí as policies frouxas valem.

Isso não muda a ordem nem os babysteps. Muda a resposta padrão: **menor privilégio = tirar a policy, não consertá-la**, porque não há caminho client-side a preservar.

---

## H1 — `direct_messages`: INSERT contornável

### a) Evidência

Policies de INSERT vivas em `public.direct_messages` (espelho `db/policies/public.direct_messages.sql`, dump de 22/09):

| policy | roles | WITH CHECK |
|---|---|---|
| `Conversation members can send messages` | public | `sender_id = auth.uid()` **AND** `conversation_id IS NOT NULL` **AND** existe linha em `dm_conversation_members` para (conversation_id, auth.uid()) |
| `Users can send messages` | authenticated | `auth.uid() = sender_id` **só** |
| `Service role full access direct_messages` | service_role | `true` |

Policies PERMISSIVE somam por OR. Um `authenticated` que satisfaça `Users can send messages` passa, mesmo fora da conversa. Efeito: qualquer usuário logado insere uma linha em **qualquer** `conversation_id` (e com `recipient_id` que quiser) via REST, por fora do worker. As triggers `broadcast_dm_insert_trigger` e `archive_direct_message_trigger` disparam normalmente, então a mensagem chega em tempo real aos membros da conversa alheia.

**Quem insere em `direct_messages` hoje:**

| Caminho | Chave | Arquivo |
|---|---|---|
| worker, envio de DM | service | `api/src/handlers/dm.js:649`, `:1748` |
| worker, DM automática do colóquio | service | `api/src/handlers/colloquium-user.js:1328` |
| worker, DM automática do fórum | service | `api/src/handlers/forum.js:1403` |
| site, direto no Supabase | — | **nenhum** |

Resposta à pergunta (a): **todo envio passa pelo worker.** Não há caminho client-side.

Mesmo padrão nas outras operações da tabela, registrado para o H1-bis (não neste passo): SELECT tem `Users can read own messages` (sender/recipient, authenticated) ao lado de `Conversation members can view messages`; DELETE `Users can delete own messages`; UPDATE `Recipients can mark as read`. Nenhuma tem consumidor no site. `Users can read own messages` também deixa ler por `recipient_id`, coluna que o próprio autor da inserção controla.

### b) Proposta

**Passo único, dois DROPs, menor privilégio:** remover as duas policies de INSERT para clientes. O worker usa service_role e não é afetado.

- `Users can send messages`: **obrigatório**. É a frouxa.
- `Conversation members can send messages`: **recomendado no mesmo passo**. Sem consumidor, é só superfície; e mantê-la sozinha convida a "consertar" a outra em vez de fechar a porta. Se o Bob preferir babystep ainda menor, aplica só o primeiro DROP e o segundo vira H1-bis junto com SELECT/DELETE/UPDATE.

Por que não corrigir a frouxa para exigir membership: corrigir mantém uma porta que ninguém usa. Se um dia o site for inserir DM direto no Supabase, a policy certa se escreve nessa hora, com o requisito da hora.

### c) SQL gated para o Bob (SQL Editor, na ordem; parar se qualquer passo divergir do esperado)

**Pré-flight, só leitura. Esperado: 7 linhas, as 3 de INSERT acima entre elas.**

```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'direct_messages'
ORDER BY cmd, policyname;
```

Colar a saída verbatim antes de seguir. Se aparecer policy que não está no espelho de 22/09, parar e me mandar.

**Mudança. Uma transação, dois DROPs.**

```sql
BEGIN;
DROP POLICY "Users can send messages" ON public.direct_messages;
DROP POLICY "Conversation members can send messages" ON public.direct_messages;
COMMIT;
```

(Se optar pelo babystep menor, rodar só o primeiro `DROP POLICY` dentro do `BEGIN`/`COMMIT`.)

**Verificação. Esperado: zero linhas de INSERT fora de service_role; total 5 policies (ou 6, no babystep menor).**

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'direct_messages'
ORDER BY cmd, policyname;

SELECT count(*) AS insert_policies_nao_service
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'direct_messages'
  AND cmd = 'INSERT' AND NOT ('service_role' = ANY(roles));
-- esperado: 0
```

**Rollback, se precisar (recria exatamente o que estava no espelho de 22/09):**

```sql
BEGIN;
CREATE POLICY "Users can send messages" ON public.direct_messages
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = sender_id));
CREATE POLICY "Conversation members can send messages" ON public.direct_messages
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((sender_id = auth.uid()) AND (conversation_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM dm_conversation_members
  WHERE ((dm_conversation_members.conversation_id = direct_messages.conversation_id) AND (dm_conversation_members.user_id = auth.uid()))))));
COMMIT;
```

### d) Testes

**Teste negativo (o que o hardening fecha).** Logado no site como um usuário A, pegar o JWT (DevTools → Application → Local Storage → chave `sb-<ref>-auth-token` → `access_token`) e a anon key (está no bundle do site, `cfg.supabaseAnonKey`). Escolher um `conversation_id` de uma conversa da qual A **não** participa. Então:

```bash
curl -s -X POST "https://<projeto>.supabase.co/rest/v1/direct_messages" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <JWT_DE_A>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"sender_id":"<UUID_DE_A>","recipient_id":"<UUID_DE_B>","conversation_id":"<CONVERSA_ALHEIA>","message":"teste hardening H1"}'
```

Antes do DROP: **201** e a linha aparece (é o bug). Depois: **401/403** com `new row violates row-level security policy for table "direct_messages"`. Se o Bob preferir não rodar o "antes", basta o "depois".

**Teste positivo (o que não pode quebrar).** No site, enviar uma DM normal entre dois usuários que conversam. Deve chegar, com broadcast em tempo real. Passa pelo worker com service key, que ignora RLS; nenhuma mudança esperada.

### e) Resultado (29/09)

Aplicado pelo Bob. `Success. No rows returned` no bloco; `insert_policies_nao_service = 0` na verificação. Espelho atualizado. **H1 fechado.** Fica para o H1-bis, fora deste ciclo: as policies de SELECT/DELETE/UPDATE para clientes, também sem consumidor.

---

## H2 — `storage.objects`, bucket `tts-audio`: policy "Service role full access" vale `TO public`, FOR ALL

### a) Evidência

Policies vivas em `storage.objects` (espelho `db/policies/storage.objects.sql`, dump de 22/09):

| policy | cmd | roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Service role full access for tts-audio` | ALL | public | `bucket_id = 'tts-audio'` | `bucket_id = 'tts-audio'` |
| `Public read access for tts-audio` | SELECT | public | `bucket_id = 'tts-audio'` | — |

O nome da primeira diz "service role", mas `TO public` significa todos os roles. Com ela, qualquer role que tenha GRANT de INSERT/UPDATE/DELETE em `storage.objects` (no padrão Supabase, `anon` e `authenticated` têm) pode **subir, sobrescrever e apagar** qualquer arquivo do bucket `tts-audio` pela Storage API, usando só a anon key pública. Os GRANTs efetivos, colados em 29/09, confirmam: `anon` e `authenticated` têm INSERT, UPDATE e DELETE em `storage.objects` (e SELECT, REFERENCES, TRIGGER, TRUNCATE). Com a FOR ALL `TO public`, **a escrita anônima no bucket está aberta hoje, sem login**. Parecer do supervisor: gravidade máxima.

Pré-flight já colado em 29/09: `storage.buckets` tem um só bucket, `tts-audio`, com **`public = true`**.

**Quem usa o bucket:**

| Caminho | Chave | Arquivo |
|---|---|---|
| worker, upload do MP3 do TTS | service (`SUPABASE_SERVICE_KEY`) | `api/src/tts/index.js:383-421` (`uploadTTSToStorage`), `POST /storage/v1/object/tts-audio/<file>` com `x-upsert: true`; nenhum caminho de DELETE no worker |
| player do site, leitura | nenhuma (URL pública) | URL `…/storage/v1/object/public/tts-audio/<file>` montada em `tts/index.js:417` |
| site, Storage API direta | — | **nenhuma** (zero `/storage/v1`, zero `.storage.`) |

A leitura por `/object/public/<bucket>/…` é servida pela Storage API pela flag `public` do bucket, **sem passar pelas policies RLS**. Logo a policy de SELECT não é o que mantém o player tocando. Ela só vale para leitura autenticada via API (`/object/authenticated/…`, `list`), que o site não usa.

Resposta à pergunta (a): leitura pública é desejada e já está garantida pelo bucket. Escrita legítima é só o worker, com service_role, que não depende de policy.

### b) Proposta

**DROP da policy FOR ALL.** Não há consumidor não-service para escrita; restringi-la a `service_role` seria manter uma policy sem efeito (service_role já ignora RLS). Tirar é o menor privilégio e o menor texto.

**Manter `Public read access for tts-audio`** neste passo. É inofensiva (só SELECT no bucket que já é público) e serve de rede se algum caminho autenticado de leitura aparecer. Pode cair num H2-bis se o Bob quiser zero policy para clientes em storage.

### c) SQL gated para o Bob

**Pré-flight, só leitura.** Esperado: as 2 policies acima, verbatim; e nos GRANTs, ver se `anon`/`authenticated` aparecem com INSERT/UPDATE/DELETE (gravidade atual).

```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd, policyname;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'storage' AND table_name = 'objects'
ORDER BY 1, 2;
```

Se aparecer policy fora das 2 do espelho, parar e me mandar.

**Mudança.**

```sql
BEGIN;
DROP POLICY "Service role full access for tts-audio" ON storage.objects;
COMMIT;
```

**Verificação.** Esperado: 1 linha (`Public read access for tts-audio`, SELECT) e `0`.

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd, policyname;

SELECT count(*) AS policies_escrita_nao_service
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND cmd <> 'SELECT' AND NOT ('service_role' = ANY(roles));
-- esperado: 0
```

**Rollback exato (espelho de 22/09):**

```sql
CREATE POLICY "Service role full access for tts-audio" ON storage.objects
  AS PERMISSIVE FOR ALL TO public
  USING ((bucket_id = 'tts-audio'::text))
  WITH CHECK ((bucket_id = 'tts-audio'::text));
```

### d) Testes

**Positivo 1, leitura.** Abrir no navegador, sem login, a URL de um áudio já existente (qualquer análise com TTS gerado; a URL tem a forma `https://<projeto>.supabase.co/storage/v1/object/public/tts-audio/<analysisId>_<lang>.mp3`). Deve tocar. Não muda, porque depende do bucket público.

**Positivo 2, escrita pelo worker.** Gerar TTS de uma análise ainda sem áudio (ou apagar e regerar). O upload é com service key; deve continuar funcionando. Log do worker: `[TTS] ✓ Uploaded to: …`.

**Negativo, o que o hardening fecha.** Upload anônimo com a anon key:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://<projeto>.supabase.co/storage/v1/object/tts-audio/hardening_h2_teste.txt" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: text/plain" --data "teste"
```

Antes do DROP: `200` (é o bug; se rodar o "antes", apagar o arquivo depois pelo dashboard). Depois: `400` ou `403` com `new row violates row-level security policy`. Repetir com o JWT de um usuário logado no lugar da anon key: mesmo resultado esperado.

### e) Depois do OK e da aplicação

Bob cola a verificação; eu atualizo `db/policies/storage.objects.sql` e sigo para o H3.

---

## H3 — `panel_analyses`: INSERT `TO public WITH CHECK (true)`

### a) Evidência

Pré-flight colado em 29/09, idêntico ao espelho de 22/09 (`db/policies/public.panel_analyses.sql`):

| policy | cmd | roles | USING | WITH CHECK |
|---|---|---|---|---|
| `Service can insert panel analyses` | INSERT | public | — | `true` |
| `Users see own panel analyses` | SELECT | public | `auth.uid() = user_id` | — |

A primeira deixa **qualquer role** inserir qualquer linha em `panel_analyses`, inclusive com `user_id` de outra pessoa (o painel falso apareceria no histórico da vítima). O nome sugere que foi escrita pensando no worker, mas o worker não precisa dela.

**Quem escreve e lê:**

| Caminho | Chave | Arquivo |
|---|---|---|
| worker, INSERT do painel | service (`getSupabaseCredentials` → `SUPABASE_SERVICE_KEY`, `api/src/utils/supabase.js:62`) | `api/src/handlers/philosopher-panel.js:328` |
| worker, histórico do painel | service, filtra `user_id` no servidor | `api/src/handlers/panel-history.js:21`, `api/src/handlers/user-history.js:67` |
| site, direto no Supabase | — | **nenhum** |

Resposta à pergunta (a): sim, só o worker insere, com service key. A policy aberta não tem consumidor legítimo.

### b) Proposta

**DROP de `Service can insert panel analyses`.** Manter `Users see own panel analyses` (leitura do próprio, inofensiva, sem consumidor; cai no H3-bis se o Bob quiser).

### c) SQL gated para o Bob

Pré-flight já feito e conferido (29/09). Se passar mais de um dia até aplicar, repetir:

```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'panel_analyses'
ORDER BY cmd, policyname;
```

**Mudança.**

```sql
BEGIN;
DROP POLICY "Service can insert panel analyses" ON public.panel_analyses;
COMMIT;
```

**Verificação.** Esperado: 1 linha (`Users see own panel analyses`, SELECT) e `0`.

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'panel_analyses'
ORDER BY cmd, policyname;

SELECT count(*) AS insert_policies_nao_service
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'panel_analyses'
  AND cmd = 'INSERT' AND NOT ('service_role' = ANY(roles));
-- esperado: 0
```

**Rollback exato:**

```sql
CREATE POLICY "Service can insert panel analyses" ON public.panel_analyses
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);
```

### d) Testes

**Positivo.** Gerar um painel de filósofos real pelo site. Deve aparecer no histórico do painel. O INSERT é do worker com service key; log `[PhilosopherPanel] Saved to panel_analyses: <id>`. Se aparecer `panel_analyses INSERT FAILED (non-fatal)` no log do worker, parar e me mandar: o handler trata a falha como não fatal, então o painel apareceria na tela mas não no histórico.

**Negativo.** Com a anon key e o JWT de um usuário:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "https://<projeto>.supabase.co/rest/v1/panel_analyses" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<UUID_DE_OUTRA_PESSOA>","panel_id":"hardening_h3","title":"teste"}'
```

Depois do DROP: `401/403`. (Antes: `201`, o bug. Colunas obrigatórias podem exigir mais campos; um `400` por coluna faltante antes do DROP não prova nada, um `403` de RLS depois prova.)

### e) Depois do OK e da aplicação

Bob cola a verificação; eu atualizo `db/policies/public.panel_analyses.sql`, fecho este relatório e preparo o commit `seguranca: hardening de policies (dm, tts-audio, panel)`.

---

## Registro de execução

| Passo | Data | Resultado |
|---|---|---|
| H1 proposta | 28/09 | escrita |
| H1 OK do Bob | 29/09 | **os dois DROPs num passo** (menor privilégio; sem consumidor client-side). Pré-flight colado |
| H1 pré-flight conferido | 29/09 | 7 policies, nomes, cmd, roles, qual e with_check **idênticos** ao espelho de 22/09 (). Nenhuma policy nova. **Liberado o bloco BEGIN/COMMIT.** |
| H1 verificação (1ª) | 29/09 | `insert_policies_nao_service = 2`: **DROPs ainda não aplicados**; banco inalterado. Bob vai rodar o bloco BEGIN/COMMIT e repetir a contagem (esperado 0) |
| H2 pré-flight parcial | 29/09 | `storage.buckets`: só `tts-audio`, `public = true`. Leitura por URL `/object/public/` independe da policy de SELECT. Faltam os GRANTs de `storage.objects` |
| H3 pré-flight | 29/09 | 2 policies em `panel_analyses`, idênticas ao espelho de 22/09: `Service can insert panel analyses` (INSERT, {public}, WITH CHECK true) e `Users see own panel analyses` (SELECT, {public}, auth.uid() = user_id). Nenhuma nova |
| **H1 APLICADO** | 29/09 | Bob rodou o bloco BEGIN/COMMIT (`Success. No rows returned`); verificação `insert_policies_nao_service = 0`. Espelho `db/policies/public.direct_messages.sql` atualizado: 5 policies, cabeçalho com nota do hardening e ponteiro para o rollback. Teste positivo (DM pelo site) pendente, no tempo do Bob |
| H1 re-execução | 29/09 | Bob rodou o bloco de DROP uma 2ª vez: `ERROR 42704 policy "Users can send messages" ... does not exist`. Esperado após aplicação: transação abortou inteira, nada mudou. Estado segue o verificado (0) |
| H2 e H3 propostas | 29/09 | escritas; aguardando OK do Bob para o H2 (aplicação sequencial H2 → H3) |
| H2 pré-flight + OK | 29/09 | Policies: as 2 do espelho, verbatim. GRANTs em `storage.objects`: `anon` e `authenticated` com INSERT/UPDATE/DELETE (além de SELECT, REFERENCES, TRIGGER, TRUNCATE). Parecer do supervisor: **gravidade máxima**, escrita anônima aberta no bucket hoje, sem login. Decisão do Bob: DROP só da FOR ALL; **manter** `Public read access for tts-audio`. **Liberado o bloco BEGIN/COMMIT do H2.** |
| **H2 APLICADO** | 29/09 | Bob rodou o bloco BEGIN/COMMIT (`Success. No rows`); verificação: 1 policy (`Public read access for tts-audio`, SELECT, {public}) e `policies_escrita_nao_service = 0`. Espelho `db/policies/storage.objects.sql` atualizado: 1 policy, cabeçalho com nota do hardening e ponteiro para o rollback. Testes positivos (áudio existente toca; TTS novo gera) pendentes, no tempo do Bob. Escrita anônima no bucket **fechada**. |
| H3 pré-flight repetido + OK | 29/09 | Pré-flight repetido pelo Bob: as 2 policies do espelho, verbatim (INSERT {public} with_check true; SELECT {public} auth.uid() = user_id). OK do Bob: DROP de `Service can insert panel analyses`, manter a de SELECT. **Liberado o bloco BEGIN/COMMIT do H3.** Ordem de commit aprovada: `seguranca: hardening de policies (dm, tts-audio, panel)` após a verificação do H3 |

| **H3 APLICADO** | 29/09 | Bob rodou o bloco BEGIN/COMMIT via supervisor (`Success. No rows returned`); verificação: 1 policy (`Users see own panel analyses`, SELECT, {public}) e `insert_policies_nao_service = 0`. Colado nesta sessão em 02/10. Espelho `db/policies/public.panel_analyses.sql` atualizado: 1 policy, cabeçalho com nota do hardening e ponteiro para o rollback |
| H2 teste positivo, escrita | 29/09 | **TTS novo gerou**: Imagine (pt), 35 s, upload do worker com service key depois do DROP. Confirmado pelo Bob em 02/10 |
| H3 teste positivo | 02/10 | **dispensado por decisão do Bob, coberto pela arquitetura** (mesmo critério do ponto 13 da Metodologia): o INSERT em `panel_analyses` é do worker com service key (`philosopher-panel.js:328`), que ignora RLS e não é tocado pelo H3; a gravação é non-fatal e o painel renderiza do KV. Nenhum caminho de cliente insere |
| **CICLO ENCERRADO** | 02/10 | H1 + H2 + H3 aplicados e verificados; 3 espelhos de `db/policies/` seguem o banco; commit `seguranca: hardening de policies (dm, tts-audio, panel)` por ordem do Bob (hash no fechamento abaixo). Pendentes de fila, com OK próprio: H1-bis/H2-bis/H3-bis (policies de leitura/alteração de cliente sem consumidor) |

### Nota à margem do teste H2 (29/09): "barra de loading" e "comprimento do áudio" no player

Bob reportou que, no teste do áudio, não apareceram a barra de carregamento da geração nem o comprimento do áudio com evolução no play. Apurado no código e ao vivo:

| Ponto | Fato |
|---|---|
| Componente em uso | páginas v2 usam `V2AudioBar` (`site/src/pages/v2/music/V2AudioBar.jsx`, idem cinema/literatura; news usa `TTSBar` → `AudioBar`), desde o WP3 de 29/07/2026 (`2b8d1ee`). O `ListenButton` legado, que tinha barra de 0–120 s, cronômetro e barra de progresso com duração, só é usado nas sidebars antigas |
| Geração | v2 não tem barra: mostra o texto `Preparando áudio · mm:ss` (cronômetro). Verificado ao vivo em `/music?analysis=…` (Imagine): `Preparando áudio · 00:15 … 00:35`, depois `Ouvir a análise` |
| Duração | v2 não exibe duração em lugar nenhum (por desenho do mockup) |
| Progresso no play | é o **fio de 1 px** (`.aline i`) que se preenche em cor `--ink` sobre a linha `--line`; CSS presente e correto para `.pg-music` (`music.css:66-69`), computado ao vivo: `position:absolute; height:1px; width:0%` antes do play. **Não consegui medir o preenchimento**: o clique automatizado não conta como gesto do usuário (`NotAllowedError: play() failed because the user didn't interact`) e a aba estava em segundo plano |
| News | `AudioBar` de news não tem progresso algum |
| Nexo com H2/deploy | nenhum: componentes e CSS inalterados desde 29/07; o deploy `ef6b8fc4` só levou o DM |

Efeito colateral do teste: gerei o TTS em pt de "Imagine" na conta do Bob (35 s de geração).

**Pergunta ao Bob:** durante o play, o fio fino entre o texto e "Velocidade" vai enchendo? Se sim, está tudo como desenhado e a queixa vira pedido de design (barra de geração, duração e progresso visíveis, no padrão do `ListenButton` legado) para a fila. Se não enche, é defeito e entra como ciclo com console em mãos.

**30/09, resposta do Bob:** "nenhum efeito visual aparece tanto na geração quanto na execução do áudio. Não há time bar em nenhuma das duas situações." Tentativa de medir o fio ao vivo abortada: a aba de automação foi perdida três vezes (grupo de abas do Claude fechado/recriado). Pedido ao Bob de uma medição de console durante o play (abaixo) e proposta de design para a fila: barra de geração + tempo decorrido/duração + fio de progresso visível no `V2AudioBar`, no padrão do `ListenButton` legado.
