# Pacote Pré-Privacy — Deploy Executado + Verificações + Checklist do Item 5

**Data:** 2026-08-29 (deploys ~00:33-00:37 UTC de 30/08)
**Status:** commit, push e os DOIS deploys executados com sucesso. Verificações automatizáveis: todas passaram (detalhe abaixo). Smoke do item 5: checklist do Bob na última seção.

---

## 1. Commit final

- **Hash:** `5b1c4b2082fc2ebd80103cc09639d54b212c576d` — autor Bob Rach, sem atribuição de IA.
- 43 arquivos (+3707/−158), staged conferido 1:1 com a lista da proposta A (33 M + 10 A); os 4 untracked de sempre ficaram fora.
- Push: `392fa28..5b1c4b2  redesign/v2 -> redesign/v2`.

## 2. Deploy Passo 1 — Worker

- `npx wrangler deploy --env production` → **Uploaded philosify-api-production (12.23s) · Deployed triggers (3.99s)**.
- **Versão:** `3cb57822-80b0-45a0-8044-6e2dae191065`.
- **Binding `SENTRY_DSN` resolvido** do Secrets Store (listado na saída junto dos demais 26) — passo 0 do Bob confirmado na prática.
- 5 crons registrados (`*/5` + diários).

## 3. Deploy Passo 2 — Site

- Build `✓ 24.13s` → `npx wrangler pages deploy dist --project-name=philosify-frontend --branch=production` → **Deployment complete**, id **`0181f873`** (branch production → philosify.org).

## 4. Verificações automatizáveis (seção C) — resultados

| Item | Verificação | Resultado |
|---|---|---|
| **3 (site)** | CSP servido pelo deployment: host novo presente / antigo ausente | ✅ `https://o4510574559035392.ingest.us.sentry.io` presente; `o22381` **0** ocorrências |
| **3 (site)** | philosify.org em Chrome real: console no load | ✅ **Zero violações de CSP, zero erros JS** |
| **3 (worker)** | Tail (2 janelas, ~8 min) sem `[Sentry] No DSN configured` | ✅ 0 ocorrências. **Evento de teste disparado às 00:45:53 UTC** (GET `/api/../etc/passwd` → 404 bland = branch de segurança ativado; envio ao Sentry roda em waitUntil) — **confirmar no dashboard do projeto `philosify-api`: evento warning "Security: blocked suspicious request"** |
| **4** | Tail durante GET /api/profile | ✅ `[Profile] GET request received` capturado; **0** linhas `Cookie` — log do fragmento eliminado em produção |
| **2** | Cron `*/5` no tail | ✅ Tick capturado sem erros — e com efeito real: **`[Ads] IP anonymization: 343 impressions older than 48h`** (o reaper limpou 343 IPs herdados no primeiro tick; sintaxe PostgREST validada em produção) |
| **1 (parcial)** | `DELETE /api/unsafe-zone/session/<uuid aleatório>` sem auth | ✅ **401 do handler** (não o 404 genérico do roteador) → rota nova viva e com gate de auth. A prova do **404 autenticado** exige sessão — está no seu checklist abaixo |
| — | `/api/health` | ✅ 200 `{"status":"ok"}` |

Observação de método: o curl direto a philosify.org continua barrado pelo challenge da Cloudflare (esperado); o CSP foi conferido no header do deployment (`0181f873.philosify-frontend.pages.dev`, mesmo artefato) e o console no Chrome real via extensão.

SQL de acompanhamento do item 2 (rodar quando quiser): `select count(*) from ads.ad_impressions where ip_address is not null and created_at < now() - interval '48 hours';` → tende a **0** após alguns ciclos (batch 500/5min; 343 já foram no primeiro).

---

## 5. CHECKLIST DO BOB — Smoke do Item 5 (Underground E2E, duas contas)

**Pré-requisito:** duas contas com ≥3 créditos cada (A = fundadora, B = segunda membra), em navegadores/perfis separados. DevTools aberto no console para ver os logs `[Underground]`/`[E2E]`. Onde houver SQL, rodar no SQL Editor do projeto de **produção** (confirmar o ref antes de confiar no resultado — lição do release_reservation).

### Passo 1 — Conta A funda a sala
- [ ] Entrar no Underground → clicar **Unlock** (cobra 3 créditos; o keypair X25519 é gerado no navegador automaticamente antes do unlock).
- [ ] Definir o **nickname**.
- [ ] No console, deve aparecer `[Underground] Room founded by this client`.
- [ ] **Publicar um post** → o post aparece **decifrado** no feed.
- [ ] SQL: `select count(*) from underground_room;` → esperado **1** (a sala nasceu no primeiro room-init).

### Passo 2 — Conta B fica pendente
- [ ] Entrar no Underground → **Unlock** → definir nickname.
- [ ] Deve ver o **banner honesto de pendência**: "Sala cifrada de ponta a ponta. Sua chave de acesso será entregue pelo navegador de outro membro — volte em breve."
- [ ] O **composer está bloqueado** (textarea + botão desabilitados). Os posts de A aparecem como `[encrypted]` (B ainda não tem a chave).
- [ ] **Se a conta B for uma da era de teste com cópia órfã** (`r_rachewsky@hotmail.com`): o console mostrará `[E2E] … MISMATCH — discarding copy` antes da pendência — **esperado** (ver Passo 6).

### Passo 3 — Entrega da chave (distribuidor)
- [ ] Conta A **recarrega a página** (o load de um membro chaveado dispara a varredura `pending-keys` → `distribute-keys`). Console de A: `[Underground] Distributed room key to N member(s)`.
- [ ] Conta B **recarrega** → os posts ficam **legíveis** e o **composer libera** (`roomStatus='ready'`).
- [ ] **B publica um post** → **A vê o post de B em tempo real, decifrado** (broadcast + decifra no hook).

### Passo 4 — Report com plaintext voluntário (§2.8)
- [ ] Em B, sobre um post **de A** (o botão de denúncia só aparece em post alheio e já decifrado), clicar em **Denunciar** (ícone bandeira).
- [ ] O modal mostra o **aviso destacado**: "Ao denunciar, uma cópia legível deste post será enviada à moderação."
- [ ] Escrever um motivo (≤500) → **Enviar denúncia** → estado de **sucesso**, com botão **Fechar**.
- [ ] SQL: `select reporter_id is not null as tem_autor, reason, length(plaintext) as tam from underground_reports;` → **1 linha coerente** (autor presente, motivo e plaintext gravados).

### Passo 5 — Provas do "servidor cego"
- [ ] SQL: `select count(*) from underground_posts where content is not null;` → esperado **0** (nenhum plaintext no banco).
- [ ] SQL: `select count(*) from space_access where space='underground' and encrypted_room_key is null;` → tende a **0** conforme os pendentes recebem a chave.

### Passo 6 — Membro da era de teste
As 3 contas antigas (pré-E2E): `claueppinger@gmail.com` e `rrachewsky@gmail.com` são **pendentes normais**; `r_rachewsky@hotmail.com` carrega uma `encrypted_room_key` **órfã** (cópia da era do E2E opcional, sala nunca nasceu) — tratada, não é falha.
- [ ] Logar com `claueppinger@gmail.com` ou `rrachewsky@gmail.com` → entrar no Underground → deve aparecer como **pendente** (o `ensureUserKeys` registra a chave pública no load), **sem** log de MISMATCH.
- [ ] Logar com `r_rachewsky@hotmail.com` (cópia órfã) → **esperado no console:** `[E2E] Underground room key fingerprint MISMATCH — discarding copy` seguido de rekey/pendência — **comportamento correto** (o DIFF 3 descarta a cópia órfã e entra na fila). Se essa conta carregar **antes** da fundadora, o esperado muda: ela **funda a sala** (`Room founded by this client`), sobrescrevendo a órfã.
- [ ] Após um membro já chaveado (A) visitar a página, recarregar a conta antiga → recebe a chave → **lê e publica** normalmente.

### Passo 7 — Fecha o Item 1 (404 autenticado)
- [ ] Logado, executar `DELETE /api/unsafe-zone/session/<uuid-inexistente>` (via app ou curl com o cookie de sessão) → esperado **404** (a rota nova valida propriedade; sem sessão dá 401, já verificado).

### Passo 8 — BÔNUS (Bob): release_reservation no cenário exato do bug de 27/08
Validação em produção de que crédito não fica **preso** quando o unlock falha por saldo — o bug original que prendia refunds por até ~15 min.
- [ ] Usar uma conta com **exatamente 2 créditos** (saldo < custo do Underground, que é 3).
- [ ] Anotar o saldo antes: **2**.
- [ ] Tentar **Unlock** do Underground → esperado: **erro de saldo insuficiente** (402 / "Not enough credits").
- [ ] Conferir o saldo **imediatamente** (recarregar o balance, sem esperar o cron): esperado **permanecer 2** — nenhum crédito reservado ficou pendurado (a reserva parcial foi **liberada na hora** pela `release_reservation` reconstruída).
- [ ] (Opcional, confirmação no banco) SQL: `select status, reason, release_reason from credit_reservations where user_id='<uuid da conta>' order by created_at desc limit 3;` → a tentativa recente deve aparecer **`released`** (não `reserved` presa), com o motivo preenchido.
- [ ] Esperado consolidado: **saldo 2 → 2**, zero créditos presos, refund imediato — o cenário exato do diagnóstico de 27/08 agora fechado em produção.

---

## Rollback (se algum passo falhar)
- **Worker:** `cd api && npm run rollback` (wrangler volta à versão anterior).
- **Site:** redeploy do `dist` anterior no Pages (ou promover o deployment anterior no dashboard).
- **Migração do item 5:** **não** precisa de rollback — `underground_room`/`underground_reports` novas e as colunas de `space_access` são inertes sem o código novo; ficam dormentes se o worker voltar.

## Pendências que seguem com o Bob
1. Dashboard do Sentry: confirmar que `philosify-web` recebe sessions/replays e que `philosify-api` registrou o evento "Security: blocked suspicious request".
2. Cadeia da Privacy v2: i18n nos 18 idiomas com PT validado + split do `v2.legal.updated` (ToS/Privacy) + linha §7 (IP/UA no Sentry) + contrato do report §2.8 → publicação.
