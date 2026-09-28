# Bloco 3(c) — Inventário e espelhos do banco · PROPOSTA · 21/09/2026

**Branch:** `redesign/v2` · **Base:** `c17eff5` (fechamentos 3a/3b) · **Status:** **APROVADA pelo Bob em 22/09** (ver §7) — aguardando as saídas dos 7 blocos; **nada aplicado, nada rodado no banco por mim**.
Arquivos desta proposta (untracked): este md + `BLOCO3_C_INVENTARIO_BANCO_2026-09-21.sql`.

Origem: item (c) do Bloco 3 — "exportação dos objetos do banco ainda fora do repo" (report do supervisor de 20/09, §6).
Divisão de trabalho combinada em 21/09: **Bob roda os SQLs (só SELECT) e traz as saídas; eu gravo os espelhos em
`db/` diffando contra os existentes.**

---

## 1. Por que

O banco é hoje a única cópia de quase tudo que roda nele. O repo conhece:

| O que o repo já espelha | Onde |
|---|---|
| 6 funções (créditos + `broadcast_collective_member_change`) | `db/functions/*.sql` |
| ~10 triggers, só como `CREATE TRIGGER` dentro de migrations avulsas | `migrations/*.sql`, `database/*.sql`, `api/migrations/*.sql`, `api/src/db/*.sql` |
| policies: só as que alguma migration criou (`URGENT_enable_rls_all_tables.sql` e afins) | idem |
| schema `audit`: uma única menção (`audit.archive_underground_post`) | `migrations/broadcast_underground_post.sql` |

Tudo o que foi criado direto no SQL Editor (a trigger do DM achada "fora do repo" na Etapa 1, a de `member-joined`,
a órfã de `group_chat_messages` que acabamos de dropar) só existiu no banco. O 3(b) mostrou o custo: a policy
"Members can view their groups" derrubou o primeiro DROP porque ninguém a tinha versionada.

## 2. Escopo

| Objeto | Schemas | Bloco do SQL | Vira |
|---|---|---|---|
| Funções e procedures (exclui as de extensões) | `public`, `audit` | I-1a (índice) + I-1b (corpo) | `db/functions/<schema>.<nome>.sql` |
| Triggers não-internas | `public`, `audit`, `auth`, `storage`, `realtime` | I-2 | `db/triggers/<schema>.<tabela>.<tgname>.sql` |
| Policies RLS, por tabela, com estado do RLS | `public`, `audit`, `storage`, `realtime` | I-3 | `db/policies/<schema>.<tabela>.sql` |
| Apoio: contagens, tabelas sem RLS, RLS sem policy, publicações, tabelas de `audit` | — | I-0, I-4 | `db/INVENTARIO_<data>.md` (índice + achados) |

Fora do escopo (registrado): DDL das tabelas (colunas/índices/constraints — `migrations/schema_reference.sql` já cobre
parte; fica para um 3(c)-bis se o Bob quiser), dados, roles/grants, extensões, config do Auth.

## 3. O que o Bob roda

`new_design/BLOCO3_C_INVENTARIO_BANCO_2026-09-21.sql` — 7 blocos, **todos SELECT**, sem efeito colateral:

| Bloco | Saída | Para quê |
|---|---|---|
| I-0 | 6 contagens | conferir que as colagens seguintes vieram completas |
| I-1a | lista de funções (schema, nome, args, retorno, linguagem, security definer, tamanho, nº de triggers que a usam) | índice; detecta função sem uso |
| I-1b | `pg_get_functiondef` de cada função | o corpo dos espelhos |
| I-2 | `pg_get_triggerdef` + função + enabled | espelhos de triggers |
| I-3 | policies com `USING` / `WITH CHECK` / roles / cmd + `rls_enabled` | espelhos de policies |
| I-4a/b | tabelas sem RLS; tabelas com RLS e zero policy | achados de segurança para registrar |
| I-4c/d | publicações realtime; tabelas do schema `audit` | contexto |

**Formato da colagem:** texto/CSV do SQL Editor (não print). Se I-1b estourar o limite do editor, o próprio arquivo
diz como fatiar (por schema ou por faixa de nome). Os blocos são independentes: podem vir em mensagens separadas.

## 4. O que eu faço com as saídas

1. **Conferência de completude:** nº de linhas de I-1b = `funcoes_public + funcoes_audit` de I-0; I-2 = `triggers_nao_internas`; I-3 = `policies`.
2. **Funções:** para cada uma, gravar `db/functions/<schema>.<nome>.sql` com cabeçalho padrão (data do dump, origem,
   "espelho — o banco é a cópia executante"). **Os 6 existentes:** diff do corpo vivo contra o arquivo; três desfechos:
   - idêntico → só atualiza o cabeçalho com a data do dump;
   - divergente → **não sobrescrevo**: gravo `<nome>.LIVE_<data>.sql` ao lado, registro o diff no md, e o Bob decide qual é a verdade;
   - função do arquivo não existe mais no banco → registro; arquivo fica com nota "não encontrado no dump de <data>".
   Nomes atuais (`reserve_credit.sql` etc.) são mantidos; os novos ganham prefixo de schema só quando não for `public`.
3. **Triggers:** `db/triggers/<schema>.<tabela>.<tgname>.sql` com o `CREATE TRIGGER` exato e um comentário apontando o arquivo da função.
   Cruzar com os `CREATE TRIGGER` já espalhados em `migrations/` e registrar divergências (mesmo nome, definição diferente).
4. **Policies:** um arquivo por tabela com `ALTER TABLE … ENABLE ROW LEVEL SECURITY` (se ligado) + todas as `CREATE POLICY`
   reconstruídas a partir de `permissive/roles/cmd/qual/with_check`. Aviso honesto: `CREATE POLICY` reconstruído de
   `pg_policies` é equivalente, não byte-a-byte — o cabeçalho diz isso.
5. **`db/INVENTARIO_2026-09-21.md`:** índice de tudo (objeto → arquivo), os achados de I-4 (tabelas sem RLS, RLS sem
   policy, funções sem uso, triggers desabilitadas) como **lista para decisão**, sem ação.
6. Commit único: `db: espelhos de funcoes, triggers e policies (inventario de <data>)` — após OK do Bob no md de fechamento.

## 5. Regras

- Nenhum objeto do banco é criado, alterado ou removido neste bloco. Só leitura + arquivos no repo.
- Nada de "consertar" achados de I-4 aqui: viram fila, cada um com OK próprio.
- Divergência entre espelho existente e corpo vivo nunca é resolvida por mim: registro e pergunto.
- A lição do 3(b) entra no padrão: policies que citam outra tabela ficam anotadas no arquivo da tabela (`-- depende de: <tabela>`).

## 6. Decisões pedidas ao Bob

1. OK para o escopo (funções `public`+`audit`, triggers, policies) e para a estrutura `db/functions|triggers|policies/`?
2. OK para rodar os 7 blocos do `.sql` e trazer as saídas (texto/CSV)?
3. Quer o 3(c)-bis (DDL de tabelas: colunas, índices, constraints) no mesmo ciclo ou depois?

## 7. Decisões do Bob (22/09/2026)

1. **Escopo e estrutura: OK** como proposto — funções `public`+`audit`, triggers, policies; `db/functions|triggers|policies/`;
   `db/INVENTARIO_<data>.md` com os achados do I-4 como **fila de decisão** (sem ação).
2. **Rodar os 7 blocos: OK** — o Bob roda `BLOCO3_C_INVENTARIO_BANCO_2026-09-21.sql` e traz as saídas em texto,
   fatiadas se o I-1b estourar o editor.
3. **3(c)-bis (DDL de tabelas): DEPOIS**, como ciclo próprio se se mostrar necessário. Este lote fica em
   funções/triggers/policies — "onde a mordida aconteceu quatro vezes".

Próximo passo meu, ao receber as saídas: conferência de completude (§4.1) → espelhos → diff dos 6 existentes →
`db/INVENTARIO_2026-09-xx.md` → md de fechamento para o OK do commit.
