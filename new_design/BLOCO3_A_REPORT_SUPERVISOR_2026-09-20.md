# Bloco 3(a) — AuthProvider único · Relatório para supervisão

**Data:** 20/09/2026 · **Responsável:** Bob Rach · **Branch:** `redesign/v2` · **Base:** `233d9e7`
**Status:** deployado em produção, testes obrigatórios verdes, **aguardando T3 (login por senha) e aceite para commit**.

---

## 1. Resumo executivo

O hook de autenticação do site (`useAuth`) era uma máquina de estado completa por instância. Com 46 consumidores, uma carga da página Comunidade disparava **8 chamadas de sessão e 8 de token de realtime**, e cada retorno à aba do navegador repetia as 8 checagens. A mudança move a máquina de estado para um `AuthProvider` único, montado uma vez na raiz, e transforma o hook em consumidor do contexto. Resultado medido em produção: **1 sessão e 1 token por carga** (redução de 8×), **1 checagem por retorno de aba** (era 8). Nenhum consumidor foi alterado; a API pública do hook foi preservada campo a campo. Zero erros novos de lint, build ok, sem regressão observada em 7 cenários de teste.

## 2. O que mudou (4 arquivos, +481 / −405)

| Arquivo | Mudança |
|---|---|
| `site/src/contexts/AuthContext.jsx` (novo) | Recebe o corpo do antigo hook como `useAuthState()` e expõe `AuthProvider` |
| `site/src/hooks/useAuth.js` | Vira consumidor do contexto; mantém `loading`/`error` **por instância** (um login no modal não faz as páginas com gate em `authLoading` piscarem) |
| `site/src/contexts/index.js` | Exporta `AuthProvider` e `AuthContext` |
| `site/src/main.jsx` | Árvore: `LanguageProvider > AuthProvider > CreditsProvider > Router` |

Três ajustes mecânicos exigidos pelo lint do repositório (regras do React Compiler), sem mudança de comportamento: recursão do token via `ref`, efeito sobre `user` substituído por `applyUser` no ponto de definição, dependências explícitas em cinco callbacks.

## 3. Evidência

**Medição (Network da extensão do Chrome, filtro `api.philosify.org`, carga fria de `/community`, logado, repetida 2×):**

| Request | Antes (19/09) | Depois (20/09) |
|---|---|---|
| `GET /auth/session` | 8 | **1** |
| `GET /auth/realtime-token` | 8 | **1** |
| `GET /api/dm/conversations` | 2 | 2 (fora do escopo, registrado na fila) |

**Plano de teste (13 cenários; 7 obrigatórios executados):**

| # | Cenário | Resultado |
|---|---|---|
| T1 | Carga fria logado | ✅ 1 + 1; header com e-mail e saldo; console limpo |
| T2 | Carga deslogado | ✅ 1 sessão (user nulo), 0 token; header "Entrar / Cadastrar" |
| T5 | Logout | ✅ 1 `signout` + 1 rechecagem; sem loop nos 6 s seguintes |
| T6 | F5 logado | ✅ igual a T1, sessão preservada |
| T7 | Retorno de aba | ✅ **1** checagem de sessão (era 8), nenhum token novo |
| T10 | Header nos 18 idiomas | ✅ e-mail/saldo corretos em todos; nenhuma chamada de auth extra por troca |
| T11 | Páginas com gate (`/ideas`, `/quiz`, `/payment-success`) | ✅ logado e deslogado, sem skeleton eterno, sem flash de "deslogado" |
| T3 | Login e-mail/senha | ⏳ requer credenciais (Bob) |
| T4 | Login Google | ⏳ opcional (Bob) |
| T8/T9 | Expiração de token / cookie >1 h | passivo, não observado neste ciclo |
| T12 | Fluxos de senha | ⏳ se necessário (Bob) |
| T13 | Pagamento | — sem compra no ciclo |

Capturas: `new_design/printscreen_bloco3a_2026-09-19/` (4 imagens).
Relatório técnico completo, com diff embutido: `new_design/BLOCO3_A_AUTH_PROVIDER_2026-09-19.md` (+ `.patch`).

## 4. Deploy e rollback

- **Pages** `philosify-frontend`, `--branch=production`, deployment `691468b1-1b7a-42ed-8003-83256f305528`; bundle `index-3zFarSkC.js` confirmado servido em philosify.org.
- **Worker:** não tocado (mudança 100% frontend).
- **Rollback:** redeploy do deployment anterior `1a5adb74-9650-4123-8cde-bd960dd8b961` (bundle `index-B8BIBVET.js`). Um comando, sem migração.
- **Estado do repo:** mudança aplicada no working tree, **não commitada** (aguarda aceite). Commit previsto: `auth: provider unico (uma sessao e um token por carga)`.

## 5. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| `loading`/`error` virarem globais e fazer páginas piscarem | Hook mantém pending/error locais por instância (`wrap`); T11 confirma sem flash |
| Provider fora da árvore em algum ponto | `useAuth` lança erro explícito se usado fora do `AuthProvider`; nenhum caso encontrado (46 consumidores dentro do Router) |
| Regressão em login/senha | T3/T12 pendentes com o Bob antes do commit |
| Regressão na expiração de token / refresh de cookie | Lógica idêntica à anterior, só movida; T8/T9 de observação passiva |

## 6. Pendências e fila

- **Antes do commit:** T3 (login por senha) pelo Bob; T12 opcional; aceite.
- **Fila registrada (fora deste bloco):**
  - `useCinemaSidebar.js:18` desestrutura `refreshBalance` do `useAuth`, campo que nunca existiu (limpeza).
  - `useDM` dispara `GET /api/dm/conversations` 2× por carga da Comunidade (candidato ao mesmo padrão de provider).
- **Próximas etapas do Bloco 3** (cada uma com OK dedicado): (b) remoção do caminho morto do Coletivo; (c) exportação dos objetos do banco ainda fora do repo; (d) revisão dos padrões amplos do `.gitignore`; (e) marquee do Top 50 e flicker de auth no primeiro paint.
