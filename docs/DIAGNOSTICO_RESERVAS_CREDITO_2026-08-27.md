# Diagnóstico — Reservas fantasma de crédito (conta nova, 27/08/2026)

**Investigação somente leitura. Nenhum código alterado.**

## Fatos observados (SQL, já apurados)

- Conta criada 27/08 13:46 UTC, 2 créditos de bônus, nenhuma análise, nenhuma linha em `user_analysis_requests`.
- 2 reservas em `credit_reservations` às **13:50:07** e mais 2 às **14:11:16**, ~250 ms entre cada par.
- Todas com `reason=null`, `analysis_id=null`, `confirmed_at=null`; liberadas pelo cron (>10 min) com `release_reason='timeout'`.
- Saldo visível 0 por 10–14 min. Nada em `credit_history`.

---

## Diagnóstico (TL;DR)

**Uma única ação de custo ≥3 créditos numa conta com apenas 2** produz exatamente essa assinatura:

1. O handler reserva crédito a crédito (loop sequencial ou `Promise.allSettled`); as 2 primeiras chamadas de `reserve_credit` sucedem (**~250 ms de intervalo** — o RPC serializa por advisory lock por usuário, `db/functions/reserve_credit.sql:19-20`), a 3ª retorna `Insufficient credits`.
2. O handler tenta rollback: `releaseReservation(..., 'failed')` para cada reserva feita.
3. **O rollback falha SEMPRE em produção** — o `release_reservation` vivo no banco está quebrado (ver §Mecanismo) — e o erro é engolido num `try/catch` que só faz `console.error`.
4. Usuário recebe 402 `INSUFFICIENT_CREDITS`; as 2 reservas ficam `pending` com o saldo já debitado, até o reaper global do cron devolver com `'timeout'`.
5. O par de 14:11:16 é a **mesma ação repetida** depois que o reaper devolveu os créditos (~14:00–14:05): ou o usuário clicou de novo, ou o replay automático de `pendingCreditAction` (localStorage, TTL 30 min) redisparou o POST ao remontar a página — **sem reverificar saldo/compra**.

Candidatos (todos com a mesma assinatura; o código não permite distinguir qual — ver §Como fechar):

| Ação | Custo | Reserva | Rollback que falha |
|---|---|---|---|
| Painel de filósofos (`POST /api/philosopher-panel`) | 3 | paralela, `philosopher-panel.js:194-196` | `philosopher-panel.js:201-209` |
| Underground unlock (`POST /api/spaces/underground/unlock`) | 3 | sequencial, `spaces.js:100-126` | `spaces.js:103-113` |
| Open debate (`POST /api/colloquium/open-debate`) | 3 | sequencial, `colloquium-user.js:1491-1507` | `:1494-1502` |
| Propor colóquio (`POST /api/colloquium/propose`) | 5 | sequencial, `colloquium-user.js:1023-1039` | `:1026-1034` |
| Unsafe Zone 1ª sessão (`POST /api/unsafe-zone`) | 10 | sequencial, `unsafe-zone.js:105-131` | `:149-157` |
| Add philosopher (`POST /api/colloquium/:id/add-philosopher`) | 2–3 | sequencial, `colloquium-user.js:899-916` | `:903-911` |

Hipóteses descartadas:

- **Retry de 401 (frontend)**: em todos os handlers a autenticação vem antes do `reserveCredit` (ex.: `unsafe-zone.js:162` auth → `:252` reserva); requisição que morre em 401 não reserva nada.
- **Endpoints de 1 crédito em dobro**: quiz/cinema/news em cache **confirmam** imediatamente (`quiz.js:711`, `cinema-analyze.js:118`, `news-analyze.js:97`) — teria `confirmed_at`; música tem dedup lock que devolve 409 à segunda (`api/index.js:3050-3070`); e exigiria dupla falha de IA duas vezes seguidas. Nada disso bate com `confirmed_at=null` ×4 sem nenhum outro artefato.
- **Algo automático de conta nova**: não existe onboarding/geração de perfil/unlock automático no signup (`site/src/pages/v2/SignUpPage.jsx` só chama `POST /auth/signup`). O único disparo sem clique é o replay de `pendingCreditAction` (ver §Frontend).

---

## Mecanismo raiz 1 — `release_reservation` vivo está quebrado (afeta TUDO)

- `db/functions/release_reservation.sql:1-15` (cabeçalho corrigido 25/08): a verificação do mesmo dia — `reserve → release 'failed'` num bloco DO — ainda recebeu **`column reference "free_remaining" is ambiguous`** do corpo executante. A migração `credit_refund_history.sql` reportou "Success" mas não substituiu a função (drift de assinatura → `CREATE OR REPLACE` criou overload duplicado, ou a sessão do SQL Editor não era produção — commits `40fdf7e`, `7e61308`, `c87ac74`).
- Consequência: **toda** chamada `releaseReservation()` do worker falha — o motivo passado é irrelevante. Ou o corpo vivo morre na ambiguidade e o `EXCEPTION WHEN OTHERS` devolve `success=false` (`release.js:28-32` só loga), ou o PostgREST rejeita por ambiguidade de overload e `callRpc` lança (`release.js:43-47`, capturado pelos try/catch dos handlers).
- O crédito **não** volta e a reserva fica `pending` até o reaper do cron (`cleanup_stale_reservations`, que roda por SQL direto no pg_cron e funciona).
- A correção já existe, **gated**: `migrations/release_reservation_rebuild.sql` (drop de todos os overloads + recriação canônica + ACL). Não aplicada.

### Nota sobre a hipótese do enum
`credit_reservations.release_reason` é `VARCHAR(100)` na referência de schema (`TECHNICAL_AUDIT.md:498-508`); **não há enum `reservation_reason`** em nenhum SQL do repo. O comentário em `release.js:9` está errado. Os motivos fora da lista (`cinema-analysis-failed` em `cinema-analyze.js:458`, `news-analysis-failed` em `news-analyze.js:387`, `quiz-*` em `quiz.js:707/718`, e o default de `spaces.js:106` → `'failed'` via JS) caberiam num VARCHAR(100) — são inconsistência cosmética, **não** a causa do travamento. *(Confirmar o tipo vivo da coluna por SQL: `SELECT data_type FROM information_schema.columns WHERE table_name='credit_reservations' AND column_name='release_reason';` — TECHNICAL_AUDIT.md pode estar defasado.)*

### Evidência corroborante: `credit_history` vazio
O espelho de 25/08 do reaper global (`db/functions/cleanup_stale_reservations.sql:48-70`) escreveria uma linha `type='refund'` por reserva devolvida. As 4 devoluções de 27/08 não geraram linha nenhuma → **o corpo vivo do reaper também é o antigo (pré-25/08)** — mais uma confirmação de que a migração de 25/08 não chegou a este banco.

---

## Tarefa 1a — `freeTicker.js`

`api/src/credits/freeTicker.js` **não reserva nem libera nada e nunca roda sozinho**. Exporta `isInFreeTicker(env, song, artist, spotifyId)` (`:33`), que consulta `featured_songs` com `is_active=true&is_free=true` (`:39-47`) e compara por `spotify_id` ou nome normalizado. Único chamador: o fluxo de música em `api/index.js:3076` — se a música é do ticker grátis, a reserva é pulada (`:3078-3080`). Fail-closed (`:51`, `:98`): em erro, assume que não é grátis. Zero relação com as reservas fantasma.

## Tarefa 1b — Todos os caminhos até `reserveCredit`

`reserveCredit(env, userId)` (`api/src/credits/reserve.js:9`) → RPC `reserve_credit` → INSERT em `credit_reservations` **sem coluna de motivo/origem** (`db/functions/reserve_credit.sql:39-47`) → **`reason=null` é o normal de toda reserva**, não um sintoma.

| Rota | Handler / linha da reserva | Custo | Confirm/Release |
|---|---|---|---|
| `POST /api/analyze` (música) | **`api/index.js:3082`** (inline no router, não em `handlers/analyze.js`) | 1 | confirm/release inline `:3107+` |
| `POST /api/book-analyze` | **`api/index.js:3463`** (inline) | 1 | `:3474-3555` |
| `POST /api/philosopher-panel` | `philosopher-panel.js:195` | 3 em paralelo | rollback `:201-209`; confirm em `ctx.waitUntil` |
| `POST /api/colloquium/:id/access` | `colloquium-user.js:607` | 1 | — |
| `POST /api/colloquium/:id/participate` | `colloquium-user.js:744` | 1–2 seq. | rollback `:747-755` |
| `POST /api/colloquium/:id/add-philosopher` | `colloquium-user.js:901` | 2–3 seq. (`colloquium.js:3153-3161`) | rollback `:903-911` |
| `POST /api/colloquium/propose` | `colloquium-user.js:1024` | 5 seq. | rollback `:1026-1034` |
| `POST /api/colloquium/open-debate` | `colloquium-user.js:1492` | 3 seq. | rollback `:1494-1502` |
| `POST /api/spaces/:space/unlock` | `spaces.js:101` | 3 (underground) seq. | rollback `:103-113`, `:143-152` |
| `POST /api/unsafe-zone` | `unsafe-zone.js:110` via `reserveCredits` `:105` | 10 (1ª) / 5 (extensão) seq. | rollback `:149-157` |
| `POST /api/cinema-analyze` | `cinema-analyze.js:109` (cache KV), `:152` (cache DB), `:262` (miss) | 1 | cache: confirm imediato `:118/:160`; miss: release `:458` |
| `POST /api/news-analyze` | `news-analyze.js:90` (cache), `:123` (miss) | 1 | cache: confirm `:97`; miss: confirm `:383` / release `:387` |
| `POST /api/quiz/start` | `quiz.js:688` | 1 | confirm imediato `:711` |
| `POST /api/quiz/continue` | `quiz.js:946` | 1 | idem |
| `POST /api/user/news-preferences/unlock` | `news-preferences.js:342` | 1 | confirm `:373` / release `:394` |

## Tarefa 1c — Frontend: `/history` e automáticos de conta nova

(Varredura completa em `site/src`, branch `redesign/v2`.)

- **`/history` não toca em endpoint que consome crédito.** `HistoryPage` (`site/src/Router.jsx:133` → `site/src/pages/v2/HistoryPage.jsx:24`): no mount só há `GET /auth/session` (×3 instâncias de `useAuth`: `CreditsContext.jsx:13`, `NavAccount.jsx:22`, `CommerceModals.jsx:22`) e `GET /auth/realtime-token`. `GET /api/user-history` só ao abrir o modal (`CommerceModals.jsx:44,57-59`); `GET /api/history/constellation` só ao abrir o globo (`useConstellation.js:186`).
- **`/api/balance`**: um único chamador (`services/api/balance.js:14` via `useCredits.js:50`), instanciado uma vez no `CreditsContext` (`main.jsx:115`). No caminho normal, **0 chamadas** no mount — o saldo vem no payload de `/auth/session` (`useAuth.js:76`). O usuário viu saldo 0 porque `reserve_credit` debita a tabela `credits` na hora; o frontend só refletiu o banco.
- **Signup não dispara nada faturável.** Nenhum onboarding/perfil/unlock automático.
- **O único disparo faturável sem clique é o replay de `pendingCreditAction`** (`site/src/utils/pendingAction.js:19-20`, TTL 30 min em localStorage): gravado quando o gate de saldo do cliente falha (ex.: `IdeasPage.jsx:61`, `MusicPage.jsx:416`, `SpaceLock.jsx:41`, `UnsafeZonePage.jsx:273,316`, `QuizPage.jsx:201`); no próximo mount da página a ação é **reexecutada sem verificar se houve compra**: `SpaceLock.jsx:59-68` (unlock 3cr), `IdeasPage.jsx:146-161` (access/participate/add-philosopher), `:171-179` (propose 5cr), `:180-188` (open-debate 3cr), `QuizPage.jsx:447-454`, `UnsafeZonePage.jsx:118-149→364-381` (10cr), e os `resumeRun` de Music/News/Cinema/Literature. **É o caminho que faz o POST de custo ≥3 chegar ao backend mesmo com o gate de saldo do cliente** (que bloquearia o clique direto com 2 créditos).

## Tarefa 1d — Cruzamento final

Sequência mais provável:

1. **13:46** — signup, 2 créditos.
2. Usuário tenta uma ação de custo ≥3 → gate do cliente bloqueia, grava `pendingCreditAction`, abre modal de compra; usuário fecha sem comprar.
3. **13:50:07** — remontagem da página (navegação) → replay automático do `pendingCreditAction` POSTa a ação sem checar saldo → backend reserva 2, falha na 3ª, rollback quebrado → **2 reservas presas**, 402, saldo 0. *(Alternativa: clique direto num caminho cujo gate leu saldo defasado — mesmo resultado.)*
4. **~14:00–14:05** — cron reaper devolve os 2 créditos (`'timeout'`), sem linha em `credit_history` (reaper vivo é o corpo antigo).
5. **14:11:16** — nova remontagem (pendingAction ainda válido, TTL 30 min) ou novo clique → repete tudo.

### Como fechar qual endpoint foi (verificações propostas, sem tocar em código)

1. **Cloudflare Workers Logs** (dashboard → Workers → philosify-api → Logs) nos instantes 13:50:07 e 14:11:16 UTC: aparecerão o path e os logs `[Credits] Reserving credit...` + o erro do release.
2. SQL: `credit_type` das 4 reservas (esperado: `'free'` ×4).
3. SQL: ausência de linhas do usuário em `space_access`, `quiz_sessions`, `colloquium_access`, `user_news_preferences` — consistente com abort por 402 (nada persistido).

---

## Achados colaterais (para a Tarefa 2, em ordem de impacto)

1. **[CRÍTICO — já conhecido, gated]** `release_reservation` quebrado em produção; `migrations/release_reservation_rebuild.sql` pronto e aguardando aprovação. Enquanto não rodar, TODO fluxo de refund (falha de IA, cache hit de música, timeout, rollback de reserva parcial) prende créditos por até ~15 min.
2. **Reserva parcial sem transação**: reservar N créditos como N RPCs independentes torna o "tudo ou nada" dependente do rollback client-side (quebrado). Um RPC `reserve_credits(p_user_id, p_amount)` atômico eliminaria a classe inteira do bug.
3. **Replay de `pendingCreditAction` sem reverificação** (frontend): reexecuta ação faturável sem checar se a compra ocorreu nem se o saldo cobre o custo.
4. **`confirmReservation` sem `userId`** em `quiz.js:711`, `news-analyze.js:383`, `news-preferences.js:373-377`, `spaces.js` (via `confirmAllReservations`), `unsafe-zone.js:139`: o 4º parâmetro ausente pula o patch de `credit_history` (`confirm.js:48-108`) → linhas sem descrição/analysis_id.
5. **`quiz.js:718` libera reserva já confirmada** (confirm em `:711`, release em `:718` se não houver perguntas): mesmo com o release consertado, retornaria `Cannot release confirmed reservation` — crédito cobrado sem quiz.
6. **`cleanupUserStaleReservations(env, userId, 0)`** no preâmbulo de música/livro (`api/index.js:3027`, `:3437`) libera TODAS as reservas `pending` do usuário, de qualquer feature: uma análise de música iniciada durante uma geração de painel em andamento devolveria as 3 reservas do painel no meio do voo (o confirm posterior falharia).
7. **Snapshots before/after idênticos** em `credit_history` no confirm (3 linhas 11→10 no painel): bug de cálculo em `db/functions/confirm_reservation.sql` (já apurado por você; entra na Tarefa 2 item 2).
8. Motivos de release fora da lista documentada (`cinema-analyze.js:458`, `news-analyze.js:387`, `quiz.js:707/718`) — cosmético (coluna é VARCHAR), mas vale padronizar junto com a Tarefa 2 item 1.
9. Frontend: handlers de confirmação sem trava de reentrância (`MusicPage.jsx:423-467`, `IdeasModals.jsx:38,137`) e efeitos de resume sem guarda de ref (`MusicPage.jsx:615-625` etc.) — risco de POST duplo faturável; e `fetchWithRetry` do colóquio (`colloquium.js:18-34`) repete POSTs faturáveis em erro de rede assumindo idempotência que o backend não garante.
