# News — seis perguntas obrigatórias + layout de quatro boxes

**31 Jul 2026**
**Parte A: diagnóstico feito, diff proposto, NADA APLICADO** — aguardando aprovação.
**Parte B: no ar** — deploy `89fe4c07`, commit `855573f`.

---

# PARTE A — as seis perguntas

## 1. Diagnóstico: o alvo da correção não é o guia

> **O guia do News no KV nunca instruiu as seis perguntas.** Elas não foram
> removidas nem enfraquecidas de lá — nunca estiveram lá.

O que existe no KV é `guide_text`, o **guia filosófico** (`Guide_v2.9_LITE.txt`,
526 linhas), usado por todos os módulos. Procurei nele por "news", "5W", "who",
"what", "when": **nenhuma ocorrência**. Ele é injetado na análise de notícia como
*referência filosófica*, não como formato de saída.

Quem define o formato de saída do News é **código**:
`api/src/ai/prompts/news-analysis-template.js`.

### O trecho atual, na íntegra (linhas 131–146)

```
━━━ FIELD 1: "the_facts" (~200-300 words) ━━━

Establish the objective facts using the 5W+H framework:
- What: What happened? What is the core event or development?
- Who: Who are the actors involved (individuals, institutions, governments)?
- Where: Where did this occur (geographic, institutional, jurisdictional)?
- When: When did this happen (date, timeline, sequence of events)?
- How: How did this event unfold (mechanism, process, chain of actions)?
- Why: Why did this happen according to the SOURCE (the source's stated reasons)?

RULES for this field:
- State ONLY verified, objective facts. No opinion. No analysis.
- The "Why" here is the source's version of why — NOT your analysis.
- If facts are uncertain or unverified, say so explicitly.
- Be precise with dates, names, and figures.
```

### Por que o modelo não produz as perguntas

As seis aparecem como **orientação analítica** — "estabeleça os fatos usando o
quadro 5W+H". Nenhuma das quatro RULES pede estrutura, rótulo, ordem ou
obrigatoriedade. **Não há instrução de formato em nenhuma direção**, então o
modelo faz o que um modelo faz sem instrução de forma: escreve prosa corrida.

Ele **não está omitindo o conteúdo** — cobre os ângulos dentro do texto. O que
não existe é a estrutura visível.

> **Correção a uma afirmação minha anterior.** Eu disse que a regra "escreva como
> um ensaio coeso, não em tópicos" empurrava OS FATOS para a prosa. **Errado:**
> essa regra pertence ao FIELD 4 (`philosify_opinion`), não ao FIELD 1. O FIELD 1
> simplesmente não diz nada sobre forma. O efeito prático é o mesmo, mas a causa
> que descrevi estava errada.

## 2. Consequência: não há upload para o KV

A correção é **um arquivo de código**. Isso significa:

- o guia filosófico continua **intocado** — nenhum outro módulo é afetado;
- a **prova de guia** (SHA-256 exibida nos resultados) **não muda**;
- não há `wrangler kv:key put`;
- deploy = `wrangler deploy` do Worker.

É mais barato e mais seguro do que a instrução previa. **Mas continua sendo
mudança de comportamento do modelo, então segue aguardando sua aprovação.**

## 3. DIFF PROPOSTO — não aplicado

### 3.1 FIELD 1 — as seis perguntas como estrutura obrigatória

A lista é reordenada para a ordem que você ditou (**o quê / quem / quando / onde
/ como / por quê**); hoje o template tem *onde* antes de *quando*.

```diff
 Establish the objective facts using the 5W+H framework:
 - What: What happened? What is the core event or development?
 - Who: Who are the actors involved (individuals, institutions, governments)?
-- Where: Where did this occur (geographic, institutional, jurisdictional)?
 - When: When did this happen (date, timeline, sequence of events)?
+- Where: Where did this occur (geographic, institutional, jurisdictional)?
 - How: How did this event unfold (mechanism, process, chain of actions)?
 - Why: Why did this happen according to the SOURCE (the source's stated reasons)?
 
 RULES for this field:
+- MANDATORY STRUCTURE — NO EXCEPTIONS. Answer ALL SIX questions, each as its own
+  paragraph, in the order above, opened by its label in HTML bold:
+  <strong>What:</strong> ... <strong>Who:</strong> ... <strong>When:</strong> ...
+  <strong>Where:</strong> ... <strong>How:</strong> ... <strong>Why:</strong> ...
+- Write the six labels in ${targetLanguage}, in that language's natural register
+  (PT: O quê / Quem / Quando / Onde / Como / Por quê).
+- Use <strong> HTML tags. NEVER markdown asterisks — they are not rendered.
+- If the material does not establish an answer, STILL write that question's
+  paragraph and say plainly that the source does not establish it.
+  NEVER drop a question.
 - State ONLY verified, objective facts. No opinion. No analysis.
 - The "Why" here is the source's version of why — NOT your analysis.
 - If facts are uncertain or unverified, say so explicitly.
 - Be precise with dates, names, and figures.
```

### 3.2 FIELD 3 — omissões obrigatórias

**Observação importante:** a análise de omissões **já está instruída** desde
antes. O bloco existe:

```
OMISSIONS (what the source leaves out):
- Relevant information the source does not mention
- Why these omissions matter for understanding the full picture
```

O que faltava não era a instrução — era **o rótulo da caixa na interface**, que
dizia "Confiabilidade" e escondia que ali havia omissões. Isso a Parte B
resolveu. O diff abaixo só torna o bloco **inescapável**:

```diff
 RULES for this field:
 - Every hit and miss MUST have a concrete reason ("because...").
 - Do NOT make vague claims. Be specific about what is right or wrong and why.
 - Distinguish between factual errors and analytical/framing errors.
+- The OMISSIONS block is MANDATORY and must never be skipped. Name at least one
+  thing the source left out, or state explicitly that you found none and why.
+  What a source silences is an editorial choice and belongs in the evaluation.
```

### Conformidade

| Exigência | Situação |
|---|---|
| Mudança mínima | 9 linhas adicionadas, 2 reordenadas. Nada removido |
| Non-disclosure intacto | Não toca as regras que proíbem nomear a referência filosófica, "conselheiros", "painel" |
| Language Integrity | Rótulos no idioma alvo, registro natural, explicitamente instruído |
| Sem efeito em score | News não tem score. O diff não toca scorecard, nota ou classificação |
| Guia/KV | **Não tocados** |

## 4. Duas consequências a aceitar antes

1. **Análises já em cache nunca terão as perguntas.** Notas são imutáveis. Só as
   novas nascem no formato novo, e os dois formatos vão coexistir.
2. **OS FATOS muda de natureza:** deixa de ser ensaio corrido e vira briefing de
   seis entradas rotuladas. É outra coisa de ler.

## 5. O realce `<hl>` continua depois

Conforme sua ordem: o `<hl>` só entra **depois** das perguntas existirem. O draft
`philosify-guide-hl-addition-draft.md` segue intocado, untracked, sem modificação
desde 30 Jul 16:20. Nada em guia ou KV.

---

# PARTE B — layout de quatro boxes

**No ar:** deploy `89fe4c07`, commit `855573f`. Lint de tokens verde, build limpo.

## O que estava errado

```
.v2 .pg-news .scan { display:grid; grid-template-columns:1.4fr 1fr }
```

OS FATOS à esquerda; ANÁLISE DA FONTE e ACERTOS/ERROS empilhados à direita;
OPINIÃO por baixo, fora do grid. **Linhas de grid esticam por padrão**, então a
caixa alta de OS FATOS era forçada a acompanhar a altura da coluna curta ao lado
— e o excedente virava espaço morto dentro dela.

## O que ficou

```css
.v2 .pg-news .scan{display:flex;flex-direction:column;gap:16px;margin-top:16px}
.v2 .pg-news .scan > .cell{height:auto;align-self:stretch}
```

Coluna única, largura total da coluna de leitura, `gap` de 16px, cada caixa
dimensionada pelo próprio texto. Ordem lógica no JSX:

1. **OS FATOS**
2. **ANÁLISE DA FONTE**
3. **ACERTOS, ERROS E OMISSÕES**
4. **OPINIÃO DO PHILOSIFY**

## Títulos restaurados

A página v2 inventava `v2.news.framingTitle` ("ENQUADRAMENTO") e
`v2.news.reliabilityTitle` ("CONFIABILIDADE"). Ambos agora usam as **chaves v1**,
que já existiam nos 18 locales — mesmo tratamento que "Os Fatos" recebeu em 30 Jul.

**Dois defeitos encontrados nas chaves v1 e corrigidos:**

**Acentos comidos** em `sourceAnalysisTitle` — cinco locales carregavam a forma
sem acento, violação da Language Integrity:

| Locale | Antes | Agora |
|---|---|---|
| es | Analisis de la Fuente | Análisis de la Fuente |
| hu | Forras Elemzese | Forráselemzés |
| pl | Analiza Zrodla | Analiza Źródła |
| pt | Analise da Fonte | Análise da Fonte |
| tr | Kaynak Analizi | Kaynak Analizi *(já correto)* |

**Omissões ausentes do rótulo** em `hitsAndMissesTitle` — reescrito nos 18:

| Locale | Agora |
|---|---|
| pt | Acertos, Erros e Omissões |
| en | Hits, Misses and Omissions |
| es | Aciertos, Errores y Omisiones |
| fr | Points Justes, Erreurs et Omissions |
| de | Treffer, Fehler und Auslassungen |
| it | Punti Giusti, Errori e Omissioni |
| nl | Treffers, Missers en Omissies |
| pl | Trafienia, Błędy i Pominięcia |
| tr | İsabetler, Hatalar ve Eksiklikler |
| hu | Találatok, Hibák és Kihagyások |
| ru | Попадания, промахи и умолчания |
| zh | 正确、错误与遗漏 |
| ja | 的中・誤り・欠落 |
| ko | 적중, 오류 및 누락 |
| ar | الإصابات والأخطاء والإغفالات |
| he | הצלחות, כשלים והשמטות |
| hi | सही, गलत और चूक |
| fa | نقاط قوت، خطاها و حذفیات |

## Superfícies tocadas

```
site/src/pages/v2/NewsPage.jsx          estrutura das 4 caixas
site/src/styles/v2-pages/news.css       grid -> coluna; regras mortas removidas
site/src/i18n/translations/*.json       18 arquivos, 22 valores reescritos
```

**Regras removidas por terem ficado mortas:** `.scan .side`, `.scan .side h2`,
`.pg-news .opinion`, `.prose.sm` e o `grid-template-columns` do breakpoint de
860px.

## Verificação em produção

✅ **CSS confirmado ao vivo** em `philosify.org/news`:

```
.v2 .pg-news .scan        → display: flex; flex-direction: column;
                             gap: 16px; margin-top: 16px
.v2 .pg-news .scan > .cell → height: auto; align-self: stretch
```

✅ **As quatro regras mortas sumiram do CSS servido:** `.scan .side`,
`.scan .side h2`, `.prose.sm` e `.pg-news .opinion` — nenhuma presente.

✅ **Traduções no bundle publicado** (`/assets/pt-BBP2lYYq.js`, 179 KB):

```
sourceAnalysisTitle : "Análise da Fonte"        (acento restaurado)
hitsAndMissesTitle  : "Acertos, Erros e Omissões"
```

❓ **O que continua sem observação direta:** as quatro caixas renderizadas com
conteúdo real, empilhadas e sem espaço morto. Isso exige uma análise de notícia
concluída, que depende de sessão autenticada. As regras que produzem o
empilhamento estão confirmadas no ar; o resultado visual, não.
