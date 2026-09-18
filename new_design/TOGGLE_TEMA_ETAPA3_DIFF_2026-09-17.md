# Toggle de tema — Etapa 3 · diff para OK (não aplicado) · 17/09/2026

**OK do Bob (17/09) na opção (a):** ThemeBar `variant="inline"` como último item do FooterV2 da landing
(`margin-left:auto` no desktop; última linha no mobile ≤640px com alvo 44px), remoção do `<ThemeBar/>` flutuante de
`LandingPage.jsx:105` e das regras fixed/bottom/safe-area do CSS, V2Gallery com a mesma variante.

**Estado:** diff gerado sobre `0661fc3`, salvo em `new_design/TOGGLE_TEMA_ETAPA3_DIFF_2026-09-17.patch` (132 linhas,
`git apply --check` limpo), **working tree revertido — nada aplicado, nada buildado, nada commitado.** Após o OK:
`git apply new_design/TOGGLE_TEMA_ETAPA3_DIFF_2026-09-17.patch` → build → deploy → capturas antes/depois.

## Resumo do diff (5 arquivos, +22 −14)

| Arquivo | Mudança |
|---|---|
| `components/v2/ThemeBar.jsx` | prop `variant` (padrão `'inline'`) → `class="themebar inline"`; comentário com a decisão |
| `components/v2/FooterV2.jsx` | prop `end`, renderizada **depois do `</nav>`** como último filho do `<footer>` |
| `pages/v2/LandingPage.jsx` | `<FooterV2 variant="landing" end={<ThemeBar variant="inline" />}>`; remove o `<ThemeBar />` solto (linha 105) |
| `pages/V2Gallery.jsx` | `<ThemeBar variant="inline" />` (galeria DEV) |
| `styles/v2-components.css` | `.themebar` perde `position:fixed/bottom/left/transform/z-index/backdrop-filter`; ganha `.themebar.inline{flex:none;margin-left:auto}`; removidas as duas regras `bottom` (≤600px e safe-area); no bloco ≤640px, `.themebar.inline{margin-left:0}` (última linha, alinhada à esquerda como as linhas de links; `padding:13px 18px` dos botões mantido = alvo 44px) |

**Por que `end` fora do `nav` e não "último `<a>` do nav":** `footer.landing` é `display:flex; justify-content:space-between`
com o `nav` como único filho; um `margin-left:auto` DENTRO do `nav` não alcança a borda direita porque o `nav` não
estica. Como segundo filho do footer, o `space-between` já o coloca à direita no desktop, e no ≤640px o footer vira
coluna e o toggle é a última linha. O `margin-left:auto` pedido fica na regra `.inline` (redundante com o
space-between, inofensivo).

**Ponto a conferir nas capturas "depois":** entre ~640px e ~900px o `nav` (7 links + gap 22px ≈ 600px) e o toggle
(165px) dividem a linha sem `flex-wrap`; se apertar, o ajuste é `flex-wrap:wrap` em `footer.landing` — só se a captura
de 820px mostrar.

Nenhum outro CSS referencia `.themebar` (grep em `site/src/**/*.css`). `utils/theme.js` intocado.

## Patch

```diff
diff --git a/site/src/components/v2/FooterV2.jsx b/site/src/components/v2/FooterV2.jsx
index 6111137..d402c23 100644
--- a/site/src/components/v2/FooterV2.jsx
+++ b/site/src/components/v2/FooterV2.jsx
@@ -1,8 +1,9 @@
 // FooterV2 - v2 footer, links only (ruling 30 Jul 2026: no lockup here —
-// the brand lives in the permanent fixed bar).
+// the brand lives in the permanent fixed bar). `end` renders after the
+// nav as the footer's last item (landing: the inline theme switch).
 import { useTranslation } from 'react-i18next';
 
-export function FooterV2({ variant = 'module', links, children }) {
+export function FooterV2({ variant = 'module', links, children, end }) {
   const { t } = useTranslation();
   return (
     <footer className={variant}>
@@ -18,6 +19,7 @@ export function FooterV2({ variant = 'module', links, children }) {
           </>
         )}
       </nav>
+      {end}
     </footer>
   );
 }
diff --git a/site/src/components/v2/ThemeBar.jsx b/site/src/components/v2/ThemeBar.jsx
index fe38517..2e34a26 100644
--- a/site/src/components/v2/ThemeBar.jsx
+++ b/site/src/components/v2/ThemeBar.jsx
@@ -1,15 +1,18 @@
-// ThemeBar - landing theme switch (Black / White), wired to utils/theme
+// ThemeBar - landing theme switch (Black / White), wired to utils/theme.
+// Ruling 17 Sep 2026: the switch lives INLINE in the landing footer (it
+// used to float fixed at the viewport bottom and covered cards and footer
+// links while scrolling). `variant` is the placement class.
 import { useState } from 'react';
 import { getTheme, setTheme } from '../../utils/theme';
 
-export function ThemeBar() {
+export function ThemeBar({ variant = 'inline' }) {
   const [theme, setLocal] = useState(getTheme());
   const pick = (t) => {
     setTheme(t);
     setLocal(t);
   };
   return (
-    <div className="themebar" role="group" aria-label="Background theme">
+    <div className={`themebar ${variant}`} role="group" aria-label="Background theme">
       <button className={theme === 'dark' ? 'on' : ''} onClick={() => pick('dark')}>
         Black
       </button>
diff --git a/site/src/pages/V2Gallery.jsx b/site/src/pages/V2Gallery.jsx
index 1b36db4..a36c99f 100644
--- a/site/src/pages/V2Gallery.jsx
+++ b/site/src/pages/V2Gallery.jsx
@@ -194,7 +194,7 @@ export default function V2Gallery() {
         </ModalV2>
       </Section>
 
-      <ThemeBar />
+      <ThemeBar variant="inline" />
     </PageShell>
   );
 }
diff --git a/site/src/pages/v2/LandingPage.jsx b/site/src/pages/v2/LandingPage.jsx
index 61d2828..6b95dce 100644
--- a/site/src/pages/v2/LandingPage.jsx
+++ b/site/src/pages/v2/LandingPage.jsx
@@ -75,7 +75,7 @@ export default function LandingPage() {
           ))}
         </main>
 
-        <FooterV2 variant="landing">
+        <FooterV2 variant="landing" end={<ThemeBar variant="inline" />}>
           <a href="https://philosify.org">philosify.org</a>
           <a href="https://ads.philosify.org" target="_blank" rel="noopener noreferrer">
             {t('v2.landing.adsAtelier', 'Ads Ateliê')}
@@ -102,7 +102,6 @@ export default function LandingPage() {
         </FooterV2>
       </div>
 
-      <ThemeBar />
       <V2ModalsHost />
     </div>
   );
diff --git a/site/src/styles/v2-components.css b/site/src/styles/v2-components.css
index 6eca91c..eaa310c 100644
--- a/site/src/styles/v2-components.css
+++ b/site/src/styles/v2-components.css
@@ -352,10 +352,12 @@
 .v2 footer a{color:var(--dim);text-decoration:none}
 .v2 footer a:hover{color:var(--ink)}
 
-/* ---------- Theme bar (landing) ------------------------------- */
-.v2 .themebar{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:5;
- display:flex;gap:6px;padding:6px;border:1px solid var(--line);border-radius:999px;
- background:var(--bg);backdrop-filter:blur(8px)}
+/* ---------- Theme bar (landing footer, inline) ----------------
+   Ruling 17 Sep 2026: in the flow, never fixed — a fixed pill covered
+   cards and footer links on every viewport that scrolls. */
+.v2 .themebar{display:flex;gap:6px;padding:6px;border:1px solid var(--line);border-radius:999px;
+ background:var(--bg)}
+.v2 .themebar.inline{flex:none;margin-left:auto}
 .v2 .themebar button{font:500 10.5px/1 var(--fu);letter-spacing:.12em;text-transform:uppercase;
  color:var(--low);background:none;border:0;border-radius:999px;padding:8px 16px;cursor:pointer}
 /* C.5 shadow sweep: ring drawn with outline, not box-shadow */
@@ -370,7 +372,7 @@
 /* ---------- Breakpoints (landing master) ---------------------- */
 @media (max-width:900px){.v2 .modules{grid-template-columns:repeat(2,1fr)}}
 @media (max-width:860px){.v2 .page{padding-left:26px;padding-right:26px}.v2 .navr{right:60px}.v2 .hdr .hud-status{display:none}}
-@media (max-width:600px){.v2 .modules{grid-template-columns:1fr}.v2 .themebar{bottom:12px}}
+@media (max-width:600px){.v2 .modules{grid-template-columns:1fr}}
 
 /* ---------- WP6.1 mobile pass (360-430 baseline) ---------------
    Flex-item min-width guard: the landing mounts .page as a flex-column
@@ -382,7 +384,6 @@
    (its .hdr height/padding already carry the env() terms); remaining
    fixed chrome respects safe-area insets. */
 .v2 .hc.bl,.v2 .hc.br{bottom:calc(22px + env(safe-area-inset-bottom,0px))}
-.v2 .themebar{bottom:calc(18px + env(safe-area-inset-bottom,0px))}
 .v2 .page{padding-left:max(48px,env(safe-area-inset-left,0px));padding-right:max(48px,env(safe-area-inset-right,0px))}
 
 /* Long unbreakable data (song titles, hashes, session codes) wraps */
@@ -417,6 +418,9 @@
   top:calc(var(--hdrh) + env(safe-area-inset-top,0px) + 8px);
   grid-template-columns:repeat(4,1fr);min-width:0;max-height:min(58vh,420px);overflow-y:auto}
  .v2 .acctmenu.langgrid a{padding:13px 8px}
+ /* footer stacks as a column here: the switch is its last line, left-
+    aligned like the link rows, 44px touch targets */
+ .v2 .themebar.inline{margin-left:0}
  .v2 .themebar button{padding:13px 18px}
  .v2 .btnp{padding:16px 24px}
  .v2 .btns{padding:15px 23px}
```
