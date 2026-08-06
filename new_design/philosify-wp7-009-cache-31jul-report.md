# WP7 — Migração 009 e janela de cache (31 Jul 2026)

**Commits:** `2c774be` (taxa de criação de 30s), `8f3c232` (convenção de placement)
**Estado: CONCLUÍDO.** Migração executada por Roberto, Ateliê deployado
(`78040814`), janela de cache verificada nos quatro módulos.

> A execução da 009 revelou um defeito grave e independente na tabela de preços,
> resolvido no mesmo dia. Registro completo em
> **`philosify-ads-pricing-alerta-31jul.md`**.

---

## Item 1 — Migração 009

### Não posso executá-la

Esta máquina não tem `.dev.vars`, então não há credencial de banco aqui. E o
PostgREST — o caminho que o Worker usa para falar com o Supabase — **não executa
DDL** de forma alguma. `ALTER TABLE` só sai pelo SQL Editor do dashboard, que é o
procedimento já documentado no CLAUDE.md.

### Achado 1 — a migração estava incompleta e faria você perder dinheiro

Como estava escrita, a 009 inseria **apenas** a linha de CPM dos 30 segundos. Não
inseria a **taxa de criação**. E o gerador de orçamento tem este fallback
(`src/handlers/ads/inventory.js`):

```js
creativeFeeCents = feeData?.[0]?.price_cents || 15000;
```

Sem linha de `creative_fee` para 30s, um anúncio de 30 segundos com criativo
produzido pelo Philosify cairia em **15000 centavos — a taxa de 5 segundos**.
Venda de $150 no lugar do preço real, silenciosamente.

**Corrigido em `2c774be`.** A migração agora insere `creative_fee` para 30s em
**$650**, seguindo a escada existente:

| Duração | Taxa de criação |
|---|---|
| 5s | $150 |
| 10s | $250 |
| 15s | $350 |
| 20s | $450 |
| **30s** | **$650** *(inserido — +$100 a cada 5s)* |

> **Se a sua tabela de preços disser outro número, troque o `65000` no arquivo
> antes de rodar.** Está comentado no ponto exato.

### Achado 2 — anomalia de preço já em produção, fora do escopo desta migração

O endpoint público `/api/ads/pricing` devolve hoje, para o sidebar:

| Duração | CPM atual | CPM pela escada |
|---|---|---|
| 5s | $10,00 | $10,00 |
| **10s** | **$5,21** | **$20,00** |
| 15s | $30,00 | $30,00 |
| 20s | $40,00 | $40,00 |

Dez segundos custam **menos que cinco**. Os 521 centavos parecem linha de teste
que ficou no banco. **Não toquei** — preço é decisão sua e não estava na lista.

### Como rodar

SQL Editor do Supabase, colar `api/migrations/009_ads_30s_duration.sql` inteiro.
É idempotente: as constraints são recriadas e as linhas de preço só entram se
faltarem.

**Tabelas e colunas afetadas:**

| Objeto | Mudança |
|---|---|
| `ads.ad_campaigns` | constraint `ad_campaigns_duration_check` → `IN (5,10,15,20,30)` |
| `ads.ad_orders` | constraint `ad_orders_duration_check` → `IN (5,10,15,20,30)` |
| `ads.pricing_config` | +1 linha `cpm / sidebar / 30 / 6000` |
| `ads.pricing_config` | +1 linha `creative_fee / sidebar / 30 / 65000` |

Nenhuma coluna criada ou removida; nenhuma linha existente alterada.

### Execução — feita

Roberto rodou a migração no SQL Editor. Resultado: `Success. No rows returned`,
esperado para DDL mais `INSERT ... SELECT`.

Confirmei sem credencial pelo endpoint público `/api/ads/pricing`, que reflete o
banco: apareceram `cpm/sidebar/30 = 6000` e `creative_fee/30 = 65000`. As quatro
mudanças da tabela acima estão aplicadas.

### Deploy do Ateliê — no ar

**`78040814`** · `https://ads.philosify.org` · projeto `philosify-ads`, branch
`production`. Sobe o commit `1082d3e`, que estava pronto e segurado desde 31/07
porque a interface ofereceria uma duração que o banco então rejeitava.

### O que a confirmação revelou de quebra

A mesma leitura do endpoint mostrou o CPM do sidebar **inteiro colapsado em
$5,21**. A migração não causou isso — ela não contém um único `UPDATE` —, mas
tornou visível um defeito que estava no ar desde abril: duas gerações de preço
ativas ao mesmo tempo, com o valor exibido decidido por ordem arbitrária de
linha. Diagnóstico, conserto e prevenção em
**`philosify-ads-pricing-alerta-31jul.md`**. Resolvido no mesmo dia.

---

## Item 2 — Análise em cache respeita a janela mínima

### Já está conforme. Nenhum código novo era necessário.

Nos quatro caminhos de análise a espera é aplicada **incondicionalmente**, depois
da resposta e antes de revelar. Não existe ramificação por cache:

| Módulo | Chamada |
|---|---|
| Music | `site/src/pages/v2/MusicPage.jsx:291` |
| Cinema | `site/src/hooks/useCinemaSidebar.js:246` |
| Literature | `site/src/hooks/useLiteratureSidebar.js:250` |
| News scan | `site/src/pages/v2/NewsPage.jsx:379` |

### Como verifiquei que não há atalho

Varri `pages/v2`, `hooks` e `components/v2` atrás de qualquer ramificação em
`cached`, `isReview` ou `fromCache`. **Única ocorrência:** a idade do feed de
notícias em `useNews.js:63`, sem relação com isto. O servidor marca a resposta
como cacheada; o cliente ignora essa marca e segura do mesmo jeito.

### O ciclo ANALISANDO durante a espera

`setIsAnalyzing(false)` só roda no bloco `finally`, **depois** da janela. Então
durante toda a espera:

- o estado ANALISANDO permanece montado;
- a barra magenta `--progress` corre com a lei de ritmo `analysisProgress`;
- o slot de anúncio fica montado — **billing preservado**.

**Duração da janela:** `duração contratada do anúncio + 2s`, com piso de 20s
quando nenhum anúncio carregou (`MIN_ANALYSIS_AD_WINDOW_MS`).

### Pergunta encerrada

Isto fecha, com a sua decisão, a questão aberta desde 30 de julho sobre revelar
cache instantaneamente: **fica o piso**. Cache nunca é revelado na hora.

---

## Resumo

| Item | Estado |
|---|---|
| 009 — emenda da taxa de criação de 30s | feita — `2c774be`, `8f3c232` |
| 009 — execução no Supabase | **executada**, confirmada pelo endpoint público |
| Ateliê — deploy | **no ar** — `78040814` |
| Janela mínima no cache | **já conforme** nos 4 módulos, verificado |
| Tabela de preços embaralhada | **resolvida** — ver arquivo de alerta |
| Índice único de prevenção | **pendente** — uma linha de DDL, no arquivo de alerta |

## Única pendência

O índice único que impede a recorrência do embaralhamento de preços. Agora passa,
porque não há mais duplicata. Sem ele, o problema volta na próxima vez que
alguém semear preços por cima dos existentes.
