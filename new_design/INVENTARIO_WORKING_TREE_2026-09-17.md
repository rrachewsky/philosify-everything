# Inventário do working tree antes da próxima frente · 17/09/2026

**Pedido do Bob:** (1) origem de cada um dos 6 arquivos de código modificados — congelar se for Bloco aplicado sem OK;
(2) untracked de `docs/` e `new_design/`, com commit imediato do canônico PT se estiver fora do repo; (3) destino de
cada item restante. **Nada aplicado, nada commitado, nada movido.** Branch `redesign/v2`, HEAD `68e99f5` = remoto.

## 1. Os "6 arquivos de código modificados" — não existem mais como modificação

O `git status` de hoje **não mostra nenhum arquivo modificado**. A lista dos 6 vinha do snapshot de abertura da sessão
(15/09), anterior a dois commits já aprovados. Rastreio por `git log -1 -- <arquivo>`:

| Arquivo | Commit que absorveu a modificação | Tarefa | OK do Bob |
|---|---|---|---|
| `api/src/utils/response.js` | `8907601` (15/09) "layout do coletivo ocupa o viewport; api sem cache http (no-store) e timeout no underground" | Ciclo do layout do Coletivo + no-store + timeout do underground (relatórios `LAYOUT_DISCUSSAO_COLETIVO_2026-09-14`, `UNDERGROUND_CHROME_CARREGANDO_2026-09-14`, `RELATORIO_CONSOLIDADO_COLETIVO_2026-09-14`, todos nesse commit) | sim — é o "commit-base, já no remoto" citado em `COMPOSER_COLETIVO_EXECUCAO_2026-09-15.md` |
| `site/src/hooks/useUnderground.js` | `8907601` | idem (timeout do underground) | sim |
| `site/src/services/api/dm.js` | `8907601` | idem (no-store) | sim |
| `site/src/services/api/underground.js` | `8907601` | idem (no-store + timeout) | sim |
| `site/src/styles/v2-pages/community-panels.css` | `8907601` e depois `c8ecd9c` (16/09) "composer do coletivo: rodape fixo do painel, textarea limitado ao painel, card cede" | Layout do Coletivo, depois composer | sim — "ACEITE do Bob no composer — critério binário cumprido" (16/09) |
| `site/src/styles/v2-pages/community.css` | `8907601` e `c8ecd9c` | idem | sim |

Nenhum dos seis pertence a um bloco aplicado sem OK. Não há "Bloco 2" como termo nos relatórios: a numeração que existe
é Bloco 3 (limpeza do caminho morto do chat, registrado, não executado) e Bloco 3a/4 no postmortem de 06/09. **Nada a
congelar; não há diff pendente em `site/` nem em `api/`.**

## 2. Untracked de `docs/` e `new_design/`

**Canônico PT:** `docs/philosify-metodologia-canonical-PT.md` está **tracked desde `92d7aae`** (commit da Etapa 2 da
Metodologia, 16/09), junto com `METODOLOGIA_ETAPA1_MAPEAMENTO_2026-09-01.md`. A página publicada tem o canônico no repo.
Sem commit a propor.

Os demais untracked do snapshot também já entraram: os três relatórios do Coletivo de 14/09 e a pasta
`printscreen_layout_discussao_2026-09-14` estão em `8907601`; o aceite da Metodologia e suas 9 capturas em `71a74c7`.

Restam **6 itens** untracked (nenhum ignorado pelo `.gitignore`):

| # | Item | Data | O que é |
|---|---|---|---|
| a | `docs/SW2621333312.pdf` | 07/09 | **Declaração fiscal trimestral de terceiro** (formulário estadual dos EUA com razão social, número de contribuinte e endereço de uma empresa que não é o Philosify). Nada a ver com o projeto; repo é público. |
| b | `docs/LAUNCH_READINESS_REPORT.md` | 26/08 | Relatório de QA de lançamento (361 linhas), autoria Codex, cobre Philosify e Ads Atelier. |
| c | `docs/MARKET_LAUNCH_PLAN.md` | 26/08 | Plano de lançamento ao mercado (1031 linhas), Codex, fases usuários → patrocinadores → investidores. |
| d | `new_design/COMMIT_CONSOLIDADO_CICLO_STAGING_2026-09-02.md` | 03/09 | Plano de staging do ciclo dos e-mails minimalistas, executado em `1b05e51` (02/09). O relatório-irmão de 31/08 (`COMMIT_CONSOLIDADO_MODO_A_2026-08-31.md`) está commitado. |
| e | `new_design/philosify-modules-review.html` | 30/07 | Revisão de módulos lado a lado, HTML autocontido de 1,9 MB, anterior ao cutover v2. |
| f | `new_design/printscreen 01/` | 03/08 | 40 PNG (3,3 MB): 29 capturas genéricas "Captura de tela 2026-08-03 …", 11 em espanhol, mais um `icon-512.png`. Nenhum relatório as cita como evidência (as menções existentes são só as listas "fora do commit" de 31/08 e 02/09). |

Os itens b, c, e, f já foram deixados fora deliberadamente em dois ciclos (31/08 e 02/09) como "não relacionados".

## 3. Destino proposto (para OK; nada executado)

| # | Item | Proposta | Motivo |
|---|---|---|---|
| a | `docs/SW2621333312.pdf` | **Ignorar e tirar do diretório do repo** (mover para fora; eu faço com OK, ou o Bob) | Dado fiscal de terceiro em repo público. Nunca commitar. Não entra em `.gitignore` por nome, pra não deixar rastro do documento no repo. |
| b | `docs/LAUNCH_READINESS_REPORT.md` | **Aguardar decisão do Bob** entre commit próprio ("docs: relatorio de prontidao de lancamento, 26/08") e mover para fora | Documento vivo de planejamento ou rascunho superado? Cobre também Ads Atelier; só o Bob sabe se esse conteúdo pode ir a público. Se for commitar, os dois (b e c) vão juntos num commit só. |
| c | `docs/MARKET_LAUNCH_PLAN.md` | idem b | idem |
| d | `COMMIT_CONSOLIDADO_CICLO_STAGING_2026-09-02.md` | **Commit próprio** — "docs: plano de staging do ciclo de 02/09" | Fecha o registro do ciclo já commitado em `1b05e51`, no mesmo padrão do plano de 31/08 que está no repo. Custo zero. |
| e | `philosify-modules-review.html` | **Ignorar (mover para fora ou apagar, com OK)** | Artefato de 30/07, pré-cutover, 1,9 MB; não é referência de nada em uso. |
| f | `printscreen 01/` | **Ignorar (mover para fora ou apagar, com OK)** | Capturas avulsas de 03/08 sem relatório que as use; 3,3 MB. Diferente de `printscreen 02 ticker-mobile/`, que entrou como evidência nomeada. |

Se o Bob aprovar d e o "mover para fora" de a/e/f, o working tree fica com apenas b e c até a decisão dele.

## 4. Verificação

- `git status --short`: 0 modificados, 6 untracked (listados acima).
- `git ls-files --error-unmatch docs/philosify-metodologia-canonical-PT.md`: tracked (`92d7aae`).
- Commits desde `eac229e`: `8907601`, `c8ecd9c`, `92d7aae`, `ed4cccb`, `71a74c7`, `68e99f5` — só os dois primeiros e o
  terceiro tocam código; os três últimos são docs.
