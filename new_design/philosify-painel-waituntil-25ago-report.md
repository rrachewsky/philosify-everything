# Painel com waitUntil: gate aplicado e no ar (25 ago)

**Status: itens 1 e 2 completos; item 3 REPROVADO na verificação — em correção.**
Itens 1 e 2 deployados e verificados em produção (worker
`philosify-api-production`, versão `9118ddd8-6903-4195-8466-288626669851`, health
OK em `api.philosify.org` e workers.dev). O item 3 rodou com "Success" no SQL
Editor mas a verificação funcional do mesmo dia reprovou — a função viva de
`release_reservation` não mudou (ver §5). O gate NÃO está completo até a
reverificação do §5 passar. Base: diagnóstico aprovado de
`philosify-painel-creditos-25ago-report.md`; código anterior `d8681ba`.

---

## 1. O que mudou

### Item 1 — waitUntil no painel (`api/src/handlers/philosopher-panel.js`)

- **Linhas 235-375** — a sequência geração → KV (`panelcache` + `panel:<id>`) →
  INSERT `panel_analyses` → confirmação dos 3 créditos virou a função
  `generatePanel()`; corpo interno intocado (modelos, prompts, cadeia
  claude→grok→gemini, custo 3).
- **Linhas 377-401** — `generationJob`: promise que embrulha `generatePanel()` e
  **nunca rejeita** (rejeição dentro de waitUntil depois da resposta seria
  unhandled, sem ninguém para devolver os créditos). O `catch` que libera as 3
  reservas em falha vive DENTRO do job — roda também em background. O `finally`
  deleta a trava em todos os desfechos; TTL 240s segue como backup de crash.
- **Linha 403** — `if (ctx?.waitUntil) ctx.waitUntil(generationJob)` registrado
  **antes** do await: cliente desconectando no meio, o runtime mantém o job vivo
  até o fim. Com `ctx` null (chamada legada), o await da linha 405 é o inline de
  sempre.
- **Linhas 405-436** — a resposta é montada aguardando a mesma promise; shape do
  caminho feliz idêntico (`success/cached/panel/credits/remaining`), caminho de
  erro idêntico (`ANALYSIS_FAILED` sanitizado).

Efeito no cenário do incidente de 25 ago: o disconnect do celular deixa o job
terminar em background — cache gravado, 3 confirmações exatamente uma vez, trava
liberada — e o retry do usuário cai no poller como **HIT gratuito**. Nenhuma
reserva órfã para o reaper.

### Item 2 — mensagem do poller

- `api/src/utils/i18n-errors.js:47-66` — chave `PANEL_IN_PROGRESS` nos 18 idiomas
  do arquivo (en, pt, es, fr, de, it, nl, ru, zh, ar, he, ja, ko, tr, pl, hu,
  hi, fa), padrão das chaves existentes.
- `api/src/utils/errorResponse.js:93-94` — seção nova `// 409 - Conflict` com
  `PANEL_IN_PROGRESS: 409`.
- `api/src/handlers/philosopher-panel.js:183-186` — o estouro dos 80s do poller
  agora retorna `PANEL_IN_PROGRESS` (409) em vez de `ANALYSIS_FAILED` com
  `message` ignorado.

**Frontend (verificado, não alterado):** as quatro páginas v2 (Music, News,
Literature, Cinema) exibem `err.message`, que carrega o campo `error` localizado —
o usuário lê "Este painel ainda está sendo gerado — tente novamente em um minuto".
Ajuste que ficou listado para outro gate, se Roberto quiser: as páginas estilizam
qualquer erro do painel como falha fatal (`setPanelError`); 409 poderia virar
aviso com re-tentativa automática. Com o item 1, esse caminho tende a ser raro —
o poller passa a encontrar o cache pronto antes dos 80s.

### Verificação pré-deploy

`node --check` limpo nos 3 arquivos; leitura do fluxo: nenhum caminho deixa
reserva `pending` sem release (release em falha roda dentro do job, inclusive em
background), nenhum caminho deixa a trava sem delete (`finally` + TTL), resposta
do caminho feliz com shape intocado. `ctx` já era passado pelo roteador
(`api/index.js:3573`).

---

## 2. Reprodução sob tail — o que ela provou e o que não

Saldo antes: **29**. Depois: **26**. Exatamente **−3**, confirmado por Roberto.

Tail da rodada (painel de música "As Time Goes By" — Frank Sinatra, pt, painel
Augustine/Aristotle/Ayn Rand):

```
[PhilosopherPanel] music: "As Time Goes By" by Frank Sinatra. Panel: Augustine of Hippo, Aristotle, Ayn Rand
[PhilosopherPanel] Cache MISS for "panelcache:music:as time goes by:frank sinatra:aristotle,augustine of hippo,ayn rand:pt" → generating new analysis
[Credits] Reserved free credit ... Reservation: f1435c97... Remaining: 28
[Credits] Reserved free credit ... Reservation: b9acf5a8... Remaining: 27
[Credits] Reserved free credit ... Reservation: 88487541... Remaining: 26
[PhilosopherPanel] Calling claude for music panel analysis in "pt"...
[Claude] Using model: claude-opus-4-8, effort: medium, max: 16000, timeout: 75000ms
[Claude] API error: 400 "Output blocked by content filtering policy"
[PhilosopherPanel] Content filtered by claude, trying next model...
[PhilosopherPanel] Calling grok for music panel analysis in "pt"...
[Grok] ✓ 11202 tokens (8755 in, 1778 out)
[PhilosopherPanel] Generated 7194 chars using grok
[PhilosopherPanel] Saved to panel_analyses: a7bd4e30-40f0-4420-99b5-955e1ffdf439
[Credits] Reservation b9acf5a8... confirmed. Balance: 26
[Credits] Reservation f1435c97... confirmed. Balance: 26
[Credits] Reservation 88487541... confirmed. Balance: 26
[Balance] User: c7ab2dcd..., Credits: 10, Free: 16, Total: 26
```

**Provado ao vivo:**
- Cobrança única e exata: 3 reservas (29→26), 3 confirmações, saldo final 26.
- Reservas paralelas (P2.3) serializando corretamente no saldo (28/27/26, sem
  lost update).
- Cadeia de fallback em ação real: Claude recusou por content filter → Grok
  gerou. Campo `model` do blob registra `grok`.
- Fluxo completo: KV + `panel_analyses` + confirmações + entrega, sem erro.

**Não exercitado (honestidade do teste):** o caminho do disconnect. A geração
foi rápida demais — o Claude falhou em segundos (content filter, não timeout) e
o Grok respondeu dentro da janela; o painel chegou numa única conexão antes do
modo avião aos ~60s. O tail não tem nenhuma linha de `Generation already in
flight`, poll ou `Cache HIT` — ou seja, a rodada não passou pelo waitUntil em
anger. A garantia desse caminho segue apoiada em: (a) revisão do fluxo acima;
(b) o mesmo padrão P3.1 já provado em produção nos dois handlers de TTS desde o
Lote 1. **Re-teste opcional** se Roberto quiser a prova ao vivo: repetir com
obra nova e modo avião aos ~20-30s (antes de o Grok terminar), reconectar e
re-acionar — esperado: confirmações aparecendo no tail após o disconnect e o
segundo acionamento como `cache HIT (no charge)`.

Nota lateral do tail: o content filter do Opus num painel de música inofensivo
("As Time Goes By") merece um olhar em outro momento — hoje o custo é só cair
para o Grok, mas é o segundo bloqueio visto em produção.

---

## 3. Saldo

| Momento | Saldo |
|---|---|
| Antes da reprodução | 29 |
| Depois (1 painel entregue) | **26** (−3 exato; 10 pagos + 16 grátis) |

---

## 4. Item 3 — migração do reembolso visível (rodou com "Success", REPROVADA na verificação — ver §5)

Arquivo: `migrations/credit_refund_history.sql` (gated). O que faz: os três
caminhos de devolução — `release_reservation`, `cleanup_stale_reservations`
(reaper global) e `cleanup_user_stale_reservations` — passam a gravar uma linha
`type='refund'`, `amount +1` em `credit_history`, com snapshots before/after
coerentes e `metadata` carregando `reservation_id`, `reason`
(failed/cached/timeout/user_timeout_cleanup) e `credit_type`. Cada INSERT fica
num sub-bloco `BEGIN/EXCEPTION` próprio: falha no histórico vira WARNING e
**nunca** bloqueia nem desfaz o reembolso.

**Atenção antes de rodar:** o corpo do `release_reservation` desta migração
**inclui** a correção gated de 23 ago (`#variable_conflict use_column`, de
`migrations/release_reservation_variable_conflict.sql`) — o espelho em
`db/functions/` não a reflete, indício de que ela ainda não rodou. Rodar esta
migração sozinha aplica as duas coisas; se a de 23 ago já tiver rodado, esta
mantém a diretiva. Depois do "Success", os espelhos em `db/functions/` serão
atualizados (release_reservation, cleanup_stale_reservations,
cleanup_user_stale_reservations).

O bloco completo está no arquivo da migração — copiar `migrations/credit_refund_history.sql`
inteiro no SQL Editor e rodar uma vez. Verificação pós-migração sugerida:

```sql
-- Deve listar as 3 funções com corpo contendo 'refund history insert failed'
select p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('release_reservation','cleanup_stale_reservations','cleanup_user_stale_reservations')
  and pg_get_functiondef(p.oid) like '%refund history insert failed%';
```

---

## 5. Item 3 — verificação falhou (25 ago, mesma noite)

### O que a verificação de Roberto mostrou

Bloco DO no SQL Editor (reserve → release `'failed'` → leitura do histórico,
tudo desfeito por RAISE EXCEPTION):

- `reserve_credit`: **success true**, used_free true, reserva criada.
- `release_reservation`: **success false**, message
  `column reference "free_remaining" is ambiguous`, new_total 0.
- `credit_history`: **nenhuma** linha `type='refund'` — a função morreu antes
  do INSERT.
- Saldo não voltou (free_remaining ficou −1 até o rollback do bloco).

Conclusão direta: o corpo que executa em produção **não tem** o
`#variable_conflict use_column` — a migração `credit_refund_history.sql` deu
"Success" **sem trocar a função que roda**. O espelho
`db/functions/release_reservation.sql` do commit `d871ed7` descrevia um corpo
que não é o vivo; a nota foi corrigida (agora marca o arquivo como TARGET, não
espelho verificado).

### Causa provável

`CREATE OR REPLACE FUNCTION` só substitui quando os **tipos dos argumentos**
batem exatamente. Qualquer deriva — por exemplo `p_reason text` no vivo vs
`character varying` na migração — faz o comando criar um **segundo overload**
em silêncio: "Success" significando "criei uma duplicata". Dois detalhes
sustentam a hipótese:

1. No teste de Roberto, a chamada posicional `release_reservation(id, 'failed')`
   com literal de tipo desconhecido resolve, entre um overload `text` e um
   `varchar`, para o `text` (tipo preferido da categoria string) — ou seja,
   executaria exatamente o corpo velho sem diretiva, com o SQLERRM observado.
2. Mudança de **nome** de parâmetro não cria overload (daria erro explícito), e
   default diferente também não — só resta tipo.

Hipótese alternativa (menos provável, mas possível): o bloco 1 da migração não
foi executado no editor (colagem parcial) e existe uma única função, a velha.
O inventário abaixo decide entre as duas.

### Impacto no worker (enquanto não corrigir)

`callRpc` (`api/src/utils/supabase.js:203-224`) chama
`POST /rest/v1/rpc/release_reservation` com parâmetros **nomeados**
(`p_reservation_id`, `p_reason`, `p_analysis_id` — `api/src/credits/release.js`).
Se houver dois overloads aceitando esses nomes, o PostgREST devolve erro de
ambiguidade (HTTP 300) em **toda** chamada — release de análise falhada e de
resultado cacheado quebrados. Se houver um só (o velho), o release falha com o
SQLERRM de ambiguidade, como já falhava desde antes do gate (achado de 23 ago).
Nos dois cenários o dano é amortecido: a reserva fica `pending` e o reaper
reembolsa em ≤15 min (agora com linha `refund` no extrato, reason `timeout`) —
o usuário não perde crédito, mas o release direto não funciona. Tail ouvido por
alguns minutos nesta noite: **zero eventos de release na janela** — sem
confirmação ao vivo de qual cenário; o inventário responde.

### Passo 1 — inventário das funções vivas (rodar e colar a saída)

```sql
SELECT n.nspname AS schema,
       p.proname AS funcao,
       p.oid,
       pg_get_function_identity_arguments(p.oid) AS assinatura,
       pg_get_function_result(p.oid) AS retorno,
       pg_get_functiondef(p.oid) ~ '#variable_conflict use_column' AS tem_diretiva,
       pg_get_functiondef(p.oid) ~ 'refund history insert failed'  AS tem_refund_insert,
       pg_get_functiondef(p.oid) AS corpo
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('release_reservation','reserve_credit','confirm_reservation',
                    'cleanup_stale_reservations','cleanup_user_stale_reservations')
ORDER BY p.proname, p.oid;
```

Leitura esperada: quantas linhas `release_reservation` existem e qual(is)
têm `tem_diretiva`/`tem_refund_insert`. De quebra, confere se os dois reapers
ganharam o INSERT (assinaturas deles batiam com o vivo, então o REPLACE deve
ter funcionado — mas agora ninguém confia sem olhar).

### Passo 3 — correção preparada (GATED, não aplicada)

`migrations/release_reservation_rebuild.sql` — numa única transação:
1. **DROP de todos os overloads** de `public.release_reservation`, qualquer
   assinatura (DO block sobre `pg_proc` — sem adivinhar qual é a cópia errada;
   como a recriação acontece na MESMA transação, o worker nunca vê janela sem a
   função — atende a intenção do "nunca dropar a que o worker usa").
2. **CREATE da única função canônica**: todas as referências de coluna
   qualificadas por alias (`c.free_remaining`, `c.purchased`, `c.total` —
   correto mesmo SEM diretiva) **e** `#variable_conflict use_column` como
   segundo cinto; INSERT best-effort da linha `refund` mantido; GRANT explícito
   ao `service_role` (CREATE novo não herda ACL).
3. Verificação como **último** statement (o editor só exibe o último): deve
   retornar **exatamente 1 linha** com `tem_diretiva = true` e
   `tem_refund_insert = true`.

### Passo 4 — reverificação (critério de aprovação do gate)

Roberto reroda o mesmo bloco DO da verificação. Aprovado quando:
`release success = true`, `linha_refund` presente com `amount 1` e `metadata`
contendo `reservation_id` e `reason 'failed'`, e `saldo_depois` = `saldo_antes`.
Só então: espelho `db/functions/release_reservation.sql` substituído pelo corpo
aplicado, e este relatório marcado como gate completo.

### Lição registrada

"Success" de DDL não é verificação. `CREATE OR REPLACE` com assinatura errada
cria overload calado — toda migração de função passa a terminar com um SELECT
de contagem de overloads + marcador de corpo como último statement, para o
resultado visível ser a prova, não o "Success".

---

## Rollback

Worker: `cd api && npx wrangler rollback` (volta à v`859c7390`). Banco: a
migração original do item 3 pode ter deixado um overload duplicado de
`release_reservation` — a correção é a própria
`release_reservation_rebuild.sql` (drop de todos + recriação), não um revert.
