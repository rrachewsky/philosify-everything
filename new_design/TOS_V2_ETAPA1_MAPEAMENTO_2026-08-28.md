# ToS v2 — Etapa 1: Mapeamento (somente leitura)

**Data:** 2026-08-28 · **Branch:** redesign/v2 · **Status:** aguardando OK do Bob para a Etapa 2

---

## 0. Texto canônico — divergência de caminho

`docs/tos-v2-canonical-EN.md` **não existe**. O único candidato no repositório é:

- **`docs/philosify-tos-v2-draft-EN.md`** — "Terms of Service", 13 seções, Global Goods Corp, bob@philosify.org, foro NY, 2 welcome credits, 20/US$6.00 · 40/US$10.00 · 100/US$20.00, Unsafe Zone (seção 7), ressalva de consumidor (seções 11 e 12), SHA-256 (seção 6). Effective Date: `[upon publication]`.

Conteúdo bate 100% com a descrição da tarefa. **Pendente: confirmação do Bob de que este draft É o canônico aprovado.**

---

## a) Onde o /tos vive

| Item | Caminho |
|---|---|
| Rota | `site/src/Router.jsx:158` → `<Route path="/tos" element={<LegalPage doc="terms" />} />` |
| Rota privacidade | `site/src/Router.jsx:159` → `<Route path="/pp" element={<LegalPage doc="privacy" />} />` |
| Componente | `site/src/pages/v2/LegalPage.jsx` |
| Conteúdo | Chave i18n **`legal.terms.content`** — UMA string HTML por idioma (`<h2>`/`<p>`/`<ul>`), sem chaves por seção |
| Arquivos de idioma | `site/src/i18n/translations/<código>.json` (react-i18next, 1 JSON por língua) |
| Sanitização | DOMPurify default; TOC gerado dos `<h2>` (numeração "1." é removida do label automaticamente) |
| Ticker de data | Chave **`v2.legal.updated`** por idioma ("Last updated // 27 Jul 2026" e equivalentes) + fallback hardcoded em `LegalPage.jsx:136` |
| Título da página | Chave **`legal.terms.title`** por idioma |

**Código morto (não roteado, não importado em lugar nenhum):**
- `site/src/pages/TermsOfService.jsx` e `site/src/pages/PrivacyPolicy.jsx` (páginas v1)
- `site/src/components/legal/TermsModal.jsx` + `PrivacyModal.jsx` — alimentados pelas chaves i18n `terms.*` / `privacy.*` (efetivo "November 10, 2025", "2 free analyses… $0.30 each"). É daí que vem a memória do ToS de 10/11/2025. Obs.: **"$0.60" não existe em lugar nenhum do repo** — o valor no código morto é $0.30.

Quem aponta para `/tos`: FooterV2, LandingPage v2, SignUpPage v2, SignupModal, App.jsx/HomePage/LandingScreen (v1). Nenhuma outra superfície viva de ToS.

## b) Os 18 idiomas

`ar, de, en, es, fa, fr, he, hi, hu, it, ja, ko, nl, pl, pt, ru, tr, zh` — todos com `legal.terms.content` **traduzido** (boilerplate antigo de 10 seções, sem preços nem data efetiva). RTL: ar, fa, he (via `data-rtl`).

## c) /privacy NÃO existe

O path real é **`/pp`**. `/privacy` cai no catch-all (`Router.jsx:174`) e redireciona para `/`. A seção 8 do canônico linka `https://philosify.org/privacy` → **precisa virar `/pp`** (ou reformular a seção). **Decisão do Bob.**

## d) Terminologia já estabelecida na UI, por idioma

Chaves-fonte: `payment.credits`, `unsafeZone.title`, `transactions.signupBonus`, `community.collective.analysis`, `philosopherPanel.button`.

| Lang | credits | Unsafe Zone | signup bonus | analysis | Philosopher Panel |
|---|---|---|---|---|---|
| en | credits | Unsafe Zone | Free signup bonus | analysis | Philosopher Panel |
| pt | créditos | Zona Insegura | Bônus de cadastro gratuito | análise | Painel de Filósofos |
| es | créditos | Zona Insegura | Bono de registro gratuito | análisis | Panel de Filósofos |
| fr | crédits | Zone Dangereuse | Bonus d'inscription gratuit | analyse | Panneau de Philosophes |
| de | Credits | Unsichere Zone | Kostenloser Anmeldebonus | Analyse | Philosophen-Panel |
| it | crediti | Zona Insicura | Bonus registrazione gratuito | analisi | Panel dei Filosofi |
| nl | credits | Onveilige Zone | *(inglês)* | analyse | Filosofenpanel |
| pl | kredyty | Niebezpieczna Strefa | *(inglês)* | analiza | Panel Filozofów |
| ru | кредиты | Опасная Зона | Бесплатный бонус за регистрацию | анализ | Панель философов |
| tr | kredi(ler) | Güvensiz Bölge | *(inglês)* | analiz | Filozof Paneli |
| hu | kredit(ek) | Veszélyes Zóna | Ingyenes regisztrációs bónusz | elemzés | Filozófus Panel |
| ar | رصيد / الأرصدة | المنطقة الخطرة | مكافأة التسجيل المجانية | تحليل | لجنة الفلاسفة |
| fa | اعتبار | منطقه خطر | پاداش ثبت‌نام رایگان | تحلیل | پنل فیلسوفان |
| he | קרדיטים | אזור לא בטוח | בונוס הרשמה חינם | ניתוח | פאנל פילוסופים |
| hi | क्रेडिट | असुरक्षित क्षेत्र | मुफ्त साइनअप बोनस | विश्लेषण | दार्शनिक पैनल |
| zh | 积分 | 危险区域 | 免费注册奖励 | 分析 | 哲学家面板 |
| ja | クレジット | 危険地帯 | 無料登録ボーナス | 分析 | 哲学者パネル |
| ko | 크레딧 | 위험 구역 | 무료 가입 보너스 | 분석 | 철학자 패널 |

**"Welcome credits" ainda não existe na UI em nenhuma língua** — hoje a UI diz "2 free analyses" (`signup.subtitle`, `v2.landing.guestLine`) e "Free signup bonus" (`transactions.signupBonus`). O ToS v2 introduz o termo; em cada língua será cunhado coerente com o vocabulário acima (pt: "créditos de boas-vindas", conforme especificado).

## e) Plano de aplicação (Etapa 2, após OK)

**Arquivos a modificar — 18, um por idioma:** `site/src/i18n/translations/{en,pt,es,fr,de,it,nl,pl,ru,tr,hu,ar,fa,he,hi,zh,ja,ko}.json`

Em cada um:
1. `legal.terms.content` → novo ToS v2 (13 seções) convertido de markdown para a string HTML do formato atual, com data efetiva no topo do texto;
2. `v2.legal.updated` → nova data, no formato local já usado em cada língua;
3. `legal.terms.title` → traduzir nos 3 idiomas onde está em inglês (nl, pl, tr) — *pende OK*.

Fora dos JSONs (opcional, 1 linha): atualizar o fallback de data em `LegalPage.jsx:136` — *pende OK*.

### Complicações encontradas (babysteps — decisões do Bob)

1. **Canônico em caminho divergente** (`philosify-tos-v2-draft-EN.md` com "draft" no nome) — confirmar que é o aprovado.
2. **Link da seção 8**: `/privacy` → `/pp` (proposta: usar caminho relativo `/pp`).
3. **Data efetiva** = data da aplicação (hoje seria 2026-08-28) — confirmar.
4. **Código morto** (modais v1 com $0.30/10-11-2025): fora do escopo; fica intocado. Remoção é tarefa separada, se desejada.
5. **Strings de UI "2 free analyses"** (`signup.subtitle`, `v2.landing.guestLine`) e "Free signup bonus": inconsistentes com o novo modelo de welcome credits — fora do escopo do ToS; apenas registrado.
6. `/pp` (Privacy Policy) segue com o texto antigo — a tarefa cobre só o ToS. A seção 8 do novo ToS apontará para essa política antiga até ela ser revisada.

**Nenhum arquivo foi modificado. Aguardando OK.**
