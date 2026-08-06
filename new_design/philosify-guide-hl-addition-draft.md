# DRAFT — Guide addition for the six-question highlights (item 6)

**Status: AWAITING ROBERTO'S APPROVAL. Nothing applied — no guide file edited, nothing uploaded to KV.**
Published analyses stay immutable; the marking applies to new analyses only.

## The minimal addition (English canonical — insert as one new item in the guide's output-format instructions)

> **SIX-QUESTION HIGHLIGHTS.** In every prose field of your output (historical context, creative process, each scorecard justification, and the integrated philosophical analysis), wrap the exact passages that answer **what, who, when, where, how, or why** in `<hl>...</hl>` tags. Mark only the answering phrase (typically 2–8 words), never a whole sentence; aim for 3–8 highlights per section. Example: `Released <hl>in 1971</hl> on <hl>John Lennon's</hl> solo album <hl>Imagine</hl>, the song emerged <hl>amid the Vietnam War's peak</hl>…` Use no other markup or HTML anywhere, and change nothing else about your output format, scores, or analysis behavior.

## Versão PT (para os guias traduzidos — mesma inserção)

> **DESTAQUES DAS SEIS PERGUNTAS.** Em todo campo de prosa da sua resposta (contexto histórico, processo criativo, cada justificativa do scorecard e a análise filosófica integrada), envolva as passagens exatas que respondem **o quê, quem, quando, onde, como ou por quê** em tags `<hl>...</hl>`. Marque apenas a frase que responde (tipicamente 2–8 palavras), nunca a sentença inteira; almeje 3–8 destaques por seção. Exemplo: `Lançada <hl>em 1971</hl> no álbum solo <hl>Imagine</hl> de <hl>John Lennon</hl>, a música surgiu <hl>no auge da Guerra do Vietnã</hl>…` Não use nenhuma outra marcação ou HTML, e não mude nada mais no formato, nas notas ou no comportamento da análise.

## Impact verification (done, 30 Jul — repo evidence)

- **Parser** (`api/src/ai/parser.js`): passes prose fields through without tag stripping — `<hl>` reaches the DB as-is. ✅
- **TTS** (`api/src/tts/gemini.js` `stripHtml`): already strips ALL tags before synthesis — highlights are never read aloud. ✅ No change needed.
- **Frontend**: already deployed ahead of the guide — the five prose sanitizers admit `<hl>` (music, cinema, literature, news, panel cards + the verdict rationale) and `.v2 hl` renders flat `var(--silver)` (mockup `.hl5`). Until the guide ships, nothing changes visually (no analysis carries the tag). ✅
- **Static copy**: `<hl>` parity across the 18 locales verified (8 keys, all matching). ✅

## Application plan (ONLY after approval)

1. Insert the addition into `api/guides/Guide_v2.9_LITE.txt` (canonical) and the 12 KV language guides, translated in each guide's own language.
2. Upload via `wrangler kv:key put --binding=PHILOSIFY_KV "guide_text[_xx]" --path=...` (deploy_all_guides script).
3. No Worker deploy needed — guides are fetched from KV per analysis.
4. Note: the guide-proof SHA-256 shown in results will change (it hashes the guide text) — expected and honest.
