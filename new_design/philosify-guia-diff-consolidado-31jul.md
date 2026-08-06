# Diff consolidado do guia + pt-BR nas 6 superfícies

**31 Jul 2026**
**Item 1 — NO AR:** commit `d85d07c`, Worker `a710cf7e`.
**Item 2 — DIFF PRONTO, NADA APLICADO.** Um único upload ao KV, uma única troca de SHA.

---

# PARTE 1 — pt-BR no código (aprovado, no ar)

## Encontrei uma sexta superfície

Seu item listava cinco, porque meu levantamento anterior achou cinco. Ao varrer
para confirmar que não sobrava nada, apareceu mais uma — e é das mais visíveis:

| # | Arquivo | O que gera |
|---|---|---|
| 1 | `ai/prompts/news-panel-template.js` | Painel de filósofos sobre notícia |
| 2 | `ai/prompts/philosopher-panel-template.js` | Painel de música, cinema, literatura |
| 3 | `handlers/news-translate.js` | Tradução de artigo sob demanda |
| 4 | `handlers/quiz.js` | Tradução de pergunta de quiz |
| 5 | `handlers/unsafe-zone.js` | Diálogo da Unsafe Zone |
| **6** | **`news/headlines.js`** | **Manchete e resumo do ticker de última hora** |

A sexta escapou porque mora fora de `src/ai` e `src/handlers`, que foi onde
procurei. Ela traduz **toda manchete e todo resumo do ticker** — é provavelmente
o português mais lido do site inteiro. Incluí na correção.

## O que mudou

Novo `src/ai/prompts/languages.js` como fonte única do mapa, que estava duplicado
em quatro templates. `languageName()` tolera `pt-BR`/`pt_BR` reduzindo à tag base,
e cai para inglês em vez de devolver um código desconhecido ao modelo.

```diff
-Write the ENTIRE response in the language with ISO code "${lang}".
+Write the ENTIRE response in ${languageName(lang)}.
```

Nenhum código ISO cru restou em `api/src`. **Guia intocado, sem KV, prova de guia
inalterada.**

---

# PARTE 2 — o diff consolidado do guia

## ⚠️ Correção ao item 2: (a) e (b) NÃO são mudanças de guia — já estão feitas

Isto muda o conteúdo do consolidado, então precisa ficar explícito antes de tudo.

### (a) As seis perguntas — **já no ar, em código**

Commit `dfdc774`, Worker `51e199a7`, subido hoje mais cedo.

**Diagnóstico do "por que o modelo parou de emiti-las":** ele **nunca as emitiu**.
Não houve regressão. As seis perguntas viviam em
`news-analysis-template.js` como *orientação analítica* — "estabeleça os fatos
usando o quadro 5W+H" — e **nenhuma das regras do campo pedia estrutura, rótulo,
ordem ou obrigatoriedade**. Sem instrução de forma em direção alguma, o modelo
escreveu prosa corrida. Ele cobria os seis ângulos dentro do texto; o que nunca
existiu foi a estrutura visível.

O guia do KV nunca teve nada disso: procurei por "news", "5W", "who", "what",
"when" no `Guide_v2.9_LITE.txt` e não há uma ocorrência. Ele é a referência
filosófica, compartilhada por todos os módulos.

Já corrigido: seis parágrafos obrigatórios, cada um aberto por `<strong>rótulo:</strong>`
no idioma alvo, na ordem que você ditou. Pergunta sem resposta no material ainda
ganha seu parágrafo, declarando que a fonte não estabelece aquilo.

### (b) ACERTOS, ERROS E OMISSÕES — **já no ar, em duas partes**

- **Rótulo da caixa:** commit `855573f`, nos 18 locales. Antes dizia
  "Confiabilidade", que escondia que ali havia omissões.
- **Exigência de análise das omissões:** commit `dfdc774`. E vale registrar: a
  instrução de analisar omissões **já existia** no prompt, com bloco próprio. O
  que faltava era ela ser inescapável e o rótulo dizer o nome dela.

> **Portanto o diff consolidado do guia contém apenas (c) e (d).** Colocar (a) e
> (b) nele seria duplicar em KV o que já está em código — duas fontes para a
> mesma regra, que é exatamente como se produz divergência silenciosa depois.

---

## DIFF — `api/guides/Guide_v2.9_LITE.txt`

Duas inserções, em dois lugares. **Nada removido, nada reescrito.**

### (c) pt-BR — dentro da LANGUAGE INTEGRITY RULE (linha 33)

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

### (d) Realce `<hl>` — no fim das notas de OUTPUT FORMAT (linha 121)

```diff
 Notes:
 - classification must be one of the standard Philosify classes (English enum).
 - final_score MUST be the weighted calculation from the 5 axes.
 - If context is unknown, write “Information not available based on provided evidence.” (do not leave fields empty).
+- SIX-QUESTION HIGHLIGHTS. In every prose field (historical_context,
+  creative_process, each scorecard justification, and philosophical_analysis),
+  wrap the exact passages that answer WHAT, WHO, WHEN, WHERE, HOW or WHY in
+  <hl>...</hl>. Mark only the answering phrase — typically 2–8 words — never a
+  whole sentence; aim for 3–8 highlights per section. Example: "Released
+  <hl>in 1971</hl> on <hl>John Lennon's</hl> solo album, the song emerged
+  <hl>amid the Vietnam War's peak</hl>…". Use no other markup anywhere, and
+  change nothing else about your output format, scores, or analysis behaviour.
```

### Conformidade

| Exigência | Situação |
|---|---|
| Mudança mínima | 17 linhas acrescentadas, nenhuma alterada ou removida |
| Non-disclosure intacto | Não toca as regras de não nomear a referência filosófica |
| Sem efeito em score | Não toca eixos, pesos, `final_score` nem classificação |
| Language Integrity | (c) é extensão da própria regra, no lugar dela |
| Um único upload | Sim — uma troca de SHA-256 para as duas mudanças |

**Comando, só após sua aprovação:**

```bash
wrangler kv:key put --binding=PHILOSIFY_KV "guide_text" --path=api/guides/Guide_v2.9_LITE.txt
```

---

## Duas coisas a decidir junto com a aprovação

### O `<hl>` e os rótulos vão colidir no OS FATOS

Em News, as seis perguntas agora são **rótulos** em branco Inter 500. O `<hl>`
marca **as respostas** em prateado. Nos mesmos parágrafos, o leitor veria:

> **O quê:** o banco central elevou juros em `0,5%` ← prateado

Isso pode ficar excelente — rótulo e resposta em registros distintos — ou visualmente
ruidoso. **Não dá para saber sem ver.** Sugiro subir o guia e olhar uma análise
nova antes de decidir se o `<hl>` fica no News ou só nos outros módulos.

### O `<hl>` é guia-largo, não só News

O texto acima entra na seção de OUTPUT FORMAT do guia, que descreve o JSON de
**música**. Ele vale para todos os módulos que injetam o guia. Sua condição (d)
— "só depois de (a) garantir que as perguntas existem" — está satisfeita **no
News**, onde elas agora existem como estrutura. Nos demais módulos as seis
perguntas nunca foram estrutura: ali o `<hl>` marca respostas dentro da prosa,
que é outro mecanismo. Não é impedimento, mas é bom saber que a condição (d) só
se aplica literalmente ao News.

---

# RESPOSTA: o pt-PT vale só para o News?

**Não. É transversal.** E se divide em dois graus:

## Superfícies que já pediam pt-BR (corretas antes desta correção)

Análise de **Música**, **Cinema**, **Literatura** e o **scan de News**. Os quatro
templates sempre declararam `pt: "Brazilian Portuguese"` e emitem
"YOU MUST WRITE YOUR ENTIRE RESPONSE IN BRAZILIAN PORTUGUESE".

## Superfícies que mandavam código ISO cru (todas corrigidas hoje)

| Superfície | Módulo |
|---|---|
| Painel de filósofos | **News** |
| Tradução de artigo | **News** |
| Manchete e resumo do ticker | **News** |
| Painel de filósofos | Música, Cinema, Literatura |
| Tradução de pergunta | Quiz |
| Diálogo | Unsafe Zone |

**Três das seis estavam no News** — o que explica por que o defeito apareceu
primeiro ali, e por que ele parecia específico do módulo. Não era.

## E o guia é omisso para todas

A LANGUAGE INTEGRITY RULE manda escrever "no registro natural e tradicional do
idioma alvo", o que é **plenamente compatível com o português de Portugal**. Essa
omissão atinge tudo que injeta o guia: as quatro análises e os dois painéis. É o
que o item (c) fecha.

## O que continua sem verificação

❓ Não observei uma análise PT real de cada módulo em produção — exige sessão
autenticada. O diagnóstico é conclusivo sobre **o que o sistema pede**; não sobre
o que cada modelo devolveu em cada caso. E a contagem de análises pt-PT já em
cache continua pendente: a consulta está em
`philosify-pt-br-diagnostico-31jul.md`, e nada foi purgado.
