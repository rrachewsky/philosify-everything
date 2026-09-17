# Metodologia — ETAPA 1: Mapeamento (somente leitura) · AGUARDANDO OK

**Data:** 2026-09-01 · **Status:** mapeamento fechado, **nada editado**. Aguardando OK + 3 decisões.
**Canônico:** `docs/philosify-metodologia-canonical-PT.md` (5 seções; tabela de 5 eixos; §2 assinada).

---

## a) Rota `/methodology` — sem colisão

`site/src/Router.jsx`: existem `/a/:slug` (153), `/shared/:id` (154), `/panel/:id` (155), `/tos` (158), `/pp` (159).
**`/methodology` está livre.** Rota neutra, como pedido.

## b) Componente — recomendo **MethodologyPage.jsx dedicado** (não estender LegalPage)

- **DOMPurify:** varredura no site inteiro → **nenhuma** config restritiva (todo uso é `DOMPurify.sanitize(x)` default).
  O allowlist default **permite `<table>/<thead>/<tbody>/<tr>/<th>/<td>`** → a tabela dos eixos renderiza. ✅
- **Recomendação:** `site/src/pages/v2/MethodologyPage.jsx` **dedicado**, reusando o mesmo padrão do LegalPage
  (PageShell interior + ModuleHeader + `DOMPurify.sanitize` + índice a partir dos `<h2>` + prosa; classes
  `legal.css`: `pg-legal`/`legalgrid`/`prose`/`toc`), **sem ticker** e **sem crossdoc**.
  - **Por quê dedicado (e não um 3º doc no LegalPage):** metodologia não é doc legal (sem data/ticker, sem
    link cruzado); e o LegalPage acabou de ir a produção servindo `/tos`+`/pp` — **isolar evita regressão**
    num componente jurídico recém-deployado. Custo: ~25 linhas duplicadas do padrão sanitize+TOC (aceitável).
  - **Alternativa** (se preferir DRY): 3º `doc="methodology"` no LegalPage com 3 condicionais (título, pular
    ticker, pular crossdoc). Funciona, mas toca o componente do /tos //pp.

## c) Chaves i18n (18 idiomas)

- **`legal.methodology.content`** (HTML, como `legal.privacy.content`).
- **`v2.legal.methodologyTitle`** (título do ModuleHeader; padrão dos `v2.legal.*Title`).
- **`v2.legal.methodologyLink`** (rótulo do link de entrada — usado nos 4 pontos, para ser traduzido). Ex.:
  "Methodology" / "Metodologia" / "Metodología" / "Méthodologie" / … (proponho preencher nos 18).

## d) Os 4 pontos de entrada (file:line) — **com surpresa estrutural**

| Ponto | Onde | Cobertura |
|---|---|---|
| **1. veredito/scorecard** | `site/src/components/v2/AnalysisStack.jsx:88` — função `Verdict`, `<span className="vlabel">{label}</span>` | **1 edit cobre música (MusicPage:922), cinema (cinema/AnalysisSections:120), literatura (literature/AnalysisSections:120) + `SharedAnalysis.jsx:445` desses 3.** |
| **2. compartilhadas** | `/a/:slug` e `/shared/:id` → `SharedAnalysis.jsx` usa o **mesmo** `Verdict` (445) | **Coberto pelo ponto 1** (música/cinema/lit). |
| **2b. panel permalink** | `/panel/:id` → `PanelPermalink.jsx` usa `PanelAnalysisCards` (108), **não** o `Verdict` | **Edit próprio** (após header do painel, ~106/108). |
| **3. landing** | `LandingPage.jsx` — abaixo do hero, após a `selectline` (~linha 56) | isolado. |
| **4. footer** | `FooterV2.jsx:11–13` (`/tos`,`/pp` — labels **hardcoded**) | isolado; add `/methodology`. |

**⚠️ SURPRESA (decisão 2):** o "um ponto de código" vale para **música/cinema/literatura** (todas passam pelo
`Verdict` compartilhado). Mas **Notícias** e **Ideias NÃO** têm bloco de veredito/scorecard clássico:
- **Notícias** = layout de 4 caixas (The Facts / Source Analysis / Hits&Misses / Opinion) — `NewsPage.jsx` ~705–727
  e o ramo news de `SharedAnalysis.jsx` 415–441. Sem `Verdict`.
- **Ideias** = veredito em **áudio** (`VerdictAudio`), sem classificação/scorecard — `IdeasPage.jsx` não importa `Verdict`.

→ Para o link aparecer em **todas as 5** análises (como você pediu), preciso de **inserções próprias** em
Notícias e Ideias (e no `/panel/:id`), além do ponto 1. Isso são ~4 pontos de edição, não 1.

## e) Terminologia por idioma (reuso EXATO da UI)

Eixos (`ethics/metaphysics/epistemology/politics/aesthetics`), pólos (`doctrinaireConformist`,
`extremelyRevolutionary`), Painel (`philosopherPanel.button`), veredito (`v2.<dom>.verdictLabel`):

| lang | Ética | Metafísica | Epistemol. | Política | Estética | polo conformista | polo revolucionário | Painel | veredito |
|---|---|---|---|---|---|---|---|---|---|
| en | Ethics | Metaphysics | Epistemology | Politics | Aesthetics | Doctrinaire Conformist | Extremely Revolutionary | Philosopher Panel | Philosify Verdict |
| pt | Ética | Metafísica | Epistemologia | Política | Estética | **Conformista Doutrinária** | Extremamente Revolucionária | Painel de Filósofos | Veredito Philosify |
| es | Ética | Metafísica | Epistemología | Política | Estética | Conformista Doctrinaria | Extremadamente Revolucionaria | Panel de Filosofos | Veredicto Philosify |
| fr | Éthique | Métaphysique | Épistémologie | Politique | Esthétique | Conformiste Doctrinaire | Extrêmement Révolutionnaire | Panneau de Philosophes | Verdict Philosify |
| de | Ethik | Metaphysik | Erkenntnistheorie | Politik | Ästhetik | Doktrinär Konformistisch | Extrem Revolutionär | Philosophen-Panel | Philosify-Urteil |
| it | Etica | Metafisica | Epistemologia | Politica | Estetica | Conformista Dottrinaria | Estremamente Rivoluzionaria | Panel dei Filosofi | Verdetto Philosify |
| nl | Ethiek | Metafysica | Epistemologie | Politiek | Esthetiek | Doctrinair Conformistisch | Extreem Revolutionair | Filosofenpanel | Philosify-oordeel |
| pl | Etyka | Metafizyka | Epistemologia | Polityka | Estetyka | Doktrynalnie Konformistyczny | Ekstremalnie Rewolucyjny | Panel Filozofow | Werdykt Philosify |
| hu | Etika | Metafizika | Ismeretelmélet | Politika | Esztétika | Doktriner Konformista | Rendkívül Forradalmi | Filozofus Panel | Philosify-ítélet |
| tr | Etik | Metafizik | Epistemoloji | Politika | Estetik | Doktriner Uyumcu | Son Derece Devrimci | Filozof Paneli | Philosify Kararı |
| ru | Этика | Метафизика | Эпистемология | Политика | Эстетика | Доктринально Конформистская | Крайне Революционная | Панель философов | Вердикт Philosify |
| ar | الأخلاق | الميتافيزيقا | نظرية المعرفة | السياسة | علم الجمال | محافظ عقائدي | ثوري للغاية | لجنة الفلاسفة | حكم Philosify |
| fa | اخلاق | متافیزیک | معرفت‌شناسی | سیاست | زیبایی‌شناسی | محافظه‌کار دگماتیک | بسیار انقلابی | پنل فیلسوفان | حکم Philosify |
| he | אתיקה | מטאפיזיקה | אפיסטמולוגיה | פוליטיקה | אסתטיקה | קונפורמי דוקטרינרי | מהפכני ביותר | פאנל פילוסופים | פסק הדין של Philosify |
| hi | नैतिकता | तत्वमीमांसा | ज्ञानमीमांसा | राजनीति | सौंदर्यशास्त्र | सिद्धांतवादी अनुरूपवादी | अत्यंत क्रांतिकारी | दार्शनिक पैनल | Philosify का फैसला |
| zh | 伦理学 | 形而上学 | 认识论 | 政治学 | 美学 | 教条守旧 | 极度革命性 | 哲学家面板 | Philosify裁决 |
| ja | 倫理 | 形而上学 | 認識論 | 政治 | 美学 | 教条的保守 | 極めて革命的 | 哲学者パネル | Philosify判定 |
| ko | 윤리 | 형이상학 | 인식론 | 정치 | 미학 | 교조적 순응 | 극도로 혁명적 | 철학자 패널 | Philosify 판결 |

**⚠️ CONFLITO (decisão 1) — polo conformista em PT:** o canônico §3 escreve **"Doutrinariamente Conformista"**,
mas a **UI exibe "Conformista Doutrinária"** (`doctrinaireConformist`). O invariante 2d ("rótulos idênticos à
UI") colide com a 2a ("sem alteração de conteúdo"). Pior: o **§5 do canônico argumenta sobre "o prefixo
'doutrinariamente'"** — se o rótulo virar "Doutrinária", essa frase precisa mudar. O polo revolucionário
**bate** ("Extremamente Revolucionária" ✓). Eixos/Painel/veredito do canônico **batem** com a UI-PT.

## f) Plano de arquivos

- **Novo:** `site/src/pages/v2/MethodologyPage.jsx` (b).
- **Rota:** `site/src/Router.jsx` — `+<Route path="/methodology" element={<MethodologyPage />} />`.
- **i18n (18):** `legal.methodology.content`, `v2.legal.methodologyTitle`, `v2.legal.methodologyLink` (c).
- **Pontos de entrada:** `AnalysisStack.jsx` (1) [+ Notícias/Ideias/`PanelPermalink` conforme decisão 2],
  `LandingPage.jsx` (3), `FooterV2.jsx` (4).
- **CSS:** reuso de `legal.css`; se a tabela pedir, um bloco `.pg-legal table{…}` em `legal.css`.
- Método i18n: cirúrgico byte-estável CRLF (como Privacy v2).

## DECISÕES QUE PRECISO DE OK

1. **Rótulo do polo conformista (PT):** usar o exato da UI **"Conformista Doutrinária"** (e ajustar a frase do
   §5 sobre o prefixo) — ou **manter "Doutrinariamente Conformista"** do canônico? (governa também o tom dos 16.)
2. **Escopo do ponto 1:** o link único (`AnalysisStack.jsx:88`) cobre **música/cinema/literatura + compartilhadas**.
   Incluo também **Notícias, Ideias e `/panel/:id`** (para "todas as análises", ~3 edits extras) — ou o link fica
   só onde há veredito/scorecard clássico?
3. **Componente:** `MethodologyPage.jsx` dedicado (recomendo) — ou estender `LegalPage`?

**Nada será editado antes do OK + estas 3 decisões.**
