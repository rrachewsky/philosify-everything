# Painel de filósofos — Ordem Unificada de Execução · RELATÓRIO FINAL

**Ordem:** Roberto, 8 Ago 2026 · **Execução:** 8–9 Ago 2026 · **Branch:** `redesign/v2`
**Base:** `philosify-painel-correcao-etapas-2ago-report.md` (diário completo; este relatório é o consolidado autônomo)

**Estado: ORDEM EXECUTADA POR INTEIRO. 21/21 painéis regenerados e verificados. 51 créditos, cobrança única. Chave protegida intacta. `4f20208a` intocado. Histórico de análises recuperado (0 → 31).**

---

## 1. O que a ordem determinou e o que foi feito

| Step | Determinação | Resultado |
|---|---|---|
| Fechados | D1 (nada apaga `songs`), D4 (reservas crescem por desenho) | Registrados, não perseguidos |
| Adiado | D3 (SQL de crédito vive só no banco) | Registrado; problema real, não bloqueia |
| **1** | ETAPA 3: campo `model` no blob, sem backfill | ✅ Feito, commit `8fe84e7`, deploy `2258d14e` |
| **2** | ETAPA 4: regenerar os 21 com os créditos da conta | ✅ 21/21, 51 créditos, tudo verificado |
| **3** | Sharing: shareNewsText + ?lang= do /debate | ✅ Já estavam corrigidos na árvore; deploy os levou ao ar |
| **4** | user-history (D2 confirmado) | ✅ Corrigido e provado em produção |
| **5** | Commits, deploy único final, registro | ✅ 4 commits, 2 deploys de worker + 1 de Pages |

---

## 2. STEP 1 — `model` no blob do painel

- `philosopher-panel.js` grava `model: usedModel` (cadeia claude → grok → gemini) em `panelData`. Painéis novos apenas; **nenhum backfill** — o dado não existe para os antigos e não foi inventado.
- **Desvio declarado da sequência de deploy:** o deploy deste step (`2258d14e`) foi feito **antes** do STEP 2, não no deploy final. Motivo: o valor de `model` só existe dentro do worker no momento da geração; sem esse deploy, o campo `model` exigido em 2.3 para os 17 temporários teria de ser inventado — o que a própria ordem proíbe. O deploy final (5.3) cobriu os steps 3–4, como determinado.

## 3. STEP 2 — os 21 regenerados

### 3.1 Aritmética corrigida pelos dados

Os 21 blobs, **relidos por chave imediatamente antes de começar** (exit code + conteúdo parseado, nunca diff de listagem — R1/B5), agrupam em **18 identidades de requisição**:

- **14 singles**
- **3 pares internos**: `379b7866`+`fa71cd00` (O Agente Secreto) · `35c6f11e`+`1e7b0979` (The Fountainhead) · `a03a59f4`+`2e517a64` (O Pianista)
- **1 cópia**: `7a41cba5` ← `4f20208a` (Schindler Peikoff/Sêneca/Freud)

A composição da ordem ("14 singles + 3 pares + Schindler") bate com os dados; a soma dela ("17 conteúdos / 16 gerações / 48 créditos") não. Real: **17 gerações × 3 = 51 créditos** — o número original do relatório de etapas. As duas "Música no Coração" **não** são par (conjuntos de filósofos distintos). O saldo (92) cobria; executado sem parar.

### 3.2 Contabilidade de créditos — fechada

```
saldo inicial:  92
saldo final:    41
gasto:          51 = 17 gerações × 3, cobrança única
checkpoints:    92 → 89 → 77 → 71 → 65 → 41  (todos exatos, zero cobrança dupla)
```

Todas as 17 gerações retornaram `cached: false` — **nenhuma chave corrompida sobreviveu ao 2.1**.

### 3.3 Mecânica por conteúdo (como ordenado)

1. **2.1** — chave de cache corrompida viva deletada e confirmada ausente por leitura (9 chaves distintas; as 3 dos pares são a mesma string do membro mais novo). A chave protegida tem guarda literal no script — recusa antes de qualquer plano.
2. **2.2** — POST com o payload original exato: título/diretor/filósofos/idioma **dos blobs**; sinopse+gêneros re-obtidos do `/api/film-search` (o blob não os guarda — irrecuperáveis por desenho). The Fountainhead: sinopse pt legitimamente vazia no TMDb — fiel ao que o app envia hoje. The Odyssey: `en`.
3. **2.3** — blob corrigido gravado em cada `panel:` antigo: `id` e `createdAt` **preservados**, `analysis` corrigida, `regeneratedAt`, `supersedes: 'cinema-media-type-bug'`, `sourcePanelId`, `model`. Pares: os dois ids antigos recebem o conteúdo, cada um com sua data. Verificação: releitura da chave e comparação **byte a byte**.
4. **2.4** — chave de cache regravada com o blob do id canônico (pares: o dono anterior da chave). Cópia de Schindler: **pulado** — chave protegida.
5. **2.5/2.6** — temp apagado; ausência confirmada por leitura (exit code).

### 3.4 Tabela final — 18 grupos

| # | Conteúdo | Membros (ids antigos) | Temp | Modelo | Chars |
|---|---|---|---|---|---|
| 1 | O Agente Secreto (par) | `fa71cd00` + `379b7866` | `977b85cf` | claude | 8 923 |
| 2 | Forrest Gump | `e5acf8de` | `e008b6a9` | claude | 8 556 |
| 3 | Super Mario Galaxy | `e73a57b7` | `36b3046d` | claude | 9 096 |
| 4 | Matrix | `4b23c985` | `258b4ca0` | claude | 8 748 |
| 5 | O Padrinho (Smith/Einstein/Aristóteles) | `b563b7ba` | `9830346e` | claude | 9 240 |
| 6 | Música no Coração (Rand/Aristóteles/Platão) | `49d80c24` | `445f519e` | claude | 8 536 |
| 7 | Música no Coração (Peikoff/Platão/Aristóteles) | `dab2c7c9` | `a37b3de1` | claude | 8 222 |
| 8 | **Schindler — CÓPIA de `4f20208a`** | `7a41cba5` | — | (sem model — fonte pré-STEP 1, não inventado) | 9 526 |
| 9 | The Odyssey (en) | `926fa212` | `69c7870e` | claude | 9 269 |
| 10 | O Náufrago | `122b14d4` | `e70e8b82` | claude | 8 162 |
| 11 | The Fountainhead (par) | `35c6f11e` + `1e7b0979` | `fdbd0bfe` | claude | 9 108 |
| 12 | Patton | `1bdd6741` | `69c51337` | claude | 8 341 |
| 13 | O Pianista (par, Rand/Sêneca/Freud) | `2e517a64` + `a03a59f4` | `f7cfeb9f` | claude | 8 510 |
| 14 | O Pianista (Rand/Sêneca/Kant) | `6226f534` | `988bceb4` | claude | 8 867 |
| 15 | O Padrinho (Peikoff/Sêneca/Freud) | `95df2d25` | `12cafb28` | claude | 8 307 |
| 16 | 2001: Odisseia no Espaço | `a3bd8963` | `f84b48c5` | claude | 8 353 |
| 17 | Relatos Selvagens | `a4d7cc94` | `7de649f7` | claude | 8 362 |
| 18 | Schindler (Rand/Kant/Sêneca) | `c68dbffc` | `b755350e` | claude | 9 370 |

### 3.5 Verificação final da operação

Releitura dos 21 `panel:` + chave protegida + `panel:4f20208a`, por chave:

- **21/21 OK** — id certo, `createdAt` original preservado, `regeneratedAt` presente, `supersedes` correto, `sourcePanelId` presente, análise íntegra;
- **chave protegida**: guarda `4f20208a` — **INTACTA**;
- **`panel:4f20208a`**: sem `supersedes`, 9 526 chars — **INTOCADO**;
- todos os 17 temps: apagados e confirmados ausentes.

### 3.6 Incidentes operacionais — todos sem custo

- A extensão do Chrome congelou **três vezes** (antes de g6, g9 e g11). Causa identificada: o Chrome descarta a aba em segundo plano durante as fases longas de KV; o próximo attach do CDP estoura o timeout. Mitigação adotada: recontexto + ping antes de cada disparo.
- Nas três, antes de qualquer redisparo: **sonda da chave de cache por leitura (6×, exit code) + leitura de saldo** provaram que nada tinha sido cobrado. O `cached:false` do redisparo confirmou depois. **Zero cobrança dupla.**
- Uma sonda minha inicial testou stdout vazio em vez de exit code (a armadilha do B5) — corrigida na hora, registrada.
- Lixo de ferramenta: o wrangler criou diretórios de cache (`node-compile-cache`) em `api/` nomeados pelos temp-ids. Sem dados de projeto; removidos.

## 4. STEP 3 — sharing

- **3.1 — reuso confirmado, nenhuma string nova.** `share.shareNewsAnalysisText` ("análise filosófica de {{title}}") **já existe nos 18 locales** e o share de análise de News **já o usa** (`NewsPage.jsx:780`, desde `890d5f0`). `shareNewsText` (texto de painel) é usado apenas em shares de painel — uso correto. O que produzia o sintoma em produção era **atraso de deploy do site**, resolvido no 5.3.
- **3.2 — já corrigido na árvore** (`890d5f0`): `DebateDeepLink` lê `?lang=` e repassa a `/ideas?debate=…&lang=…`. Idem: faltava só o deploy.
- **Anotado, não executado (fora da ordem):** `PanelPermalink.jsx` usa `shareMusicText` (🎵) para painéis de **cinema e literatura** — vocabulário de música em share de filme/livro. Candidato a correção futura.

## 5. STEP 4 — user-history (D2)

Correção em `user-history.js` (commit `3a3d18f`):

- **4.1 análises** — select só com colunas reais (`analysis_id,requested_at`); título/artista via join `analyses→songs`, a mesma fonte do `analysis-history` que comprovadamente funciona;
- **4.2 quiz** — `started_at` → `created_at` (`started_at` não é referenciado em nenhum outro ponto do código); unsafe-zone mantido — o select é a mesma lista de colunas que `unsafe-zone.js:555` usa em produção;
- **4.3** — `query()` agora loga **tabela + status + corpo do PostgREST** em toda falha; a categoria ainda degrada para `[]`, mas nunca mais em silêncio;
- **4.4 teste em produção (pós-deploy):** `200`, **43 itens** — **31 análises (era 0)** com títulos reais ("Imagine — John Lennon"…), 8 painéis, 4 debates. `wrangler tail` durante duas requisições: **nenhum `QUERY FAILED`** — as sete consultas passam; quiz e unsafe-zone estão genuinamente vazios para a conta hoje.

## 6. STEP 5 — commits e deploys

```
8fe84e7  Panel blob records the generating model (new panels only, no backfill)   [STEP 1]
a213636  Panel template: explicit media-type table, cinema speaks film language   [5.1 — correção da ETAPA 1]
3a3d18f  user-history: select only real columns, titles via songs join, loud failures  [5.2]
d09bdb7  Etapas report: full record of the unified execution order (8-9 Aug)      [5.4]
```

Deploys: worker **`2258d14e`** (STEP 1, pré-STEP 2, justificado em §2) e **`eda5d003`** (final, steps 3–4); Pages **`a7c418ea`** (branch `production` — leva `890d5f0` ao site vivo).

## 7. Pendências e anotações que sobrevivem à ordem

1. **D3 (adiado por você):** as funções SQL de crédito (`reserve_credit`, `confirm_reservation`, `release_reservation`, `cleanup_stale_reservations`) vivem só no banco, sem cópia versionada.
2. **PanelPermalink** com `shareMusicText` em painéis de cinema/literatura (§4).
3. **Candidato registrado nas etapas:** derivar a lista branca de `philosopher-panel.js:84` das chaves de `MEDIA` (ou asserção que falhe se divergirem) — elimina a classe do bug de vez.
4. **Constraint de `panel_analyses`** segue sem `cinema` (fora de escopo, confirmado B4): painéis de cinema continuam existindo só no KV e fora do histórico.
5. Quiz e unsafe-zone com **zero linhas** para a conta — consistente com o incidente C; nada a corrigir no endpoint (consultas passam).
