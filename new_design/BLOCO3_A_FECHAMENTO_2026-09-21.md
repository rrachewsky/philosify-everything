# Bloco 3(a) — AuthProvider único · fechamento · 21/09/2026

**Aceite do Bob (20/09):** T3 (login por e-mail/senha) verificado em produção — loading só no formulário do modal,
header trocou para e-mail/saldo sem F5, redirect correto após o login. Com os 7 cenários obrigatórios já verdes
(T1, T2, T5, T6, T7, T10, T11), o bloco foi aceito. Ordem: commit único → push → hash.

## Commit

| Item | Valor |
|---|---|
| Hash | **`59a8ec6`** (`59a8ec6167010751cd2e47900239982eccb472d3`) |
| Base | `233d9e7` (fechamento do Bloco 2) |
| Branch | `redesign/v2` — `origin/redesign/v2` aponta para ele (push confirmado por `git fetch`) |
| Autoria | Bob Rach, sem atribuição de IA (conferido no commit) |
| Mensagem | `auth: provider unico (uma sessao e um token por carga)` |
| Tamanho | 12 arquivos, +2657 −405 |
| Working tree após o push | limpo (exceto este relatório, gerado depois) |

### Conteúdo do commit

| Grupo | Arquivos |
|---|---|
| Site — código (4) | `site/src/contexts/AuthContext.jsx` (novo, +422: máquina de estado como `useAuthState()` + `AuthProvider`), `site/src/hooks/useAuth.js` (−405: vira consumidor do contexto, `loading`/`error` por instância), `site/src/contexts/index.js` (+2: exporta `AuthProvider` e `AuthContext`), `site/src/main.jsx` (árvore `LanguageProvider > AuthProvider > CreditsProvider > Router`) |
| Documentação — Bloco 3(a) | `BLOCO3_A_AUTH_PROVIDER_2026-09-19.md` (relatório técnico, diff embutido), `BLOCO3_A_AUTH_PROVIDER_2026-09-19.patch`, `BLOCO3_A_REPORT_SUPERVISOR_2026-09-20.md` |
| Documentação — Bloco 2 | `BLOCO2_FECHAMENTO_2026-09-19.md` — estava untracked desde o fechamento anterior; entrou neste commit como "relatórios" |
| Capturas | `printscreen_bloco3a_2026-09-19/` — 01 (T1 comunidade logado), 02 (T11 quiz logado), 03 (T2 landing deslogado), 04 (T11 quiz deslogado) |

## Produção (já no ar desde 20/09, sem novo deploy neste fechamento)

| Alvo | Id |
|---|---|
| Pages Production | `691468b1-1b7a-42ed-8003-83256f305528` — philosify.org serve `index-3zFarSkC.js` |
| Worker `philosify-api-production` | não tocado (mudança 100% frontend); segue em `c6ac9ed4-0443-4b5c-b178-eaea5cfe01fc` |
| Rollback | redeploy do deployment `1a5adb74-9650-4123-8cde-bd960dd8b961` (bundle `index-B8BIBVET.js`), um comando, sem migração |

## Resultado medido (carga fria de `/community`, logado)

| Request | Antes | Depois |
|---|---|---|
| `GET /auth/session` | 8 | **1** |
| `GET /auth/realtime-token` | 8 | **1** |
| Checagem de sessão no retorno de aba | 8 | **1** |

## Testes — estado final

| # | Cenário | Resultado |
|---|---|---|
| T1, T2, T5, T6, T7, T10, T11 | obrigatórios | ✅ (sessão de 20/09, ver report do supervisor) |
| T3 | Login e-mail/senha | ✅ **Bob, 20/09** — loading só no form, header sem F5, redirect correto |
| T4 | Login Google | não executado (opcional) |
| T8/T9 | Expiração de token / cookie >1 h | observação passiva, sem ocorrência registrada |
| T12 | Fluxos de senha | não executado (opcional) |
| T13 | Pagamento | sem compra no ciclo |

## Pendências abertas

- Este relatório de fechamento está **untracked**; commit só com ordem.
- Fila fora do bloco (herdada do report do supervisor):
  - `useCinemaSidebar.js:18` desestrutura `refreshBalance` do `useAuth`, campo que nunca existiu (limpeza).
  - `useDM` dispara `GET /api/dm/conversations` 2× por carga da Comunidade (candidato ao mesmo padrão de provider).
- Post `09aca247…` da conta Roberto no Underground (pendência do Bloco 2, apagar da sessão dela).

## Próximo passo

Bloco 3(b): remoção do caminho morto do Coletivo — proposta antes de qualquer mudança, OK dedicado.
