# Painel ×3 no celular: onde foram os 6 créditos (25 ago)

**Diagnóstico só — nada foi alterado, corrigido, reembolsado ou purgado.**
Código auditado: exatamente o deployado (`d8681ba` / worker v`859c7390`; working
tree limpo confirmado por `git status`).

## Veredito em uma linha

A tentativa 1 reservou 3 créditos e o worker foi **derrubado quando o celular
desistiu da conexão** — o painel não tem `waitUntil` (o Lote 1 só aplicou ao TTS),
então nem o `catch` que devolve créditos nem o `finally` que solta a trava rodaram.
A tentativa 2 esbarrou na trava órfã e saiu sem cobrar. A tentativa 3 foi uma rodada
limpa que coube na janela: reservou e confirmou os 3 créditos legítimos. Os 3 da
tentativa 1 ficaram `pending` — e **o reaper (corrigido em 21 ago, hoje reembolsa)
deve tê-los devolvido ~10–15 min depois do teste**. O saldo 26 foi lido dentro
dessa janela; o esperado agora é 29. O SQL abaixo confirma ou refuta.

---

## 1. Linha do tempo das três tentativas

Horários são os aproximados do teste; o SQL crava os exatos.

### Tentativa 1 (~12:00) — "Failed to fetch", 3 créditos presos

| Passo | Evidência |
|---|---|
| Cache miss → trava `panellock:` gravada no KV, TTL 240s (expira ~12:04) | `philosopher-panel.js:163-190` |
| 3 reservas em paralelo; `reserve_credit` grava `status='pending'` e **debita o saldo na hora** (32→29) | `philosopher-panel.js:192-199`; `db/functions/reserve_credit.sql:38-61` |
| Geração inline no request — `ctx` é recebido na assinatura (linha 47) **mas nunca usado**; não há `waitUntil` em nenhum ponto do handler | `philosopher-panel.js` inteiro |
| Cadeia de modelos: claude → grok → gemini. Claude agora com timeout de 75s e `maxRetries 0` (Lote 1) | `philosopher-panel.js:259-263`; `ai/models/claude.js` |
| ~2 min: conexão morre no celular (borda ~100s e/ou rede móvel; o fetch do painel **não tem AbortController/timeout próprio** — o "Failed to fetch" é a conexão caindo, não abort do app) | `site/src/services/api/philosopherPanel.js:44-58` |
| Com o cliente desconectado e sem `waitUntil`, o runtime derruba a invocação: `catch` (release, linhas 376-385) e `finally` (delete da trava, 390-396) **não rodam**. Resultado: 3 reservas presas em `pending`, trava viva até o TTL | Comportamento documentado no próprio repo: comentário do cron em `api/index.js:4602-4608` ("When a client aborts mid-analysis the Worker can be torn down before the in-request release/finally runs, leaving the reserved credit stuck") |

O saldo 26 refuta a hipótese de a tentativa 1 ter sobrevivido em background: se
tivesse completado, teria confirmado os 3 (saldo ficaria 29) e gravado o cache —
e a tentativa 3 teria saído de graça como HIT.

### Tentativa 2 (~12:03) — "Análise falhou", zero cobrança

| Passo | Evidência |
|---|---|
| Cache miss → trava da tentativa 1 ainda viva (TTL até ~12:04) → entra no guard de duplicata | `philosopher-panel.js:164-168` |
| Poll do cache: 20 × 4s = **80s**. O cache nunca aparece (a geração 1 morreu) | `philosopher-panel.js:169-182` |
| ~12:04:20 retorna `ANALYSIS_FAILED` — **antes de qualquer reserva**: zero crédito tocado | `philosopher-panel.js:183-187` (o `reserveCredit` só ocorre na linha 194+) |
| O frontend exibe só a mensagem localizada `error: "Análise falhou"`; o `message` customizado ("This panel is already being generated…") vai num campo que o app ignora | `utils/errorResponse.js:21-36`; `utils/i18n-errors.js:27-29`; `philosopherPanel.js:103` |

O caminho alternativo para "Análise falhou" (falha real de geração, linhas 376-389)
é implausível na janela: exigiria claude+grok+gemini falhando todos em <100s
(só o timeout do Claude come 75s), e teria deixado 3 reservas `released/failed`
às 12:03 — o SQL (b) descarta ou confirma.

### Tentativa 3 (~12:06) — entregue, 3 créditos legítimos

| Passo | Evidência |
|---|---|
| Trava da tentativa 1 expirou por TTL (~12:04); cache vazio → rodada nova do zero | TTL 240s, `philosopher-panel.js:190` |
| **Nada das tentativas 1–2 foi reaproveitado** — elas não deixaram nenhum resultado parcial; a única herança foi a trava (já expirada) | KV só é escrito no sucesso, `philosopher-panel.js:310-313` |
| Reserva 3 (29→26) → geração completa dentro da janela → KV `panelcache:` + `panel:<uuid>` → INSERT em `panel_analyses` → confirma 3 (`status='confirmed'`, `credit_history` tipo `analysis`, −1 ×3) → resposta | `philosopher-panel.js:194, 265-374`; `db/functions/confirm_reservation.sql:52-69` |
| Por que coube na janela desta vez: ou o Claude respondeu em tempo, ou estourou os 75s e o Grok entrou rápido (P2.1 funcionando). O campo `model` do blob KV registra qual foi — ver comando no §4 | `philosopher-panel.js:295-306` |

Deve haver **exatamente 1** linha em `panel_analyses` e 1 blob `panel:<uuid>` para
esse painel, com timestamp ~12:07–12:08 — SQL (c).

---

## 2. Onde estão os 3 créditos "perdidos"

Nas **3 reservas `pending` da tentativa 1** (~12:00). Mecanismo completo:

1. `reserve_credit` debita o saldo no ato da reserva — por isso o débito aparece
   mesmo sem entrega.
2. Worker derrubado no disconnect → release em-request nunca roda → ficam `pending`.
3. O reaper `cleanup_stale_reservations` roda a cada 5 min (cron `*/5`,
   `api/index.js:4602-4616`), varre `pending` com >10 min e — **desde 21 ago,
   migração `cleanup_stale_reservations_refund.sql` aplicada com "Success"
   (registrado em `db/functions/cleanup_stale_reservations.sql`) — devolve o
   crédito e marca `released/timeout`.
4. Elegíveis ~12:10; primeiro sweep depois disso ~12:10–12:15 → **saldo deveria
   ter voltado a 29** minutos depois da leitura do 26.
5. O reembolso é **invisível no extrato**: `release_reservation` e o reaper não
   escrevem em `credit_history` ("internal audit only", `credits/release.js`).
   O saldo sobe de volta sem nenhuma linha — parece que os créditos sumiram e
   reapareceram do nada.

Portanto, no desenho atual: **a cobrança sem entrega é temporária (janela de
10–15 min), não permanente** — *se* o reaper varreu. É a única incerteza que o
código não responde; o SQL (b) + saldo atual respondem. Nota: NÃO era o Achado 1
original (reaper sem reembolso) — esse já foi corrigido em 21 ago; o que Roberto
viu foi a janela de espera do reaper corrigido.

### Leitura do SQL (b): árvore de decisão

| Estado das 3 reservas de ~12:00 | Significado |
|---|---|
| `released` / `release_reason='timeout'` / `released_at` ~12:10–12:15, saldo atual 29 | **Cenário esperado.** Nada perdido; Roberto leu o saldo dentro da janela do reaper |
| Ainda `pending` agora | Reaper não está varrendo — checar `wrangler tail` por `[Cron] Stale reservation cleanup failed`. Créditos recuperáveis (próximo sweep ou release manual) |
| `released/timeout` mas saldo continua 26 (sem outras transações) | Refund da função falhou — contradiz a migração aplicada; escalar |
| `released` / `release_reason='failed'` às ~12:03 | Tentativa 2 foi falha de geração (não poll) — não muda o destino dos créditos da tentativa 1, só o rótulo da tentativa 2 |

---

## 3. Proposta de correção (NÃO aplicada)

**A correção do reaper NÃO resolve sozinha** — ela já está aplicada (21 ago) e
mesmo assim o incidente aconteceu como aconteceu. Ela elimina só a perda
*permanente*; sobram três problemas que são exatamente o que Roberto viveu:

1. Janela de 10–15 min com o saldo furado e sem explicação no extrato.
2. A geração da tentativa 1 foi desperdiçada — o usuário repete, espera de novo
   e paga 3 créditos novos por um trabalho que já estava >60% pronto.
3. A trava órfã transforma o retry seguinte em 80s de espera + "Análise falhou".

**Correção estrutural: o painel precisa do mesmo `waitUntil` que o TTS ganhou no
Lote 1 (padrão P3.1).** Embrulhar a sequência geração → KV put → INSERT
`panel_analyses` → confirmações → delete da trava numa única promise, registrá-la
com `ctx.waitUntil(...)` e aguardá-la para a resposta. Efeito no cenário exato do
incidente:

- Cliente desconecta aos ~2 min → a geração **continua** e termina em background:
  cache gravado, 3 créditos confirmados **uma vez**, trava liberada.
- O retry do usuário (o poll da tentativa 2, que já existe) encontra o cache e
  retorna **HIT gratuito** em ~1–2 min — entrega sem recobrança.
- Nenhuma reserva órfã: o reaper vira rede de segurança de verdade (crash), não
  participante do fluxo normal.
- Falha de geração em background cai no `catch` existente que libera os créditos
  — também dentro do `waitUntil`.
- Coerente com a regra já escrita no código: "user paid credits, analysis must be
  permanent" (`philosopher-panel.js:309`).

Mudança pequena (~10 linhas, só `philosopher-panel.js`), mesmo padrão já provado
nos dois handlers de TTS.

**Complemento opcional (auditoria/UX, decisão separada):** release/reaper
escreverem uma linha `refund` em `credit_history` ao devolver crédito, para o
extrato mostrar o −3/+3 em vez de o saldo se mover em silêncio.

---

## 4. SQL para Roberto — investigação (só leitura)

Rodar no SQL Editor e colar a saída. Horários em UTC e São Paulo lado a lado.
Ajuste o e-mail se a conta do teste for outra.

```sql
-- (a) Extrato do dia: cada linha de credit_history de hoje
with u as (select id from auth.users where email = 'bob@bobrach.com')
select ch.created_at as utc,
       ch.created_at at time zone 'America/Sao_Paulo' as sp,
       ch.type, ch.amount, ch.status,
       ch.total_before, ch.total_after,
       ch.analysis_id, ch.metadata
from credit_history ch join u on u.id = ch.user_id
where ch.created_at >= current_date
order by ch.created_at;
```

```sql
-- (b) As reservas do dia com status atual — a query decisiva
with u as (select id from auth.users where email = 'bob@bobrach.com')
select cr.id,
       cr.created_at as utc,
       cr.created_at at time zone 'America/Sao_Paulo' as sp,
       cr.credit_type, cr.status,
       cr.confirmed_at, cr.released_at, cr.release_reason,
       cr.analysis_id
from credit_reservations cr join u on u.id = cr.user_id
where cr.created_at >= current_date
order by cr.created_at;

-- Saldo atual (esperado: 29 se o reaper varreu; 26 se não)
with u as (select id from auth.users where email = 'bob@bobrach.com')
select c.purchased, c.free_remaining,
       c.purchased + c.free_remaining as total, c.updated_at
from credits c join u on u.id = c.user_id;
```

```sql
-- (c) Registros do painel: deve haver exatamente 1, da tentativa 3
with u as (select id from auth.users where email = 'bob@bobrach.com')
select pa.panel_id, pa.media_type, pa.title, pa.artist,
       pa.philosophers, pa.lang,
       pa.created_at at time zone 'America/Sao_Paulo' as sp
from panel_analyses pa join u on u.id = pa.user_id
where pa.created_at >= current_date
order by pa.created_at;
```

KV (terminal, opcional — qual modelo gerou a tentativa 3 e se a trava sumiu):

```bash
cd api
# o campo "model" do blob diz se foi claude ou grok; "createdAt" crava o horário
wrangler kv:key get --binding=PHILOSIFY_KV "panel:<panel_id da query c>"
# trava deve ter sumido (TTL); se listar algo, há geração em andamento agora
wrangler kv:key list --binding=PHILOSIFY_KV --prefix "panellock:"
```

## Passo 5 (reprodução sob tail)

**Desnecessário** — os passos 1–4 fecham a causa no código, e o saldo 26 exclui a
única hipótese alternativa (tentativa 1 sobrevivendo em background). Só vale subir
o tail se o SQL (b) contradisser o cenário esperado (linhas ainda `pending`, ou
`timeout` sem refund no saldo).
