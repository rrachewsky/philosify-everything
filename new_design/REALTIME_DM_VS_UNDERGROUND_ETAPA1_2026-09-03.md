# Realtime DM vs Underground — ETAPA 1: comparação lado a lado (somente leitura)

**Data:** 2026-09-03 · **Status:** comparação fechada no que o repo permite. **Nada editado.**
Diretriz: achar o que o caminho dos DMs (funciona) faz que o do Underground (só com F5) não faz, e replicar.

---

## a) Caminho do DM (funciona) — elos

| Elo | Onde |
|---|---|
| Cliente realtime | **compartilhado** — `services/realtime.js` (`getRealtimeClient`, `setRealtimeAuth`, `waitForAuth`) |
| Gate de token | `useDM.js:674` `await waitForAuth()` → `:677` `getRealtimeClient()` |
| Canal (tópico, private) | `useDM.js:682` `.channel('dm:${user.id}', { config: { private: true } })` |
| Handler da msg nova | `:683` `.on('broadcast', { event: 'new-message' }, …)` — payload **da trigger do banco** (`:686` "Map snake_case from database trigger") |
| Subscribe | `:915` `.subscribe((status, err) => log)` — **só loga** |
| Origem do broadcast | **trigger no banco** (server insert → `realtime.send`). **Sem broadcast client-side** (o único `channel.send` é para *typing*, `:280`) |
| Token / renovação | `useAuth.fetchRealtimeToken` → `setRealtimeAuth(token)` → `setAuth()` no socket compartilhado (`realtime.js:180`) |

## b) Caminho do Underground (falha) — mesmos elos

| Elo | Onde |
|---|---|
| Cliente realtime | **o mesmo** compartilhado `services/realtime.js` |
| Gate de token | `useUnderground.js:42` `await waitForAuth()` → `:45` `getRealtimeClient()` |
| Canal (tópico, private) | `useUnderground.js:50` `.channel('underground', { config: { private: true } })` |
| Handler da msg nova | `:51` `.on('broadcast', { event: 'new-post' }, …)` — payload **da trigger** (decripta E2E) |
| Subscribe | `:97` `.subscribe((status, err) => log)` — **só loga** |
| Origem do broadcast | **trigger no banco** `public.broadcast_underground_post` (`migrations/broadcast_underground_post.sql`): `realtime.send(payload, 'new-post', 'underground', TRUE)`. `createPost` (`:172`) só chama a API; **sem broadcast client-side** |
| Token / renovação | **idêntico** — mesmo `setRealtimeAuth`/`waitForAuth` |

## c) Tabela de diferenças — elo a elo

| Elo | DM | Underground | Diferença? |
|---|---|---|---|
| Cliente / socket / `setAuth` | compartilhado | **o mesmo** | **não** |
| `waitForAuth()` antes do subscribe | sim (`:674`) | sim (`:42`) | **não** — mesma ordem |
| `config.private` | `true` | `true` | **não** |
| Tópico do canal | `dm:${user.id}` (por usuário) | `'underground'` (estático) | nomes diferentes, mas cada um casa com sua trigger |
| Tópico/evento/private da trigger | `dm:${dest}` / `new-message` / *(a confirmar)* | `'underground'` / `'new-post'` / `TRUE` | **cliente e trigger batem nos dois** |
| Broadcast client-side (fallback) | **não** (só typing) | **não** | **não** — ambos dependem só da trigger |
| Subscribe: trata CHANNEL_ERROR/CLOSED, re-subscribe? | **não** (só loga) | **não** (só loga) | **não** — igualmente ausente |
| Ouve `realtime-reconnected`? | **não** | **não** | **não** |
| Deps do effect | `[isAuthenticated, user?.id, loadConversations]` | `[isAuthenticated]` | menor; ambos rodam 1× via `initedRef` |
| **Trigger no banco** | **NÃO está no repo** | versionada (mirror) | **⚠️ não comparável pelo código** |
| **Policy `realtime.messages` (receber)** | por tópico próprio `dm:auth.uid()` | `topic()='underground' AND space_access` | receive do DM passa sempre; o do UG depende de `space_access` |

## d) Veredito

**O caminho do CLIENTE é equivalente nos dois** (mesmo socket, mesma ordem `waitForAuth→subscribe`, mesmo
`private:true`, mesmo "só loga", nenhum re-subscribe, nenhum fallback client-side). **O cliente NÃO é a diferença.**
Ambos dependem 100% da **trigger do banco** para o broadcast.

Logo a divergência está no **banco**, e há **dois candidatos** — que se distinguem pelo **status do subscribe**:

1. **RECEBER (RLS de `realtime.messages`):** se o subscribe privado no tópico `'underground'` for **negado**
   (usuário sem `space_access`, ou policy/token não batem), o canal nunca chega a `SUBSCRIBED` → nenhum broadcast
   chega, mas o F5 funciona (o F5 usa a **API** `getPosts`, não o realtime). O tópico `dm:auth.uid()` do DM passa
   sempre → por isso o DM funciona com o mesmo cliente.
   → **Evidência:** console `[useUnderground] Subscription status: CHANNEL_ERROR` (ou nunca `SUBSCRIBED`).

2. **ENVIAR (trigger silenciosa):** `broadcast_underground_post` embrulha o `realtime.send` num
   `EXCEPTION WHEN OTHERS → RAISE WARNING` — se o `realtime.send` lançar (por qualquer motivo), o post é inserido mas
   **o broadcast nunca sai** e só vira WARNING no log. → **Evidência:** subscribe = `SUBSCRIBED` (saudável) mas nada
   chega; WARNING `[broadcast_underground_post] Failed: …` no log do Postgres.

**Bloqueio da Etapa 1:** a **trigger do DM não está versionada** (nem em `migrations/` nem em `db/functions/`), então
não dá para fazer a comparação final trigger-a-trigger só pelo código.

### Para fechar o diagnóstico — preciso de você (SQL + 1 leitura de console)
```sql
-- 1) Trigger do DM (a que funciona) — para comparar realtime.send (tópico/evento/private/erro):
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE p.proname ILIKE '%broadcast%message%' OR p.proname ILIKE '%dm%broadcast%'
   OR p.proname ILIKE '%direct_message%';
-- (se não achar pelo nome) listar as triggers da tabela de DMs:
-- SELECT tgname, pg_get_triggerdef(t.oid) FROM pg_trigger t
-- JOIN pg_class c ON c.oid=t.tgrelid WHERE c.relname IN ('direct_messages','dm_messages','messages');

-- 2) Confirmar que a trigger do UG em produção == o mirror do repo:
SELECT pg_get_functiondef('public.broadcast_underground_post()'::regprocedure);

-- 3) Policies de realtime.messages (comparar DM vs underground):
SELECT policyname, cmd, roles, qual FROM pg_policies
WHERE schemaname='realtime' AND tablename='messages' ORDER BY policyname;
```
**E a leitura que aponta o candidato certo (2 janelas, conta com Underground aberto):** abrir o console e ver
`[useUnderground] Subscription status: …` — **SUBSCRIBED** → é o **envio** (trigger, candidato 2); **CHANNEL_ERROR** →
é o **recebimento** (RLS, candidato 1). Compare com o DM (deve ser `SUBSCRIBED`).

> Posso também abrir o Underground no Chrome conectado e ler esse status ao vivo, se você estiver logado e com o
> espaço destravado — diz que eu faço.

**Etapa 2 (após o resultado):** se for candidato 1 → alinhar a policy/`space_access` ao padrão do DM (SQL);
se for candidato 2 → corrigir o `realtime.send` da trigger (o que estiver lançando) espelhando o que a trigger do DM
faz. Sem inventar mecanismo novo. **Nada editado até o OK.**

---

## Instrumentação ao vivo (2026-09-03) — resultados e bloqueio

**Passo 1 (código) — resolvido:** `site/vite.config.js:36` → `esbuild: isProd ? { drop: ['console', 'debugger'] }`.
Em produção **todo `console.*` é removido do bundle**. O `console.log` do subscribe (`useUnderground.js:98`, console
**direto**, não `logger`) some no build → **console mudo é esperado; não é evidência de nada.** (O DM usa `logger.log`,
`useDM.js:916`, também removido.)

**Passo 2 (WS ao vivo, aba MCP logada como bob@bobrach.com) — BLOQUEADO pelo E2E:**
- O `read_network_requests` da extensão só captura HTTP (XHR/fetch/docs), **não frames de WS** → instrumentei via
  patch em `WebSocket` injetado por `javascript_tool`.
- **Correção de rota:** `/unsafe-zone` é a **"Zona Insegura"** (diálogo de IA pessoal), **não** o Underground. O
  `useUnderground` só monta em **`/community` → aba "O UNDERGROUND"** (`CommunityHub.jsx:221` / `CommunityPage.jsx:211`
  → `UndergroundFeed` → `useUnderground()` em `:454`).
- Em `/community`, a aba nova **não tem a chave da sala** (E2E); o Underground fica bloqueado e o `useUnderground`
  **não assina** sem destravar. Destravar exige a **chave secreta do Bob** — **não digitada**. Resultado: `hasSocket=true`
  (socket de heartbeat existe) mas **0 frames** de `phx_join` do underground (o subscribe nem foi tentado nessa aba).
- **Conclusão da instrumentação:** a captura do `phx_join`/reply do underground **exige a aba destravada do Bob** —
  inviável por aba nova sem a chave.

## Como capturar (na TUA aba do Underground já destravada)
**Opção A — snippet no console** (código colado em runtime NÃO é afetado pelo `drop:['console']`):
```js
(() => {
  if (window.__ugTap) return console.log('já ativo');
  window.__ugTap = true; window.__ugFrames = [];
  const KEEP = /underground|phx_join|phx_reply|phx_leave|phx_error|broadcast|new-post|"status"/i;
  const push = (dir, s) => { if (KEEP.test(s)) { const l = dir + ' ' + s.slice(0, 800); window.__ugFrames.push(l); console.log('[WSTAP] ' + l); } };
  const p = WebSocket.prototype, orig = p.send;
  p.send = function (d) {
    try { const s = typeof d === 'string' ? d : ''; push('SEND', s);
      if (!this.__tapped) { this.__tapped = true; this.addEventListener('message', e => push('RECV', String(e.data))); }
    } catch (_) {}
    return orig.call(this, d);
  };
  console.log('[WSTAP] armado. 1) saia da aba O UNDERGROUND e volte (força novo join); 2) poste de OUTRA janela; 3) copy(window.__ugFrames.join("\\n")) e cole aqui.');
})();
```
Procurar: `SEND {"topic":"realtime:underground","event":"phx_join",…}` e o `RECV {"event":"phx_reply","payload":{"status":"ok"|"error"}…}`.
- `status:"ok"` → **candidato 2** (recebe ok; problema no ENVIO/trigger) — confirme postando de outra janela: chega
  `RECV … "event":"broadcast" … new-post`? Se não → trigger.
- `status:"error"` (ou nenhum `phx_join`) → **candidato 1** (RLS nega o join) — colar o payload do erro.

**Opção B — DevTools nativo:** Network → filtro **WS** → clicar no socket `…supabase.co/realtime/v1/websocket…` →
aba **Messages** → sair/voltar da aba O UNDERGROUND → achar o `phx_join`/`phx_reply` (colar o reply). Depois postar de
outra janela e ver se chega um frame `broadcast`.

**Sem editar nada até o resultado.**

---

## RESULTADO DA INSTRUMENTAÇÃO (2026-09-03) — VEREDITO: CANDIDATO 1 (RLS nega o join)

Captura ao vivo, aba MCP logada como **bob@bobrach.com**, em `/community?tab=underground` (feed **destravado**,
sem passphrase — a aba nova pegou a chave do `localStorage`/servidor; a "falha de E2E" anterior foi só um clique meu
que não trocou de aba). Patch de `WebSocket` via `javascript_tool`. Frames reais:

**Underground — join NEGADO (re-tenta em loop):**
```
SEND ["10","10","realtime:underground","phx_join",
      {"config":{"broadcast":{"ack":false,"self":false},...,"private":true},"access_token":"<jwt bob c7ab2dcd, aud=authenticated, válido>"}]
RECV ["10","10","realtime:underground","phx_reply",
      {"status":"error","response":{"reason":"Unauthorized: You do not have permissions to read from this Channel topic: underground"}}]
   … idem joins #11, #13, #14 — sempre "Unauthorized".
```
**DM — join OK (mesmíssimo cliente/token/`private:true`):**
```
SEND ["23","23","realtime:dm:c7ab2dcd-2803-4895-8336-33497171879f","phx_join",{...,"private":true,"access_token":"<mesmo jwt>"}]
RECV ["23","23","realtime:dm:c7ab2dcd-…","phx_reply",{"status":"ok","response":{"postgres_changes":[]}}]
```

### Veredito definitivo
**CANDIDATO 1 — RECEBER.** O subscribe privado ao tópico `underground` é **recusado pela autorização de
`realtime.messages`** (mensagem padrão do Supabase Realtime quando a policy de SELECT nega o tópico). O `phx_join`
**é enviado** com token válido e `private:true`, mas o servidor responde **`status:"error" / Unauthorized`**, e o
cliente re-tenta em loop. Por isso **nenhum broadcast chega** e o feed só atualiza com **F5** (que lê pela API, não
pelo realtime). O DM funciona com o **mesmo** cliente porque o tópico `dm:auth.uid()` é **autorizado** — a diferença
é **exclusivamente a policy de autorização do tópico**, não o cliente, não a trigger, não o token.

Descartados por evidência: "subscribe não tentado / guarda" (o join foi enviado); "token ausente/expirado" (JWT
válido no join); "trigger não envia" (irrelevante — o join sequer é autorizado, então o envio nem entra em questão);
"cliente diferente" (idêntico ao DM).

### ETAPA 2 (após OK) — replicar o princípio do DM
A "falha" é a policy de `realtime.messages` para o tópico `underground` **não** autorizar o membro, enquanto a do DM
autoriza (`realtime.topic() = 'dm:' || auth.uid()`). Bob **é** membro (vê o feed, posta como THEPRODUCER) — logo a
condição da policy (provável `EXISTS(space_access … space='underground')`) **não bate com o modelo real de acesso**
que o app/API usa. Para desenhar o SQL exato preciso de:
```sql
-- (1) a policy atual do underground (qual exato):
SELECT policyname, cmd, roles, qual FROM pg_policies
WHERE schemaname='realtime' AND tablename='messages' AND (qual ILIKE '%underground%' OR policyname ILIKE '%underground%');
-- (2) como a policy do DM autoriza (o "princípio que funciona"):
SELECT policyname, cmd, roles, qual FROM pg_policies
WHERE schemaname='realtime' AND tablename='messages' AND (qual ILIKE '%dm%' OR policyname ILIKE '%dm%');
-- (3) o bob TEM a linha que a policy exige? (ajustar nome da tabela/coluna conforme (1)):
SELECT * FROM public.space_access WHERE user_id='c7ab2dcd-2803-4895-8336-33497171879f';
-- (4) qual tabela o APP usa de fato para “é membro do underground”? (a fonte de verdade a espelhar na policy)
```
Com isso, a Etapa 2 alinha a policy do underground ao que o app já considera membro (ou garante a linha de acesso que
a policy exige) — **espelhando o princípio do DM, sem inventar mecanismo novo**. **Nada editado até o OK.**

---

## RECAPTURA PÓS-FIX (2026-09-06) — AINDA "Unauthorized" · token exonerado

Após o Bob corrigir a policy (schema-qualificada; impersonação com search_path vazio = **true**) e provar que a
**trigger grava** (5 linhas new-post em realtime.messages, 22:05/22:07): recaptura com **socket fresco** (aba nova,
policy nova avaliada), forçando join novo por toggle. Todo join do underground segue **negado, em loop**:
```
phx_join  realtime:underground  (token válido, private:true)
phx_reply {"status":"error","response":{"reason":"Unauthorized: You do not have permissions to read from this Channel topic: underground"}}
   … ref 15, 16, 18, 19 — sempre "Unauthorized".
```
**Claims do token** (payload, sem assinatura): `sub=c7ab2dcd` (bob) · `role="authenticated"` · `aud="authenticated"` ·
`exp` válido · `iss=…supabase.co/auth/v1`. → **token correto; hipótese "role/claim errado" DESCARTADA por evidência.**

### Diagnóstico refinado — a diferença DM × underground é a **estrutura da policy**
- **DM (funciona):** autoriza por **claim puro** — `realtime.topic() = 'dm:' || auth.uid()`. **Sem lookup em tabela.**
- **Underground (nega):** autoriza por **subquery em tabela** — `EXISTS(space_access WHERE user_id=auth.uid() AND space='underground')`.

Impersonação retorna true, mas o serviço Realtime ao vivo nega → o suspeito nº1 é o **contexto de permissão da
subquery** no role `authenticated`: se o `authenticated` **não tem GRANT de SELECT em `space_access`** (ou a tabela
tem RLS própria que bloqueia nesse contexto), o `EXISTS` volta vazio/erra → policy = false → "Unauthorized". O DM não
sofre disso porque **não consulta tabela nenhuma** — é o princípio a replicar.

### Confirmar (SQL, sem eu editar) — nesta ordem
```sql
-- 1) o role authenticated consegue LER a tabela da subquery?  (suspeito nº1)
SELECT has_table_privilege('authenticated','public.space_access','SELECT') AS can_select;
-- 2) a tabela da subquery tem RLS própria que bloqueia o authenticated?
SELECT relrowsecurity FROM pg_class WHERE oid='public.space_access'::regclass;
SELECT policyname, cmd, roles, qual FROM pg_policies WHERE schemaname='public' AND tablename='space_access';
-- 3) o bob tem MESMO a linha exigida?
SELECT * FROM public.space_access WHERE user_id='c7ab2dcd-2803-4895-8336-33497171879f' AND space='underground';
-- 4) o qual exato da policy do underground (nome de tabela/coluna reais):
SELECT policyname, qual FROM pg_policies WHERE schemaname='realtime' AND tablename='messages' AND qual ILIKE '%underground%';
```

### Direção da Etapa 2 (após o resultado)
- Se **#1 = false** ou **#2 bloqueia:** `GRANT SELECT ON public.space_access TO authenticated;` (+ policy de SELECT na
  space_access p/ o authenticated ler a própria linha) — dá à policy do underground o acesso que a do DM nem precisa.
- Se **#3 = 0 linhas:** o bob não tem a linha que a policy exige (o app trata membro por outra tabela) → alinhar a
  policy à fonte de verdade real do app, **ou** garantir a linha no fluxo de destravar.
- Em qualquer caso: **replicar o princípio do DM** — autorização que o role `authenticated` consegue de fato avaliar.

**Nada editado até o OK.**

---

## 3ª CONFIRMAÇÃO (2026-09-06) — inalterado + insight sobre a impersonação

Recaptura (socket fresco, pareamento preciso `join_ref===ref`): **5 joins (ref 14,15,16,18,19) → todos `status:"error"`
/"Unauthorized"; 0 broadcast.** Idêntico às capturas anteriores. **Recapturar frames está esgotado como diagnóstico** —
o join ao vivo é definitivamente negado; nada muda até a autorização mudar no banco.

**Insight decisivo sobre "impersonação retorna true":** numa sessão SQL comum, **`realtime.topic()` não tem contexto de
tópico → retorna NULL/vazio.** Se a policy é `realtime.topic() = 'underground' AND EXISTS(space_access …)`, testá-la
inteira por impersonação daria **FALSE** (`NULL AND true`), **não true**. Como o teste deu **true**, provavelmente
validou **só a metade `EXISTS(space_access…)`** — a metade do **`realtime.topic()` ficou sem validação**. É aí que o
ao-vivo pode quebrar (o Realtime pode entregar o tópico como `realtime:underground`, ou `realtime.topic()` não retornar
o que a policy compara).

### Para quebrar o loop — preciso de 3 coisas (não mais frames)
1. **`qual` EXATO da policy do underground:** `SELECT policyname, qual FROM pg_policies WHERE schemaname='realtime' AND tablename='messages' AND qual ILIKE '%underground%';`
2. **O SQL EXATO da impersonação** que deu true (incluiu o predicado `realtime.topic()` ou só o EXISTS?).
3. **Status/versão do Realtime** no dashboard — e se a policy nova foi **recarregada** (às vezes precisa toggle de RLS /
   restart do Realtime).

**Correção provável:** alinhar o predicado de tópico da policy ao que o serviço avalia (ex.: `realtime.topic()` pode vir
`realtime:underground`), mantendo o princípio do DM (autorização baseada em claim/topic que o `authenticated` avalia de fato).
