# Latência de geração — diagnóstico e opções (24 ago 2026)

**Sintoma relatado (Roberto, 24 ago):** análises normais levavam ~40–50s, painel dos
filósofos ~60s, áudios ~60s. Agora os três fluxos passam de 120s.

**Fato central:** nenhum commit recente tocou o caminho de IA. Os IDs de modelo estão
fixos desde 9–20 de julho (`grok-4.5`, `claude-opus-4-8`, `gpt-5.5`, `gemini-3.5-flash`)
e os commits de agosto no worker só **aceleraram** o pipeline (cache de secrets,
enriquecimento diferido). A regressão simultânea nos três fluxos aponta para
**latência do lado dos provedores** (xAI, Anthropic, Gemini TTS preview — todos serviços
de carga compartilhada), **amplificada pela nossa arquitetura de retry/fallback e pelo
teto de ~100s da borda Cloudflare**.

---

## 1. Para onde vai o tempo (mapeado no código, 24 ago)

### 1.1 Análise normal de música (`/api/analyze`)

Pipeline sequencial: cache Supabase (~1–2s) → letra Genius/Letras (~2–5s) → Spotify
(~1–2s) → guia no KV (<1s) → **chamada de IA (o grosso)** → parse + save (~2–3s).

A chamada de IA (`api/src/ai/orchestrator.js`):

| Modelo | ID em produção | Tipo | Timeout | max_tokens |
|---|---|---|---|---|
| grok (padrão) | `grok-4.5` | reasoning | 90s | 8000 |
| claude | `claude-opus-4-8` | adaptive thinking, effort medium | **nenhum** (SDK: 10 min) | 16000 |
| openai | `gpt-5.5` | reasoning | 120s | 8000 |
| gemini | `gemini-3.5-flash` | — | 55–90s | — |

Todos os quatro são da categoria pesada/reasoning — não há um "modo rápido" em produção.

**O multiplicador escondido:** o orquestrador faz **2 tentativas por modelo** e depois
desce a cadeia de fallback (2 tentativas em cada). Uma única falha silenciosa
(timeout de 90s do Grok, ou JSON incompleto que reprova em
`isCompleteNormalizedAnalysis`) custa **uma geração inteira a mais**:
90s (timeout) + 40–60s (retry com sucesso) = 130–150s — exatamente o "mais de 120s".
O usuário não vê nada disso; no tail aparece como `[Orchestrator] Attempt 2/2` ou
troca de modelo.

**O segundo multiplicador:** a borda da Cloudflare corta respostas em ~100s (erro 524).
Se a geração total passa disso, o cliente recebe erro/retenta e o tempo percebido
dobra. Já flagramos esse padrão no TTS em 22 ago (Canceled ~100s → retry → ~2min).

### 1.2 Painel dos filósofos (`/api/philosopher-panel`)

Uma única chamada gera o texto inteiro (~4–5k tokens) com a **configuração mais lenta
de todo o stack**: Claude Opus 4.8 + adaptive thinking (effort medium, max 16k tokens).
Só o thinking pode levar 30–60s; a escrita de ~4k tokens vem depois.

Agravante: `callClaude` **não configura timeout** — o default do SDK Anthropic é
10 minutos. Se a Anthropic está lenta/sobrecarregada, o worker espera em vez de cair
para o fallback (Grok → Gemini); quem "resolve" é a borda aos ~100s, com 524 e retry
do cliente do zero.

### 1.3 Áudios — dois pipelines distintos

- **Áudio de análise (`/api/tts`, OpenAI TTS):** os chunks de ~4000 chars são gerados
  **em sequência** (`api/src/handlers/tts.js:407`). Análise longa = 3–4 chunks ×
  20–40s cada = 60–160s. É o único lugar onde a lentidão é 100% nossa, não do provedor.
- **Áudio de painel/notícia (`/api/news/tts`, Gemini TTS preview):** chunks já em
  paralelo — o tempo total é o chunk mais lento (30–90s, o preview varia muito) e o
  teto de 100s da borda; passou disso, o player retenta e paga tudo de novo, porque a
  primeira resposta morre antes de gravar no R2.

---

## 2. Como confirmar a causa (antes de mexer em qualidade)

Temos histórico gravado: cada análise salva `analysis_duration_ms` (tempo puro da IA,
sem letra/Spotify/save). Um SELECT no SQL Editor mostra a tendência por dia e por
modelo — se a média subiu sem deploy nosso, é o provedor; leitura pura, sem gate:

```sql
select date_trunc('day', created_at) as dia,
       model,
       count(*) as n,
       round(avg(analysis_duration_ms)/1000.0, 1) as media_s,
       round(max(analysis_duration_ms)/1000.0, 1) as max_s
from analyses
where created_at > now() - interval '30 days'
  and analysis_duration_ms is not null
group by 1, 2
order by 1 desc, 2;
```

Complemento: uma análise disparada com o tail ligado mostra na hora se houve
`Attempt 2` ou troca de modelo (o multiplicador escondido do §1.1).

---

## 3. Opções de aceleração × efeito na qualidade

Guarda-costas que ficam de pé em qualquer cenário: o gate de completude
(`isCompleteNormalizedAnalysis`), a validação de cache (`validateAndCleanCache`) e o
guia como framework vinculante nos system prompts. Modelo mais rápido afeta
**profundidade da prosa**, não a estrutura do scorecard.

### Camada A — custo zero de qualidade (só engenharia)

| # | Mudança | Ganho | Efeito na qualidade |
|---|---|---|---|
| A1 | Timeout explícito no `callClaude` (~70s) | Painel cai para o fallback antes da borda matar tudo; elimina o pior caso de 100s+retry | Nenhum quando o Claude responde; no fallback o painel sai do Grok 4.5 (mesmo rigor, sabor diferente) |
| A2 | Após **timeout**, não repetir o mesmo modelo — cair direto para o próximo (retry só para JSON incompleto) | Corta o cenário 90s+90s; pior caso cai pela metade | Nenhum — o modelo que estourou timeout raramente responde na 2ª |
| A3 | Paralelizar chunks do `/api/tts` (igual ao news-tts) | Áudio de análise: de N×chunk para 1×chunk (~3–4× mais rápido) | Nenhum — mesmas vozes, mesmo texto |
| A4 | Padrão job assíncrono (202 + polling) para os dois TTS — já especificado no relatório da limpeza | Mata o loop 524→retry, o maior multiplicador de tempo percebido | Nenhum |

### Camada B — troca de modelo/regime (ganho grande, custo honesto)

| # | Mudança (tudo via var no wrangler.toml, reversível) | Ganho | Efeito na qualidade |
|---|---|---|---|
| B1 | Painel: `CLAUDE_EFFORT=low` (Opus 4.8 mantido) | ~30–50% mais rápido | Menos deliberação interna; texto sai parecido, dialética ocasionalmente mais rasa |
| B2 | Painel: `CLAUDE_MODEL=claude-sonnet-5` | Bem mais rápido que Opus | Prosa continua alta; perde um grau de nuance filosófica nos embates mais finos |
| B3 | Música: `GROK_MODEL=grok-4-1-fast-reasoning` | Muito mais rápido que grok-4.5 | Justificativas um pouco menos profundas; scorecard/estrutura protegidos pelo gate |
| B4 | Reduzir max_tokens da análise (8000→~5000) | Escrita proporcionalmente mais curta | Ensaios mais enxutos; **risco**: truncar → JSON incompleto → retry (anula o ganho — só com teste) |

### O que NÃO resolve

- **Workers Paid ($5/mês):** compra orçamento de subrequests, não velocidade de IA.
  Continua recomendado pelo problema do teto de 50, mas não é o remédio daqui.
- **Encurtar o guia:** o Claude já tem prompt caching; nos outros o ganho de prefill é
  de ~1–3s. Mexeria no coração filosófico por troco.

---

## 4. Recomendação

1. **Medir primeiro** (custo zero): Roberto roda o SELECT do §2 + uma análise com tail
   ligado. Isso separa "provedor lento" de "retry escondido" com prova.
2. **Camada A inteira na sequência** — nenhum item custa qualidade e, juntos, atacam os
   dois multiplicadores (retry duplicado e 524).
3. **Camada B só se A não bastar**, começando por B1 (effort low no painel), que é a
   mudança mais reversível e de maior alavancagem — o painel é hoje o fluxo com a
   configuração mais pesada do stack.

**Status:** diagnóstico entregue; nenhuma mudança aplicada — aguardando decisão do
Roberto sobre medir (§2) e sobre quais camadas executar.
