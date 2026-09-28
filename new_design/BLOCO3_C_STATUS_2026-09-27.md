# Bloco 3(c) — Inventário e espelhos do banco · STATUS · 27/09/2026

**Branch:** `redesign/v2` · **HEAD:** `9e810d9` · **Proposta:** `BLOCO3_C_INVENTARIO_BANCO_2026-09-21.md` (aprovada pelo Bob em 22/09).
**Natureza deste report:** só leitura do repo e dos scratchpads. Nada foi executado contra o banco.

---

## 1. Resumo em uma linha

**Nenhuma saída do inventário chegou.** O 3(c) está exatamente onde a proposta o deixou em 22/09: aprovado, SQL pronto, zero colagens recebidas, zero espelhos novos.

Os números citados como I-0 (63 corpos de função, 32 triggers, 171 policies) aparecem pela primeira vez na mensagem do supervisor de 27/09. Não constam em nenhum arquivo do repo, do scratchpad ou do stash. Ficam registrados aqui **como referência por relato**, a confirmar quando o I-0 vier colado.

## 2. Estado por pergunta

| # | Pergunta | Estado verificado em 27/09 |
|---|---|---|
| 1 | Saídas recebidas (I-0, I-1a, I-1b public/audit, I-2, I-3, I-4a-d) | **Nenhuma.** Todas faltam. Verificado em `new_design/`, `db/`, scratchpads da sessão e `git stash`. |
| 2 | Completude contra I-0 | Não conferida. Sem I-1b, I-2 e I-3 não há o que bater. Alvos por relato: 63 funções, 32 triggers, 171 policies. |
| 3 | Espelhos gravados | **Zero novos.** `db/functions/` segue com os 6 pré-existentes. `db/triggers/` e `db/policies/` não existem. Nenhum diff repo × banco foi feito. |
| 4 | Achados do I-4 | Não chegaram. Não há lista de tabelas sem RLS nem de RLS sem policy para o parecer do supervisor. |
| 5 | Working tree | Limpo, exceto os 2 untracked da proposta (`.md` de 97 linhas e `.sql` de 161 linhas, 7 blocos SELECT). |

## 3. O que existe hoje em `db/`

| Arquivo | Último toque | Origem |
|---|---|---|
| `db/functions/reserve_credit.sql` | 21/08 | espelho créditos |
| `db/functions/confirm_reservation.sql` | 21/08 | espelho créditos |
| `db/functions/cleanup_stale_reservations.sql` | 25/08 | espelho créditos |
| `db/functions/cleanup_user_stale_reservations.sql` | 25/08 | espelho créditos |
| `db/functions/release_reservation.sql` | 29/08 | espelho créditos (reconstruída e verificada em prod) |
| `db/functions/broadcast_collective_member_change.sql` | 17/09 | espelho trigger member-joined (`ed4cccb`) |
| `db/extract_credit_functions.sql` | — | SQL de apoio, não é espelho |

Estes 6 são os que a §4.2 da proposta manda diffar contra o corpo vivo quando o I-1b chegar. Desfechos possíveis: idêntico (só atualiza cabeçalho), divergente (grava `<nome>.LIVE_<data>.sql` ao lado, Bob decide), ausente no banco (registra).

## 4. Caminho até o commit (ordem da §4 da proposta)

1. Receber as 7 saídas (I-0 a I-4d), em texto ou CSV.
2. Conferência de completude: linhas de I-1b = `funcoes_public + funcoes_audit`; I-2 = `triggers_nao_internas`; I-3 = `policies`.
3. Gravar `db/functions|triggers|policies/` e diffar os 6 existentes.
4. Escrever `db/INVENTARIO_<data>.md`: índice objeto → arquivo e fila de achados do I-4 (sem ação).
5. Md de fechamento para OK do Bob.
6. Commit único `db: espelhos de funcoes, triggers e policies (inventario de <data>)`, incluindo os 2 arquivos da proposta e este status.

Nenhum passo pode começar antes do 1.

## 5. O que preciso do Bob

Colar aqui as saídas dos 7 blocos de `new_design/BLOCO3_C_INVENTARIO_BANCO_2026-09-21.sql`, começando pelo **I-0**. Regras combinadas em 21/09:

- texto ou CSV do SQL Editor, não print;
- blocos podem vir em mensagens separadas;
- I-1b fatiado por schema (`public`, depois `audit`) ou por faixa de nome se estourar o editor.

## 6. Fora do escopo, registrado

- 3(c)-bis (DDL de tabelas): DEPOIS, decisão do Bob em 22/09.
- Achados do I-4 não são consertados neste bloco. Viram fila com OK próprio.

---

## 7. Atualização 27/09 (mesma sessão) — I-0 recebido

I-0 chegou verbatim e foi registrado como oficial em `db/INVENTARIO_2026-09-22.md` (data do dump, rodado pelo Bob em 22/09).

| item | n |
|---|---|
| funcoes_public | 59 |
| funcoes_audit | 4 |
| triggers_nao_internas | 32 |
| policies | 171 |
| tabelas_public | 63 |
| tabelas_audit | 1 |

Alvos de completude: I-1b = 63 corpos (59 public + 4 audit), I-2 = 32, I-3 = 171.

**Divergência de forma registrada:** o `.sql` do repo emite `tabelas_public_com_rls` / `tabelas_public_sem_rls`; a saída traz `tabelas_public` / `tabelas_audit`. A variante rodada difere do arquivo versionado nessas duas linhas. Não afeta os alvos. Não resolvido, só anotado.

Ordem de chegada combinada: I-1a → I-1b (public, audit) → I-2 → I-3 → I-4a-d. Conferência de completude a cada chegada.

## 8. Fluxo de entrega fixado em 27/09

Anexos para o supervisor falham (defeito da plataforma). Todas as saídas chegam a esta sessão; os vereditos saem em texto puro (tabela markdown) na resposta, para o Bob repassar. Ordem: I-1a → I-1b public → I-1b audit → I-2 → I-3 → I-4a-d. A cada entrega: conferência → veredito → aguardar a próxima.

**Chegada verificada em 27/09 após o aviso de envio do I-1a:** nenhum arquivo novo no repo, no scratchpad da sessão nem em Downloads (csv/md/txt/sql dos últimos 7 dias). Nenhum texto colado na mensagem. **I-1a não recebido.** Aguardando reenvio.

## 9. I-1a recebido (27/09, colado em texto)

Conferência: **63 linhas, 59 public + 4 audit, bate com I-0.** Zero procedures. Os 6 espelhos de `db/functions/` estão presentes com assinatura. Índice completo gravado em `db/INVENTARIO_2026-09-22.md` (§ I-1a) com classificação de reconhecimento no repo: 6 espelhos, 20 citadas em código, 13 citadas só em SQL/migrations, **25 não reconhecidas** (só existem no banco). 7 funções de trigger com zero triggers (candidatas a órfãs) registradas como fila de decisão.

Nota para o I-2: a soma de `usada_por_triggers` é 27, I-0 conta 32 triggers. Os 5 restantes devem ter função fora de `public`/`audit`.

## 10. I-1b fatia public recebido (28/09, colado em texto)

**59 corpos, bate com I-0 e I-1a.** Gravados 53 espelhos novos em `db/functions/`. Dos 6 pré-existentes: 3 idênticos (reserve_credit, confirm_reservation, broadcast_collective_member_change), 1 divergente só de forma (release_reservation: comentários e assinatura; executável idêntico), **2 divergentes substantivos** (cleanup_stale_reservations e cleanup_user_stale_reservations: o corpo vivo não tem o INSERT de reembolso em credit_history que o espelho de 25/08 documenta). Os 3 divergentes ganharam `<nome>.LIVE_2026-09-22.sql` ao lado, sem sobrescrever. Detalhe e leitura em `db/INVENTARIO_2026-09-22.md` § I-1b.

`db/functions/` passou de 7 para 62 arquivos (6 espelhos antigos + 53 novos + 3 LIVE + `extract_credit_functions.sql`). Nada commitado.

## 11. I-1b fatia audit recebido (28/09)

**4 corpos, bate. I-1b fechado: 63/63.** Gravados 4 espelhos `db/functions/audit.*.sql`. Nenhum diff a fazer (não havia espelho prévio). Faltam I-2 (32), I-3 (171), I-4a-d.

## 12. I-2 recebido (28/09)

**32 triggers, bate com I-0.** Uso por função idêntico ao I-1a; os 5 de diferença são plataforma (realtime/storage). Gravados 32 espelhos em `db/triggers/`. Cruzamento com o repo: 7 iguais, 1 com nome divergente (`..._deleted_trigger` no repo vs `..._delete_trigger` no banco), 1 versionado no repo e **ausente no banco** (`validate_dm_reply_target_trigger`), 18 só no banco, 5 plataforma. Achado novo: **`forum_replies` tem duas triggers idênticas**, `reply_count` anda em dobro. Detalhe em `db/INVENTARIO_2026-09-22.md` § I-2. Falta I-3 (171) e I-4a-d.

## 13. I-3 recebido em 3 fatias (28/09)

**171 policies, bate com I-0.** 63 tabelas, RLS ligado em todas. Gravados 63 arquivos em `db/policies/` com `ENABLE RLS` + `CREATE POLICY` reconstruídos e `-- depende de:`. Cruzamento por nome: 29 vivas têm nome no repo, 142 só no banco, 40 nomes do repo não existem no banco (16 do módulo ads + user_profiles). Achados novos para a fila: INSERT em `direct_messages` contorna a checagem de membro; `storage.objects` tts-audio escrevível por `public`; `panel_analyses` INSERT `WITH CHECK (true)`; policies duplicadas no fórum. Detalhe em `db/INVENTARIO_2026-09-22.md` § I-3. Falta só I-4a-d.

## 14. I-4a-d recebido (28/09) — inventário COMPLETO

I-4a: nenhuma tabela sem RLS. I-4b: 3 com RLS e zero policy (`underground_moderation_log`, `underground_reports`, `underground_room`), intencionais segundo as migrations. I-4c: 11 tabelas na publicação `supabase_realtime`, sem consumidor no app. I-4d: `audit.deleted_logs`, 9 colunas. Fila de decisão consolidada (13 itens) em `db/INVENTARIO_2026-09-22.md` § I-4. Md de fechamento: `new_design/BLOCO3_C_FECHAMENTO_2026-09-28.md`. **Aguardando OK do Bob para o commit único.**
