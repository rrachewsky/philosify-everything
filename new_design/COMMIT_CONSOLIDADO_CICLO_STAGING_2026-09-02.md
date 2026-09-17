# Commit consolidado do ciclo — plano de staging (para OK)

**Data:** 2026-09-02 · **Status:** proposto. **Sem commit, sem push até ordem do Bob.**
**Branch:** `redesign/v2` · **Autor:** Bob · **Sem autoria de IA** · **Mensagem em minúsculas PT.**

Escopo do ciclo: e-mails minimalistas + recibo 18 idiomas + PNG transparente do lockup + erradicação de Orbitron/Exo 2
+ idioma do e-mail no OAuth (worker e frontend) + relatórios.

> **`.gitignore`:** verificado — **nenhum** relatório/arquivo deste ciclo é engolido (todos `git check-ignore` = ok).
> **Nenhum `git add -f` necessário** (diferente do ciclo anterior, cujo relatório do toggle casava com `*password*`).
> Os favicons 86% e o `?v=3` do `index.html` **já foram commitados** em `7660d04` — por isso não aparecem aqui.

---

## INCLUIR (21 arquivos) — `git add` explícito, sem `git add -u`

### Worker (5)
| Arquivo | Mudança |
|---|---|
| `api/src/auth/email.js` | wrapper minimalista (fundo único `#070708`, sem card/glow, botão outline); **zero emoji** + **título≠botão** nos 18; `LOGO_URL` → PNG transparente |
| `api/src/utils/security-alerts.js` | recibo **localizado nos 18** (`RECEIPT_I18N`) + wrapper minimalista + img transparente; emoji dos e-mails admin removidos |
| `api/src/handlers/ads/emails.js` | wrapper minimalista (coluna única sobre `#070708`) |
| `api/index.js` | `userId` wirado nos 2 call sites do recibo (idioma) |
| `api/src/auth/proxy.js` | `backfillPreferredLanguage` — preenche `user_metadata.preferred_language` no exchange OAuth/e-mail quando ausente |

### Site (12)
| Arquivo | Mudança |
|---|---|
| `site/index.html` | remoção do preload/link do Orbitron (Inter 600;700 mesclados no link v2) |
| `site/src/hooks/useAuth.js` | envia `language: i18n.language` nos exchanges OAuth/e-mail |
| `site/src/styles/results.css` | Orbitron/**Exo 2** → Michroma/Inter (@import removido) |
| `site/src/styles/music-sidebar.css` | Orbitron → Inter (34×) |
| `site/src/styles/modal-cyberpunk.css` | Orbitron → Inter; `.auth-modal h2` → Michroma (@import removido) |
| `site/src/styles/modal-features.css` | Orbitron → Inter |
| `site/src/styles/landing.css` | Orbitron → Inter (@import + comentário) |
| `site/src/styles/homepage.css` | Orbitron → Inter |
| `site/src/styles/layout.css` | header `Orbitron`/`League Gothic` → Michroma |
| `site/src/pages/MusicAnalysis.jsx` | inline Orbitron/Exo 2 → Inter (@import removido) |
| `site/src/pages/ComingSoon.jsx` | inline Orbitron → Inter |
| `site/src/components/ComingSoonSidebar.jsx` | inline Orbitron → Inter |
| `site/public/brand/philosify-logo-lockup-transparent.png` | **NOVO** — lockup com fundo transparente (luminância como alpha) |

### Relatórios / SQL (4)
- `new_design/EMAILS_RETOQUE_ETAPA1_MAPEAMENTO_2026-09-02.md`
- `new_design/EMAILS_RETOQUE_ETAPA2_DIFF_2026-09-02.md`
- `new_design/ORBITRON_ERRADICACAO_ETAPA1_INVENTARIO_2026-09-02.md`
- `migrations/diag_google_users_preferred_language.sql`

---

## EXCLUIR (fora do ciclo)
- `new_design/PRIVACY_V2_ETAPA2_3_FINAL_2026-08-31.md` (modificado — doc da Privacy v2, não é deste ciclo)
- `docs/LAUNCH_READINESS_REPORT.md`, `docs/MARKET_LAUNCH_PLAN.md`, `docs/philosify-metodologia-canonical-PT.md`
- `new_design/METODOLOGIA_ETAPA1_MAPEAMENTO_2026-09-01.md`
- `new_design/RELATORIO_SUPERVISOR_FECHAMENTO_MODO_A_2026-08-31.md`
- `new_design/philosify-modules-review.html`
- `new_design/printscreen 01/`

**Nota:** o PNG opaco antigo (`site/public/brand/philosify-logo-lockup.png`) segue rastreado e no ar, agora **sem
referência** nos templates — deixado no repo (remoção seria decisão à parte).

---

## Já deployado neste ciclo (referência)
- **Site:** `da3970da` (Orbitron/Exo2 + OAuth frontend + PNG transparente).
- **Worker:** `84873c9e-f90a-4ccd-98d7-66d5e7f5424e` (templates → PNG transparente) — antecedido por `89c024d1` (e-mails).
- **PNG em produção:** `GET /brand/philosify-logo-lockup-transparent.png` → 200, 93.647B (hasAlpha=true).

## Aceites
- ✅ Gmail **dark** — coruja transparente sem placa (cinza de fundo = repintura do Gmail, aceito como inevitável).
- ⏳ Pendentes do Bob (não bloqueiam o staging): Gmail **claro** + reset com conta **PT** (e-mail em português).

---

## Mensagem proposta
```
e-mails minimalistas com lockup transparente e recibo em 18 idiomas; erradica orbitron e exo 2 do site; idioma do e-mail preenchido no login oauth
```

## Sequência (após OK)
`git add` explícito (21) → `git status` de conferência → commit (autor Bob, sem IA) → `git push origin redesign/v2` → reportar hash.

**Sem commit até ordem.**

---

## EXECUTADO (2026-09-02) — OK do Bob

**Correção de contagem:** a lista aprovada eram **22 arquivos** (rotulei "21" por engano na soma; o conjunto/lista
com o PNG estava intacto). Staged = 22, conferido antes do commit.

- **Commit 1 (ciclo):** hash **`1b05e51`** (`1b05e5115064672f0b559a8681bfeb167136a831`) — 22 arquivos
  (5 worker + 12 site + PNG transparente + 3 relatórios + SQL diag). Autor **Bob Rach**, mensagem em minúsculas PT,
  **sem trailers de IA**.
- **Commit 2 (docs órfãos):** hash **`8b329e5`** — `PRIVACY_V2_ETAPA2_3_FINAL` + `RELATORIO_SUPERVISOR_FECHAMENTO_MODO_A`.
  Mensagem: "docs: relatorios do fechamento do modo a e do deploy da privacy v2".
- **Push:** `7660d04 → 1b05e51 → 8b329e5` em `origin/redesign/v2`. ✓

**Fora (correto):** docs da Metodologia (pertencem ao commit da tarefa de Metodologia), `docs/LAUNCH_READINESS`,
`docs/MARKET_LAUNCH_PLAN`, `philosify-modules-review.html`, `printscreen 01/`, e este próprio relatório de staging.

**Já no ar:** site `da3970da`, worker `84873c9e`. **Aceites pendentes (não bloqueiam):** Gmail claro + reset conta PT.
