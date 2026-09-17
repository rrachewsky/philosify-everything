# Trigger `member-joined` / `member-left` de `collective_members` — espelho de produção · 16/09/2026

**Pedido do Bob (16/09):** (1) substituir o placeholder de `migrations/collective_comments_realtime_broadcast.sql` pela
função + trigger do anexo `DUMPS_AB_TRIGGER_MEMBER_JOINED_2026-09-16.md`, marcadas "espelho de produção 16/09/2026 —
origem não versionada"; (2) gravar também em `db/functions/broadcast_collective_member_change.sql`; (3) decidir o destino
dos dumps C/D/E de 11/09; (4) commit "docs: espelho da trigger member-joined de collective_members" → push → hash.

## Estado

| Item | Estado |
|---|---|
| 1 · placeholder → função + trigger | **FEITO (17/09)** — dumps A/B vieram inline na mensagem do Bob; gravados em `new_design/DUMPS_AB_TRIGGER_MEMBER_JOINED_2026-09-16.md` e colados na seção ESPELHO da migração com a marca "espelho de produção 16/09/2026 — origem não versionada" |
| 2 · `db/functions/broadcast_collective_member_change.sql` | **FEITO** — cabeçalho do §2; corpo da função + triggerdef comentada. Conferido por script: função idêntica byte a byte nas três cópias (dump .md, db/functions, migração) e triggerdef presente nas três |
| 3 · dumps C/D/E | **RESOLVIDO — os três são redundantes; encerrados** (ver §3). Aceito pelo Bob em 17/09 |
| 4 · commit + push | ver §4 |

## 1. O anexo não chegou ao disco (histórico — resolvido com o conteúdo inline)

`DUMPS_AB_TRIGGER_MEMBER_JOINED_2026-09-16.md` não existe no repositório (nem em `new_design/`, `docs/`, raiz), não
aparece em `git status`, e a busca por nome em todo o perfil do usuário (Downloads, Desktop, Documents, OneDrive,
excluindo `node_modules` e `AppData`) não devolveu nada. Também não há arquivo com `pg_get_functiondef` + `member-joined`
modificado após 15/09 no repo. A mensagem de 16/09 tampouco traz o conteúdo inline.

**Sem o texto do dump não há o que colar** — o espelho tem de ser byte-a-byte da saída de `pg_get_triggerdef` +
`pg_get_functiondef`, não uma reconstrução minha. Assim que o arquivo estiver em `new_design/` (ou o SQL vier colado na
mensagem), os itens 1, 2 e 4 são mecânicos: ~5 minutos.

## 2. Padrão do repo para o item 2 (pronto para aplicar)

`db/functions/` já guarda espelhos vivos com este cabeçalho (`release_reservation.sql`, 29/08):

```
-- Espelho do corpo VIVO em produção. Aplicado e verificado em 2026-08-29.
-- Fonte: migrations/tarefa2_item1_release_reservation.sql
```

Para a trigger de membros o cabeçalho será:

```
-- Espelho de produção 16/09/2026 — origem não versionada (trigger criada fora do repo).
-- Fonte: dump A/B do Bob (pg_get_functiondef + pg_get_triggerdef), new_design/DUMPS_AB_TRIGGER_MEMBER_JOINED_2026-09-16.md
-- NÃO reaplicar; documentação. Eventos 'member-joined' / 'member-left' em 'collective:<group_id>'.
```

No `migrations/collective_comments_realtime_broadcast.sql`, a seção `-- ESPELHO —` (linhas 126-132) troca o
`<<< PENDENTE: colar aqui o dump A/B quando chegar >>>` pelo mesmo conteúdo, com a marca pedida.

## 3. Dumps C/D/E de 11/09 — finalidade após o desfecho real

Origem: `COLLECTIVE_CHAT_RASTREIO_INSERT_2026-09-11.md` §"SQL para cravar" (A–E). Desfecho real registrado em
`REALTIME_POSTMORTEM_2026-09-06.md` §"DESFECHO REAL" e na migração aplicada em 11/09 (`eac229e`): o Collective real são os
comentários em `collective_comments`; o caminho `group_chat_messages`/`groupsService`/`useCollective` é código morto; o
`member-joined` vem de trigger não versionada em `collective_members` e serviu de gabarito.

| Dump | Pergunta que respondia | Situação hoje | Veredito |
|---|---|---|---|
| **C** — o id `7d701686…` é `collective_groups.id` ou `analysis_groups.id`? | Qual tabela emite o tópico observado | Fechada pelo desfecho: o tópico `collective:<gid>` é emitido pela trigger de `collective_members` (FK para `collective_groups`), e a trigger nova de `collective_comments` resolve `group_id` via `collective_analyses` — comprovada ao vivo em 11/09. O dump A/B (quando colado) mostra o corpo referenciando `collective_members.group_id`, o que fecha em definitivo. | **redundante — encerrado** |
| **D** — linhas recentes em `realtime.messages` por tópico/evento | "O que já atravessa?" — confirmar que só `member-joined` trafegava | Superada: `new-comment` e `comment-deleted` foram verificados ao vivo em produção (11/09) e o realtime de comentários está em uso desde então (`eac229e`). Não há decisão pendente que dependa do histórico de `realtime.messages`. | **redundante — encerrado** |
| **E** — `DEFAULT` de `message_type` em `chat_messages` | Explicar o "≠ 'chat'" visto no rastreio | O próprio rastreio já concluiu (linha 58): o app nunca escreve `'chat'`, `message_type` só é setado pelo Ágora/pergunta-do-dia, sem relação com o Collective; e o caminho de chat que motivou a pergunta é código morto. O default da coluna não muda nenhuma decisão. | **redundante — encerrado** |

Nenhum dos três precisa ser reapresentado. **Atenção para o Bloco 3** (limpeza do caminho morto, quando for a vez): o
item "confirmar vazias → DROP" das tabelas legadas (`analysis_groups`, `group_members`, `group_chat_messages`) e o
`DROP` da trigger órfã pedem **dumps próprios** (contagem de linhas + `pg_get_triggerdef` em `group_chat_messages` —
este último já está coberto pelo dump B). Isso é assunto do Bloco 3, não de C/D/E.

## 4. Commit (após o anexo)

```bash
git add migrations/collective_comments_realtime_broadcast.sql db/functions/broadcast_collective_member_change.sql \
  new_design/DUMPS_AB_TRIGGER_MEMBER_JOINED_2026-09-16.md new_design/TRIGGER_MEMBER_JOINED_ESPELHO_2026-09-16.md
git commit -m "docs: espelho da trigger member-joined de collective_members"
git push origin redesign/v2
```
