# Post-mortem — Smoke do Underground E2E (deploy pré-privacy)

**Data:** 2026-08-30
**Deploy sob análise:** worker `3cb57822`, site `0181f873` (commit `5b1c4b2`), publicados ~00:33–00:37 UTC de 30/08.
**Origem:** smoke do Item 5 executado pelo Bob logo após o deploy. Duas falhas observadas no Underground; triagem em três frentes.
**Status:** Frente 3 **encerrada** (abaixo). Frentes 1 e 2 com causa parcial + correção proposta, **aguardando OK antes de qualquer novo deploy** (é produção).

---

## Frente 3 — Impacto financeiro: ENCERRADA (sem impacto)

**Resultado SQL verificado pelo Bob:** nenhuma cobrança nas duas contas — **A = 20 e B = 10 créditos intactos**; **zero reservas novas**. As últimas reservas da conta B são de **abril**, e carregam a assinatura do bug antigo (`reason` nulo + `timeout`) — anteriores ao conserto do `release_reservation` de 29/08, sem relação com este incidente.

**Conclusão:** o `500` do `GET /api/underground` ocorreu **antes de qualquer caminho de crédito**. `GET /api/underground` só lista posts — não reserva, confirma nem libera crédito (o fluxo de crédito vive no `POST /api/spaces/underground/unlock`, que nunca foi alcançado). **Sem impacto financeiro; o fluxo morreu pré-cobrança.** Nada a corrigir nesta frente.

**Observação de saúde (colateral positivo):** o conserto do `release_reservation` fica validado à parte pelo passo bônus do checklist (conta com 2 créditos tentando unlock de 3 → saldo permanece 2, sem reserva presa) — independente deste incidente.

---

## Frente 1 — CSP `worker-src` (front)

### O que está confirmado no código
- A CSP servida em produção (`site/public/_headers:49`, deploy `0181f873`) **não declara `worker-src` nem `child-src`**. Diretivas presentes: `default-src 'self'`, `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://js.stripe.com https://static.cloudflareinsights.com`, etc.
- Pela cascata do CSP nível 3, `worker-src` ausente → cai em `child-src` (ausente) → `script-src`. O `script-src` **não inclui `blob:`**. Logo, **qualquer worker instanciado a partir de `blob:` é recusado**, e a mensagem clássica do Chrome nomeia exatamente `worker-src` como não definido (o rótulo que o Bob usou na triagem).

### O que foi descartado por leitura estática (para não inventar causa)
- **libsodium** (`site/src/crypto/*`): não cria Web Worker (grep sem `new Worker`/`importScripts`).
- **Supabase Realtime**: o `realtime-js` *contém* `new Worker(...)`, mas só o instancia com a opção `worker: true` (default **false**). O nosso client é criado **sem** essa opção (`site/src/services/realtime.js:121-123`, só `realtime.params.eventsPerSecond`). Portanto o worker do realtime **não** é o culpado.
- Único `URL.createObjectURL` de blob no nosso código é áudio em `DebatePanel.jsx:522` (elemento `<Audio>`, **não** Worker).

### Lacuna honesta
Não consegui, só pelo código, apontar **qual** chamada tenta criar o worker bloqueado. Candidato mais provável não descartado: o **service worker do PWA** (`/sw.js`, registrado em `utils/pwa.js:15`) — em alguns navegadores o registro é avaliado contra `worker-src`; sendo same-origin, deveria passar por `'self'`, mas a interação com `default-src`/fallback pode variar. **Preciso da linha exata do console** que o Bob viu (o texto "Refused to create a worker…/…worker-src…" nomeia a URL bloqueada — `blob:` vs `/sw.js` — e fecha a causa raiz).

### Correção proposta (segura e cobre todos os casos)
Adicionar `worker-src` explícito à CSP em `site/public/_headers:49`:

```diff
- ... media-src 'self' blob: https://pub-2485a0b8727445bbb7148e85a0db3edf.r2.dev https://pub-8c2b3eb5b7844c2385d3c09bb63c0fa5.r2.dev https://api.philosify.org; object-src 'none'; base-uri 'self'; form-action 'self';
+ ... media-src 'self' blob: https://pub-2485a0b8727445bbb7148e85a0db3edf.r2.dev https://pub-8c2b3eb5b7844c2385d3c09bb63c0fa5.r2.dev https://api.philosify.org; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self';
```

`'self'` cobre `/sw.js`; `blob:` cobre qualquer worker de blob (realtime se algum dia ligarmos `worker:true`, ou uma dep). Risco baixo — apenas amplia o que é permitido, restrito a origem própria e blob. **Recomendação:** aplicar mesmo assim (é o alvo que o Bob nomeou), e conferir a linha do console em paralelo para registrar a URL exata que estava sendo bloqueada.

---

## Frente 2 — `500` do `GET /api/underground` → deveria ser tratado

### O que está confirmado no código
- O handler `handleGetUndergroundPosts` (`api/src/handlers/underground.js`) tem um **`catch` externo genérico** que devolve **500 `FAILED_TO_LOAD_POSTS`** para *qualquer* exceção e loga **só `err.message`** (`underground.js:201-208`) — **sem stack**. É por isso que o `500` chegou opaco: o erro real está mascarado.
- No caminho feliz, a única adição do DIFF 2 a este handler é a leitura da **meta da sala** com o client de serviço (`underground.js:179-185`). Se essa leitura lançar (rede, credenciais, schema cache do PostgREST não recarregado etc.), o `catch` externo transforma em 500 e **derruba a listagem inteira** — mesmo que os posts já tivessem sido lidos com sucesso.

### Lacuna honesta
Não tenho a **linha de log real** do 500 (`[Underground] List exception: <msg>`), então não afirmo qual foi a exceção específica. O `catch` atual, logando só `err.message`, não deixa isso rastreável — o que é, em si, parte do problema a corrigir.

### Correção proposta (dupla: robustez + diagnóstico)
1. **Isolar a meta da sala para não ser fatal** — se a leitura de `underground_room` falhar, degradar para `roomInitialized:false` em vez de 500ar o feed inteiro:

```diff
-    // Room meta (service client: underground_room is service_role-only).
-    // roomInitialized=false → this client may run room-init (design §2.2).
-    const service = await getServiceSupabase(env);
-    const { data: roomRows } = await service
-      .from("underground_room")
-      .select("key_fingerprint", { limit: 1 });
-    const room = Array.isArray(roomRows) ? roomRows[0] : roomRows;
+    // Room meta (service client: underground_room is service_role-only).
+    // roomInitialized=false → this client may run room-init (design §2.2).
+    // Best-effort: a meta-read failure must NOT take down the whole feed
+    // (it would surface as an opaque 500). Degrade to "not initialized".
+    let room = null;
+    try {
+      const service = await getServiceSupabase(env);
+      const { data: roomRows } = await service
+        .from("underground_room")
+        .select("key_fingerprint", { limit: 1 });
+      room = Array.isArray(roomRows) ? roomRows[0] : roomRows;
+    } catch (metaErr) {
+      console.error("[Underground] room meta read failed (non-fatal):", metaErr.message);
+    }
```

2. **Log com stack no catch externo** (torna o próximo 500 diagnosticável, sem mudar o status):

```diff
   } catch (err) {
-    console.error("[Underground] List exception:", err.message);
+    console.error("[Underground] List exception:", err.message, err.stack);
     return jsonResponse(
       { error: getLocalizedError('FAILED_TO_LOAD_POSTS', lang) },
       500,
```

### Sobre "500 → 4xx tratado"
A correção acima **reduz a superfície de `500` da meta da sala** (ver a correção no **ADENDO 2026-08-30** abaixo: erros HTTP da meta-read já eram **engolidos** pelo client custom, então ela não introduz rota de 500 por erro HTTP — resta apenas o *throw real* de rede/credencial). Se a linha de log do Bob revelar que a exceção real era outra e representa uma **condição de cliente** (ex.: estado inválido de acesso/nickname que deveria ser 4xx), mapeamos para o 4xx correto num segundo ajuste — mas para isso preciso do texto do log. Sem ele, não forço um 4xx sobre um erro cuja natureza não confirmei.

---

---

## ADENDO 2026-08-30 (pós-SQL do Bob) — conta da era de teste e reconciliação da frente 2

**Achado do Bob (SQL, produção):** `r_rachewsky@hotmail.com` é membro da **era de teste** (`space_access` presente) e carrega uma `encrypted_room_key` **não-nula** — cópia **órfã** da era do E2E opcional (a sala nunca nasceu; `underground_room` vazia). Os outros dois da era de teste (`claueppinger@gmail.com`, `rrachewsky@gmail.com`) são **pendentes normais** (sem cópia órfã).

### Cobertura pelo DIFF 3 (front) — sem correção necessária (confirmado no código)
- No load, o GET devolve a `encryptedRoomKey` órfã + o fingerprint real da sala (quando ela nascer).
- `setUndergroundRoomKey` (`site/src/services/crypto.js:549-575`) decifra a cópia, computa o fingerprint e compara com o da sala. Divergindo, executa **exatamente**: `logger.error('[E2E] Underground room key fingerprint MISMATCH — discarding copy')` (`crypto.js:567`) → `discardRoomKeyCandidate` → `return false` → o chamador dispara **rekey → pendente → redistribuição**.
- **Alternativa igualmente válida:** se essa conta carregar **antes** da fundadora, ela **funda a sala** (o `update` do vencedor sobrescreve a cópia órfã) — caminho `roomInit` do `ensureRoomReady`.

### Reconciliação com a frente 2 (o `500`) — rastreamento do handler
Com **exatamente** esse estado (space_access + nickname + `encrypted_room_key` órfã + `underground_room` vazia + 0 posts), `handleGetUndergroundPosts` retorna **HTTP 200**, não 500:
- `underground_room` vazia → `roomRows=[]` → `room=undefined` → `roomInitialized:false`, `roomFingerprint:null` (`underground.js:181-194`). **Não lança.**
- a cópia órfã é apenas **ecoada** em `encryptedRoomKey` (`underground.js:192`). **Não lança.**

### Correção da minha própria hipótese anterior da frente 2
Eu havia escrito que a meta-read "se lançar (… schema cache do PostgREST não recarregado …) 500a o feed". **Verifiquei o client custom:** `select()` em resposta **não-ok NÃO lança** — retorna `{ data:null, error:{…} }` (`api/src/utils/supabase.js:104-109`), e o handler **ignora** esse `error` (só desestrutura `data`, `underground.js:182`). Logo, **schema cache frio / relação inexistente degrada para `roomInitialized:false` → 200**, não 500. A meta-read só 500aria por **throw real** (rejeição de rede no `fetch`, ou `getServiceSupabase` lançando) — transitório e **não** específico desta conta.

### Conclusão do ADENDO
- O SQL **confirma** o estado da conta e a **expectativa client-side** (o log MISMATCH → rekey no primeiro load é **comportamento correto, não falha**).
- O SQL **não explica** o `500` — esse estado retorna 200 pelo código. A causa-raiz do `500` **segue sem fechar por leitura estática**, e agora com razão mais forte: o único ponto novo do caminho engole erros HTTP.
- **Decisivo para fechar:** a linha de log — distinguir `[Underground] Failed to fetch posts` (`underground.js:106`, 500 **tratado** da query de posts) de `[Underground] List exception` (`underground.js:202`, **throw** no catch externo) — mais a **stack** que o diff de diagnóstico adiciona.
- **Impacto na proposta de conserto:** o **log com stack** (`underground.js:202`) passa a ser a peça mais valiosa (revela a exceção real se o `500` reincidir; risco zero). O wrap não-fatal da meta-read vira **defesa em profundidade** (inofensivo) mas, por este rastreamento, **não** teria evitado *este* 500. Aplicar só o log, ou log + wrap, é decisão do Bob.

### Ajuste das EXPECTATIVAS do smoke (Item 5)
- Na conta de teste com cópia órfã (ex.: `r_rachewsky@hotmail.com`), no **primeiro load pós-fix**, é **esperado**: `[E2E] Underground room key fingerprint MISMATCH — discarding copy` seguido de rekey/pendência — **não é falha**.
- Se essa conta carregar **antes** da fundadora, o esperado muda: ela **funda a sala** (log `Room founded by this client`), sobrescrevendo a órfã.
- As outras duas contas da era de teste entram como **pendentes normais** (sem log de MISMATCH).

---

## O que preciso do Bob para fechar 1 e 2 com causa raiz definitiva
1. **Frente 1:** a linha do console do Chrome no momento da falha — o texto "Refused to create a worker from '<URL>' … worker-src …" (mostra se a URL bloqueada é `blob:` ou `/sw.js`).
2. **Frente 2:** a linha de log do `wrangler tail` no momento do 500 — e **qual das duas** ela é: `[Underground] Failed to fetch posts:` (`underground.js:106`, erro na query de posts) ou `[Underground] List exception:` (`underground.js:202`, throw no catch externo). Isso sozinho já aponta o ramo; a stack fecha a causa. (Ou reproduzir com uma conta que tenha acesso, enquanto eu deixo um tail aberto.)

## Proposta de execução (aguardando OK)
- Aplicar os dois diffs (CSP `worker-src` no site; meta-read não-fatal + log com stack no worker).
- `wrangler deploy --dry-run` do worker + build do site.
- Deploy: worker e site (mesma ordem/verificações da seção C do pacote).
- Sem commit e sem deploy até o seu OK.
