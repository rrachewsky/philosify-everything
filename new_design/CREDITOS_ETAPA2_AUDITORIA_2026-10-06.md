# CRÉDITOS · ETAPA 2 · Auditoria dos itens 2-5 (o que existe, o que falta, proposta mínima)

**Status:** AUDITORIA para OK do Bob · 06/10/2026 · **nada aplicado, nenhum diff**.
**Base:** HEAD `f700ffd` (Etapa 1 fechada: reapers escrevem refund). Itens 2-5 como o Bob os enunciou em 06/10; a origem de cada um está nos "Achados colaterais" de `docs/DIAGNOSTICO_RESERVAS_CREDITO_2026-08-27.md` (itens 2, 7, 4) mais o item 5 novo.
**Regra:** toda proposta abaixo é mínima e gated; SQL só pelo Bob no SQL Editor; código só após OK.

---

## 0. Mapa das rotas faturáveis hoje (código na mão)

Todas passam por `reserve_credit(p_user_id)` → trabalho → `confirm_reservation(p_reservation_id, p_analysis_id text)` ou `release_reservation(id, reason, analysis_id)`. Sempre 1 crédito por RPC. Reservas de N créditos são N chamadas.

| Feature | Custo | Reserva | Confirm (3º arg = "analysisId", 4º = userId) | Arquivo:linha |
|---|---|---|---|---|
| Música | 1 | 1× | `resultData.id` (uuid) + userId | `api/index.js:3039,3134,3175` |
| Livro | 1 | 1× | `resultData.id` (uuid) + userId | `api/index.js:3420,3453,3463` |
| Cinema | 1 | 1× | uuid ou `cinema-analysis:<título>` + userId | `cinema-analyze.js:109-118,152-160,262,429-433` |
| News (análise) | 1 | 1× | cache: `result.id` + userId; nova: `news-analysis:<título>` **sem userId** | `news-analyze.js:90-97,123,383` |
| News (fontes) | 1 | 1× | `"News source customization unlock"` **sem userId** | `news-preferences.js:342,373-376` |
| Painel | 3 | 3× em paralelo (`Promise.allSettled`) | `Panel: <título> (<mediaType>)` + userId, 3 confirms sequenciais | `philosopher-panel.js:22,194-196,360-367` |
| Colóquio acesso | 1 | 1× | `colloquium:access:<thread>` **sem userId** | `colloquium-user.js:607,637-640` |
| Colóquio participar | 1 ou 2 | N× sequencial | `colloquium:participate:<thread>` **sem userId** | `colloquium-user.js:736,744,781-784` |
| Colóquio filósofo | preço do filósofo | N× sequencial | `colloquium:philosopher:<thread>:<nome>` **sem userId** | `colloquium-user.js:893,901,923-926` |
| Colóquio propor | 1 ou 2 | N× sequencial | `colloquium:propose:<thread>` **sem userId** | `colloquium-user.js:1024,1075-1078` |
| Debate aberto | N | N× sequencial | `colloquium:open-debate:<thread>` **sem userId** | `colloquium-user.js:1492,1594-1597` |
| Quiz start / continue | 1 | 1× | `quiz:start:<sessão>` / `quiz:continue:<sessão>` **sem userId** | `quiz.js:688,711,946,954` |
| Espaços (unlock) | `SPACE_COSTS` | N× sequencial | `space:<nome>` **sem userId** | `spaces.js:19,103-134,194` |
| Zona insegura | 10 início / 5 extensão | N× sequencial | `unsafe-zone:start|extension:<sessão>` **sem userId** | `unsafe-zone.js:27-28,105-134,139,446-447` |

Outros movimentos de `credit_history`: `purchase` (`process_stripe_payment.sql:74-101`, com `stripe_session_id`, `stripe_price_id`, `p_metadata`), `refund` **negativo** por chargeback Stripe (`process_stripe_refund.sql:62-90`, `amount = -N`), `signup_bonus` (`handle_new_user.sql:37-54`), `refund` +1 por `release_reservation` (29/08) e pelos reapers (06/10), e `admin_grant_credits` (`p_type` livre, **sem snapshots**, 0 chamadores no worker).

## 1. Tabela-resumo

| # | Item | Estado atual (arquivo:linha) | Gap | Proposta mínima |
|---|---|---|---|---|
| 2 | Reserva atômica de N créditos | Não existe RPC de N. Painel: 3× `reserve_credit` em paralelo (`philosopher-panel.js:194-196`), rollback client-side se `< 3` (`:201-209`). Zona insegura, Espaços, Colóquio: N× sequencial com rollback client-side (`unsafe-zone.js:105-134`, `spaces.js:103-134`, `colloquium-user.js:744-760`). A RPC serializa por `pg_advisory_xact_lock` por usuário (`reserve_credit.sql:20-22`), então cada unidade é atômica | "Tudo ou nada" depende do rollback no worker, que depende de `release_reservation` funcionar (hoje funciona, 29/08). Janela entre as N reservas em que um `cleanup_user_stale_reservations(…, 0)` de outra rota devolve reservas em voo (`api/index.js:2984,3394`). N linhas de −1 no extrato em vez de uma de −N | **Adiar** a RPC `reserve_credits(p_user_id, p_amount)`: exige coluna `amount` em `credit_reservations` (DDL, 3(c)-bis) e refatorar confirm/release para N. Hoje o risco residual é a janela do cleanup com idade 0, que se fecha trocando `0` por `2` nos dois preâmbulos (2 linhas, ver § 2). Agrupamento no extrato vem de graça com o item 5 (`metadata.batch_id`) |
| 3 | Snapshot de saldo no confirm | `confirm_reservation.sql:57-77`: lê o saldo **no confirm** e deriva `before = after + 1`. Snapshots existem em todas as linhas | O débito aconteceu na **reserva**; no confirm o saldo já reflete todas as reservas pendentes. Painel: 3 linhas `9→8, 9→8, 9→8` em vez de `11→10, 10→9, 9→8` (achado 7 de 27/08, ainda vivo). Compra entre reserva e confirm também desloca | **Não consertar na origem agora** (exigiria gravar o saldo pós-reserva em `credit_reservations`: DDL). O Extrato (Etapa 3) calcula o **saldo resultante** no worker a partir do saldo atual, descendo pela lista: `saldo_i = saldo_atual + pendentes − Σ amount das linhas mais novas que i`. Funciona paginado, independe dos snapshots gravados. Os snapshots ficam como estão (auditoria interna) |
| 4 | `analysis_id` em todas as rotas que confirmam | A RPC grava `analysis_id` quando o 2º arg é uuid (`confirm_reservation.sql:76`). Para ids não-uuid o worker zera o arg (`confirm.js:17-18`) e tenta um **PATCH** posterior em `credit_history` com `metadata.description`, mas só se receber `userId` (`confirm.js:48-108`): localiza "a última linha `analysis` do usuário" e remenda | 11 pontos de confirm **sem userId** (tabela § 0) → o PATCH é pulado e a linha fica `type='analysis'`, `analysis_id = null`, `metadata = {reservation_id, analysis_id: null, credit_type}`: **sem origem nenhuma** (quiz, espaços, zona insegura, fontes de news, todo o colóquio, news nova). O PATCH em si é frágil: "última linha do usuário" é corrida sob confirms concorrentes e custa 2 requests por confirm | Levar a descrição **para dentro da RPC**: `confirm_reservation(p_reservation_id uuid, p_analysis_id text, p_source text DEFAULT NULL, p_description text DEFAULT NULL, p_batch_id uuid DEFAULT NULL)` grava `analysis_id` (se uuid) e `metadata.source/description/batch_id` no próprio INSERT. **Drop-all + CREATE** (lição de 25/08: `CREATE OR REPLACE` com assinatura nova cria overload e o PostgREST fica ambíguo). Worker: `confirmReservation(env, id, analysisId, userId, { source, description, batchId })`, PATCH removido. Passa a ser **impossível** confirmar sem origem |
| 5 | Origem/source em cada movimento | `type` tem 5 valores vivos: `analysis` (todo consumo, inclusive painel/quiz/espaço/zona/colóquio), `refund` (+1 devolução **e** −N chargeback Stripe), `purchase`, `signup_bonus`, livre em `admin_grant_credits`. A origem fina só existe em `metadata.description` quando o PATCH do item 4 roda (prefixos `Panel:`, `cinema-analysis:`, `quiz:start:`, `space:`, `unsafe-zone:start:`, `colloquium:access:`…) e em `metadata.reason` dos refunds (`analysis_failed`, `cached_review`, `already_owned`, `timeout`, `user_timeout_cleanup`, mais `cinema-analysis-failed`, `news-analysis-failed`, `quiz-*` fora da lista) | Sem `source` estruturado não há como localizar ×18 nem agrupar. `refund` positivo e negativo partilham o `type`. Rótulos do app hoje: `transactions.*` (pt.json:425-433) cobre só purchase/analysis/signupBonus/refund/promo; o AccountModal **esconde** `analysis` (`useAccountHistory.js:15-19`) | Vocabulário fechado de `metadata.source` gravado pela RPC do item 4: `music, book, cinema, news, news_sources, panel, colloquium_access, colloquium_participate, colloquium_philosopher, colloquium_propose, open_debate, quiz, space, unsafe_zone`. Refunds já têm `metadata.reason`; o extrato deriva a origem pelo sinal + `stripe_session_id` (chargeback) + `reason`. `purchase`/`signup_bonus` já são auto-descritivos. Linhas **antigas** sem `source`: o extrato cai em `type` + prefixo de `description` quando houver, senão rótulo genérico ("Consumo"). Sem backfill |

## 2. Detalhe das propostas (para OK; nada aplicado)

### 2.1 Migração gated: `confirm_reservation` v2 (itens 4 + 5)

Mesmo padrão da `release_reservation` de 29/08 (`migrations/tarefa2_item1_release_reservation.sql`): pré-flight (overloads, assinatura, ACL, fingerprint `src`), `BEGIN` → DO drop-all → `CREATE FUNCTION` → ACL → `COMMIT` → verificação → prova funcional em DO com `RAISE EXCEPTION`.

Mudanças no corpo, e só elas:
- Assinatura: `(p_reservation_id uuid, p_analysis_id text, p_source text DEFAULT NULL, p_description text DEFAULT NULL, p_batch_id uuid DEFAULT NULL)`. Chamadas antigas com 2 args continuam válidas (defaults), então o deploy do worker pode vir **depois** da migração, sem janela quebrada.
- `metadata = jsonb_build_object('reservation_id', …, 'analysis_id', …, 'credit_type', …) || jsonb_strip_nulls(jsonb_build_object('source', p_source, 'description', p_description, 'batch_id', p_batch_id))`.
- Aproveitar para igualar aos irmãos: `SECURITY DEFINER` + `SET search_path TO 'public'` + `#variable_conflict use_column` (o cabeçalho do espelho registra a divergência deliberada de 21/08; agora que a casa tem o padrão drop-all, dá para alinhar). Manter o `EXCEPTION WHEN OTHERS` externo? Proposta: **remover**, como na `release_reservation` (erro real de SQL deve chegar ao log do worker, `confirm.js:118`). Decisão do Bob.
- Snapshots: inalterados (item 3 fica para o extrato).

### 2.2 Worker (após a migração)

- `api/src/credits/confirm.js`: assinatura `confirmReservation(env, reservationId, analysisId, userId, { source, description, batchId } = {})`; passa `p_source/p_description/p_batch_id`; **remove** o bloco de PATCH (linhas 48-108). `userId` deixa de ser necessário para a origem, mas continua no log.
- 14 pontos de confirm (tabela § 0) recebem `source` e `description`; os de N créditos (painel, colóquio, espaços, zona) geram um `batchId = crypto.randomUUID()` por operação e passam o mesmo nas N confirms.
- `api/index.js:2984` e `:3394`: `cleanupUserStaleReservations(env, user.userId, 0)` → `2` (fecha a janela do item 2 sem DDL; o cancel explícito em `:761` continua com 0, é intencional).
- Comentário morto em `release.js:5` ("Does NOT write to credit_history") sai.

### 2.3 Extrato (Etapa 3, só para fechar o desenho; proposta própria depois do OK aqui)

`GET /api/credits/history?before=<created_at>&limit=50` no worker com service key (RLS não entra; filtra `user_id` do cookie), devolvendo por linha: `id, created_at, type, amount, source, description, reason, analysis_id, batch_id, stripe_session_id, saldo_resultante`. O `saldo_resultante` é calculado no worker (item 3). Linhas de um mesmo `batch_id` podem vir agrupadas (−3 "Painel") já na API. Rótulos ×18 por `source` e por `reason`, chaves novas em `v2.account.statement.*` (ou onde o Bob preferir), terminologia das chaves existentes de `transactions.*`.

## 3. Achados colaterais (registro; cada um com OK próprio, nenhum nesta etapa)

1. `quiz.js:711` confirma e `:718` tenta `release` da mesma reserva se não houver pergunta → `Cannot release confirmed reservation`: crédito cobrado sem quiz (achado 5 de 27/08, ainda vivo). Correção: confirmar só depois de `getValidatedQuestion`.
2. `process_stripe_refund.sql:77-78` grava `type='refund'` com `amount` negativo: o mesmo `type` serve para devolução (+) e chargeback (−). O extrato trata pelo sinal; renomear o tipo exigiria label novo no enum. Fica.
3. `admin_grant_credits` (vivo, sem chamador) insere em `credit_history` **sem snapshots** (`admin_grant_credits.sql:34-35`); se as colunas `*_before/_after` forem NOT NULL no banco, a função falha ao ser usada. Verificar no 3(c)-bis.
4. `song_analyzed` / `model_used` em `credit_history` nunca são escritos por ninguém (grep no worker e nas funções: 0). Colunas mortas; o extrato liga pela `analysis_id`.
5. Motivos de release fora da lista (`cinema-analysis-failed`, `news-analysis-failed`, `quiz-session-creation-failed`, `quiz-no-valid-questions`): a `release_reservation` mapeia tudo que não é cached/timeout para `failed` no enum; `release_reason` guarda o texto. Só padronização.
6. `/api/transactions` (`transactions.js`) faz casamento **temporal** (±30 s) com `user_analysis_requests` quando não há `analysis_id`: heurística, pode apontar para a análise errada. Hoje tem 1 consumidor (`useTransactions.js:30`). Candidato a sair quando o extrato nascer.

## 4. O que peço de OK

- **A.** Item 2: adiar a RPC de N; aplicar só a troca `0 → 2` nos dois preâmbulos (worker).
- **B.** Item 3: saldo resultante calculado no extrato; snapshots da origem ficam.
- **C.** Itens 4 + 5: migração gated `confirm_reservation` v2 (§ 2.1) com o vocabulário de `source` do § 1 item 5; decidir se o `EXCEPTION WHEN OTHERS` externo sai. Depois, worker § 2.2 num deploy só.
- **D.** Ordem: C (SQL, Bob aplica) → C (worker, build, deploy por comando do Bob) → A junto do mesmo deploy → Etapa 3.

Com o OK, a próxima entrega é o md da migração (pré-flight, bloco, verificação, prova funcional, rollback), no molde da Etapa 1.

## 5. Registro

| Passo | Data | Resultado |
|---|---|---|
| Auditoria redigida | 06/10 | este arquivo; nada aplicado |
| OK do Bob (A-D) | — | — |
