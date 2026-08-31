# Smoke MODO A — Prova de moderação (admin decrypt)

> **SUPERADO (2026-08-31):** o Bob decidiu **não** fazer a prova via `curl + ADMIN_SECRET`
> (segredo de produção não vai a terminal). A prova passa a ser por **sessão autenticada de admin**
> no navegador logado. Novo desenho + diff em **`MODO_A_ADMIN_SESSION_DIFF_2026-08-31.md`**.
> As seções abaixo (contrato do handler, SQL de auditoria, pontos de vigilância) seguem válidas.

**Data:** 2026-08-31 · **Status:** substituído pelo caminho de sessão (ver acima).
**Deploy vigente:** worker `bd431173` · site `7a2d6bbf`. **Sem deploy, sem commit.**

---

## 1. Por que o Bob executa (não o assistente)

A rota `POST /api/underground/admin/decrypt` autentica por **`x-admin-secret: <ADMIN_SECRET>`**
(segredo de produção). O assistente **não manipula segredos/tokens** e não tem o valor (Secrets
Store). Logo: **o Bob dispara** o comando com o segredo na própria máquina; o assistente lê a
saída colada e reporta. O segredo **não** entra no chat nem no repositório.

## 2. Contrato verificado no código

`api/src/handlers/underground.js` · `handleUndergroundAdminDecrypt` (987–1059):

- **Auth:** `x-admin-secret` comparado em tempo constante a `ADMIN_SECRET` (996–1000). Mismatch/ausente → **404 `{"error":"Not found"}`**.
- **Body:** `post_id` (UUID **obrigatório**, 1008), `report_id` (opcional UUID, 1009), `reason` (string ≤500, 1005), `actor` (string ≤200, default `"admin"`, 1006–1007).
- **Fluxo:** lê `underground_posts` por id (1012–1017) → `decryptUndergroundCiphertext` via KEK/room key (1023) → grava auditoria em `underground_moderation_log` `{post_id, report_id, reason, actor}` (1033–1038).
- **Resposta 200:** `{ post_id, user_id, nickname, created_at, plaintext }` (1043–1054).
- **Qualquer falha** (segredo errado, post inexistente, decrypt falho) → **404 bland** (sem detalhe).

## 3. Comando (Bob roda — substituir `<ADMIN_SECRET>`)

**PowerShell (Windows):**
```powershell
$body = '{"post_id":"62d818c0-4ea1-4354-b4da-d74dfcd73f2d","reason":"smoke test","actor":"bob"}'
Invoke-RestMethod -Method Post `
  -Uri "https://api.philosify.org/api/underground/admin/decrypt" `
  -Headers @{ "x-admin-secret" = "<ADMIN_SECRET>"; "Content-Type" = "application/json" } `
  -Body $body
```

**curl.exe (alternativa, também funciona no PowerShell):**
```bash
curl.exe -s -X POST https://api.philosify.org/api/underground/admin/decrypt ^
  -H "Content-Type: application/json" ^
  -H "x-admin-secret: <ADMIN_SECRET>" ^
  -d "{\"post_id\":\"62d818c0-4ea1-4354-b4da-d74dfcd73f2d\",\"reason\":\"smoke test\",\"actor\":\"bob\"}"
```

## 4. SQL de auditoria (Bob roda no Supabase)

```sql
select post_id, actor, created_at from underground_moderation_log;
```

## 5. Esperado

- **Resposta:** 200 com `plaintext` = o texto do post denunciado da THEPRODUCER (**`TEST`** ou **`TEST2`**),
  mais `user_id`/`nickname` (autoria de-anonimizada — é o ponto da moderação), `created_at`.
- **SQL:** **1 linha** em `underground_moderation_log` com `actor = "bob"`.
- **Nota de vigilância:** o insert de auditoria usa o client custom (que **engole erro HTTP**). Se a
  resposta vier 200 com plaintext **mas** o SQL mostrar **0 linhas**, o INSERT da auditoria falhou
  em silêncio — isso é achado (registrar e investigar), não sucesso.
- Sanity negativo (opcional): repetir **sem** o header (ou com segredo errado) → **404 bland**.

## 6. Resultado (preencher com a saída do Bob)

- Resposta do endpoint: _(colar `plaintext` + `nickname`/`user_id`)_
- Linha do `underground_moderation_log`: _(colar)_
- Veredito: _(pendente)_

---

## Nota — pré-condição implícita

Este item pressupõe que o **create já funciona** (posts `TEST`/`TEST2` existem e um foi denunciado),
ou seja, o bloqueio da trigger `NEW.message` (ver `SMOKE_MODO_A_CREATE_500_2026-08-31.md`) foi
resolvido. Para o registro: confirmar **como** o create foi destravado (trigger corrigida/dropada)
para versionar em `migrations/`. Ainda não recebi essa confirmação.
