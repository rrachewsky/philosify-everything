# Bloco 3 (a) — useAuth: hook → AuthProvider único · diff para OK · 19/09/2026

**Pedido do Bob:** 46 consumidores de `useAuth()` disparam ~10× `GET /auth/session` + `/auth/realtime-token` por
carga. Refatorar para um `AuthProvider` único (mesma API pública do hook — consumidores não mudam de código, só de
fonte), uma chamada por carga, estado compartilhado. Medir antes/depois no Network (Community). Item de maior risco
do bloco: diff inteiro + plano de teste explícito. **Nada aplicado, nada deployado** — o patch foi aplicado só para
lint + build e revertido; `git apply --check` limpo sobre `233d9e7`.

## 1. Medição "antes" (produção, sessão do Bob, uma carga de `/community`, 19/09)

| Request | Chamadas numa carga |
|---|---|
| `GET /auth/session` | **8** |
| `GET /auth/realtime-token` | **8** |
| `GET /api/dm/conversations` | 2 (fora do escopo desta etapa — dois `useDM` montados; anotado) |
| `GET /api/config`, `/api/people`, `/api/spaces/underground/status`, `POST /api/crypto/keys` | 1 cada |

Mecanismo: cada `useAuth()` é uma **instância completa** da máquina de estado (session check no mount + token de
realtime + listeners de `visibilitychange`/`auth-changed`). Na Community estão montados ao mesmo tempo
`CreditsProvider`, `CommunityPage`, `CommunityHub`, `NavAccount`, `useCommunity`, `useDM` (×2), `useDMUnreadCount`,
`usePresence`, `useCrypto`, `useUnderground`… — 8 instâncias vivas = 8 sessões + 8 tokens. E **cada troca de aba**
do navegador dispara 8 `checkSession` de novo (listener de visibilidade por instância).

Alvo "depois": **1 × `/auth/session`** e **1 × `/auth/realtime-token`** por carga. Medido após o deploy, mesmo
método (Network da extensão, filtro `api.philosify.org`, carga de `/community`).

## 2. Desenho

| Peça | Antes | Depois |
|---|---|---|
| Máquina de estado (session, token, OAuth callback, listeners, ações) | dentro de `hooks/useAuth.js`, uma cópia por consumidor | **`contexts/AuthContext.jsx`** — `useAuthState()` (o mesmo corpo, movido) + `AuthProvider` |
| `hooks/useAuth.js` | a máquina | **consumidor do contexto**: `useContext(AuthContext)` + `loading`/`error` por instância em torno das ações |
| Árvore | `Language > Credits > Router` | `Language > **Auth** > Credits > Router` (`main.jsx`) — `CreditsProvider` já lia `useAuth()`; continua, agora do contexto |
| Barrel `contexts/index.js` | — | exporta `AuthProvider`, `AuthContext` |
| Consumidores (46) | `import { useAuth } from '…/hooks/useAuth'` / `'@/hooks'` | **inalterados** (mesmo caminho, mesma API, mesmos nomes de campo) |

### API pública preservada, campo a campo

`user`, `sessionBalance`, `realtimeToken`, `loading`, `error`, `isAuthenticated`, `signIn`, `signInWithGoogle`,
`signUp`, `signOut`, `resetPassword`, `updatePassword`, `refreshSession`. Conferido contra o que os 46 consumidores
desestruturam (`user` ×29, `isAuthenticated` ×22, `loading` ×7, `signOut`/`signInWithGoogle` ×4, …).

### Semântica de `loading`/`error`: mantida por instância (decisão de desenho)

Hoje `loading` e `error` são **por instância**: um `signIn` disparado pelo `LoginModal` só põe `loading=true` nele;
`IdeasPage`/`QuizPage`/`PaymentSuccess`, que fazem gate em `authLoading`, não piscam. Um contexto ingênuo tornaria
isso global (a Ideias mostraria o skeleton durante um login no modal). Solução: o contexto expõe **`loading` =
"sessão inicial ainda não resolvida"** (global, o que interessa ao primeiro paint), e `useAuth()` embrulha as seis
ações com um `pending`/`error` **locais** — `loading` devolvido = `ctx.loading || pending`. Comportamento idêntico
ao de hoje para cada consumidor, inclusive o `signInWithGoogle` (fica em loading até o redirect).

### Três mudanças mecânicas dentro do corpo movido (exigidas pelo lint do repo)

O `eslint` do site roda as regras novas de `react-hooks` (compilador). No arquivo movido elas passaram a acusar dois
padrões que o hook antigo já tinha; corrigidos sem mudar comportamento:

1. **Recursão de `fetchRealtimeToken`** (timers de backoff/pré-expiração e o retry pós-refresh chamavam a própria
   const antes da declaração) → agora via `fetchRealtimeTokenRef.current` (ref atualizada num `useEffect`).
2. **`useEffect` sobre `user` que chamava `fetchRealtimeToken()`/`setRealtimeToken(null)`** (setState no corpo
   do efeito) → vira `applyUser(nextUser)`: **a mesma lógica**, executada no ponto em que o usuário é definido
   (`checkSession`, OAuth, `signIn`, `signUp`, `signOut`). Mesma comparação por `user.id`; um render a menos.
3. As cinco callbacks que passaram a usar `applyUser` o listam nos deps (é estável: dep única `fetchRealtimeToken`, `[]`).

Resultado: os 4 arquivos tocados lintam com **0 erros, 0 avisos**. O repo inteiro (`eslint src`) tem uma
**baseline pré-existente de 74 erros e 3 avisos em 34 arquivos** no HEAD (`no-unused-vars`, `no-undef`,
`set-state-in-effect`… — nenhum nos 4 arquivos desta etapa; lista em `scratchpad/eslint_head.json`), e com o patch
aplicado o total é **o mesmo: 77** — zero problemas novos. Build ok (`index-3zFarSkC.js`, 1m35s).

### Fora do escopo, anotado

- `useCinemaSidebar.js:18` desestrutura `refreshBalance` de `useAuth()`, que **nunca existiu** no hook → é
  `undefined` hoje e continua (não muda nesta etapa; candidato a limpeza).
- `GET /api/dm/conversations` ×2 por carga (dois `useDM`): mesmo padrão, outro hook — fica para depois se o Bob quiser.

## 3. Plano de teste (produção, após o deploy — antes do commit)

| # | Cenário | Como | Esperado |
|---|---|---|---|
| T1 | **Carga fria logado** (`/community`) | Network da extensão, filtro `api.philosify.org` | **1** `/auth/session`, **1** `/auth/realtime-token`; header com e-mail + saldo; abas da Community carregam |
| T2 | **Carga deslogado** (`/`, janela anônima do devtools) | idem | 1 `/auth/session` (401/`user:null`), **0** `/auth/realtime-token`; landing com "Entrar" |
| T3 | **Login** por e-mail/senha (`/signin`) | Bob digita; eu observo | botão em loading só no form; header troca para logado sem F5; 1 `/auth/realtime-token` após o login; redirect para `from` |
| T4 | **Login Google** | Bob clica | redirect; na volta (`?code=`), 1 `exchange-code`, header logado, URL limpa |
| T5 | **Logout** (`NavAccount`) | eu clico | header volta a "Entrar"; `destroyRealtimeClient`; nenhuma chamada 401 em loop |
| T6 | **Refresh** (F5 logado) | eu | igual a T1 |
| T7 | **Troca de aba do navegador** (ir e voltar) | eu, contando `/auth/session` | **1** por retorno (era 8) |
| T8 | **Expiração** do token de realtime | esperar o timer pré-expiração (`expiresAt − 60 s`) ou forçar `visibilitychange` | 1 `/auth/realtime-token` novo; realtime da Community continua recebendo (post/DM ao vivo) |
| T9 | **Cookie expirado → 401 + refresh** | em aba parada >1 h, voltar | 1 `POST /auth/refresh`, 1 `realtime-token` bem-sucedido; sem loop (backoff limitado a 6) |
| T10 | **Header nos 18 idiomas** | trocar idioma pelo seletor, logado | e-mail/saldo/"Sair" corretos em cada um; nenhuma chamada extra de auth por troca de idioma |
| T11 | **Páginas com gate em `authLoading`** (`/ideas`, `/quiz`, `/payment-success`) | carregar logado e deslogado | sem skeleton eterno; sem flash de "deslogado" após a sessão resolver |
| T12 | **Fluxos de senha** (`/reset-password`, AccountModal → trocar senha) | Bob | loading/erro só no form; sucesso como hoje |
| T13 | **Pagamento** (`PaymentSuccess`) | opcional, se houver compra no ciclo | `user` disponível antes de `credits-changed`; saldo atualiza |

Critério de aceite: T1, T2, T5, T6, T7, T10, T11 obrigatórios; T3/T4/T12 dependem do Bob digitar credenciais
(não faço login por conta própria). T8/T9 são de observação passiva.

## 4. Sequência após o OK

`git apply` do patch → `eslint` + build → deploy Pages `--branch=production` (só site; a API não muda) → medição
"depois" (T1) + capturas → T2…T12 → aceite → commit `"auth: provider unico (uma sessao e um token por carga)"`
ou o texto que o Bob der → push → hash. Rollback: redeploy do `1a5adb74`.

## 4a. Execução (OK do Bob, 19→20/09/2026)

**Aplicado e deployado.** `git apply` limpo sobre `233d9e7`; eslint dos 4 arquivos tocados 0/0;
build ok (`index-3zFarSkC.js`, 17,6 s); Pages `--branch=production` → deployment
`691468b1-1b7a-42ed-8003-83256f305528` (https://691468b1.philosify-frontend.pages.dev).
Verificado no browser que philosify.org serve `index-3zFarSkC.js` (o curl bate no desafio do
Cloudflare e não serve para isso). Rollback: redeploy do `1a5adb74`.

**Medição "depois"** (Network da extensão, filtro `api.philosify.org`, carga fria de `/community`, logado):

| Request | Antes | Depois |
|---|---|---|
| `GET /auth/session` | 8 | **1** |
| `GET /auth/realtime-token` | 8 | **1** |
| `GET /api/dm/conversations` | 2 | 2 (fora do escopo; na fila) |

Lista completa da carga: session, realtime-token, people, spaces/underground/status, dm/conversations ×2, config, crypto/keys (POST). Repetido duas vezes (aba oculta e aba visível), mesmo resultado. Console sem erros.

**Resultados do plano** (obrigatórios: T1, T2, T5, T6, T7, T10, T11):

| # | Resultado | Evidência |
|---|---|---|
| T1 | ✅ | 1 session + 1 token; header `PT · 18 · SALDO: 8 · BOB@BOBRACH.COM`; abas da Community carregam. Captura 01. |
| T2 | ✅ | `/` deslogado: 1 `/auth/session` (200, user null), **0** realtime-token; header `ENTRAR · CADASTRAR`. Captura 03. |
| T5 | ✅ | "Sair" no NavAccount: `POST /auth/signout` + 1 rechecagem `/auth/session`; header volta a Entrar/Cadastrar; nenhuma chamada nos 6 s seguintes (sem loop). Obs.: o clique por referência da extensão não disparou o handler; o clique real no `<a>` do menu (via DOM) disparou normalmente. |
| T6 | ✅ | F5 logado = T1 (1 + 1), sessão preservada. |
| T7 | ✅ | `visibilitychange` com `visibilityState === 'visible'` disparado no documento: `/auth/session` 1 → 2 (delta **1**, era 8); nenhum token novo (mesmo `user.id`). A aba da extensão fica oculta, por isso o evento foi disparado no documento em vez de alternar abas de verdade; o listener é o mesmo. |
| T10 | ✅ | 18 idiomas pelo seletor real do header (EN ES DE FR IT HU ZH JA KO RU HE AR HI FA NL PL TR PT): e-mail e saldo corretos em todos (`BALANCE/SALDO/GUTHABEN/SOLDE/EGYENLEG/余额/残高/잔액/БАЛАНС/יתרה/الرصيد/शेष/موجودی/BAKİYE…`); contagem de auth **não subiu** em nenhuma troca (session=2 e token=1 constantes, os 2 são T1 + T7). Idioma restaurado para PT. |
| T11 | ✅ | Logado: `/ideas` e `/quiz` renderizam conteúdo (colóquios; quiz + ranking), 0 skeleton, 1 + 1. Deslogado: `/ideas` mostra "LOGIN NECESSÁRIO" e `/quiz` a tela pública, 0 skeleton, 1 session + 0 token, sem flash. `/payment-success` sem `session_id` logado: espera a sessão, não mostra `signInRequired`, vai para `/` em <1,2 s. Capturas 02 e 04. |
| T3 | ⏳ Bob | aba deixada em `/signin`, rede zerada para observação |
| T4 | ⏳ Bob | opcional |
| T8/T9 | passivo | não observado neste ciclo (timer pré-expiração / cookie >1 h) |
| T12 | ⏳ Bob | se necessário |
| T13 | — | sem compra no ciclo |

Capturas em `new_design/printscreen_bloco3a_2026-09-19/` (01 T1 community logado, 02 T11 quiz logado, 03 T2 landing deslogado, 04 T11 quiz deslogado).

**Fila registrada (ordem do Bob):**
- `useCinemaSidebar.js:18` desestrutura `refreshBalance` do `useAuth`, que nunca existiu (limpeza).
- `useDM` dispara `GET /api/dm/conversations` 2× por carga da Community (candidato ao mesmo padrão provider).

## 5. Diff completo (`new_design/BLOCO3_A_AUTH_PROVIDER_2026-09-19.patch`)

`git diff --stat`: 4 arquivos — `site/src/contexts/AuthContext.jsx` (novo), `site/src/hooks/useAuth.js`,
`site/src/main.jsx`, `site/src/contexts/index.js`. O corpo grande é a **mudança de arquivo** do hook
(`useAuth.js` → `AuthContext.jsx`); as mudanças reais dentro dele são as três da §2 mais a remoção de
`setLoading/setError` das ações.

```diff
diff --git a/site/src/contexts/AuthContext.jsx b/site/src/contexts/AuthContext.jsx
new file mode 100644
index 0000000..2d0b781
--- /dev/null
+++ b/site/src/contexts/AuthContext.jsx
@@ -0,0 +1,422 @@
+// ============================================================
+// AuthContext - single authentication state for the whole app
+// ============================================================
+// Ruling 19 Sep 2026 (Bloco 3a): the auth state machine used to live inside
+// the useAuth hook, so every consumer (46 call sites) ran its own copy —
+// ~8 GET /auth/session + ~8 GET /auth/realtime-token per page load. It now
+// runs ONCE here; hooks/useAuth.js reads this context. Public API of
+// useAuth() is unchanged (consumers keep their code, only the source moves).
+//
+// Uses HttpOnly cookie auth via backend proxy.
+// Realtime token fetched from dedicated /auth/realtime-token endpoint.
+// Token stored in memory only, refreshed on timer before expiry.
+
+import { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
+import { logger } from '@/utils';
+import { authService } from '@/services/auth';
+import { getApiUrl } from '@/config';
+import { setRealtimeAuth, destroyRealtimeClient } from '@/services/realtime.js';
+import i18n from '@/i18n/config';
+
+const AuthContext = createContext(null);
+
+// The former hook body, unchanged except that actions no longer touch the
+// shared `loading`/`error` (those are per-consumer, see hooks/useAuth.js).
+// `loading` here means: the initial session check has not resolved yet.
+function useAuthState() {
+  const [user, setUser] = useState(null);
+  const [sessionBalance, setSessionBalance] = useState(null);
+  const [realtimeToken, setRealtimeToken] = useState(null);
+  const [loading, setLoading] = useState(true);
+  const mountedRef = useRef(true);
+  const refreshTimerRef = useRef(null);
+  const prevUserIdRef = useRef(null);
+  const rtBackoffRef = useRef(0); // exponential-backoff attempt counter for realtime-token
+  const fetchRealtimeTokenRef = useRef(null); // latest fetchRealtimeToken, for timers/retry
+
+  // Fetch realtime token from dedicated endpoint and schedule refresh.
+  // On 401 (stale cookie) try a one-shot session refresh then retry; if it
+  // still fails, use bounded exponential backoff so a stale session can't spin
+  // an unthrottled 401 loop. Success resets the backoff.
+  const fetchRealtimeToken = useCallback(async (afterRefresh = false) => {
+    const MAX_BACKOFF_ATTEMPTS = 6;
+    const scheduleBackoff = () => {
+      if (!mountedRef.current) return;
+      const attempt = rtBackoffRef.current;
+      if (attempt >= MAX_BACKOFF_ATTEMPTS) return; // give up until next auth/visibility event
+      rtBackoffRef.current = attempt + 1;
+      const delay = Math.min(30000, 1000 * 2 ** attempt);
+      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
+      refreshTimerRef.current = setTimeout(() => fetchRealtimeTokenRef.current?.(), delay);
+    };
+
+    try {
+      const res = await fetch(`${getApiUrl()}/auth/realtime-token`, {
+        credentials: 'include',
+      });
+
+      // Stale cookie — try one session refresh, then retry immediately.
+      if (res.status === 401 && !afterRefresh) {
+        const refreshed = await fetch(`${getApiUrl()}/auth/refresh`, {
+          method: 'POST',
+          credentials: 'include',
+        })
+          .then((r) => r.ok)
+          .catch(() => false);
+        if (refreshed && mountedRef.current) {
+          return fetchRealtimeTokenRef.current?.(true);
+        }
+      }
+
+      if (!res.ok) {
+        logger.warn('[useAuth] Realtime token fetch failed:', res.status);
+        if (mountedRef.current) setRealtimeToken(null);
+        scheduleBackoff();
+        return;
+      }
+
+      const { token, expiresAt } = await res.json();
+
+      if (mountedRef.current && token) {
+        rtBackoffRef.current = 0; // success resets backoff
+        setRealtimeToken(token);
+        // Update the shared Realtime client (no WebSocket teardown)
+        setRealtimeAuth(token);
+
+        // Schedule refresh 60s before expiry
+        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
+        if (expiresAt) {
+          const nowSeconds = Math.floor(Date.now() / 1000);
+          const refreshInMs = Math.max((expiresAt - nowSeconds - 60) * 1000, 10000);
+          refreshTimerRef.current = setTimeout(() => {
+            logger.log('[useAuth] Refreshing realtime token (pre-expiry)');
+            fetchRealtimeTokenRef.current?.();
+          }, refreshInMs);
+        }
+      }
+    } catch (err) {
+      logger.warn('[useAuth] Realtime token fetch error:', err.message);
+      if (mountedRef.current) setRealtimeToken(null);
+      scheduleBackoff();
+    }
+  }, []);
+
+  useEffect(() => {
+    fetchRealtimeTokenRef.current = fetchRealtimeToken;
+  }, [fetchRealtimeToken]);
+
+  // Set the user and keep the realtime token in step with it. Compare user
+  // IDs to avoid redundant fetches when checkSession creates a new object
+  // reference for the same user (e.g. on every tab focus).
+  const applyUser = useCallback(
+    (nextUser) => {
+      setUser(nextUser);
+      if (nextUser) {
+        if (nextUser.id !== prevUserIdRef.current) {
+          prevUserIdRef.current = nextUser.id;
+          rtBackoffRef.current = 0; // fresh session — reset backoff
+          fetchRealtimeToken();
+        }
+      } else {
+        prevUserIdRef.current = null;
+        rtBackoffRef.current = 0;
+        // Clear token and timer when user is null (logged out)
+        setRealtimeToken(null);
+        if (refreshTimerRef.current) {
+          clearTimeout(refreshTimerRef.current);
+          refreshTimerRef.current = null;
+        }
+      }
+    },
+    [fetchRealtimeToken],
+  );
+
+  // Check session on mount and when tab becomes visible
+  const checkSession = useCallback(async () => {
+    try {
+      const { user: sessionUser, balance } = await authService.getSession();
+      if (mountedRef.current) {
+        applyUser(sessionUser);
+        // Always sync sessionBalance — clear it on logout so stale data doesn't persist
+        setSessionBalance(balance || null);
+      }
+    } catch (err) {
+      logger.error('[useAuth] Session check failed:', err);
+      if (mountedRef.current) {
+        applyUser(null);
+        setSessionBalance(null);
+        setRealtimeToken(null);
+      }
+    }
+  }, [applyUser]);
+
+  // Handle OAuth callback on the frontend
+  // Detects two scenarios:
+  // 1. PKCE flow: ?code=xxx in query params → send to /auth/exchange-code (tokens never in URL)
+  // 2. Implicit fallback: #access_token=xxx in hash → send to /auth/exchange
+  const handleOAuthCallback = useCallback(async () => {
+    // --- PKCE flow: ?code= in query params ---
+    const urlParams = new URLSearchParams(window.location.search);
+    const code = urlParams.get('code');
+
+    if (code) {
+      logger.log('[useAuth] Detected PKCE code in URL, exchanging...');
+      // Clean the URL immediately (remove ?code= but keep path)
+      window.history.replaceState(null, '', window.location.pathname);
+
+      try {
+        const res = await fetch(`${getApiUrl()}/auth/exchange-code`, {
+          method: 'POST',
+          headers: { 'Content-Type': 'application/json' },
+          // language: sets preferred_language for OAuth users (whose metadata has
+          // none) so their localized auth emails (incl. password reset) match the UI.
+          body: JSON.stringify({ code, language: i18n.language || 'en' }),
+          credentials: 'include', // sends pkce_id cookie
+        });
+
+        if (!res.ok) {
+          logger.error('[useAuth] PKCE code exchange failed:', res.status);
+          return false;
+        }
+
+        const data = await res.json();
+        if (mountedRef.current && data.user) {
+          applyUser(data.user);
+          window.dispatchEvent(new CustomEvent('auth-changed'));
+          logger.log('[useAuth] PKCE code exchange successful');
+        }
+        return true;
+      } catch (err) {
+        logger.error('[useAuth] PKCE code exchange error:', err.message);
+        return false;
+      }
+    }
+
+    // --- Implicit fallback: #access_token= in hash ---
+    const hash = window.location.hash;
+    if (!hash || !hash.includes('access_token=')) return false;
+
+    const hashParams = new URLSearchParams(hash.substring(1));
+    const accessToken = hashParams.get('access_token');
+    const refreshToken = hashParams.get('refresh_token');
+
+    if (!accessToken || !refreshToken) return false;
+
+    logger.log('[useAuth] Detected OAuth tokens in URL hash, exchanging...');
+    window.history.replaceState(null, '', window.location.pathname + window.location.search);
+
+    try {
+      const res = await fetch(`${getApiUrl()}/auth/exchange`, {
+        method: 'POST',
+        headers: { 'Content-Type': 'application/json' },
+        body: JSON.stringify({
+          access_token: accessToken,
+          refresh_token: refreshToken,
+          language: i18n.language || 'en',
+        }),
+        credentials: 'include',
+      });
+
+      if (!res.ok) {
+        logger.error('[useAuth] OAuth token exchange failed:', res.status);
+        return false;
+      }
+
+      const data = await res.json();
+      if (mountedRef.current && data.user) {
+        applyUser(data.user);
+        window.dispatchEvent(new CustomEvent('auth-changed'));
+        logger.log('[useAuth] OAuth token exchange successful');
+      }
+      return true;
+    } catch (err) {
+      logger.error('[useAuth] OAuth token exchange error:', err.message);
+      return false;
+    }
+  }, [applyUser]);
+
+  // Initial session check + realtime token fetch
+  useEffect(() => {
+    mountedRef.current = true;
+
+    async function init() {
+      // First check if we have OAuth code/tokens in the URL (PKCE or implicit flow)
+      const exchanged = await handleOAuthCallback();
+      if (!exchanged) {
+        // No OAuth params — check existing session cookie
+        await checkSession();
+      }
+      if (mountedRef.current) {
+        setLoading(false);
+      }
+    }
+
+    init();
+
+    return () => {
+      mountedRef.current = false;
+      if (refreshTimerRef.current) {
+        clearTimeout(refreshTimerRef.current);
+      }
+    };
+  }, [checkSession, handleOAuthCallback]);
+
+  // Refresh session when tab becomes visible
+  useEffect(() => {
+    const handleVisibilityChange = () => {
+      if (document.visibilityState === 'visible') {
+        checkSession();
+      }
+    };
+
+    document.addEventListener('visibilitychange', handleVisibilityChange);
+
+    return () => {
+      document.removeEventListener('visibilitychange', handleVisibilityChange);
+    };
+  }, [checkSession]);
+
+  // Listen for auth changes from other components
+  useEffect(() => {
+    const handleAuthChanged = () => {
+      checkSession();
+    };
+
+    window.addEventListener('auth-changed', handleAuthChanged);
+    return () => window.removeEventListener('auth-changed', handleAuthChanged);
+  }, [checkSession]);
+
+  // Sign in with email and password
+  const signIn = useCallback(async (email, password) => {
+    try {
+      const { user: signedInUser } = await authService.signIn(email, password);
+      applyUser(signedInUser);
+      // Notify other components that auth state changed
+      window.dispatchEvent(new CustomEvent('auth-changed'));
+      return { success: true, user: signedInUser };
+    } catch (err) {
+      logger.error('[useAuth] Sign in error:', err);
+      return { success: false, error: err.message };
+    }
+  }, [applyUser]);
+
+  // Sign in with Google OAuth
+  const signInWithGoogle = useCallback(async () => {
+    try {
+      await authService.signInWithGoogle();
+      // Redirects to Google - user will be set on redirect back
+      return { success: true };
+    } catch (err) {
+      logger.error('[useAuth] Google sign in error:', err);
+      return { success: false, error: err.message };
+    }
+  }, []);
+
+  // Sign up with email and password
+  // Automatically captures user's current UI language for localized auth emails
+  const signUp = useCallback(async (email, password, fullName) => {
+    try {
+      // Get current UI language for localized emails
+      const language = i18n.language || 'en';
+      const result = await authService.signUp(email, password, language, fullName);
+      // If email confirmation required, user might be null
+      if (result.user) {
+        applyUser(result.user);
+      }
+      return { success: true, user: result.user, message: result.message };
+    } catch (err) {
+      logger.error('[useAuth] Sign up error:', err);
+      return { success: false, error: err.message };
+    }
+  }, [applyUser]);
+
+  // Sign out
+  const signOut = useCallback(async () => {
+    try {
+      await authService.signOut();
+      applyUser(null);
+      setSessionBalance(null);
+      setRealtimeToken(null);
+      // Clear refresh timer
+      if (refreshTimerRef.current) {
+        clearTimeout(refreshTimerRef.current);
+        refreshTimerRef.current = null;
+      }
+      // Destroy the shared Realtime client
+      destroyRealtimeClient();
+      // Notify other components that auth state changed
+      window.dispatchEvent(new CustomEvent('auth-changed'));
+      return { success: true };
+    } catch (err) {
+      logger.error('[useAuth] Sign out error:', err);
+      return { success: false, error: err.message };
+    }
+  }, [applyUser]);
+
+  // Request password reset email
+  const resetPassword = useCallback(async (email) => {
+    try {
+      await authService.resetPassword(email);
+      return { success: true };
+    } catch (err) {
+      logger.error('[useAuth] Reset password error:', err);
+      return { success: false, error: err.message };
+    }
+  }, []);
+
+  // Update password
+  const updatePassword = useCallback(async (newPassword) => {
+    try {
+      await authService.updatePassword(newPassword);
+      return { success: true };
+    } catch (err) {
+      logger.error('[useAuth] Update password error:', err);
+      return { success: false, error: err.message };
+    }
+  }, []);
+
+  // Refresh session manually (can be called after OAuth callback)
+  const refreshSession = useCallback(async () => {
+    await checkSession();
+  }, [checkSession]);
+
+  return useMemo(
+    () => ({
+      user,
+      sessionBalance,
+      realtimeToken,
+      loading,
+      isAuthenticated: !!user,
+      signIn,
+      signInWithGoogle,
+      signUp,
+      signOut,
+      resetPassword,
+      updatePassword,
+      refreshSession,
+    }),
+    [
+      user,
+      sessionBalance,
+      realtimeToken,
+      loading,
+      signIn,
+      signInWithGoogle,
+      signUp,
+      signOut,
+      resetPassword,
+      updatePassword,
+      refreshSession,
+    ],
+  );
+}
+
+/**
+ * AuthProvider — mount ONCE above every consumer of useAuth() (main.jsx).
+ */
+export function AuthProvider({ children }) {
+  const value = useAuthState();
+  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
+}
+
+export default AuthContext;
diff --git a/site/src/contexts/index.js b/site/src/contexts/index.js
index 5534b1d..95560ea 100644
--- a/site/src/contexts/index.js
+++ b/site/src/contexts/index.js
@@ -1,4 +1,6 @@
 export { LanguageProvider, useLanguageContext } from './LanguageContext.jsx';
+export { AuthProvider } from './AuthContext.jsx';
+export { default as AuthContext } from './AuthContext.jsx';
 export { default as LanguageContext } from './LanguageContext.jsx';
 export { CreditsProvider, useCreditsContext } from './CreditsContext.jsx';
 export { default as CreditsContext } from './CreditsContext.jsx';
diff --git a/site/src/hooks/useAuth.js b/site/src/hooks/useAuth.js
index a8490ac..c0823cf 100644
--- a/site/src/hooks/useAuth.js
+++ b/site/src/hooks/useAuth.js
@@ -1,415 +1,64 @@
 // ============================================================
 // useAuth hook - Authentication state and methods
 // ============================================================
-// Uses HttpOnly cookie auth via backend proxy.
-// Realtime token fetched from dedicated /auth/realtime-token endpoint.
-// Token stored in memory only, refreshed on timer before expiry.
+// Ruling 19 Sep 2026 (Bloco 3a): the state lives in contexts/AuthContext.jsx
+// (one instance per app). This hook reads it and keeps the historical
+// per-consumer semantics of `loading`/`error` around the auth actions:
+// a sign-in started from one component shows loading/error THERE, not in
+// every page that gates on authLoading. Public API unchanged.
 
-import { useState, useEffect, useCallback, useRef } from 'react';
-import { logger } from '@/utils';
-import { authService } from '@/services/auth';
-import { getApiUrl } from '@/config';
-import { setRealtimeAuth, destroyRealtimeClient } from '@/services/realtime.js';
-import i18n from '@/i18n/config';
+import { useContext, useState, useCallback, useMemo } from 'react';
+import AuthContext from '@/contexts/AuthContext.jsx';
 
 export function useAuth() {
-  const [user, setUser] = useState(null);
-  const [sessionBalance, setSessionBalance] = useState(null);
-  const [realtimeToken, setRealtimeToken] = useState(null);
-  const [loading, setLoading] = useState(true);
-  const [error, setError] = useState(null);
-  const mountedRef = useRef(true);
-  const refreshTimerRef = useRef(null);
-  const prevUserIdRef = useRef(null);
-  const rtBackoffRef = useRef(0); // exponential-backoff attempt counter for realtime-token
-
-  // Fetch realtime token from dedicated endpoint and schedule refresh.
-  // On 401 (stale cookie) try a one-shot session refresh then retry; if it
-  // still fails, use bounded exponential backoff so a stale session can't spin
-  // an unthrottled 401 loop. Success resets the backoff.
-  const fetchRealtimeToken = useCallback(async (afterRefresh = false) => {
-    const MAX_BACKOFF_ATTEMPTS = 6;
-    const scheduleBackoff = () => {
-      if (!mountedRef.current) return;
-      const attempt = rtBackoffRef.current;
-      if (attempt >= MAX_BACKOFF_ATTEMPTS) return; // give up until next auth/visibility event
-      rtBackoffRef.current = attempt + 1;
-      const delay = Math.min(30000, 1000 * 2 ** attempt);
-      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
-      refreshTimerRef.current = setTimeout(() => fetchRealtimeToken(), delay);
-    };
-
-    try {
-      const res = await fetch(`${getApiUrl()}/auth/realtime-token`, {
-        credentials: 'include',
-      });
-
-      // Stale cookie — try one session refresh, then retry immediately.
-      if (res.status === 401 && !afterRefresh) {
-        const refreshed = await fetch(`${getApiUrl()}/auth/refresh`, {
-          method: 'POST',
-          credentials: 'include',
-        })
-          .then((r) => r.ok)
-          .catch(() => false);
-        if (refreshed && mountedRef.current) {
-          return fetchRealtimeToken(true);
-        }
-      }
-
-      if (!res.ok) {
-        logger.warn('[useAuth] Realtime token fetch failed:', res.status);
-        if (mountedRef.current) setRealtimeToken(null);
-        scheduleBackoff();
-        return;
-      }
-
-      const { token, expiresAt } = await res.json();
-
-      if (mountedRef.current && token) {
-        rtBackoffRef.current = 0; // success resets backoff
-        setRealtimeToken(token);
-        // Update the shared Realtime client (no WebSocket teardown)
-        setRealtimeAuth(token);
-
-        // Schedule refresh 60s before expiry
-        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
-        if (expiresAt) {
-          const nowSeconds = Math.floor(Date.now() / 1000);
-          const refreshInMs = Math.max((expiresAt - nowSeconds - 60) * 1000, 10000);
-          refreshTimerRef.current = setTimeout(() => {
-            logger.log('[useAuth] Refreshing realtime token (pre-expiry)');
-            fetchRealtimeToken();
-          }, refreshInMs);
-        }
-      }
-    } catch (err) {
-      logger.warn('[useAuth] Realtime token fetch error:', err.message);
-      if (mountedRef.current) setRealtimeToken(null);
-      scheduleBackoff();
-    }
-  }, []);
-
-  // Check session on mount and when tab becomes visible
-  const checkSession = useCallback(async () => {
-    try {
-      const { user: sessionUser, balance } = await authService.getSession();
-      if (mountedRef.current) {
-        setUser(sessionUser);
-        // Always sync sessionBalance — clear it on logout so stale data doesn't persist
-        setSessionBalance(balance || null);
-      }
-    } catch (err) {
-      logger.error('[useAuth] Session check failed:', err);
-      if (mountedRef.current) {
-        setUser(null);
-        setSessionBalance(null);
-        setRealtimeToken(null);
-      }
-    }
-  }, []);
-
-  // Handle OAuth callback on the frontend
-  // Detects two scenarios:
-  // 1. PKCE flow: ?code=xxx in query params → send to /auth/exchange-code (tokens never in URL)
-  // 2. Implicit fallback: #access_token=xxx in hash → send to /auth/exchange
-  const handleOAuthCallback = useCallback(async () => {
-    // --- PKCE flow: ?code= in query params ---
-    const urlParams = new URLSearchParams(window.location.search);
-    const code = urlParams.get('code');
+  const ctx = useContext(AuthContext);
+  if (!ctx) {
+    throw new Error('useAuth must be used within AuthProvider');
+  }
 
-    if (code) {
-      logger.log('[useAuth] Detected PKCE code in URL, exchanging...');
-      // Clean the URL immediately (remove ?code= but keep path)
-      window.history.replaceState(null, '', window.location.pathname);
-
-      try {
-        const res = await fetch(`${getApiUrl()}/auth/exchange-code`, {
-          method: 'POST',
-          headers: { 'Content-Type': 'application/json' },
-          // language: sets preferred_language for OAuth users (whose metadata has
-          // none) so their localized auth emails (incl. password reset) match the UI.
-          body: JSON.stringify({ code, language: i18n.language || 'en' }),
-          credentials: 'include', // sends pkce_id cookie
-        });
-
-        if (!res.ok) {
-          logger.error('[useAuth] PKCE code exchange failed:', res.status);
-          return false;
-        }
+  const [pending, setPending] = useState(false);
+  const [error, setError] = useState(null);
 
-        const data = await res.json();
-        if (mountedRef.current && data.user) {
-          setUser(data.user);
-          window.dispatchEvent(new CustomEvent('auth-changed'));
-          logger.log('[useAuth] PKCE code exchange successful');
+  // Wrap a shared action so this consumer sees its own loading/error.
+  const wrap = useCallback(
+    (action, { keepPendingOnSuccess = false } = {}) =>
+      async (...args) => {
+        setPending(true);
+        setError(null);
+        const result = await action(...args);
+        if (!result?.success) {
+          setError(result?.error || null);
+          setPending(false);
+        } else if (!keepPendingOnSuccess) {
+          setPending(false);
         }
-        return true;
-      } catch (err) {
-        logger.error('[useAuth] PKCE code exchange error:', err.message);
-        return false;
-      }
-    }
-
-    // --- Implicit fallback: #access_token= in hash ---
-    const hash = window.location.hash;
-    if (!hash || !hash.includes('access_token=')) return false;
-
-    const hashParams = new URLSearchParams(hash.substring(1));
-    const accessToken = hashParams.get('access_token');
-    const refreshToken = hashParams.get('refresh_token');
-
-    if (!accessToken || !refreshToken) return false;
-
-    logger.log('[useAuth] Detected OAuth tokens in URL hash, exchanging...');
-    window.history.replaceState(null, '', window.location.pathname + window.location.search);
-
-    try {
-      const res = await fetch(`${getApiUrl()}/auth/exchange`, {
-        method: 'POST',
-        headers: { 'Content-Type': 'application/json' },
-        body: JSON.stringify({
-          access_token: accessToken,
-          refresh_token: refreshToken,
-          language: i18n.language || 'en',
-        }),
-        credentials: 'include',
-      });
-
-      if (!res.ok) {
-        logger.error('[useAuth] OAuth token exchange failed:', res.status);
-        return false;
-      }
-
-      const data = await res.json();
-      if (mountedRef.current && data.user) {
-        setUser(data.user);
-        window.dispatchEvent(new CustomEvent('auth-changed'));
-        logger.log('[useAuth] OAuth token exchange successful');
-      }
-      return true;
-    } catch (err) {
-      logger.error('[useAuth] OAuth token exchange error:', err.message);
-      return false;
-    }
-  }, []);
-
-  // Initial session check + realtime token fetch
-  useEffect(() => {
-    mountedRef.current = true;
-
-    async function init() {
-      // First check if we have OAuth code/tokens in the URL (PKCE or implicit flow)
-      const exchanged = await handleOAuthCallback();
-      if (!exchanged) {
-        // No OAuth params — check existing session cookie
-        await checkSession();
-      }
-      if (mountedRef.current) {
-        setLoading(false);
-      }
-    }
-
-    init();
-
-    return () => {
-      mountedRef.current = false;
-      if (refreshTimerRef.current) {
-        clearTimeout(refreshTimerRef.current);
-      }
-    };
-  }, [checkSession, handleOAuthCallback]);
-
-  // Fetch realtime token once user is authenticated.
-  // Compare user ID to avoid redundant fetches when checkSession creates
-  // a new object reference for the same user (e.g. on every tab focus).
-  useEffect(() => {
-    if (user) {
-      if (user.id !== prevUserIdRef.current) {
-        prevUserIdRef.current = user.id;
-        rtBackoffRef.current = 0; // fresh session — reset backoff
-        fetchRealtimeToken();
-      }
-    } else {
-      prevUserIdRef.current = null;
-      rtBackoffRef.current = 0;
-      // Clear token and timer when user is null (logged out)
-      setRealtimeToken(null);
-      if (refreshTimerRef.current) {
-        clearTimeout(refreshTimerRef.current);
-        refreshTimerRef.current = null;
-      }
-    }
-  }, [user, fetchRealtimeToken]);
-
-  // Refresh session when tab becomes visible
-  useEffect(() => {
-    const handleVisibilityChange = () => {
-      if (document.visibilityState === 'visible') {
-        checkSession();
-      }
-    };
-
-    document.addEventListener('visibilitychange', handleVisibilityChange);
-
-    return () => {
-      document.removeEventListener('visibilitychange', handleVisibilityChange);
-    };
-  }, [checkSession]);
-
-  // Listen for auth changes from other components
-  useEffect(() => {
-    const handleAuthChanged = () => {
-      checkSession();
-    };
-
-    window.addEventListener('auth-changed', handleAuthChanged);
-    return () => window.removeEventListener('auth-changed', handleAuthChanged);
-  }, [checkSession]);
-
-  // Sign in with email and password
-  const signIn = useCallback(async (email, password) => {
-    setLoading(true);
-    setError(null);
-
-    try {
-      const { user: signedInUser } = await authService.signIn(email, password);
-      setUser(signedInUser);
-      // Notify other components that auth state changed
-      window.dispatchEvent(new CustomEvent('auth-changed'));
-      return { success: true, user: signedInUser };
-    } catch (err) {
-      logger.error('[useAuth] Sign in error:', err);
-      setError(err.message);
-      return { success: false, error: err.message };
-    } finally {
-      setLoading(false);
-    }
-  }, []);
-
-  // Sign in with Google OAuth
-  const signInWithGoogle = useCallback(async () => {
-    setLoading(true);
-    setError(null);
-
-    try {
-      await authService.signInWithGoogle();
-      // Redirects to Google - user will be set on redirect back
-      return { success: true };
-    } catch (err) {
-      logger.error('[useAuth] Google sign in error:', err);
-      setError(err.message);
-      setLoading(false);
-      return { success: false, error: err.message };
-    }
-  }, []);
-
-  // Sign up with email and password
-  // Automatically captures user's current UI language for localized auth emails
-  const signUp = useCallback(async (email, password, fullName) => {
-    setLoading(true);
-    setError(null);
-
-    try {
-      // Get current UI language for localized emails
-      const language = i18n.language || 'en';
-      const result = await authService.signUp(email, password, language, fullName);
-      // If email confirmation required, user might be null
-      if (result.user) {
-        setUser(result.user);
-      }
-      return { success: true, user: result.user, message: result.message };
-    } catch (err) {
-      logger.error('[useAuth] Sign up error:', err);
-      setError(err.message);
-      return { success: false, error: err.message };
-    } finally {
-      setLoading(false);
-    }
-  }, []);
-
-  // Sign out
-  const signOut = useCallback(async () => {
-    setLoading(true);
-    setError(null);
-
-    try {
-      await authService.signOut();
-      setUser(null);
-      setSessionBalance(null);
-      setRealtimeToken(null);
-      // Clear refresh timer
-      if (refreshTimerRef.current) {
-        clearTimeout(refreshTimerRef.current);
-        refreshTimerRef.current = null;
-      }
-      // Destroy the shared Realtime client
-      destroyRealtimeClient();
-      // Notify other components that auth state changed
-      window.dispatchEvent(new CustomEvent('auth-changed'));
-      return { success: true };
-    } catch (err) {
-      logger.error('[useAuth] Sign out error:', err);
-      setError(err.message);
-      return { success: false, error: err.message };
-    } finally {
-      setLoading(false);
-    }
-  }, []);
-
-  // Request password reset email
-  const resetPassword = useCallback(async (email) => {
-    setLoading(true);
-    setError(null);
-
-    try {
-      await authService.resetPassword(email);
-      return { success: true };
-    } catch (err) {
-      logger.error('[useAuth] Reset password error:', err);
-      setError(err.message);
-      return { success: false, error: err.message };
-    } finally {
-      setLoading(false);
-    }
-  }, []);
-
-  // Update password
-  const updatePassword = useCallback(async (newPassword) => {
-    setLoading(true);
-    setError(null);
-
-    try {
-      await authService.updatePassword(newPassword);
-      return { success: true };
-    } catch (err) {
-      logger.error('[useAuth] Update password error:', err);
-      setError(err.message);
-      return { success: false, error: err.message };
-    } finally {
-      setLoading(false);
-    }
-  }, []);
-
-  // Refresh session manually (can be called after OAuth callback)
-  const refreshSession = useCallback(async () => {
-    await checkSession();
-  }, [checkSession]);
+        return result;
+      },
+    [],
+  );
+
+  const actions = useMemo(
+    () => ({
+      signIn: wrap(ctx.signIn),
+      // Redirects to Google on success — loading stays true like before.
+      signInWithGoogle: wrap(ctx.signInWithGoogle, { keepPendingOnSuccess: true }),
+      signUp: wrap(ctx.signUp),
+      signOut: wrap(ctx.signOut),
+      resetPassword: wrap(ctx.resetPassword),
+      updatePassword: wrap(ctx.updatePassword),
+    }),
+    [wrap, ctx.signIn, ctx.signInWithGoogle, ctx.signUp, ctx.signOut, ctx.resetPassword, ctx.updatePassword],
+  );
 
   return {
-    user,
-    sessionBalance,
-    realtimeToken,
-    loading,
+    user: ctx.user,
+    sessionBalance: ctx.sessionBalance,
+    realtimeToken: ctx.realtimeToken,
+    loading: ctx.loading || pending,
     error,
-    isAuthenticated: !!user,
-    signIn,
-    signInWithGoogle,
-    signUp,
-    signOut,
-    resetPassword,
-    updatePassword,
-    refreshSession,
+    isAuthenticated: ctx.isAuthenticated,
+    ...actions,
+    refreshSession: ctx.refreshSession,
   };
 }
 
diff --git a/site/src/main.jsx b/site/src/main.jsx
index ccc09a5..76ee15c 100644
--- a/site/src/main.jsx
+++ b/site/src/main.jsx
@@ -1,7 +1,7 @@
 import { useState, useEffect, StrictMode } from 'react';
 import { createRoot } from 'react-dom/client';
 import { Router } from './Router';
-import { LanguageProvider, CreditsProvider } from './contexts';
+import { LanguageProvider, AuthProvider, CreditsProvider } from './contexts';
 import { ErrorBoundary } from './components/common';
 import { logger } from './utils';
 import { initPWA } from './utils/pwa';
@@ -43,7 +43,8 @@ try {
 }
 
 // App wrapper that initializes i18n and PWA
-// Note: Auth is handled via HttpOnly cookies - no client-side initialization needed
+// Note: Auth is handled via HttpOnly cookies; AuthProvider runs the single
+// session check for the whole tree (CreditsProvider reads it).
 function AppWithInitialization() {
   const [isReady, setIsReady] = useState(false);
   const [error, setError] = useState(null);
@@ -112,9 +113,11 @@ function AppWithInitialization() {
   return (
     <ErrorBoundary>
       <LanguageProvider>
-        <CreditsProvider>
-          <Router />
-        </CreditsProvider>
+        <AuthProvider>
+          <CreditsProvider>
+            <Router />
+          </CreditsProvider>
+        </AuthProvider>
       </LanguageProvider>
     </ErrorBoundary>
   );
```
