# Bloco 2 — miúdos de UI · fechamento · 19/09/2026

**Aceite do Bob (19/09):** os 6 itens verificados em produção, incluindo a bandeira de reporte nos dois sentidos
(próprio post sem, post alheio com) e o timeout da conta Roberto resolvido (janela com bundle antigo; sonda ok).
Ordem: commit único → push → hash → apagar os posts de teste do Underground.

## Commit

| Item | Valor |
|---|---|
| Hash | **`233d9e7`** |
| Branch | `redesign/v2` — `origin/redesign/v2` aponta para ele (push confirmado por `git fetch`) |
| Autoria | Bob Rach, sem atribuição de IA (conferido no commit) |
| Mensagem | `bloco 2: miudos de ui (isown, saldo do header, apelido, testes i18n, autofill, markdown dos vereditos)` |
| Tamanho | 41 arquivos, +1859 −33 |
| Working tree após o push | limpo |

### Conteúdo do commit

| Grupo | Arquivos |
|---|---|
| API | `api/src/handlers/underground.js` (isOwn no GET do feed), `api/src/utils/i18n-errors.test.js` (allow-list nomeada + `MIN_LENGTH` por escrita) |
| Site — componentes/hooks | `SpaceLock.jsx`, `PanelAnalysisCards.jsx`, `UndergroundFeed.jsx`, `useColloquium.js`, `useCredits.js`, `ColloquiumDetail.jsx`, `DebateDetail.jsx`, `services/api/underground.js` |
| Site — estilos | `v2-pages/auth.css` (autofill escuro), `v2-pages/ideas.css` (`.vprose`) |
| Site — novo | `site/src/utils/markdownLite.js` (renderer único, mesmo DOMPurify das análises) |
| Traduções | 18 × `site/src/i18n/translations/<xx>.json` — chave `community.underground.nicknameInvalid` |
| Documentação | `BLOCO2_MIUDOS_UI_2026-09-18.md` (proposta + execução + adendo), `BLOCO2_MIUDOS_UI_2026-09-18.patch`, `UNDERGROUND_TIMEOUT_CONTA_ROBERTO_2026-09-19.md` |
| Capturas | `printscreen_bloco2_2026-09-18/` — 01 e 02 (saldo do header), 03 e 04 (apelido PT/EN), 05 e 06 (veredito), 07 (próprio post sem reportar) |

## Produção (já no ar desde 18/09, sem novo deploy neste fechamento)

| Alvo | Id |
|---|---|
| Pages Production | `1a5adb74-9650-4123-8cde-bd960dd8b961` — philosify.org serve `index-B8BIBVET.js` |
| Worker `philosify-api-production` | versão `c6ac9ed4-0443-4b5c-b178-eaea5cfe01fc` a 100% |

## Limpeza dos posts de teste do Underground

Feita pela sessão do Bob (`theproducer`), via `DELETE /api/underground/:id`:

| Post | Autor | Criado em | Resultado |
|---|---|---|---|
| `057dacb1…` | theproducer (Bob, 19/09 19:07 UTC) | 2026-09-19 | **apagado** (200, `success:true`) |
| `6d0a80b7…` | theproducer (Bob, post de teste de 18/09) | 2026-09-18 | **apagado** (200, `success:true`) |
| `09aca247…` | theproducer1 (conta Roberto) | 2026-09-19 | **não apagado** — o endpoint só aceita o dono; apagar da sessão da Roberto, pelo Delete no próprio post |

Feed após a limpeza: 1 post (o da Roberto).

## Timeout da conta Roberto (encerrado pelo Bob)

Causa confirmada pela sonda da §5 do diagnóstico: janela com **bundle anterior a 15/09** (`cache:'default'`)
presa no lock do cache HTTP do Chrome — o cenário de 14/09. Resolvido fechando/recarregando a janela. O diff
diagnóstico da §6 (Workers Logs + tempos por passo no GET do feed) **não foi aplicado**: não havia caso de servidor.

## Pendências abertas

- Post `09aca247…` da conta Roberto no Underground (apagar da sessão dela).
- Este relatório de fechamento está **untracked**; commit só com ordem.
