# BLOCO 1 — Realtime (401 em loop + posts só com F5) · diagnóstico + diffs para OK

**Data:** 2026-09-01 · **Status:** diagnóstico (código + evidência viva). **Nada aplicado.** Aguardando OK.

---

## 1. Evidência viva (philosify.org, conta logada)

Fetch direto no contexto da página (mesmo cookie):
- `GET /auth/realtime-token` → **200 agora**, token com `aud="authenticated"`, `iss=…supabase.co/auth/v1`,
  **expira em ~29 min** (`exp-now = 1749s`). `GET /api/balance` → **200**.
- Ou seja: **o cookie autentica e o token é válido** neste momento. O 401 **não é constante** — ele aparece
  quando o access_token expira (vida ~1h) e o endpoint **não renova**.

## 2. Causa-raiz A — 401 em loop = expiração sem refresh (CONFIRMADA no código)

- **Handler** `api/src/auth/proxy.js` · `handleGetRealtimeToken` (618): chama `getUserFromAuth` e devolve o
  `session.access_token` **cru do cookie**. `getUserFromAuth` (`api/src/auth/jwt.js:61`) usa `jose.jwtVerify`
  com `issuer`+`audience` — e o `jwtVerify` **valida `exp`**. Token expirado → lança → `null` → **401**.
- **Este é o único endpoint autenticado sem auto-refresh.** O `handleGetSession` (proxy.js:486–533) já tem o
  padrão certo: se expirado (buffer 30s) e há `refresh_token`, chama `auth.refreshSession`, gera novo cookie
  (`buildAuthCookie`) e segue. O `realtime-token` **não** faz isso.
- **Client** `site/src/hooks/useAuth.js` · `fetchRealtimeToken` (26–71): no 401 ele **zera o token e para o
  próprio timer**, mas **não dispara refresh de sessão** → o Realtime fica sem token até um **F5** (que roda
  `checkSession → /auth/session`, e este renova o cookie). Daí "posts só chegam com F5".

## 3. Causa-raiz B — RLS de `realtime.messages` · CONFERIDA → **OK, DESCARTADA**

**SQL rodada pelo Bob (2026-09-01): as policies existem e estão corretas.**
- `underground users can receive underground broadcasts`: `SELECT`/`authenticated`,
  `realtime.topic()='underground' AND EXISTS(space_access WHERE user_id=auth.uid() AND space='underground')`.
- `collective members …` (por `collective_members`), `authenticated can receive agora broadcasts`,
  `users can receive their own DM broadcasts` — todas coerentes.

**→ A autorização de subscribe está OK. O 1b sai do escopo (sem mudança de banco).** O "posts só com F5" é
inteiramente explicado pela **Causa A** (token expira → canal privado perde auth → sem broadcast → F5 renova).

<details><summary>Diagnóstico original da §3 (mantido para registro)</summary>

O `useUnderground`/`useCollective` assinam canais **`{ config: { private: true } }`**. Broadcast privado do
Supabase autoriza o *subscribe* por **RLS na tabela `realtime.messages`**. **Não há policy de `realtime.messages`
versionada no repo** (grep vazio) — mesmo risco do trigger e do release_reservation (objeto de banco fora do
repo). Se a policy estiver ausente/errada, o subscribe é recusado e **nenhum broadcast chega, mesmo com token
válido**. Precisa confirmar em produção.

**SQL para o Bob rodar:**
```sql
-- (1) RLS ligada em realtime.messages?
SELECT relrowsecurity FROM pg_class WHERE oid = 'realtime.messages'::regclass;

-- (2) Policies existentes (foco em SELECT / autorização de subscribe)
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'realtime' AND tablename = 'messages';
```
- Se **existir** policy que autoriza `authenticated` a ler os tópicos `underground`/`collective` → a Causa B
  está OK e o conserto A resolve tudo.
- Se **não existir** → proponho versionar em `migrations/` uma policy (desenho após ver a saída), do tipo
  "membro do espaço lê o tópico", ex.:
  ```sql
  CREATE POLICY "underground members read broadcast" ON realtime.messages
    FOR SELECT TO authenticated
    USING ( realtime.topic() = 'underground'
            AND EXISTS (SELECT 1 FROM public.space_access
                        WHERE user_id = auth.uid() AND space = 'underground') );
  ```
  (idem `collective` conforme o modelo de acesso). **A forma exata depende do schema de `realtime.messages` da
  sua versão do Supabase** — por isso a SQL de conferência primeiro.
</details>

## 4. "8+ retries sem backoff" — nota honesta

Não há no nosso código um contador explícito de 8 retries. O `fetchRealtimeToken` não faz auto-loop no 401.
As tentativas repetidas vêm de **(a)** o cliente Realtime do Supabase tentando *rejoin* do canal privado
quando o subscribe falha (sem token válido/autorização) e **(b)** re-fetches do token disparados por
re-checagens de sessão. O conserto pedido (backoff + limite) entra no cliente como rede de segurança; com o
conserto A, o 401 praticamente deixa de acontecer.

---

## 5. Diffs propostos

### Diff A (worker) — `handleGetRealtimeToken` renova quando expirado (espelha `handleGetSession`)
```js
async function handleGetRealtimeToken(request, env, origin) {
  const bland401 = () => new Response(JSON.stringify({ error: "Not authenticated" }), {
    status: 401,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store, max-age=0",
               Pragma: "no-cache", Expires: "0", ...getCorsHeaders(origin, env) },
  });

  const session = getSessionFromCookie(request);
  if (!session?.access_token) return bland401();

  let accessToken = session.access_token;
  let expiresAt = session.expires_at;
  let setCookieHeader = null;

  const now = Math.floor(Date.now() / 1000);
  const isExpired = expiresAt > 0 && expiresAt - 30 < now;

  if (isExpired && session.refresh_token) {
    try {
      const supabaseUrl = await getSecret(env.SUPABASE_URL);
      const supabaseAnonKey = await getSecret(env.SUPABASE_ANON_KEY);
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await tempClient.auth.refreshSession({ refresh_token: session.refresh_token });
      if (error || !data.session) return bland401();
      accessToken = data.session.access_token;   // fresco do Supabase → confiável
      expiresAt = data.session.expires_at;
      setCookieHeader = buildAuthCookie(data.session, isProduction(env));
    } catch { return bland401(); }
  } else {
    // Caminho não-expirado: mantém a verificação criptográfica atual.
    const user = await getUserFromAuth(request, env);
    if (!user) return bland401();
  }

  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store, max-age=0",
                    Pragma: "no-cache", Expires: "0",
                    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
                    ...getCorsHeaders(origin, env) };
  if (setCookieHeader) headers["Set-Cookie"] = setCookieHeader;
  return new Response(JSON.stringify({ token: accessToken, expiresAt }), { status: 200, headers });
}
```
Imports já presentes no arquivo (usados por `handleGetSession`): `createClient`, `buildAuthCookie`,
`isProduction`, `getSecret`, `getCorsHeaders`, `getSessionFromCookie`, `getUserFromAuth`.

### Diff B (client) — `fetchRealtimeToken` com refresh no 401 + backoff exponencial limitado
`site/src/hooks/useAuth.js`:
- No **401**: tenta **uma** vez `POST /auth/refresh` (renova o cookie) e refaz o fetch; se ainda falhar,
  entra em **backoff exponencial com teto** (1s→2s→4s→…→máx 30s, máx ~6 tentativas) em vez de re-tentar
  sem limite; sucesso zera o backoff.
- Mantém o timer de refresh pré-expiração já existente.
(trecho exato entra na aplicação; a lógica acima é o contrato.)

### 1b (banco) — policy de `realtime.messages` (só se a SQL da §3 mostrar ausência)
Versionar em `migrations/realtime_messages_policies.sql` a(s) policy(ies) de subscribe para `underground`
e `collective`, com cabeçalho "espelho de produção 2026-09-01".

## 6. Critério de aceite (Bob)
Duas janelas persistentes (contas X e Y, ambas com acesso ao Underground): post de X aparece **ao vivo** em Y
**sem F5**. Repetir após ~1h de sessão (token expira) para validar o conserto A.

---

**Aguardo:** (a) OK nos diffs A e B; (b) a saída da SQL da §3 (define se 1b é necessário).
Sem aplicar, sem commit, sem deploy até OK.

---

## 7. EXECUTADO (2026-09-01) — deploy do Bloco 1

- **Diffs aplicados:** A (`api/src/auth/proxy.js`, +79/-…), B (`site/src/hooks/useAuth.js`, +54/-…). 1b **descartado** (RLS OK).
- **Dry-run worker + build site:** verdes.
- **Deploy worker:** Version ID **`b6076ee7-545e-4a7c-88d7-b44b8ed7f5de`** (`--env production`).
- **Deploy site:** deployment **`b15e6b5c`** (`--branch=production`).
- **Verificação (tail durante GET autenticado):** 3× `/auth/realtime-token` → **200**; **0** ocorrências de
  401 / "refresh failed" / erro `[Auth]`. Token entregue com ~50 min de validade.
- **Commit:** adiado para depois do aceite (junto com os relatórios do bloco). **Sem commit até ordem.**

**Aceite pendente (Bob):** post de X ao vivo em Y sem F5 (duas janelas persistentes), repetido após ~1h.
