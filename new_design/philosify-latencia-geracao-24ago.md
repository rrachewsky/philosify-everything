# Latência de geração — diagnóstico e plano de aceleração (24 ago 2026)

**Sintoma relatado (Roberto, 24 ago):** análises normais levavam ~40–50s, painel dos
filósofos ~60s, áudios ~60s. Agora os três fluxos passam de 120s.

**Decisão do Roberto (24 ago):** *"não quero trocar os modelos. Segue com o Grok na
análise e o Gemini no tts."* — Todo o plano abaixo respeita essa condição: **nenhuma
troca de modelo, nenhuma redução de effort/tokens, nenhuma mudança que toque a
qualidade do resultado.** Só engenharia de pipeline.

**Fato central:** nenhum commit recente tocou o caminho de IA. Os IDs de modelo estão
fixos desde 9–20 de julho (`grok-4.5`, `claude-opus-4-8`, `gpt-5.5`, `gemini-3.5-flash`,
TTS `gemini-3.1-flash-tts-preview`) e os commits de agosto no worker só **aceleraram**
o pipeline (cache de secrets, enriquecimento diferido). A regressão simultânea nos
três fluxos aponta para **latência do lado dos provedores**, **amplificada pelos
multiplicadores da nossa arquitetura** — retries escondidos, o teto de ~100s da borda
Cloudflare e loops de retry do cliente que recomeçam a geração do zero.

---

## 1. Para onde vai o tempo (mapeado no código, 24 ago)

### 1.1 Análise normal de música (`/api/analyze`)

Pipeline **sequencial**: cache Supabase (~1–2s) → letra Genius/Letras (~2–5s) →
Spotify (~1–2s) → guia no KV (<1s) → **chamada de IA (o grosso)** → proof + save +
PATCH de metadata (~2–4s).

A chamada de IA (`api/src/ai/orchestrator.js`):

| Modelo | ID em produção | Tipo | Timeout | max_tokens |
|---|---|---|---|---|
| grok (padrão) | `grok-4.5` | reasoning | 90s | 8000 |
| claude (fallback) | `claude-opus-4-8` | adaptive thinking, effort medium | **nenhum** (SDK: 10 min) | 16000 |
| openai (fallback) | `gpt-5.5` | reasoning | 120s | 8000 |
| gemini (fallback) | `gemini-3.5-flash` | — | 55–90s | — |

**Multiplicador nº 1 — retry escondido:** o orquestrador faz **2 tentativas por
modelo** antes do fallback. Um timeout do Grok (90s) ou um JSON incompleto custa uma
geração inteira a mais: 90s + 40–60s = 130–150s — exatamente o "mais de 120s".
No tail aparece como `[Orchestrator] Attempt 2/2`; o usuário não vê nada.

**Multiplicador nº 2 — o teto da borda:** a Cloudflare corta respostas em ~100s (524).
Geração que passa disso morre na entrega e o cliente retenta do zero.

### 1.2 Painel dos filósofos (`/api/philosopher-panel`)

Uma única chamada gera ~4–5k tokens com Claude Opus 4.8 + adaptive thinking (effort
medium) — a configuração mais pesada do stack; fallback Grok → Gemini.

Agravantes de engenharia (independentes do modelo):
- `callClaude` **não configura timeout** — default do SDK Anthropic é 10 minutos. Se a
  Anthropic engasga, o worker espera; quem "resolve" é a borda aos ~100s, com 524.
- **Sem trava de duplicata em voo**: um retry do cliente após 524 dispara uma SEGUNDA
  geração completa em paralelo — e as duas reservam e confirmam 3 créditos cada.
- Reservas e confirmações de crédito: 3 RPCs sequenciais em cada ponta (~1–3s no total).

### 1.3 Áudios — dois pipelines, ambos Gemini *(corrigido em 24 ago)*

> Correção do diagnóstico da manhã: o `/api/tts` vivo roteia para `handleGeminiTTS`
> (`api/src/tts/gemini.js`); o handler OpenAI em `handlers/tts.js` só atende a rota
> legacy `/api/tts-legacy`. Roberto está certo: **é Gemini nos dois áudios.**

- **Áudio de análise (`/api/tts` → podcast 4 vozes):** os 4 chunks de TTS já saem
  **em paralelo**, com retry/backoff por chunk (1s/2s/4s em 429/5xx). Antes do TTS há
  passos seriais de LLM: tradução (se precisar) + geração das perguntas da
  apresentadora via `gemini-2.5-flash` (~5–15s somados). Tempo total ≈ pré-passos +
  chunk mais lento (o preview de TTS varia de 30 a 90s sob carga).
- **Áudio de painel/notícia (`/api/news/tts`):** chunks de ~3000 chars em paralelo,
  **mas sem nenhum retry** — um único 429/503 do Gemini derruba o áudio inteiro e o
  usuário paga tudo de novo no retry.

**Multiplicador nº 3 — o loop de retry do cliente:** `ttsCache.js` aborta aos 120s e
retenta até 2× (2s de intervalo). Nenhum dos dois handlers recebe `ctx`, então quando
o cliente desconecta (524/abort) a geração em andamento **não termina nem grava no
R2** — o retry recomeça do zero em vez de achar cache. Foi exatamente o comportamento
visto no aparelho em 22 ago ("parou em 2 minutos e recomeçou").

---

## 2. Como confirmar a causa (medição, custo zero)

Cada análise grava `analysis_duration_ms` (tempo puro da IA). Um SELECT no SQL Editor
mostra a tendência por dia e modelo — leitura pura, sem gate:

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
`Attempt 2` ou troca de modelo.

---

## 3. Plano de aceleração — modelos e qualidade intocados

Nada abaixo muda modelo, prompt, effort, temperatura ou max_tokens. A qualidade sai
idêntica byte a byte no caminho feliz; o que muda é a eliminação dos multiplicadores.

### P1 — Análise de música

| # | Mudança | Onde | Ganho esperado | Risco |
|---|---|---|---|---|
| P1.1 | **Paralelizar letra + Spotify + guia** após o cache miss (`Promise.all` de 3 passos hoje seriais) | `handlers/analyze.js` | −3 a −6s em toda análise nova | Baixo; se a letra falhar, 2–3 subrequests gastos à toa (raro) |
| P1.2 | **Timeout não repete o modelo**: após timeout, cair direto para o próximo da cadeia (retry na mesma IA só para JSON incompleto, que é erro de parse, não de carga) | `ai/orchestrator.js` | Pior caso cai de 180s+ para ~100s | Nenhum — modelo que estourou 90s raramente responde na 2ª |
| P1.3 | **Timeout explícito no `callClaude` (~70s)** — vale para o fallback da música e para o painel | `ai/models/claude.js` | Elimina espera de até 10 min quando a Anthropic engasga | Nenhum |
| P1.4 | **Adiar o PATCH de metadata do guide proof** para `ctx.waitUntil` (hoje segura a resposta) | `handlers/analyze.js` | −1 a −2s | Nenhum — é auditoria interna, não afeta o payload |

### P2 — Painel dos filósofos

| # | Mudança | Onde | Ganho esperado | Risco |
|---|---|---|---|---|
| P2.1 | P1.3 (timeout no Claude) — com 70s, o fallback Grok entra **antes** de a borda matar a resposta | `ai/models/claude.js` | Fim dos travamentos de 4+ min; pior caso ~70+60s com resposta entregue | Nos dias lentos da Anthropic, mais painéis sairão do Grok (mesmo rigor, voz um pouco diferente — o campo `model` do blob registra) |
| P2.2 | **Trava de duplicata em voo**: marcador KV `panelgen:<cacheKey>` no início; retry que chega com geração em andamento espera e faz poll do cache (~3s × 30) em vez de gerar de novo | `handlers/philosopher-panel.js` | Retry pós-524 vira espera barata; **elimina cobrança dupla de 3+3 créditos** | Baixo; TTL curto no marcador para não travar em caso de crash |
| P2.3 | Micro: reservas de crédito em paralelo (confirmações ficam sequenciais — o PATCH do extrato lê "a última linha" e não pode correr) | `handlers/philosopher-panel.js` | −0,5 a −1,5s | Baixo |

### P3 — Áudios (Gemini mantido nos dois)

| # | Mudança | Onde | Ganho esperado | Risco |
|---|---|---|---|---|
| P3.1 | **Passar `ctx` aos dois handlers e terminar a geração via `waitUntil` mesmo com cliente desconectado**, gravando no R2 | `index.js`, `tts/gemini.js`, `handlers/news-tts.js` | O retry do cliente (120s) vira **cache HIT** em vez de regeneração — corta o pior caso de 4–5 min para ~2 min | Baixo |
| P3.2 | **Retry/backoff por chunk no news-tts** (mesma escada 1s/2s/4s que o podcast já usa) | `handlers/news-tts.js` | Um 429 isolado deixa de derrubar o áudio inteiro | Nenhum |
| P3.3 | **Trava de duplicata em voo por cache key** (mesmo desenho de P2.2) | ambos handlers TTS | Retries concorrentes não disparam gerações paralelas do mesmo áudio | Baixo |
| P3.4 | **Prefetch na renderização** (opcional, decisão de custo): chamar `preloadTTS` quando a análise/painel renderiza, não no clique em Ouvir. O áudio gera enquanto o usuário lê; no clique, já está no R2 | `V2AudioBar.jsx` ×3, `TTSBar.jsx` | Tempo percebido ≈ **zero** para quem ouve depois de ler | **Custa quota Gemini TTS de áudios que nunca serão ouvidos** — decisão do Roberto |
| P3.5 | Futuro já especificado (ordem própria): 202 + job + polling | — | Mata o loop 524 por completo | Refactor maior, frontend incluso |

### Limite honesto do que a engenharia entrega

O **piso** de cada fluxo é a latência do provedor no caminho feliz, e isso não se
move sem trocar modelo/configuração — que está vetado:
- Música: grok-4.5 responde em ~40–80s conforme a carga da xAI.
- Painel: Opus 4.8 com thinking fica em ~60–90s.
- Áudio: o chunk mais lento do TTS preview, 30–90s.

O que o plano remove é tudo que hoje transforma esses 40–90s em 120–300s: o retry
que dobra, a espera de 10 min sem timeout, o 524 que recomeça do zero, a dupla
geração concorrente e os passos seriais desnecessários. Com P1–P3 aplicados, o tempo
volta a ser ≈ o tempo do provedor — e nos dias em que o provedor estiver lento, o
sistema degrada com elegância (fallback rápido, retry barato) em vez de multiplicar.

---

## 4. Ordem de execução proposta

1. **Medir** (§2): SELECT do histórico + uma análise com tail — separa provedor de
   retry escondido com prova, e vira a régua do antes/depois.
2. **Lote 1 (servidor, sem decisão pendente):** P1.1–P1.4, P2.1–P2.3, P3.1–P3.3 —
   um deploy do worker, zero mudança de qualidade.
3. **Lote 2 (decisão do Roberto):** P3.4 (prefetch — custa quota TTS de áudios não
   ouvidos) e, em ordem futura própria, P3.5 (202+polling).

**Status:** estudo entregue; nenhuma mudança aplicada — aguardando o go do Roberto
para o Lote 1 e a decisão sobre P3.4.
