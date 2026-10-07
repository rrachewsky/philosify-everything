# CRÉDITOS COMPLETOS · STATUS · 06/10/2026

**Fase:** a verdade dos reapers + itens 2-5 do relatório de 27/08 + extrato do usuário. Babysteps; cada etapa com OK do Bob; SQL só pelo Bob; commit e deploy só por ordem.
**Repo:** `redesign/v2` = `origin` = `f700ffd`. Fora de commit: `CREDITOS_ETAPA2_AUDITORIA_2026-10-06.md` e `CREDITOS_ETAPA2C_CONFIRM_V2_2026-10-06.md` (docs; entram no commit do banco da 2-C ou num commit de docs, por ordem).
**Produção:** site no deployment `359b68aa` (02/10); worker sem deploy nesta fase; banco com 2 funções alteradas (reapers, 06/10).

## 1. Onde cada etapa está

| Etapa | Estado | Evidência |
|---|---|---|
| 1 · Reapers escrevem o refund | **FECHADA 06/10.** Pré-flight limpo (src 893/1353, zero refunds `timeout`/`user_timeout_cleanup`), migração Success, verificação `tem_refund_insert = t` nas duas, prova funcional `TESTE OK`, 1b executada | `CREDITOS_ETAPA1_REAPERS_2026-10-05.md` § 9; commit `f700ffd` |
| 2 · Auditoria itens 2-5 | **OK do Bob 06/10 nos 4 pontos** (A adiar RPC de N e idade 0→2; B saldo resultante no extrato; C `confirm_reservation` v2 sem catch externo; D ordem SQL → worker → Etapa 3) + adendo: quiz confirma só após a pergunta validada | `CREDITOS_ETAPA2_AUDITORIA_2026-10-06.md` |
| 2-C · Migração `confirm_reservation` v2 | **PROPOSTA entregue 06/10, aguardando pré-flight (P1-P6) e parecer.** Nada aplicado | `CREDITOS_ETAPA2C_CONFIRM_V2_2026-10-06.md` § 3-7 |
| 2-C · Worker | Desenhado (§ 8 do md da 2-C); diff só depois do banco | confirm.js sem PATCH, 14 pontos com `source`, idade 0→2, quiz, espelho, inventário |
| 3 · Extrato | Desenho fechado na auditoria (§ 2.3); proposta própria depois da 2-C | `GET /api/credits/history` paginado, saldo resultante no worker, aba Extrato no v2, ×18 |

## 2. O que mudou no banco nesta fase

| Objeto | Antes | Depois | Rollback |
|---|---|---|---|
| `cleanup_stale_reservations` | corpo de 21/08, sem linha de extrato | alvo de 25/08: INSERT best-effort `type='refund'`, `reason='timeout'` | `CREDITOS_ETAPA1_REAPERS_2026-10-05.md` § 7 |
| `cleanup_user_stale_reservations` | corpo pré-25/08, idem | idem, `reason='user_timeout_cleanup'` | idem |

## 3. Achado novo em aberto (decide no pré-flight da 2-C)

`credit_history.analysis_id` tem FK para `analyses(id)` (pré-flight 0e de 28/08). Livro, cinema e news confirmam com uuids de outras tabelas. Se a FK está lá, a v1 falha em silêncio nesses confirms, a reserva fica pendente e o reaper devolve o crédito: **cobrança zero** nesses três com cache. P4 lista as FKs; P5 conta devoluções por timeout em 30 dias (o sintoma). A v2 já traz a guarda (`v_analysis_fk` + id bruto em `metadata`), independente do resultado.

## 4. Fila (cada item com OK próprio)

| # | Item | Gravidade | Onde |
|---|---|---|---|
| 1 | Colaterais 2-6 da auditoria: `refund` negativo do Stripe partilha o `type`; `admin_grant_credits` sem snapshots; `song_analyzed`/`model_used` nunca escritos; motivos de release fora da lista; `/api/transactions` com casamento temporal | baixa | `CREDITOS_ETAPA2_AUDITORIA_2026-10-06.md` § 3 |
| 2 | RPC `reserve_credits(p_user_id, p_amount)` (exige coluna `amount`; junto do 3(c)-bis) | média, adiada | idem § 1 item 2 |
| 3 | Fila anterior: L1 grupos DM sem E2E; `forum_replies` trigger dupla; L3/L4 multi-dispositivo; H1/H2/H3-bis; limpezas do inventário; 3(c)-bis; 3(d) | média → baixa | `FECHAMENTO_FASE_2026-10-02.md` § 4 |

## 5. Próximo passo

Bob cola o pré-flight P1-P6 da 2-C e dá o parecer. Com parecer e pré-flight limpos: bloco → verificação → prova funcional → espelho + inventário → commit `db: confirm_reservation v2 grava origem do consumo (source, description, batch)` → diff do worker para OK.
