# BLOCO 4 — Identidade v2 em e-mails e ícones · inventário (somente leitura)

**Data:** 2026-09-01 · **Status:** inventário. **Nada editado.** Aguardando 3 confirmações + OK do approach.

---

## a) E-mails transacionais — templates encontrados

| Arquivo | Templates | Estilo atual | Logo |
|---|---|---|---|
| `api/src/auth/email.js` | **1 wrapper HTML** (linha 768) para **5 tipos** — confirmar conta, link de login, reset de senha, confirmar novo e-mail, convite — × **12 idiomas** (assuntos 17–334+) | cyberpunk: bg **`#0a0020`**, corpo **Georgia serif**, título **`#00f0ff`** (Trebuchet MS), botão `#00f0ff`/texto `#0a0020` | `logo-everything.jpg` (linha 11) → **404** |
| `api/src/utils/security-alerts.js` | 1 wrapper (226) — alertas de segurança | cyberpunk | mesmo `logo-everything.jpg` (241) → **404** |
| `api/src/handlers/ads/emails.js` | 1 wrapper (63) — e-mails do sistema de ads | a confirmar no diff | a confirmar |
| `api/src/handlers/ads/agency.js` | e-mail de payout de agência (assunto 894) | provável texto/simples | — |

**Logo quebrado — causa raiz confirmada:** `https://pub-2485…r2.dev/logo-everything.jpg` **e** `.png` → **ambos HTTP 404**.
O objeto não existe nesse host R2. (`logo-everything.png` existe só em `site/public/`, servido por philosify.org.)
Por isso o alt text aparece em todos os e-mails.

**Redesign (a):** 3 wrappers (auth + security-alerts + ads) → identidade v2: fundo **`#070708`**, título em
**Michroma** com fallback web-safe (`'Trebuchet MS','Segoe UI',Arial,sans-serif` — clientes de e-mail raramente
carregam web-fonts), corpo Inter/sistema (`-apple-system,'Segoe UI',Roboto,Arial,sans-serif`), acento só no
**ciano do título de módulo**, logo v2 em **URL estável**, alt text decente (imagens bloqueadas por padrão no Gmail/Outlook).

## b) Favicon e ícones PWA — **os arquivos JÁ SÃO a coruja v2** (é problema de cache)

Em `site/public/` (todos de **29/07**): `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `icon-192.png`,
`icon-512.png`, `apple-touch-icon.png`, `browserconfig.xml`, `manifest.json`.
- **Visualizei `icon-512.png`, `favicon-32x32.png` e `apple-touch-icon.png`: os três são a coruja v2**
  (line-art de coruja + wordmark "philosify" em base preta). **NÃO** são o "quadrado rosa" antigo.
- **Logo, não preciso de arquivo-fonte** — a coruja ≥512px existe (`icon-512.png`). O que o Edge mostra é
  **cache antigo** (ver §d): o SW precacheia `/icon-192.png` e o favicon fica no cache do browser.
- `index.html` (15–18) referencia os ícones **sem `?v=`** → o browser mantém o antigo.
- **Ressalva de design (opcional, decisão sua):** os ícones embutem o **wordmark "philosify"** abaixo da coruja →
  em 16/32px a coruja fica minúscula e o texto ilegível. Se quiser legibilidade melhor, gero/uso uma versão
  **só-coruja** (quadrada, sem wordmark) — aí sim precisaria do recorte só-coruja. Para o conserto imediato
  (parar de mostrar o rosa), os arquivos atuais já bastam.

**Correção (b):** (1) **bump do cache do SW** (§d) — sem isso, PWAs instalados seguem servindo o ícone velho;
(2) cache-busting `?v=2` nos `<link rel="icon">`/`apple-touch-icon` do `index.html`, nas `icons` do `manifest.json`
e no `browserconfig.xml`; (3) `name` do manifest → posicionamento v2 (§c).

## c) Título e meta

- `site/index.html:25` `<title>` = **"Philosify - Algorithmic Philosophical System for Cultural Analysis"**;
  `og:title`/`twitter:title` (34/44) espelham; `description`/`og:description` coerentes com "music, literature, news, ideas".
- **Override por página:** `site/src/App.jsx:63` `document.title = pageTitle`. `pageTitle` (49–52) tem default
  **"Philosify - Philosophical Music Analysis"** — posicionamento **antigo** (só "Music") e **divergente** do index.html.
- Fontes: `index.html` ainda carrega **Orbitron** (cyberpunk, 59/64) além de Michroma (69) — resquício.

**Proposta (c):** posicionamento único, ex. **"Philosify — Philosophical Analysis of Culture"**, aplicado em:
`index.html` (`<title>`, `description`, `og:*`, `twitter:*`) **e** `App.jsx:52` (default do `pageTitle`). (Remoção do
Orbitron fica como item menor opcional.)

## d) Service worker (`site/public/sw.js`) — serve ícones/manifest antigos aos PWAs instalados

- `CACHE_NAME = 'philosify-v12'` · `RUNTIME_CACHE = 'philosify-runtime-v11'`.
- **`PRECACHE_ASSETS = ['/', '/index.html', '/icon-192.png', '/favicon.ico']`** → o SW **grava o ícone e o
  favicon** no cache `philosify-v12`. PWA instalado serve esses do cache até o `CACHE_NAME` mudar (o `activate`
  apaga os caches fora do conjunto atual).
- Demais GETs (incl. `manifest.json`, `icon-512.png`) entram no `RUNTIME_CACHE` (v11) pelo fetch handler.
- **É por isso que o Edge instalado mostra ícone/nome antigos.** Conserto: **bump de AMBOS** —
  `philosify-v12`→`v13` e `philosify-runtime-v11`→`v12` — força o `activate` a limpar e re-buscar.

## c-bis) manifest.json (atual)

`name: "Philosify Everything"` — **não** é o posicionamento v2 (e "…Music Analysis" que seu Edge mostra é o
manifest **STALE** cacheado no PWA); `short_name: "Philosify"`; `background_color`/`theme_color` **`#070708`**
(já v2 ✓); `icons` só `192/512` **purpose "any"** (sem **maskable**); descrição "music, literature, news, and ideas".
→ atualizar `name`/`description` + `maskable` + `?v=2`.

---

## PRECISO DE VOCÊ (antes dos diffs) — **não preciso de arquivo-fonte** (a coruja já está em `icon-512.png`)

1. **(a) Logo do e-mail** — ok hospedar em **`https://philosify.org/brand/…`** (estável, é o host do `og:image`)?
   Proponho o lockup light-on-dark (`philosify-logo-lockup.png`); confirmo o asset exato no diff. Ou prefere R2?
2. **(c) Título** — EN **"Philosify — Philosophical Analysis of Culture"**? O `<title>`/manifest hoje são
   **globais (não localizados)** — confirmo aplicar em **EN**; o PT **"A palavra final é sempre sua"** só se você
   quiser localizar via `App.jsx` (fica fora do manifest/`<title>` estático).
3. **(b, opcional) Ícone só-coruja** — mantenho os ícones atuais (coruja + wordmark) ou quer uma versão
   **só-coruja** para 16/32px? (Só-coruja precisaria do recorte; os atuais já resolvem o "rosa".)

**Approach dos diffs (para OK):**
- **(a)** redesenhar os wrappers de `email.js` + `security-alerts.js` + `ads/emails.js` na identidade v2.
- **(b)** `?v=2` (index.html + manifest + browserconfig) + **bump do SW** (v12→v13 / v11→v12) + `maskable`.
- **(c)** `<title>`/`description`/`og`/`twitter` (index.html) + default do `pageTitle` (`App.jsx:52`) + `name`/`description` do manifest.

→ **Deploy:** worker (e-mails) + site (ícones/manifest/título/sw). **Sem commit até ordem.**

## Teste de aceitação (ETAPA 3 — do Bob)

- **E-mail:** reset de senha real → abrir no **Gmail** → visual v2, logo carregando.
- **PWA (1):** Edge com o app **já instalado** → abrir philosify.org → deve surgir "Examinar a atualização do
  aplicativo" → aceitar → em **Apps**, nome e ícone na identidade v2.
- **PWA (2) plano B:** se o Edge **não** oferecer a atualização → documentar desinstalar+reinstalar e verificar que
  o **manifest servido** (`philosify.org/manifest.json`) já traz `name`/`icons` novos.
- **PWA (3):** Chrome, **instalação limpa** → ícone coruja + nome correto de primeira.
- **Favicon:** philosify.org em janela **nova** do Edge → coruja.
