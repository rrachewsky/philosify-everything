# Bloco 3(b) — B2 (banco) · fechamento · 21/09/2026

**Executado e verificado pelo Bob (21/09), no SQL Editor do Supabase**, a partir de
`BLOCO3_B_COLETIVO_MORTO_2026-09-21.sql`. Segundo OK dado com o pré-flight em mãos, conforme combinado.
B1 (código) já estava no ar e commitado (`a9f6e5c`, ver `BLOCO3_B_FECHAMENTO_B1_2026-09-21.md`).

## Resultado

| Objeto | Antes | Depois |
|---|---|---|
| `public.analysis_groups` | existia, 0 linhas | **removida** |
| `public.group_members` | existia, 0 linhas | **removida** |
| `public.group_chat_messages` | existia, 0 linhas, com a trigger órfã | **removida** |
| Função da trigger órfã (`broadcast_group_chat_message`) | existia, chamada só pela trigger de `group_chat_messages` | **removida** |
| Policies RLS das 3 tabelas | existiam (1-G) | **removidas** (explicitamente, antes das tabelas — ver §2) |
| Coletivo vivo (`collective_groups` / `members` / `analyses` / `comments`) | 37 / 17 / 43 / 1 | **37 / 17 / 43 / 1** (idêntico) |
| Triggers de `collective_*` | archive + comment + comment_delete + member | **as 4 vivas** |

## 1. Passo 1 — pré-flight (só SELECT)

Todos os blocos no esperado:

| Bloco | Esperado | Obtido |
|---|---|---|
| 1-A | 3 tabelas, `rows = 0` | ✅ 0 / 0 / 0 |
| 1-B | só a trigger órfã em `group_chat_messages` | ✅ |
| 1-C | 0 (função não compartilhada) | ✅ 0 |
| 1-D | 0 FK externa | ✅ 0 |
| 1-E | 0 view | ✅ 0 |
| 1-F | 0 outra função | ✅ 0 |
| 1-G | informativo (policies, índices, constraints, publicações, colunas) | ✅ colhido — **Anexo A** (DDL de rollback) |
| 1-H | linha de base do vivo | ✅ 37 / 17 / 43 / 1 |

## 2. Passo 2 — DROP gated: uma abortagem e uma execução

**Primeira tentativa: ABORTOU** com `SQLSTATE 2BP01` (`dependent_objects_still_exist`) no `DROP TABLE` sem CASCADE.
Causa: a policy RLS **"Members can view their groups"**, definida em `analysis_groups`, referencia `group_members`
no seu `USING`. É uma dependência cruzada **entre as próprias tabelas mortas**. O pré-flight a listava (1-G,
tipo `policy`) mas não a tratava como gate, e o gate anti-CASCADE fez exatamente o que foi desenhado para fazer:
parou tudo, transação desfeita, **nada alterado**.

**Correção (supervisor):** o bloco passa a dropar as policies das três tabelas **antes** dos `DROP TABLE`, colhidas
de `pg_policies` em loop (nunca por nome digitado). Todo o resto é idêntico: gates 0–5, ordem filhas → pai, sem
CASCADE, `DROP FUNCTION` pela assinatura exata coletada do catálogo.

**Segunda execução: sucesso.** O arquivo `BLOCO3_B_COLETIVO_MORTO_2026-09-21.sql` foi atualizado neste fechamento
para que o passo 2 canônico seja a versão que rodou de verdade, com o histórico do 2BP01 em comentário.

Lição registrada para o 3(c) e seguintes: **policies RLS que citam outra tabela são dependência de DROP** e
entram como gate (ou como drop explícito prévio) em qualquer limpeza futura.

## 3. Passo 3 — verificação (só SELECT)

| Bloco | Esperado | Obtido |
|---|---|---|
| 3-A `tabelas_restantes` | 0 | ✅ **0** |
| 3-B `funcao_orfa` | 0 | ✅ **0** |
| 3-C `policies_orfas` | 0 | ✅ **0** |
| 3-D contagens do vivo | = 1-H | ✅ **37 / 17 / 43 / 1** |
| 3-D triggers de `collective_*` | as 4 | ✅ archive + comment + comment_delete + member — as 4 vivas |

Saída bruta: **Anexo B**.

## 4. Rollback

Irreversível por natureza (tabelas dropadas), mas as tabelas estavam vazias: só a **estrutura** se perdeu. O Anexo A
(saída do 1-G: colunas, constraints, índices, policies, publicações) é o material para recriar, se um dia for preciso.
Não há motivo previsto: o código que as usava saiu em `a9f6e5c`.

## 5. Pendências

- **Anexos A e B**: a mensagem do Bob trouxe o resumo dos resultados, não as saídas brutas. Os blocos abaixo ficam
  marcados para colagem; quando o Bob colar, entram neste arquivo em commit próprio.
- Fila herdada: contador de comentários ≠ visíveis no Coletivo; `useCinemaSidebar.js:18`; `useDM` 2×; post `09aca247…` da Roberto.
- Próximo: **Bloco 3(c)** — inventário e espelhos de todos os objetos do banco fora do repo (proposta em `BLOCO3_C_INVENTARIO_BANCO_2026-09-21.md`).

---

## Anexo A — saída do 1-G (DDL de rollback) — **AGUARDANDO COLAGEM DO BOB**

> Colar aqui, integral, a saída dos dois SELECTs do bloco 1-G (policies / índices / constraints / publicações,
> e a lista de colunas das três tabelas), exatamente como o SQL Editor devolveu.

```
[PENDENTE — colar a saída do 1-G]
```

## Anexo B — saída do passo 3 — **AGUARDANDO COLAGEM DO BOB**

> Colar aqui a saída dos blocos 3-A, 3-B, 3-C e 3-D (as duas queries), como o SQL Editor devolveu.

```
[PENDENTE — colar a saída do passo 3]
```
