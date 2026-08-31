# MODO A — 3 ajustes pré-deploy (worker)

**Data:** 2026-08-31 · Aplicados; **dry-run verde**. Aguardando OK de deploy. Sem commit.

---

## Ajuste 1 (OBRIGATÓRIO) — `getRoomKey` write-confirmed · `api/src/utils/roomKey.js`

Nunca confia no retorno de insert/update (o client custom engole erro HTTP em alguns caminhos); relê `underground_room` e confia **só no persistido**. Cobre "linha existe com chave NULL" via `UPDATE ... WHERE encrypted_room_key IS NULL` (reivindicação atômica), sem lançar.

```js
export async function getRoomKey(env) {
  const service = await getServiceSupabase(env);

  const readRoom = async () => {
    const { data } = await service
      .from("underground_room")
      .select("encrypted_room_key", { limit: 1 });
    const row = Array.isArray(data) ? data[0] : data;
    return row || null;
  };

  // Fast path: a sala já tem chave.
  const existing = await readRoom();
  if (existing && existing.encrypted_room_key) {
    return kekUnwrap(env, existing.encrypted_room_key);
  }

  const roomKey = crypto.getRandomValues(new Uint8Array(ROOM_KEY_BYTES));
  const wrapped = await kekWrap(env, roomKey);

  if (!existing) {
    // Sem linha → INSERT de PK fixa é o árbitro de corrida (409 = alguém venceu).
    await service
      .from("underground_room")
      .insert({ id: 1, encrypted_room_key: wrapped });
  } else {
    // Linha com chave NULL → reivindica atomicamente, só onde ainda IS NULL.
    await service
      .from("underground_room")
      .update(
        { encrypted_room_key: wrapped },
        "id=eq.1&encrypted_room_key=is.null",
      );
  }

  // Confirma o que REALMENTE persistiu e confia só nisso. A chave é imutável
  // após gravada (INSERT conflita; UPDATE guardado por IS NULL), então a
  // releitura é autoritativa. Devolve a chave local SÓ se a MINHA escrita
  // venceu; senão, kekUnwrap da que venceu.
  const confirmed = await readRoom();
  if (!confirmed || !confirmed.encrypted_room_key) {
    throw new Error("room bootstrap did not persist a key");
  }
  if (confirmed.encrypted_room_key === wrapped) {
    return roomKey;
  }
  return kekUnwrap(env, confirmed.encrypted_room_key);
}
```

**Por que a comparação `=== wrapped` identifica a minha escrita:** cada `kekWrap` usa um IV aleatório, então o `wrapped` é único por chamada — se o persistido é exatamente o meu, foi a minha escrita que landou; qualquer outro valor = escrita de outro processo, e eu adoto (unwrap) a dele.

---

## Ajuste 3 — comparação do `x-admin-secret` em tempo constante · `api/src/handlers/underground.js`

```js
// Constant-time via digests SHA-256 — não vaza o segredo por timing de
// comparação com saída antecipada.
async function constantTimeEqual(a, b) {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(String(a))),
    crypto.subtle.digest("SHA-256", enc.encode(String(b))),
  ]);
  const va = new Uint8Array(da);
  const vb = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

// no handler admin decrypt:
const provided = request.headers.get("x-admin-secret") || "";
const adminSecret = await getSecret(env.ADMIN_SECRET);
if (!adminSecret || !(await constantTimeEqual(provided, adminSecret))) {
  return bland();
}
```

---

## Ajuste 2 — formato do KEK: **sem mudança, confirmado alinhado**

O valor foi gerado com `openssl rand -base64 32` = **base64 padrão** de 32 bytes (`…H4=`, 44 chars com padding). O `importKek` decodifica com `atob` (base64 padrão) e valida `keyBytes.length === 32`. Casa exatamente. Nenhuma alteração.

---

## Estado

- Dry-run do worker: **verde**.
- Próximo: seu **OK de deploy** → deploy worker → deploy site → verificações automatizáveis (GET autenticado com `roomKey` não-nulo; SQL `underground_room` = 1 linha com chave) → smoke reduzido. **Sem commit.**
