# Metodologia — ETAPA 2 · 18 idiomas + página + rota + pontos de entrada · DIFF PARA OK DE COMMIT+DEPLOY · 16/09/2026

**Base:** canônico PT `docs/philosify-metodologia-canonical-PT.md` (verificado: cinco termos + item da arte, 10 itens na §2);
EN validado pelo Bob em 16/09 (`METODOLOGIA_EN_RASCUNHO_2026-09-16.md`, 10 escolhas ratificadas).
**Decisões de 01/09 aplicadas:** `MethodologyPage.jsx` dedicado; rota `/methodology`; 4 pontos de entrada; rótulo PT da UI
→ "Doutrinariamente Conformista".
**Estado:** aplicado no working tree, build ok, amostragem en/pt/zh conferida no preview local. **Nada commitado, nada
deployado.** Aguarda o OK do Bob para commit + deploy.

---

## 1. Traduções (16 + en + pt) — `new_design/metodologia_i18n_2026-09-16/<xx>.md`

Fonte de cada tradução: EN (referência) com o PT ao lado. Rótulos extraídos por script de cada `xx.json` (não da tabela de
01/09) e cravados no texto. Cada `.md` foi convertido para HTML (h2 / p / ul / table) e inserido em `xx.json` como
`legal.methodology.{title,content}` + `v2.legal.{methodologyTitle,methodologyLink}` — inserção textual, CRLF preservado,
`JSON.parse` conferido, ordem de chaves intacta.

**Invariantes conferidos língua a língua por script** (`check_meth.mjs`): 1 H1 · 5 H2 · 10 itens na §2 · 5 princípios na
§3 · tabela 40/20/20/10/10 com os 5 eixos exatos da UI · escala −10/+10 · polos exatos da UI · nome exato do Painel ·
266 / 2.600 · SHA-256 · assinatura em itálico · frase −8/+6 · os cinco termos na ordem · setas do procedimento · sem
"egoísmo" · Ayn Rand · JSON com `content` de 5 `<h2>`.

| xx | título | "régua" | cinco termos (fim da frase do polo revolucionário) | notas do tradutor |
|---|---|---|---|---|
| en | Methodology | yardstick | the real, the true, the good, the just and the beautiful | validado 16/09 |
| pt | Metodologia | régua | o real, o verdadeiro, o bom, o justo e o belo | canônico, sem alteração |
| es | Metodología | vara de medir | lo real, lo verdadero, lo bueno, lo justo y lo bello | tratamento *usted*; "Panel de Filosofos" sem acento = UI |
| fr | Méthodologie | étalon | le réel, le vrai, le bien, le juste et le beau | tipografia FR (espaços insecáveis, « »); "2 600"; **"40%" sem espaço** (norma FR seria "40 %") |
| it | Metodologia | metro | il reale, il vero, il buono, il giusto e il bello | *tu* nas §4–5 |
| de | **Methodik** | Maßstab | das Wirkliche, das Wahre, das Gute, das Gerechte und das Schöne | título "Methodik" (o método) e não "Methodologie" (teoria dos métodos) — **decidir**; "ruling" → Richterspruch para reservar "Urteil" ao veredito |
| nl | Methodologie | maatstaf | het werkelijke, het ware, het goede, het rechtvaardige en het schone | *je*; "ruling" → vonnis |
| pl | Metodologia | miara | tego, co rzeczywiste, prawdziwe, dobre, sprawiedliwe i piękne | "Panel Filozofow" sem ó = UI (parece erro ao leitor PL — herdado da UI) |
| hu | Módszertan | mérce | a valóságosról, az igazról, a jóról, az igazságosról és a szépről | "Filozofus Panel" sem ó = UI (idem); polos sem sufixo de caso |
| tr | Metodoloji | ölçüt | gerçek olanı, doğru olanı, iyi olanı, adil olanı ve güzel olanı | **"40%"** (norma TR seria "%40") — decidir |
| hi | कार्यप्रणाली | मापदंड | वास्तविक, सत्य, शुभ, न्यायसंगत और सुंदर | Objetivismo = वस्तुनिष्ठवाद (derivado do adjetivo já usado em hi.json) |
| zh | 方法论 | 标尺 | 真实、真理、善、正义与美 | 客观主义 = zh.json |
| ja | 方法論 | 物差し | 現実なるもの、真なるもの、善なるもの、正義なるもの、美なるもの | 客観主義 = ja.json; primeira menção com glosa オブジェクティビズム |
| ko | 방법론 | 잣대 | 실재와 참과 선과 정의와 아름다움 | 객관주의 = ko.json; registro -다 |
| ru | Методология | мерило | реальное, истинное, доброе, справедливое и прекрасное | polos femininos da UI mantidos entre « » como rótulos; "ruling" → приговор |
| ar | المنهجية | مقياس | الواقعي والحقيقي والخيّر والعادل والجميل | polo negativo argumentado sobre "محافظ" (a palavra da UI); setas do procedimento em ← (fluxo RTL); "ruling" → قرار قضائي |
| fa | روش‌شناسی | معیار | واقعی، حقیقی، نیک، عادلانه و زیبا | "2,600" em algarismos ocidentais (norma FA seria ۲٬۶۰۰) — decidir; setas ←; "ruling" → رأی قطعی |
| he | מתודולוגיה | אמת מידה | הממשי, האמיתי, הטוב, הצודק והיפה | "פאנל פילוסופים" sem artigo (nome próprio); escala "בין −10 ובין +10" para não colidir hífen/menos; setas ←; "ruling" → הכרעה |

Argumento do "prefixo": em cada língua a frase passou a argumentar sobre a(s) palavra(s) real(is) do rótulo da UI
("doctrinaire"/"Extremely", "doktrinär"/"extrem", "教条"/"极度", …), como no EN ratificado.

## 2. Código — arquivos

| Arquivo | Mudança |
|---|---|
| `site/src/pages/v2/MethodologyPage.jsx` | **novo** — padrão do LegalPage (PageShell interior + ModuleHeader + DOMPurify default + índice pelos `<h2>`), **sem** ticker e **sem** crossdoc; classes `pg-legal pg-methodology` |
| `site/src/components/v2/MethodologyLink.jsx` | **novo** — `<Link to="/methodology">` com `v2.legal.methodologyLink` + " →", classe `.mlink` |
| `site/src/Router.jsx` | lazy import + `<Route path="/methodology">` após `/pp` |
| `site/src/components/v2/AnalysisStack.jsx` | `Verdict`: `.vlabel` passa a viver num `.vhead` (flex, espaço-entre) com o `MethodologyLink` à direita → cobre música, cinema, literatura e as compartilhadas `/a/:slug` |
| `site/src/pages/v2/ideas/ColloquiumDetail.jsx`, `DebateDetail.jsx` | mesmo `.vhead` no veredito de Ideias |
| `site/src/pages/v2/NewsPage.jsx`, `site/src/pages/SharedAnalysis.jsx` (ramo news) | `<p class="methrow">` com o link logo abaixo das 4 caixas |
| `site/src/pages/v2/PanelPermalink.jsx` | `<p class="methrow">` após os cards do painel (`/panel/:id`) |
| `site/src/pages/v2/LandingPage.jsx` | linha `.methline` logo abaixo de "Selecione um módulo" (o ponto de 01/09) **+ link no rodapé da landing** (ver §3) |
| `site/src/components/v2/FooterV2.jsx` | link `/methodology` **+ "Terms"/"Privacy" passam a traduzidos** (ver §3) |
| `site/src/styles/v2-components.css` | `.vhead`, `.mlink` (registro do `.vlabel`, cor `--silver`, `min-height:0`), `.methrow`, `.methline` |
| `site/src/styles/v2-pages/legal.css` | tabela dos eixos no registro de leitura (th em caixa-alta rastreada, coluna do peso tabular) + `em` em `--dim` |
| `site/src/i18n/translations/*.json` (18) | `legal.methodology`, `v2.legal.methodologyTitle/Link`; **pt.json**: `doctrinaireConformist` → "Doutrinariamente Conformista" |

Diff completo de código (sem os JSON) no fim deste relatório (§7). JSON: +6/+8 linhas por idioma, só inserções, exceto a
troca do rótulo em pt.

## 3. Além do mapeado em 01/09 — sinalizado para decisão

1. **Rodapé: "Terms" e "Privacy" traduzidos.** No `FooterV2` eram hardcoded em inglês; com "Metodologia" traduzido ao lado,
   o rodapé dos módulos ficaria "Terms · Privacy · Metodologia". Passei os dois para as chaves `v2.landing.terms/privacy`,
   que já existem nos 18. Reverter = 2 linhas.
2. **Link também no rodapé da landing.** A landing tem rodapé próprio (children do FooterV2, com Termos/Privacidade
   traduzidos); sem o link ali, seria o único rodapé sem Metodologia. Fica com dois pontos na landing (linha sob o
   "selecione um módulo" + rodapé). Reverter = 3 linhas.
3. **`.mlink{min-height:0}`** para vencer o `a{min-height:44px}` de `responsive.css` em ≤560px (o link é item flex no
   `.vhead`; sem isso a linha do rótulo do veredito cresceria a 44px no celular — o hazard já registrado).
4. **`.prose em{color:var(--dim)}`** em `legal.css` (a assinatura em itálico); vale também para /tos e /pp se um dia tiverem
   `<em>` (hoje não têm).
5. Título alemão "Methodik" (tradutor) — ver tabela §1. Percentuais em fr/tr mantidos como "40%" pelo invariante.

## 4. Verificação (preview local do build, Chrome)

| Checagem | Resultado |
|---|---|
| `npm run build` | ok (32 s), sem erro |
| `/methodology` en | título METHODOLOGY, 5 seções no índice, tabela 5×3 renderizada (DOMPurify default mantém `<table>`), 15 `<li>`, assinatura em itálico |
| `/methodology` pt | METODOLOGIA; "Doutrinariamente Conformista" e "o real, o verdadeiro, o bom, o justo e o belo" presentes; 266 presente |
| `/methodology` zh | 方法论; 5 seções no índice (一把公开的标尺 / 为什么是客观主义 / Philosify 如何评价 / …); tabela 5 linhas; 15 `<li>`; assinatura "Philosify 创始人 Bob Rach"; polos 教条守旧 / 极度革命性 e os cinco termos 真实、真理、善、正义与美 presentes; 266 presente |
| `/methodology` he (extra, RTL) | מתודולוגיה; texto alinhado à direita como em /tos; tabela 5 linhas, `th` com `text-align:start`; polos קונפורמי דוקטרינרי / מהפכני ביותר presentes |
| Landing (pt) | "METODOLOGIA →" sob "SELECIONE UM MÓDULO"; rodapé com Metodologia |
| Rodapé dos módulos (/music) | "Metodologia → /methodology" |
| Bloco de veredito | galeria `/dev/v2` (Verdict de exemplo): "PHILOSIFY VERDICT" à esquerda, "METHODOLOGY →" à direita na mesma linha, 11px de altura, href `/methodology` |
| Ideias / Notícias / Painel / compartilhadas | **não visíveis sem login no preview** (os endpoints exigem sessão) — mudança estrutural idêntica ao Verdict (`.vhead`/`.methrow`), coberta pelo build; conferir em produção após o deploy |

## 5. Regressão a observar no aceite

- `/tos` e `/pp` (LegalPage intocado; só `legal.css` ganhou regras de tabela/em, que não afetam os textos legais atuais).
- Veredito em música/cinema/literatura: o `.vlabel` mudou de filho direto do `.verdict` para filho do `.vhead` — nenhuma
  regra CSS dependia da relação direta (`grep` em `styles/`: só `.v2 .vlabel{…}`).
- Rótulo PT do polo: qualquer análise em PT classificada no polo passa a mostrar "Doutrinariamente Conformista".

## 6. Commit + deploy (após o OK)

```bash
git add site/src/pages/v2/MethodologyPage.jsx site/src/components/v2/MethodologyLink.jsx site/src/Router.jsx \
  site/src/components/v2/AnalysisStack.jsx site/src/components/v2/FooterV2.jsx site/src/pages/SharedAnalysis.jsx \
  site/src/pages/v2/LandingPage.jsx site/src/pages/v2/NewsPage.jsx site/src/pages/v2/PanelPermalink.jsx \
  site/src/pages/v2/ideas/ColloquiumDetail.jsx site/src/pages/v2/ideas/DebateDetail.jsx \
  site/src/styles/v2-components.css site/src/styles/v2-pages/legal.css site/src/i18n/translations/ \
  docs/philosify-metodologia-canonical-PT.md new_design/METODOLOGIA_ETAPA1_MAPEAMENTO_2026-09-01.md \
  new_design/METODOLOGIA_EN_RASCUNHO_2026-09-16.md new_design/METODOLOGIA_ETAPA2_EXECUCAO_2026-09-16.md \
  new_design/metodologia_i18n_2026-09-16/
git commit -m "metodologia: pagina /methodology em 18 idiomas, link em todos os vereditos, landing e rodape; polo pt vira doutrinariamente conformista"
git push origin redesign/v2
cd site && npm run build && wrangler pages deploy dist --project-name=philosify-frontend --branch=production
```

## 7. Diff de código (sem i18n)

```diff
diff --git a/site/src/Router.jsx b/site/src/Router.jsx
index b5fe041..2a2de94 100644
--- a/site/src/Router.jsx
+++ b/site/src/Router.jsx
@@ -40,6 +40,7 @@ const UnsafeZonePage = lazy(() => import('./pages/v2/UnsafeZonePage'));
 const SignInPage = lazy(() => import('./pages/v2/SignInPage'));
 const SignUpPage = lazy(() => import('./pages/v2/SignUpPage'));
 const LegalPage = lazy(() => import('./pages/v2/LegalPage'));
+const MethodologyPage = lazy(() => import('./pages/v2/MethodologyPage'));
 
 // Dev-only v2 component gallery (WP2 acceptance surface; absent from builds)
 const V2Gallery = import.meta.env.DEV ? lazy(() => import('./pages/V2Gallery')) : null;
@@ -157,6 +158,7 @@ export function Router() {
           {/* Legal pages (v2, real ToS/PP text via i18n) */}
           <Route path="/tos" element={<LegalPage doc="terms" />} />
           <Route path="/pp" element={<LegalPage doc="privacy" />} />
+          <Route path="/methodology" element={<MethodologyPage />} />
 
           {/* Reset password shows app behind the modal overlay */}
           <Route
diff --git a/site/src/components/v2/AnalysisStack.jsx b/site/src/components/v2/AnalysisStack.jsx
index e686e89..63d5a91 100644
--- a/site/src/components/v2/AnalysisStack.jsx
+++ b/site/src/components/v2/AnalysisStack.jsx
@@ -3,6 +3,7 @@
 // rationale), AudioBar, ExpandableSection, ActionsRow, AdSlot, TrackCard.
 import { useState } from 'react';
 import DOMPurify from 'dompurify';
+import { MethodologyLink } from './MethodologyLink.jsx';
 
 // Display formatting: true minus sign for negative scores (tabular numerals).
 export function formatSignedScore(score) {
@@ -85,7 +86,10 @@ export function verdictRationale(result, t, band) {
 export function Verdict({ label = 'Philosify Verdict', note, classification, scoreLine, rationale }) {
   return (
     <div className="verdict">
-      <span className="vlabel">{label}</span>
+      <div className="vhead">
+        <span className="vlabel">{label}</span>
+        <MethodologyLink />
+      </div>
       <div className="vgrid">
         {note != null && <span className="note9">{note}</span>}
         {classification && <span className="classif">{classification}</span>}
diff --git a/site/src/components/v2/FooterV2.jsx b/site/src/components/v2/FooterV2.jsx
index e29b00a..6111137 100644
--- a/site/src/components/v2/FooterV2.jsx
+++ b/site/src/components/v2/FooterV2.jsx
@@ -1,6 +1,9 @@
 // FooterV2 - v2 footer, links only (ruling 30 Jul 2026: no lockup here —
 // the brand lives in the permanent fixed bar).
+import { useTranslation } from 'react-i18next';
+
 export function FooterV2({ variant = 'module', links, children }) {
+  const { t } = useTranslation();
   return (
     <footer className={variant}>
       <nav>
@@ -8,8 +11,9 @@ export function FooterV2({ variant = 'module', links, children }) {
           <>
             <a href="https://philosify.org">philosify.org</a>
             {links}
-            <a href="/tos">Terms</a>
-            <a href="/pp">Privacy</a>
+            <a href="/tos">{t('v2.landing.terms', 'Terms')}</a>
+            <a href="/pp">{t('v2.landing.privacy', 'Privacy')}</a>
+            <a href="/methodology">{t('v2.legal.methodologyLink', 'Methodology')}</a>
             <a href="#">© 2026</a>
           </>
         )}
diff --git a/site/src/pages/SharedAnalysis.jsx b/site/src/pages/SharedAnalysis.jsx
index f9a5970..b6d7be3 100644
--- a/site/src/pages/SharedAnalysis.jsx
+++ b/site/src/pages/SharedAnalysis.jsx
@@ -21,6 +21,7 @@ import {
   formatSignedScore,
   verdictRationale,
 } from '../components/v2';
+import { MethodologyLink } from '../components/v2/MethodologyLink.jsx';
 import { ShareButton } from '../components/sharing/ShareButton';
 // The verdict is stored in canonical English; this is the existing map from
 // classification to the UI's own wording. Reused rather than copied — there are
@@ -413,7 +414,8 @@ export function SharedAnalysis() {
 
       {/* News wears the four-box anatomy; everything else the verdict stack. */}
       {isNews ? (
-        <div className="scan">
+        <>
+          <div className="scan">
           {theFacts && (
             <div className="cell static facts">
               <h2>{t('news.theFactsTitle', 'The Facts')}</h2>
@@ -438,7 +440,11 @@ export function SharedAnalysis() {
               <Prose text={analysis.philosify_opinion || meta.philosify_opinion} />
             </div>
           )}
-        </div>
+          </div>
+          <p className="methrow">
+            <MethodologyLink />
+          </p>
+        </>
       ) : (
         <>
           {(finalScore != null || analysis?.classification) && (
diff --git a/site/src/pages/v2/LandingPage.jsx b/site/src/pages/v2/LandingPage.jsx
index bd036e6..61d2828 100644
--- a/site/src/pages/v2/LandingPage.jsx
+++ b/site/src/pages/v2/LandingPage.jsx
@@ -8,6 +8,7 @@ import { useTranslation } from 'react-i18next';
 import { GridVeil } from '../../components/common';
 import { HudFrame, HeaderBar, Cell, FooterV2, ThemeBar } from '../../components/v2';
 import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
+import { MethodologyLink } from '../../components/v2/MethodologyLink.jsx';
 import { CATALOG } from '../../config/catalog';
 import '../../styles/v2-components.css';
 
@@ -54,6 +55,9 @@ export default function LandingPage() {
         <div className="selectline rv" style={{ animationDelay: '.18s' }}>
           {t('v2.landing.select', 'Select a module')}
         </div>
+        <div className="methline rv" style={{ animationDelay: '.2s' }}>
+          <MethodologyLink />
+        </div>
 
         <main className="modules" style={{ marginTop: 14 }}>
           {MODULES.map(([slug, title, desc], i) => (
@@ -91,6 +95,9 @@ export default function LandingPage() {
           <a href="/pp" onClick={(e) => { e.preventDefault(); navigate('/pp'); }}>
             {t('v2.landing.privacy', 'Privacy')}
           </a>
+          <a href="/methodology" onClick={(e) => { e.preventDefault(); navigate('/methodology'); }}>
+            {t('v2.legal.methodologyLink', 'Methodology')}
+          </a>
           <a href="#c">© 2026</a>
         </FooterV2>
       </div>
diff --git a/site/src/pages/v2/NewsPage.jsx b/site/src/pages/v2/NewsPage.jsx
index 4797150..c4b84cc 100644
--- a/site/src/pages/v2/NewsPage.jsx
+++ b/site/src/pages/v2/NewsPage.jsx
@@ -21,6 +21,7 @@ import {
 } from '../../components/v2';
 import { NavAccount } from '../../components/v2/NavAccount.jsx';
 import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
+import { MethodologyLink } from '../../components/v2/MethodologyLink.jsx';
 import { ShareButton } from '../../components/sharing/ShareButton';
 import { ShareToDMButton } from '../../components/sharing/ShareToDMButton';
 import { ShareToCommunityButton } from '../../components/sharing/ShareToCommunityButton';
@@ -728,6 +729,9 @@ export default function NewsPage() {
                     </div>
                   )}
                 </div>
+                <p className="methrow">
+                  <MethodologyLink />
+                </p>
                 <TTSBar result={activeScan} lang={userLang} t={t} />
                 <div className="actions">
                   {activeScan.id && (
diff --git a/site/src/pages/v2/PanelPermalink.jsx b/site/src/pages/v2/PanelPermalink.jsx
index 4f77e4c..ec4ee91 100644
--- a/site/src/pages/v2/PanelPermalink.jsx
+++ b/site/src/pages/v2/PanelPermalink.jsx
@@ -13,6 +13,7 @@ import { useEffect, useState } from 'react';
 import { useTranslation } from 'react-i18next';
 import { useNavigate, useParams } from 'react-router-dom';
 import { PageShell, Button } from '../../components/v2';
+import { MethodologyLink } from '../../components/v2/MethodologyLink.jsx';
 import { ShareButton } from '../../components/sharing/ShareButton';
 import PanelAnalysisCards from '../../components/results/PanelAnalysisCards.jsx';
 import { useSharedContentLanguage } from '../../hooks';
@@ -107,6 +108,10 @@ export function PanelPermalink() {
 
       <PanelAnalysisCards analysis={panel.analysis} />
 
+      <p className="methrow">
+        <MethodologyLink />
+      </p>
+
       {/* Whoever arrives by a link must be able to pass it on. The link is this
           very route — the same one the modules' share button now generates — so
           the edge already has the localized card for it. Unlike the modules, the
diff --git a/site/src/pages/v2/ideas/ColloquiumDetail.jsx b/site/src/pages/v2/ideas/ColloquiumDetail.jsx
index 856559d..712aefe 100644
--- a/site/src/pages/v2/ideas/ColloquiumDetail.jsx
+++ b/site/src/pages/v2/ideas/ColloquiumDetail.jsx
@@ -11,6 +11,7 @@ import InlineAdSlot from '../../../components/ads/InlineAdSlot.jsx';
 import { ReplyMsg, PhilosopherPoll } from './Transcript.jsx';
 import { AddPhilosopherModal, InviteModal, ConfirmModal } from './IdeasModals.jsx';
 import { VerdictAudio } from './VerdictAudio.jsx';
+import { MethodologyLink } from '../../../components/v2/MethodologyLink.jsx';
 import { formatTimeAgo, formatCountdown, formatChrono, useChronometer, chronoProgress } from './utils.js';
 
 export function ColloquiumDetail({ coll, user, onBack, requireCredits }) {
@@ -307,7 +308,10 @@ export function ColloquiumDetail({ coll, user, onBack, requireCredits }) {
           {/* Verdict — after the transcript so the debate reads first */}
           {localizedWrapup ? (
             <div className="verdict">
-              <span className="vlabel">{t('v2.ideas.wrapupTitle', 'Philosify verdict')}</span>
+              <div className="vhead">
+                <span className="vlabel">{t('v2.ideas.wrapupTitle', 'Philosify verdict')}</span>
+                <MethodologyLink />
+              </div>
               {verdictAudioEndpoint && (
                 <VerdictAudio
                   audioUrl={verdictAudioEndpoint}
diff --git a/site/src/pages/v2/ideas/DebateDetail.jsx b/site/src/pages/v2/ideas/DebateDetail.jsx
index 32d5df7..e5d091b 100644
--- a/site/src/pages/v2/ideas/DebateDetail.jsx
+++ b/site/src/pages/v2/ideas/DebateDetail.jsx
@@ -10,6 +10,7 @@ import InlineAdSlot from '../../../components/ads/InlineAdSlot.jsx';
 import { ReplyMsg } from './Transcript.jsx';
 import { InviteModal, ConfirmModal } from './IdeasModals.jsx';
 import { VerdictAudio } from './VerdictAudio.jsx';
+import { MethodologyLink } from '../../../components/v2/MethodologyLink.jsx';
 import { formatTimeAgo, formatChrono, useChronometer, chronoProgress } from './utils.js';
 
 export function DebateDetail({ debate, lang, user, onBack }) {
@@ -107,7 +108,10 @@ export function DebateDetail({ debate, lang, user, onBack }) {
       {/* Wrap-up — after all replies so the debate reads first */}
       {debate.wrapup ? (
         <div className="verdict">
-          <span className="vlabel">{t('v2.ideas.wrapupTitle', 'Philosify verdict')}</span>
+          <div className="vhead">
+            <span className="vlabel">{t('v2.ideas.wrapupTitle', 'Philosify verdict')}</span>
+            <MethodologyLink />
+          </div>
           {debate.wrapupAudioUrl && <VerdictAudio threadId={ad.id} />}
           {!debate.wrapupAudioUrl && ad.isOwner && (
             <div className="arow">
diff --git a/site/src/styles/v2-components.css b/site/src/styles/v2-components.css
index ca7fbc5..6eca91c 100644
--- a/site/src/styles/v2-components.css
+++ b/site/src/styles/v2-components.css
@@ -214,6 +214,14 @@
 /* Section label of the verdict card + its declared score — the "PHILOSOPHICAL
    POSITIONS" family (ruling 31 Jul): read, not ambient. */
 .v2 .vlabel{font:500 10.5px/1 var(--fu);letter-spacing:.2em;text-transform:uppercase;color:var(--ink-mid)}
+/* Methodology entry link (ruling 1 Sep 2026): the yardstick one click away
+   from every verdict. Same tracked-uppercase register as the label. */
+.v2 .vhead{display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap}
+.v2 .mlink{font:500 10.5px/1 var(--fu);letter-spacing:.18em;text-transform:uppercase;color:var(--silver);text-decoration:none;white-space:nowrap;
+ min-height:0} /* min-height:0 beats responsive.css a{min-height:44px} at ≤560px — the link is a flex item in .vhead */
+.v2 .mlink:hover{color:var(--ink)}
+.v2 .methrow{margin:14px 0 0}
+.v2 .methline{margin-top:10px}
 .v2 .vgrid{display:flex;gap:28px;align-items:baseline;margin-top:12px;flex-wrap:wrap}
 .v2 .note9{font:400 42px/1 var(--fd);color:var(--silver)}
 .v2 .classif{font:400 18px/1.35 var(--fd);letter-spacing:.08em;color:var(--ink)}
diff --git a/site/src/styles/v2-pages/legal.css b/site/src/styles/v2-pages/legal.css
index 21b00e5..b6fb792 100644
--- a/site/src/styles/v2-pages/legal.css
+++ b/site/src/styles/v2-pages/legal.css
@@ -45,6 +45,34 @@
 .v2 .pg-legal .prose ul,
 .v2 .pg-legal .prose ol { margin: 0 0 16px; padding-left: 24px; }
 .v2 .pg-legal .prose a { color: var(--ink); }
+.v2 .pg-legal .prose em { color: var(--dim); }
+
+/* /methodology — the five-axes table, reading register, cell rules */
+.v2 .pg-legal .prose table {
+  width: 100%;
+  border-collapse: collapse;
+  margin: 0 0 16px;
+}
+.v2 .pg-legal .prose th,
+.v2 .pg-legal .prose td {
+  border: 1px solid var(--line);
+  padding: 8px 10px;
+  vertical-align: top;
+  text-align: start;
+  font: 400 14.5px/1.5 var(--fp);
+  color: var(--ink);
+}
+.v2 .pg-legal .prose th {
+  font: 500 10px/1 var(--fu);
+  letter-spacing: 0.16em;
+  text-transform: uppercase;
+  color: var(--low);
+  background: var(--bgcell);
+}
+.v2 .pg-legal .prose td:nth-child(2) {
+  white-space: nowrap;
+  font-variant-numeric: tabular-nums;
+}
 
 /* Contents rail (mockup aside: sticky cell with left-rule links) */
 .v2 .pg-legal .toc {
```

