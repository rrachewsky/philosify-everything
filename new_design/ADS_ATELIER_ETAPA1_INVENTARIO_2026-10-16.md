# ADS ATELIER · ETAPA 1 · Inventário do estado atual

**Status:** INVENTÁRIO somente leitura · 16/10/2026 · nada editado, nada em deploy. Entregável para você e o Bob dimensionarem o redesenho (Etapa 2).
**Capturas:** `new_design/printscreen_ads_atelier_2026-10-16/` (01 landing topo · 02 posicionamentos · 03 política · 04 login anunciante · 05 signup · 06 login agência · 07 login admin · 08 landing meio). Áreas logadas (dashboard, campanhas, billing, agência, admin) não foram capturadas: exigem conta de anunciante ou o segredo de admin.

---

## 1. O que o Atelier é hoje

### 1.1 Stack

| Camada | Hoje | Evidência |
|---|---|---|
| Front | React 19 + Vite 8, SPA própria em `ads/`, Cloudflare Pages projeto **`philosify-ads`**, branch `production`, domínio ads.philosify.org | `ads/package.json`, `npm run deploy` |
| Backend | **Não tem worker próprio.** Vive no worker principal `philosify-api` sob `/api/ads/*` (18 módulos em `api/src/handlers/ads/`) | `api/index.js:230-296` |
| Banco | Supabase, **schema `ads`** separado (`advertisers`, `ad_campaigns`, `ad_orders`, `ad_impressions`, `advertiser_transactions`, `advertiser_sessions`, `cpm_pricing`/`pricing_config`, `inventory_forecast`, `user_profiles`, `targeting_options`, agências) | `api/migrations/004…009_ads_*.sql` |
| Storage | R2 `/ads/` para criativos; servidos por `/api/ads/creative/*` | `creatives.js` |
| Pagamento | Stripe, mesma conta; **saldo pré-pago** (`balance_cents`) via Checkout + webhook `/api/ads/billing/webhook` | `billing.js` |
| Auth | JWT próprio (`ADS_JWT_SECRET`), cookie HttpOnly; admin por `X-Admin-Secret` | `auth.js`, `admin-auth.js` |
| E-mail | Resend, remetente `Philosify Ads <ads@philosify.org>` | `emails.js:10` |
| Último deploy | **há 2 meses** (78040814); antes disso, há 6 meses. Último commit em `ads/`: 31/07 ("30s video duration") | `wrangler pages deployment list`, `git log -- ads/` |

### 1.2 Páginas (rotas de `ads/src/App.jsx`)

| Área | Rotas | Páginas |
|---|---|---|
| Pública | `/` `/placements` `/policy` `/login` `/signup` | Landing, Posicionamentos, Política, Login, Cadastro |
| Anunciante (`/app/*`) | `/app` `/app/campaigns` `/app/new` `/app/campaigns/:id` `/app/billing` `/app/analytics` `/app/placements` `/app/settings` | Dashboard, Campanhas, Criar campanha (wizard de 3 passos), Detalhe, Billing, Analytics, Posicionamentos, Configurações |
| Agência (`/agency/*`) | `/agency/login` `/agency/signup` `/agency` `/agency/clients` `/agency/clients/:id/campaigns` `/agency/earnings` | Portal de agências (comissão padrão 15%, saque a partir de US$100) |
| Admin | `/admin/login` `/admin` | "Sala de controle": aprovações de anunciantes, pedidos de criativo, lançamentos |

### 1.3 Fluxo do anunciante

1. **Cadastro** (`/signup`): e-mail, nome da empresa, site, senha, aceite da Política.
2. **Vetting automático por IA** (`vetting.js`): score ≥ 80 → `approved` na hora (e-mail de aprovação); senão `pending` → e-mail ao admin → aprovação/rejeição manual na sala de controle (e-mails de aprovação/rejeição).
3. **Espaço**: wizard `/app/new` em 3 passos — posicionamento (`sidebar` ou `constellation`) × duração (5/10/15/20/30 s) × impressões → cálculo CPM + taxa de criativo; segmentação opcional (idioma, país, gênero, escola filosófica, engajamento: `007_ads_targeting`).
4. **Criativo**: `self` (upload: PNG/JPG/GIF/WebP ≤ 2 MB, MP4/WebM ≤ 50 MB, assinatura de bytes conferida) ou `philosify` (brief → moderação por palavras-chave + OpenAI Moderation → geração por IA → fila de revisão do admin → e-mail "creative ready").
5. **Pagamento**: saldo pré-pago (Stripe Checkout → webhook credita `balance_cents` → e-mail de depósito); o pedido debita do saldo (e-mail de confirmação de pagamento).
6. **Veiculação**: `GET /api/ads/serve?placement=…` no produto; cap por usuário/IP por dia; impressões e cliques em `ad_impressions`; ao esgotar, e-mail de campanha concluída com números; e-mail de saldo baixo.

### 1.4 Idiomas

- 18 arquivos em `ads/src/i18n/translations/`, carregados sob demanda; seletor de idioma na landing (faixa de 18 pills).
- **Cobertura desigual:** `en` tem 586 chaves; 13 idiomas (pt incluído) têm 510 (**76 faltando**), e de/es/hu/pl/tr têm 517 (69 faltando). Os buracos são as áreas mais novas: `admin` (16), `dashboard` (16), `feedback` (13), `detail` (10), `create` (9), `agency` (7), `common` (3), `header` (2). Caem em inglês por fallback.
- Página de Política traduzida (pt conferido na captura 03).

### 1.5 E-mails transacionais (`api/src/handlers/ads/emails.js`)

| # | E-mail | Gatilho | Para |
|---|---|---|---|
| 1 | Conta aprovada | vetting ≥ 80 ou aprovação manual | anunciante |
| 2 | Conta rejeitada (com motivo) | rejeição manual | anunciante |
| 3 | Pagamento confirmado | pedido pago | anunciante |
| 4 | Campanha no ar | pedido ativado | anunciante |
| 5 | Campanha concluída (impressões, cliques) | entrega completa | anunciante |
| 6 | Criativo pronto para revisão | admin marca `ready` | anunciante |
| 7 | Depósito confirmado | webhook Stripe | anunciante |
| 8 | Saldo baixo | cron/serve | anunciante |
| 9 | Novo anunciante pendente | signup com score < 80 | admin |
| 10 | Pedido de criativo | pedido com `creative_type=philosify` | admin |

**Língua: só inglês**, assuntos e corpos fixos no código (nenhum `t()`, nenhuma leitura do idioma do anunciante). **Identidade visual:** wrapper próprio com fundo `#070708` e Michroma no título, mas **sem o lockup** (título em texto "Philosify Ads" em **ciano `#00f0ff`**), botões sólidos ciano com borda arredondada 8 px, caixas `#1a1a2e` com borda esquerda ciano, rodapé "Philosify Ads Platform". Diverge do padrão de setembro do produto (`api/src/auth/email.js`: lockup transparente de 200 px servido de philosify.org/brand, título branco em Michroma 16 px, texto sóbrio, botão outline fino, 18 idiomas por `preferred_language`).

## 2. Delta visual contra o Design Law v2

O Atelier nasceu antes da identidade atual (código de abril, último retoque em julho) e **não compartilha nada** do kit v2 (`site/src/styles/v2-*.css`): nem tokens, nem fontes, nem componentes.

| Canon v2 (`philosify-design-law.md`) | Atelier hoje | Captura |
|---|---|---|
| **Lockup oficial** vertical (coruja + linha + "philosify" em Michroma), único asset `philosify-logo-lockup.png`, só no header fixo, sempre link para a home; nunca a coruja sozinha | `public/logo.png`: **ícone redondo com a coruja** em moldura, ao lado de "PHILOSIFY COMMERCIAL ATELIER / Ads Atelier" em Manrope; nas páginas de auth, só o ícone redondo | 01, 04, 05 |
| **Fontes:** Michroma (títulos, wordmark), Inter (chrome), Newsreader (prosa) | **Fraunces** (serifada, títulos) + **Manrope** (todo o resto), via Google Fonts em `global.css:1`. Michroma/Inter/Newsreader ausentes | todas |
| **Paleta:** canvas `#070708`; tintas brancas/cinzas; prata (um elemento por região); ciano `#59D4E4` só em títulos de módulo; magenta `#D6158C` só em barras de progresso; acentos aposentados | Canvas **`#07111f`** (azul-marinho), painéis `rgba(10,18,34,.82)` com **gradiente e sombra**, acento **`#67e8f9`** (ciano claro) + **`#8b5cf6`** (violeta) em botões com gradiente 135°, eyebrows ciano em caixa alta; mockup com cartão roxo (`#5b3fd0`→) | 01, 02 |
| **Geometria:** cantos retos, hairline 1 px, células de 24 px, grid-veil de 64 px fixo ao viewport, header sem hairline, rodapé sem lockup | Cantos **arredondados grandes** (16–24 px) em todos os cartões/botões/inputs, botões pílula, header em cartão flutuante com sombra, **sem grid de 64 px**, **sem rodapé** em nenhuma página pública (a landing termina nos 4 cartões) | 01, 08 |
| **Ordem vertical:** header fixo → MÓDULO (ciano) → linha marcadora → ticker → conteúdo | Header flutuante → hero serifado grande → métricas em cartões → 4 cartões; sem linha marcadora, **sem ticker** (o Atelier não tem feed) | 01, 08 |
| **Chrome de sessão** no header (idioma, saldo, conta) | Idioma como faixa de 18 pills **abaixo** do header; sem saldo/conta no header público | 01 |
| **Título da aba** | `<title>ads</title>` (`index.html:7`) | — |
| **E-mails** (padrão de setembro, § 1.5) | lockup ausente, ciano `#00f0ff` saturado, botões sólidos arredondados, inglês | — |

**Defeitos de superfície vistos nas capturas (entram de graça no redesenho):** (a) landing, cartões de métricas: "Autoatendimento" e "Automatizado" **sobrepostos** (captura 08); (b) login de agência: links "Criar Conta de Agência" e "Login de anunciante" **colados** sem separador (06); (c) login do admin pede o "X-Admin-Secret" num campo rotulado "Segredo do administrador" (07): nomenclatura técnica na UI; (d) autofill do navegador preenche e-mail/senha nos três logins (04-06) — comportamento do Chrome, não defeito.

## 3. Posições e preços: o que está no ar × a ratificação de 28/07

A ratificação (`philosify-ads-atelier.md`, "Inventory Spec v1 — RATIFIED by Roberto, 28 Jul 2026") define **duas mídias** (Ad Card e Ad Video dentro do card, moldura tracejada, tag `SPONSORED`) em **cinco posições** S1–S5, **contextual puro** (módulo × idioma × mercado), **S3 flat por período**, **S1/S5 CPM premium, S2/S4 CPM padrão**, **sem anúncios na landing e nunca em Unsafe Zone, Constellation, Globo, auth, checkout, legal, nem dentro da coluna de leitura**.

O que o Atelier vende e o produto serve **hoje** (`/api/ads/pricing`, `serve.js:385`, `006_ads_inventory_system.sql`):

| Dimensão | Ratificado 28/07 | No ar | Veredito |
|---|---|---|---|
| Posições | S1 pós-análise · S2 célula patrocinada em listas · S3 "Presented by" sob o ticker · S4 faixa interstício · S5 permalink público | **2 placements**: `sidebar` ("Interstício da Barra Lateral", exibido *durante a espera* da análise, 300×250 / 300×600) e `constellation` ("Painel da Constelação", 250×250) | **Modelo anterior à ratificação.** Nenhuma das cinco posições existe no catálogo; o `sidebar` é vendido como "enquanto a análise roda" (o v2 não tem barra lateral: hoje é `InlineAdSlot layout="card"` em Música/Notícias/Quiz e `layout="banner"` nos debates) |
| Exclusões | Constellation **proibida** | `constellation` é um placement **à venda** (CPM US$8) e `InlineAdSlot placement="constellation"` está montado em `ConstellationInfoPanel.jsx:165` e em `DebatePanel.jsx` (3×) e `DebateDetail.jsx` | **Viola a ratificação** |
| Mídia | Card + vídeo dentro do card; sem formatos livres | Imagem PNG/JPG/GIF/WebP ou vídeo MP4/WebM; o site já desenha a moldura tracejada com tag "Sponsored" (`InlineAdSlot.jsx:216-260`, `ads.css`) | Produto meio alinhado; Atelier promete "300×250 ou 300×600 · PNG, JPG, GIF" |
| Precificação | CPM por posição + S3 flat por período/mercado; sem "duração" | CPM **por duração em segundos** (5/10/15/20/30 s): sidebar US$10/20/30/40/60, constellation US$8 (5 s); **taxa de criativo** US$150–650 por duração; pedido mínimo 1 000 impressões / US$10 | **Eixo diferente** (tempo de exibição em vez de posição); a escada foi corrigida em 31/07 (`philosify-ads-pricing-alerta-31jul.md`) mas segue o modelo antigo |
| Segmentação | Contextual puro: módulo × idioma × mercado; sem comportamental | `targeting_options`: idioma, país/região, **gênero musical, escola filosófica, engajamento** (`ads.user_profiles` por usuário) | Mais do que o ratificado (comportamental por perfil de usuário) |
| Landing do produto | sem anúncios | sem anúncios | OK |

**Conclusão para a Etapa 2:** o redesenho visual é a parte menor; o catálogo (posições, preços, segmentação) **precisa de decisão** antes, porque o Atelier inteiro (wizard, placements page, pricing, inventário, serve) está construído sobre `sidebar`/`constellation` × duração. Três caminhos possíveis para o OK: (A) só a pele v2, catálogo como está; (B) pele v2 + catálogo S1–S5 ratificado (mudança de schema, pricing, wizard, serve e dos slots no produto); (C) pele v2 + ajuste mínimo do catálogo (tirar `constellation` do ar, renomear `sidebar` para o que ele é no v2, manter duração × CPM).

## 4. Pendências herdadas (para as Etapas 3 e 4)

| Pendência | Estado hoje |
|---|---|
| E-mails ×18 na identidade v2 (agosto) | 10 e-mails, só inglês, wrapper próprio sem lockup (§ 1.5). O template e o mecanismo de idioma já existem no produto (`api/src/auth/email.js`): reaproveitar |
| Proporções placement↔criativo (upload) | O upload só valida **tipo e tamanho em bytes** (`creatives.js:11-31,76`); **não lê largura, altura nem proporção**; as dimensões "300×250 ou 300×600" e "250×250" são só texto nas páginas. Em vídeo, nem duração nem proporção são lidas |
| Cobertura i18n do próprio Atelier | 69–76 chaves em inglês por fallback em 17 idiomas (§ 1.4) |

## 5. Tamanho estimado do redesenho (para a decisão)

| Frente | Arquivos | Observação |
|---|---|---|
| Pele v2 (fontes, tokens, lockup, grid, cantos, header fixo, rodapé) | `global.css`, `index.css`, `App.css`, `Header.jsx`, `index.html`, `public/logo.png` → lockup oficial | Dá para herdar `v2-foundation.css`/`v2-components.css` do site copiando o kit (o Atelier é outro projeto Vite, sem pacote compartilhado) |
| Páginas | 14 páginas + 10 componentes | Cada uma usa classes próprias (`.panel`, `.stats-grid`, `.wizard-step`…): reestilizar classe a classe ou migrar para o kit `.cell/.mwrap/.tick` |
| Catálogo (se B ou C) | schema `ads`, `inventory.js`, `planner.js`, `serve.js`, `Placements.jsx`, `CreateCampaign.jsx`, `AdPreview.jsx`, `InlineAdSlot` no produto | B é um ciclo próprio, com migração gated |
| E-mails ×18 | `emails.js` (10 funções) + idioma do anunciante no schema | Etapa 3 |
| Proporções no upload | `creatives.js` + `CreateCampaign.jsx` | Etapa 4; vídeo exige leitura de metadados no cliente (worker não decodifica) |

## 6. Registro

| Passo | Data | Resultado |
|---|---|---|
| Inventário + capturas | 16/10 | este arquivo; 8 capturas |
| Decisão do tamanho (A/B/C do § 3) | 16/10 | caminho B faseado: B0 constelação fora + contextual puro (proposta em ADS_ATELIER_B0_CONSTELACAO_FORA_2026-10-16.md) · B1 catálogo S1–S5 · B2 pele v2 · B3 e-mails ×18 · B4 proporções no upload |
