# ALERTA — tabela de preços do sidebar embaralhada

**31 Jul 2026** · descoberto ao confirmar a migração 009
**Severidade: alta — afetava receita.**
**Estado: RESOLVIDO** — escada correta no ar, confirmada pelo endpoint público.
Falta apenas o índice de prevenção (passo 5). Desfecho no fim do arquivo.

---

## O que aconteceu

Antes e depois de você rodar a 009, o endpoint público `/api/ads/pricing`
devolveu isto para o CPM do sidebar:

| Duração | Antes da 009 | Depois da 009 | Escada correta (semeada na 006) |
|---|---|---|---|
| 5s | $10,00 | **$5,21** | $10,00 |
| 10s | $5,21 | **$5,21** | $20,00 |
| 15s | $30,00 | **$5,21** | $30,00 |
| 20s | $40,00 | **$5,21** | $40,00 |
| 30s | — | $60,00 | $60,00 *(inserido pela 009)* |

Todas as durações antigas colapsaram no mesmo $5,21.

## A migração 009 não causou isto

O script só faz três coisas: `DROP`/`ADD CONSTRAINT` em `ads.ad_campaigns` e
`ads.ad_orders` — que nem tocam em `pricing_config` — e dois `INSERT ... SELECT
WHERE NOT EXISTS`. **Não há um único `UPDATE` no arquivo.** Nenhum caminho ali
consegue reescrever preço de linha existente.

## Diagnóstico provável: linhas duplicadas

`ads.pricing_config` **não tem restrição de unicidade** em
`(pricing_type, placement, duration)`. E o leitor do endpoint ordena assim:

```js
order: 'placement.asc,duration.asc'
```

...e depois faz `cpm[placement][duration] = price_cents` em laço. Quando existe
**mais de uma linha ativa para a mesma dupla (placement, duration)**, a ordenação
não desempata — quem sobrevive é a última que o Postgres devolver, e essa ordem é
arbitrária. Inserir duas linhas novas basta para o desempate virar.

Isso também explica por que o 10s já aparecia como $5,21 **antes** da migração:
não era uma linha editada, era uma duplicata ganhando o desempate só naquela
duração. Agora ganha em todas.

**Isto ainda é hipótese.** Não tenho acesso ao banco para confirmar. A consulta
abaixo resolve em um segundo.

## Consulta de diagnóstico

```sql
SELECT pricing_type, placement, duration, price_cents, is_active,
       effective_from, effective_until, created_at, id
FROM ads.pricing_config
WHERE pricing_type = 'cpm' AND placement = 'sidebar'
ORDER BY duration, created_at;
```

- **Se vierem duas ou mais linhas por duração** → é duplicata, hipótese confirmada.
- **Se vier uma linha só por duração, todas com 521** → alguém rodou um `UPDATE`
  em algum momento; aí o conserto é outro.

## Conserto — quatro passos

Sem `BEGIN/COMMIT`: o SQL Editor do Supabase confirma a transação ao fim de cada
execução, então a conferência tem de vir **antes** da escrita, não no meio dela.

### Passo 2 — ensaio, mostra o que seria desativado sem escrever nada

```sql
SELECT p.duration, p.price_cents, p.created_at, p.id
FROM ads.pricing_config p
WHERE p.pricing_type = 'cpm'
  AND p.placement = 'sidebar'
  AND p.is_active = true
  AND EXISTS (
    SELECT 1 FROM ads.pricing_config q
    WHERE q.pricing_type = p.pricing_type
      AND q.placement    = p.placement
      AND q.duration     = p.duration
      AND q.is_active    = true
      AND (q.created_at, q.id) < (p.created_at, p.id)
  )
ORDER BY p.duration;
```

> **Atenção:** a regra mantém a linha **mais antiga** de cada duração, assumindo
> que a original da 006 é a correta. Confira aqui que o que aparece são as linhas
> de **521** e que as sobreviventes são 1000/2000/3000/4000. Se as de 521 forem
> as mais antigas, a regra tem de inverter.

O par `(created_at, id)` desempata: com `created_at` igual, `created_at` sozinho
deixaria as duas ativas.

### Passo 3 — limpeza

```sql
UPDATE ads.pricing_config p
SET is_active = false
WHERE p.pricing_type = 'cpm'
  AND p.placement = 'sidebar'
  AND p.is_active = true
  AND EXISTS (
    SELECT 1 FROM ads.pricing_config q
    WHERE q.pricing_type = p.pricing_type
      AND q.placement    = p.placement
      AND q.duration     = p.duration
      AND q.is_active    = true
      AND (q.created_at, q.id) < (p.created_at, p.id)
  )
RETURNING duration, price_cents, id;
```

Nada é apagado — as linhas ficam como histórico, apenas inativas.

### Passo 4 — conferência

```sql
SELECT duration, price_cents
FROM ads.pricing_config
WHERE pricing_type = 'cpm' AND placement = 'sidebar' AND is_active = true
ORDER BY duration;
```

Esperado: `5=1000`, `10=2000`, `15=3000`, `20=4000`, `30=6000`.

### Passo 5 — prevenção, só depois do passo 4 estar certo

```sql
CREATE UNIQUE INDEX IF NOT EXISTS pricing_config_active_unique
  ON ads.pricing_config (
    pricing_type,
    COALESCE(placement, ''),
    COALESCE(duration, -1)
  )
  WHERE is_active = true;
```

Torna o preço determinístico: duas linhas ativas nunca mais disputam a mesma
dupla. Se o comando falhar, ainda restam duplicatas — o que o torna a verificação
final da limpeza. Os `COALESCE` existem porque o schema permite `placement` e
`duration` nulos, e índice único trata nulos como distintos, o que deixaria a
brecha aberta justamente nas taxas de criação.

---

# DESFECHO (31 Jul 2026)

## O diagnóstico confirmou duplicatas — e inverteu a regra de conserto

Eram **nove grupos** duplicados, não quatro. Além dos quatro CPMs do sidebar:
o CPM da constellation e as quatro taxas de criação.

E o ponto crítico: **as linhas erradas eram as MAIS ANTIGAS.**

| Lote | Data | Conteúdo |
|---|---|---|
| Semeadura de teste | 2026-03-29 | tudo a 521 centavos |
| Tabela real | 2026-04-11 | a escada correta, inserida por cima |

O lote de abril nunca desativou o de março. As duas gerações ficaram ativas por
quatro meses, e o preço exibido dependia de qual linha o Postgres devolvia por
último — ordem arbitrária, porque o leitor ordena por `placement, duration` e
isso não desempata linhas do mesmo grupo.

> **A primeira regra de conserto que escrevi mantinha a linha mais antiga** — o
> que teria desativado a escada correta e consagrado o 521. O erro foi pego
> porque o passo de ensaio pedia conferir quais linhas seriam desativadas antes
> de escrever. A regra final mantém a **mais nova**.

## Duas armadilhas no caminho

**`NULL = NULL` não é verdadeiro.** As taxas de criação têm `placement` NULL.
Uma comparação com `=` simplesmente não as alcança, e elas teriam sobrado — o
índice único falharia depois sem causa aparente. Resolvido com
`IS NOT DISTINCT FROM`, e depois com `COALESCE` dentro do `PARTITION BY`.

**O primeiro `UPDATE` não aplicou.** O listing seguinte mostrou as duplicatas
intactas e o endpoint público confirmou que nada mudara. Reescrito com
`ROW_NUMBER()` — mesma semântica, mais fácil de auditar — e aí rodou,
devolvendo as nove linhas esperadas.

## Comando que resolveu

```sql
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY pricing_type,
                        COALESCE(placement, ''),
                        COALESCE(duration, -1)
           ORDER BY created_at DESC, id DESC
         ) AS rn
  FROM ads.pricing_config
  WHERE is_active = true
)
UPDATE ads.pricing_config p
SET is_active = false
FROM ranked r
WHERE p.id = r.id
  AND r.rn > 1
RETURNING p.pricing_type, p.placement, p.duration, p.price_cents, p.id;
```

Nove linhas desativadas. **Nada apagado** — ficam como histórico.

## Estado final, confirmado em `/api/ads/pricing`

| | 5s | 10s | 15s | 20s | 30s |
|---|---|---|---|---|---|
| **Sidebar CPM** | $10 | $20 | $30 | $40 | $60 |
| **Taxa de criação** | $150 | $250 | $350 | $450 | $650 |

Constellation CPM: $8 (5s, fixo).

## Pendente

O índice único do passo 5 — agora passa, porque não há mais duplicata. Sem ele o
problema pode voltar na próxima vez que alguém semear preços.

## O que eu não fiz

Não escolhi preço nenhum. A escada restaurada é a que a migração 006 semeou; a
única linha nova de valor é a taxa de criação de 30s, em $650, que você aprovou
ao rodar a 009.
