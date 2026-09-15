# Underground preso em "CARREGANDO CONFISSÕES…" só no Chrome · diagnóstico 14/09

**Status:** DIAGNÓSTICO FECHADO + DIFF PARA OK — nada aplicado. **Bob (14/09): "Destravou"** com a ação imediata
(fechar a aba presa / hard reload) — confirma o lock do cache do Chrome como mecanismo. O conserto durável (a)+(b)
segue aguardando OK; sem ele o cenário volta na próxima vez que um request dessas rotas ficar preso. Bob: mesma conta (bob@bobrach.com), Edge normal,
Chrome preso. Reproduzido na extensão (aba nova no mesmo perfil do Chrome) **em 4 cargas seguidas**.

## Veredito (uma linha)
**Não é bundle velho nem SW nem servidor: é o lock de entrada do cache HTTP do Chrome** — um request antigo de
`GET /api/underground` (e de `/api/dm/conversations`) ficou pendente no perfil (a aba travada do Bob), e todo
request novo para a **mesma URL em `cache:'default'`** (o que o hook usa) fica na fila desse lock indefinidamente;
o mesmo request com `cache:'no-store'` responde em ~270ms. O Edge tem cache próprio, sem o request preso.

## Evidência, na ordem em que foi colhida

1. **Bundle atual, não cache velho.** Scripts carregados: `index-DXMZXeKC.js` + `CommunityPage-BsQptSzL.js` +
   `CommunityPage-C12l92h6.css` = deploy **79d904a0** (o último). SW `sw.js` ativo, caches `philosify-v13` /
   `philosify-runtime-v12` (as versões do repo). `waiting:false, installing:false`.
2. **Rede no load (todas 200, exceto duas):** `/auth/session` ×10, `/auth/realtime-token` ×10,
   `/api/spaces/underground/status` 200, `/api/crypto/keys` 200, `/api/config` 200 —
   **`GET /api/underground` = pending**, **`GET /api/dm/conversations` ×2 = pending**. Sem 401/500. Console: vazio
   (logger silenciado em prod; nenhum erro vermelho/CSP).
3. **Pending é eterno:** o request do hook seguia *pending* após >4 minutos (sem 524 do Cloudflare → nunca saiu do
   Chrome para a rede).
4. **Servidor OK:** `curl` sem cookie → `/api/underground` 401 em 0,24s, `/api/dm/conversations` 401 em 0,26s.
   Na página, `credentials:'omit'` → 401 em 60ms.
5. **Fetch autenticado da própria página, 82s após o load, enquanto o do hook seguia pendente:**
   `GET /api/underground` (URL idêntica) **200 em 471ms**; `dm/conversations` 200 em 490ms.
   → o servidor entrega; o request emitido no load é que está preso no cliente.
6. **SW descartado:** desregistrei o SW e recarreguei — `navigator.serviceWorker.controller === null` e o
   `/api/underground` do hook **travou do mesmo jeito**. (E o `sw.js:86` já pula `/api/` sem `respondWith`.)
7. **Prova do mecanismo (mesma aba, concorrente, timeout 15s):**

   | URL | `cache` | Resultado |
   |---|---|---|
   | `/api/underground` | `default` (o que `undergroundService.getPosts` usa) | **AbortError aos 15,7s** |
   | `/api/underground` | `no-store` | **200 em 266ms** |
   | `/api/underground` | `reload` (= Ctrl+Shift+R) | 200 em 815ms |
   | `/api/dm/conversations` | `default` | **AbortError aos 15,7s** |
   | `/api/dm/conversations` | `no-store` | **200 em 297ms** |

   Só o modo que consulta/escreve a entrada do cache trava. É a fila do *cache lock* do Chrome atrás de um
   *writer* que nunca terminou.
8. **Por que a API entra no cache:** `jsonResponse` (`api/src/utils/response.js:11-27`) **não manda
   `Cache-Control`** — `/api/health` ao vivo: só `Content-Type`, `Vary: Origin`, `X-Content-Type-Options`. Sem
   `no-store`, o Chrome trata a resposta como cacheável por heurística, cria entrada por URL e submete requests
   iguais ao lock. **29 GETs** em `site/src/services/api/*.js` vão sem `cache:` (modo `default`).
9. **De onde veio o *writer* preso:** por volta de 13:36 UTC os meus três primeiros probes (abortados aos 8s)
   terminaram, segundo o rastreador da extensão, em **503** — um soluço transitório do lado servidor nessas duas
   rotas (as duas mais pesadas: várias idas ao Supabase). Um request que fica minutos sem cabeçalho de resposta
   segura a entrada do cache; todos os seguintes para a mesma URL enfileiram. O Edge não passou por isso (cache
   separado). Não consegui capturar o log do worker (`wrangler tail` crasha no Windows: `Assertion failed:
   !(handle->flags & UV_HANDLE_CLOSING)`), então a origem do 503 fica como observação do rastreador, não como
   prova de servidor.

**Item 1 do pedido (hard reload):** vai destravar — **não** por bundle (já é o atual), mas porque Ctrl+Shift+R
usa `cache:'reload'`, que passa ao lado do lock (linha `reload` da tabela). Fechar a(s) aba(s) travada(s) do
Chrome também solta o lock.

## Achado colateral (registrar, não é a causa)
`useAuth` é um **hook**, não um contexto: **46 consumidores** (`grep useAuth()`), cada um com seu `checkSession()` no
mount e seu `fetchRealtimeToken()` → **10× `/auth/session` + 10× `/auth/realtime-token` por carga de página**. Todas
200; não trava nada hoje, mas é churn de refresh de sessão no worker e no Supabase Auth. Fila de higiene.

## Fix proposto (para OK; nada aplicado)

Princípio: resposta de API privada **nunca** entra em cache HTTP, nem no navegador nem em intermediário. Dois lados,
belt-and-braces; o do servidor é o que elimina a classe inteira do problema.

### (a) Servidor — `api/src/utils/response.js` (`jsonResponse`)
```diff
   return new Response(JSON.stringify(data, null, 2), {
     status,
     headers: {
       'Content-Type': 'application/json',
+      // Private API JSON: never cached by browser/intermediaries. Also keeps
+      // Chrome from creating per-URL cache entries whose lock queues identical
+      // GETs behind a stalled writer (Underground "loading forever", 14 Sep).
+      'Cache-Control': 'no-store',
       // HSTS is included via getCorsHeaders() spread below — no duplicate needed
       ...cors
     }
   });
```
Efeito: deploy do worker (`cd api && wrangler deploy --env production`). `errorResponse` reutiliza `jsonResponse`?
(conferir antes de aplicar; se não, mesmo header lá). Sem efeito em `/api/health` além do header.

### (b) Cliente — os dois GETs afetados, `cache:'no-store'` (mínimo; espelho do que foi medido)
`site/src/services/api/underground.js:52-55`
```diff
   const response = await fetch(url.toString(), {
     method: 'GET',
     credentials: 'include',
+    cache: 'no-store', // bypass HTTP cache lock (Chrome queues identical GETs behind a stalled writer)
   });
```
`site/src/services/api/dm.js:27-30`
```diff
   const res = await fetch(`${API_BASE}/dm/conversations`, {
     method: 'GET',
     credentials: 'include',
+    cache: 'no-store',
   });
```
Os outros 27 GETs de `services/api/*.js` ficam cobertos pelo (a) assim que o worker for deployado; padronizar
`cache:'no-store'` neles é higiene para a fila (um wrapper `apiFetch` seria o lugar certo — fora deste conserto).

### (c) Opcional — `useUnderground.loadPosts` sem timeout
Hoje um fetch que nunca resolve deixa `loading` eterno (`useUnderground.js:125-148`). Um `AbortController` de ~15s
convertendo em `error` ("não foi possível carregar — tente de novo") transforma travamento em mensagem. Não é
necessário para o defeito de hoje; registro.

## Aceite proposto
1. Bob: fechar a aba travada do Chrome (ou Ctrl+Shift+R nela) → Underground carrega (destrava o lock hoje).
2. Após OK e deploy de (a)+(b): abrir Underground numa aba normal do Chrome (F5 simples, não hard reload) →
   carrega; DevTools → Network → `/api/underground` com `Cache-Control: no-store` na resposta.
3. Edge: inalterado.
