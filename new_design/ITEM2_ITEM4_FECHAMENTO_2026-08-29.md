# Pacote Pré-Privacy — Fechamento dos ITENS 2 e 4 (aplicados)

**Data:** 2026-08-29
**Status:** ITEM 2 (reaper de IP) e ITEM 4 (log de cookie) **aplicados**. Verificações executadas. **Nenhum commit** (regra do pacote).

---

## ITEM 2 — Anonimização de IP em ads.ad_impressions após 48h

### Verificação condicionada pelo Bob (passou)

**1a. `ip_address=not.is.null`** — sintaxe idêntica já em produção no código:
- `api/src/handlers/contacts.js:97` (`phone_number=not.is.null`) e `api/src/push/sender.js:87` (`delivered_at=not.is.null&delivered_at=lt.<ISO>` — inclusive com `lt.` + timestamp ISO, o mesmo par do reaper).
- O client custom anexa o `filter` **verbatim** à query string: `select` → `?select=<cols>&<filter>&limit=<n>` (`api/src/utils/supabase.js:97-101`). URL final do SELECT do reaper:
  `{SUPABASE_URL}/rest/v1/ad_impressions?select=id&created_at=lt.<ISO>&ip_address=not.is.null&limit=500` (com `Accept-Profile: ads`, `supabase.js:33-36`).

**1b. `id=in.(uuid1,uuid2)`** — uso existente **inclusive em PATCH**: `api/src/handlers/admin/lyrics-audit.js:180` (`PATCH /analyses?id=in.(${list})`); e via filter-option do client em `ads/targeting.js:114` (`country_code=in.(...)`). O `update(data, filter)` monta `PATCH {base}?{filter}` verbatim (`supabase.js:134-135`).

**Nenhuma divergência de sintaxe → diff aplicado como proposto**, com o acréscimo do ponto 2.

**2. Caso "0 anonimizadas":** o client envia `Prefer: return=representation` por padrão (`supabase.js:29-31`), mas `update()` **colapsa o retorno para a primeira linha** (`supabase.js:148-150`) — contagem exata de afetadas **não é exposta**. É detectável, porém, o caso zero: `data == null` sem `error` ⇒ UPDATE não casou nenhuma linha. Implementado exatamente esse log (`console.warn` com o nº de candidatas do SELECT). No caminho de sucesso, `anonymized: ids.length` segue sendo o nº de candidatas (comentário no código explica a limitação).

### Aplicado

- `api/src/handlers/ads/serve.js` — `anonymizeOldImpressionIps(env, batchSize = 500)` ao final do arquivo: SELECT ids (created_at < now−48h, ip não nulo, LIMIT 500) → UPDATE `ip_address=null` por `id=in.(...)`; log de sucesso, log warn do caso 0-afetadas, erros capturados.
- `api/index.js` — bloco no `scheduled()`, logo após `cleanupStaleReservations` (cron `*/5`), com `ctx.waitUntil` + import dinâmico + try/catch (mesmo padrão do bloco Constellation).

Sem mudança de banco, sem front, sem i18n.

---

## ITEM 4 — Remoção do log de fragmento de cookie

- `api/src/handlers/profile.js` — removido o `console.log("[Profile] Cookie header:", request.headers.get("Cookie")?.substring(0, 50) + "...")` (ex-linhas 24-27). O log neutro `"[Profile] GET request received"` e os demais (auth fail / userId) ficaram como estavam.

---

## Verificações do api

O `api/package.json` não tem script de build/lint (worker é empacotado no deploy). Usadas as duas verificações disponíveis:

1. **`npx wrangler deploy --dry-run --outdir <scratchpad>`** — bundle completo do worker **OK** ("--dry-run: exiting now", sem erros de parse/import; inclui os arquivos alterados).
2. **`npm test` (vitest)** — 137 passaram, **2 falharam em `src/utils/i18n-errors.test.js`** ("no duplicate English values" e "not be empty or just whitespace"). **Falha PRÉ-EXISTENTE, comprovada por contraprova:** com `git stash` (árvore limpa, sem nenhuma mudança do pacote) os **mesmos 2 testes falham identicamente**; stash restaurado em seguida. O arquivo testado (`i18n-errors.js`) não foi tocado por nenhum item do pacote. Fica registrado como pendência fora do escopo.

---

## git status --short (final)

```
 M api/index.js
 M api/src/handlers/ads/serve.js
 M api/src/handlers/profile.js
 M api/src/handlers/unsafe-zone.js
 M site/src/i18n/translations/{ar,de,en,es,fa,fr,he,hi,hu,it,ja,ko,nl,pl,pt,ru,tr,zh}.json
 M site/src/pages/v2/UnsafeZonePage.jsx
 M site/src/styles/v2-pages/unsafe-zone.css
?? docs/LAUNCH_READINESS_REPORT.md
?? docs/MARKET_LAUNCH_PLAN.md
?? new_design/ITEM1_REVISAO_ESTADO_CREDITOS_2026-08-29.md
?? new_design/ITEM2_IP_REAPER_PROPOSTA_2026-08-29.md
?? new_design/philosify-modules-review.html
?? "new_design/printscreen 01/"
```

(Modificados = itens 1, 2 e 4 do pacote; untracked = pré-existentes + relatórios do pacote. Nenhum commit.)

---

## Estado do pacote

| Item | Status |
|---|---|
| 1 — Exclusão de sessões Zona Insegura | **Aplicado** (PT validado; 18 línguas; build site OK) |
| 2 — IP de impressões: anonimizar 48h | **Aplicado** (verificação de sintaxe provada; dry-run OK) |
| 3 — Sentry | Não iniciado |
| 4 — Log de fragmento de cookie | **Aplicado** |
| 5 — Underground E2E | Não iniciado (passo prévio: contagem de posts + decisão do Bob) |

Pendência registrada fora do escopo: 2 testes pré-existentes falhando em `api/src/utils/i18n-errors.test.js`.
