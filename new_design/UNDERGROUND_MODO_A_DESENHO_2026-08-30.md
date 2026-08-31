# Underground — MODO A (desenho, 1 página)

**Data:** 2026-08-30 · **Status:** desenho para OK do Bob. Sem código até o OK.

## Modelo de segurança (o que a Privacy dirá)
Cifragem **em repouso** + **pseudonimato**, **não** E2E. A sala existe porque o Philosify a abriu, está sempre aberta e não depende de usuário. O **worker detém a chave** (protegida por KEK no Secrets Store). Protege contra **vazamento do banco** e terceiros; o pseudônimo protege **entre membros**; o **dono lê e conhece a autoria** para moderação.

## Fluxo
1. **Bootstrap (sem "fundador"):** no 1º `GET /api/underground`, se `underground_room` não tem `encrypted_room_key`, o worker gera a chave da sala (32 bytes aleatórios), **KEK-wrap** e grava com `INSERT … ON CONFLICT DO NOTHING` (árbitro atômico mantido). Sala pré-existente por construção.
2. **Entrega:** todo access-holder autenticado recebe a **chave da sala em claro sobre TLS** no `GET /api/underground` (worker faz KEK-unwrap e devolve `roomKey` base64). Sem embrulho por chave pública, sem pendente, sem distribuidor, sem fingerprint, sem rekey.
3. **Posts:** cliente cifra/decifra com a chave da sala via **secretbox existente** (`encryptWithSymmetricKey`/`decryptWithSymmetricKey`, `crypto/encryption.js`); servidor grava só `ciphertext`+`nonce`, `content` = null. Realtime segue cifrado; cliente decifra. Chave perdida no navegador = nada a perder (o próximo load reentrega).
4. **Unlock:** cobra 3 créditos como hoje; **sem** exigência de keypair.
5. **Moderação (sob demanda):** rota admin (`ADMIN_SECRET`/service_role) `POST /api/underground/admin/decrypt {post_id}` → worker KEK-unwrap da chave, **tweetnacl `secretbox.open`** do post → plaintext, com **log de auditoria** (quem, quando, post_id). Report simplifica para `{post_id, reason}` (o plaintext voluntário sai; o servidor decifra sozinho quando preciso).

## Chave e KEK
- **KEK:** secret `UNDERGROUND_ROOM_KEK` no Secrets Store (o Bob cria; comando entregue no passo KEK). 32 bytes.
- **KEK-wrap:** WebCrypto **AES-256-GCM** no worker (nativo, zero lib). `underground_room.encrypted_room_key` = `iv || AES-GCM(KEK, roomKey)`, base64.
- **Chave da sala:** 32 bytes para secretbox; entregue crua (base64) ao cliente.

## Arquivos afetados
**Worker:** `api/src/handlers/underground.js` (GET entrega roomKey + bootstrap; create/edit inalterados no essencial; **remove** room-init/pending-keys/distribute-keys/rekey; report → `{post_id,reason}`; **novo** handler admin decrypt) · `api/index.js` (remove 4 rotas + imports; nova rota admin) · `api/src/handlers/spaces.js` (remove gate 409 KEYPAIR_REQUIRED, escopo underground) · `api/wrangler.toml` (binding `UNDERGROUND_ROOM_KEK`) · **novo** `api/src/utils/roomKey.js` (KEK-wrap/unwrap AES-GCM + `secretbox.open` via tweetnacl) · `api/package.json` (tweetnacl).
**Site:** `site/src/services/api/underground.js` (GET guarda roomKey; **remove** ensureRoomReady/runDistributorSweep/roomInit/getPendingKeys/distributeKeys/rekey; report `{post_id,reason}`) · `site/src/services/crypto.js` (**remove** setUndergroundRoomKey/fingerprint/generate/adopt/discard/wrap; guarda a chave entregue; encrypt/decrypt de post reaproveitam secretbox) · `site/src/components/community/SpaceLock.jsx` (remove ensureUserKeys pré-unlock + 409) · `site/src/hooks/useUnderground.js` (remove estados roomStatus pendente/erro) · `site/src/components/underground/UndergroundFeed.jsx` (remove banner pendência/composer bloqueado; aviso do report → "a moderação poderá ler este post") · `site/src/i18n/translations/*.json` (18: remove chaves de pendência/erro; troca texto do aviso — método cirúrgico EOL-aware) · `underground.css` (remove estilos de room-status).
**Migração:** `underground_room` **+`encrypted_room_key`**, `key_fingerprint`/`created_by` viram nuláveis; **apaga a linha órfã atual** (posts=0); `space_access.encrypted_room_key`/`key_distributed_by` ficam **sem uso** (não dropar). Pré-flight + verificação no padrão.

## O que sai (código morto do desenho anterior)
Handlers room-init/pending-keys/distribute-keys/rekey; orquestração ensureRoomReady/distribuidor no front; fingerprint/adopt/discard/wrap no `crypto.js`; estados pendente/erro na UI + chaves i18n; exigência de keypair no unlock. **`user_public_keys` deixa de ser requisito do Underground** (DMs seguem com o E2E deles + o fix #6 do regex; nada disso muda).

## Riscos
- **tweetnacl no worker** (só p/ moderação): dependência nova, pura-JS, ~pequena; wire-compatível com o secretbox do cliente. Único caminho para decifrar post secretbox no servidor (WebCrypto não faz XSalsa20-Poly1305).
- **Chave da sala em claro ao membro:** inerente ao modelo (membro já lê tudo na UI). Protege contra dump do banco sem o KEK, não entre membros. **A Privacy precisa declarar isso.**
- **Perda/rotação do KEK = posts ilegíveis** (o `encrypted_room_key` não reabre). Exige **backup do KEK**.
- Reset limpo: posts=0, então apagar a linha órfã e gerar chave nova não perde dados. **Dissolve o problema do rekey/fundador-único** que o smoke expôs.

## Ordem de entrega (após OK)
migração (Bob aplica) → KEK (Bob cria; comando entregue) → worker → site → dry-run/build → deploy → **smoke reduzido** (2 contas, navegadores persistentes: unlock → post → realtime → denúncia → SQL `content` null e post decifrável só pelo caminho admin).

## Follow-ups (fora deste escopo, mantidos)
realtime-token 401 em loop · saldo do header pós-unlock · validação de apelido com mensagem própria.
