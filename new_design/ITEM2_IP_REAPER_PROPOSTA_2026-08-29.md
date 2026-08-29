# Pacote Pré-Privacy — ITEM 2: Anonimização de IP em ads.ad_impressions (proposta)

**Data:** 2026-08-29
**Status:** passo prévio (grep de leitores) concluído; **DIFF proposto, aguardando OK do Bob. Nada aplicado.**
**Inclui no fim:** fechamento do ajuste de PT-BR do ITEM 1 (aplicado nesta mesma janela).

---

## 1. Passo prévio — grep de todos os leitores de `ip_address`

Varredura no repositório inteiro (`ip_address` e a grafia camelCase `ipAddress` — esta com **zero** ocorrências no `api/`).

### Leitores de `ads.ad_impressions.ip_address` no código: exatamente os dois já citados. Nenhum outro.

| Onde | O que faz | Afetado pela anonimização 48h? |
|---|---|---|
| `api/src/handlers/ads/serve.js:307` | Frequency cap: filtra `ip_address=eq.<ip>` **e `created_at=gte.<hoje>`** | **Não** — só lê impressões do dia corrente, sempre com <48h |
| `api/src/handlers/ads/serve.js:809,819` | Antifraude de clique: relê a impressão do clique e compara IP | **Não** — o clique ocorre minutos/horas após a impressão; e o código já tolera null: `if (impression.ip_address && ...)` (serve.js:819) — com IP anonimizado a checagem é pulada graciosamente, sem erro |
| `api/src/handlers/ads/serve.js:667` | **Escritor** (INSERT da impressão) | Não é leitor |

### Achados laterais (não bloqueiam o item; registro para decisão futura)

- **Outras tabelas com coluna homônima**, fora do alcance do reaper: `ads.advertiser_sessions.ip_address` (`api/migrations/004_ads_platform.sql:162`) e `ads.agency_sessions.ip_address` (`api/migrations/005_ads_agencies.sql:60`) — sessões de login do app de anunciantes.
- Índice parcial `idx_impressions_ip_address … WHERE ip_address IS NOT NULL` (`api/migrations/008_ads_supabase_auth.sql:77-79`): encolhe naturalmente conforme as linhas são anonimizadas.
- Demais ocorrências do grep: DDL/comentários em migrações e o próprio levantamento (`new_design/PRIVACY_V2_LEVANTAMENTO_2026-08-29.md`).

**Conclusão do passo prévio: nenhum leitor além dos dois pontos citados → seguro propor o reaper.**

---

## 2. Desenho do reaper

- **Restrição prática:** o client Supabase custom do worker fala **PostgREST**, que não aceita `UPDATE … LIMIT` nem subquery, e o projeto não tem executor de SQL cru. O equivalente direto do SQL especificado ("LIMIT via subquery de ids"), sem migração/RPC nova, é **duas fases por ids**:
  1. `SELECT id LIMIT 500 WHERE created_at < now()-48h AND ip_address IS NOT NULL`
  2. `UPDATE SET ip_address = NULL WHERE id IN (…)`
- **Batch:** 500/execução no cron `*/5` já existente (2 subrequests por run; capacidade ~144k linhas/dia — ordens de magnitude acima do volume em pré-lançamento).
- **Idempotente e sem corrida:** `created_at` nunca muda; reprocessar um id já nulo é no-op.
- **Anonimização = `NULL`** (não hash) — irreversível, alinhada ao que a Privacy v2 vai declarar.
- **Alternativa descartada:** RPC SQL com UPDATE atômico — exigiria migração no banco; desnecessário para um reaper idempotente.
- Assinaturas conferidas no client custom: `.select(cols, {filter, limit})` e `.update(body, filter)` — mesmos usos de `serve.js:412-414` e do handler da Zona Insegura.

---

## 3. DIFF proposto (aguardando OK)

### 3.1 `api/src/handlers/ads/serve.js` — adição ao final do arquivo

```js
// ============================================================
// IP ANONYMIZATION REAPER (privacy)
// ip_address on ads.ad_impressions only serves same-day frequency
// capping (selectProportionalAd) and the click fraud check minutes/
// hours after the impression (handleAdClick). Past 48h it is retained
// personal data with no function — null it out in bounded batches.
// Called from scheduled() on the */5 cron.
// ============================================================
export async function anonymizeOldImpressionIps(env, batchSize = 500) {
  try {
    const supabase = await getServiceSupabase(env);
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: rows } = await supabase
      .from('ads.ad_impressions')
      .select('id', {
        filter: `created_at=lt.${cutoff}&ip_address=not.is.null`,
        limit: batchSize,
      });

    const ids = (rows || []).map((r) => r.id);
    if (ids.length === 0) return { anonymized: 0 };

    const { error } = await supabase
      .from('ads.ad_impressions')
      .update({ ip_address: null }, `id=in.(${ids.join(',')})`);
    if (error) {
      console.error('[Ads] IP anonymization failed:', error.message);
      return { anonymized: 0, error: error.message };
    }

    console.log(`[Ads] IP anonymization: ${ids.length} impressions older than 48h`);
    return { anonymized: ids.length };
  } catch (err) {
    console.error('[Ads] IP anonymization error:', err.message);
    return { anonymized: 0, error: err.message };
  }
}
```

### 3.2 `api/index.js` — `scheduled()`, logo após o bloco `cleanupStaleReservations` (`:4609-4616`)

```js
    // Privacy reaper: anonymize ad-impression IPs older than 48h (every 5 min).
    // Same-day frequency capping and the post-impression click check are the
    // only readers; past 48h the IP has no function. Bounded batches (500)
    // keep each run inside the cron's subrequest budget.
    ctx.waitUntil(
      (async () => {
        try {
          const { anonymizeOldImpressionIps } = await import("./src/handlers/ads/serve.js");
          await anonymizeOldImpressionIps(env, 500);
        } catch (err) {
          console.error("[Cron] Impression IP anonymization failed:", err.message);
        }
      })(),
    );
```

**Escopo:** sem mudança de banco, sem mudança de front, sem i18n. Deploy do worker fica para a ordem de deploy do pacote (não faz parte deste item).

---

## 4. Fechamento do ajuste de PT-BR do ITEM 1 (aplicado)

- Textos validados pelo Bob aplicados em `pt.json`:
  - `confirmDeleteOneActive`: "Esta sessão ainda está ativa — os turnos não usados serão perdidos, sem reembolso. Apagar mesmo assim? Isso não pode ser desfeito."
  - `confirmDeleteAllActive`: "Apagar TODAS as suas sessões? Os turnos não usados da sessão ativa serão perdidos, sem reembolso. Isso não pode ser desfeito."
- Mesma limpeza de redundância ("definitivamente" + "não pode ser desfeito") replicada nas variantes *Active* das **outras 17 línguas** (a pergunta perde o advérbio de finalidade; a frase final o carrega). Variantes simples (sessão encerrada) inalteradas.
- Método: script com validação byte-a-byte prévia (18/18 estáveis), diff de exatamente 2 linhas por arquivo.
- `defaultValue` EN sincronizados no `UnsafeZonePage.jsx` (2 literais).
- Build de verificação: **✓ built in 26.15s, exit 0**.
- Nenhum commit (regra do pacote).

---

## Estado do pacote

| Item | Status |
|---|---|
| 1 — Exclusão de sessões Zona Insegura | **Aplicado** (com ajuste PT validado + 17 línguas alinhadas); build OK; sem commit |
| 2 — IP de impressões: anonimizar 48h | Grep prévio limpo; **diff proposto, aguardando OK** |
| 3 — Sentry | Não iniciado |
| 4 — Log de fragmento de cookie | Não iniciado |
| 5 — Underground E2E | Não iniciado (passo prévio: contagem de posts + decisão do Bob) |
