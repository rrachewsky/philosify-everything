# Underground: "Timed out loading confessions" só na conta Roberto Rachewsky · diagnóstico 19/09/2026

**Pedido do Bob (19/09):** a conta `rrachewsky` (saldo 197) recebe o timeout de 15 s do `AbortController` no
`GET /api/underground`; a conta Bob carrega o mesmo feed normalmente no mesmo momento. Investigar (1) rede na aba
dela, (2) tail do worker, (3) diferença entre as contas. **Sem deploy.** Nada aplicado; o working tree continua só
com o Bloco 2 (aguardando aceite).

## Veredito (uma linha)

O servidor, o build servido e o service worker estão descartados como causa geral, e o caminho por usuário do
worker está descartado até a consulta de acesso; **a evidência decisiva (a linha de rede do GET na aba dela e o
bundle que essa aba roda) só existe na aba da Roberto, que não está ao meu alcance** — a sonda de 30 segundos da
seção 5 fecha o diagnóstico. A hipótese mais forte é a **mesma do incidente de 14/09** (request preso no lock do
cache HTTP do Chrome) numa aba/perfil que **ainda roda um bundle anterior a 15/09**, quando o `cache:'no-store'`
entrou no cliente.

## 1. O que o print permite concluir (e o que não)

- **"Timed out loading confessions. Please try again."** só sai do ramo `err.name === 'AbortError'` de
  `useUnderground.loadPosts` (`site/src/hooks/useUnderground.js:150-154`). Logo o **fetch não se resolveu em
  15 s** — nem 200, nem 401, nem 403, nem 500. Qualquer resposta do servidor, mesmo erro, produziria outra mensagem.
- **Composer sem "POSTANDO COMO"** não indica apelido ausente. Se o apelido faltasse, o worker responderia
  `{needsNickname:true}` em milissegundos (`underground.js:100-104`) e a tela seria a **NicknameSetup**, não o
  composer. O composer sem identidade é exatamente o estado após o timeout: `myNickname` fica `null`, `posts` fica
  `[]`, `error` recebe a mensagem, e o render principal segue (`UndergroundFeed.jsx:541-560`). O textarea nesse
  estado fica **desabilitado** (`disabled={posting || roomStatus !== 'ready'}`), o que o print deve mostrar.

## 2. Servidor e build: descartados como causa geral (evidência ao vivo, 19/09)

| Checagem | Resultado |
|---|---|
| philosify.org | serve `index-B8BIBVET.js` (deploy `1a5adb74`, 18/09) |
| worker `philosify-api-production` | versão `c6ac9ed4` a 100% (18/09 16:08 UTC) |
| `curl https://api.philosify.org/api/underground` (sem cookie) | `401` em <0,3 s com **`Cache-Control: no-store`** |
| conta Bob, mesma hora | `GET /api/underground` 200 com `posts`, `myNickname`, `roomKey` |
| `GET /api/underground` no cliente | `cache:'no-store'` + abort de 15 s desde **`8907601` (15/09)** |
| service worker `public/sw.js` | pula `/api/` sem `respondWith` (linha 86); `index.html` sempre rede primeiro (linhas 99-117); `skipWaiting` + `clients.claim` |

## 3. Worker: o caminho por usuário do GET, passo a passo

`handleGetUndergroundPosts` (`api/src/handlers/underground.js:71-233`) tem estes `await`s, nesta ordem:

| Passo | Por usuário? | Pode demorar >15 s só para uma conta? |
|---|---|---|
| `getSupabaseForUser` → `getUser(accessToken)` no GoTrue; se o token expirou, `refreshSession` | sim | não: refresh inválido/reusado volta erro em ms → 401, não pendência |
| `space_access` select (`id, nickname`) por `user_id` + RLS | sim | não: `maybeSingle` com 0/1/N linhas responde em ms (N → `access` nulo → 403) |
| `underground_posts` select (30 mais recentes) | não | idêntico para o Bob, que responde |
| `underground_reactions` select por `user_id` + `in(post_id)` | sim | não: 1 post no feed hoje |
| `getRoomKeyForDelivery(env)` | não | idêntico para o Bob |

**Prova de que os dois primeiros passos funcionam para a Roberto:** para o hub mostrar o composer, a aba dela
completou `GET /api/spaces/underground/status` (`CommunityHub` → `isSpaceLocked`), que faz **o mesmo
`getSupabaseForUser` e o mesmo select em `space_access`** (`spaces.js:32-43`). Se auth ou RLS travassem para a
conta dela, o status travaria antes e a aba mostraria o `SpaceLock`, não o composer. Sobram os passos idênticos ao
Bob — que respondem. Não há caminho no worker que fique 15 s pendente para um usuário e 300 ms para outro.

## 4. O que ficou fora do alcance — e por quê

- **(1) Rede na aba dela.** A extensão só enxerga abas do grupo que ela mesma cria no perfil do Chrome do Bob; a
  sessão da Roberto está em outro perfil/janela/navegador. Sem a aba não vejo o status nem o tempo do GET.
- **(2) Tail do worker.** `wrangler tail --env production` falha nesta máquina em DNS:
  `getaddrinfo ENOTFOUND tail.developers.workers.dev` (o `nslookup` dá timeout; em 14/09 o tail já tinha falhado
  por outro motivo). O worker **não tem `[observability]`** no `wrangler.toml`, então também não há Workers Logs
  retidos no painel para consultar depois do fato.
- **(3) `space_access` da Roberto.** Não há `.dev.vars` nem chave de serviço nesta máquina; o endpoint de status
  devolve só `hasAccess/unlockedAt` (sem apelido). Conferência de 10 s pelo Bob no Supabase: *Table Editor →
  `space_access` → filtro `space = underground`* — a linha da Roberto deve existir, única, com `nickname`
  preenchido. (Se `nickname` for nulo, a tela dela seria a NicknameSetup, não o composer — ver §1.)

## 5. Sonda decisiva (30 s, na aba da Roberto, F12 → Console) — colar inteiro

```js
(async () => {
  const bundle = [...document.scripts].map(s => s.src.split('/').pop()).filter(s => /^index-/.test(s));
  const sw = navigator.serviceWorker?.controller ? 'ativo' : 'nenhum';
  const t = async (cache) => { const t0 = performance.now(); const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 15000);
    try { const r = await fetch('https://api.philosify.org/api/underground', { credentials: 'include', cache, signal: ac.signal });
      const j = await r.json(); return `${r.status} em ${Math.round(performance.now() - t0)}ms · needsNickname=${!!j.needsNickname} · myNickname=${j.myNickname ?? '-'} · posts=${(j.posts||[]).length}`; }
    catch (e) { return `${e.name} aos ${Math.round(performance.now() - t0)}ms`; } finally { clearTimeout(timer); } };
  console.log('bundle:', bundle.join(', ') || '(nenhum index-*.js?)', '| SW:', sw, '| UA:', navigator.userAgent.slice(0, 60));
  console.log('no-store :', await t('no-store'));
  console.log('default  :', await t('default'));
})();
```

Leitura do resultado:

| bundle | no-store | default | Diagnóstico | Ação |
|---|---|---|---|---|
| **≠ `index-B8BIBVET.js`** | 200 em ms | AbortError | aba antiga (bundle pré-15/09, `cache:'default'`) presa no lock do cache — o cenário de 14/09 | fechar a aba e abrir de novo (ou Ctrl+Shift+R); nada de código |
| `index-B8BIBVET.js` | 200 em ms | AbortError | bundle atual; o request do hook deveria estar passando — reportar, porque então o timeout vem de outro request do hook | investigar o Network dela: qual request ficou *pending* |
| `index-B8BIBVET.js` | **AbortError** | AbortError | o request sai do navegador e o **servidor não responde para esta conta** | é o único caso que pede o worker: aplicar o diff da §6 e ler os tempos por passo |
| qualquer | 401/403 em ms | idem | sessão/acesso da conta — a mensagem da tela seria outra, então não é este caso | relogar / conferir `space_access` |

Também vale abrir a aba **Network** dela filtrando `underground`: a linha do GET com status *(pending)* até 15 s e
depois *(canceled)* confirma que o request **nunca recebeu cabeçalho de resposta**; `Size = (disk cache)` ou
*"Waiting (TTFB)"* zerado indicam o lock do cache.

## 6. Diff diagnóstico (NÃO aplicado, NÃO deployado — para OK do Bob)

Não há evidência que justifique mudar o comportamento do feed. O que falta é **instrumentação**: como o tail não
funciona daqui e não há logs retidos, propor (a) Workers Logs no ambiente de produção e (b) tempo por passo no GET
do feed, para a próxima ocorrência ficar diagnosticável pelo painel (Workers & Pages → philosify-api → Logs).

```diff
--- a/api/wrangler.toml
+++ b/api/wrangler.toml
@@ [env.production]
 [env.production]
+[env.production.observability]
+enabled = true
+head_sampling_rate = 1
```

```diff
--- a/api/src/handlers/underground.js
+++ b/api/src/handlers/underground.js
@@ export async function handleGetUndergroundPosts(request, env, origin) {
   let lang = 'en';
+  // Step timings for the "one account times out" investigation (19 Sep):
+  // read in Workers Logs as [Underground] GET timings ...
+  const t0 = Date.now();
+  const marks = [];
+  const mark = (label) => marks.push(`${label}=${Date.now() - t0}ms`);
   const auth = await getSupabaseForUser(request, env);
+  mark('auth');
   if (!auth) {
@@
       .eq("space", "underground")
       .maybeSingle();
+    mark('access');

     if (!access) {
@@
     const { data: posts, error } = await query;
+    mark('posts');

     if (error) {
@@
       userReactions = reactions || [];
     }
+    mark('reactions');
@@
     try {
       roomKey = await getRoomKeyForDelivery(env);
     } catch (keyErr) {
@@
     }
+    mark('roomKey');
+    console.log(`[Underground] GET timings user=${String(userId).slice(0, 8)} ${marks.join(' ')}`);

     let response = jsonResponse(
```

Custo: 9 linhas no handler, 3 no toml; nada muda na resposta. O `userId` vai truncado (8 caracteres) para
correlacionar sem expor o id inteiro nos logs.

## 7. Estado

- Nada aplicado, nada deployado. Working tree: só o Bloco 2 (aguardando aceite) + este relatório.
- Próximo passo depende da sonda da §5 na aba da Roberto. Se cair na linha 3 da tabela, OK do Bob para o diff da §6 →
  deploy do worker → ler os tempos por passo com a Roberto recarregando o feed.
