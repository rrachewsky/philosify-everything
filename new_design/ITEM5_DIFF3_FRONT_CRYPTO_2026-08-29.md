# Pacote Pré-Privacy — ITEM 5, DIFF 3: crypto + serviços do front

**Data:** 2026-08-29
**Status:** **APLICADO** após a verificação condicionada do OK do Bob. Build do site OK (✓ 1m12s). Sem commit.

**Verificação do OK (forma do post no reportPost):** a forma real é **camelCase** — o backend monta `encryptedContent: p.encrypted_content` e `nonce: p.nonce` (`api/src/handlers/underground.js:155-156`) e o `decryptPostIfNeeded` lê/preserva `post.encryptedContent`/`post.nonce` (`site/src/services/api/underground.js:19,24` + spread). O `reportPost` proposto já usava esses nomes — **nenhum ajuste necessário**; os snake_case aparecem só no body enviado (`ciphertext_ref`/`nonce_ref`), que é o contrato do endpoint. Comentário registrando isso adicionado ao próprio `reportPost`.

**Riscos registrados sem bloqueio (OK do Bob):** dupla falha do vencedor-órfão (residual, detectável no primeiro teste) e modelo de ameaça do distribuidor (inerente a E2E via web; a Privacy declara proteção contra leitura pelo servidor, não contra operador ativamente malicioso).

**Ajuste acessório descoberto na aplicação:** `publicKeyFromBase64` não era re-exportado pelo barrel `site/src/crypto/index.js` — adicionado ao bloco de exports de `keys.js` (linha nova no barrel).
**Arquivos:** `site/src/services/crypto.js` (seção Underground reescrita) e `site/src/services/api/underground.js` (chamadas novas + orquestração do load + remoção dos fallbacks plaintext).

---

## 0. Decisões de implementação (para o OK cobrir)

1. **Fingerprint:** `crypto.subtle.digest('SHA-256', chaveCrua)` → hex minúsculo de 64 chars — exatamente o que o backend valida (`FINGERPRINT_REGEX /^[0-9a-f]{64}$/i`; o handler ainda faz `.toLowerCase()` defensivo).
2. **Validação ANTES de qualquer uso:** `setUndergroundRoomKey` muda de assinatura — passa a **exigir** o `expectedFingerprint`; decifra a cópia, calcula o hash e **só adota a chave se bater**; em mismatch/falha, zera o buffer (`fill(0)`) e retorna `false` (o orquestrador dispara o `rekey` automático). Nenhum caminho usa a cópia decifrada antes dessa checagem.
3. **Descarte da chave do perdedor:** buffer zerado com `fill(0)` e referência descartada — **exceto** num caso: se o `room-init` responder `winner:false` mas o fingerprint vencedor for **igual ao nosso**, nós somos o vencedor-órfão da auto-cura do DIFF 2 (o hash amarra a chave) → **adotamos a chave que geramos** em vez de descartar. Cobre o lado client da auto-cura sem round-trip extra.
4. **`ensureUserKeys()` no início da orquestração** — gera+registra keypair se faltar (inicializa o libsodium internamente). Cobre os 3 membros da era de teste sem código especial.
5. **Fallbacks plaintext removidos** de `createPost`/`editPost`: sem chave de sala → `Error` com `code = 'E2E_NO_ROOM_KEY'` (a UI do DIFF 4 mostra o estado pendente); nunca mais corpo com `content`.
6. **Retry do REPORT_STALE (uma vez):** em 409, o client re-GETa a lista, redecifra o post e reenvia; se o post não estiver na página atual, propaga o erro à UI. Limitação registrada: paginação de 30 — post antigo denunciado após edição simultânea pode exigir novo clique.
7. **Varredura distribuidora fire-and-forget** no load de quem está chaveado: `pending-keys` → wrap por membro → `distribute-keys`; erros só logados (nunca bloqueiam a leitura da sala).
8. **`getPosts` devolve `roomStatus`**: `'ready' | 'pending' | 'error'` (+ passthrough do `needsNickname`), consumido pela UI no DIFF 4.

---

## 1. `site/src/services/crypto.js` — seção UNDERGROUND reescrita

Substitui o bloco atual (`:483-552`: `undergroundRoomKey`, `setUndergroundRoomKey`, `encrypt/decryptUndergroundPost`) por:

```js
// ============================================================
// UNDERGROUND ENCRYPTION (mandatory E2E — pacote pré-privacy item 5)
// ============================================================
// One shared room key for every unlocked member. The raw key exists
// ONLY in members' browsers; the server stores per-member wrapped
// copies plus the key's SHA-256 fingerprint (underground_room).
// A wrapped copy is NEVER used before its fingerprint is verified.

let undergroundRoomKey = null;

/** SHA-256 of the raw room key, lowercase hex (backend FINGERPRINT_REGEX). */
export async function computeRoomKeyFingerprint(rawKey) {
  const digest = await window.crypto.subtle.digest('SHA-256', rawKey);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a candidate room key for room-init (design §2.2).
 * Returns { rawKey, fingerprint, encryptedKeyForSelf } or null.
 * The caller MUST either adopt the rawKey (winner) or discard it
 * with discardRoomKeyCandidate (loser).
 */
export async function generateUndergroundRoomKey() {
  if (!isReady()) {
    await initializeE2E();
  }
  const keyPair = await getStoredKeyPair();
  if (!keyPair) return null;

  const rawKey = generateGroupKey();
  const fingerprint = await computeRoomKeyFingerprint(rawKey);
  const encryptedKeyForSelf = encryptGroupKeyForMember(rawKey, keyPair.publicKey);
  return { rawKey, fingerprint, encryptedKeyForSelf };
}

/** Adopt a raw room key (room-init winner / orphan-winner self-heal). */
export function adoptUndergroundRoomKey(rawKey) {
  undergroundRoomKey = rawKey;
  logger.log('[E2E] Underground room key adopted');
}

/** Zero and drop a candidate key that lost the room-init race. */
export function discardRoomKeyCandidate(rawKey) {
  try {
    if (rawKey && typeof rawKey.fill === 'function') rawKey.fill(0);
  } catch {
    // best effort — the reference is dropped either way
  }
}

/**
 * Set the room key from the member's wrapped copy — ONLY after the
 * fingerprint check passes (design §2.3; a wrong copy is a DoS
 * attempt or corruption: discard and let the caller trigger rekey).
 * @returns {Promise<boolean>} true = key verified and adopted
 */
export async function setUndergroundRoomKey(encryptedKey, expectedFingerprint) {
  if (!encryptedKey || !expectedFingerprint) return false;
  if (!isReady()) {
    await initializeE2E();
  }
  const keyPair = await getStoredKeyPair();
  if (!keyPair) return false;

  let candidate = null;
  try {
    candidate = decryptGroupKey(encryptedKey, keyPair.publicKey, keyPair.privateKey);
  } catch (error) {
    logger.error('[E2E] Failed to decrypt Underground room key:', error);
    return false;
  }

  const fingerprint = await computeRoomKeyFingerprint(candidate);
  if (fingerprint !== expectedFingerprint.toLowerCase()) {
    logger.error('[E2E] Underground room key fingerprint MISMATCH — discarding copy');
    discardRoomKeyCandidate(candidate);
    return false;
  }

  undergroundRoomKey = candidate;
  logger.log('[E2E] Underground room key verified and set');
  return true;
}

/** Whether this browser currently holds the verified room key. */
export function hasUndergroundRoomKey() {
  return !!undergroundRoomKey;
}

/**
 * Wrap the room key for another member's public key (distributor
 * flow, design §2.3). Returns the wrapped copy or null.
 */
export function wrapUndergroundRoomKeyFor(publicKeyBase64) {
  if (!undergroundRoomKey || !publicKeyBase64) return null;
  try {
    const publicKey = publicKeyFromBase64(publicKeyBase64);
    return encryptGroupKeyForMember(undergroundRoomKey, publicKey);
  } catch (error) {
    logger.error('[E2E] Failed to wrap Underground room key:', error);
    return null;
  }
}

/** Encrypt a post for Underground. Null when the key is absent. */
export function encryptUndergroundPost(plaintext) {
  if (!undergroundRoomKey) {
    return null;
  }
  try {
    const { ciphertext, nonce } = encryptForGroup(plaintext, undergroundRoomKey);
    return { encrypted_content: ciphertext, nonce };
  } catch (error) {
    logger.error('[E2E] Underground encryption failed:', error);
    return null;
  }
}

/** Decrypt a post from Underground. */
export function decryptUndergroundPost(encryptedContent, nonce) {
  if (!encryptedContent || !nonce || !undergroundRoomKey) {
    return null;
  }
  try {
    return decryptFromGroup(encryptedContent, nonce, undergroundRoomKey);
  } catch (error) {
    logger.error('[E2E] Underground decryption failed:', error);
    return null;
  }
}
```

Ajustes acessórios no mesmo arquivo:
- Import de `publicKeyFromBase64` adicionado ao bloco de imports de `@/crypto` (já exportado por `crypto/keys.js:170`).
- `clearAllCaches()`: zera antes de soltar — `discardRoomKeyCandidate(undergroundRoomKey); undergroundRoomKey = null;`.
- `export default`: entradas novas (`computeRoomKeyFingerprint`, `generateUndergroundRoomKey`, `adoptUndergroundRoomKey`, `discardRoomKeyCandidate`, `hasUndergroundRoomKey`, `wrapUndergroundRoomKeyFor`).

---

## 2. `site/src/services/api/underground.js`

### 2.1 Chamadas novas

```js
async function roomInit(fingerprint, encryptedKey) {
  const response = await fetch(`${API_BASE}/underground/room-init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fingerprint, encryptedKey }),
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to initialize room');
  return data; // { winner, fingerprint }
}

async function getPendingKeys() {
  const response = await fetch(`${API_BASE}/underground/pending-keys`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to list pending members');
  return data.pending || [];
}

async function distributeKeys(keys) {
  const response = await fetch(`${API_BASE}/underground/distribute-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keys }),
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to distribute keys');
  return data;
}

async function rekey() {
  const response = await fetch(`${API_BASE}/underground/rekey`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to reset key');
  return data;
}
```

### 2.2 Orquestração do load (nova função interna, chamada por `getPosts`)

```js
/**
 * Room-key orchestration (design §2.2/§2.3/§2.6), runs on every load:
 * ensureUserKeys → init-if-empty → verify copy vs fingerprint
 * (mismatch → automatic rekey) → distributor sweep when keyed.
 * Returns 'ready' | 'pending' | 'error'.
 */
async function ensureRoomReady(data) {
  try {
    // Keypair first — also covers pre-E2E members on their next visit
    await cryptoService.ensureUserKeys();

    // Already holding the verified key from a previous load this session
    if (cryptoService.hasUndergroundRoomKey()) {
      runDistributorSweep();
      return 'ready';
    }

    // Room does not exist yet — this client attempts to found it
    if (!data.roomInitialized) {
      const candidate = await cryptoService.generateUndergroundRoomKey();
      if (!candidate) return 'error';

      const result = await roomInit(candidate.fingerprint, candidate.encryptedKeyForSelf);
      if (result.winner) {
        cryptoService.adoptUndergroundRoomKey(candidate.rawKey);
        logger.log('[Underground] Room founded by this client');
        return 'ready';
      }
      // Lost the race. One exception: if the winning fingerprint IS ours,
      // we are the orphan winner healed server-side (DIFF 2) — the hash
      // binds the key, so adopting our own candidate is safe.
      if (result.fingerprint === candidate.fingerprint) {
        cryptoService.adoptUndergroundRoomKey(candidate.rawKey);
        logger.log('[Underground] Orphan-winner self-heal: candidate adopted');
        runDistributorSweep();
        return 'ready';
      }
      cryptoService.discardRoomKeyCandidate(candidate.rawKey);
      logger.log('[Underground] Lost room-init race — pending delivery');
      return 'pending';
    }

    // Room exists. No wrapped copy for us yet → pending delivery.
    if (!data.encryptedRoomKey) {
      return 'pending';
    }

    // Verify the wrapped copy BEFORE any use (design §2.3). A failure
    // means our keypair changed or the copy is wrong → automatic rekey
    // puts us back in the pending pool (design §2.6).
    const ok = await cryptoService.setUndergroundRoomKey(
      data.encryptedRoomKey,
      data.roomFingerprint,
    );
    if (!ok) {
      logger.warn('[Underground] Room key copy invalid — requesting rekey');
      try {
        await rekey();
      } catch (err) {
        logger.warn('[Underground] rekey failed:', err.message);
      }
      return 'pending';
    }

    runDistributorSweep();
    return 'ready';
  } catch (err) {
    logger.error('[Underground] Room orchestration failed:', err.message);
    return 'error';
  }
}

/** Fire-and-forget: wrap the room key for pending members (design §2.3). */
function runDistributorSweep() {
  (async () => {
    try {
      const pending = await getPendingKeys();
      if (!pending.length) return;
      const keys = pending
        .map((p) => ({
          userId: p.userId,
          encryptedKey: cryptoService.wrapUndergroundRoomKeyFor(p.publicKey),
        }))
        .filter((k) => k.encryptedKey);
      if (!keys.length) return;
      await distributeKeys(keys);
      logger.log(`[Underground] Distributed room key to ${keys.length} member(s)`);
    } catch (err) {
      logger.log('[Underground] Distributor sweep skipped:', err.message);
    }
  })();
}
```

`getPosts` passa a chamar a orquestração (substitui o bloco `:64-71` que setava a chave sem validação):

```diff
   const data = await response.json();
 
-  // Store the room key if provided
-  if (data.encryptedRoomKey) {
-    try {
-      await cryptoService.setUndergroundRoomKey(data.encryptedRoomKey);
-    } catch (err) {
-      logger.warn('[Underground] Failed to set room key:', err.message);
-    }
-  }
+  // Nickname gate — room orchestration only makes sense past it
+  if (data.needsNickname) {
+    return data;
+  }
+
+  // Mandatory E2E: verify/obtain the room key before decrypting
+  data.roomStatus = await ensureRoomReady(data);
 
   // Decrypt posts
   if (data.posts && data.posts.length > 0) {
     data.posts = await Promise.all(data.posts.map(decryptPostIfNeeded));
   }
```

### 2.3 `createPost` / `editPost` — sem fallback plaintext

```diff
 async function createPost(content, options = {}) {
-  let body = { content };
-  ...
-  // Try to encrypt the post
-  try {
-    const encrypted = cryptoService.encryptUndergroundPost(content);
-    if (encrypted) {
-      body = { encrypted_content, nonce, ... };
-    } else {
-      logger.log('[Underground] Sending plaintext (encryption not available)');
-    }
-  } catch (err) {
-    logger.warn('[Underground] Encryption failed, sending plaintext:', err.message);
-  }
+  // Mandatory E2E (design §2.7): no room key = no post.
+  const encrypted = cryptoService.encryptUndergroundPost(content);
+  if (!encrypted) {
+    const err = new Error('Room key not available yet');
+    err.code = 'E2E_NO_ROOM_KEY';
+    throw err;
+  }
+  const body = {
+    encrypted_content: encrypted.encrypted_content,
+    nonce: encrypted.nonce,
+    ...(options.replyToId ? { reply_to_id: options.replyToId } : {}),
+  };
```

`editPost` idem (mesmo padrão, sem `reply_to_id`).

### 2.4 `reportPost` (design §2.8, com retry único de REPORT_STALE)

```js
/**
 * Report a post — sends the reporter's own decrypted copy (design §2.8).
 * The UI warns explicitly before calling this. Retries ONCE on
 * REPORT_STALE (post edited between read and report).
 */
async function reportPost(post, reason, _retried = false) {
  const response = await fetch(`${API_BASE}/underground/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      post_id: post.id,
      reason,
      plaintext: post.content,
      ciphertext_ref: post.encryptedContent,
      nonce_ref: post.nonce,
    }),
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 409 && data.code === 'REPORT_STALE' && !_retried) {
    // Post changed since we read it — refetch, re-decrypt, resend once
    const fresh = await getPosts();
    const updated = (fresh.posts || []).find((p) => p.id === post.id);
    if (updated && updated.content && !updated.decryptionFailed) {
      return reportPost(updated, reason, true);
    }
  }

  if (!response.ok) {
    const err = new Error(data.error || 'Failed to submit report');
    err.code = data.code;
    throw err;
  }
  return data;
}
```

### 2.5 Export

```diff
 export const undergroundService = {
   getPosts,
   createPost,
   editPost,
   toggleReaction,
   deletePost,
   setNickname,
+  reportPost,
+  rekey,
 };
```

(`roomInit`/`getPendingKeys`/`distributeKeys` ficam internos — só a orquestração os usa.)

---

## 3. Mapa requisito → implementação

| Requisito do OK | Onde |
|---|---|
| Fingerprint SHA-256 hex minúsculo no formato do backend | `computeRoomKeyFingerprint` (§1) |
| Expor wrap para o distribuidor | `wrapUndergroundRoomKeyFor` (§1) + `runDistributorSweep` (§2.2) |
| Orquestração: GET → init-se-vazia → winner:false descarta e adota fingerprint vencedor → validar cópia ANTES do uso → mismatch = rekey automático → varredura se chaveado → estados | `ensureRoomReady` (§2.2), `roomStatus` no retorno de `getPosts` |
| Descarte da chave do perdedor | `discardRoomKeyCandidate` (`fill(0)`) — com a exceção documentada do vencedor-órfão (fingerprint igual prova posse da chave) |
| Validação antes de qualquer uso | `setUndergroundRoomKey(encryptedKey, expectedFingerprint)` — adoção só pós-match (§1, decisão 2) |
| `ensureUserKeys()` cobre era de teste | primeira linha de `ensureRoomReady` |

## 4. Após o OK

Aplicar → build do site → `git status --short`. Sem commit. Na sequência: DIFF 4 (UI + i18n com as chaves reais do modal de report).
