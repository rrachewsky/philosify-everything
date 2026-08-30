# Pacote Pré-Privacy — ITEM 3: Sentry, execução da configuração (site ativado no build)

**Data:** 2026-08-29
**Status:** tudo executado e provado; **sem commit** (regra do pacote). Pendente apenas o projeto do WORKER no Sentry (passos para o Bob no final).

**Dados usados (fornecidos pelo Bob):** org `global-goods-corporation` · projeto `philosify-web` (React, id 4510574574043136) · DSN do site `https://6448e4b6daa2ea661c3d522a24b39501@o4510574559035392.ingest.us.sentry.io/4510574574043136` · host de ingest real `o4510574559035392.ingest.us.sentry.io`.

---

## Executado

1. **Diffs A-D** — já estavam aplicados desde o OK anterior (turno do fechamento do item 3); conferidos no working tree: `setUser` só com `user_id` (`site/src/utils/sentry.js`), `VITE_SENTRY_DSN=` no `.env.example`, `getSecret` nos dois capture* (`api/src/utils/sentry.js`), binding `SENTRY_DSN` no `api/wrangler.toml`. Nada reaplicado.
2. **CSP** — `site/public/_headers:49`: host antigo `o22381.ingest.us.sentry.io` → **`o4510574559035392.ingest.us.sentry.io`**. O host antigo aparecia **uma única vez** no arquivo (e em nenhum outro lugar de `site/`); confirmado **0 ocorrências** do antigo no `dist/_headers` gerado.
3. **`site/.env.production`** (git-ignorado, local) — linha `VITE_SENTRY_DSN=...` acrescentada preservando o conteúdo existente. Arquivo final:
   ```
   # Production environment variables
   VITE_API_URL=https://api.philosify.org
   VITE_CDN_URL=https://pub-2485a0b8727445bbb7148e85a0db3edf.r2.dev
   VITE_ENV=production
   VITE_SENTRY_DSN=https://6448e4b6daa2ea661c3d522a24b39501@o4510574559035392.ingest.us.sentry.io/4510574574043136
   ```
4. **Decisão do ponto 4 = (a)** reconfirmada: IP/UA mantidos no evento de segurança (`api/index.js:473-478`); declaração entra na seção 7 da Privacy v2 na tarefa de aplicação da política.

## Verificações (provas)

| Verificação | Resultado |
|---|---|
| Build do site | **✓ built in 25.49s**, exit 0 |
| DSN no bundle | `grep o4510574559035392` → presente em **`dist/assets/index-CD_eDr2a.js`** (Sentry.init agora recebe o DSN inlined) |
| CSP no dist | `dist/_headers`: **1** ocorrência do host novo, **0** do antigo |
| Worker | `npx wrangler deploy --dry-run` → **OK** ("--dry-run: exiting now") |

## git status --short

```
 M api/src/utils/sentry.js
 M api/wrangler.toml
 M site/.env.example
 M site/public/_headers
 M site/src/utils/sentry.js
?? docs/LAUNCH_READINESS_REPORT.md
?? docs/MARKET_LAUNCH_PLAN.md
?? new_design/ITEM3_FECHAMENTO_ITEM5_BLOQUEIO_2026-08-29.md
?? new_design/ITEM3_SENTRY_PROPOSTA_2026-08-29.md
?? new_design/philosify-modules-review.html
?? "new_design/printscreen 01/"
```

(`.env.production` não aparece — git-ignorado, como deve ser. Sem commit.)

**Efeito prático:** o Sentry do SITE fica ativo no próximo deploy do Pages feito a partir deste build (Session Replay 10%/100%-erro, maskAllText, usuário identificado no máximo por `user_id` — e hoje nem isso, `setUser` sem chamadores). O worker segue inerte até existir o secret (abaixo).

---

## PENDENTE — projeto do WORKER no Sentry (passos para o Bob)

1. sentry.io (org `global-goods-corporation`) → **Create Project** → plataforma **Browser JavaScript** (ou JavaScript genérica — a implementação custom do worker usa o endpoint `/api/{projectId}/store/`, aceita qualquer DSN) → nome sugerido **`philosify-api`**.
2. No projeto criado: **Settings → Client Keys (DSN)** → copiar o DSN. (O host de ingest será o mesmo da org — `o4510574559035392.ingest.us.sentry.io`; o worker não depende do CSP do site, então nenhum ajuste extra.)
3. Cloudflare Dashboard → Workers & Pages → Account Settings → **Secrets Store** (store `aa556a30980842c785cb0e1cbb0bb933`) → **Add secret** → nome exato **`SENTRY_DSN`**, valor = DSN do passo 2. O binding no `wrangler.toml` já está pronto (diff D).
4. Recomendado: Settings → Security & Privacy do projeto → **Server-Side Data Scrubbing** ligado.
5. **Deploys (seus, quando ordenar):** worker (`wrangler deploy --env production`) para o binding valer, e site (`wrangler pages deploy dist --project-name=philosify-frontend --branch=production`) para o bundle com DSN + CSP novo irem ao ar. O dist atual já está pronto com ambos.

---

## Estado do pacote

| Item | Status |
|---|---|
| 1 — Exclusão de sessões Zona Insegura | Commitado (`392fa28`) |
| 2 — IP de impressões 48h | Commitado (`392fa28`) |
| 3 — Sentry | **Executado** (site ativado no build; worker aguarda secret do Bob); sem commit |
| 4 — Log de cookie | Commitado (`392fa28`) |
| 5 — Underground E2E | Bloqueado no passo prévio — aguardando contagem de `underground_posts` (SQL Editor do Bob ou `.dev.vars` local) |
