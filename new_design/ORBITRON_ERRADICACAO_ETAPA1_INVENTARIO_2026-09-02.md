# Erradicar Orbitron — ETAPA 1: inventário (somente leitura) · AGUARDANDO OK

**Data:** 2026-09-02 · **Status:** inventário fechado, **nada editado.** Aguardando OK do plano da Etapa 2.

---

## a) Todas as ocorrências de "orbitron" em código (site/)

`grep -ri orbitron` = 113 no repo, mas as de **código** estão em `site/` (11 arquivos, 102 ocorrências). As demais
são docs/relatórios (`new_design/*.md`, `wp_reports/`, `docs/`, `.opencode/`) — fora de `site/`/`ads/`.

| arquivo | occ | forma |
|---|---|---|
| `index.html` | 2 | preload + stylesheet (linhas 57–65) |
| `styles/results.css` | 18 | `@import` (+**Exo 2**) + `font-family` |
| `styles/music-sidebar.css` | 34 | `font-family` (sem @import próprio) |
| `styles/modal-cyberpunk.css` | 16 | `@import` + `font-family` |
| `styles/modal-features.css` | 5 | `font-family` |
| `styles/landing.css` | 12 | `@import` + `font-family` |
| `styles/homepage.css` | 5 | `font-family` |
| `styles/layout.css` | 1 | `font-family` (header centralizado top:71px) |
| `pages/MusicAnalysis.jsx` | 4 | inline `@import` (+**Exo 2**) + `fontFamily` |
| `pages/ComingSoon.jsx` | 3 | inline `fontFamily` |
| `components/ComingSoonSidebar.jsx` | 2 | inline `fontFamily` |

**`ads/`: ZERO Orbitron.** O `ads/src/styles/global.css` usa **Fraunces + Manrope** (identidade própria do
ads.philosify.org, não cyberpunk) — **fora de escopo, não mexer.**

## b) Vivo × morto (via Router.jsx)

**Carga do CSS:** `main.jsx → styles/global.css`, que `@import`a `layout.css`, `results.css`, `modal-cyberpunk.css`,
`modal-features.css` (+ tokens/base/etc.). Logo esses 4 **carregam em toda página** (o `@import` de fonte dispara),
mas só **renderizam** onde os seletores batem.

**MORTO — inalcançável pelo Router (nenhuma tag monta):**
- **Sidebars** `CinemaSidebar/MusicSidebar/NewsSidebar/LiteratureSidebar/QuizSidebar/UnsafeZoneSidebar` +
  `NewsSourcePicker` + `ComingSoonSidebar`: os v2 pages usam só os **hooks** (`useCinemaSidebar`…), nunca
  `<CinemaSidebar>` — não existe essa tag em lugar nenhum. (Router: *"the sidebar architecture is retired"*.)
- **`LoginModal`/`SignupModal`/`ForgotPasswordModal`**: renderizados **só dentro** dos sidebars mortos.
- **Páginas v1** `HomePage.jsx`, `MusicAnalysis.jsx`, `ComingSoon.jsx` e o componente `LandingScreen.jsx`:
  nenhum import/rota os alcança (v2 tem LandingPage/MusicPage/etc.).
- **CSS órfão** (só importado por morto): **`music-sidebar.css`** (34), **`landing.css`** (12), **`homepage.css`** (5).
- **`modal-features.css`** (5): seletores `.legal-modal`, `.current-balance-*`, `.legal-content h3` — chrome v1;
  o v2 usa `LegalPage`/`legal.css` e `.pay-balance-*`. **Não renderiza** (morto), mas o arquivo carrega global.

**VIVO — Orbitron renderiza em página alcançável:**
- **`modal-cyberpunk.css`** (16): todos os Orbitron em `.auth-modal h2`, `.form-group label`, `.form-input`,
  `.form-button`, `.auth-switch`, `.auth-divider span`, `.auth-disclaimer`, `.auth-email-sent__*`, etc.
  → a **`ResetPasswordPage`** (`/reset-password`, VIVA) usa exatamente `.auth-modal`/`.form-group`/`.form-input`/
  `.form-button`/`.auth-switch`. **Hoje o reset mostra Orbitron** no título, labels, inputs e botões. ← tela-alvo nº1.
- **`results.css`** (18 + Exo 2): view de resultados legada renderizada por **`<App/>`** em `/app` e como **backdrop
  de `/reset-password`**. Semi-vivo (aparece esmaecido atrás do modal de reset e cheio em `/app`). ← tela-alvo nº2.
- **`layout.css`** (1): `font-family:'Orbitron','League Gothic'` num header centralizado (top:71px) — chrome v1;
  confirmar se aparece em `/app`. ← verificar na captura.
- **`index.html`** (2): carrega o Orbitron globalmente (preload+link) — **origem da fonte em toda página.**

## c) Outras fontes da era antiga

- **Exo 2** — `results.css:5` e `MusicAnalysis.jsx:18` (junto do Orbitron). **Erradicar no mesmo passe** → Inter.
- **Rajdhani / Share Tech / Audiowide / Teko / Aldrich / Syncopate / Chakra** — `grep` = **nenhuma** em site/.
- Fontes **v2 a preservar**: **Michroma** (display/títulos), **Inter** (corpo/UI), **Newsreader** (leitura, legal).
- `localeFonts.js` — loader dinâmico por idioma (fontes de script CJK/árabe/etc.), **não** cyberpunk — manter.

## Plano proposto (ETAPA 2) — **substituir em lugar, sem deletar arquivos**

Motivo de não deletar: os arquivos mortos (sidebars, modais, páginas v1, CSS órfão) são ~15+ e estão entrelaçados
com `components/index.js` re-exports e imports; deletá-los é um **refactor de dead-code** maior e arriscado, fora do
escopo "erradicar Orbitron". A via segura para o critério **zero orbitron**:

1. **Remover os `@import` de fonte** Orbitron/Exo 2: `results.css`, `modal-cyberpunk.css`, `landing.css`,
   e o `@import` inline do `MusicAnalysis.jsx`.
2. **Trocar `font-family`** em todas as folhas (vivas e mortas) e nos inline JSX:
   - **títulos/display** (`.auth-modal h2`, headings) → **Michroma**;
   - **UI/labels/botões/links/corpo** (a maioria) → **Inter**;
   - **Exo 2** → **Inter**.
3. **`index.html`:** remover o preload+link do Orbitron (57–65). **Cuidado:** esse link também traz **Inter 600;700**;
   vou **mover esses pesos** para o link v2 (Michroma+Inter+Newsreader) para não perder peso de fonte. Fica só
   Michroma + Inter(400;500;600;700) + Newsreader.
4. **Ajuste fino:** a troca muda métrica (Orbitron é largo; Inter/Michroma não) → conferir `letter-spacing`/
   `line-height` nas telas vivas (reset-password, /app) para não quebrar layout.

**Telas a capturar (ETAPA 3):** `/reset-password` (principal), `/app` (results legado), e spot-check de 1–2 module
pages (p/ garantir que a troca no CSS global não vazou em página v2). Critério: `grep -ri orbitron` em `site/`+`ads/`
= **0**; build verde; sem FOUT/quebra.

**Ponto aberto (decisão):**
- **(A)** substituir-em-lugar (recomendo, seguro) **ou (B)** deletar os arquivos mortos de vez (mais limpo, mais
  arriscado — exige remover imports/re-exports; posso listar a árvore exata antes)?

**Nada será editado antes do teu OK.**

---

## ETAPA 2 — EXECUTADO (2026-09-02) · opção (A) substituir em lugar

**11 arquivos.** Método: script determinístico (remove `@import` Orbitron/Exo 2; `'Orbitron'`→`'Inter'`;
`'Exo 2'`→`'Inter'`; header `'Orbitron','League Gothic'`→`'Michroma'`) + ajustes manuais de título.

- **7 CSS:** `results.css` (@import removido, 17 orb + 2 exo → Inter), `music-sidebar.css` (34→Inter),
  `modal-cyberpunk.css` (@import removido, 15→Inter **+ `.auth-modal h2`→Michroma**), `modal-features.css` (5→Inter),
  `landing.css` (@import removido, 10→Inter + 1 comentário corrigido), `homepage.css` (5→Inter),
  `layout.css` (header `top:71px` → **Michroma**).
- **3 JSX (mortos):** `MusicAnalysis.jsx` (@import inline removido, 3 orb + 3 exo → Inter), `ComingSoon.jsx` (3→Inter),
  `ComingSoonSidebar.jsx` (2→Inter).
- **`index.html`:** removido preload+link do Orbitron; **Inter 600;700 mesclados** no link v2
  (Michroma + Inter:400;500;600;700 + Newsreader); preload mantido (perf).
- **Título vivo (reset):** `.auth-modal h2` → Michroma; ajuste fino (Michroma é largo): `font-size 18→15px`,
  `letter-spacing 1.5→0.5px`, `font-weight 700→400` (Michroma só tem 400). Glow ciano mantido (passe foi só de fonte).

**Mapa de fontes:** títulos/display → **Michroma**; UI/labels/botões/corpo → **Inter**; Exo 2 → **Inter**.

### Critério de aceite
- **`grep -ri "orbitron" site/` = 0** ✓ · **`exo` (fonte) = 0** ✓ (os hits de "exo" são `indexOf`/`sexo`/binários).
- **Build:** `✓ 25.85s` (verde).
- **Screenshots (preview do build, localhost:4173):**
  - **Modal de reset** (`.auth-modal`, CSS global — render fiel): título **"SET A NEW PASSWORD" em Michroma**
    (cabe, 2 linhas), labels/botão **Inter**, olho integrado. Sem Orbitron, sem FOUT.
  - **Landing v2** e **/music**: wordmark + títulos de módulo em **Michroma**, corpo **Inter**, layout intacto —
    a carga global (results/modal-cyberpunk) **não vazou** nas páginas v2.
  - **`/app` e o header v1 (layout.css):** o `<App/>` legado **redireciona pra `/`** sem estado de análise →
    a view de resultados legada **não é alcançável** por usuário; a troca de fonte ali é inerte (feita só p/ o grep-zero).

**Pendente:** teu aceite dos screenshots → deploy no próximo ciclo + commit próprio
"identidade: erradica orbitron e exo 2 do site". **Sem deploy/commit até o aceite.**
