# Collective — comentários em análises: Etapa 1 (mapeamento, somente leitura) · 11/09

**Alvo corrigido pelo Bob:** o Coletivo em uso são os **comentários em análises do grupo** (print: "Adorei 12345" com
RESPONDER sob uma análise), que vivem em **`collective_comments`**. O chat de `group_chat_messages` **não** é o alvo.
**Regra mantida:** Ágora, Underground e DM intocáveis. Nada foi editado.

Substitui, para este alvo, o relatório `COLLECTIVE_CHAT_RASTREIO_INSERT_2026-09-11.md` (que rastreou a rota de
`group_chat_messages`); as evidências sobre código morto de lá continuam válidas e são reaproveitadas no item (e).

## (a) Caminho do POST do comentário → INSERT

| Elo | Arquivo:linha | O que faz |
|---|---|---|
| UI submit | `site/src/components/collective/AnalysisDiscussion.jsx:60-88` | `handleSubmit` → `collectiveService.addComment(collectiveAnalysisId, content, parentId, groupId)` |
| Serviço (E2E) | `site/src/services/api/collective.js:214-252` | Se há `groupId`, cifra com `cryptoService.encryptCollectiveMessage` → body `{ encrypted_content, nonce, parentId? }`; senão `{ content, parentId? }`. `POST ${API}/collective/analyses/${collectiveAnalysisId}/comments` |
| Rota | `api/index.js:1274-1283` | regex `^/api/collective/analyses/([0-9a-f-]+)/comments$`, `POST` → `handleAddComment` |
| Handler | `api/src/handlers/collective-comments.js:115` | `handleAddComment(request, env, origin, collectiveAnalysisId)` |
| Resolve grupo | `collective-comments.js:145-152` | `from("collective_analyses").select("id, group_id").eq("id", collectiveAnalysisId)` → `analysis.group_id` |
| Membro? | `:156-165` | `from("collective_members")` por `(group_id, user_id)` — 403 se não for |
| Validação | `:167-190` | plaintext ≤ 2000 / cifrado ≤ 8000; bloqueia URL em plaintext; reply só a comentário de 1º nível (`:193-209`) |
| **INSERT** | **`collective-comments.js:213-231`** | **tabela `collective_comments`**, colunas: `collective_analysis_id, user_id, parent_id, display_name, content` (`"[Encrypted]"` se cifrado), `encrypted_content, nonce, is_encrypted` |
| Pós-insert | `:239-259` | `rpc("increment_analysis_comment_count")`; se reply → `createReplyNotification` (tabela `notifications` + push); se top-level → `notifyCollectiveMembers` (push a todos os membros, fire-and-forget) |
| Resposta 201 | `:270-291` | `{ success, comment: { id, userId, parentId, displayName, content|null, encryptedContent|null, nonce|null, isEncrypted, createdAt, isMine: true } }` |

O cliente usa a resposta com **eco local** (`AnalysisDiscussion.jsx:77-83`: `setComments(prev => [...prev, { ...comment,
content }])`) — o remetente vê o próprio comentário na hora; **os outros membros não veem nada até re-buscar**.

**Broadcast:** nenhum. `collective-comments.js` não importa nem chama realtime/REST broadcast (grep `broadcast|realtime`
→ zero). O worker deployado (bundle `api/.wrangler/tmp/deploy-Ta9Exn/index.js`, 02/09) confirma: os únicos
`/realtime/v1/api/broadcast` são de `colloquium.js` e `dm.js`.

## (b) Triggers em `collective_comments`

**Nenhuma versionada.** grep `collective_comments` em `*.sql` → zero; o único SQL da tabela é o plano
`.opencode/plans/community-spaces.md` (que previa `collective_messages` + `ALTER PUBLICATION supabase_realtime`, i.e.
postgres_changes — modelo que nunca foi o adotado). O contador de comentários é mantido por **RPC do handler**
(`increment_/decrement_analysis_comment_count`), não por trigger. Confirmar no banco (somente leitura):

```sql
SELECT c.relname AS tabela, t.tgname, pg_get_triggerdef(t.oid) AS trigger_def,
       pg_get_functiondef(p.oid) AS function_def
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public' AND NOT t.tgisinternal
  AND c.relname IN ('collective_comments', 'collective_members', 'collective_analyses')
ORDER BY c.relname, t.tgname;
```
(Esperado: algo em `collective_members` — o emissor do `member-joined` que o Bob viu — e **nada** em `collective_comments`.)

## (c) O que o cliente escuta para comentários

**Nada.** Cadeia real da UI: `CommunityPage.jsx:24,205` → `CollectivePanel.jsx:25` → `CollectiveDetail.jsx:96` →
`AnalysisDiscussion.jsx` → `CommentThread.jsx`. **Nenhum** desses arquivos importa `services/realtime.js`, chama
`.channel(`/`.subscribe(` ou trata `broadcast` (grep em `site/src/components/collective/*.jsx` → zero).

Sobre o `useCollective.js` (o único código que assina `collective:<gid>`):
- **Código morto:** exportado em `hooks/index.js:14`, importado por ninguém; chama `getCollectiveChat`/
  `sendCollectiveMessage`/`kickMember`, que **não existem** no serviço. O bundle de produção (`site/dist`, 02/09)
  **não contém `member-joined`** em nenhum asset.
- **Eventos que trata** (`useCollective.js:47-65`): `new-message` (shape de chat: `{id, ...}` em `messages`),
  `member-joined`, `member-left`, `comment-deleted`. **Não trata `new-comment`** nem nada com
  `collectiveAnalysisId`. Ou seja: mesmo que fosse montado, um comentário novo não teria handler.
- **O canal `collective:<gid>` serve os dois fluxos?** Serve como *tópico*: a policy de SELECT em `realtime.messages`
  (`is_collective_member(uid, gid)`, recriada 06/09) autoriza qualquer membro a assinar `collective:<gid>`, e o
  `member-joined` já trafega nele. Falta apenas **(1) um emissor** para comentário e **(2) um assinante** na tela de
  discussão que filtre por `collectiveAnalysisId` (o tópico é por grupo; a tela é por análise).

## (d) Como o feed de comentários re-busca

- **Ao abrir a discussão:** `AnalysisDiscussion.jsx:40-57` `loadData` → `GET /api/collective/analyses/:id/comments`
  (`collective-comments.js:30-112`), executado **uma vez** no `useEffect([loadData])` (`:55-57`). Sem polling, sem
  intervalo, sem realtime.
- **Ao enviar:** eco local da resposta (`:77-83`); **não re-busca**.
- **Ao apagar:** remove localmente (`:96-105`); não re-busca.
- **Ao voltar ao feed:** `CollectiveDetail.jsx:80-84` `handleBackFromDiscussion` → `loadDetail()` (re-busca o
  **feed de análises** com contadores, não os comentários).
- **Outro membro só vê comentário novo** se: sair e reabrir a discussão, ou **F5**. É exatamente o sintoma
  "só atualiza com F5" do post-mortem, agora no alvo certo.
- **Decriptação** acontece no serviço (`collective.js:137-166` `decryptCommentIfNeeded`, função **privada do módulo**,
  usada só por `getComments`): converte `{isEncrypted, encryptedContent, nonce}` em `content` +
  `decrypted:true` ou `content:'[Unable to decrypt]', decryptionFailed:true`. Um listener realtime precisa reproduzir
  isso (ou o serviço passar a exportar a função).

**Shape que `CommentThread.jsx` consome** (`:14-26, 59-61, 83-107`): `id, parentId, userId, displayName, content,
createdAt, isMine, decryptionFailed?`. Threading é montado no cliente por `parentId` (2 níveis).

## (e) `group_chat_messages` existe como feature na UI?

**Não. É código morto herdado** (feature "analysis groups" com invite code, anterior ao Collective):
- Backend: `api/src/handlers/groups.js` (rotas `/api/groups`, `/join`, `/:id`, `/:id/chat`, `/:id/leave`,
  `/:id/members/:uid`; `index.js:1078-1121`), tabelas `analysis_groups`, `group_members`, `group_chat_messages`.
  Nenhum outro arquivo do worker referencia essas tabelas.
- Frontend: `site/src/services/api/groups.js` (`groupsService`) — **importado por ninguém**. Os hits de
  `createGroup`/`joinGroup` em `MessagesPanel.jsx:33`, `NewGroupModal.jsx:140`, `useDM.js:372` são **grupos de DM**
  (`dm.createGroup(memberIds, name)`), não os grupos legados.
- `site/src/hooks/useCollective.js` — dead code (ver (c)).
- Bundle de produção: sem `member-joined`; `collective:` só como rótulo de aba.

**Fila de limpeza (registrar, não executar agora):**
1. Trigger criada em `group_chat_messages` → **preparada-para-nada**; documentar e remover junto com a tabela quando
   a feature legada for aposentada.
2. `api/src/handlers/groups.js` + rotas em `index.js:1078-1121` + import `:116-125`.
3. `site/src/services/api/groups.js`, `site/src/hooks/useCollective.js` (+ export em `hooks/index.js:14`).
4. Tabelas `analysis_groups`, `group_members`, `group_chat_messages` (decisão de banco; verificar se vazias antes).

## Pré-requisitos já satisfeitos para a Etapa 2 (não aplicar sem OK)

- Tópico `collective:<gid>` **já autorizado** para membros (policy definer de 06/09) e **já comprovado** em
  produção pelo `member-joined`.
- `group_id` **não está** em `collective_comments`; a trigger obtém via
  `SELECT group_id FROM public.collective_analyses WHERE id = NEW.collective_analysis_id`.
- Padrão a espelhar: `migrations/broadcast_underground_post.sql` (`SECURITY DEFINER`, `search_path=''`,
  `realtime.send(payload, evento, tópico, TRUE)` dentro de `BEGIN…EXCEPTION WHEN OTHERS THEN RAISE WARNING`).
- Payload a emitir = **shape camelCase do GET/POST** + `collectiveAnalysisId` (para o cliente filtrar por análise),
  **sem `isMine`** (o cliente calcula por `userId === user.id`), com `encryptedContent/nonce/isEncrypted` para o
  cliente decriptar (o servidor nunca vê plaintext cifrado).
- Listener: em `AnalysisDiscussion.jsx`, após `loadData` conhecer `groupId`, assinar `collective:${groupId}`
  privado (padrão `useUnderground.js:42-97`: `waitForAuth → getRealtimeClient → channel({private:true}) →
  on('broadcast', {event:'new-comment'}) → subscribe`), filtrar `payload.collectiveAnalysisId ===
  collectiveAnalysisId`, dedupe por `id` (o remetente já ecoou pela resposta do POST), decriptar se `isEncrypted`.
- Opcional na mesma trigger-family: `AFTER DELETE` → `comment-deleted` (o DELETE é feito por REST service-role em
  `collective-comments.js:326-343`, trigger dispara igual). Fica fora do "mínimo" salvo pedido.
