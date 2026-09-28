# Bloco 3(c) — Vereditos I-0 a I-4 · 28/09/2026

**Para:** supervisor, via Bob. **Branch:** `redesign/v2` · **HEAD:** `9e810d9` · **Dump:** 22/09/2026 (SQL Editor, só SELECT).
**Fontes:** `db/INVENTARIO_2026-09-22.md` (índice e achados), `new_design/BLOCO3_C_STATUS_2026-09-27.md` (diário de chegada).
Nada foi executado contra o banco. Nada commitado. Nenhum objeto do banco alterado.

---

## 1. Completude

| Bloco | Chegou | Linhas | Alvo (I-0) | Bate |
|---|---|---|---|---|
| I-0 | 27/09 | 6 | — | oficial |
| I-1a (índice) | 27/09 | 63 | 63 (59 public + 4 audit) | **SIM** |
| I-1b public (corpos) | 28/09 | 59 | 59 | **SIM** |
| I-1b audit (corpos) | 28/09 | 4 | 4 | **SIM** |
| I-2 (triggers) | 28/09 | 32 | 32 | **SIM** |
| I-3 (policies) | 28/09 (3 fatias) | 171 | 171 | **SIM** |
| I-4a-d | 28/09 | 0 / 3 / 18 / 1 | — | recebido |

**I-1 fechado: 63 funções, 63 corpos, 63 espelhos em `db/functions/`.**

Nota de forma no I-0: o `.sql` do repo emite `tabelas_public_com_rls` / `tabelas_public_sem_rls`; a saída trouxe `tabelas_public` (63) / `tabelas_audit` (1). A variante rodada difere do arquivo nessas duas linhas. Não afeta os alvos.

## 2. I-1a — o que o repo sabia das 63 funções

| Classe (grep do nome fora de `db/`) | Qtd |
|---|---|
| espelho pré-existente em `db/functions/` | 6 |
| citada em código `api/` ou `site/` | 20 |
| citada só em `.sql`/`.md` do repo | 13 |
| **não reconhecida: só existia no banco** | **25** |

**As 25 não reconhecidas:** archive_chat_message, archive_collective_comment, archive_direct_message (audit), admin_grant_credits, archive_deleted_message, broadcast_chat_deleted, broadcast_chat_message, broadcast_chat_message_deleted, broadcast_collective_message, broadcast_dm_conversation, broadcast_dm_deleted, broadcast_dm_edited, broadcast_dm_inserted, broadcast_underground_post_deleted, calculate_final_score, create_notification_preferences, normalize_text, notify_dm_conversation_message, notify_new_subscriber, search_songs, update_beta_requests_updated_at, update_credit_reservations_updated_at, update_thread_reply_stats, user_has_group_key, validate_phone_fields.

**7 funções de trigger com zero triggers (candidatas a órfãs, fila de decisão):** archive_deleted_message, broadcast_chat_message_deleted, broadcast_collective_message, broadcast_dm_conversation, broadcast_underground_post_deleted, notify_dm_conversation_message, update_beta_requests_updated_at. Todas não reconhecidas no repo.

Perfil: 31 funções de trigger, 47 SECURITY DEFINER, 6 em linguagem sql, 0 procedures. Soma de `usada_por_triggers` = 27 contra 32 triggers no I-0; os 5 restantes devem usar função fora de public/audit. Confirmar no I-2.

## 3. I-1b — diff dos 6 espelhos pré-existentes (repo × banco)

| Espelho | Resultado | Arquivo |
|---|---|---|
| reserve_credit | idêntico | cabeçalho carimbado |
| confirm_reservation | idêntico | cabeçalho carimbado |
| broadcast_collective_member_change | idêntico | cabeçalho carimbado |
| release_reservation | **divergente de forma**: 9 linhas de comentário só no repo e assinatura em 4 linhas vs 1. **Executável idêntico**, conferido com comentários removidos | `release_reservation.LIVE_2026-09-22.sql` ao lado |
| cleanup_stale_reservations | **DIVERGENTE SUBSTANTIVA**: o corpo vivo **não tem** o bloco best-effort que insere a linha `type='refund'` em `credit_history` por reserva varrida, nem as 3 variáveis de saldo. O espelho diz que o bloco foi aplicado em 25/08 via `migrations/credit_refund_history.sql` (commit `d871ed7`) | `cleanup_stale_reservations.LIVE_2026-09-22.sql` ao lado |
| cleanup_user_stale_reservations | **DIVERGENTE SUBSTANTIVA**: mesma ausência, mesma origem declarada | `cleanup_user_stale_reservations.LIVE_2026-09-22.sql` ao lado |

Espelhos originais intocados. Nenhuma divergência resolvida.

**Leitura para decisão:** repo e banco discordam sobre 25/08. Ou a migration só chegou à `release_reservation` (que tem o bloco no banco), ou foi aplicada nas três e as duas de cleanup foram depois sobrescritas por uma versão anterior. Efeito hoje: reservas varridas por timeout devolvem o crédito **sem linha de extrato** em `credit_history`. Decisão do Bob: qual verdade manter e se o bloco deve ser reaplicado. Fila com OK próprio.

## 4. Outros achados de leitura dos corpos (registro, sem ação)

| Achado | Funções | Nota |
|---|---|---|
| Barras invertidas em regex | normalize_text, validate_phone_fields | o export markdown escapa `\`; li `\\` como `\`. Cabeçalho avisa: confirmar no banco antes de reaplicar |
| Literal de string quebrado em duas linhas no corpo vivo | get_shared_analysis, track_referral | mensagens de erro saem com quebra e indentação dentro. É assim no banco. Provável colagem com wrap |
| Trigger no-op | notify_new_subscriber | corpo é só `RETURN NEW`; 1 trigger a usa |
| Sem `search_path` fixado | confirm_reservation, get_quiz_question, get_quiz_question_by_category, get_user_quiz_rank, handle_new_user, log_book_analysis_request, log_film_analysis_request, notify_new_subscriber, update_quiz_updated_at | 9 de 63. As outras: 17 com `''`, 32 com `'public'`, 1 com `'public','extensions'` (search_songs). Fora do escopo do bloco |
| Schema `audit` | 4 triggers de DELETE gravam em `audit.deleted_logs` com `deleted_by = auth.uid()` | única tabela de `audit`; DDL não versionado, fica para o 3(c)-bis. Só `archive_underground_post` era mencionada no repo, em comentário |

## 5. Estado do working tree

| Item | Estado |
|---|---|
| `db/functions/` | 63 espelhos (59 `<nome>.sql` + 4 `audit.<nome>.sql`) + 3 `.LIVE_2026-09-22.sql` + `extract_credit_functions.sql` |
| `db/triggers/` | 32 espelhos |
| `db/policies/` | 63 espelhos |
| `db/INVENTARIO_2026-09-22.md` | COMPLETO: I-0 a I-4, diff dos 6, fila de decisão |
| `new_design/` | proposta (`.md` + `.sql`), status de 27/09, este report |
| git | 3 modificados (cabeçalhos dos 3 espelhos idênticos), ~127 untracked, nada commitado |

## 6. I-2 — Triggers (28/09)

**32 = I-0. Bate.** auth 5, public 22, realtime 1, storage 4. Todas habilitadas. Uso por função idêntico ao I-1a (27) + 5 de plataforma. 32 espelhos em `db/triggers/`.

| Cruzamento com CREATE TRIGGER versionado no repo | Qtd |
|---|---|
| igual | 7 |
| nome divergente (`broadcast_collective_comment_deleted_trigger` no repo, `..._delete_trigger` no banco) | 1 |
| só em comentário | 1 |
| **no repo, ausente no banco** (`validate_dm_reply_target_trigger`, `database/DM_REPLY_CONVERSATION_GUARD_MIGRATION.sql`) | 1 |
| só no banco | 18 |
| plataforma Supabase | 5 |

**Achados para a fila (sem ação):**

1. **`forum_replies` tem duas triggers idênticas** (`trg_update_thread_reply_stats`, `trigger_update_thread_stats`): `reply_count` incrementa e decrementa em dobro.
2. **`validate_dm_reply_target_trigger` nunca chegou ao banco**: a guarda de reply na mesma conversa não está em vigor.
3. **7 funções de trigger órfãs confirmadas** (lista na §2), candidatas a DROP.
4. `on_new_subscriber_notify` em `auth.users` chama função no-op.
5. Nome divergente repo × banco na trigger de delete de comentário coletivo.

## 7. I-3 — Policies RLS (28/09, 3 fatias)

**171 = I-0. Bate.** audit 1, public 164, realtime 4, storage 2. 63 tabelas com policy, RLS ligado em todas, nenhuma RESTRICTIVE. 63 espelhos em `db/policies/` (reconstruídos de `pg_policies`, com `-- depende de:`). O SQL Editor corta em 100 linhas: a primeira colagem veio truncada e o resto chegou em fatias por `tablename`.

| Cruzamento por nome com CREATE POLICY versionado | Qtd |
|---|---|
| policies vivas com nome em alguma migration | 29 |
| policies vivas só no banco | 142 |
| nomes do repo que não existem no banco | 40 (16 do módulo ads + `user_profiles`, 10 `Service role full access on/to ...`, 6 de leitura antiga renomeadas, 4 de `unsafe_zone_conversations`, 3 de shares) |

O I-0 conta 63 tabelas em `public`; 60 têm policy. As 3 restantes saem no I-4a/b.

**Achados para a fila (sem ação):**

1. **`direct_messages`: INSERT contornável.** `Users can send messages` (só `sender_id = auth.uid()`) coexiste com a policy que exige ser membro da conversa. PERMISSIVE soma por OR: qualquer logado insere em qualquer `conversation_id`.
2. **`storage.objects` bucket `tts-audio`: policy "Service role full access" vale `TO public`, FOR ALL.** Escrita e exclusão abertas a quem passar nos GRANTs (anon/authenticated no padrão). Confirmar GRANTs.
3. **`panel_analyses`: INSERT `TO public WITH CHECK (true)`.**
4. **Fórum com policies duplicadas** em 3 tabelas (par legado + par `forum_*_*`).
5. 6 UPDATE sem `WITH CHECK`; leitura `USING (true)` para authenticated em `collective_members` e outras 8; 11 tabelas só service_role (incl. `podcasts`). Detalhe no inventário.

## 8. I-4 — Contexto (28/09)

**I-4a (sem RLS): nenhuma.** **I-4b (RLS, zero policy):** `public.underground_moderation_log`, `public.underground_reports`, `public.underground_room`. Intencionais: as migrations `underground_modo_a.sql` e `underground_room_e2e.sql` dizem "RLS sem policies = acesso exclusivo do service_role". Fecha 60 + 3 = 63 tabelas de `public`.

Logo, as tabelas dos 40 nomes de policy só-no-repo **não existem no banco**: módulo de anúncios (16 tabelas), `user_profiles`, `unsafe_zone_conversations`.

**I-4c:** 11 tabelas de `public` na publicação `supabase_realtime` (postgres_changes), incluindo `webhooks`, `credits`, `credit_history`, `songs`. O app não consome postgres_changes; só broadcast. Resto de fase anterior, candidata a limpeza. **I-4d:** `audit.deleted_logs`, 9 colunas, DDL não versionado (3(c)-bis).

**Fila de decisão consolidada (13 itens, com gravidade)**: `db/INVENTARIO_2026-09-22.md` § I-4. Os três de gravidade alta: divergência das duas funções de cleanup (I-1b), INSERT contornável em `direct_messages` (I-3), bucket `tts-audio` escrevível por `public` (I-3, confirmar GRANTs).

## 9. Próximo

Inventário completo. Md de fechamento em `new_design/BLOCO3_C_FECHAMENTO_2026-09-28.md`. Aguardando OK do Bob para o commit único `db: espelhos de funcoes, triggers e policies (inventario de 22/09)`.
