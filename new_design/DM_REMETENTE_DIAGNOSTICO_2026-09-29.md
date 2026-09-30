# DM — remetente não lê as próprias mensagens · DIAGNÓSTICO E PROPOSTA · 29/09/2026

**Branch:** `redesign/v2` · **HEAD:** `b9b35c0` · **Estado:** edições 1–3 aplicadas no repo e build OK (29/09, § Execução); deploy em produção feito em 29/09 (ef6b8fc4); aguardando teste do Bob; nada no banco; sem commit.
**Experimento do Bob (29/09):** simétrico. Chrome→Edge: Edge lê, Chrome vê balão vazio. Edge→Chrome: Chrome lê, Edge vê balão vazio. Próprias mensagens sempre vazias na janela do remetente, recém-enviadas e após F5.

---

## Resumo em três linhas

1. **Envio está certo.** A mensagem é cifrada com segredo compartilhado X25519(minha privada, pública do parceiro). O remetente **tem** os dois insumos e poderia decifrar.
2. **Leitura está errada.** O cliente decifra toda mensagem com `decryptDM(…, senderId)`. Na própria mensagem `senderId` = eu, então deriva X25519(minha privada, **minha** pública), que é outro segredo. Falha, cai no caminho de grupo (sem chave), vira `[Unable to decrypt]`.
3. **Recém-enviada fica vazia por outro motivo.** Não há eco otimista. O hook insere a resposta do worker, que devolve `message: null` para linhas cifradas, e ninguém repõe o texto que o usuário acabou de digitar.

Consequência boa: **as mensagens antigas são recuperáveis por construção.** Não é preciso mudar o esquema de cifra, nem o banco, nem o worker. Duas edições no site.

**Sem nexo com o H1**: o H1 removeu só policies de INSERT de cliente; a leitura do DM é `GET /api/dm/conversations/:id/messages` no worker com service key (`api/src/handlers/dm.js:348`, via `pg()` de `api/src/utils/pg.js`). O defeito existe desde o fork (`56dcbf0`, 08/03/2026), ver § 1d.

---

## Etapa 1 — Diagnóstico (arquivo:linha em cada elo)

### a) Envio: para quais chaves a mensagem é cifrada

| Elo | Arquivo:linha | O que faz |
|---|---|---|
| Hook monta `convInfo` e chama o serviço | `site/src/hooks/useDM.js:131-149` | `{ type, members }` + `user.id` |
| Serviço escolhe o parceiro | `site/src/services/api/dm.js:174-183` | `partnerId = members.find(m => m.id !== currentUserId)`; `crypto.encryptDM(message, partnerId)` |
| Cifra pairwise | `site/src/services/crypto.js:153-182` | `encryptMessage(plaintext, keyPair.privateKey, recipientPublicKey)` |
| Primitiva | `site/src/crypto/encryption.js:38-59` | `sharedSecret = X25519(minhaPriv, suaPub)`; chave = BLAKE2b(shared); XChaCha20-Poly1305 (`crypto_secretbox_easy`) com nonce aleatório |
| Corpo enviado | `dm.js:180` | só `{ encrypted_content, nonce }`; **uma** cópia cifrada por mensagem |

**Não há envelope duplo nem chave de conversa.** Mas não é lacuna: em X25519, X25519(a_priv, b_pub) = X25519(b_priv, a_pub) = ab·G. O remetente `a` conhece `a_priv` e `b_pub`, logo consegue derivar o mesmo segredo e decifrar a própria mensagem. A cifra é simétrica para os dois lados do par por desenho. O que falta é o **cliente usar a chave pública certa na leitura** (item b).

`dm_group_keys` e o caminho de grupo (`encryptGroupDM`, `initializeDMGroupEncryption`, endpoints `/key` em `api/src/handlers/dm.js:1395-1485`) existem de ponta a ponta, mas **nenhum componente do site chama `initializeDMGroupEncryption`** (grep em `site/src` fora de `services/crypto.js`: zero). Logo grupos de DM hoje vão em **texto claro** (`encryptGroupDM` → `getDMGroupKey` → `/key` devolve `encryptedKey: null` → `null` → `sendMessage` manda `{ message }`). Achado lateral, fora deste conserto; registrado no fim.

### b) Leitura: o que volta para o remetente e por que o balão fica vazio

**Worker, GET mensagens** (`api/src/handlers/dm.js:476-490`): para toda linha com `is_encrypted`, devolve `message: null`, `encryptedContent`, `nonce`, `isEncrypted: true`, `isMine: sender_id === userId`. Não distingue remetente de destinatário: o remetente recebe o mesmo ciphertext que cifrou. Correto, o worker não tem chave.

**Cliente, decifra** (`site/src/services/api/dm.js:87-125`, `decryptMessageIfNeeded`):

```
decryptDM(encryptedContent, nonce, message.senderId)      // :96-100
```

- Para mensagem **do parceiro**: `senderId` = parceiro → X25519(minhaPriv, parceiroPub) → certo → decifra.
- Para mensagem **minha**: `senderId` = eu → `getUserPublicKey(eu)` → X25519(minhaPriv, **minhaPub**) = a²·G ≠ ab·G → `crypto_secretbox_open_easy` falha a tag → `encryption.js:88-89` lança `Decryption failed: message may be tampered or wrong key` → `crypto.js:215-217` **engole** com `logger.error('[E2E] DM decryption failed:')` e devolve `null`.
- `dm.js:109-122`: tenta `decryptGroupDM` → `getDMGroupKey` → `GET /key` → `encryptedKey: null` → `null`.
- `dm.js:124`: `message: '[Unable to decrypt]', decryptionFailed: true`.

**Render** (`site/src/components/messages/ChatView.jsx:382`): `{message.message}` cru. Não há tratamento de `decryptionFailed` no DM (o Underground e o Coletivo têm, `UndergroundFeed.jsx:299`, `CommentThread.jsx:91`).

**Recém-enviada** (`site/src/hooks/useDM.js:152-163`): o hook faz `setMessages(prev => [...prev, { ...data.message, replyPreview }])` com a **resposta do worker** (`dm.js:706-718`), que traz `message: null` para cifrada. Ninguém chama `decryptMessageIfNeeded` nem repõe `text.trim()`. **Balão vazio de imediato, sem nenhum broadcast envolvido.** Não existe eco otimista neste hook (nenhum `tempId`/pending; grep confirma).

**O que o console do Chrome deve mostrar ao abrir a conversa** (previsão a confirmar pelo Bob): um `console.error` por mensagem própria, texto `[E2E] DM decryption failed: Error: Decryption failed: message may be tampered or wrong key` (`logger.error` é o único nível ligado em produção, `site/src/utils/logger.js:8`; os `warn`/`log` de "trying group key" ficam mudos). E pelo código, **após F5 o balão próprio deve exibir a string `[Unable to decrypt]`, não ficar vazio**. Só o recém-enviado fica vazio. Se o Bob vê vazio também após F5, o build servido não corresponde a este HEAD, ou o texto está sendo tratado como vazio pelo CSS. Pedido: um print do console + um do balão após F5.

### c) Realtime: o broadcast substitui o eco?

**Não, por duas barreiras independentes:**

1. **A trigger não envia ao remetente.** `db/functions/broadcast_dm_inserted.sql` (espelho do banco, 22/09): `FOR member_record IN SELECT user_id FROM dm_conversation_members WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id` → `realtime.send(…, 'new-message', 'dm:' || user_id, TRUE)`. O canal `dm:<remetente>` não recebe nada.
2. **O cliente descartaria se recebesse.** `site/src/hooks/useDM.js:702-706`: `if (processedMsg.senderId === user?.id) { logger.log('[useDM] Skipping broadcast from self'); return; }`.

Dedupe por id existe (`useDM.js:752`), mas nunca chega a ser exercitado para o próprio. A hipótese "cópia cifrada vinda do broadcast substitui o eco" está descartada: o balão já nasce vazio na resposta do POST (item b).

Handler do canal: `useDM.js:681-800` (`dm:${user.id}`, evento `new-message`), decifra o alheio com `decryptDM(…, payload.sender_id)`, o que é correto para mensagens do parceiro.

### d) Histórico: por que nunca apareceu

| Data | Commit | Fato |
|---|---|---|
| 08/03/2026 | `56dcbf0` (fork) | `encryptDM`/`decryptDM(…, senderId)`, `'[Unable to decrypt]'` e o hook já vêm assim. O defeito é de nascença. |
| até 31/08/2026 | `ensureUserKeys` original (`git show 56dcbf0:site/src/services/crypto.js`) | registrava a chave pública no servidor **só no momento da geração**; se a chamada falhava ou o par de chaves já existia, o servidor ficava sem a chave. `encryptDM` então achava `recipientPublicKey = null` → `logger.warn('Recipient has no public key, sending unencrypted')` → **texto claro** (`crypto.js:165-169`). Em texto claro o worker devolve `message` preenchido e o remetente lê tudo. **Essa foi a máscara.** |
| 31/08/2026 | `1707857` (Underground MODO A) | `ensureUserKeys` passou a **sempre** registrar a chave (`crypto.js:73-84`, comentário "ALWAYS register… self-heals"). A partir daí qualquer usuário que abre a Comunidade (`useCrypto()` em `CommunityHub.jsx:81` e `CommunityPage.jsx:105`) tem chave no servidor, os pares passam a cifrar de verdade, e o lado remetente aparece quebrado. |
| — | testes históricos | verificavam o destinatário ("Edge lê"), que sempre funcionou. |

Cifragem "desde quando": o código cifra desde o fork; **na prática** as conversas passaram a ser cifradas quando os dois lados registraram chave, o que só ficou garantido em 31/08.

---

## Etapa 2 — Proposta (para OK; nada aplicado)

### Conserto canônico: usar a chave pública do **parceiro** para decifrar as próprias mensagens

É a menor mudança que o desenho já suporta e a única que **recupera o histórico**: a cifra pairwise é simétrica, então toda mensagem própria já gravada decifra com X25519(minhaPriv, parceiroPub). Não precisa envelope duplo (exigiria coluna nova + trigger + worker), nem chave de conversa (exigiria bootstrap de `dm_group_keys` e não recuperaria o que já existe).

**Duas edições, só no site. Zero banco, zero worker, zero trigger.**

#### Edição 1 — `site/src/services/api/dm.js`: peer certo na decifra pairwise

```diff
-/** Decrypt a single message if encrypted */
-async function decryptMessageIfNeeded(message) {
+/**
+ * Decrypt a single message if encrypted.
+ * peerIdForOwn: em conversa direta, o id do parceiro. Mensagem MINHA foi cifrada
+ * com X25519(minhaPriv, parceiroPub); decifrar exige a MESMA pública do parceiro,
+ * nunca a minha (senderId === eu daria outro segredo e '[Unable to decrypt]').
+ */
+async function decryptMessageIfNeeded(message, peerIdForOwn = null) {
   if (!message.isEncrypted || !message.encryptedContent || !message.nonce) {
     return message;
   }

   const crypto = await getCryptoService();
+  const pairwisePeerId = message.isMine && peerIdForOwn ? peerIdForOwn : message.senderId;

   try {
     // Try pairwise decryption first (for direct conversations)
     const decrypted = await crypto.decryptDM(
       message.encryptedContent,
       message.nonce,
-      message.senderId
+      pairwisePeerId
     );
```

```diff
-/** Get messages for a conversation (with decryption) */
-export async function getMessages(conversationId, before) {
+/** Get messages for a conversation (with decryption).
+ *  opts.peerIdForOwn: parceiro da conversa direta (para decifrar as minhas). */
+export async function getMessages(conversationId, before, { peerIdForOwn = null } = {}) {
   …
   const senderIds = [...new Set(data.messages?.map((m) => m.senderId).filter(Boolean))];
+  if (peerIdForOwn && !senderIds.includes(peerIdForOwn)) senderIds.push(peerIdForOwn);
   if (senderIds.length > 0) {
     await crypto.preloadPublicKeys(senderIds);
   }

   // Decrypt messages
   if (data.messages && data.messages.length > 0) {
-    data.messages = await Promise.all(data.messages.map(decryptMessageIfNeeded));
+    data.messages = await Promise.all(
+      data.messages.map((m) => decryptMessageIfNeeded(m, peerIdForOwn))
+    );
   }
```

#### Edição 2 — `site/src/hooks/useDM.js`: passar o parceiro nas 3 cargas e repor o texto no envio

```diff
+  // Parceiro de uma conversa direta (null em grupo ou sem members carregados)
+  const directPeerId = useCallback(
+    (conv) =>
+      conv?.type === 'direct'
+        ? conv.members?.find((m) => m.id !== user?.id)?.id || null
+        : null,
+    [user?.id]
+  );
```

Linha 80 (`openConversation`):
```diff
-        const data = await dmService.getMessages(conversationId);
+        const data = await dmService.getMessages(conversationId, undefined, {
+          peerIdForOwn: directPeerId(fromList),
+        });
```

Linha 113 (`loadMoreMessages`):
```diff
-      const data = await dmService.getMessages(activeConversation.id, oldestMessage.createdAt);
+      const data = await dmService.getMessages(activeConversation.id, oldestMessage.createdAt, {
+        peerIdForOwn: directPeerId(activeConversation),
+      });
```

Linha 322 (`openDirectConversation`):
```diff
-        const msgData = await dmService.getMessages(conv.id);
+        const msgData = await dmService.getMessages(conv.id, undefined, {
+          peerIdForOwn: directPeerId(conv),
+        });
```

Linhas 152-163 (`sendMessage`, o recém-enviado):
```diff
         if (data.message) {
           const messageWithReplyPreview = {
             ...data.message,
+            // O worker nunca devolve texto de linha cifrada (message: null);
+            // o remetente já tem o texto que acabou de enviar.
+            message: data.message.isEncrypted ? text.trim() : data.message.message,
             replyPreview: replyingTo
```

Dependências das callbacks: acrescentar `directPeerId` aos arrays de deps de `openConversation`, `loadMoreMessages` e `openDirectConversation`.

**Fallback:** em `openConversation`, se a conversa não estiver na lista (`fromList` undefined), `peerIdForOwn` vai `null` e as próprias mensagens dessa primeira carga continuam `[Unable to decrypt]` até a lista carregar. Se o Bob quiser cobrir isso agora, a alternativa é o worker emitir `recipientId` no GET (já seleciona `recipient_id`, `dm.js:385`, só não repassa) e o cliente usar `message.recipientId` quando `isMine`. Recomendo deixar para depois; a lista normalmente já está carregada.

**Realtime:** sem mudança. O próprio nunca recebe broadcast de si (§ 1c). O `message-edited` (`useDM.js:820-859`) também vem só de terceiros.

#### O que fazer com as mensagens antigas

**Nada: são legíveis com o conserto.** Toda mensagem própria já gravada foi cifrada com X25519(minhaPriv, parceiroPub) e passa a decifrar. Não é preciso placeholder tipo "[mensagem sua enviada de outro dispositivo/período]".

Duas ressalvas que **não** são deste defeito e valem igualmente para o destinatário:

- O par de chaves vive no navegador (`getStoredKeyPair`). Em outro navegador ou máquina o usuário tem outro par e **registra outra pública** (`ensureUserKeys` sempre registra). Mensagens cifradas para a pública antiga ficam ilegíveis no navegador novo, para o remetente **e** para o destinatário. Multi-dispositivo é um problema pré-existente do desenho pairwise, fora deste ciclo.
- Se o parceiro rotacionou a chave depois do envio, o remetente decifra com a pública **atual** do parceiro e falha nas antigas. Mesma limitação que o parceiro já tem. Aí sim o texto `[Unable to decrypt]` aparece, e é verdadeiro.

Para esses restos, proposta cosmética opcional (edição 3, só se o Bob quiser): em `ChatView.jsx:382`, quando `message.decryptionFailed`, renderizar o texto com classe `dm-message__undecryptable` e i18n `community.dm.undecryptable` ("Mensagem cifrada para outra chave"), no padrão do `UndergroundFeed.jsx:299`. Não entra no conserto mínimo.

### Teste após aplicar (Bob, mesmo par Chrome/Edge)

1. Chrome envia "teste A": balão do Chrome mostra "teste A" na hora (edição 2, envio).
2. F5 no Chrome: "teste A" e **todas as mensagens antigas do Chrome** aparecem legíveis (edição 1).
3. Edge continua lendo "teste A" (nada mudou no caminho do destinatário).
4. Console do Chrome sem `[E2E] DM decryption failed` na abertura da conversa.
5. Edge→Chrome, mesma sequência espelhada.

### Sizing opcional (só leitura, para o Bob, se quiser medir o legado)

```sql
SELECT c.type, dm.is_encrypted, count(*) AS mensagens
FROM public.direct_messages dm
JOIN public.dm_conversations c ON c.id = dm.conversation_id
GROUP BY 1, 2 ORDER BY 1, 2;
```

Esperado: `direct/true` é o volume recuperado pelo conserto; `group/true` deve ser 0 (achado lateral abaixo).

---

## Achados laterais (registrar, fora deste conserto)

| # | Achado | Onde | Gravidade |
|---|---|---|---|
| L1 | **Grupos de DM não são E2E**: nenhum componente chama `initializeDMGroupEncryption`; `encryptGroupDM` devolve `null` e a mensagem vai em texto claro | `site/src/services/crypto.js:405-458`; grep sem chamadores | média: promessa de E2E não cumprida em grupo; o worker e o banco veem o texto |
| L2 | `ChatView` não sinaliza `decryptionFailed` (Underground e Coletivo sinalizam) | `ChatView.jsx:382` | baixa: UX |
| L3 | Multi-dispositivo quebra a leitura para os dois lados (par de chaves por navegador, registro sobrescreve a pública) | `crypto.js:73-84`, `keys.js` | média: pré-existente, desenho |
| L4 | `useDM.js:702` descarta broadcast do próprio `sender_id`; com dois dispositivos do mesmo usuário, o segundo não vê a mensagem enviada pelo primeiro até recarregar | `useDM.js:702-706` | baixa, ligada a L3 |

---

## O que preciso do Bob

1. **Confirmação do sintoma após F5**: o balão próprio está **vazio** ou mostra **`[Unable to decrypt]`**? E o console tem `[E2E] DM decryption failed`? (§ 1b.) Não bloqueia o OK, mas fecha a leitura.
2. **OK para as edições 1 e 2** (só site, sem banco). Com o OK, aplico, rodo o build, e o Bob testa com o roteiro acima antes de qualquer deploy.
3. Decidir se a edição 3 (placeholder para `decryptionFailed`) entra no mesmo commit.

Commit proposto, depois do teste: `dm: remetente decifra as proprias mensagens (pairwise com a chave do parceiro)`. Sem autoria de IA.

---

## Paralelo: fechamento do hardening

Segue pronto e independente. Pendente só dos 3 testes do Bob (áudio antigo toca, TTS novo gera, painel no histórico) e da verificação do H3. Com isso: atualizo `db/policies/public.panel_analyses.sql`, fecho `HARDENING_2026-09-28.md` e disparo o commit já aprovado `seguranca: hardening de policies (dm, tts-audio, panel)`.

---

## Execução (29/09/2026, após OK do Bob)

OK do Bob: edições 1, 2 e 3 no mesmo ciclo. Resposta ao § 1b: nos prints o balão pós-F5 é **vazio**, não a string. Fica para conferir no console durante o teste pós-aplicação (esperado `[E2E] DM decryption failed` antes; nenhum depois). L1–L4 registrados na fila; L1 (grupos de DM sem E2E, gravidade média) candidato a ciclo próprio.

| Passo | Resultado |
|---|---|
| Edição 1 | `site/src/services/api/dm.js`: `decryptMessageIfNeeded(message, peerIdForOwn)` usa a pública do parceiro quando `isMine`; `getMessages(id, before, { peerIdForOwn })` pré-carrega a chave do parceiro |
| Edição 2 | `site/src/hooks/useDM.js`: `directPeerId(conv)`; passado nas 3 cargas (`openConversation`, `loadMoreMessages`, `startConversation`) com deps atualizadas; `sendMessage` repõe `text.trim()` quando a resposta vem cifrada |
| Edição 3 | `ChatView.jsx:382`: `decryptionFailed` renderiza `t('community.dm.undecryptable')` em `.dm-message__undecryptable` (CSS em `community-panels.css`, padrão do `.dm-message__edited`); chave `community.dm.undecryptable` nos 18 idiomas (validado por `JSON.parse` e leitura de `community.dm.undecryptable` em cada arquivo) |
| Lint | `eslint` nos 3 arquivos de código: limpo |
| Testes unitários | `vitest`: o site não tem arquivos de teste ("No test files found") |
| Build | `vite build` OK em 31s; bundle embute `https://api.philosify.org` (`.env.production`); `dist/assets/index-DXQWtjF1.js` |
| Produção = HEAD? | O chunk `HistoryPage-Btf71oUU.js`, não tocado por estas edições, tem o **mesmo hash** no site vivo e no build novo. Logo a produção já corresponde a este HEAD; o deploy leva só estas edições |
| Teste local/preview | **Inviável**: o worker de produção só aceita origens `philosify.org`/`www`/`ads` (`api/wrangler.toml:84`), e o login é por cookie `credentials: 'include'`. Preview `*.pages.dev` ou `localhost` não autentica contra a API de produção. O teste exige produção |
| Deploy | 1ª tentativa bloqueada pela permissão da sessão; **Bob mandou o comando e o deploy saiu em 29/09**: 62 arquivos novos, deployment `ef6b8fc4.philosify-frontend.pages.dev`, branch `production` (philosify.org). Verificado: o chunk `pt-L_8PZxgF.js` servido em philosify.org contém "Mensagem cifrada para outra chave". Aguardando os 5 testes do Bob |

**Deploy, para o Bob rodar no terminal desta sessão (prefixo `!`):**

```
! cd site && npx wrangler pages deploy dist --project-name=philosify-frontend --branch=production
```

`dist/` já está construído com as 3 edições. Se preferir reconstruir antes: `! cd site && npm run build && npx wrangler pages deploy dist --project-name=philosify-frontend --branch=production`.

**Roteiro de teste (Bob, Chrome ↔ Edge, após o deploy e um Ctrl+F5 em cada):**

1. Chrome envia "teste A": balão do Chrome mostra "teste A" na hora.
2. F5 no Chrome: "teste A" e o histórico próprio do Chrome legíveis.
3. Edge lê "teste A".
4. Console do Chrome ao abrir a conversa: **nenhum** `[E2E] DM decryption failed`. Se aparecer, colar a linha inteira.
5. Espelhado: Edge envia "teste B", mesmos 4 passos.

Se algum balão próprio ainda ficar vazio após F5: colar o console e informar se o texto "Mensagem cifrada para outra chave" aparece em algum balão (indicaria chave do parceiro rotacionada, não o defeito).

**Commit** (após o teste, com a ordem já dada): `dm: remetente decifra as proprias mensagens (pairwise com a chave do parceiro)`. Arquivos: `dm.js`, `useDM.js`, `ChatView.jsx`, `community-panels.css`, 18 JSON de i18n, este md. Sem autoria de IA.

Rollback do deploy, se preciso: `wrangler pages deployment list --project-name=philosify-frontend` e `wrangler pages deployment rollback <id-anterior>` (ou reverter o commit e redeployar).

### Teste 1 do Bob (prints 12:59/13:00): mesmo sintoma. Verificação elo a elo (13:02)

| Elo | Evidência | Veredito |
|---|---|---|
| 1. Deploy saiu? | `wrangler pages deployment list`: `ef6b8fc4-03e2-4dd7-aa48-82a0ab89cb5c`, Production, branch `production`, "3 minutes ago" às 13:02 → **aterrissou ≈ 12:59**, o mesmo minuto dos prints | saiu, mas **durante** o teste |
| 2. Borda serve o novo? | `curl` com UA de navegador: `philosify.org/` referencia `index-DXQWtjF1.js` = `dist/index.html`. `index-DXQWtjF1.js` e `CommunityPage-CipumPm5.js` servidos com HTTP 200 e **contêm `peerIdForOwn`** (o fix) | **sim, produção já roda o bundle novo** |
| 3. Navegador do Bob | Prints às 12:59/13:00 com o deploy aterrissando às 12:59: a aba carregou o bundle anterior. O site tem service worker (`sw.js`, `philosify-v13`): `index.html` é network-first, assets são fingerprinted e imutáveis, então um reload normal já deve trazer o novo; um Ctrl+F5 resolve na quase totalidade dos casos | **elo mais provável: timing + aba antiga** |
| 4. Fix | não avaliável antes do 3 | pendente |

**Instrução ao Bob:** fechar as abas do philosify.org nos dois navegadores, abrir de novo, DevTools → Network → filtrar `Community`: o chunk carregado deve ser `CommunityPage-CipumPm5.js` (e `index-DXQWtjF1.js`). Se for outro nome: DevTools → Application → Service Workers → Unregister, e Storage → Clear site data, recarregar. Só então repetir o roteiro e colar o console verbatim (linhas `[E2E]` e `[useDM]`).

### Verificação no DevTools do Chrome do Bob (Claude in Chrome, 13:05–13:10)

Aba nova em `philosify.org/community?tab=messages`, sessão do Bob (bob@bobrach.com), console e rede monitorados desde o load, conversa "Roberto Rachewsky" aberta.

| Item | Evidência |
|---|---|
| Bundle carregado | `index-DXQWtjF1.js`, `CommunityPage-CipumPm5.js`, `pt-L_8PZxgF.js` (todos HTTP 200; iguais ao `dist/`). Service worker `sw.js` ativo, sem versão em espera |
| Rede ao abrir a conversa | `GET /api/dm/conversations/a715e7b5-…/messages` 200 → `POST /api/crypto/keys/bulk` 200 → `POST …/read` 200 |
| Console | **zero** linhas `[E2E]`, `[useDM]`, `[DM]`; zero erros de qualquer tipo |
| Balões próprios (`.dm-message--mine`) | "hi testing" 10:41, "what?" 10:42, "testing from chrome to edge" 10:47, **"testing from chrome to edge 2" 13:00** (a do teste que "falhou"): **todos legíveis**, nenhum `.dm-message__undecryptable` |
| Balões do parceiro | "testing from edge to chrome" 10:48, "testing from edge to chrome 2" 12:59: legíveis |

**Veredito:** o elo era a aba com bundle anterior (prints às 12:59/13:00, deploy aterrissando às 12:59). Com o bundle novo, a leitura das próprias mensagens está resolvida, histórico incluído. Falta só o Bob exercitar o **envio** (edição 2) pela aba aberta: enviar uma mensagem e ver o balão preenchido na hora, depois F5. Não enviei mensagem em nome do Bob.

**Teste 2 do Bob (13:1x): "working".** Envio novo com balão preenchido na hora e leitura própria após F5, nas duas direções. Ciclo fechado; commit abaixo.
