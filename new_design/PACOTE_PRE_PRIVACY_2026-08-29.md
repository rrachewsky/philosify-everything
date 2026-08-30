# PACOTE PRÉ-PRIVACY — Relatório Consolidado

**Data:** 2026-08-29
**Status:** os 5 itens **aplicados e verificados**. Itens 1, 2 e 4 já commitados (`392fa28`); itens 3 e 5 no working tree. **Nenhum deploy executado ainda** — proposta de commit final + ordem de deploy na última seção, aguardando OK do Bob.
**Contexto:** pré-lançamento; migração do item 5 aplicada em produção pelo Bob; `underground_posts` estava vazia (0/0) — sala nasce cifrada, sem legado.

---

## ITEM 1 — Zona Insegura: exclusão de sessões pelo usuário ✅ (commitado em `392fa28`)

- **API:** `DELETE /api/unsafe-zone/session/:id` (uma sessão, qualquer status; UUID validado; propriedade via filtro `user_id`; 404 se não for do usuário) e `DELETE /api/unsafe-zone/history` (todas). DELETE físico em ambos. `DELETE /conversation` (ativa) inalterado.
- **UI v2:** botão × por linha do histórico + "Apagar todas as sessões", ambos via ConfirmModal; **confirmação distinta para sessão ativa** (aviso: turnos não usados perdidos, sem reembolso); adendo 404 no `sendMessage` (aba stale se limpa na primeira interação, rascunho preservado).
- **i18n:** 7 chaves × 18 (PT validado, variantes *Active* sem dupla finalidade nas 18).
- **Sem reembolso ao apagar sessão ativa** — contrato validado pelo Bob.

## ITEM 2 — IP de impressões de anúncio: anonimizar após 48h ✅ (commitado em `392fa28`)

- Grep prévio: leitores = só frequency-cap do dia (`serve.js:307`) e antifraude de clique (`serve.js:819`, já tolerante a null). Tabelas homônimas de sessões do app de ads ficaram fora (registradas).
- `anonymizeOldImpressionIps` em `serve.js` (SELECT ids <48h + UPDATE `ip_address=null` por `id=in.()`, batch 500) + bloco no `scheduled()` (cron `*/5`). Log do caso "0 afetadas com candidatas". Sintaxes provadas contra usos existentes do client.

## ITEM 3 — Sentry restabelecido de propósito ✅ (aplicado; sem commit)

- **Site:** `setUser` só com `user_id`; `VITE_SENTRY_DSN` documentada no `.env.example` e **preenchida no `.env.production` local** (DSN real do projeto `philosify-web`, org `global-goods-corporation`); **CSP atualizado** para `o4510574559035392.ingest.us.sentry.io` (host antigo: 1 ocorrência, zerada). Provas: DSN presente no bundle (`dist/assets/index-*.js`) e no `dist/_headers`. Session Replay intacto (10%/100%-erro/maskAllText).
- **Worker:** correção `getSecret` nos dois capture* (sem ela o binding falharia em silêncio) + binding `SENTRY_DSN` no `wrangler.toml`. **Pendência do Bob:** criar o projeto do worker no Sentry + secret `SENTRY_DSN` no Secrets Store (passos em `ITEM3_EXECUCAO_SENTRY_2026-08-29.md`).
- **Decisão (a):** IP/UA mantidos no evento de segurança; declaração entra na §7 da Privacy v2.

## ITEM 4 — Log de fragmento de cookie removido ✅ (commitado em `392fa28`)

- `profile.js`: `console.log` do prefixo do cookie de sessão eliminado; logs neutros mantidos.

## ITEM 5 — Underground: E2E obrigatório, nascendo cifrado ✅ (aplicado; sem commit)

Desenho aprovado + §2.8 (report-com-plaintext-voluntário) + reforços. Quatro diffs:

| Diff | Estado | Conteúdo |
|---|---|---|
| 1 — Migração | **Aplicada em produção pelo Bob** (§4: 1/1/2/t/t/0/2/0) | `underground_room` (meta/árbitro/fingerprint), `underground_reports` (evidência sobrevive a apagão de post e a exclusão de conta — FKs SET NULL), colunas de `space_access` |
| 2 — Backend | Aplicado; dry-run OK | Unlock exige keypair (409); 5 handlers (room-init com auto-cura do vencedor-órfão, pending-keys/distribute-keys com 403 p/ não-chaveados, rekey, report com prova de consistência → 409 STALE); create/edit só-cifrado (400 E2E_REQUIRED); GET com meta da sala; rate limits + tetos |
| 3 — Crypto/serviços front | Aplicado; build OK | Fingerprint SHA-256 hex; `setUndergroundRoomKey` valida ANTES de adotar (mismatch → rekey automático); descarte com `fill(0)` (exceção: vencedor-órfão adota a própria candidata); orquestração `ensureRoomReady` + varredura distribuidora; `ensureUserKeys` cobre os 3 membros da era de teste; sem fallback plaintext; `reportPost` (camelCase provado) com retry único de STALE; barrel export de `publicKeyFromBase64` corrigido |
| 4 — UI + i18n | Aplicado; build ✓ 20.73s | SpaceLock com `ensureUserKeys` pré-unlock; realtime decifrando broadcasts; banner honesto de pendência + erro; composer bloqueado fora de `ready`; botão de report discreto **só em posts decifrados e alheios** (ajuste 1); ReportModal com aviso destacado, motivo ≤500, estados sending/success/stale/429/erro e **fechar com chave própria** (ajuste 2); 15 chaves × 18 (PT validado) |

**Incidente registrado na aplicação do DIFF 4:** os 18 JSONs falharam a validação byte-a-byte — causa raiz: o `git stash`/`pop` da contraprova do item 2 fez o `core.autocrlf=true` reescrever a working copy em **CRLF** (conteúdo no repo segue LF; commits não afetados). Script ajustado para detectar e **preservar o EOL** de cada arquivo; 18/18 aplicados com diff cirúrgico (+16/−1 por arquivo).

---

## Pendências registradas (fora do escopo do pacote)

1. Sentry do worker: projeto + secret `SENTRY_DSN` (Bob; passos no relatório do item 3).
2. 2 testes pré-existentes falhando em `api/src/utils/i18n-errors.test.js` (comprovado por contraprova em árvore limpa).
3. Cadeia da Privacy v2 (ordem do Bob): i18n 18 línguas com PT validado + split do `v2.legal.updated` + linha §7 (IP/UA no Sentry) + contrato do report §2.8 → publicação.
4. `GET /api/unsafe-zone/session/:id`: sessionId cru no filtro (lacuna latente registrada no item 1; rota nova nasceu validada).

---

# PROPOSTA — COMMIT FINAL + ORDEM DE DEPLOY (aguardando OK do Bob)

## A. Commit final (itens 3 + 5 + relatórios)

**git add (e somente):**
- `api/index.js` · `api/src/handlers/spaces.js` · `api/src/handlers/underground.js` · `api/src/utils/sentry.js` · `api/wrangler.toml`
- `site/.env.example` · `site/public/_headers` · `site/src/utils/sentry.js`
- `site/src/components/community/SpaceLock.jsx` · `site/src/components/underground/UndergroundFeed.jsx` · `site/src/crypto/index.js` · `site/src/hooks/useUnderground.js` · `site/src/services/api/underground.js` · `site/src/services/crypto.js` · `site/src/styles/v2-pages/underground.css`
- `site/src/i18n/translations/*.json` (18)
- `migrations/underground_room_e2e.sql`
- `new_design/ITEM3_SENTRY_PROPOSTA_2026-08-29.md` · `ITEM3_FECHAMENTO_ITEM5_BLOQUEIO_2026-08-29.md` · `ITEM3_EXECUCAO_SENTRY_2026-08-29.md` · `ITEM5_UNDERGROUND_E2E_DESENHO_2026-08-29.md` · `ITEM5_DIFF1_MIGRACAO_2026-08-29.md` · `ITEM5_DIFF2_BACKEND_2026-08-29.md` · `ITEM5_DIFF3_FRONT_CRYPTO_2026-08-29.md` · `ITEM5_DIFF4_UI_I18N_2026-08-29.md` · `PACOTE_PRE_PRIVACY_2026-08-29.md`

**Ficam de fora (de sempre):** `docs/LAUNCH_READINESS_REPORT.md`, `docs/MARKET_LAUNCH_PLAN.md`, `new_design/philosify-modules-review.html`, `new_design/printscreen 01/`.

**Mensagem proposta:**
`pre-privacy: Sentry reativado de proposito (site+worker); Underground E2E obrigatorio (sala cifrada, chave por membro, report com plaintext voluntario)`

Depois: `git push origin redesign/v2`.

## B. Ordem de deploy (com o porquê)

**Passo 0 (Bob, ANTES do deploy do worker):** criar o projeto do worker no Sentry e o secret **`SENTRY_DSN`** no Secrets Store — o `wrangler.toml` agora referencia esse secret; sem ele o deploy do worker pode ser recusado pelo binding.

**Passo 1 — Worker:** `cd api && npx wrangler deploy --env production`
Leva de uma vez os backends dos itens 1, 2, 4, 3-worker e 5 (nenhum foi publicado ainda).

**Passo 2 — Site:** `cd site && npm run build && npx wrangler pages deploy dist --project-name=philosify-frontend --branch=production`
*Worker primeiro, site depois:* o site novo depende das rotas novas (unsafe-zone deletes, underground key-flow); na ordem inversa, a orquestração da sala falharia em produção. Janela worker→site: usuário no bundle antigo tentando postar no Underground toma 400 `E2E_REQUIRED` até o site novo subir — minutos, em pré-lançamento; aceitável.

## C. Verificações pós-publicação, por item

**Item 1 (Zona Insegura):**
1. UI: apagar uma sessão encerrada pelo × (some da lista); apagar a ATIVA → confirm com aviso de turnos; "Apagar todas" → lista zera e console reseta.
2. Aba stale (segundo navegador com conversa aberta) → enviar → console limpa sem erro (caminho 404).
3. `curl -X DELETE .../api/unsafe-zone/session/<uuid-aleatorio>` autenticado → 404.

**Item 2 (reaper de IP):**
1. Após ≥5 min: `wrangler tail --env production` — sem erros `[Cron] Impression IP anonymization`; log `[Ads] IP anonymization: N...` se houver candidatas.
2. SQL: `select count(*) from ads.ad_impressions where ip_address is not null and created_at < now() - interval '48 hours';` → **0** (após alguns ciclos).

**Item 3 (Sentry):**
1. Site: abrir philosify.org → console do DevTools **sem violação de CSP** para `o4510574559035392.ingest.us.sentry.io`; dashboard do Sentry (philosify-web) começa a receber sessions/replays.
2. Worker: `wrangler tail` sem `[Sentry] No DSN configured` (com o secret criado); evento de teste opcional: requisição a um path suspeito (ex.: `/api/../etc`) → evento "blocked suspicious request" no projeto do worker.

**Item 4 (log de cookie):**
1. `wrangler tail` + abrir /account (GET /api/profile) → nenhuma linha `[Profile] Cookie header`.

**Item 5 (Underground E2E) — smoke completo com 2 contas:**
1. Conta A (fundadora): unlock (3 créditos; keypair gerado automático) → nickname → console do navegador: `Room founded by this client` → postar → post aparece decifrado. SQL: `select count(*) from underground_room;` → **1**.
2. Conta B: unlock → **banner honesto de pendência** visível, composer bloqueado.
3. Conta A recarrega a página (varredura distribui) → conta B recarrega → posts legíveis, composer liberado → B posta → A vê em realtime decifrado.
4. Report: B denuncia post de A → aviso destacado → enviar → sucesso. SQL: `select reporter_id is not null, reason, length(plaintext) from underground_reports;` → 1 linha coerente.
5. Servidor cego: `select count(*) from underground_posts where content is not null;` → **0**; `select count(*) from space_access where space='underground' and encrypted_room_key is null;` → tende a 0 conforme os 3 da era de teste voltam.
6. Membro da era de teste: login → pendente → recebe chave após visita de membro chaveado.

**Rollback:** worker `npm run rollback` (wrangler); site: redeploy do dist anterior. A migração do item 5 não precisa de rollback (tabelas novas + colunas nulas, inertes sem o código novo).
