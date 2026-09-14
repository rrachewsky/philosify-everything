# Post-mortem — Realtime do Underground (e Collective) só atualizava com F5

**Data:** 2026-09-06 · **Status:** RESOLVIDO em produção (correção do Bob) · aceite das duas janelas **PASSOU**
(post atravessa sem F5).

## Sintoma
Posts do Underground não chegavam ao vivo entre janelas — só apareciam com **F5** (que lê pela API, não pelo realtime).
DMs e Ágora funcionavam normalmente.

## Causa raiz
As policies de **`realtime.messages`** do underground e do collective faziam **`EXISTS` direto numa tabela**
(`public.space_access`, `public.collective_members`). Esse subquery **falha no contexto de avaliação do serviço
Realtime** (o role em que o serviço avalia a autorização não consegue resolver/ler a tabela da subquery), embora a
**mesma expressão passe em impersonação no SQL Editor**. As policies **claim-only** (`dm` = `realtime.topic() = 'dm:' ||
auth.uid()`, `agora`) **nunca sofreram** — não tocam tabela nenhuma. Por isso o **mesmo cliente/token** que autorizava
`dm:<uid>` era **negado** em `underground` (evidência: `phx_join` do `realtime:underground` → `phx_reply {status:error,
"Unauthorized: You do not have permissions to read from this Channel topic: underground"}`, em loop; `dm:<uid>` → `ok`).

## Correção aplicada (Bob, produção 06/09)
- Funções **`SECURITY DEFINER`** `public.is_underground_member(uid)` e `public.is_collective_member(uid, gid)`
  (`STABLE`, `search_path=public`, `EXECUTE` só para `authenticated`/`service_role`, `REVOKE` de `PUBLIC`/`anon`).
- As **duas policies recriadas** chamando as funções (não mais o `EXISTS` direto); tópico estrito **`'underground'`**
  restaurado (o `ILIKE` de diagnóstico saiu).
- A função roda com o privilégio do **definer**, então a checagem de associação funciona no contexto do Realtime.

## REGRA DA CASA
> **Uma policy de `realtime.messages` NÃO faz subquery direta em tabela.** A checagem de associação/permissão vai numa
> **função `SECURITY DEFINER`** (`STABLE`, `search_path` fixo, `EXECUTE` só para `authenticated`/`service_role`,
> `REVOKE` de `PUBLIC`/`anon`). Policy claim-only (só `realtime.topic()`/`auth.uid()`) é o caminho mais seguro; quando
> precisar de tabela, encapsule numa função definer.

## Cadeia de hipóteses (eliminadas, em ordem)
1. **Token/claim errado** — captura ao vivo dos claims: `role=authenticated`, `aud=authenticated`, `sub=<bob>`, `exp`
   válido. Token **correto**. ✗
2. **Cliente diferente (DM × UG)** — mesmo cliente compartilhado (`services/realtime.js`), mesma ordem
   `waitForAuth → getRealtimeClient → .channel({private:true}) → subscribe`, **sem** broadcast client-side em nenhum.
   Idênticos; DM `ok`, UG `error` com o mesmo cliente/token. ✗
3. **Trigger não grava o broadcast** — provado que grava (linhas `new-post` em `realtime.messages`). Além disso,
   irrelevante: o **join** sequer era autorizado, então o envio nem entrava em questão. ✗
4. **`search_path`** — a policy foi schema-qualificada e a impersonação com `search_path` vazio deu true, parecendo
   apontar pra cá. **Correção honesta: era PISTA FALSA.** Policies **resolvem os nomes de objeto no `CREATE`, por OID** —
   o `search_path` de runtime não muda a resolução. O `search_path` não era o problema (nem a "prova" era prova). ✗
5. **Serviço Realtime não recarregou / precisa restart** — considerado; não era. ✗
6. **Prefixo do tópico** (`realtime.topic()` devolver `realtime:underground` e o `= 'underground'` nunca casar) —
   hipótese secundária forte durante o diagnóstico. **Também PISTA FALSA:** o tópico estrito `'underground'` funciona
   com a função definer; o problema era a **subquery em tabela**, não o texto do tópico. ✗
7. **→ Causa final: subquery `EXISTS` direta em tabela na policy de `realtime.messages`** falha no contexto do
   serviço; **solução: função `SECURITY DEFINER`.** ✔

## O que a Etapa 1 já apontava
O diagnóstico comparativo (relatório `REALTIME_DM_VS_UNDERGROUND_ETAPA1_2026-09-03.md`) isolou: cliente idêntico →
divergência no banco → **candidato 1 (autorização do join negada)**, com evidência de frames (`phx_reply` Unauthorized),
e já indicava a **subquery em `space_access`** como suspeito nº1 vs. a policy claim-only do DM. A correção confirma.

## Pendência leve (aceite residual)
- **Teste negativo:** conta **SEM** underground **não** deve receber broadcast (a função definer retorna false).

## DESFECHO REAL — Collective realtime · RESOLVIDO 11/09 (substitui a seção "DEFEITO ABERTO" abaixo)

**O mapeamento da seção abaixo estava errado** (rastreio de 11/09, `COLLECTIVE_CHAT_RASTREIO_INSERT_2026-09-11.md` e
`COLLECTIVE_COMENTARIOS_ETAPA1_2026-09-11.md`):
- **`POST /api/groups/:id/chat` não vai a `chat.js`** — vai a `groups.js:handleSendGroupMessage` e grava em
  `group_chat_messages`. E **ninguém chama essa rota**: o serviço `groupsService` e o hook `useCollective` são **código
  morto** (sem importadores; o hook chama funções inexistentes; o bundle de produção não contém `member-joined`).
  A "feature" de chat de grupo com invite code é herança anterior ao Collective. Trigger criada nessa tabela ficou
  **preparada-para-nada** → fila do Bloco 3.
- **O Collective real são os comentários em análises** (`AnalysisDiscussion.jsx` → `POST /api/collective/analyses/:id/
  comments` → `collective-comments.js:226` → **`collective_comments`**). Essa tabela **nunca teve realtime em ponta
  nenhuma**: sem trigger, sem broadcast no handler, sem assinante no cliente (um único GET ao abrir a discussão). A
  "assimetria" de 06/09 era eco local do remetente + re-fetch ao reabrir/F5 — nunca houve travessia ao vivo.
- O `member-joined` que trafega em `collective:<gid>` vem de **trigger não-versionada em `collective_members`**
  (`realtime.send`); serviu de gabarito e prova de que a policy definer autoriza o tópico.

**Conserto aplicado (11/09, padrão Underground):** triggers `AFTER INSERT` (`new-comment`) e `AFTER DELETE`
(`comment-deleted`) em `collective_comments`, tópico `'collective:' || group_id` (resolvido via `collective_analyses`),
privado, EXCEPTION não-bloqueante, payload snake_case sem plaintext quando cifrado —
`migrations/collective_comments_realtime_broadcast.sql` (aplicado em prod pelo Bob) + listener em
`AnalysisDiscussion.jsx` (filtra por análise, decripta E2E no cliente, dedupe por id) — deploy Pages
`f918ec90`. **Aceite do Bob: comentário atravessou ao vivo entre janelas.**

**Pendências registradas:** espelho da trigger de `collective_members` (dump A/B, placeholder na migração); teste
negativo com não-membro; Bloco 3 (limpeza do caminho morto: rota `/api/groups*`, `groups.js`, `group_chat_messages` +
trigger órfã, `useCollective.js`, `services/api/groups.js`).

## DEFEITO ABERTO — Collective realtime (exercitado 06/09, FALHOU com assimetria) · SUPERADO, ver seção acima
**Fatos (Bob):** msg postada no **Chrome atravessou** ao Edge; postada no **Edge NÃO atravessou** ao Chrome; e
`realtime.messages` tem **ZERO linhas `collective:%`** (nem das que atravessaram). → o transporte do Collective **NÃO é
`realtime.send` de trigger**; o conserto das policies de **SELECT** (autoriza o *subscribe*) **não cobre por inteiro**.

**Mapeamento (código, read-only):**
- **Envio:** `useCollective.sendMessage` (`useCollective.js:144`) → `collectiveService.sendCollectiveMessage` → API
  **`POST /api/groups/:id/chat`** (roteado em `index.js:1090-1099`) → **`chat.js:handleSendMessage`** → **INSERT em
  `chat_messages`** (`chat.js:185`). **Sem `channel.send` no cliente; sem broadcast no handler** (grep: nem `chat.js`,
  nem `collective.js`, nem `index.js` broadcastam `collective:`).
- **Recepção (pretendida):** canal **privado** `collective:${gid}` `.on('broadcast',{event:'new-message'})`
  (`useCollective.js:46-52`). A função `is_collective_member` (SELECT) agora **autoriza o subscribe** — mas **nada emite**
  pra esse tópico.
- **Quem produz o broadcast do chat:** a **Ágora funciona** (`useChat` assina `.channel('agora')` **PÚBLICO**,
  `useChat.js:51`) e **também envia por API** (com update otimista, sem `channel.send`, `useChat.js:141-173`). Logo o
  produtor é **server-side sobre `chat_messages`** (quase certamente uma **trigger** — nenhum handler broadcasta) que emite
  pro tópico **`'agora'`**. **NÃO emite pra `collective:${gid}`** nas mensagens de grupo → daí **zero linhas `collective:%`**
  e nenhuma entrega ao vivo no canal do coletivo.

**Hipótese "channel.send client-side em canal privado → precisa policy de INSERT": NÃO se aplica** — o cliente **não** faz
`channel.send` no Collective (nem DM/Ágora); todo envio é por API → não há INSERT a autorizar. (O DM funciona porque o
**backend** emite por REST `/realtime/v1/api/broadcast` com **service key** — efêmero, bypassa RLS, e por isso **também**
não deixa linhas em `realtime.messages`.)

**Por que o Chrome "conseguiu" (hipótese honesta):** se nada emite pra `collective:${gid}`, travessia ao vivo não deveria
ocorrer em sentido nenhum. Mais provável: **eco otimista** no remetente + **re-fetch** do `loadDetail` na aba receptora
(navegação/re-montagem) — o que também explica a **assimetria** (depende da aba ter re-buscado). É hipótese — confirmar
com o dump da trigger de `chat_messages`.

**Correção proposta (para OK — NÃO aplicar), sem inventar mecanismo:**
- **Opção A (espelha DM/colloquium):** o `POST /api/groups/:id/chat`, após inserir, faz
  `POST {SUPABASE_URL}/realtime/v1/api/broadcast` (service key) → tópico `collective:${gid}`, evento `new-message`
  (efêmero; sem realtime.messages; **sem** INSERT policy).
- **Opção B (espelha 'agora'):** a trigger de `chat_messages` passa a emitir também pra `collective:${gid}` em msg de
  grupo (`realtime.send`, private) — aí basta a policy de SELECT (já corrigida).
- **NÃO** é policy de INSERT — não há envio client-side.

**Confirmar/versionar (Bloco 3a):** dump da(s) trigger(s) de `chat_messages` (`pg_get_triggerdef` + a função) — mostra
pra quais tópicos o chat broadcasta hoje (fecha a assimetria e versiona a trigger).

## Higiene de repo (neste ciclo)
- `migrations/realtime_policies_security_definer.sql` — espelho byte-a-byte do aplicado (funções + policies).
- `db/functions/is_underground_member.sql`, `db/functions/is_collective_member.sql` — espelhos das funções.
- **Trigger do DM** (achada fora do repo na Etapa 1) — versionar agora (fecha a pendência do Bloco 3a).
- Client: **sem resíduo** do diagnóstico (taps foram runtime-only); backoff do retry (diff B, 01/09) **fica**.
