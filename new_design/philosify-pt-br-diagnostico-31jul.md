# Variante errada de português (pt-PT) — diagnóstico e diff proposto

**31 Jul 2026** · **NADA APLICADO** — diagnóstico e diffs para aprovação.

---

## 1. Diagnóstico

### 1a. O prompt do News especifica pt-BR? **Sim — e é aí que a hipótese simples cai**

Os quatro templates de análise já declaram a variante explicitamente:

| Template | Mapa de idioma |
|---|---|
| `news-analysis-template.js:22` | `pt: "Brazilian Portuguese"` |
| `template.js:17` (Music) | `pt: "Brazilian Portuguese"` |
| `cinema-template.js:22` | `pt: "Brazilian Portuguese"` |
| `literature-template.js:23` | `pt: "Brazilian Portuguese"` |

E o texto gerado a partir disso é enfático:

```
YOU MUST WRITE YOUR ENTIRE RESPONSE IN BRAZILIAN PORTUGUESE.
This is MANDATORY and NON-NEGOTIABLE.
```

**Então o scan de notícia já pede pt-BR.** Se ele está saindo lusitano mesmo
assim, a causa não é ausência de instrução no template — é a instrução ser
contradita, ou pelo menos não reforçada, pelo documento mais longo e mais
autoritativo do prompt: o guia.

### 1b. O código passa o locale certo? **Depende do caminho — e cinco deles passam código ISO cru**

Há dois padrões no sistema, e só um nomeia a variante.

**Padrão A — nomeia o idioma (correto):** os quatro templates acima, via `langNames`.

**Padrão B — manda o código ISO cru (ambíguo):**

```js
Write the ENTIRE response in the language with ISO code "${lang}".
```

Com `lang = 'pt'`, isso entrega ao modelo o código genérico de português.
**`pt` sem subtag de região não distingue Brasil de Portugal** — e modelos tendem
ao europeu quando recebem o código nu, porque `pt-BR` é justamente a marcação que
diferencia. Cinco lugares fazem isso:

| Arquivo | Linha | O que gera |
|---|---|---|
| `ai/prompts/news-panel-template.js` | 142 | **Painel de filósofos sobre notícia** |
| `ai/prompts/philosopher-panel-template.js` | 202 | Painel de filósofos (música, cinema, literatura) |
| `handlers/news-translate.js` | 42 | **Tradução de manchete e descrição de notícia** |
| `handlers/quiz.js` | 429 | Tradução de pergunta de quiz |
| `handlers/unsafe-zone.js` | 314 | Diálogo da Unsafe Zone |

> **Dois desses estão dentro do módulo News** — o painel e a tradução das
> manchetes. É bastante provável que o português de Portugal que você viu venha
> de um deles, e não do scan.

### 1c. É específico do News? **Não. É transversal, com dois graus de exposição**

| Módulo / superfície | Como pede o idioma | Exposição |
|---|---|---|
| Music, Cinema, Literature — análise | "Brazilian Portuguese" | baixa |
| News — scan | "Brazilian Portuguese" | baixa |
| News — painel de filósofos | ISO cru `"pt"` | **alta** |
| News — tradução de manchetes | ISO cru `"pt"` | **alta** |
| Music/Cinema/Literature — painel | ISO cru `"pt"` | **alta** |
| Quiz — tradução de perguntas | ISO cru `"pt"` | **alta** |
| Unsafe Zone — diálogo | ISO cru `"pt"` | **alta** |

❓ **Não consegui verificar uma análise PT real de cada módulo em produção**, como
o item 1c pede: isso exige sessão autenticada, e o navegador desta sessão não
está logado. O diagnóstico acima é por inspeção de código, e é conclusivo quanto
ao que o sistema *pede*; não quanto ao que cada modelo *devolveu* em cada caso.

### 1d. O guia é omisso — e essa é a causa que atravessa tudo

A LANGUAGE INTEGRITY RULE do `Guide_v2.9_LITE.txt` (linha 33) trata de registro e
de neologismos ativistas, **mas não diz nada sobre variante do português**:

```
LANGUAGE INTEGRITY RULE (MANDATORY — ALL LANGUAGES, ALL MODELS)
Write in the natural, traditional register of the target language.
Do NOT adopt politically-charged neologisms or activist "language reforms".
- United States demonym: always use the standard traditional demonym of the
  target language — "American" (EN); "americano" or "norte-americano" (PT).
  In Portuguese, the word "estadunidense" is FORBIDDEN in all output — it is
  an ideologically motivated corruption of the language, not neutral Portuguese.
- Do NOT use invented gender-neutral inflections ("todes", "amigues", "elu",
  "Latinx", "x"/"@" word endings). Use standard grammar and standard vocabulary.
```

"Registro natural e tradicional do idioma alvo" é **compatível com o português de
Portugal**. O guia entra em todas as análises e nos dois painéis, então corrigi-lo
alcança sete superfícies de uma vez.

**Alcance do conserto do guia:** análises de música, cinema, literatura e notícia,
mais os dois painéis de filósofos. **Não alcança**: tradução de manchetes,
tradução de quiz e Unsafe Zone — nenhum desses injeta `guide_text` (a Unsafe Zone
usa uma chave própria, `guide-unsafe-zone`).

---

## 2. DIFF PROPOSTO — guia, para aprovação

`api/guides/Guide_v2.9_LITE.txt`, dentro da LANGUAGE INTEGRITY RULE.
**Um bloco acrescentado. Nada removido, nada reescrito.**

```diff
 LANGUAGE INTEGRITY RULE (MANDATORY — ALL LANGUAGES, ALL MODELS)
 Write in the natural, traditional register of the target language.
 Do NOT adopt politically-charged neologisms or activist "language reforms".
+- PORTUGUESE MEANS BRAZILIAN PORTUGUESE (pt-BR), NEVER European Portuguese.
+  Use the vocabulary, spelling and syntax of Brazil in every Portuguese output:
+  * "você" as the default address — never "tu" or "vós";
+  * Brazilian progressive "está fazendo" — never "está a fazer";
+  * Brazilian vocabulary: "trem", "ônibus", "celular", "tela", "time",
+    "café da manhã", "arquivo", "fato" — never "comboio", "autocarro",
+    "telemóvel", "ecrã", "equipa", "pequeno-almoço", "ficheiro", "facto";
+  * Brazilian pronoun placement: "me diga", not "diga-me" as the default.
 - United States demonym: always use the standard traditional demonym of the
   target language — "American" (EN); "americano" or "norte-americano" (PT).
```

| Exigência | Situação |
|---|---|
| Mudança mínima | 8 linhas acrescentadas, nenhuma alterada ou removida |
| Non-disclosure intacto | Não toca as regras de não nomear a referência filosófica |
| Sem efeito em score | Não toca scorecard, pesos, nota ou classificação |
| Language Integrity | É uma extensão da própria regra, no lugar dela |

**Aplicação (só após aprovação):** editar o arquivo e subir para o KV com
`wrangler kv:key put --binding=PHILOSIFY_KV "guide_text" --path=api/guides/Guide_v2.9_LITE.txt`.

> **Consequência a saber:** a prova de guia (SHA-256 exibida nos resultados)
> **muda**, porque ela é o hash do texto do guia. É esperado e honesto — mas
> significa que análises novas passam a exibir uma prova diferente das antigas.

---

## 3. DIFF PROPOSTO — código, para aprovação

O guia não alcança os cinco pontos de ISO cru. A correção mínima é nomear o
idioma em vez de entregar o código:

```diff
-Write the ENTIRE response in the language with ISO code "${lang}".
+Write the ENTIRE response in ${languageName(lang)}.
```

...onde `languageName` é o mesmo mapa já usado pelos quatro templates de análise,
com `pt: "Brazilian Portuguese"`. Hoje esse mapa está duplicado em quatro
arquivos; a correção limpa seria extraí-lo para um módulo único e usá-lo nos
nove pontos.

**Cinco arquivos:** `news-panel-template.js`, `philosopher-panel-template.js`,
`news-translate.js`, `quiz.js`, `unsafe-zone.js`.

Isto é código — não passa pelo KV, não muda a prova de guia. Mas mexe no
comportamento de saída de cinco superfícies, então segue aguardando sua palavra.

---

## 4. Análises pt-PT já em cache — contagem

❓ **Não consigo contar.** Sem credencial de banco nesta máquina, e o endpoint
público não expõe texto de análise.

A consulta abaixo faz a contagem no SQL Editor. Ela procura marcas inequívocas de
português europeu — a construção `está a + infinitivo` e vocábulos que não
existem no uso brasileiro:

```sql
SELECT
  COUNT(*)                                   AS total_pt,
  COUNT(*) FILTER (WHERE marca)              AS suspeitas_pt_pt,
  ROUND(100.0 * COUNT(*) FILTER (WHERE marca) / NULLIF(COUNT(*),0), 1) AS pct
FROM (
  SELECT (
    COALESCE(philosophical_analysis,'') || ' ' ||
    COALESCE(summary,'')                || ' ' ||
    COALESCE(historical_context,'')     || ' ' ||
    COALESCE(metadata::text,'')
  ) ~* '(\y(est|estav|estão|estavam)\w* a [a-zá-úâ-ûã-õç]+r\y|\ytelemóvel\y|\yautocarro\w*\y|\ycomboio\w*\y|\yecrã\y|\yequipa\y|\ypequeno-almoço\y|\ycasa de banho\y|\yficheiro\w*\y|\yfacto\y|\yutente\w*\y|\yrapariga\w*\y)' AS marca
  FROM analyses
  WHERE language = 'pt' AND status = 'published'
) s;
```

Para ver exemplos antes de decidir qualquer coisa:

```sql
SELECT a.id, s.title, s.artist, a.model, LEFT(a.summary, 180) AS trecho
FROM analyses a
LEFT JOIN songs s ON s.id = a.song_id
WHERE a.language = 'pt' AND a.status = 'published'
  AND (COALESCE(a.philosophical_analysis,'') || ' ' || COALESCE(a.summary,'') || ' ' || COALESCE(a.metadata::text,''))
      ~* '(\y(est|estav|estão|estavam)\w* a [a-zá-úâ-ûã-õç]+r\y|\ytelemóvel\y|\yautocarro\w*\y|\ycomboio\w*\y|\yecrã\y|\yequipa\y|\yficheiro\w*\y|\yfacto\y)'
ORDER BY a.created_at DESC
LIMIT 30;
```

**NADA foi purgado.** A decisão de regenerar em pt-BR ou deixar envelhecer é sua,
e depende do número que essa contagem devolver.

---

## Resumo

| | |
|---|---|
| Guia | Omisso quanto à variante. **Diff pronto, não aplicado** |
| Templates de análise | Já pedem "Brazilian Portuguese" — corretos |
| Cinco caminhos com ISO cru | **Defeito demonstrável.** Diff proposto, não aplicado |
| Verificação em produção | ❓ impossível sem login |
| Contagem de análises pt-PT | ❓ impossível sem banco — consulta fornecida |
| Purga | Nada feito, aguardando sua decisão |
