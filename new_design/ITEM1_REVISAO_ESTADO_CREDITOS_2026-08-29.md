# Pacote Pré-Privacy — ITEM 1: Revisão pré-OK (estado da sessão e créditos)

**Data:** 2026-08-29
**Contexto:** resposta às perguntas de revisão do Bob sobre o diff proposto do ITEM 1 (exclusão de sessões da Zona Insegura). Nada aplicado; diff continua aguardando OK.
**Inclui:** proposta de **adendo ao diff** (tratamento de 404 no front) surgida desta análise.

---

## 1. Onde vive o estado de uma sessão ativa da Zona Insegura — caminho completo

| Onde | O que contém | O DELETE toca? |
|---|---|---|
| **Supabase — `unsafe_zone_sessions`** | A **única** persistência server-side. Transcrição inteira na linha (JSONB `messages`), status, turn_count. | **Sim — é o alvo do DELETE físico.** |
| **KV (`PHILOSIFY_KV`)** | Apenas o guia `guide-unsafe-zone`, leitura a cada turno (`api/src/handlers/unsafe-zone.js:294`). Zero estado de conversa. | Nada a tocar. |
| **Durable Objects** | **Não existem** no projeto (nenhum binding em `api/wrangler.toml`). | Nada a tocar. |
| **Memória do worker** | **Nenhum estado de módulo** no handler: cada POST recria o client Anthropic (`unsafe-zone.js:325`) e relê a sessão do banco (`unsafe-zone.js:212-243`). Handler 100% stateless entre requests. | Nada a tocar. |
| **Anthropic — prompt cache `ephemeral`** | Cache de inferência do lado deles (TTL ~5 min; `unsafe-zone.js:341-366`). Transparente: só "acerta" se o cliente reenviar exatamente o mesmo prefixo; não é estado consultável e não injeta contexto sozinho. Retenção da Anthropic é pendência já registrada no levantamento (PRIVACY_V2_LEVANTAMENTO §2c). | Fora do nosso alcance por design. |
| **Front — React state da aba** | `sessionId`, `messages`, `turn`, `turnsRemaining` em memória (`site/src/pages/v2/UnsafeZonePage.jsx:91-95`). | **Sim, na aba que apagou** — o diff reseta o console nos dois fluxos (apagar-por-id quando é a sessão aberta, e apagar-tudo). |
| **Front — sessionStorage** | Apenas o **rascunho não enviado** (`DRAFT_KEY`, `UnsafeZonePage.jsx:255`). Não é conversa. | Não (deliberado: o usuário pode estar prestes a fazer uma pergunta nova). |

### Por que a sessão ativa não continua respondendo após "apagar tudo"

O contexto enviado à IA vem do **body do cliente**, mas a sessão é **revalidada no banco antes de billing e antes de qualquer chamada de IA**:

- Aba stale (outro dispositivo/aba com a conversa em memória) envia com `sessionId` apagado → lookup `id=eq.X&user_id=eq.Y` não encontra → **404 e retorno imediato** (`unsafe-zone.js:227-229`). A requisição morre **antes** da chamada à Anthropic. Não existe caminho em que o servidor responda com contexto de conversa apagada.
- Aba stale com `sessionId` nulo → lookup por `user_id+status=eq.active` não acha nada → nasce sessão **nova e vazia** (cobrando os 10 créditos de início, como qualquer sessão nova).
- A aba que executou o delete → console resetado pelo próprio diff.

### Lacuna de UX encontrada + ADENDO proposto ao diff

Hoje o `sendMessage` do front trata 401/402/400-"no longer active"/429, mas **404 cai no erro genérico** — a aba stale continuaria **exibindo** a conversa apagada (só dela, em memória local; nada volta do servidor). Adendo proposto, no `sendMessage` de `UnsafeZonePage.jsx`, junto dos handlers de status existentes (mesmo padrão do caso 400-"no longer active"):

```diff
+        if (response.status === 404) {
+          // Session was deleted elsewhere — official state is gone; reset, keep the draft
+          setSessionId(null);
+          setMessages([]);
+          setTurn(0);
+          setTurnsRemaining(INITIAL_TURNS);
+          setInput(savedInput);
+          setError(null);
+          return;
+        }
```

Com isso, a aba stale se limpa na primeira interação. **Aguarda OK junto com o diff principal.**

---

## 2. Créditos — o diff não toca em nada de crédito

- Os dois handlers novos executam **apenas** `DELETE em unsafe_zone_sessions`. Zero escrita em `credits`, `credit_history` ou `credit_reservations` — nenhum refund, nenhum estorno, nenhuma "desconfirmação".
- Créditos consumidos foram **confirmados no momento da resposta da IA** (`confirmReservation`, `unsafe-zone.js:445-448`); apagar a sessão depois não altera o consumo já registrado.
- **Sem cascata:** nenhuma tabela tem FK apontando para `unsafe_zone_sessions` (a transcrição é JSONB na própria linha; a referência nas reservas é **textual** — `description = "unsafe-zone:start:<id>"`). O DELETE não dispara efeito colateral em nenhuma outra tabela.
- **Consequência de produto para validação explícita do Bob:** apagar uma sessão **ativa** no meio de um bloco pago (ex.: pagou 10 créditos, usou 3 turnos) **perde os turnos restantes, sem reembolso** — exatamente o contrato que o `DELETE /conversation` atual já pratica; o diff só estende esse mesmo contrato para "por id" e "todas".

---

## Estado do ITEM 1

- Diff principal (4 partes: handler, rotas, página v2, CSS) + 5 chaves i18n × 18 línguas: **apresentado, aguardando OK.**
- Adendo 404 (acima): **aguardando OK.**
- Nada aplicado; nenhum commit.
