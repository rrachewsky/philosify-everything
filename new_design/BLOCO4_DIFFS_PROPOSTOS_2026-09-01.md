# BLOCO 4 — diffs propostos para OK

**Data:** 2026-09-01 · **Status:** proposto. **Nada editado, sem commit, sem deploy.**
**Pré-req confirmados:** logo do e-mail `https://philosify.org/brand/philosify-logo-lockup.png` → **200 image/png
anônimo**, `_worker.js` não barra `/brand`. Fonte **só-coruja: ausente** → **(b) parado, aguardando o arquivo**.

---

## (a) E-mails — redesign v2 · **worker**

**Logo (raiz do "quebrado"):** `api/src/auth/email.js:11` e `api/src/utils/security-alerts.js:241`
`https://pub-2485…r2.dev/logo-everything.jpg` (404) → **`https://philosify.org/brand/philosify-logo-lockup.png`**.

**Paleta/fontes v2 (aplicadas nos 3 wrappers — `email.js`, `security-alerts.js`, `ads/emails.js`):**
| Antigo (cyberpunk) | Novo (v2) |
|---|---|
| bg `#0a0020` / card `#0c051e` / footer `#080318` | bg **`#070708`** / card **`#0d0d0f`** / footer **`#0b0b0d`** |
| glow gradiente ciano+**roxo** (`#7c3aed`) | **removido** — só borda `1px rgba(255,255,255,0.08)` |
| linha de acento gradiente ciano+roxo | **linha ciana única** `#00f0ff` |
| corpo `Georgia serif` | corpo `-apple-system,'Segoe UI',Roboto,Inter,Arial,sans-serif` |
| título `Trebuchet MS` | título `Michroma,'Segoe UI',Arial,sans-serif` (Michroma 1º; e-mail cai no sans-serif) |
| botão `#00f0ff`/texto `#0a0020` | botão `#00f0ff`/texto **`#070708`** (mantém bulletproof MSO) |
| `alt="Philosify"` | mantém (decente com imagem bloqueada) |

**Novo wrapper de `generateEmailHtml` (referência — os outros 2 recebem o mesmo tratamento):**
```html
<body style="margin:0;padding:0;background-color:#070708;font-family:-apple-system,'Segoe UI',Roboto,Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#070708;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0d0d0f;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 40px 20px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
          <img src="${LOGO_URL}" alt="Philosify" width="190" style="width:190px;max-width:72%;height:auto;" />
        </td></tr>
        <tr><td style="height:2px;background-color:#00f0ff;line-height:2px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:36px 40px 32px;">
          <h1 style="margin:0 0 20px 0;color:#00f0ff;font-family:Michroma,'Segoe UI',Arial,sans-serif;font-size:19px;font-weight:normal;letter-spacing:1px;text-align:center;">${translations.title}</h1>
          <p style="margin:0 0 28px 0;color:rgba(255,255,255,0.72);font-size:15px;line-height:1.8;text-align:center;">${translations.body}</p>
          <!-- CTA bulletproof: mesma estrutura MSO/VML, recolorida (#00f0ff / texto #070708) -->
          <!-- divider rgba(255,255,255,0.08); footer text rgba(255,255,255,0.4) -->
        </td></tr>
        <tr><td style="background-color:#0b0b0d;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;text-align:center;letter-spacing:0.5px;">&copy; Philosify &bull; <a href="https://philosify.org" style="color:#00f0ff;text-decoration:none;">philosify.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
```
Cobre **os 5 tipos × 12 idiomas** do `email.js` (wrapper único), os alertas (`security-alerts.js`) e os e-mails de
ads (`ads/emails.js`). `ads/agency.js` (payout) é texto simples — sem mudança visual necessária.

## (c) Título / meta / posicionamento · **site**

**`site/index.html`:**
- `<title>` (25), `og:title` (34), `twitter:title` (44) → **"Philosify — Philosophical Analysis of Culture"**.
- `description` (27), `og:description` (37), `twitter:description` (47) → coerente com os módulos:
  *"Philosophical analysis of culture — music, cinema, literature, news and ideas — scored across Ethics,
  Metaphysics, Epistemology, Politics and Aesthetics."*
- (opcional) remover o preload/stylesheet do **Orbitron** (59/64) — resquício cyberpunk; Michroma permanece.

**`site/src/App.jsx`** (linha 49–52) — `<title>` localizado nos 18 **reusando a chave existente**
`v2.landing.tagline` (já traduzida; PT = "A palavra final é sempre sua"). Sem chave nova.
```js
const pageTitle =
  result && !result.error
    ? `${result.song || result.song_name} - ${result.artist} | Philosify`
    : `Philosify — ${t('v2.landing.tagline')}`;
```
(`t` já está em escopo, `App.jsx:11`.) **Manifest `name` e o `<title>` estático do index.html** ficam no
**EN "Philosify — Philosophical Analysis of Culture"** (não-localizados; SEO/crawler/PWA install).

## (b) Ícones / manifest / SW · **site** · **ESCOPO REDUZIDO (só favicon) — sem fonte externa**

Escopo do Bob: **só os 3 favicons viram só-coruja** (sem fio nem wordmark); `icon-192/512`, `apple-touch-icon`,
`browserconfig`, maskable → **mantidos** (já v2). Cache-busting + bump do SW para os PWAs instalados atualizarem.

- **Favicons só-coruja (gerados via `sharp` do `icon-512`, crop centrado `left=91 top=6 side=330`, sem fio/wordmark):**
  - `site/public/favicon-32x32.png` (32px), `site/public/favicon-16x16.png` (16px) — regenerados do crop.
  - `site/public/favicon.ico` — reconstruído (ICO com o PNG 32×32 embutido; escrevo o container em Node, sem dep nova).
  - *(Candidato enviado pra tua aprovação; posso ajustar o enquadramento.)*
- **`site/public/sw.js`:** `philosify-v12`→**`v13`** e `philosify-runtime-v11`→**`v12`** (força `activate` a limpar/re-buscar).
- **`site/index.html`** (15–18): `?v=2` em `favicon.ico`/`favicon-32x32`/`favicon-16x16` (e `apple-touch-icon` p/ garantir refresh).
- **`site/public/manifest.json`:** `name` → **"Philosify — Philosophical Analysis of Culture"**; `description` coerente;
  `icons` (192/512) com **`?v=2`**. `short_name` "Philosify" (mantém). *(Sem novos maskable — Bob pediu manter.)*
- **`site/public/browserconfig.xml`:** `?v=2`.

**Não preciso de arquivo-fonte** — a coruja sai do `icon-512` via `sharp` (presente em `site/node_modules`).

---

## Sequência de deploy proposta (babysteps) — **tudo destravado**

**Após OK (+ aprovação do favicon):** aplicar (a)+(b)+(c) → `wrangler deploy --dry-run` + `npm run build` →
**deploy worker** (a: e-mails) + **deploy site** (b+c: favicon/manifest/sw/título).

**Aceite (ETAPA 3):** (1) reset real no Gmail → v2 + logo carregando; (2) Edge instalado → "atualizar app" →
nome/ícone v2 (plano B: reinstalar; conferir `philosify.org/manifest.json` novo); (3) Chrome instalação limpa →
coruja + nome de 1ª; (4) favicon coruja em janela nova do Edge.

**Sem commit até ordem.** Preciso de: **OK nos diffs (a)(b)(c)** + **aprovação do favicon** (candidato enviado).

---

## EXECUTADO (2026-09-01) — deploy do Bloco 4

**OK do Bob** nos diffs (a)(b)(c); favicon **aprovado como está** (o template `[APROVADO | AJUSTAR]` veio sem
descrição de ajuste e a ordem foi "Executar" → leitura acionável = aprovado; re-crop é 2 min se quiser mudar).

### (a) E-mails — worker
- `api/src/auth/email.js`: `LOGO_URL` → `https://philosify.org/brand/philosify-logo-lockup.png`; wrapper único
  (5 tipos × 12 idiomas) redesenhado v2 (bg `#070708`, card `#0d0d0f`, camada de glow **removida**, gradiente
  roxo→**linha ciana**, Georgia→sistema, título Michroma+fallback, botão bulletproof recolorido texto `#070708`,
  footer `#0b0b0d`). **0 resquícios** do palette antigo (grep `#0a0020|#0c051e|#080318|#7c3aed|Georgia|logo-everything` = 0).
- `api/src/utils/security-alerts.js`: `sendPaymentReceiptEmail` (recibo cliente) convertido de **claro→v2 escuro**
  + logo consertado; teal `#00c8c8`→ciano `#00f0ff`; 11 edições cirúrgicas.
  - **Deixado como está (fora de escopo):** `sendNewSubscriberEmail` (382–385) é e-mail **admin interno**
    (notificação a admin@), não o wrapper cliente, não-quebrado — mantém Georgia/teal. Registrado por honestidade.
- `api/src/handlers/ads/emails.js`: wrapper `wrapHtml` → v2 (bg `#070708`, card `#0d0d0f`, h1 Michroma ciano);
  dourado `#c9a861`→ciano `#00f0ff` **global (todos os corpos)**. Botões ficam ciano com texto `#0a0a0f` (escuro
  sobre ciano, legível).

### (b) Ícones / SW — site
- **Favicons só-coruja** gerados via `sharp` (crop `left=91 top=6 330×330` do `icon-512`, sem fio/wordmark):
  `favicon-16x16.png` (549 B), `favicon-32x32.png` (1364 B), `favicon.ico` (1951 B, ICO com frames PNG 16+32,
  header validado: type=1 count=2, assinaturas PNG OK). Coruja em fundo preto (on-brand v2).
- `icon-192/512`, `apple-touch-icon`, maskable, `browserconfig` → **mantidos** (já v2), conforme escopo.
- `sw.js`: `philosify-v12`→**`v13`**, `philosify-runtime-v11`→**`v12`**.
- `?v=2`: `index.html` (favicon.ico/32/16/apple-touch), `manifest.json` (icons 192/512), `browserconfig.xml`.
- `manifest.json`: `name` → **"Philosify — Philosophical Analysis of Culture"** (EN); `description` coerente.

### (c) Título / meta — site
- `index.html`: `<title>`/`og:title`/`twitter:title` → **"Philosify — Philosophical Analysis of Culture"**;
  `description`/`og`/`twitter` → linha coerente com os módulos (music, cinema, literatura, notícias, ideias).
- `App.jsx`: `<title>` runtime localizado → `` `Philosify — ${t('v2.landing.tagline')}` `` (chave existente,
  traduzida nos **18**; EN "The final word is always yours", PT "A palavra final é sempre sua"). Sem chave nova.
- **Orbitron NÃO removida (decisão de verificação):** não é resquício — está em uso em 8+ folhas
  (`homepage/layout/landing/modal-cyberpunk/modal-features/results/music-sidebar.css`, `MusicAnalysis.jsx`,
  `ComingSoon*`), várias com `@import` próprio. Remover o preload do `index.html` não elimina Orbitron e ainda
  arriscaria FOUT. Item opcional **descartado** com razão registrada.

### Build & deploy
- **Worker dry-run:** verde (bundle OK, sem erro de sintaxe nos 3 arquivos). **Site build:** `✓ built in 51s`.
- **Deploy worker:** Version ID **`afcc7354-f7f0-4f32-80f3-2660a704d21a`** (`--env production`).
- **Deploy site:** deployment **`c42863b5`** (`--branch=production` → philosify.org).
- **Verificação prod:** logo do e-mail → **200 image/png (151 KB)**; `favicon.ico?v=2` → **200, 1951 B** (byte-match);
  `favicon-32x32.png?v=2` → **200, 1364 B** (byte-match); `dist/` confirmou título + SW `v13/runtime-v12` +
  manifest name. (Título/manifest via curl caem no desafio anti-bot da Cloudflare — normal; renderiza no navegador.)

**Commit:** adiado para depois do teu aceite (junto com os relatórios do Bloco 4). **Sem commit até ordem.**

### Aceite pendente (Bob)
1. Reset de senha real → abrir no **Gmail**: visual v2, logo carregando.
2. **Firefox** e **Edge**, aba nova: favicon só-coruja.
3. **Edge** com app instalado: aceitar "atualização do aplicativo" → nome/ícone novos em **Apps**
   (plano B: desinstalar + reinstalar).
4. Aba em **PT**: `<title>` = "Philosify — A palavra final é sempre sua".
