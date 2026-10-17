# ADS ATELIER · B0 · Constelação fora do ar, segmentação contextual pura — diff + migração gated para OK

**Status:** APROVADO pelo Bob (A–E, 17/10/2026) · aguardando pré-flight · proposto em 16/10/2026 · código aplicado **só no working tree** (nada commitado, nada em deploy; `git checkout -- api/ ads/ site/` desfaz). Decisão de origem: caminho B faseado (`ADS_ATELIER_ETAPA1_INVENTARIO_2026-10-16.md` § 3), B0 = ciclo curto.
**Sequência após o OK:** pré-flight SQL (Bob) → migração gated (Bob) → deploy do worker → deploy do Atelier → deploy do site (três comandos seus) → conferência → commit `ads: constelacao fora do catalogo e segmentacao contextual pura (B0)` junto com o inventário e as capturas.

---

## 1. O que o B0 faz

| Frente | Mudança | Arquivos |
|---|---|---|
| **Catálogo** | `constellation` deixa de ser placement válido em todo validador do worker (pedidos, campanhas, agência, disponibilidade, cotação, lote, serve, serve/batch); a duração só tem a escada do sidebar (5/10/15/20/30 s); o planner não aloca mais constellation (estratégias "reach" e "balanced" redistribuídas só em sidebar); a geração de criativo por IA perde o tamanho 250×250; a previsão de inventário para de criar linhas de constellation; linhas antigas de constellation em `inventory_forecast` são ignoradas na leitura (não quebram) | `orders.js` `campaigns.js` `agency.js` `inventory.js` `planner.js` `serve.js` `creatives.js` `utils.js` |
| **Segmentação contextual pura** | Chaves comportamentais (`genres`, `philosophies`, `engagement`) saem da venda: o POST de pedido passa a validar as chaves de targeting (antes gravava qualquer coisa) com a allowlist contextual `languages, countries, regions, us_states, br_states, content, cities, timezones`; o PATCH usa a mesma lista; `/ads/targeting/options` não anuncia mais as três categorias; estimativa de alcance e sugestões param de considerá-las; **no serve, as três chaves não restringem mais a entrega** (pedidos legados que as carreguem entregam pelas chaves de idioma/mercado) | `orders.js` `targeting.js` `serve.js` |
| **Atelier** | Wizard: opção "Constellation" some; chips de gênero/escola/engajamento somem (ficam idioma, país e conteúdo); página Posicionamentos: só o Sidebar (mockup da Constelação removido); AdPreview: só o shell do sidebar; landing: o cartão "2 formatos de posicionamento" sai (os outros dois ficam; o número morreria de qualquer modo e a tradução ×18 do singular fica dispensada) | `CreateCampaign.jsx` `Placements.jsx` `AdPreview.jsx` `Landing.jsx` |
| **Produto** | Os **7** `InlineAdSlot placement="constellation"` saem: `ConstellationInfoPanel` (1, o da Constelação propriamente), `DebatePanel` (3), `DebateDetail` (1) e **`ColloquiumDetail` (2)** — este último não estava na sua lista, mas usa o mesmo placement e quebraria com 400 após o deploy do worker; sai junto. Props e imports que só os anúncios usavam (`user`, `userId`, `handleVideoEnded`, `styles.topAd`) saem também | 4 arquivos do site |

**Fatos que sustentam o corte seco:** (1) nenhum escritor de perfil comportamental existe no worker (`top_genres`, `philosophies`, `engagement_level` nunca são gravados: a segmentação comportamental era vendida e jamais aplicada); (2) as 6 montagens em Ideias (Debate/Colóquio) usavam o placement `constellation` só por conveniência — a posição correta para elas é S1/S4 e volta no B1.

**O que fica para o B1 (registrado):** a chave `content` (módulo declarado) continua aceita e **não é aplicada no serve** (nunca foi); os CHECKs do schema (`placement IN ('sidebar','constellation')`, `duration IN (...)`) ficam como estão até a migração do catálogo; `ads.user_profiles` e `ads.user_matches_targeting` ficam intocados; chaves i18n mortas do Atelier (`placements.constellation*`, `create.placementConstellation`, `adPreview.constellation`, `create.targetingCategories.genres/philosophies/engagement`) ficam nos 18 JSON até o B2.

## 2. Pré-flight — SQL para o Bob (somente leitura, schema `ads`)

```sql
-- B0 PRÉ-FLIGHT (somente leitura). Colar as 5 saídas.

-- (1) Pedidos por placement × status (esperado: nenhum 'constellation' ativo/pendente)
SELECT placement, status, count(*) FROM ads.ad_orders GROUP BY 1, 2 ORDER BY 1, 2;

-- (2) Preços ativos da constellation
SELECT id, pricing_type, placement, duration, price_cents, is_active
FROM ads.pricing_config WHERE placement = 'constellation' ORDER BY duration;

-- (3) Opções de segmentação por categoria
SELECT category, count(*) FILTER (WHERE is_active) AS ativas, count(*) AS total
FROM ads.targeting_options GROUP BY 1 ORDER BY 1;

-- (4) Previsão de inventário futura da constellation
SELECT count(*) AS linhas_futuras, min(forecast_date), max(forecast_date)
FROM ads.inventory_forecast WHERE placement = 'constellation' AND forecast_date >= current_date;

-- (5) Pedidos vivos que carregam chaves comportamentais
SELECT id, status, placement, targeting
FROM ads.ad_orders
WHERE status IN ('active', 'pending', 'paused')
  AND (targeting ? 'genres' OR targeting ? 'philosophies' OR targeting ? 'engagement');
```

## 3. Migração (gated: só com (1) sem constellation viva e o seu OK)

O schema **não exige** mudança para o B0 (os CHECKs continuam aceitando o valor; o código é que deixa de emiti-lo). O que precisa andar no banco é o **catálogo vivo**: preços e opções de segmentação, que a API lê com `is_active=eq.true`.

```sql
BEGIN;

-- 1. Constellation sai do catálogo de preços (desativa, não apaga: histórico de pedidos aponta para cá)
UPDATE ads.pricing_config SET is_active = false
WHERE placement = 'constellation' AND is_active = true;

-- 2. Segmentação comportamental sai da venda
UPDATE ads.targeting_options SET is_active = false
WHERE category IN ('genre', 'philosophy', 'engagement') AND is_active = true;

-- 3. Previsão futura da constellation some (passado fica para relatórios)
DELETE FROM ads.inventory_forecast
WHERE placement = 'constellation' AND forecast_date >= current_date;

-- Verificação (esperado: 0 · 0 · 0)
SELECT (SELECT count(*) FROM ads.pricing_config WHERE placement = 'constellation' AND is_active) AS precos_constellation_ativos,
       (SELECT count(*) FROM ads.targeting_options WHERE category IN ('genre','philosophy','engagement') AND is_active) AS opcoes_comportamentais_ativas,
       (SELECT count(*) FROM ads.inventory_forecast WHERE placement = 'constellation' AND forecast_date >= current_date) AS previsao_constellation_futura;

COMMIT;  -- ou ROLLBACK;
```

Se (1) mostrar pedido `constellation` **ativo ou pendente**, paro antes: decisão sua (pausar + estornar o saldo ou deixar terminar) antes do deploy do worker, porque o serve deixa de atender esse placement.

## 4. Deploy (ordem) e conferência

1. `cd api && wrangler deploy --env production` → `GET /api/ads/pricing` sem `constellation` (após a migração) · `GET /api/ads/serve?placement=constellation` → 400 · `?placement=sidebar` segue.
2. `cd ads && npm run deploy` (build + Pages `philosify-ads`, branch production) → /placements só com o Sidebar; wizard sem Constellation e sem chips comportamentais; landing sem o cartão "2 formatos".
3. `cd site && npm run build && wrangler pages deploy dist --project-name=philosify-frontend --branch=production` → Constelação, Debates e Colóquios sem slot; Música/Notícias/Quiz com o slot `sidebar` como antes.

## 5. Verificação local

| Passo | Resultado |
|---|---|
| `node --check` nos 9 handlers de ads | OK |
| vitest (api) | 14 arquivos, 168 testes, 0 falhas |
| `wrangler deploy --dry-run --env production` | OK |
| eslint (site, 4 arquivos) | limpo, exceto 2 erros **pré-existentes** (`allNodes` não usado em ConstellationInfoPanel; função impura no render do DebatePanel) |
| eslint (ads, 4 arquivos) | limpo |
| `vite build` site e Atelier | OK |
| `grep constellation` em worker/Atelier/produto | só comentários do B0 |

## 6. O que peço de OK

- **A.** Diff do § 8 como está, incluindo a extensão a `ColloquiumDetail` (2 montagens a mais que a sua lista).
- **B.** Pré-flight do § 2 e, com os zeros, a migração do § 3 (desativar, não apagar; previsão futura apagada).
- **C.** Serve ignora as chaves comportamentais de pedidos legados (entrega por idioma/mercado), em vez de honrá-las até o fim.
- **D.** Landing: o cartão "2 formatos" sai (em vez de virar "1 formato" ×18).
- **E.** Ordem worker → Atelier → site, três comandos seus; um commit só, com inventário + capturas + este md.

## 7. Registro

| Passo | Data | Resultado |
|---|---|---|
| Diff aplicado no working tree + verificação local | 16/10 | este arquivo |
| OK do Bob (A-E) | 17/10 | APROVADO nos cinco; cosmético pedido em A (rótulos de comentário em `serve.js/matchTargeting`: "Genre matching" sobre idiomas e "Engagement matching" sobre países) corrigido para "Language matching" / "Country matching" antes do commit |
| Pré-flight (Bob) | 17/10 | Inspeção da (1) revelou **3 pedidos `constellation` ATIVOS**, todos de teste do próprio Bob (The Deep Dive 13/04, Análise Lógica 14/04, Bob Rach Kids 31/07; conta do Bob; 73 de 17.187 impressões entregues; Stripe de teste). (2)–(5) dispensadas pela inspeção + verificação embutida na migração |
| Migração (Bob) | 17/10 | Executada **com extensão**: além dos três passos do § 3, os 3 pedidos de teste foram cancelados na própria transação (`UPDATE status='cancelled'`), sem estorno (saldo de teste). Verificação final: **0 pedidos vivos · 0 preços ativos · 0 opções comportamentais · 0 previsão futura** |
| Deploy worker | 17/10 | versão `6c07a0c8-c870-46c6-8147-0a665094ef62`. Conferência: `serve?placement=constellation` → 400 · `?placement=sidebar` → 200 · `/api/ads/pricing` só `sidebar` (5/10/15/20/30 s) · `/api/ads/targeting/options` só `content, country, language, region` (as duas últimas leituras vêm do banco: a migração do § 3 já estava aplicada) |
| Deploy Atelier | 17/10 | Pages `philosify-ads`, deployment `55334578` (bundle `index-DcjHDZFw.js`, igual ao `dist/` local). Conferência no bundle publicado: nenhuma chave `genres`/`philosophies`/`engagement`; as únicas ocorrências de `constellation` são as strings do `en.json` (chaves i18n mortas, registradas no § 1 para o B2); `ads/src` fora de `i18n/` sem nenhuma ocorrência |
| Deploy site | 17/10 | Pages `philosify-frontend`, deployment `92b85120` (branch production). Conferência no build publicado: zero `placement:"constellation"`, seis `placement:"sidebar"` (Música, Cinema, Literatura, Notícias, Quiz, como antes); em `site/src` nenhuma montagem com `constellation` |
| Conferência do § 4 | 17/10 | API: `pricing` só sidebar · `serve?placement=constellation` 400 · sidebar 200 · opções sem comportamentais. Atelier ao vivo: `/placements` só "Intersticial da Barra Lateral" (5 durações). Produto ao vivo: colóquio aberto em `/ideas?debate=…` sem nenhum elemento de anúncio. Constelação: o painel de nó não ficou alcançável na aba oculta do MCP (overlay em canvas); a prova aí é a do build publicado (zero `placement:"constellation"`, seis `sidebar`) e fica para a vista do Bob |
| Commit + push | — | — |

## 8. Diff (working tree, `git diff` em 17/10/2026, após o cosmético do OK)

```diff
diff --git a/ads/src/components/AdPreview.jsx b/ads/src/components/AdPreview.jsx
index c49aa09..cfcd006 100644
--- a/ads/src/components/AdPreview.jsx
+++ b/ads/src/components/AdPreview.jsx
@@ -19,15 +19,6 @@ const DEMO_CREATIVES = {
     </svg>`),
     labelKey: 'sidebarInterstitial',
   },
-  constellation: {
-    url: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="250" height="120" viewBox="0 0 250 120">
-      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f0f1a"/><stop offset="100%" stop-color="#1a1a2e"/></linearGradient></defs>
-      <rect width="250" height="120" fill="url(#g)" rx="8"/>
-      <text x="125" y="50" text-anchor="middle" fill="#c9a861" font-family="serif" font-size="16" font-weight="bold">Your Ad Here</text>
-      <text x="125" y="75" text-anchor="middle" fill="#888" font-family="sans-serif" font-size="11">250 x 120 — Constellation</text>
-    </svg>`),
-    labelKey: 'constellationPanel',
-  },
 };
 
 function PhilosifyShell({ placement, children }) {
@@ -66,39 +57,7 @@ function PhilosifyShell({ placement, children }) {
     );
   }
 
-  // Constellation placement
-  return (
-    <div className="preview-shell preview-shell--constellation">
-      <div className="preview-shell__browser">
-        <div className="preview-shell__dots">
-          <span /><span /><span />
-        </div>
-        <div className="preview-shell__url">philosify.org/constellation</div>
-      </div>
-      <div className="preview-shell__content preview-shell__content--constellation">
-        <div className="preview-shell__starfield">
-          {[...Array(20)].map((_, i) => (
-            <div
-              key={i}
-              className="preview-shell__star"
-              style={{
-                left: `${Math.random() * 100}%`,
-                top: `${Math.random() * 100}%`,
-                animationDelay: `${Math.random() * 3}s`,
-              }}
-            />
-          ))}
-          <div className="preview-shell__node" style={{ left: '30%', top: '40%' }}>Aristotle</div>
-          <div className="preview-shell__node" style={{ left: '60%', top: '25%' }}>Kant</div>
-          <div className="preview-shell__node" style={{ left: '45%', top: '65%' }}>Rand</div>
-        </div>
-        <div className="preview-shell__constellation-ad">
-          <span className="preview-shell__sponsored">{t('common.sponsored')}</span>
-          {children}
-        </div>
-      </div>
-    </div>
-  );
+  return null;
 }
 
 export default function AdPreview({
@@ -126,13 +85,6 @@ export default function AdPreview({
           >
             {t('adPreview.sidebar')}
           </button>
-          <button
-            type="button"
-            className={`btn btn-sm ${activePlacement === 'constellation' ? 'btn-primary' : ''}`}
-            onClick={() => setActivePlacement('constellation')}
-          >
-            {t('adPreview.constellation')}
-          </button>
           <span className="ad-preview__duration">{duration}s</span>
         </div>
       )}
diff --git a/ads/src/pages/CreateCampaign.jsx b/ads/src/pages/CreateCampaign.jsx
index 2380bac..806f267 100644
--- a/ads/src/pages/CreateCampaign.jsx
+++ b/ads/src/pages/CreateCampaign.jsx
@@ -6,14 +6,10 @@ import { api } from '@services/api';
 const PLACEMENTS = [
   { value: 'mixed', labelKey: 'create.placementMixed' },
   { value: 'sidebar', labelKey: 'create.placementSidebar' },
-  { value: 'constellation', labelKey: 'create.placementConstellation' },
 ];
 
 const TARGETING_OPTIONS = {
-  genres: ['Rock', 'Pop', 'Hip-Hop', 'Classical', 'Jazz', 'Electronic', 'R&B', 'Country', 'Latin', 'Metal', 'Folk', 'Blues', 'Indie', 'Punk', 'Reggae', 'Soul'],
-  philosophies: ['Objectivism', 'Stoicism', 'Existentialism', 'Nihilism', 'Marxism', 'Utilitarianism', 'Virtue Ethics', 'Pragmatism', 'Rationalism', 'Empiricism'],
   languages: ['English', 'Portuguese', 'Spanish', 'French', 'German', 'Italian', 'Russian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi', 'Hebrew', 'Dutch', 'Polish', 'Turkish', 'Hungarian', 'Persian'],
-  engagement: ['Casual', 'Regular', 'Power User'],
   countries: ['US', 'BR', 'GB', 'CA', 'DE', 'FR', 'AU', 'ES', 'IT', 'NL', 'JP', 'KR', 'IN', 'MX', 'AR', 'IL', 'PT', 'PL', 'TR', 'RU'],
   content: ['Music Analysis', 'Book Analysis', 'Cinema Analysis', 'Colloquium', 'News', 'Quiz'],
 };
@@ -44,10 +40,7 @@ function CreateCampaign() {
     start_date: '',
     end_date: '',
     targeting: {
-      genres: [],
-      philosophies: [],
       languages: [],
-      engagement: [],
       countries: [],
       content: [],
     },
diff --git a/ads/src/pages/Landing.jsx b/ads/src/pages/Landing.jsx
index 88c3b4c..90e95f5 100644
--- a/ads/src/pages/Landing.jsx
+++ b/ads/src/pages/Landing.jsx
@@ -55,10 +55,6 @@ function Landing() {
               </Link>
             </div>
             <div className="hero-metrics">
-              <div className="metric-card">
-                <span className="metric-card__value">2</span>
-                <span className="metric-card__label">{t('landing.metricsFormats')}</span>
-              </div>
               <div className="metric-card">
                 <span className="metric-card__value">{t('landing.metricsSelfServe')}</span>
               </div>
diff --git a/ads/src/pages/Placements.jsx b/ads/src/pages/Placements.jsx
index a8fb633..fa404a7 100644
--- a/ads/src/pages/Placements.jsx
+++ b/ads/src/pages/Placements.jsx
@@ -61,63 +61,6 @@ function SidebarMockup({ t }) {
   );
 }
 
-// Visual mockup of Philosify constellation panel with ad
-function ConstellationMockup({ t }) {
-  return (
-    <div className="mockup mockup--constellation">
-      {/* Browser chrome */}
-      <div className="mockup__browser">
-        <div className="mockup__browser-dots">
-          <span></span><span></span><span></span>
-        </div>
-        <div className="mockup__browser-url">philosify.org/constellation</div>
-      </div>
-      
-      {/* Page content */}
-      <div className="mockup__page">
-        {/* Header */}
-        <div className="mockup__header">
-          <div className="mockup__logo">Philosify</div>
-          <div className="mockup__nav">
-            <span></span><span></span><span></span>
-          </div>
-        </div>
-        
-        {/* Constellation view */}
-        <div className="mockup__constellation-layout">
-          {/* Star field visualization */}
-          <div className="mockup__starfield">
-            <div className="mockup__star mockup__star--1"></div>
-            <div className="mockup__star mockup__star--2"></div>
-            <div className="mockup__star mockup__star--3"></div>
-            <div className="mockup__star mockup__star--4"></div>
-            <div className="mockup__star mockup__star--5"></div>
-            <div className="mockup__star mockup__star--center"></div>
-            <svg className="mockup__connections">
-              <line x1="50%" y1="50%" x2="20%" y2="30%" />
-              <line x1="50%" y1="50%" x2="80%" y2="25%" />
-              <line x1="50%" y1="50%" x2="75%" y2="70%" />
-              <line x1="50%" y1="50%" x2="25%" y2="75%" />
-            </svg>
-          </div>
-          
-          {/* Side panel with ad */}
-          <div className="mockup__panel">
-            <div className="mockup__panel-title">{t('placements.mockupDiscover')}</div>
-            <div className="mockup__panel-item"></div>
-            <div className="mockup__panel-item"></div>
-            <div className="mockup__ad-slot mockup__ad-slot--highlight mockup__ad-slot--square">
-              <div className="mockup__ad-label">{t('placements.mockupYourAd')}</div>
-              <div className="mockup__ad-size">{t('placements.mockupAdSize250')}</div>
-            </div>
-            <div className="mockup__panel-item"></div>
-          </div>
-        </div>
-      </div>
-    </div>
-  );
-}
-
 function getPlacements(t) {
   return [
     {
@@ -145,27 +88,6 @@ function getPlacements(t) {
       ],
       MockupComponent: SidebarMockup,
     },
-    {
-      id: 'constellation',
-      name: t('placements.constellationName'),
-      description: t('placements.constellationFullDesc'),
-      context: t('placements.constellationContext'),
-      durations: [
-        { seconds: 5, cpm: 8 },
-      ],
-      specs: {
-        dimensions: t('placements.constellationDimensions'),
-        formats: t('placements.constellationFormats'),
-        maxSize: t('placements.constellationMaxSize'),
-      },
-      features: [
-        t('placements.constellationFeature1'),
-        t('placements.constellationFeature2'),
-        t('placements.constellationFeature3'),
-        t('placements.constellationFeature4'),
-      ],
-      MockupComponent: ConstellationMockup,
-    },
   ];
 }
 
diff --git a/api/src/handlers/ads/agency.js b/api/src/handlers/ads/agency.js
index 4d79d1a..62efead 100644
--- a/api/src/handlers/ads/agency.js
+++ b/api/src/handlers/ads/agency.js
@@ -995,11 +995,11 @@ export async function handleAgencyCreateClientCampaign(request, env, corsHeaders
       return jsonResponse({ error: 'Campaign name must be 2-100 characters' }, 400, corsHeaders);
     }
 
-    if (!['sidebar', 'constellation'].includes(placement)) {
+    if (!['sidebar'].includes(placement)) {
       return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
     }
 
-    const validDurations = placement === 'sidebar' ? [5, 10, 15, 20, 30] : [5];
+    const validDurations = [5, 10, 15, 20, 30];
     if (!validDurations.includes(duration)) {
       return jsonResponse({ error: 'Invalid duration for placement' }, 400, corsHeaders);
     }
diff --git a/api/src/handlers/ads/campaigns.js b/api/src/handlers/ads/campaigns.js
index 74288a4..72fe1f3 100644
--- a/api/src/handlers/ads/campaigns.js
+++ b/api/src/handlers/ads/campaigns.js
@@ -109,11 +109,11 @@ export async function handleCreateCampaign(request, env, corsHeaders) {
       return jsonResponse({ error: 'Campaign name must be 2-100 characters' }, 400, corsHeaders);
     }
 
-    if (!['sidebar', 'constellation'].includes(placement)) {
+    if (!['sidebar'].includes(placement)) {
       return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
     }
 
-    const validDurations = placement === 'sidebar' ? [5, 10, 15, 20, 30] : [5];
+    const validDurations = [5, 10, 15, 20, 30];
     if (!validDurations.includes(duration)) {
       return jsonResponse({ error: 'Invalid duration for placement' }, 400, corsHeaders);
     }
diff --git a/api/src/handlers/ads/creatives.js b/api/src/handlers/ads/creatives.js
index 8adb434..e86ef16 100644
--- a/api/src/handlers/ads/creatives.js
+++ b/api/src/handlers/ads/creatives.js
@@ -308,7 +308,6 @@ export async function moderateBrief(env, brief, brandName = '') {
 
 const PLACEMENT_SIZES = {
   sidebar: { w: 300, h: 250, label: '300x250 sidebar ad' },
-  constellation: { w: 250, h: 250, label: '250x250 constellation panel ad' },
 };
 
 /**
@@ -321,7 +320,7 @@ const PLACEMENT_SIZES = {
  * @param {string} options.brief - Creative brief from the advertiser
  * @param {string} options.brandName - Company name
  * @param {string} options.targetUrl - Destination URL
- * @param {string} options.placement - 'sidebar' or 'constellation'
+ * @param {string} options.placement - 'sidebar'
  * @returns {Promise<{url: string, filename: string} | null>}
  */
 export async function generateAICreative(env, options) {
diff --git a/api/src/handlers/ads/inventory.js b/api/src/handlers/ads/inventory.js
index 9a55d7a..cc0549a 100644
--- a/api/src/handlers/ads/inventory.js
+++ b/api/src/handlers/ads/inventory.js
@@ -13,7 +13,7 @@ import { getAdvertiserFromRequest } from './utils.js';
  * Browse available inventory by date range and placement
  * 
  * Query params:
- * - placement: 'sidebar' | 'constellation' (optional, returns both if not specified)
+ * - placement: 'sidebar' (optional; the only placement since B0, 16 Oct 2026)
  * - start_date: YYYY-MM-DD (default: today)
  * - end_date: YYYY-MM-DD (default: 30 days from start)
  */
@@ -34,7 +34,7 @@ export async function handleGetInventory(request, env, corsHeaders) {
 
     // Add filters
     const filters = [`forecast_date=gte.${startDate}`, `forecast_date=lte.${endDate}`];
-    if (placement && ['sidebar', 'constellation'].includes(placement)) {
+    if (placement && ['sidebar'].includes(placement)) {
       filters.push(`placement=eq.${placement}`);
     }
 
@@ -66,10 +66,10 @@ export async function handleGetInventory(request, env, corsHeaders) {
     // Calculate totals
     const totals = {
       sidebar: { estimated: 0, reserved: 0, available: 0 },
-      constellation: { estimated: 0, reserved: 0, available: 0 },
     };
 
     for (const row of inventory || []) {
+      if (!totals[row.placement]) continue; // legacy constellation rows (pre-B0)
       totals[row.placement].estimated += row.estimated_impressions;
       totals[row.placement].reserved += row.reserved_impressions;
       totals[row.placement].available += row.available_impressions;
@@ -92,7 +92,7 @@ export async function handleGetInventory(request, env, corsHeaders) {
  * Check if specific inventory is available for an order
  * 
  * Body:
- * - placement: 'sidebar' | 'constellation'
+ * - placement: 'sidebar'
  * - impressions: number (minimum 1000)
  * - start_date: YYYY-MM-DD (optional for ASAP)
  * - end_date: YYYY-MM-DD (optional for ASAP)
@@ -103,7 +103,7 @@ export async function handleCheckAvailability(request, env, corsHeaders) {
     const { placement, impressions, start_date, end_date } = body;
 
     // Validate
-    if (!placement || !['sidebar', 'constellation'].includes(placement)) {
+    if (!placement || !['sidebar'].includes(placement)) {
       return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
     }
 
@@ -226,7 +226,7 @@ export async function handleGetPricing(request, env, corsHeaders) {
  * Get a price quote for an order
  * 
  * Body:
- * - placement: 'sidebar' | 'constellation'
+ * - placement: 'sidebar'
  * - duration: 5 | 10 | 15 | 20
  * - impressions: number
  * - creative_type: 'self' | 'philosify'
@@ -237,11 +237,11 @@ export async function handleGetQuote(request, env, corsHeaders) {
     const { placement, duration, impressions, creative_type } = body;
 
     // Validate
-    if (!placement || !['sidebar', 'constellation'].includes(placement)) {
+    if (!placement || !['sidebar'].includes(placement)) {
       return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
     }
 
-    const validDurations = placement === 'constellation' ? [5] : [5, 10, 15, 20, 30];
+    const validDurations = [5, 10, 15, 20, 30];
     if (!duration || !validDurations.includes(duration)) {
       return jsonResponse({ error: `Invalid duration for ${placement}` }, 400, corsHeaders);
     }
@@ -361,11 +361,11 @@ export async function handleCalculateCart(request, env, corsHeaders) {
       const { placement, duration, impressions } = item;
 
       // Validate item
-      if (!placement || !['sidebar', 'constellation'].includes(placement)) {
+      if (!placement || !['sidebar'].includes(placement)) {
         return jsonResponse({ error: `Invalid placement: ${placement}` }, 400, corsHeaders);
       }
 
-      const validDurations = placement === 'constellation' ? [5] : [5, 10, 15, 20, 30];
+      const validDurations = [5, 10, 15, 20, 30];
       if (!duration || !validDurations.includes(duration)) {
         return jsonResponse({ error: `Invalid duration ${duration}s for ${placement}` }, 400, corsHeaders);
       }
@@ -432,7 +432,7 @@ export async function handleCalculateCart(request, env, corsHeaders) {
 // Same traffic assumptions as the migration seed (weekends run lighter).
 const FORECAST_BASELINE = {
   sidebar: { weekday: 5000, weekend: 3000 },
-  constellation: { weekday: 2500, weekend: 1500 },
+  // constellation: removed in B0 (16 Oct 2026) — no-ads zone; no new forecast rows
 };
 
 const isoDay = (date) => date.toISOString().split('T')[0];
diff --git a/api/src/handlers/ads/orders.js b/api/src/handlers/ads/orders.js
index ab2c2fe..9c6f4e1 100644
--- a/api/src/handlers/ads/orders.js
+++ b/api/src/handlers/ads/orders.js
@@ -12,6 +12,11 @@ import { getSecret } from '../../utils/secrets.js';
 // SECURITY: UUID validation for route parameters
 const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 
+// Contextual targeting only (B0, 16 Oct 2026; ratification 28 Jul 2026: module × language × market).
+// Behavioral keys (genres, philosophies, engagement) are gone from the sale; "content" is the
+// declared module axis until B1 binds it to the five positions.
+const TARGETING_KEYS = ['languages', 'countries', 'regions', 'us_states', 'br_states', 'content', 'cities', 'timezones'];
+
 /**
  * GET /api/ads/orders
  * List orders for the authenticated advertiser
@@ -66,6 +71,7 @@ export async function handleListOrders(request, env, corsHeaders) {
  * GET /api/ads/orders/:id
  * Get a specific order
  */
+
 export async function handleGetOrder(request, env, corsHeaders, orderId) {
   try {
     if (!UUID_RE.test(orderId)) {
@@ -125,6 +131,7 @@ export async function handleGetOrder(request, env, corsHeaders, orderId) {
  * POST /api/ads/orders
  * Create a new order (draft status, not yet paid)
  */
+
 export async function handleCreateOrder(request, env, corsHeaders) {
   try {
     const supabase = await getServiceSupabase(env);
@@ -161,16 +168,28 @@ export async function handleCreateOrder(request, env, corsHeaders) {
     }
 
     // Validate placement
-    if (!['sidebar', 'constellation'].includes(placement)) {
+    if (!['sidebar'].includes(placement)) {
       return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
     }
 
     // Validate duration
-    const validDurations = placement === 'constellation' ? [5] : [5, 10, 15, 20, 30];
+    const validDurations = [5, 10, 15, 20, 30];
     if (!validDurations.includes(duration)) {
       return jsonResponse({ error: `Invalid duration for ${placement}` }, 400, corsHeaders);
     }
 
+    // Validate targeting (B0: contextual only — language × market (+ declared content);
+    // behavioral keys genres/philosophies/engagement are no longer sold)
+    if (targeting !== undefined && targeting !== null) {
+      if (typeof targeting !== 'object' || Array.isArray(targeting)) {
+        return jsonResponse({ error: 'Invalid targeting format' }, 400, corsHeaders);
+      }
+      const unknown = Object.keys(targeting).filter((k) => !TARGETING_KEYS.includes(k));
+      if (unknown.length > 0) {
+        return jsonResponse({ error: `Targeting not available: ${unknown.join(', ')}` }, 400, corsHeaders);
+      }
+    }
+
     // Validate impressions
     if (impressions < 1000) {
       return jsonResponse({ error: 'Minimum 1000 impressions required' }, 400, corsHeaders);
@@ -314,6 +333,7 @@ export async function handleCreateOrder(request, env, corsHeaders) {
  * PUT /api/ads/orders/:id
  * Update an order (only allowed for draft/pending orders)
  */
+
 export async function handleUpdateOrder(request, env, corsHeaders, orderId) {
   try {
     if (!UUID_RE.test(orderId)) {
@@ -372,9 +392,9 @@ export async function handleUpdateOrder(request, env, corsHeaders, orderId) {
       if (typeof body.targeting !== 'object' || Array.isArray(body.targeting)) {
         return jsonResponse({ error: 'Invalid targeting format' }, 400, corsHeaders);
       }
-      const allowedKeys = ['genres','philosophies','languages','engagement','countries','regions','us_states','br_states','content','cities','timezones'];
+      const allowedKeys = TARGETING_KEYS;
       const keys = Object.keys(body.targeting);
-      if (keys.some(k => !allowedKeys.includes(k))) {
+      if (keys.some((k) => !allowedKeys.includes(k))) {
         return jsonResponse({ error: 'Unknown targeting keys' }, 400, corsHeaders);
       }
       if (JSON.stringify(body.targeting).length > 10000) {
@@ -415,6 +435,7 @@ export async function handleUpdateOrder(request, env, corsHeaders, orderId) {
  * POST /api/ads/orders/:id/checkout
  * Create Stripe checkout session for an order
  */
+
 export async function handleOrderCheckout(request, env, corsHeaders, orderId) {
   try {
     if (!UUID_RE.test(orderId)) {
@@ -512,6 +533,7 @@ export async function handleOrderCheckout(request, env, corsHeaders, orderId) {
  * POST /api/ads/orders/:id/pause
  * Pause an active order
  */
+
 export async function handlePauseOrder(request, env, corsHeaders, orderId) {
   try {
     if (!UUID_RE.test(orderId)) {
@@ -556,6 +578,7 @@ export async function handlePauseOrder(request, env, corsHeaders, orderId) {
  * POST /api/ads/orders/:id/resume
  * Resume a paused order
  */
+
 export async function handleResumeOrder(request, env, corsHeaders, orderId) {
   try {
     if (!UUID_RE.test(orderId)) {
@@ -605,6 +628,7 @@ export async function handleResumeOrder(request, env, corsHeaders, orderId) {
  * POST /api/ads/orders/:id/cancel
  * Cancel an order and request refund
  */
+
 export async function handleCancelOrder(request, env, corsHeaders, orderId) {
   try {
     if (!UUID_RE.test(orderId)) {
@@ -702,6 +726,7 @@ export async function handleCancelOrder(request, env, corsHeaders, orderId) {
  * Webhook handler for order payments
  * Called when Stripe checkout completes
  */
+
 export async function handleOrderPaymentWebhook(env, session) {
   try {
     const { order_id } = session.metadata;
diff --git a/api/src/handlers/ads/planner.js b/api/src/handlers/ads/planner.js
index 2ac35c0..7c52c82 100644
--- a/api/src/handlers/ads/planner.js
+++ b/api/src/handlers/ads/planner.js
@@ -21,7 +21,7 @@ const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
  * - goal: 'reach' | 'engagement' | 'balanced' (default: 'balanced')
  * - start_date: YYYY-MM-DD (optional, default: tomorrow)
  * - end_date: YYYY-MM-DD (optional, default: calculated based on budget)
- * - placement_preference: 'sidebar' | 'constellation' | 'mixed' (default: 'mixed')
+ * - placement_preference: 'sidebar' | 'mixed' (default: 'mixed'; 'mixed' = sidebar since B0)
  * - duration_preference: 5 | 10 | 15 | 20 | 'mixed' (default: 'mixed')
  */
 export async function handleGeneratePlan(request, env, corsHeaders) {
@@ -97,8 +97,9 @@ export async function handleGeneratePlan(request, env, corsHeaders) {
           order: 'forecast_date.asc',
         });
       if (error) throw new Error(`inventory lookup: ${error.message}`);
-      const byPlacement = { sidebar: 0, constellation: 0 };
+      const byPlacement = { sidebar: 0 };
       for (const day of data || []) {
+        if (byPlacement[day.placement] === undefined) continue; // legacy constellation rows (pre-B0)
         byPlacement[day.placement] += day.available_impressions;
       }
       return byPlacement;
@@ -115,7 +116,7 @@ export async function handleGeneratePlan(request, env, corsHeaders) {
     // Self-heal: the forecast is a rolling window maintained by cron. If it has
     // lapsed there is nothing to allocate against and every plan comes back
     // empty, so fill the gap now rather than making the advertiser wait a day.
-    if (availableByPlacement.sidebar + availableByPlacement.constellation === 0) {
+    if (availableByPlacement.sidebar === 0) {
       try {
         const filled = await topUpInventoryForecast(env, 180);
         console.warn(`[Ads] Forecast window was empty — topped up ${filled.created} row(s)`);
@@ -141,7 +142,7 @@ export async function handleGeneratePlan(request, env, corsHeaders) {
     // hit the wall one step later ("Invalid plan: placements is empty") with no
     // way to tell what went wrong. Say which constraint bit.
     if (!plan.placements || plan.placements.length === 0) {
-      const totalAvailable = availableByPlacement.sidebar + availableByPlacement.constellation;
+      const totalAvailable = availableByPlacement.sidebar;
       let reason;
       if (totalAvailable === 0) {
         reason =
@@ -206,9 +207,8 @@ function generateOptimalPlan({
     case 'reach':
       // Maximize impressions - prefer cheaper options
       allocationStrategy = [
-        { placement: 'constellation', duration: 5, weight: 0.5 },
-        { placement: 'sidebar', duration: 5, weight: 0.3 },
-        { placement: 'sidebar', duration: 10, weight: 0.2 },
+        { placement: 'sidebar', duration: 5, weight: 0.6 },
+        { placement: 'sidebar', duration: 10, weight: 0.4 },
       ];
       break;
     case 'engagement':
@@ -223,10 +223,9 @@ function generateOptimalPlan({
     default:
       // Balanced mix
       allocationStrategy = [
-        { placement: 'sidebar', duration: 10, weight: 0.35 },
-        { placement: 'sidebar', duration: 5, weight: 0.25 },
-        { placement: 'constellation', duration: 5, weight: 0.25 },
-        { placement: 'sidebar', duration: 15, weight: 0.15 },
+        { placement: 'sidebar', duration: 10, weight: 0.45 },
+        { placement: 'sidebar', duration: 5, weight: 0.35 },
+        { placement: 'sidebar', duration: 15, weight: 0.2 },
       ];
   }
 
diff --git a/api/src/handlers/ads/serve.js b/api/src/handlers/ads/serve.js
index 816b72a..b192e85 100644
--- a/api/src/handlers/ads/serve.js
+++ b/api/src/handlers/ads/serve.js
@@ -31,17 +31,9 @@ function matchTargeting(targeting, profile) {
   if (!targeting || Object.keys(targeting).length === 0) return true;
   if (!profile) return true; // No profile = show to everyone (untargeted)
 
-  // Genre matching
-  if (targeting.genres?.length > 0 && profile.genres?.length > 0) {
-    const overlap = targeting.genres.some(g => profile.genres.includes(g));
-    if (!overlap) return false;
-  }
-
-  // Philosophy matching
-  if (targeting.philosophies?.length > 0 && profile.philosophies?.length > 0) {
-    const overlap = targeting.philosophies.some(p => profile.philosophies.includes(p));
-    if (!overlap) return false;
-  }
+  // B0 (16 Oct 2026): genres / philosophies / engagement are no longer matched —
+  // behavioral targeting left the sale (contextual only). Legacy orders that still
+  // carry those keys deliver on their language/market keys alone.
 
   // Language matching
   if (targeting.languages?.length > 0 && profile.languages?.length > 0) {
@@ -49,11 +41,6 @@ function matchTargeting(targeting, profile) {
     if (!overlap) return false;
   }
 
-  // Engagement matching
-  if (targeting.engagement?.length > 0 && profile.engagement_level) {
-    if (!targeting.engagement.includes(profile.engagement_level)) return false;
-  }
-
   // Country matching
   if (targeting.countries?.length > 0 && profile.country_code) {
     if (!targeting.countries.includes(profile.country_code)) return false;
@@ -365,7 +352,7 @@ async function selectProportionalAd(supabase, placement, userId, ip, userProfile
  * Get next ad to display (called by Philosify frontend)
  * 
  * Query params:
- * - placement: 'sidebar' | 'constellation'
+ * - placement: 'sidebar' (the only placement since B0, 16 Oct 2026)
  * - user_id: Philosify user ID (optional, used for premium check and frequency cap)
  * - duration: preferred duration in seconds (optional, for sidebar only)
  * 
@@ -382,7 +369,7 @@ export async function handleServeAd(request, env, corsHeaders) {
     const preferredDuration = parseInt(url.searchParams.get('duration')) || null;
     const ip = request.headers.get('cf-connecting-ip') || 'unknown';
 
-    if (!placement || !['sidebar', 'constellation'].includes(placement)) {
+    if (!placement || !['sidebar'].includes(placement)) {
       return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
     }
 
@@ -484,15 +471,10 @@ export async function handleServeAdBatch(request, env, corsHeaders) {
     const totalDuration = parseInt(url.searchParams.get('total_duration')) || 20;
     const ip = request.headers.get('cf-connecting-ip') || 'unknown';
 
-    if (!placement || !['sidebar', 'constellation'].includes(placement)) {
+    if (!placement || !['sidebar'].includes(placement)) {
       return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
     }
 
-    // Constellation only shows one ad
-    if (placement === 'constellation') {
-      return handleServeAd(request, env, corsHeaders);
-    }
-
     const supabase = await getServiceSupabase(env);
 
     // Check premium
diff --git a/api/src/handlers/ads/targeting.js b/api/src/handlers/ads/targeting.js
index 9520e5d..b2faee7 100644
--- a/api/src/handlers/ads/targeting.js
+++ b/api/src/handlers/ads/targeting.js
@@ -49,10 +49,7 @@ export async function handleGetTargetingOptions(request, env, corsHeaders) {
       categories: grouped,
       // Provide structure info for UI
       structure: {
-        genres: { type: 'multi_select', category: 'genre' },
-        philosophies: { type: 'multi_select', category: 'philosophy' },
         languages: { type: 'multi_select', category: 'language' },
-        engagement: { type: 'multi_select', category: 'engagement' },
         content_types: { type: 'multi_select', category: 'content' },
         countries: { type: 'multi_select', category: 'country' },
         regions: { type: 'multi_select', category: 'region' },
@@ -95,18 +92,7 @@ export async function handleEstimateReach(request, env, corsHeaders) {
     let matchingUsers = totalUsers;
     let reachBreakdown = {};
 
-    // Estimate based on targeting criteria
-    if (targeting.genres && targeting.genres.length > 0) {
-      const { data } = await supabase
-        .from('ads.user_profiles')
-        .select('user_id', {
-          filter: `is_premium=eq.false&top_genres=ov.{${targeting.genres.join(',')}}`,
-        });
-      const genreMatch = data?.length || 0;
-      reachBreakdown.genres = genreMatch;
-      matchingUsers = Math.min(matchingUsers, genreMatch);
-    }
-
+    // Estimate based on targeting criteria (B0: contextual keys only)
     if (targeting.countries && targeting.countries.length > 0) {
       const { data } = await supabase
         .from('ads.user_profiles')
@@ -129,17 +115,6 @@ export async function handleEstimateReach(request, env, corsHeaders) {
       matchingUsers = Math.min(matchingUsers, langMatch);
     }
 
-    if (targeting.engagement && targeting.engagement.length > 0) {
-      const { data } = await supabase
-        .from('ads.user_profiles')
-        .select('user_id', {
-          filter: `is_premium=eq.false&engagement_level=in.(${targeting.engagement.join(',')})`,
-        });
-      const engMatch = data?.length || 0;
-      reachBreakdown.engagement = engMatch;
-      matchingUsers = Math.min(matchingUsers, engMatch);
-    }
-
     // Calculate reach percentage
     const reachPercentage = totalUsers > 0 
       ? Math.round((matchingUsers / totalUsers) * 100 * 10) / 10 
@@ -310,13 +285,6 @@ function getTargetingRecommendations(targeting, matching, total) {
     });
   }
 
-  if (targeting.genres?.length > 5) {
-    recommendations.push({
-      type: 'info',
-      message: 'Selecting many genres creates broad targeting. Consider focusing on 2-3 core genres.',
-    });
-  }
-
   if (targeting.countries?.length === 1 && ['US', 'BR'].includes(targeting.countries[0])) {
     recommendations.push({
       type: 'suggestion',
diff --git a/api/src/handlers/ads/utils.js b/api/src/handlers/ads/utils.js
index 8d96831..8f446ad 100644
--- a/api/src/handlers/ads/utils.js
+++ b/api/src/handlers/ads/utils.js
@@ -218,9 +218,12 @@ export function normalizeTargetUrl(url) {
  * Get CPM for placement/duration (fallback values — DB pricing_config is source of truth)
  * These must match inventory.js DEFAULT_CPM and the pricing_config table
  */
+// B0 (16 Oct 2026): the "constellation" placement left the catalog — the
+// Constellation is a no-ads zone by the 28 Jul 2026 ratification. Until B1
+// (S1–S5) lands, "sidebar" is the only placement sold and served.
+export const ACTIVE_PLACEMENTS = ['sidebar'];
 export const DEFAULT_CPM = {
   sidebar: { 5: 600, 10: 800, 15: 1000, 20: 1200 },
-  constellation: { 5: 400 },
 };
 
 export function getCpmCents(placement, duration) {
diff --git a/site/src/components/community/DebatePanel.jsx b/site/src/components/community/DebatePanel.jsx
index 6c911ad..b66b49e 100644
--- a/site/src/components/community/DebatePanel.jsx
+++ b/site/src/components/community/DebatePanel.jsx
@@ -6,7 +6,6 @@ import { useState, useEffect, useRef, useCallback } from 'react';
 import { useTranslation } from 'react-i18next';
 import { useDebate } from '../../hooks/useDebate.js';
 import { useColloquium, getLocalizedContent } from '../../hooks/useColloquium.js';
-import { useAuth } from '../../hooks/useAuth.js';
 import { config } from '@/config';
 import { InvitePeopleModal } from './InvitePeopleModal.jsx';
 import { TranslateButton } from '../common/TranslateButton.jsx';
@@ -15,7 +14,6 @@ import { getPendingAction, clearPendingAction } from '@utils/pendingAction.js';
 import { logger } from '@utils';
 import { translateEra, translateSchool } from '../../data/philosopherI18n.js';
 import { ShareButton } from '../sharing/ShareButton.jsx';
-import InlineAdSlot from '../ads/InlineAdSlot.jsx';
 
 function formatTimeAgo(isoString, t) {
   const now = Date.now();
@@ -1200,7 +1198,6 @@ export function DebatePanel({ deepLinkDebateId, clearDeepLinkDebate }) {
   const { t, i18n } = useTranslation();
   const debate = useDebate();
   const coll = useColloquium();
-  const { user } = useAuth();
 
   // Local UI state
   const [showCreate, setShowCreate] = useState(false);
@@ -1764,13 +1761,6 @@ export function DebatePanel({ deepLinkDebateId, clearDeepLinkDebate }) {
                       />
                     )}
                     <div className="debate-wrapup__content">{localizedWrapup}</div>
-                    <InlineAdSlot
-                      key={`colloquium-verdict-${coll.activeColloquium?.id || 'unknown'}`}
-                      userId={user?.id}
-                      placement="constellation"
-                      layout="banner"
-                      refreshKey={`coll-verdict-${coll.activeColloquium?.id || 'unknown'}`}
-                    />
                     {/* Share verdict via WhatsApp, Telegram, etc. */}
                     <ShareButton
                       shareUrl={`${window.location.origin}/debate/${coll.activeColloquium?.id}?lang=${i18n.resolvedLanguage || i18n.language}`}
@@ -1832,23 +1822,6 @@ export function DebatePanel({ deepLinkDebateId, clearDeepLinkDebate }) {
           </div>
           {/* end scroll */}
 
-          {hasAccess &&
-            !hasVerdict &&
-            (coll.actionLoading ||
-              coll.verdictLoading ||
-              (((collType === 'user_proposed' || collType === 'open_debate') &&
-                !allPhilosHaveSpoken &&
-                allPhilosOnPanel.length > 0))) && (
-              <InlineAdSlot
-                key={`ideas-colloquium-${ac.id}-${philosophers.length}-${Number(coll.actionLoading)}-${Number(coll.verdictLoading)}`}
-                userId={user?.id}
-                placement="constellation"
-                layout="banner"
-                refreshKey={`ideas-colloquium-${ac.id}-${philosophers.length}-${Number(coll.actionLoading)}-${Number(coll.verdictLoading)}`}
-                className="debate-footer-ad"
-              />
-            )}
-
           {/* Action bar at bottom */}
           {hasAccess && !hasVerdict && (
             <div className="colloquium-action-bar">
@@ -2249,17 +2222,6 @@ export function DebatePanel({ deepLinkDebateId, clearDeepLinkDebate }) {
             {debate.error && <div className="debate-panel__error">{debate.error}</div>}
           </div>
 
-          {debate.wrapupLoading && (
-            <InlineAdSlot
-              key={`ideas-debate-${debate.activeDebate.id}-${Number(debate.wrapupLoading)}`}
-              userId={user?.id}
-              placement="constellation"
-              layout="banner"
-              refreshKey={`ideas-debate-${debate.activeDebate.id}-${Number(debate.wrapupLoading)}`}
-              className="debate-footer-ad"
-            />
-          )}
-
           {/* Reply input */}
           {!debate.wrapup && (
             <div className="debate-detail__reply-box">
diff --git a/site/src/components/history/ConstellationInfoPanel.jsx b/site/src/components/history/ConstellationInfoPanel.jsx
index e2a5187..816f681 100644
--- a/site/src/components/history/ConstellationInfoPanel.jsx
+++ b/site/src/components/history/ConstellationInfoPanel.jsx
@@ -5,7 +5,6 @@
 import React from 'react';
 import { useTranslation } from 'react-i18next';
 import { TRADITION_COLORS, SCHOOL_COLORS } from '@hooks/useConstellation';
-import InlineAdSlot from '../ads/InlineAdSlot.jsx';
 
 // Battle dimension keys for translation lookup
 // Format: [positiveKey, negativeKey, descriptionKey]
@@ -132,7 +131,7 @@ const getTranslatedName = (node, t) => {
   return translatedName || node.name;
 };
 
-function NodeDetails({ node, getNodeConnections, findPhilosopher, onNodeSelect, formatYear, t, userId }) {
+function NodeDetails({ node, getNodeConnections, findPhilosopher, onNodeSelect, formatYear, t }) {
   const connections = getNodeConnections(node.id);
   const schoolColor = SCHOOL_COLORS[node.school] || TRADITION_COLORS[node.tradition] || 'var(--ink-low)';
   const [imageError, setImageError] = React.useState(false);
@@ -148,27 +147,8 @@ function NodeDetails({ node, getNodeConnections, findPhilosopher, onNodeSelect,
     }
   }, [node.id]);
 
-  // Scroll to top when constellation video ends
-  const handleVideoEnded = React.useCallback(() => {
-    if (contentRef.current) {
-      contentRef.current.scrollTop = 0;
-    }
-  }, []);
-
   return (
     <div ref={contentRef} style={styles.content}>
-      {/* Ad positioned at top - video only, 6cm × 8cm, centered, 1cm from top */}
-      <div style={styles.topAd}>
-        <InlineAdSlot
-          key={`constellation-panel-${node.id}`}
-          userId={userId}
-          placement="constellation"
-          layout="video"
-          refreshKey={`constellation-panel-${node.id}`}
-          className="constellation-top-ad"
-          onVideoEnded={handleVideoEnded}
-        />
-      </div>
       
       {/* Portrait + Header (compact layout) */}
       <div style={styles.headerWithPortrait}>
@@ -411,7 +391,6 @@ export function ConstellationInfoPanel({
   onNodeSelect,
   formatYear,
   isMobile = false,
-  userId,
 }) {
   const { t } = useTranslation();
   
@@ -444,7 +423,6 @@ export function ConstellationInfoPanel({
           onNodeSelect={onNodeSelect}
           formatYear={formatYear}
           t={t}
-          userId={userId}
         />
       )}
 
@@ -555,13 +533,6 @@ const styles = {
     WebkitOverflowScrolling: 'touch',
   },
 
-  topAd: {
-    width: 227, // 6cm
-    height: 302, // 8cm
-    margin: '38px auto 20px', // 1cm from top, centered horizontally
-    flexShrink: 0,
-  },
-
   header: {
     display: 'flex',
     alignItems: 'flex-start',
diff --git a/site/src/pages/v2/ideas/ColloquiumDetail.jsx b/site/src/pages/v2/ideas/ColloquiumDetail.jsx
index aa7f6e5..3165e2d 100644
--- a/site/src/pages/v2/ideas/ColloquiumDetail.jsx
+++ b/site/src/pages/v2/ideas/ColloquiumDetail.jsx
@@ -7,7 +7,6 @@ import { config } from '@/config';
 import { getLocalizedContent } from '../../../hooks/useColloquium.js';
 import { Button, Pill, Telemetry } from '../../../components/v2';
 import { ShareButton } from '../../../components/sharing/ShareButton.jsx';
-import InlineAdSlot from '../../../components/ads/InlineAdSlot.jsx';
 import { ReplyMsg, PhilosopherPoll } from './Transcript.jsx';
 import { AddPhilosopherModal, InviteModal, ConfirmModal } from './IdeasModals.jsx';
 import { VerdictAudio } from './VerdictAudio.jsx';
@@ -15,7 +14,7 @@ import { MethodologyLink } from '../../../components/v2/MethodologyLink.jsx';
 import { renderMarkdownLite } from '../../../utils/markdownLite.js';
 import { formatTimeAgo, formatCountdown, formatChrono, useChronometer, chronoProgress } from './utils.js';
 
-export function ColloquiumDetail({ coll, user, onBack, requireCredits }) {
+export function ColloquiumDetail({ coll, onBack, requireCredits }) {
   const { t, i18n } = useTranslation();
 
   const [showAddPhilosopher, setShowAddPhilosopher] = useState(false);
@@ -326,13 +325,6 @@ export function ColloquiumDetail({ coll, user, onBack, requireCredits }) {
                 className="prose vprose"
                 dangerouslySetInnerHTML={{ __html: renderMarkdownLite(localizedWrapup) }}
               />
-              <InlineAdSlot
-                key={`colloquium-verdict-${ac.id}`}
-                userId={user?.id}
-                placement="constellation"
-                layout="banner"
-                refreshKey={`coll-verdict-${ac.id}`}
-              />
               <ShareButton
                 shareUrl={`${window.location.origin}/debate/${ac.id}?lang=${i18n.resolvedLanguage || i18n.language}`}
                 shareText={t('share.shareDebateText', {
@@ -363,24 +355,6 @@ export function ColloquiumDetail({ coll, user, onBack, requireCredits }) {
 
       {coll.error && <div className="ierr">{coll.error}</div>}
 
-      {/* Sponsored slot while philosophers generate / actions run (parity) */}
-      {hasAccess &&
-        !hasVerdict &&
-        (coll.actionLoading ||
-          coll.verdictLoading ||
-          ((collType === 'user_proposed' || collType === 'open_debate') &&
-            !allPhilosHaveSpoken &&
-            allPhilosOnPanel.length > 0)) && (
-          <InlineAdSlot
-            key={`ideas-colloquium-${ac.id}-${philosophers.length}-${Number(coll.actionLoading)}-${Number(coll.verdictLoading)}`}
-            userId={user?.id}
-            placement="constellation"
-            layout="banner"
-            refreshKey={`ideas-colloquium-${ac.id}-${philosophers.length}-${Number(coll.actionLoading)}-${Number(coll.verdictLoading)}`}
-            className="debate-footer-ad"
-          />
-        )}
-
       {/* Action bar */}
       {hasAccess && !hasVerdict && (
         <div className="abar">
diff --git a/site/src/pages/v2/ideas/DebateDetail.jsx b/site/src/pages/v2/ideas/DebateDetail.jsx
index af6bfe0..8b5b444 100644
--- a/site/src/pages/v2/ideas/DebateDetail.jsx
+++ b/site/src/pages/v2/ideas/DebateDetail.jsx
@@ -6,7 +6,6 @@ import { useTranslation } from 'react-i18next';
 import { Button, Pill, Telemetry } from '../../../components/v2';
 import { ShareButton } from '../../../components/sharing/ShareButton.jsx';
 import { TranslateButton } from '../../../components/common/TranslateButton.jsx';
-import InlineAdSlot from '../../../components/ads/InlineAdSlot.jsx';
 import { ReplyMsg } from './Transcript.jsx';
 import { InviteModal, ConfirmModal } from './IdeasModals.jsx';
 import { VerdictAudio } from './VerdictAudio.jsx';
@@ -14,7 +13,7 @@ import { MethodologyLink } from '../../../components/v2/MethodologyLink.jsx';
 import { renderMarkdownLite } from '../../../utils/markdownLite.js';
 import { formatTimeAgo, formatChrono, useChronometer, chronoProgress } from './utils.js';
 
-export function DebateDetail({ debate, lang, user, onBack }) {
+export function DebateDetail({ debate, lang, onBack }) {
   const { t, i18n } = useTranslation();
   const [replyText, setReplyText] = useState('');
   const [replying, setReplying] = useState(false);
@@ -165,18 +164,6 @@ export function DebateDetail({ debate, lang, user, onBack }) {
 
       {debate.error && <div className="ierr">{debate.error}</div>}
 
-      {/* Sponsored slot while the verdict generates (parity) */}
-      {debate.wrapupLoading && (
-        <InlineAdSlot
-          key={`ideas-debate-${ad.id}-${Number(debate.wrapupLoading)}`}
-          userId={user?.id}
-          placement="constellation"
-          layout="banner"
-          refreshKey={`ideas-debate-${ad.id}-${Number(debate.wrapupLoading)}`}
-          className="debate-footer-ad"
-        />
-      )}
-
       {/* Reply entry */}
       {!debate.wrapup && (
         <div className="abar">
```
