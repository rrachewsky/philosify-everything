# Latência — Lote 1 aplicado e em produção (25 ago)

**Status: implementado, verificado e deployado.** Worker `philosify-api-production`,
versão `859c7390-0c26-4eb2-a499-c6ebadfa6dad`, health OK em `api.philosify.org` e no
hostname workers.dev. Modelos, prompts, effort, temperatura e max_tokens intocados,
conforme o plano de 24 ago (`philosify-latencia-geracao-24ago.md`).

---

## O que entrou (todos os itens do Lote 1)

| # | Mudança | Arquivo |
|---|---|---|
| P1.1 | Letra + Spotify + guia buscados em `Promise.all` após o cache miss (antes: seriais). Validação mantém a ordem original — letra continua sendo o gate. Spotify virou enriquecimento à prova de falha (erro não derruba a análise). | `handlers/analyze.js` |
| P1.2 | Timeout não repete o mesmo modelo: cai direto para o próximo da cadeia. Retry no mesmo modelo continua existindo só para análise incompleta (erro de parse). | `ai/orchestrator.js` |
| P1.3 / P2.1 | Timeout explícito de **75s** no cliente Anthropic (`CLAUDE_TIMEOUT_MS` ajusta sem deploy), `maxRetries: 0` — antes o SDK esperava até 10 min e ainda re-tentava por dentro. Timeout é classificado ANTES do check de content-filter e sai marcado com `isTimeout`. | `ai/models/claude.js` |
| P1.4 | PATCH do guide proof movido para `ctx.waitUntil` — não segura mais a resposta. Como agora roda depois da resposta, ganhou garantia própria: 2 tentativas + log `AUDIT GAP` gritante se ambas falharem. | `handlers/analyze.js` |
| P2.2 | Trava de duplicata em voo no painel: `panellock:<cacheKey>` no KV (TTL 240s). Retry que chega com geração em andamento faz poll do cache (4s × 20) e volta como cache HIT **sem cobrar** — fim da cobrança dupla de 3+3 créditos. Resposta do poll tem o mesmo shape do HIT normal. | `handlers/philosopher-panel.js` |
| P2.3 | Reservas dos 3 créditos em paralelo (`Promise.allSettled`, RPC serializa na linha do saldo); rollback de parciais mantido, e a trava é liberada no caminho de créditos insuficientes. | `handlers/philosopher-panel.js` |
| P3.1 | `ctx` passado aos dois handlers de TTS; geração + gravação no R2 terminam via `waitUntil` mesmo com o cliente desconectado. O retry do player (120s) agora encontra o áudio pronto no R2 em vez de regenerar do zero. | `index.js`, `tts/gemini.js`, `handlers/news-tts.js` |
| P3.2 | Retry/backoff por chunk no news-tts (escada 1s/2s/4s, igual ao podcast) para 429/5xx e erros de rede; 4xx permanente não re-tenta. Um 429 isolado deixa de derrubar o áudio inteiro. | `handlers/news-tts.js` |
| P3.3 | Trava de duplicata em voo nos dois TTS: `ttslock:<key>` no KV (TTL 300s); retry concorrente faz poll do R2 (5s × 17) em vez de gerar em paralelo. | `tts/gemini.js`, `handlers/news-tts.js` |

## Verificação feita antes do deploy

- `node --check` limpo nos 7 arquivos alterados.
- Assinaturas conferidas: `handleAnalyze` já recebia `ctx` e o `index.js` o passa;
  `getFromR2` (news-tts) e `getFromR2Cache` (podcast) existem; o painel já usava
  `PHILOSIFY_KV` (mesmo binding da trava).
- Semântica do `break` no orchestrator conferida: sai do loop de tentativas com
  `normalized` vazio → o loop externo avança para o próximo modelo (mesmo padrão do
  content-filter do Claude logo acima).
- Caminhos de erro: rejeição da geração de TTS é absorvida pelo `.catch` do persist
  (sem unhandled rejection) e re-lançada no `await` principal para o catch externo;
  travas se limpam em `finally` e, em caso de crash, pelo TTL.

## Como medir o "depois"

O SELECT do §2 do estudo de 24 ago continua sendo a régua — `analysis_duration_ms`
é histórico, então o "antes" fica preservado nas linhas antigas:

```sql
select date_trunc('day', created_at) as dia, model, count(*) as n,
       round(avg(analysis_duration_ms)/1000.0, 1) as media_s,
       round(max(analysis_duration_ms)/1000.0, 1) as max_s
from analyses
where created_at > now() - interval '30 days' and analysis_duration_ms is not null
group by 1, 2 order by 1 desc, 2;
```

Sinais esperados nos logs (`wrangler tail`): `timed out — skipping same-model retry`,
`Generation already in flight`, `retrying in Nms` nos chunks — cada um é um
multiplicador antigo sendo cortado em flagrante.

## Rollback

`cd api && npx wrangler rollback` (versão anterior à `859c7390`). Nenhuma migração,
nenhum dado novo — só código do worker.

## Pendências (decisão do Roberto, fora deste lote)

- **P3.4** — prefetch do TTS na renderização: tempo percebido ≈ zero, mas custa
  quota Gemini de áudios nunca ouvidos.
- **P3.5** — 202 + job + polling (refactor maior, frontend incluso), ordem futura.
