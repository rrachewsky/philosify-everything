# Bloco 3(c) — Inventário e espelhos do banco · FECHAMENTO · 28/09/2026

**Branch:** `redesign/v2` · **Base:** `9e810d9` · **Proposta:** `BLOCO3_C_INVENTARIO_BANCO_2026-09-21.md` (aprovada em 22/09).
**Dump:** 22/09/2026, SQL Editor do Supabase, 7 blocos só SELECT, rodados pelo Bob. Saídas coladas em texto entre 27 e 28/09.
**Regra cumprida:** nenhum objeto do banco foi criado, alterado ou removido. Só leitura no banco e arquivos no repo. Nada commitado ainda.

---

## 1. O que foi entregue

| Bloco | Alvo (I-0) | Recebido | Bate | Resultado no repo |
|---|---|---|---|---|
| I-0 | — | 6 contagens | oficial | `db/INVENTARIO_2026-09-22.md` § I-0 |
| I-1a | 63 | 63 | sim | índice das funções com classe de reconhecimento |
| I-1b | 63 corpos | 59 + 4 | sim | 57 espelhos novos em `db/functions/` (53 public + 4 audit), 3 idênticos carimbados, 3 `.LIVE_2026-09-22.sql` |
| I-2 | 32 | 32 | sim | 32 espelhos em `db/triggers/` |
| I-3 | 171 | 171 (3 fatias) | sim | 63 espelhos em `db/policies/` |
| I-4a-d | — | 0 / 3 / 18 / 1 | recebido | fila de decisão consolidada, 13 itens |

**`db/` depois do bloco:** `functions/` 66 arquivos (63 espelhos + 3 LIVE, mais `extract_credit_functions.sql` que já existia), `triggers/` 32, `policies/` 63, `INVENTARIO_2026-09-22.md`.

## 2. Divergências repo × banco encontradas (não resolvidas, por regra)

| Onde | Natureza |
|---|---|
| `cleanup_stale_reservations`, `cleanup_user_stale_reservations` | **substantiva**: banco sem o INSERT de reembolso em `credit_history` que o espelho de 25/08 (commit `d871ed7`) documenta. `.LIVE_2026-09-22.sql` ao lado de cada uma |
| `release_reservation` | só comentários e quebra da assinatura; executável idêntico. `.LIVE` ao lado |
| trigger `broadcast_collective_comment_delete_trigger` | migration usa o nome `..._deleted_trigger` |
| trigger `validate_dm_reply_target_trigger` | no repo, ausente no banco (migration nunca aplicada ou desfeita) |
| 40 nomes de policy só no repo | tabelas ausentes no banco: módulo de anúncios (16), `user_profiles`, `unsafe_zone_conversations`; o resto renomeado |

## 3. Fila de decisão

13 itens, com origem e gravidade, em `db/INVENTARIO_2026-09-22.md` § I-4 → "Fila de decisão consolidada". Os três de gravidade alta:

1. Verdade das duas funções de cleanup (repo ou banco) e se o bloco de extrato é reaplicado.
2. `direct_messages`: policy `Users can send messages` contorna a checagem de membro da conversa.
3. `storage.objects`, bucket `tts-audio`: policy "Service role full access" vale `TO public`, FOR ALL. Confirmar GRANTs.

Nenhum deles é resolvido neste commit. Cada um entra como ciclo próprio com OK próprio.

## 4. Avisos honestos sobre os espelhos

- **Policies são reconstruídas** de `pg_policies`, equivalentes ao banco, não byte-a-byte com o DDL original. Cabeçalho de cada arquivo diz isso.
- **Barras invertidas:** o export markdown do SQL Editor escapa `\`. Li `\\` como `\` em `normalize_text` e `validate_phone_fields`. Os dois arquivos avisam; confirmar no banco antes de qualquer reaplicação.
- **Corpos com literal de string quebrado** (`get_shared_analysis`, `track_referral`) foram gravados como estão no banco.
- **Triggers e funções de plataforma** (realtime, storage) foram espelhadas só para o repo não ficar cego, com aviso no cabeçalho.
- **As 3 tabelas com RLS e zero policy** não têm arquivo em `db/policies/`: não há policy a espelhar; o `ENABLE ROW LEVEL SECURITY` delas já está em `migrations/underground_modo_a.sql` e `underground_room_e2e.sql`.
- **DDL de tabelas** (colunas, índices, constraints, incluindo `audit.deleted_logs`) fica fora, conforme decisão de 22/09 (3(c)-bis depois).
- **7 espelhos estão sendo ignorados pelo `.gitignore`** (regras `*key*` e `*token*`, linhas 175-176): `db/functions/create_share_token.sql`, `get_collective_key_version.sql`, `user_has_group_key.sql`, `db/policies/public.collective_group_keys.sql`, `public.dm_group_keys.sql`, `public.share_tokens.sql`, `public.user_public_keys.sql`. Nenhum contém segredo: são nomes de objetos do banco. Sem uma negação, o commit sairia com 154 arquivos e o repo ficaria cego justamente para as funções e policies de chaves e tokens. Proposta abaixo (§6).

## 5. O commit proposto

Um commit único, conforme §4.6 da proposta:

```
db: espelhos de funcoes, triggers e policies (inventario de 22/09)
```

Conteúdo (161 arquivos novos, 3 modificados):

| Grupo | Arquivos |
|---|---|
| `db/functions/` | 57 novos (53 `<nome>.sql` public + 4 `audit.<nome>.sql`), 3 `.LIVE_2026-09-22.sql`, 3 modificados (linha "Conferido contra o dump de 22/09" no cabeçalho de `reserve_credit`, `confirm_reservation`, `broadcast_collective_member_change`) |
| `db/triggers/` | 32 novos |
| `db/policies/` | 63 novos |
| `db/INVENTARIO_2026-09-22.md` | índice objeto → arquivo, achados, fila de decisão |
| `new_design/` | proposta (`.md` + `.sql`), `BLOCO3_C_STATUS_2026-09-27.md`, `BLOCO3_C_VEREDITOS_I0_I1_2026-09-28.md`, este fechamento |

Sem autoria de IA na mensagem, conforme regra do repo.

## 6. O que preciso do Bob

**OK para o commit acima**, ou ajustes antes dele. Duas escolhas que mudam o conteúdo do commit, se quiser decidir agora em vez de depois:

- Manter os 3 `.LIVE_2026-09-22.sql` no commit (recomendo: são a evidência da divergência) ou deixá-los fora até a decisão do item 1 da fila.
- Incluir os md de status e vereditos em `new_design/` no mesmo commit (recomendo, é o rastro do bloco) ou só o inventário em `db/`.

**Terceira decisão, necessária para o commit sair completo:** acrescentar ao `.gitignore`, logo após a linha `!wrangler.toml.example` (há precedente em `!api/src/utils/roomKey.js`):

```
# Espelhos do banco (db/): nomes de objetos, nunca segredos
!db/functions/*.sql
!db/triggers/*.sql
!db/policies/*.sql
```

Alternativa sem tocar no `.gitignore`: `git add -f` só nos 7 arquivos. Recomendo a negação, porque o 3(c)-bis e futuros dumps vão tropeçar na mesma regra.

Sem resposta, não commito.

---

## 7. OK do Bob (28/09/2026)

Aprovado o commit com as três decisões: os 3 `.LIVE_2026-09-22.sql` entram; os md de status e vereditos entram; `.gitignore` recebe a negação para `db/` (adianta parte do 3(d), revisão completa segue na fila). Parecer do supervisor sobre o I-4 registrado em `db/INVENTARIO_2026-09-22.md` § I-4.
