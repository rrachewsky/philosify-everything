# Inventário do banco — dump de 22/09/2026 (Bloco 3(c))

**Origem:** `new_design/BLOCO3_C_INVENTARIO_BANCO_2026-09-21.sql`, rodado pelo Bob no SQL Editor do Supabase em 22/09/2026 (só SELECT).
**Papel deste arquivo:** índice objeto → espelho em `db/` e fila de achados do I-4, sem ação. O banco é a cópia executante; os arquivos em `db/` são espelhos.
**Estado:** COMPLETO em 28/09/2026 (I-0 a I-4 recebidos e conferidos). Fila de decisão consolidada na seção I-4. Registro de chegada em `new_design/BLOCO3_C_STATUS_2026-09-27.md`.

---

## I-0 — Contagens (OFICIAL, verbatim, confirmado em 27/09)

| item                  | n   |
|-----------------------|-----|
| funcoes_public        | 59  |
| funcoes_audit         | 4   |
| triggers_nao_internas | 32  |
| policies              | 171 |
| tabelas_public        | 63  |
| tabelas_audit         | 1   |

**Alvos de completude derivados:**

| Bloco | Alvo | Regra |
|---|---|---|
| I-1b (corpos) | **63** | = funcoes_public 59 + funcoes_audit 4. Fatia public deve trazer 59, fatia audit 4. |
| I-2 (triggers) | **32** | = triggers_nao_internas |
| I-3 (policies) | **171** | = policies (public + audit + storage + realtime) |

**Nota de forma (registrada, não resolvida):** o `.sql` versionado no repo emite as duas últimas linhas do I-0 como `tabelas_public_com_rls` e `tabelas_public_sem_rls`. A saída colada traz `tabelas_public` (63) e `tabelas_audit` (1). A variante rodada em 22/09 difere do arquivo do repo nessas duas linhas. As quatro linhas que servem de alvo de completude têm o mesmo rótulo nas duas versões, então os alvos não são afetados. A contagem com/sem RLS de `public` sai do I-4a/b quando chegar.

## Chegada das saídas

| Bloco | Chegou | Linhas | Alvo | Bate |
|---|---|---|---|---|
| I-0 | 27/09 | 6 | — | — |
| I-1a | 27/09 | 63 | 63 (índice) | **SIM** (59 public + 4 audit) |
| I-1b public | 28/09 | 59 | 59 | **SIM** |
| I-1b audit | 28/09 | 4 | 4 | **SIM** |
| I-2 | 28/09 | 32 | 32 | **SIM** |
| I-3 | 28/09 (3 fatias) | 171 | 171 | **SIM** |
| I-4a-d | 28/09 | 0 + 3 + 18 + 1 | — | recebido |

## I-1a — Índice das funções (recebido 27/09, verbatim do SQL Editor, 63 linhas)

Conferência: 63 linhas = 59 `public` + 4 `audit` = I-0. **Bate.** Nenhuma procedure (`prokind = 'p'`) no índice: são 63 funções. 31 retornam `trigger`; 47 são `SECURITY DEFINER`; 6 em linguagem `sql`, o resto `plpgsql`.

Coluna **repo (27/09)**: resultado de `grep -w` do nome da função no repo fora de `db/` (sem `.git`, `node_modules`, `dist`).
- **espelho em db/functions/** (6): os pré-existentes; recebem diff no I-1b.
- **citada em codigo (api/site)** (20): nome aparece em `.js/.jsx/.ts` de `api/` ou `site/` (RPC ou referência).
- **citada so em SQL/migrations** (13): nome aparece só em `.sql`/`.md` do repo, nunca no código.
- **NAO RECONHECIDA no repo** (25): nome não aparece em lugar nenhum do repo. Só existe no banco.

| # | schema | funcao | args | retorno | lang | secdef | src | trg | repo (27/09) | espelho |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | audit | `archive_chat_message` | — | trigger | plpgsql | true | 325 | 1 | NAO RECONHECIDA no repo | `db/functions/audit.archive_chat_message.sql` (gravar no I-1b) |
| 2 | audit | `archive_collective_comment` | — | trigger | plpgsql | true | 533 | 1 | NAO RECONHECIDA no repo | `db/functions/audit.archive_collective_comment.sql` (gravar no I-1b) |
| 3 | audit | `archive_direct_message` | — | trigger | plpgsql | true | 377 | 1 | NAO RECONHECIDA no repo | `db/functions/audit.archive_direct_message.sql` (gravar no I-1b) |
| 4 | audit | `archive_underground_post` | — | trigger | plpgsql | true | 329 | 1 | citada so em SQL/migrations | `db/functions/audit.archive_underground_post.sql` (gravar no I-1b) |
| 5 | public | `acquire_analysis_lock` | p_lock_key text, p_user_id uuid | boolean | plpgsql | true | 328 | 0 | citada em codigo (api/site) | `db/functions/acquire_analysis_lock.sql` (gravar no I-1b) |
| 6 | public | `admin_grant_credits` | p_user_id uuid, p_amount integer, p_type transaction_type, p_reason text | TABLE(success boolean, new_total integer, message text) | plpgsql | true | 739 | 0 | NAO RECONHECIDA no repo | `db/functions/admin_grant_credits.sql` (gravar no I-1b) |
| 7 | public | `archive_deleted_message` | — | trigger | plpgsql | true | 474 | 0 | NAO RECONHECIDA no repo | `db/functions/archive_deleted_message.sql` (gravar no I-1b) |
| 8 | public | `broadcast_chat_deleted` | — | trigger | plpgsql | true | 326 | 1 | NAO RECONHECIDA no repo | `db/functions/broadcast_chat_deleted.sql` (gravar no I-1b) |
| 9 | public | `broadcast_chat_message` | — | trigger | plpgsql | true | 350 | 1 | NAO RECONHECIDA no repo | `db/functions/broadcast_chat_message.sql` (gravar no I-1b) |
| 10 | public | `broadcast_chat_message_deleted` | — | trigger | plpgsql | true | 149 | 0 | NAO RECONHECIDA no repo | `db/functions/broadcast_chat_message_deleted.sql` (gravar no I-1b) |
| 11 | public | `broadcast_collective_comment` | — | trigger | plpgsql | true | 1394 | 1 | citada so em SQL/migrations | `db/functions/broadcast_collective_comment.sql` (gravar no I-1b) |
| 12 | public | `broadcast_collective_comment_deleted` | — | trigger | plpgsql | true | 607 | 1 | citada so em SQL/migrations | `db/functions/broadcast_collective_comment_deleted.sql` (gravar no I-1b) |
| 13 | public | `broadcast_collective_member_change` | — | trigger | plpgsql | true | 960 | 1 | espelho em db/functions/ | `db/functions/broadcast_collective_member_change.sql` (diff no I-1b) |
| 14 | public | `broadcast_collective_message` | — | trigger | plpgsql | true | 360 | 0 | NAO RECONHECIDA no repo | `db/functions/broadcast_collective_message.sql` (gravar no I-1b) |
| 15 | public | `broadcast_dm_conversation` | — | trigger | plpgsql | true | 1135 | 0 | NAO RECONHECIDA no repo | `db/functions/broadcast_dm_conversation.sql` (gravar no I-1b) |
| 16 | public | `broadcast_dm_deleted` | — | trigger | plpgsql | true | 606 | 1 | NAO RECONHECIDA no repo | `db/functions/broadcast_dm_deleted.sql` (gravar no I-1b) |
| 17 | public | `broadcast_dm_edited` | — | trigger | plpgsql | true | 1037 | 1 | NAO RECONHECIDA no repo | `db/functions/broadcast_dm_edited.sql` (gravar no I-1b) |
| 18 | public | `broadcast_dm_inserted` | — | trigger | plpgsql | true | 1511 | 1 | NAO RECONHECIDA no repo | `db/functions/broadcast_dm_inserted.sql` (gravar no I-1b) |
| 19 | public | `broadcast_underground_deleted` | — | trigger | plpgsql | true | 336 | 1 | citada so em SQL/migrations | `db/functions/broadcast_underground_deleted.sql` (gravar no I-1b) |
| 20 | public | `broadcast_underground_post` | — | trigger | plpgsql | true | 862 | 1 | citada so em SQL/migrations | `db/functions/broadcast_underground_post.sql` (gravar no I-1b) |
| 21 | public | `broadcast_underground_post_deleted` | — | trigger | plpgsql | true | 152 | 0 | NAO RECONHECIDA no repo | `db/functions/broadcast_underground_post_deleted.sql` (gravar no I-1b) |
| 22 | public | `calculate_final_score` | p_metaphysics integer, p_epistemology integer, p_ethics integer, p_politics integer, p_aesthetics integer | numeric | plpgsql | false | 626 | 0 | NAO RECONHECIDA no repo | `db/functions/calculate_final_score.sql` (gravar no I-1b) |
| 23 | public | `cleanup_stale_reservations` | p_max_age_minutes integer | integer | plpgsql | true | 893 | 0 | espelho em db/functions/ | `db/functions/cleanup_stale_reservations.sql` (diff no I-1b) |
| 24 | public | `cleanup_user_stale_reservations` | p_user_id uuid, p_age_minutes integer | TABLE(released_count integer, new_total integer, message text) | plpgsql | true | 1353 | 0 | espelho em db/functions/ | `db/functions/cleanup_user_stale_reservations.sql` (diff no I-1b) |
| 25 | public | `confirm_reservation` | p_reservation_id uuid, p_analysis_id text | TABLE(success boolean, message text, total integer, purchased integer, free integer) | plpgsql | false | 2114 | 0 | espelho em db/functions/ | `db/functions/confirm_reservation.sql` (diff no I-1b) |
| 26 | public | `create_notification_preferences` | — | trigger | plpgsql | true | 143 | 1 | NAO RECONHECIDA no repo | `db/functions/create_notification_preferences.sql` (gravar no I-1b) |
| 27 | public | `create_share_token` | p_analysis_id uuid, p_user_id uuid, p_slug character varying | TABLE(id uuid, slug character varying, success boolean, error_message text) | plpgsql | false | 978 | 0 | citada em codigo (api/site) | `db/functions/create_share_token.sql` (gravar no I-1b) |
| 28 | public | `decrement_analysis_comment_count` | p_analysis_id uuid | void | plpgsql | true | 143 | 0 | citada em codigo (api/site) | `db/functions/decrement_analysis_comment_count.sql` (gravar no I-1b) |
| 29 | public | `decrement_collective_member_count` | p_group_id uuid | void | plpgsql | true | 136 | 0 | citada em codigo (api/site) | `db/functions/decrement_collective_member_count.sql` (gravar no I-1b) |
| 30 | public | `find_direct_conversation` | p_user_a uuid, p_user_b uuid | uuid | sql | true | 263 | 0 | citada em codigo (api/site) | `db/functions/find_direct_conversation.sql` (gravar no I-1b) |
| 31 | public | `get_collective_key_version` | p_group_id uuid | integer | plpgsql | true | 135 | 0 | citada em codigo (api/site) | `db/functions/get_collective_key_version.sql` (gravar no I-1b) |
| 32 | public | `get_quiz_question` | p_difficulty integer, p_excluded_ids uuid[] | quiz_questions | sql | false | 160 | 0 | citada em codigo (api/site) | `db/functions/get_quiz_question.sql` (gravar no I-1b) |
| 33 | public | `get_quiz_question_by_category` | p_difficulty integer, p_category text, p_excluded_ids uuid[] | quiz_questions | sql | false | 191 | 0 | citada em codigo (api/site) | `db/functions/get_quiz_question_by_category.sql` (gravar no I-1b) |
| 34 | public | `get_shared_analysis` | p_slug character varying, p_viewer_user_id uuid | TABLE(success boolean, analysis_id uuid, expired boolean, max_views_reached boolean, error_message text) | plpgsql | false | 1183 | 0 | citada em codigo (api/site) | `db/functions/get_shared_analysis.sql` (gravar no I-1b) |
| 35 | public | `get_user_quiz_rank` | p_user_id uuid | TABLE(rank bigint, score integer, best_streak integer, nickname text) | sql | false | 547 | 0 | citada em codigo (api/site) | `db/functions/get_user_quiz_rank.sql` (gravar no I-1b) |
| 36 | public | `handle_new_user` | — | trigger | plpgsql | true | 1224 | 1 | citada em codigo (api/site) | `db/functions/handle_new_user.sql` (gravar no I-1b) |
| 37 | public | `increment_analysis_comment_count` | p_analysis_id uuid | void | plpgsql | true | 130 | 0 | citada em codigo (api/site) | `db/functions/increment_analysis_comment_count.sql` (gravar no I-1b) |
| 38 | public | `increment_collective_analysis_count` | p_group_id uuid | void | plpgsql | true | 127 | 0 | citada em codigo (api/site) | `db/functions/increment_collective_analysis_count.sql` (gravar no I-1b) |
| 39 | public | `increment_collective_member_count` | p_group_id uuid | void | plpgsql | true | 123 | 0 | citada em codigo (api/site) | `db/functions/increment_collective_member_count.sql` (gravar no I-1b) |
| 40 | public | `is_collective_member` | uid uuid, gid uuid | boolean | sql | true | 109 | 0 | citada so em SQL/migrations | `db/functions/is_collective_member.sql` (gravar no I-1b) |
| 41 | public | `is_underground_member` | uid uuid | boolean | sql | true | 118 | 0 | citada so em SQL/migrations | `db/functions/is_underground_member.sql` (gravar no I-1b) |
| 42 | public | `log_analysis_request` | p_user_id uuid, p_analysis_id uuid, p_metadata jsonb | uuid | plpgsql | true | 340 | 0 | citada em codigo (api/site) | `db/functions/log_analysis_request.sql` (gravar no I-1b) |
| 43 | public | `log_book_analysis_request` | p_user_id uuid, p_book_analysis_id uuid, p_metadata jsonb | void | plpgsql | true | 177 | 0 | citada em codigo (api/site) | `db/functions/log_book_analysis_request.sql` (gravar no I-1b) |
| 44 | public | `log_film_analysis_request` | p_user_id uuid, p_film_analysis_id uuid, p_title text, p_director text, p_metadata jsonb | void | plpgsql | true | 222 | 0 | citada em codigo (api/site) | `db/functions/log_film_analysis_request.sql` (gravar no I-1b) |
| 45 | public | `normalize_text` | text text | text | plpgsql | false | 330 | 0 | NAO RECONHECIDA no repo | `db/functions/normalize_text.sql` (gravar no I-1b) |
| 46 | public | `notify_dm_conversation_message` | — | trigger | plpgsql | true | 715 | 0 | NAO RECONHECIDA no repo | `db/functions/notify_dm_conversation_message.sql` (gravar no I-1b) |
| 47 | public | `notify_new_subscriber` | — | trigger | plpgsql | true | 30 | 1 | NAO RECONHECIDA no repo | `db/functions/notify_new_subscriber.sql` (gravar no I-1b) |
| 48 | public | `process_stripe_payment` | p_stripe_session_id character varying, p_stripe_price_id character varying, p_user_id uuid, p_credits integer, p_event_type character varying, p_metadata jsonb | TABLE(success boolean, already_processed boolean, transaction_id uuid, new_balance integer, error_message text) | plpgsql | true | 2819 | 0 | citada em codigo (api/site) | `db/functions/process_stripe_payment.sql` (gravar no I-1b) |
| 49 | public | `process_stripe_refund` | p_stripe_session_id character varying, p_refund_amount numeric, p_original_credits integer, p_partial boolean | TABLE(success boolean, credits_deducted integer, went_negative boolean, error_message text) | plpgsql | false | 2139 | 0 | citada so em SQL/migrations | `db/functions/process_stripe_refund.sql` (gravar no I-1b) |
| 50 | public | `release_analysis_lock` | p_lock_key text | void | plpgsql | true | 74 | 0 | citada em codigo (api/site) | `db/functions/release_analysis_lock.sql` (gravar no I-1b) |
| 51 | public | `release_reservation` | p_reservation_id uuid, p_reason character varying, p_analysis_id uuid | TABLE(success boolean, message text, new_total integer, credits integer, free_remaining integer) | plpgsql | true | 2851 | 0 | espelho em db/functions/ | `db/functions/release_reservation.sql` (diff no I-1b) |
| 52 | public | `reserve_credit` | p_user_id uuid | TABLE(success boolean, reservation_id uuid, used_free boolean, remaining integer, credits integer, message text) | plpgsql | true | 1837 | 0 | espelho em db/functions/ | `db/functions/reserve_credit.sql` (diff no I-1b) |
| 53 | public | `search_songs` | search_query text, search_language text, limit_count integer | TABLE(id uuid, title text, artist text, album text, spotify_id text, spotify_album_cover_url text, final_score numeric, classification text, similarity real) | plpgsql | true | 705 | 0 | NAO RECONHECIDA no repo | `db/functions/search_songs.sql` (gravar no I-1b) |
| 54 | public | `sync_profile_display_name` | — | trigger | plpgsql | true | 350 | 1 | citada so em SQL/migrations | `db/functions/sync_profile_display_name.sql` (gravar no I-1b) |
| 55 | public | `sync_profile_email` | — | trigger | plpgsql | true | 177 | 1 | citada so em SQL/migrations | `db/functions/sync_profile_email.sql` (gravar no I-1b) |
| 56 | public | `track_referral` | p_slug character varying, p_new_user_id uuid, p_bonus_credits integer | TABLE(success boolean, referrer_user_id uuid, already_referred boolean, error_message text) | plpgsql | false | 1285 | 0 | citada em codigo (api/site) | `db/functions/track_referral.sql` (gravar no I-1b) |
| 57 | public | `update_beta_requests_updated_at` | — | trigger | plpgsql | false | 57 | 0 | NAO RECONHECIDA no repo | `db/functions/update_beta_requests_updated_at.sql` (gravar no I-1b) |
| 58 | public | `update_credit_reservations_updated_at` | — | trigger | plpgsql | false | 52 | 1 | NAO RECONHECIDA no repo | `db/functions/update_credit_reservations_updated_at.sql` (gravar no I-1b) |
| 59 | public | `update_quiz_updated_at` | — | trigger | plpgsql | false | 57 | 1 | citada so em SQL/migrations | `db/functions/update_quiz_updated_at.sql` (gravar no I-1b) |
| 60 | public | `update_thread_reply_stats` | — | trigger | plpgsql | false | 575 | 2 | NAO RECONHECIDA no repo | `db/functions/update_thread_reply_stats.sql` (gravar no I-1b) |
| 61 | public | `update_updated_at` | — | trigger | plpgsql | false | 52 | 3 | citada so em SQL/migrations | `db/functions/update_updated_at.sql` (gravar no I-1b) |
| 62 | public | `user_has_group_key` | p_group_id uuid, p_user_id uuid | boolean | plpgsql | true | 141 | 0 | NAO RECONHECIDA no repo | `db/functions/user_has_group_key.sql` (gravar no I-1b) |
| 63 | public | `validate_phone_fields` | — | trigger | plpgsql | false | 965 | 1 | NAO RECONHECIDA no repo | `db/functions/validate_phone_fields.sql` (gravar no I-1b) |

### Funções de trigger sem trigger (usada_por_triggers = 0) — 7, candidatas a órfãs (fila de decisão, sem ação)

| funcao | src | repo |
|---|---|---|
| `archive_deleted_message` | 474 | NAO RECONHECIDA |
| `broadcast_chat_message_deleted` | 149 | NAO RECONHECIDA |
| `broadcast_collective_message` | 360 | NAO RECONHECIDA |
| `broadcast_dm_conversation` | 1135 | NAO RECONHECIDA |
| `broadcast_underground_post_deleted` | 152 | NAO RECONHECIDA |
| `notify_dm_conversation_message` | 715 | NAO RECONHECIDA |
| `update_beta_requests_updated_at` | 57 | NAO RECONHECIDA |

Soma de `usada_por_triggers` = 27 chamadas de trigger sobre funções de `public`+`audit`. I-0 conta 32 triggers não-internas. A diferença (5) deve ser triggers cuja função vive em outro schema (ex.: `auth`, `storage`, `realtime`) ou triggers de outros schemas. Confirmar no I-2.

## I-1b — Corpos das funções (fatia public recebida 28/09, colada em texto; fatia audit pendente, alvo 4)

Conferência public: **59 corpos = 59 do I-0 e do I-1a. Bate.** Nomes idênticos ao índice, nenhum faltando, nenhum a mais. Todos os corpos abrem com `CREATE OR REPLACE FUNCTION` e fecham em `$function$`.

**Reconstrução do texto:** o export markdown do SQL Editor troca quebra de linha por `<br>` e escapa `|` e `\`. Desfiz os três. A leitura de `\\` como `\` afeta só `normalize_text` e `validate_phone_fields` (regex com `\s`, `\d`); os dois arquivos carregam aviso no cabeçalho e devem ser confirmados no banco antes de qualquer reaplicação.

**Gravação em `db/functions/`:** 53 espelhos novos (`<nome>.sql`, cabeçalho padrão com data do dump, classe de reconhecimento e nº de triggers). Os 6 pré-existentes seguiram a §4.2 da proposta:

| Espelho | Resultado do diff (repo × banco) | Ação |
|---|---|---|
| `reserve_credit.sql` | idêntico (módulo whitespace) | linha "Conferido contra o dump de 22/09" no cabeçalho |
| `confirm_reservation.sql` | idêntico (módulo whitespace) | idem |
| `broadcast_collective_member_change.sql` | idêntico (módulo whitespace) | idem |
| `release_reservation.sql` | **divergente de forma**: só comentários (o repo tem 9 linhas de `--` que o banco não tem) e a assinatura quebrada em 4 linhas no repo vs 1 no banco. **Código executável idêntico** (conferido com comentários removidos). | `release_reservation.LIVE_2026-09-22.sql` gravado ao lado; espelho intocado |
| `cleanup_stale_reservations.sql` | **RESOLVIDO 06/10/2026** (alvo de 25/08 aplicado pelo Bob; `new_design/CREDITOS_ETAPA1_REAPERS_2026-10-05.md`). Achado de 22/09: **DIVERGENTE SUBSTANTIVA**: o corpo vivo **não tem** o bloco best-effort que insere a linha `type='refund'` em `credit_history` por reserva varrida (nem as 3 variáveis `v_purchased/v_free/v_total`). O cabeçalho do espelho diz que esse bloco foi aplicado em 25/08 via `migrations/credit_refund_history.sql` (commit `d871ed7`). | `cleanup_stale_reservations.LIVE_2026-09-22.sql` gravado ao lado; espelho intocado |
| `cleanup_user_stale_reservations.sql` | **RESOLVIDO 06/10/2026** (idem). Achado de 22/09: **DIVERGENTE SUBSTANTIVA**: mesma ausência do bloco de `credit_history` (`reason='user_timeout_cleanup'`). Mesma origem declarada (25/08, `d871ed7`). | `cleanup_user_stale_reservations.LIVE_2026-09-22.sql` gravado ao lado; espelho intocado |

**Leitura das duas divergências substantivas (RESOLVIDO 06/10/2026: a verdade era o alvo de 25/08; a migration nunca chegou às duas funções, só a `release_reservation` foi refeita em 29/08. Reaplicado e provado em produção, `new_design/CREDITOS_ETAPA1_REAPERS_2026-10-05.md`. Os `.LIVE` saíram do repo.)** Texto de 22/09: repo e banco contam histórias diferentes sobre 25/08. Ou a migration `credit_refund_history.sql` nunca chegou a essas duas funções (só a `release_reservation`, que tem o bloco), ou foi aplicada e depois sobrescrita por uma versão anterior. Efeito prático hoje: reservas varridas por timeout devolvem o crédito **sem linha de extrato** em `credit_history`. Decisão do Bob: qual é a verdade a manter, e se o bloco deve ser reaplicado (fila, OK próprio).

**Outros achados de leitura dos corpos (registro, sem ação):**
- `get_shared_analysis` e `track_referral`: o corpo vivo tem literais de string quebrados em duas linhas (ex.: `'Share link not` + quebra + `found'::TEXT`). É assim que está no banco; as mensagens de erro saem com quebra de linha e indentação dentro. Provável colagem de terminal com wrap.
- `notify_new_subscriber`: corpo é só `RETURN NEW`. Trigger no-op, mas o I-1a diz que 1 trigger a usa.
- `search_path`: 17 funções com `SET search_path TO ''` (broadcast/archive/admin), 32 com `'public'`, 1 com `'public','extensions'` (`search_songs`), **9 sem search_path fixado**: `confirm_reservation`, `get_quiz_question`, `get_quiz_question_by_category`, `get_user_quiz_rank`, `handle_new_user`, `log_book_analysis_request`, `log_film_analysis_request`, `notify_new_subscriber`, `update_quiz_updated_at`. Registro para o supervisor; não é escopo deste bloco.

## I-1b audit — recebido 28/09 (4 corpos)

Conferência: **4 corpos = 4 do I-0 e do I-1a. Bate.** Com a fatia public, **I-1b fecha em 63/63.**

Gravados `db/functions/audit.archive_chat_message.sql`, `audit.archive_collective_comment.sql`, `audit.archive_direct_message.sql`, `audit.archive_underground_post.sql`. Todas: `SECURITY DEFINER`, `SET search_path TO ''`, 1 trigger cada (I-1a).

**Leitura (registro, sem ação):** as 4 são triggers de DELETE que gravam em `audit.deleted_logs` (source_table, source_id, sender_id, deleted_by = `auth.uid()`, original_created_at; `collective_id` ou `conversation_id` quando aplicável), com `ON CONFLICT (source_table, source_id) DO NOTHING`. Só `archive_underground_post` era conhecida do repo, e apenas como menção em comentário de `migrations/broadcast_underground_post.sql` (linha 10), sem `CREATE FUNCTION`; as outras 3 só existiam no banco. Nenhuma das 4 tinha corpo versionado antes deste dump. A tabela `audit.deleted_logs` é a única do schema `audit` (I-0: tabelas_audit = 1) e não está versionada; DDL fica para o 3(c)-bis. Ver I-4d quando chegar.


## I-2 — Triggers (recebido 28/09, verbatim, 32 linhas)

Conferência: **32 = I-0. Bate.** Por schema: auth 5, public 22, realtime 1, storage 4. Todas com `tgenabled = O` (habilitadas). Nenhuma desabilitada.

Cruzamento com I-1a: a contagem de triggers por função (27 sobre funções de `public`+`audit`) é **idêntica** à coluna `usada_por_triggers` do I-1a, função a função. As 5 restantes (realtime 1, storage 4) usam funções de plataforma Supabase fora do escopo do I-1. Fica explicada a diferença 27 vs 32 anotada no I-1a.

Nota de forma: a saída veio com colunas `def | funcao | enabled`; o `.sql` do repo pede `enabled | funcao | definicao`. Mesmo conteúdo, ordem diferente. Sem efeito.

**Gravação:** 32 arquivos `db/triggers/<schema>.<tabela>.<tgname>.sql`, cada um com o `CREATE TRIGGER` exato de `pg_get_triggerdef`, cabeçalho padrão e ponteiro para o espelho da função. As 5 de plataforma levam aviso.

**Cruzamento com os `CREATE TRIGGER` já versionados no repo (grep em `*.sql` fora de `db/`, 28/09):**

| Situação | Qtd | Quais |
|---|---|---|
| versionado e igual ao banco | 7 | on_auth_user_created, on_auth_user_email_updated, on_auth_user_metadata_updated, update_profiles_updated_at, update_credits_updated_at (todas em `migrations/schema_reference.sql`), quiz_questions_updated_at (`migrations/quiz_tables.sql`), broadcast_collective_comment_trigger (`migrations/collective_comments_realtime_broadcast.sql`) |
| versionado com **nome divergente** | 1 | a migration `collective_comments_realtime_broadcast.sql:110` cria `broadcast_collective_comment_deleted_trigger`; o banco tem `broadcast_collective_comment_delete_trigger`. Mesma definição. O nome do banco é o que vale; o do repo nunca existiu ou foi renomeado |
| versionado só em comentário | 1 | broadcast_collective_member_trigger (`collective_comments_realtime_broadcast.sql:182`), função já espelhada em 16/09 |
| **versionado no repo, AUSENTE no banco** | 1 | `validate_dm_reply_target_trigger` em `database/DM_REPLY_CONVERSATION_GUARD_MIGRATION.sql:45` (BEFORE INSERT OR UPDATE OF reply_to_id, conversation_id ON direct_messages → `validate_dm_reply_target_same_conversation()`). Nem a trigger nem a função aparecem no dump: a migration **nunca foi aplicada** ou foi desfeita. Fila de decisão |
| só no banco, sem CREATE no repo | 18 | as 5 de `auth`/`public` restantes com função não reconhecida (on_auth_user_created_notification_prefs, on_new_subscriber_notify, analyses_updated_at, credit_reservations_updated_at, validate_phone_before_update), as 4 `archive_*_trigger`, as 7 `broadcast_*` de chat (2), dm (3) e underground (2), e trg_update_thread_reply_stats + trigger_update_thread_stats |
| plataforma Supabase | 5 | realtime.subscription (1), storage.buckets (2), storage.objects (2) |

**Achados (fila de decisão, sem ação):**

1. **`forum_replies` tem duas triggers idênticas**: `trg_update_thread_reply_stats` e `trigger_update_thread_stats`, ambas AFTER INSERT OR DELETE FOR EACH ROW → `update_thread_reply_stats()`. Cada resposta criada incrementa `forum_threads.reply_count` **duas vezes**, cada apagada decrementa duas vezes (com piso em 0). É a razão do `usada_por_triggers = 2` visto no I-1a. Provável causa: a trigger foi criada duas vezes com nomes diferentes. Candidata a DROP de uma das duas, com OK próprio.
2. **`validate_dm_reply_target_trigger` existe no repo e não no banco** (acima). A guarda "reply só dentro da mesma conversa" que a migration prometia **não está em vigor**.
3. **7 funções de trigger órfãs confirmadas** (I-1a, nenhuma trigger aponta para elas): archive_deleted_message, broadcast_chat_message_deleted, broadcast_collective_message, broadcast_dm_conversation, broadcast_underground_post_deleted, notify_dm_conversation_message, update_beta_requests_updated_at. Parecem versões anteriores substituídas por `broadcast_chat_deleted`, `broadcast_dm_inserted`, `broadcast_underground_deleted`, `audit.archive_*`. Candidatas a DROP, com OK próprio. `update_beta_requests_updated_at` sugere que `beta_requests` ficou sem trigger de `updated_at`.
4. `on_new_subscriber_notify` chama `notify_new_subscriber()`, que é no-op (`RETURN NEW`). Trigger sem efeito em `auth.users`.
5. Nome divergente `..._deleted_trigger` (repo) vs `..._delete_trigger` (banco): qualquer `DROP TRIGGER` futuro copiado da migration falharia. Registrar; o espelho em `db/triggers/` já tem o nome certo.

### Índice I-2

| # | schema | tabela | trigger | função | repo (CREATE TRIGGER versionado) | espelho |
|---|---|---|---|---|---|---|
| 1 | auth | users | `on_auth_user_created` | `handle_new_user` | migrations/schema_reference.sql:439 | `db/triggers/auth.users.on_auth_user_created.sql` |
| 2 | auth | users | `on_auth_user_created_notification_prefs` | `create_notification_preferences` | — | `db/triggers/auth.users.on_auth_user_created_notification_prefs.sql` |
| 3 | auth | users | `on_auth_user_email_updated` | `sync_profile_email` | migrations/schema_reference.sql:466 | `db/triggers/auth.users.on_auth_user_email_updated.sql` |
| 4 | auth | users | `on_auth_user_metadata_updated` | `sync_profile_display_name` | migrations/schema_reference.sql:495 | `db/triggers/auth.users.on_auth_user_metadata_updated.sql` |
| 5 | auth | users | `on_new_subscriber_notify` | `notify_new_subscriber` | — | `db/triggers/auth.users.on_new_subscriber_notify.sql` |
| 6 | public | analyses | `analyses_updated_at` | `update_updated_at` | — | `db/triggers/public.analyses.analyses_updated_at.sql` |
| 7 | public | chat_messages | `archive_chat_message_trigger` | `audit.archive_chat_message` | — | `db/triggers/public.chat_messages.archive_chat_message_trigger.sql` |
| 8 | public | chat_messages | `broadcast_chat_delete_trigger` | `broadcast_chat_deleted` | — | `db/triggers/public.chat_messages.broadcast_chat_delete_trigger.sql` |
| 9 | public | chat_messages | `broadcast_chat_message_trigger` | `broadcast_chat_message` | — | `db/triggers/public.chat_messages.broadcast_chat_message_trigger.sql` |
| 10 | public | collective_comments | `archive_collective_comment_trigger` | `audit.archive_collective_comment` | — | `db/triggers/public.collective_comments.archive_collective_comment_trigger.sql` |
| 11 | public | collective_comments | `broadcast_collective_comment_delete_trigger` | `broadcast_collective_comment_deleted` | migrations/collective_comments_realtime_broadcast.sql:110 | `db/triggers/public.collective_comments.broadcast_collective_comment_delete_trigger.sql` |
| 12 | public | collective_comments | `broadcast_collective_comment_trigger` | `broadcast_collective_comment` | migrations/collective_comments_realtime_broadcast.sql:67 | `db/triggers/public.collective_comments.broadcast_collective_comment_trigger.sql` |
| 13 | public | collective_members | `broadcast_collective_member_trigger` | `broadcast_collective_member_change` | migrations/collective_comments_realtime_broadcast.sql:182 | `db/triggers/public.collective_members.broadcast_collective_member_trigger.sql` |
| 14 | public | credit_reservations | `credit_reservations_updated_at` | `update_credit_reservations_updated_at` | — | `db/triggers/public.credit_reservations.credit_reservations_updated_at.sql` |
| 15 | public | credits | `update_credits_updated_at` | `update_updated_at` | migrations/schema_reference.sql:522 | `db/triggers/public.credits.update_credits_updated_at.sql` |
| 16 | public | direct_messages | `archive_direct_message_trigger` | `audit.archive_direct_message` | — | `db/triggers/public.direct_messages.archive_direct_message_trigger.sql` |
| 17 | public | direct_messages | `broadcast_dm_delete_trigger` | `broadcast_dm_deleted` | — | `db/triggers/public.direct_messages.broadcast_dm_delete_trigger.sql` |
| 18 | public | direct_messages | `broadcast_dm_edit_trigger` | `broadcast_dm_edited` | — | `db/triggers/public.direct_messages.broadcast_dm_edit_trigger.sql` |
| 19 | public | direct_messages | `broadcast_dm_insert_trigger` | `broadcast_dm_inserted` | — | `db/triggers/public.direct_messages.broadcast_dm_insert_trigger.sql` |
| 20 | public | forum_replies | `trg_update_thread_reply_stats` | `update_thread_reply_stats` | — | `db/triggers/public.forum_replies.trg_update_thread_reply_stats.sql` |
| 21 | public | forum_replies | `trigger_update_thread_stats` | `update_thread_reply_stats` | — | `db/triggers/public.forum_replies.trigger_update_thread_stats.sql` |
| 22 | public | profiles | `update_profiles_updated_at` | `update_updated_at` | migrations/schema_reference.sql:517 | `db/triggers/public.profiles.update_profiles_updated_at.sql` |
| 23 | public | profiles | `validate_phone_before_update` | `validate_phone_fields` | — | `db/triggers/public.profiles.validate_phone_before_update.sql` |
| 24 | public | quiz_questions | `quiz_questions_updated_at` | `update_quiz_updated_at` | migrations/quiz_tables.sql:239 | `db/triggers/public.quiz_questions.quiz_questions_updated_at.sql` |
| 25 | public | underground_posts | `archive_underground_post_trigger` | `audit.archive_underground_post` | — | `db/triggers/public.underground_posts.archive_underground_post_trigger.sql` |
| 26 | public | underground_posts | `broadcast_underground_delete_trigger` | `broadcast_underground_deleted` | — | `db/triggers/public.underground_posts.broadcast_underground_delete_trigger.sql` |
| 27 | public | underground_posts | `broadcast_underground_post_trigger` | `broadcast_underground_post` | — | `db/triggers/public.underground_posts.broadcast_underground_post_trigger.sql` |
| 28 | realtime | subscription | `tr_check_filters` | `realtime.subscription_check_filters` | plataforma | `db/triggers/realtime.subscription.tr_check_filters.sql` |
| 29 | storage | buckets | `enforce_bucket_name_length_trigger` | `storage.enforce_bucket_name_length` | plataforma | `db/triggers/storage.buckets.enforce_bucket_name_length_trigger.sql` |
| 30 | storage | buckets | `protect_buckets_delete` | `storage.protect_delete` | plataforma | `db/triggers/storage.buckets.protect_buckets_delete.sql` |
| 31 | storage | objects | `protect_objects_delete` | `storage.protect_delete` | plataforma | `db/triggers/storage.objects.protect_objects_delete.sql` |
| 32 | storage | objects | `update_objects_updated_at` | `storage.update_updated_at_column` | plataforma | `db/triggers/storage.objects.update_objects_updated_at.sql` |

## I-3 — Policies RLS (recebido 28/09 em 3 fatias, 171 linhas)

Conferência: **171 = I-0. Bate.** Fatias: (1) public `analyses`–`graph_nodes` 96 + a colagem cortada anterior (100, teto do SQL Editor); (2) public `notification_preferences`–`webhooks` 68, com 3 repetidas descartadas pela chave; (3) realtime 4 + storage 2. Por schema: audit 1, public 164, realtime 4, storage 2. **63 tabelas com policy** (audit 1, public 60, realtime 1, storage 1). RLS ligado em todas as 63; nenhuma policy RESTRICTIVE; cmds: ALL 49, SELECT 61, INSERT 30, UPDATE 15, DELETE 16; roles usados: service_role, public, authenticated, supabase_auth_admin, postgres.

O I-0 conta 63 tabelas em `public`; só 60 têm policy. As 3 restantes são as candidatas do I-4a/b.

**Gravação:** 63 arquivos `db/policies/<schema>.<tabela>.sql`, cada um com `ALTER TABLE … ENABLE ROW LEVEL SECURITY` e os `CREATE POLICY` **reconstruídos** de `pg_policies` (aviso de equivalência no cabeçalho, não byte-a-byte). Policies que citam outra tabela (por `FROM`/`JOIN` ou via `is_collective_member`/`is_underground_member`) levam `-- depende de:` na policy e no cabeçalho do arquivo (lição do 2BP01).

**Cruzamento com os `CREATE POLICY` versionados no repo** (10 arquivos `.sql`, 69 nomes distintos; comparação por nome, não por corpo): 29 das 171 policies vivas têm o nome em alguma migration; 142 só existem no banco. No sentido inverso, **40 nomes do repo não existem no banco**: 16 `Service role only - <ad_*/advertisers/agencies/...>` de `migrations/ads_operational_fixes.sql` (módulo de anúncios) + `Service role only - user_profiles`, 10 `Service role full access on/to <tabela>` e 6 de leitura antiga (`Users can view own credits/history/profile/requests`, `Users can view paid analyses`, `Anyone can view songs`) de `schema_reference.sql`/`URGENT_enable_rls_all_tables.sql` (renomeadas para `Service Role Full Access`/`Owner Access ...`/`Public Read ...` no banco), 4 `Users can ... own conversation` de `unsafe_zone_conversations.sql`, 3 de shares (`Users can create/delete own/view own shares`). Ou as tabelas não existem, ou as policies foram renomeadas, ou a migration nunca rodou. O I-4a/b diz qual.

**Achados (fila de decisão, sem ação):**

1. **`direct_messages`: a checagem de membro da conversa é contornável.** Duas policies de INSERT coexistem: `Conversation members can send messages` (exige `sender_id = auth.uid()` **e** pertencer a `dm_conversation_members`) e `Users can send messages` (exige só `auth.uid() = sender_id`). Policies PERMISSIVE somam por OR, então a mais fraca vence: qualquer usuário autenticado pode inserir mensagem em **qualquer** `conversation_id`. Mesmo padrão no SELECT (`Users can read own messages` por sender/recipient vs `Conversation members can view messages`), menos grave. Provável resto da migração DM antiga para conversas.
2. **`storage.objects` / `Service role full access for tts-audio`: o nome diz service role, a policy vale para `public`.** `FOR ALL TO public USING/WITH CHECK (bucket_id = 'tts-audio')`. Qualquer role que passe nos GRANTs de `storage.objects` (anon e authenticated, no padrão Supabase) pode inserir, alterar e apagar objetos do bucket `tts-audio`. Confirmar GRANTs antes de decidir; candidata a `TO service_role`.
3. **`panel_analyses` / `Service can insert panel analyses`: `FOR INSERT TO public WITH CHECK (true)`.** Qualquer role insere linhas. Candidata a `TO service_role`.
4. **Conjuntos duplicados em `forum_replies`, `forum_threads`, `forum_votes`**: cada tabela tem o par legado `Users can ...` e o par `forum_*_select/insert/update/delete` com o mesmo efeito. `forum_votes` tem 2 INSERT idênticos, 2 SELECT idênticos. Inofensivo, mas dobra o custo de manutenção e o risco de divergir. Candidatas a limpeza.
5. **6 UPDATE sem `WITH CHECK`** (`forum_votes_update`, `notification_preferences / Users can update own preferences`, `quiz_sessions_update`, `unsafe_zone_sessions / Users can update own sessions`, `user_news_preferences / Users can update own news preferences`, `user_public_keys / Users can update their own public key`): o dono pode reatribuir a linha a outro `user_id`. Baixo risco; registrar.
6. **Leitura ampla para `authenticated`** (`USING (true)`): `chat_messages`, `collective_analyses`, `collective_groups`, `collective_members`, `forum_*`, `user_public_keys`. Em especial `collective_members`: qualquer logado vê todas as adesões de todos os grupos. Decisão de produto, não bug; registrar.
7. **11 tabelas só com policy de service_role** (bloqueadas para anon/authenticated): `audit.deleted_logs`, `analysis_locks`, `constellation_edge_candidates`, `constellation_extraction_log`, `constellation_node_candidates`, `deleted_messages`, `email_queue`, `podcasts`, `push_notification_queue`, `trigger_debug`, `webhooks`. Coerente com o desenho (acesso só pelo Worker). `podcasts` chama atenção: se o site lê podcasts com anon key, essa leitura falha.
8. Duas grafias para "service role": `TO service_role` (38 policies) e `TO public USING (auth.role() = 'service_role')` ou `auth.jwt() ->> 'role'` (15). Equivalentes na prática; padronizar é cosmético.

### Índice I-3 (63 tabelas)

| # | tabela | policies | cmds | depende de | nomes no repo |
|---|---|---|---|---|---|
| 1 | `audit.deleted_logs` | 1 | ALL | — | 0/1 |
| 2 | `public.analyses` | 2 | ALL,SELECT | — | 0/2 |
| 3 | `public.analysis_locks` | 1 | ALL | — | 0/1 |
| 4 | `public.blocked_users` | 4 | DELETE,INSERT,SELECT,SELECT | — | 0/4 |
| 5 | `public.book_analyses` | 2 | ALL,SELECT | user_book_analysis_requests | 2/2 |
| 6 | `public.books` | 2 | ALL,SELECT | — | 2/2 |
| 7 | `public.chat_messages` | 4 | ALL,DELETE,INSERT,SELECT | — | 0/4 |
| 8 | `public.collective_analyses` | 2 | ALL,SELECT | — | 0/2 |
| 9 | `public.collective_comments` | 4 | ALL,DELETE,INSERT,SELECT | collective_analyses, collective_members | 0/4 |
| 10 | `public.collective_group_keys` | 2 | ALL,SELECT | — | 0/2 |
| 11 | `public.collective_groups` | 2 | ALL,SELECT | — | 0/2 |
| 12 | `public.collective_members` | 4 | ALL,DELETE,INSERT,SELECT | — | 0/4 |
| 13 | `public.colloquium_access` | 2 | ALL,SELECT | — | 0/2 |
| 14 | `public.constellation_analysis_links` | 2 | ALL,SELECT | — | 0/2 |
| 15 | `public.constellation_edge_candidates` | 1 | ALL | — | 0/1 |
| 16 | `public.constellation_extraction_log` | 1 | ALL | — | 0/1 |
| 17 | `public.constellation_node_candidates` | 1 | ALL | — | 0/1 |
| 18 | `public.credit_history` | 4 | ALL,INSERT,INSERT,SELECT | — | 0/4 |
| 19 | `public.credit_reservations` | 2 | ALL,SELECT | — | 0/2 |
| 20 | `public.credits` | 4 | ALL,INSERT,INSERT,SELECT | — | 0/4 |
| 21 | `public.deleted_messages` | 1 | ALL | — | 0/1 |
| 22 | `public.direct_messages` | 7 | ALL,DELETE,INSERT,INSERT,SELECT,SELECT,UPDATE | dm_conversation_members | 0/7 |
| 23 | `public.dm_conversation_members` | 1 | SELECT | — | 0/1 |
| 24 | `public.dm_conversations` | 1 | SELECT | dm_conversation_members | 0/1 |
| 25 | `public.dm_group_keys` | 1 | SELECT | — | 0/1 |
| 26 | `public.dm_reactions` | 3 | DELETE,INSERT,SELECT | direct_messages, dm_conversation_members | 0/3 |
| 27 | `public.dm_read_receipts` | 1 | SELECT | — | 0/1 |
| 28 | `public.email_queue` | 1 | ALL | — | 0/1 |
| 29 | `public.featured_songs` | 2 | ALL,SELECT | — | 0/2 |
| 30 | `public.film_analyses` | 2 | ALL,SELECT | user_film_analysis_requests | 2/2 |
| 31 | `public.films` | 2 | ALL,SELECT | — | 2/2 |
| 32 | `public.forum_replies` | 8 | ALL,DELETE,DELETE,INSERT,SELECT,SELECT,UPDATE,UPDATE | — | 0/8 |
| 33 | `public.forum_threads` | 7 | ALL,DELETE,DELETE,INSERT,SELECT,SELECT,UPDATE | — | 0/7 |
| 34 | `public.forum_votes` | 9 | ALL,DELETE,DELETE,INSERT,INSERT,SELECT,SELECT,UPDATE,UPDATE | — | 0/9 |
| 35 | `public.graph_edges` | 2 | ALL,SELECT | — | 2/2 |
| 36 | `public.graph_nodes` | 2 | ALL,SELECT | — | 2/2 |
| 37 | `public.notification_preferences` | 6 | ALL,INSERT,INSERT,SELECT,SELECT,UPDATE | — | 0/6 |
| 38 | `public.notifications` | 3 | ALL,SELECT,UPDATE | — | 0/3 |
| 39 | `public.panel_analyses` | 2 | INSERT,SELECT | — | 2/2 |
| 40 | `public.podcasts` | 1 | ALL | — | 0/1 |
| 41 | `public.profiles` | 5 | ALL,INSERT,INSERT,SELECT,UPDATE | — | 0/5 |
| 42 | `public.push_notification_queue` | 1 | ALL | — | 0/1 |
| 43 | `public.push_subscriptions` | 4 | DELETE,INSERT,SELECT,SELECT | — | 0/4 |
| 44 | `public.quiz_answers` | 2 | INSERT,SELECT | quiz_sessions | 0/2 |
| 45 | `public.quiz_profiles` | 4 | ALL,INSERT,SELECT,UPDATE | — | 4/4 |
| 46 | `public.quiz_questions` | 1 | SELECT | — | 0/1 |
| 47 | `public.quiz_sessions` | 3 | INSERT,SELECT,UPDATE | — | 0/3 |
| 48 | `public.share_tokens` | 2 | ALL,ALL | — | 0/2 |
| 49 | `public.songs` | 2 | ALL,SELECT | — | 0/2 |
| 50 | `public.space_access` | 4 | ALL,INSERT,SELECT,UPDATE | — | 0/4 |
| 51 | `public.stripe_customers` | 2 | ALL,SELECT | — | 0/2 |
| 52 | `public.trigger_debug` | 1 | ALL | — | 0/1 |
| 53 | `public.underground_posts` | 4 | ALL,DELETE,INSERT,SELECT | space_access | 0/4 |
| 54 | `public.underground_reactions` | 4 | ALL,DELETE,INSERT,SELECT | space_access | 0/4 |
| 55 | `public.unsafe_zone_sessions` | 4 | DELETE,INSERT,SELECT,UPDATE | — | 4/4 |
| 56 | `public.user_analysis_requests` | 2 | ALL,SELECT | — | 0/2 |
| 57 | `public.user_book_analysis_requests` | 2 | ALL,SELECT | — | 2/2 |
| 58 | `public.user_film_analysis_requests` | 2 | ALL,SELECT | — | 2/2 |
| 59 | `public.user_news_preferences` | 3 | INSERT,SELECT,UPDATE | — | 3/3 |
| 60 | `public.user_public_keys` | 3 | INSERT,SELECT,UPDATE | — | 0/3 |
| 61 | `public.webhooks` | 1 | ALL | — | 0/1 |
| 62 | `realtime.messages` | 4 | SELECT,SELECT,SELECT,SELECT | collective_members (via is_collective_member), space_access (via is_underground_member) | 0/4 |
| 63 | `storage.objects` | 2 | ALL,SELECT | — | 0/2 |

## I-4 — Contexto e achados para decisão (recebido 28/09)

### I-4a — Tabelas de `public`/`audit` SEM RLS

**Nenhuma.** (`Success No Rows`.) Todas as 63 tabelas de `public` e a 1 de `audit` têm RLS ligado.

### I-4b — Tabelas COM RLS e ZERO policy (verbatim)

| nspname | relname |
|---|---|
| public | underground_moderation_log |
| public | underground_reports |
| public | underground_room |

Fecha a conta: 60 tabelas com policy (I-3) + 3 sem policy = 63 = I-0. **As 3 são intencionais**: `migrations/underground_modo_a.sql:57` e `migrations/underground_room_e2e.sql:67,113` dizem "RLS habilitado SEM policies = acesso exclusivo do service_role". O Worker (`api/src/handlers/underground.js`, `api/src/utils/roomKey.js`) acessa com service_role. Não é achado; é desenho documentado. Sem espelho em `db/policies/` porque não há policy; o `ENABLE ROW LEVEL SECURITY` delas está nas migrations citadas.

**Consequência para o cruzamento do I-3:** como as 63 tabelas de `public` estão todas contadas, as tabelas dos 40 nomes de policy que existem só no repo **não existem no banco**: o módulo de anúncios inteiro (`ad_campaigns`, `ad_impressions`, `ad_orders`, `ad_plans`, `advertiser_sessions`, `advertiser_transactions`, `advertisers`, `agencies`, `agency_sessions`, `agency_transactions`, `cpm_pricing`, `creative_requests`, `inventory_forecast`, `order_reservations`, `pricing_config`, `targeting_options` de `migrations/ads_operational_fixes.sql`), `user_profiles` e `unsafe_zone_conversations`. Ou nunca foram aplicadas, ou foram dropadas. A função órfã `broadcast_dm_conversation` lê `public.user_profiles`, que não existe: falharia se alguma trigger a chamasse (nenhuma chama).

### I-4c — Publicações realtime (verbatim)

| pubname | schemaname | tablename |
|---|---|---|
| supabase_realtime | public | chat_messages |
| supabase_realtime | public | collective_comments |
| supabase_realtime | public | credit_history |
| supabase_realtime | public | credits |
| supabase_realtime | public | direct_messages |
| supabase_realtime | public | forum_replies |
| supabase_realtime | public | forum_threads |
| supabase_realtime | public | notifications |
| supabase_realtime | public | songs |
| supabase_realtime | public | underground_posts |
| supabase_realtime | public | webhooks |
| supabase_realtime_messages_publication | realtime | messages_2026_09_18 … messages_2026_09_24 (7 partições diárias, plataforma) |

Leitura: 11 tabelas de `public` estão na publicação `supabase_realtime` (postgres_changes). **O app não usa postgres_changes**: `site/src` só abre canais de broadcast/presence (`agora`, `underground`, `collective:<id>`, `dm:<uid>`, `dm-typing:<id>`, `presence:online`), e o servidor emite por `realtime.send()` nas triggers `broadcast_*`. A publicação é resto de uma fase anterior. `webhooks`, `credits`, `credit_history` e `songs` expostos a postgres_changes não vazam dados (RLS vale), mas geram WAL de replicação à toa. Candidata a limpeza, baixa prioridade.

### I-4d — Schema `audit` (verbatim)

| tabela_audit | colunas |
|---|---|
| deleted_logs | 9 |

Uma tabela, 9 colunas, RLS ligado, 1 policy (service_role), alimentada pelas 4 triggers `archive_*_trigger` (I-2). DDL não versionado: colunas conhecidas pelos INSERTs das funções (`source_table`, `source_id`, `sender_id`, `collective_id`, `conversation_id`, `deleted_by`, `original_created_at`, mais 2, provavelmente `id` e `deleted_at`) e pela constraint `ON CONFLICT (source_table, source_id)`. Fica para o 3(c)-bis. Nota de forma: a saída veio com colunas `tabela_audit | colunas`, variante do I-4d do `.sql` do repo (que pede `relname, relkind, colunas`). Sem efeito.

### Parecer do supervisor sobre o I-4 (28/09/2026)

- **I-4a:** zero tabelas sem RLS. Nenhum achado.
- **I-4b:** as 3 tabelas `underground_*` com RLS-sem-policy são **desenho intencional do Modo A**: negação total a anon/authenticated, acesso só via service key do Worker. **Manter; não é pendência.**
- **I-4c:** registrar item **BAIXO** na fila: enxugar a publicação `supabase_realtime` (`credits`, `credit_history`, `webhooks`, `songs` expostos a postgres_changes sem uso). RLS protege, mas é superfície desnecessária. Já consta como item 11 da fila.
- **`.gitignore`:** a negação `!db/functions|triggers|policies/*.sql` aplicada neste commit adianta parte do **3(d)**, cuja revisão completa do `.gitignore` segue na fila.

### Fila de decisão consolidada (I-1 a I-4) — sem ação neste bloco, cada item com OK próprio

| # | Achado | Origem | Gravidade (leitura minha) |
|---|---|---|---|
| 1 | **RESOLVIDO 06/10/2026** (`new_design/CREDITOS_ETAPA1_REAPERS_2026-10-05.md`). `cleanup_stale_reservations` e `cleanup_user_stale_reservations`: corpo vivo sem o INSERT de reembolso em `credit_history` que o espelho de 25/08 documenta. Reservas varridas por timeout devolvem crédito sem extrato | I-1b | era alta: repo e banco discordam; decidir a verdade e se reaplica |
| 2 | `direct_messages`: policy `Users can send messages` contorna a checagem de membro da conversa (PERMISSIVE por OR) | I-3 | alta: qualquer logado insere em qualquer conversa |
| 3 | `storage.objects` bucket `tts-audio`: policy "Service role full access" é `TO public`, FOR ALL | I-3 | alta se GRANTs permitirem anon/authenticated; confirmar GRANTs |
| 4 | `panel_analyses`: INSERT `TO public WITH CHECK (true)` | I-3 | média |
| 5 | `forum_replies` com duas triggers idênticas: `reply_count` anda em dobro | I-2 | média: dado errado em `forum_threads.reply_count` |
| 6 | `validate_dm_reply_target_trigger` versionado no repo, ausente no banco: guarda de reply na mesma conversa não vigora | I-2 | média |
| 7 | 7 funções de trigger órfãs (`archive_deleted_message`, `broadcast_chat_message_deleted`, `broadcast_collective_message`, `broadcast_dm_conversation`, `broadcast_underground_post_deleted`, `notify_dm_conversation_message`, `update_beta_requests_updated_at`) | I-1a/I-2 | baixa: lixo; candidatas a DROP |
| 8 | Módulo de anúncios (16 tabelas), `user_profiles`, `unsafe_zone_conversations`: migrations no repo, tabelas ausentes no banco | I-3/I-4b | baixa: registrar como nunca aplicadas ou dropadas |
| 9 | Fórum com policies duplicadas (3 tabelas); nome de trigger divergente repo × banco (`..._deleted_trigger` vs `..._delete_trigger`) | I-3/I-2 | baixa: limpeza |
| 10 | 6 UPDATE sem `WITH CHECK`; 9 funções sem `search_path` fixado; `on_new_subscriber_notify` no-op; literais quebrados em `get_shared_analysis`/`track_referral` | I-3/I-1b | baixa: registrar |
| 11 | Publicação `supabase_realtime` com 11 tabelas e nenhum consumidor postgres_changes | I-4c | baixa: limpeza |
| 12 | `release_reservation`: espelho difere do banco só em comentários; decidir se o espelho passa a ser o corpo vivo sem comentários ou mantém | I-1b | cosmética |
| 13 | DDL de tabelas (colunas, índices, constraints) e de `audit.deleted_logs` não versionado | I-4d | 3(c)-bis, decisão do Bob em 22/09: DEPOIS |
## Diff dos 6 espelhos pré-existentes (feito em 28/09 com a fatia public do I-1b)

| Arquivo | Resultado |
|---|---|
| `db/functions/reserve_credit.sql` | idêntico |
| `db/functions/confirm_reservation.sql` | idêntico |
| `db/functions/release_reservation.sql` | divergente de forma (comentários e quebra da assinatura); executável idêntico; `.LIVE_2026-09-22.sql` ao lado |
| `db/functions/cleanup_stale_reservations.sql` | **RESOLVIDO 06/10/2026**: banco = espelho (alvo de 25/08 aplicado); `.LIVE` removido |
| `db/functions/cleanup_user_stale_reservations.sql` | **RESOLVIDO 06/10/2026**: banco = espelho (alvo de 25/08 aplicado); `.LIVE` removido |
| `db/functions/broadcast_collective_member_change.sql` | idêntico |
