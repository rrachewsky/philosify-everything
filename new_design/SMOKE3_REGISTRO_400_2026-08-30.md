# Inspeção no browser — registro de chave pública retorna 400 (mismatch de base64)

**Data:** 2026-08-30
**Conta inspecionada:** `bob@bobrach.com` (logada, saldo 20, Underground **bloqueado** — tela de SpaceLock)
**Método:** aba nova no mesmo perfil do Chrome (mesmos cookies → mesma conta) → hard reload `Ctrl+Shift+R` com tracking de rede/console ativo → leituras **read-only** (sem clique, sem unlock, sem POST extra).

---

## Respostas diretas às 3 perguntas

### (1) Bundle `index-*.js` carregado
- **`https://philosify.org/assets/index-DhiYKGt_.js`** — é o bundle do último deploy (site `e0357075`, o mesmo que o ripgrep achou no `dist`).
- **`serviceWorker.controller = null`** → nenhum Service Worker servindo cache velho; o hard reload trouxe o artefato novo. **O front está com o 2a.**

### (2) Requests para `/api/crypto/*`
- **`POST https://api.philosify.org/api/crypto/keys` → 400.** Única chamada crypto no load.
- **Corpo da resposta:** não capturei o texto verbatim (o tool de rede não expõe corpo, e não reemiti a requisição para respeitar o "só reload"). Pelo código, um 400 nesse endpoint só sai de `crypto.js:75-81` → **`{"error":"Invalid public key format"}`** (a outra opção, "Public key is required", exige chave vazia — não é o caso, a chave existe). Confirmado abaixo pela prova ao vivo.
- Adjacente (não-crypto, contexto): `GET /api/spaces/underground/status → 200`.

### (3) Console com `[E2E]`/`[Crypto]`/`keys`/erros
- **Vazio.** Consistente com o build de produção **removendo os `logger`** (as strings `[E2E]`/`[Crypto]` são compiladas fora — já tínhamos visto 0 ocorrências no `dist`). **Em produção não há diagnóstico via console; a fonte de verdade é a rede.**

---

## Causa raiz do 400 — mismatch de variante base64 (provado ao vivo)

Leitura read-only da chave pública armazenada no IndexedDB (`philosify-crypto` › `keys` › `user-keypair`; **só a pública, a privada nunca foi lida**):

```
publicKeyBase64:   "knhJH9D3_aS7JoB3Zs83Vr6S0SBE6ho9AqoeZAczSTA"
length:            43
hasUrlSafeChars:   true      (contém "_")
endsWithPadding:   false     (sem "=")
matchesServerRegex: FALSE
```

- **Cliente** (`site/src/crypto/keys.js:65,137`): `sodium.to_base64(...)` — o default do libsodium-wrappers é **URLSAFE_NO_PADDING** (alfabeto `-`/`_`, 43 chars, sem `=`).
- **Servidor** (`api/src/handlers/crypto.js:16,79`): `PUBLIC_KEY_REGEX = /^[A-Za-z0-9+/]{43}=$/` — exige **base64 padrão com padding** (`+`/`/` e `=`).
- A chave URL-safe **nunca** passa esse regex → **400 em toda tentativa de registro**.

### Consequência
- O 2a **funciona** (o registro passou a disparar no load — vemos o POST). Mas ele é **rejeitado no portão de formato** do servidor → `user_public_keys` continua vazia → **o unlock ainda dará 409**. 
- Este é o bug **mais profundo** por trás do achado 4: registro sempre falhava (400), mascarado antes pelo early-return + swallow. **Achado 4 NÃO está resolvido só com 2a/2b.**

### Por que só o servidor precisa mudar
Todo o pipeline de cripto do cliente é URL-safe e **consistente**: `to_base64` (grava/envia) e `from_base64` (lê a pública de outros membros para embrulhar a chave da sala) usam o **mesmo** default URL-safe. O servidor **nunca decodifica** a chave — só valida o formato, armazena a string e devolve. Logo, o único ponto que quebra é o regex.

---

## Correção proposta (diff #6 — worker; aguardando OK, sem deploy)

`api/src/handlers/crypto.js:16` — aceitar URL-safe sem padding (mantendo compat com o padrão, defensivo):

```diff
-const PUBLIC_KEY_REGEX = /^[A-Za-z0-9+/]{43}=$/;
+// X25519 pública em base64: aceita URL-safe sem padding (o que o cliente
+// envia — libsodium to_base64 default) e o padrão com padding.
+const PUBLIC_KEY_REGEX = /^(?:[A-Za-z0-9+/]{43}=|[A-Za-z0-9_-]{43})$/;
```

Sem mudança no cliente (o formato URL-safe já é o canônico de ponta a ponta). Após deploy do worker, no próximo load a conta registra (200) → `user_public_keys` populada → unlock passa do 409; A e B se regularizam (B fica visível ao pending-keys).

---

## Diff #6 aplicado (ajuste do Bob: formato canônico único)

Regex final — **só** URL-safe sem padding (rejeita padrão com padding, porque o `from_base64` dos clientes não decodifica `+`/`/`/`=`):
```js
// api/src/handlers/crypto.js:16
const PUBLIC_KEY_REGEX = /^[A-Za-z0-9_-]{43}$/;
```
Só worker. **Deploy:** versão `0e5447bb-b6da-449d-8367-c60a92ee8ea1`.

### Confirmação em produção (2026-08-30)
Recarregada a conta `bob@bobrach.com` (também não-registrada, dava 400):
- **Rede (browser):** `POST /api/crypto/keys → 200` (era 400).
- **Tail (worker):** `[Crypto] Public key registered for user c7ab2dcd-2803-4895-8336-33497171879f`.
- A chave URL-safe agora passa o regex → gravada em `user_public_keys`. **Registro de chave pública funciona pela primeira vez em produção.**

## Impacto histórico — registro NUNCA funcionou; DMs e Collective sem E2E efetivo

Como o registro dava **400 perene** (mascarado por early-return + swallows), `user_public_keys` esteve **sempre vazia**. Consequência nos três módulos que dependem dela:

- **DMs:** `encryptDM` (`site/src/services/crypto.js:153`) busca `getUserPublicKey(recipientId)`; sem chave → `logger.warn('[E2E] Recipient has no public key, sending unencrypted')` (`:167`) → **mensagem enviada em plaintext**. Idem na leitura: `[E2E] Sender has no public key, cannot decrypt` (`:209`).
- **Collective / GroupDM:** a distribuição da chave de grupo embrulha-a por chave pública de cada membro (`setCollectiveKeys` / `encryptForGroup`); sem chaves públicas registradas, o grupo nunca teve chave distribuível → sem E2E efetivo.
- **Underground:** o mesmo gate (unlock 409); os posts só passaram a nascer cifrados agora.

**Este fix (diff #6) corrige a raiz para os três módulos** — com o registro funcionando, DMs e Collective passam a ter chave pública real dos participantes e deixam de cair no fallback plaintext (para mensagens novas; as antigas nasceram em claro e assim permanecem).

## Estado
- **Aplicado, deployado e confirmado em produção** (worker `0e5447bb`). Sem commit — consolidação após o smoke fechar.
- **Próximo passo (Bob):** recarregar a **conta A** → esperado `POST /api/crypto/keys → 200` + `[Crypto] Public key registered for user <uuid>` → o unlock passa do 409. Tail e monitor armados para capturar.
