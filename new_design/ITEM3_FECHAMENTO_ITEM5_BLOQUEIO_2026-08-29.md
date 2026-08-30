# Pacote Pré-Privacy — ITEM 3 aplicado · ITEM 5 bloqueado no passo prévio

**Data:** 2026-08-29
**Status:** ITEM 3 (Sentry) **aplicado e verificado** (decisão (a) registrada; host do CSP pendente dos DSNs). ITEM 5 **parado no passo prévio obrigatório**: sem credenciais locais para rodar a contagem — aguardando o Bob. **Nenhum commit.**

---

## ITEM 3 — aplicado (diffs A-D, como aprovados)

| Diff | Arquivo | O que mudou |
|---|---|---|
| A | `site/src/utils/sentry.js` | `setUser(userId)` — parâmetro e campo `email` removidos (sem chamadores a ajustar; Session Replay intacto: 10%/100%-erro/maskAllText) |
| B | `site/.env.example` | Documentada `VITE_SENTRY_DSN=` (vazia) na seção Analytics |
| C | `api/src/utils/sentry.js` | DSN resolvido via `getSecret(env.SENTRY_DSN)` em `captureException` e `captureMessage` — correção obrigatória para binding do Secrets Store (antes: `dsn.match` num objeto → falha silenciosa) |
| D | `api/wrangler.toml` | Binding `SENTRY_DSN` adicionado ao `[env.production.secrets_store_secrets]` (padrão dos demais 25) |

**Decisões registradas:**
- **Ponto 4 = (a)**: IP/UA mantidos no evento de segurança (`api/index.js:473-478`); a **seção 7 da Privacy v2 ganha a linha correspondente na tarefa de aplicação da política**.
- **Passo 6 (host do CSP)**: pendente — Bob responde com o host real ao criar os DSNs; se divergir de `o22381.ingest.us.sentry.io`, ajuste de 1 linha em `site/public/_headers:49`.
- Ativação (colar DSNs em `site/.env.production` + secret no Secrets Store) e deploys: do Bob, conforme passos 1-8 de `ITEM3_SENTRY_PROPOSTA_2026-08-29.md`.

**Verificações:**
- Worker: `npx wrangler deploy --dry-run` → bundle **OK** ("--dry-run: exiting now", sem erros).
- Site: `npm run build` → **exit 0**.

**git status --short** (após item 3; itens 1/2/4 já commitados em `392fa28`):
```
 M api/src/utils/sentry.js
 M api/wrangler.toml
 M site/.env.example
 M site/src/utils/sentry.js
?? docs/LAUNCH_READINESS_REPORT.md
?? docs/MARKET_LAUNCH_PLAN.md
?? new_design/ITEM3_SENTRY_PROPOSTA_2026-08-29.md
?? new_design/philosify-modules-review.html
?? "new_design/printscreen 01/"
```

---

## ITEM 5 — passo prévio BLOQUEADO: sem como rodar a contagem daqui

**O que foi tentado:** script Node somente-leitura (scratchpad) que leria `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` de `api/.dev.vars`, consultaria `underground_posts` via PostgREST (count exato via `Prefer: count=exact` + varredura paginada de `user_id,created_at` para distinct/min/max) e imprimiria **o ref consultado** para sua confirmação — sem nunca imprimir a chave.

**Bloqueio:** `api/.dev.vars` **não existe nesta máquina** (só `api/.dev.vars.example`). As credenciais reais vivem no Cloudflare Secrets Store, que não é legível daqui. Sem `SUPABASE_URL`/`SERVICE_KEY` locais, não há caminho de leitura — parando e reportando, conforme a regra do pacote.

**Caminhos possíveis (sua escolha):**

1. **Você roda no SQL Editor do Supabase** e cola o resultado:
   ```sql
   select count(*), count(distinct user_id), min(created_at), max(created_at) from underground_posts;
   ```
   ⚠️ Lição do caso release_reservation (commits `7e61308`/`c87ac74`): **confirme que a sessão do SQL Editor é o projeto de PRODUÇÃO** antes de confiar no resultado.

2. **Você cria `api/.dev.vars` local** (a partir do `.example`) com `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` de produção, e eu rodo o script somente-leitura — ele imprime o **host do ref consultado** junto com os números, para você validar que é produção.

O desenho do ITEM 5 (E2E obrigatório no Underground) segue parado até os números + sua decisão sobre o apagão dos posts existentes, como especificado.

---

## Estado do pacote

| Item | Status |
|---|---|
| 1 — Exclusão de sessões Zona Insegura | Commitado (`392fa28`) |
| 2 — IP de impressões 48h | Commitado (`392fa28`) |
| 3 — Sentry | **Aplicado, verificado, sem commit** (ativação: passos do Bob; host CSP pendente) |
| 4 — Log de cookie | Commitado (`392fa28`) |
| 5 — Underground E2E | **Bloqueado no passo prévio** — aguardando contagem (opção 1 ou 2 acima) |
