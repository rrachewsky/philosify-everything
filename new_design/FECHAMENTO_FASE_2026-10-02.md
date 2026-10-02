# FECHAMENTO DE FASE · 02/10/2026 · hardening + DM + player de áudio

**Branch:** `redesign/v2` · **HEAD:** `219cdc0` (igual a `origin/redesign/v2`, árvore limpa) · **Produção (site):** deployment `359b68aa` de 02/10 = HEAD.
**Regras cumpridas:** nenhuma mudança no banco sem OK do Bob; cada bloco SQL aplicado pelo Bob no SQL Editor; commits só por ordem; sem autoria de IA.

---

## 1. Os três ciclos

| Ciclo | Commit | O que mudou | Verificação |
|---|---|---|---|
| Hardening de policies | `563def1` · `seguranca: hardening de policies (dm, tts-audio, panel)` | H1: DROP de 2 policies de INSERT em `direct_messages`. H2: DROP da policy FOR ALL `TO public` no bucket `tts-audio`. H3: DROP da policy INSERT `WITH CHECK (true)` em `panel_analyses`. Espelhos `db/policies/` seguem o banco | contagens `0` nas três; DM, áudio público e TTS novo testados; painel coberto pela arquitetura (ponto 13 da Metodologia) |
| DM: remetente não lia as próprias mensagens | `de0c058` · `dm: remetente decifra as proprias mensagens (pairwise com a chave do parceiro)` | cliente passa a decifrar as mensagens próprias com a pública do parceiro; texto reposto no envio; placeholder localizado para `decryptionFailed` (18 idiomas) | DevTools na aba do Bob: histórico próprio legível, console limpo; "working" nas duas direções |
| Player de áudio v2 | `219cdc0` · `audio: telemetria do tts no padrao da analise (cronometro, barra e progresso visivel)` | componente compartilhado `TtsAudioBar` nas 4 superfícies: geração com cronômetro + barra estimada (padrão ANALISANDO), play com `m:ss`, fio de 2 px com cabeça de leitura, seek; i18n de news completado | aceite do Bob com play real: "ok" |

Relatórios por ciclo: `HARDENING_2026-09-28.md`, `DM_REMETENTE_DIAGNOSTICO_2026-09-29.md`, `PLAYER_AUDIO_V2_2026-10-01.md`. Status intermediário: `STATUS_2026-10-01.md`.

## 2. Banco, estado final das três tabelas

| Tabela | Antes (22/09) | Depois | Rollback |
|---|---|---|---|
| `public.direct_messages` | 7 policies, INSERT contornável por qualquer logado | 5 policies, nenhum INSERT de cliente | `HARDENING_2026-09-28.md` § H1(c) |
| `storage.objects` (bucket `tts-audio`) | FOR ALL `TO public`; `anon`/`authenticated` com GRANT de INSERT/UPDATE/DELETE → escrita anônima aberta | só `Public read access for tts-audio` (SELECT); leitura pública segue pela flag do bucket | § H2(c) |
| `public.panel_analyses` | INSERT `TO public WITH CHECK (true)` | só `Users see own panel analyses` (SELECT) | § H3(c) |

Nada mais foi tocado no banco. O repo não executa nada contra o banco.

## 3. Deploys do site

| Data | Deployment | Conteúdo |
|---|---|---|
| 29/09 | `ef6b8fc4` | conserto do DM |
| 02/10 | `359b68aa` | player de áudio |

Rollback: `wrangler pages deployment rollback <id>` no projeto `philosify-frontend`.

## 4. Fila para a próxima fase (cada item com OK próprio)

| # | Item | Gravidade | Onde está escrito |
|---|---|---|---|
| 1 | `cleanup_stale_reservations` e `cleanup_user_stale_reservations`: banco sem o INSERT de reembolso em `credit_history` que o espelho de 25/08 documenta. Decidir a verdade e se reaplica | **alta** | `db/INVENTARIO_2026-09-22.md` § I-4, item 1; `.LIVE_2026-09-22.sql` ao lado dos espelhos |
| 2 | L1: grupos de DM não são E2E (ninguém chama `initializeDMGroupEncryption`; mensagem de grupo em texto claro) | média | `DM_REMETENTE_DIAGNOSTICO_2026-09-29.md` § Achados laterais |
| 3 | L3/L4: multi-dispositivo no DM (par de chaves por navegador; registro sobrescreve a pública; broadcast do próprio descartado) | média / baixa | idem |
| 4 | H1-bis/H2-bis/H3-bis: policies de SELECT/UPDATE/DELETE de cliente que sobraram, sem consumidor | baixa | `HARDENING_2026-09-28.md` |
| 5 | `forum_replies` com trigger dupla (`reply_count` em dobro); `validate_dm_reply_target_trigger` ausente no banco | média | inventário, itens 5 e 6 |
| 6 | 7 funções de trigger órfãs; módulo de anúncios + `user_profiles` + `unsafe_zone_conversations` ausentes no banco; publicação `supabase_realtime` sem consumidor; duplicatas no fórum | baixa | inventário, itens 7 a 11 |
| 7 | 3(c)-bis: DDL de tabelas, índices, constraints, `audit.deleted_logs` | decisão de 22/09: depois | inventário, item 13 |
| 8 | 3(d): revisão completa do `.gitignore` (`*key*`/`*token*` ainda valem fora de `db/`) | baixa | `BLOCO3_C_FECHAMENTO_2026-09-28.md` § 8 |

Recomendação de ordem: 1 → 2 → 5 → 3 → 4 → 6 → 7 → 8.

## 5. Lições operacionais desta fase

- **Teste local do site contra a API é inviável**: o worker de produção só aceita origens `philosify.org`/`www`/`ads` e o login é por cookie. Deploys de teste vão para produção, com rollback.
- **Permissão de deploy**: a sessão bloqueia `wrangler pages deploy` por padrão; o comando passa quando o Bob o manda literalmente. Padrão adotado: eu construo e entrego o comando, o Bob dispara.
- **Deploy no minuto do teste**: o "falhou" de 29/09 foi aba carregada antes do bundle novo. Antes de declarar defeito, conferir no DevTools o nome do chunk servido contra o `dist/`.
- **Produção = HEAD** é verificável por hash de chunk não tocado; foi feito antes dos dois deploys.
- **Efeito colateral registrado**: TTS em pt de "Imagine" gerado na conta do Bob em 29/09 ao tentar medir o player.
- **Supabase SQL Editor**: blocos `BEGIN…COMMIT` não devem ser rodados duas vezes (`42704` na segunda, inofensivo).

## 6. Estado do repo

`git status` limpo; `redesign/v2` = `origin/redesign/v2` = `219cdc0`. Commits da fase, em ordem: `b9b35c0` (espelhos, 28/09) → `de0c058` (DM, 29/09) → `563def1` (hardening, 02/10) → `219cdc0` (player, 02/10). Este fechamento sobe no commit de docs que encerra a fase (ordem do Bob, 02/10).
