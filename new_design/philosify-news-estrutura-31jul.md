# News — estrutura de parágrafos e rótulos enfatizados

**31 Jul 2026** · commit `dfdc774`
**Worker `51e199a7`** · **Frontend `a4e9eac7`**
Executa a Parte A do ruling anterior + a diagramação pedida nos quatro boxes.

---

## O que mudou, e onde

A instrução de formato do News vive em **código** —
`api/src/ai/prompts/news-analysis-template.js` — e não no guia do KV.
**Guia intocado, sem upload, prova de guia inalterada.**

### FIELD 1 — `the_facts`: as seis perguntas

Ordem corrigida para a que você ditou (**o quê / quem / quando / onde / como /
por quê**); o template tinha *onde* antes de *quando*.

```diff
 - What: What happened? What is the core event or development?
 - Who: Who are the actors involved (individuals, institutions, governments)?
-- Where: Where did this occur (geographic, institutional, jurisdictional)?
 - When: When did this happen (date, timeline, sequence of events)?
+- Where: Where did this occur (geographic, institutional, jurisdictional)?
 - How: How did this event unfold (mechanism, process, chain of actions)?
 - Why: Why did this happen according to the SOURCE (the source's stated reasons)?
 
+MANDATORY STRUCTURE — NO EXCEPTIONS:
+Answer ALL SIX questions, in the order above, each as its own <p> paragraph
+opened by its label in <strong> tags:
+
+<p><strong>What:</strong> ...</p><p><strong>Who:</strong> ...</p>...
+
+- Write the six labels in ${targetLanguage}, in that language's natural register
+  (Portuguese: O quê / Quem / Quando / Onde / Como / Por quê).
+- If the material does not establish an answer, STILL write that question's
+  paragraph and say plainly that the source does not establish it.
+  NEVER drop a question.
```

### FIELD 3 — `hits_and_misses`: acertos, erros e omissões

```diff
+MANDATORY STRUCTURE — NO EXCEPTIONS:
+All THREE blocks appear, in this order, each opened by its label in <strong>
+tags and written as one or more <p> paragraphs:
+
+<p><strong>Hits:</strong> ...</p><p><strong>Misses:</strong> ...</p><p><strong>Omissions:</strong> ...</p>
+
+- Write the three labels in ${targetLanguage} (Portuguese: Acertos / Erros /
+  Omissões).
+- The OMISSIONS block is MANDATORY and must never be skipped. Name at least one
+  thing the source left out, or state explicitly that you found none and why.
+  What a source silences is an editorial choice and belongs in the evaluation.
```

### FIELD 2 e FIELD 4 — parágrafos

```diff
 RULES for this field:                          [source_analysis]
+- Break the text into <p> paragraphs, one per aspect (identity, bias, intention,
+  framing). Never one undivided block.
```

```diff
 - Write as ONE cohesive analytical essay, not bullet points or fragmented sections.
+- Break that essay into <p> paragraphs — one argumentative move per paragraph.
+  Paragraphs are not fragmentation; a single undivided block is unreadable.
```

A regra do ensaio coeso **permanece**: parágrafo não é o fracionamento que ela
proíbe.

### Formato de resposta — markdown proibido explicitamente

```diff
 - Start your response directly with { and end with }
+- The four text fields carry HTML: <p> for paragraphs and <strong> for the
+  labels required above. Use NO other tags.
+- NEVER use markdown for emphasis. Asterisks are not rendered and would appear
+  literally on screen. Bold is <strong>, and nothing else.
```

**Por que isso importa.** O componente `Prose` do NewsPage não converte
markdown. Se o modelo emitisse `**Acertos:**`, o leitor veria asteriscos. Pior:
basta uma tag HTML no texto para o componente tratar tudo como HTML, e aí quebras
de linha simples deixam de virar parágrafo — por isso os `<p>` são exigidos
explicitamente em vez de confiar em linhas em branco.

---

## CSS — o registro de rótulo cobre as duas caixas rotuladas

```diff
-.v2 .pg-news .facts .prose :where(strong,b){
+.v2 .pg-news :is(.facts,.hits) .prose :where(strong,b){
  font-family:var(--fu);font-weight:500;font-size:15px;color:var(--ink-text)}
```

As seis perguntas e os três veredictos são rótulos da mesma natureza, então
recebem o mesmo registro: **branco, Inter 500**. O prateado continua sendo o
registro de frase-chave nas duas caixas não rotuladas (ANÁLISE DA FONTE e
OPINIÃO DO PHILOSIFY).

---

## Verificação

| | |
|---|---|
| Lint de tokens | ✅ verde, 64 arquivos |
| Build do frontend | ✅ limpo |
| Bundle do Worker | ✅ valida em dry-run |
| Regra no CSS publicado | ✅ `NewsPage-C5SIVn4q.css` contém `.facts,.hits) .prose :where(strong,b)` |
| Classe `hits` no JSX publicado | ✅ presente em `NewsPage-DBx3RMqW.js` |

❓ **Não observado ao vivo:** o texto renderizado com a estrutura nova. A extensão
do Chrome travou depois do deploy e não respondeu a duas tentativas. Além disso,
**só uma análise nova mostra o efeito** — ver abaixo.

---

## O que esperar

**Análises já em cache não mudam.** Notas são imutáveis: os textos gravados
continuam em prosa corrida, sem rótulo e sem parágrafo. **Só notícias analisadas
a partir de agora nascem no formato novo.** Os dois formatos vão coexistir no
histórico.

Para ver o resultado, é preciso rodar uma análise nova.

## Risco conhecido

O formato agora depende de o modelo obedecer instrução de marcação. Se algum
modelo devolver markdown apesar da proibição explícita, aparecem asteriscos na
tela em vez de negrito. Não é silencioso — é imediatamente visível na primeira
análise. Se acontecer, o conserto é converter markdown no `Prose`, o que hoje ele
não faz.
