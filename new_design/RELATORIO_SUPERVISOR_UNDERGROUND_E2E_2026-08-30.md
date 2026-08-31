# Underground E2E — Correções pós-deploy e validação de produção

**Data:** 2026-08-30
**Autor:** Bob Rach
**Escopo:** lançamento do Underground com criptografia ponta-a-ponta obrigatória (pacote pré-privacy, item 5) e a remediação dos achados do smoke de produção.
**Status geral:** todos os achados diagnosticados por causa raiz e corrigidos; **quatro correções deployadas** em dois ciclos; **validação final do smoke em andamento**. **Sem impacto financeiro.** Nenhum commit até o smoke fechar (correções vivas em produção via deploy direto, revertíveis).

---

## 1. Sumário executivo

O Underground passou a exigir E2E obrigatório (sala nasce cifrada; a chave da sala vive só nos navegadores dos membros; o servidor é cego ao conteúdo). Após o deploy inicial, um smoke de produção com duas contas revelou **quatro achados** — dois de infraestrutura de fronteira e dois bloqueadores de fluxo. Cada um foi diagnosticado com evidência de log/SQL e apontamento de `arquivo:linha`, corrigido com diff mínimo e publicado. Um quinto ponto (impacto financeiro) foi investigado e **descartado**. A validação de ponta a ponta do fluxo (fundar sala → distribuir chave → publicar cifrado → denunciar) está sendo refeita agora sobre as correções.

---

## 2. Achados e correções

| # | Achado | Severidade | Causa raiz | Correção | Situação |
|---|--------|-----------|-----------|----------|----------|
| 1 | CSP recusa worker de `blob:` no front | Média | CSP sem `worker-src`/`child-src` → cai no `script-src` (sem `blob:`) | `worker-src 'self' blob:` no CSP | ✅ deployado |
| 2 | `GET /api/underground` retornou 500 | Alta | Leitura de metadados da sala sem proteção derrubava o feed inteiro; catch sem stack (500 opaco) | Leitura de meta não-fatal (degrada para "sala não iniciada") + stack no log | ✅ deployado; **não reincidiu** |
| 3 | Publicar post retornou 500 (determinístico) | **Crítica** (bloqueador) | Coluna `underground_posts.content` seguia `NOT NULL`, mas o post E2E grava `content = null` (texto cifrado vai em `encrypted_content`) | Migração: `content` agora aceita nulo | ✅ aplicado |
| 4 | Novo membro barrado no unlock (409 KEYPAIR_REQUIRED) | **Crítica** (bloqueador) | Registro da chave pública pulava o servidor: ter chave local não implicava registro em `user_public_keys` | Cliente sempre registra (idempotente) + servidor faz upsert sem inflar versão | ✅ deployado |
| — | Impacto financeiro (créditos presos/cobrança) | — | O fluxo morreu **antes** de qualquer caminho de crédito | Nada a corrigir | ✅ **descartado por SQL** |
| — | "Sala nasceu sem falha de invariante?" | — | Sala fundada legitimamente por um membro (vencedor sobrescreveu uma cópia órfã da era anterior) | Nada a corrigir | ✅ confirmado íntegro |

### Detalhe dos bloqueadores (achados 3 e 4)

**Achado 3 — schema.** O desenho E2E é correto: o servidor nunca vê o texto (`content = null`, cifra em `encrypted_content`). A migração de lançamento criou as tabelas novas mas não relaxou a restrição herdada de `content`. Como a tabela estava vazia (0 posts), a restrição nunca havia sido exercida com nulo — só apareceu no primeiro post real do smoke. Correção segura e sem perda de dados.

**Achado 4 — registro de chave.** O unlock do Underground exige, por desenho, uma chave pública registrada no servidor (para embrulhar a chave da sala ao novo membro). A função do cliente retornava cedo quando já havia par de chaves **local**, sem garantir o registro **no servidor** — deixando contas de era anterior (ou de tentativa cuja gravação falhou em silêncio) permanentemente barradas, sem auto-recuperação. Três camadas de tratamento de erro engolido mascaravam a falha. A correção torna o registro sempre efetivo e idempotente; contas afetadas se recuperam sozinhas no próximo acesso/unlock.

---

## 3. Impacto financeiro — descartado

Verificação em banco: **zero cobranças** e **zero reservas novas** nas contas do smoke; saldos intactos. Todos os 500 ocorreram **antes** de qualquer reserva/confirmação de crédito (o fluxo de crédito vive no unlock, não na listagem nem na criação de post). O conserto anterior do mecanismo de liberação de crédito (27–29/08) segue validado à parte. **Nenhum crédito preso, nenhuma cobrança indevida.**

---

## 4. Deploys e verificação

Dois ciclos de correção, cada um com dry-run do worker + build do site antes de publicar:

| Ciclo | Correções | Worker (versão) | Site (deployment) |
|-------|-----------|-----------------|-------------------|
| A | Achados 1 e 2 | `a52504e2` | `941d8644` |
| B | Achados 3 e 4 | `9c8f110f` (atual) | `e0357075` (atual) |

**Confirmação nos artefatos (não só no código-fonte):**
- CSP `worker-src 'self' blob:` presente no header servido na borda.
- Bundle do worker contém os logs com stack, a nova chave de erro localizada (18 idiomas) e a lógica de registro idempotente.
- Bundle do site contém o módulo de criptografia/unlock corrigido (as strings de log de depuração são removidas no build de produção — comportamento esperado).

---

## 5. Pendências e próximos passos

1. **Smoke final (em andamento):** revalidar o fluxo completo sobre as correções — fundar sala, registro real de chave pública (`[Crypto] Public key registered…`), distribuição aos pendentes, publicação cifrada e denúncia. Monitoramento de produção ativo durante o teste.
2. **Commit consolidado:** um único commit das correções + documentação do incidente **após** o smoke passar (mantém o histórico limpo e verificado).
3. **Follow-ups menores (não bloqueiam):** localizar também a chave de erro do 500 de listagem (mesma família, sem tradução); confirmação dos painéis do Sentry.
4. **Cadeia da Privacy v2:** segue independente (declaração de moderação/denúncia com texto legível voluntário; idiomas).

---

## 6. Risco e reversão

- **Reversão do worker:** um comando (volta à versão anterior).
- **Reversão do site:** promover o deployment anterior.
- **Migração (achado 3):** relaxar uma restrição é aditivo e não requer reversão; é inerte para o código antigo.
- **Superfície de risco das correções:** baixa — todas ampliam o que já era permitido ou tornam idempotente um caminho existente; nenhuma altera regra de crédito, autenticação ou pagamento.

---

## 7. Método (garantias de qualidade)

- Cada achado foi confirmado por **evidência primária** (log de produção ao vivo e/ou SQL), não por suposição; a causa raiz aponta `arquivo:linha`.
- Diffs apresentados e aprovados **um a um** antes de aplicar; nada foi improvisado.
- **Lacunas de conhecimento foram declaradas honestamente** em vez de encobertas (ex.: onde a leitura estática não fechava a causa, o conserto incluiu o diagnóstico — stack no log — para fechá-la na reincidência).
- Sem commit e sem "big bang": correções pequenas, deployadas e observadas em produção uma de cada vez.
