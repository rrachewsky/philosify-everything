# Pacote Pré-Privacy — ITEM 5: Underground E2E obrigatório (DESENHO)

**Data:** 2026-08-29
**Status:** desenho **APROVADO pelo Bob** (29/08), com adição ordenada: **report-com-plaintext-voluntário** (§2.8). Diffs seguem um por vez, começando pela migração.
**Base:** passo prévio executado pelo Bob no SQL Editor de produção: `underground_posts` = **0 posts, 0 autores**. Sem apagão, sem legado de conteúdo — a sala nasce cifrada do zero.

---

## 0. O princípio que define o desenho

Requisito: membro desbloqueado lê TUDO; servidor/operador não lê NADA. Consequência inevitável: **a chave da sala existe apenas em navegadores de membros**. O servidor guarda só cópias cifradas por membro (`space_access.encrypted_room_key`) — logo, **entregar a chave a um membro novo exige que o navegador de um membro já-chaveado a cifre para ele**. Não há como o servidor fazer essa entrega sem ver a chave. Todo o fluxo abaixo decorre disso.

**Honestidade do modelo (para a Privacy v2):** a proteção é contra leitura do banco/servidor/operador *enquanto tal*. Um operador que desbloqueasse a sala com uma conta própria leria como qualquer membro — isso é inerente a qualquer sala E2E com admissão paga, não um defeito do desenho.

---

## 1. Peças

| Peça | Onde | Conteúdo |
|---|---|---|
| Keypair do usuário | IndexedDB do navegador (existente — `site/src/crypto/keys.js`) + pública em `user_public_keys` (existente) | X25519, padrão dos DMs |
| Chave da sala | Só em navegadores de membros (módulo `undergroundRoomKey`, existente em `services/crypto.js:489`) | simétrica (secretbox), gerada uma única vez |
| Cópia por membro | `space_access.encrypted_room_key` (coluna já lida pelo código; a migração garante com `ADD COLUMN IF NOT EXISTS`) | chave da sala cifrada para a pública do membro (`encryptGroupKeyForMember`, existente) |
| **Meta da sala (novo)** | tabela `underground_room` — 1 linha (PK fixa `id=1`): `key_fingerprint` (SHA-256 da chave crua), `created_by`, `created_at` | árbitro da corrida + detector de chave errada. O fingerprint de 32 bytes aleatórios não vaza nada útil |
| Posts | `underground_posts` — **só** `encrypted_content`+`nonce`; `content` passa a ser sempre NULL | coluna mantida (dropá-la exigiria mexer em todos os selects, ganho zero: nunca mais recebe dado) |

## 2. Fluxos

### 2.1 Unlock (novo contrato: EXIGE keypair)
1. Front: antes de chamar o unlock, roda `ensureUserKeys()` (existente — gera keypair na hora e registra a pública; padrão dos DMs).
2. `POST /api/spaces/underground/unlock` (spaces.js): além do fluxo atual (3 créditos, insert em `space_access`), **verifica que existe linha em `user_public_keys`** para o usuário → sem ela, `409 KEYPAIR_REQUIRED` (o front trata gerando e repetindo). Nenhum outro espaço é afetado (condição escopada a `space === 'underground'`).
3. A linha nasce com `encrypted_room_key = NULL` → o membro entra no **pool de pendentes**.

### 2.2 Nascimento da sala (primeiro membro chaveado a chegar)
No load do Underground, o client de um access-holder com keypair vê `roomInitialized: false` (meta ausente) →
1. Gera a chave da sala (`generateGroupKey`), calcula `fingerprint = SHA-256(chave)`.
2. Cifra a chave para a própria pública.
3. `POST /api/underground/room-init { fingerprint, encryptedKey }` → servidor tenta `INSERT` na meta (`id=1`, `ON CONFLICT DO NOTHING`):
   - **Venceu** → grava `encrypted_room_key` do requisitante e responde `{ winner: true }`.
   - **Perdeu** (meta já existia) → NÃO grava nada; responde `{ winner: false, fingerprint }` → o client **descarta a chave que gerou** e cai no estado pendente.

**Corrida de dois primeiros unlocks simultâneos: resolvida aqui** — o conflito de PK na meta é o árbitro atômico; só um `room-init` vence; o perdedor nunca escreve sua chave em lugar nenhum.

Nota: o gatilho é "primeiro **access-holder chaveado** a carregar a página" — cobre tanto quem acabou de desbloquear quanto um membro da era de teste (ver 2.5).

### 2.3 Entrega a membro novo (o "distribuidor")
**Quem cifra para ele: qualquer membro já-chaveado, automaticamente, no load da página.**
1. Client chaveado (após decifrar sua cópia e **validar contra o fingerprint da meta**) chama `GET /api/underground/pending-keys` → lista `{userId, publicKey}` dos access-holders com `encrypted_room_key IS NULL` (join com `user_public_keys`; limite 50).
2. Para cada um: `encryptGroupKeyForMember(roomKey, publicKey)` → `POST /api/underground/distribute-keys { keys: [...] }`.
3. Servidor grava **apenas onde `encrypted_room_key IS NULL`** (nunca sobrescreve — sobrescrita seria vetor de DoS), registrando `key_distributed_by` para auditoria.
4. O pendente recebe a cópia no próximo load; decifra; **valida contra o fingerprint**; se bater, sala aberta.

**Latência inerente:** o N-ésimo membro só recebe a chave quando algum membro chaveado visitar a página. A UI diz isso com todas as letras (estado "pendente": "Sala cifrada de ponta a ponta — sua chave será entregue pelo navegador de outro membro. Volte em breve."). É o preço do servidor cego; não há atalho que não viole o requisito.

### 2.4 Membro sem `user_public_keys` no momento do unlock
**Não existe por construção**: o unlock exige a pública registrada (2.1). O pool de pendentes só contém gente com pública válida. Único resquício: linha de teste antiga sem pública → tratada em 2.5.

### 2.5 Membros da era de teste (mecanismo mais simples possível: nenhum)
Eles já têm linha em `space_access` com `encrypted_room_key = NULL` — **são indistinguíveis de pendentes novos**. No próximo acesso: `ensureUserKeys()` roda no load (registra pública se faltar) → entram no pool → recebem a chave pelo fluxo 2.3 (ou iniciam a sala pelo 2.2 se forem os primeiros). Zero migração de dados, zero re-unlock, zero custo, zero código de caso especial.

### 2.6 Perda do keypair local (IndexedDB limpo / navegador novo)
O membro não consegue decifrar sua cópia (cifrada para a pública ANTIGA). **Não perde o acesso — perde só a cópia da chave; recuperação automática e sem custo:**
1. Load detecta falha de decifra (ou fingerprint divergente) → `ensureUserKeys()` (gera novo par; `key_version++` no servidor — rotação já suportada em `handlers/crypto.js:90-99`) → `POST /api/underground/rekey` → servidor NULLa a **própria** `encrypted_room_key`.
2. Volta ao pool de pendentes → recebe a chave re-cifrada para a NOVA pública via 2.3. Histórico inteiro legível de novo (a chave da sala nunca mudou).
- **Limitação herdada da plataforma (igual aos DMs hoje):** keypair é por navegador; um segundo dispositivo rotaciona a pública e invalida wraps futuros do primeiro. Fora do escopo deste item.
- **Perda total** (todos os membros limpam tudo): sala morta — posts para sempre ilegíveis. É o contrato E2E; aceitar e declarar.

### 2.7 Post e leitura (sem fallback, sem legado)
- `POST /api/underground/posts`: **exige** `encrypted_content`+`nonce`; requisição com plaintext → `400 E2E_REQUIRED`. Branch de plaintext removido (`underground.js:272-290,320`), idem no edit (`underground.js:676-745`). `content` gravado NULL.
- Front: `encryptUndergroundPost` retornando null deixa de "enviar sem criptografia" — vira erro de UI ("chave da sala ausente") com o estado pendente.
- GET continua devolvendo nickname/reações/threads (metadados) + ciphertext.

### 2.8 Report com plaintext voluntário (decisão do Bob, 29/08)

Hoje **não existe** sistema de report de posts em nenhum módulo (verificado; só delete do próprio autor — `underground.js:538`). Nasce novo, com este contrato:

1. **Denúncia:** o client do denunciante decifra o post localmente e envia `POST /api/underground/report` com `{ post_id, reason, plaintext, ciphertext_ref, nonce_ref }` — a cópia legível sai **do navegador de quem denuncia**, nunca do servidor.
2. **Prova de consistência (anti-abuso):** o servidor busca o post e **confere que `ciphertext_ref`/`nonce_ref` batem com o `encrypted_content`/`nonce` armazenados do `post_id`**. Divergiu (ex.: post editado entre a leitura e o report) → `409 REPORT_STALE`; o client rebusca, redecifra e reenvia uma vez. O plaintext em si é **atestado pelo denunciante** — `reporter_id` fica gravado; denúncia falsa é rastreável e punível.
3. **Armazenamento:** tabela `underground_reports` (post_id **sem** FK CASCADE — a evidência sobrevive ao apagão do post; reporter_id, reported_user_id, reason, plaintext, refs, created_at), **RLS sem policies = service_role/admin apenas**.
4. **Moderação às cegas continua sem report:** apagar post por id e revogar acesso do autor (`space_access`) via service_role — nenhum endpoint novo necessário para isso.
5. **UI:** o modal de denúncia avisa com todas as letras — "Ao denunciar, uma cópia legível deste post será enviada à moderação." (chave i18n própria, 18 línguas).
6. **Privacy v2:** declarará exatamente esse contrato (nota para a tarefa da política; fora do escopo dos diffs).

## 3. Endpoints novos / alterados

| Rota | Novo? | Papel |
|---|---|---|
| `POST /api/spaces/underground/unlock` | alterado | + exigência de `user_public_keys` (409) |
| `GET /api/underground/posts` (existente) | alterado | resposta ganha `roomInitialized` + `roomFingerprint` (junto do `encryptedRoomKey` que já devolve — `underground.js:176`) |
| `POST /api/underground/room-init` | novo | nascimento da sala; árbitro da corrida |
| `GET /api/underground/pending-keys` | novo | pendentes + públicas (só para membro chaveado) |
| `POST /api/underground/distribute-keys` | novo | grava cópias onde NULL; audita distribuidor |
| `POST /api/underground/rekey` | novo | NULLa a própria cópia (recuperação) |
| `POST /api/underground/report` | novo | report com plaintext voluntário + prova de consistência (§2.8) |
| `POST /api/underground/posts` / edit | alterado | só cifrado; plaintext rejeitado |

## 4. Arquivos afetados

- **`migrations/underground_room_e2e.sql` (novo):** tabela `underground_room` (PK fixa, fingerprint, created_by, created_at; service_role) + tabela `underground_reports` (§2.8; service_role) + `ALTER TABLE space_access ADD COLUMN IF NOT EXISTS encrypted_room_key TEXT` (auto-cura) + `ADD COLUMN IF NOT EXISTS key_distributed_by UUID`.
- **`api/src/handlers/spaces.js`:** exigência de keypair no unlock do underground.
- **`api/src/handlers/underground.js`:** remoção do fallback plaintext (create+edit); 5 handlers novos (room-init, pending-keys, distribute-keys, rekey, report); GET com meta da sala.
- **`api/index.js`:** 5 rotas novas.
- **`site/src/services/crypto.js`:** helper de fingerprint (crypto.subtle SHA-256); expor wrap da chave da sala para o fluxo distribuidor (a chave crua já fica retida em `undergroundRoomKey`).
- **`site/src/services/api/underground.js`:** chamadas novas + orquestração no load (init-se-vazia → validar fingerprint → varrer pendentes → estados pendente/erro/rekey).
- **`site/src/hooks/useUnderground.js` + página v2 do Underground:** estados de UI (pendente, chave inválida, sala não iniciada), erro no envio sem chave; ~5 chaves i18n novas × 18 línguas.

## 5. Riscos e decisões embutidas

1. **Moderação (tradeoff mitigado pela decisão do Bob):** o servidor perde o filtro automático de URL/spam do plaintext (`underground.js:282`) — isso permanece. Mas o conteúdo denunciado passa a ser inspecionável via **report-com-plaintext-voluntário** (§2.8): a cópia legível chega pela mão do denunciante, com prova de consistência do ciphertext e autoria do report rastreável. Moderação às cegas (apagar por id, revogar acesso) disponível sem report.
2. **Chave errada distribuída (DoS por membro malicioso):** mitigado pelo fingerprint (vítima detecta, faz rekey automático) + `key_distributed_by` para auditoria. Não é confidencialidade em risco — só disponibilidade.
3. **Latência de entrega ao novo membro:** inerente (2.3); UI honesta.
4. **Perda total das cópias:** sala ilegível para sempre; contrato E2E declarado.
5. **Rotação multi-dispositivo:** limitação herdada dos DMs; fora do escopo.

## 6. Alternativas descartadas

| Alternativa | Por quê caiu |
|---|---|
| Wrap por post para cada membro | membro novo não lê o histórico — viola "lê TODOS os posts" |
| Rotacionar a chave a cada unlock | quem entra não decifra posts antigos sem re-cifrá-los (e re-cifrar exige a chave antiga) |
| Chave assimétrica da sala (posts selados para a pública da sala) | a privada da sala tem exatamente o mesmo problema de distribuição — complexidade sem ganho |
| Servidor guarda a chave e cifra em repouso | viola o requisito central (operador leria) |
| Entrega síncrona no unlock (bloquear até um membro cifrar) | exigiria membro online no instante do unlock; pior UX que o estado pendente |
| Dropar a coluna `content` | mexeria em todos os selects por ganho zero — ela fica NULL para sempre |

---

**Aguardando OK do Bob.** Após o OK, os diffs seguem um por vez, na ordem: (1) migração SQL, (2) backend (spaces.js + underground.js + rotas), (3) crypto/serviços front, (4) UI + i18n.
