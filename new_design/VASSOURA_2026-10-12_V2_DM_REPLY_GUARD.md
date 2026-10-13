# VASSOURA · V2 · guarda `validate_dm_reply_target` ausente no banco — análise + migração gated

**Status:** V2a ANÁLISE pronta · 12/10/2026 · veredito: **a guarda ainda faz sentido, restaurar** · SQL de pré-flight para o Bob · migração (V2b) **gated** pelo pré-flight e pelo OK · nada no banco.
**Fila:** inventário de 22/09 (`db/INVENTARIO_2026-09-22.md:182,189`): versionado no repo, ausente no banco.

---

## 1. O que a guarda valida e por quê (V2a)

Fonte: `database/DM_REPLY_CONVERSATION_GUARD_MIGRATION.sql` (no repo desde o commit inicial de 08/03/2026; nunca aparece em dump).

- **Função** `public.validate_dm_reply_target_same_conversation()` — `SECURITY DEFINER`, `search_path = ''`, nomes qualificados. Se `NEW.reply_to_id IS NULL` passa. Senão busca `conversation_id` da mensagem referida: inexistente → `RAISE 'reply_to_id references a non-existent message'`; de outra conversa → `RAISE 'reply_to_id must reference a message in the same conversation'`.
- **Trigger** `validate_dm_reply_target_trigger` — `BEFORE INSERT OR UPDATE OF reply_to_id, conversation_id ON public.direct_messages FOR EACH ROW`.
- **Motivo declarado no arquivo:** a API já valida; a trigger impede o contorno por SQL direto/service role e protege contra regressão futura do handler. Defesa em profundidade.

## 2. O DM de hoje ainda espera essa validação?

| Pergunta | Resposta | Evidência |
|---|---|---|
| A coluna `reply_to_id` existe? | Sim | `dm.js:385` seleciona `reply_to_id` de `direct_messages`; `broadcast_dm_inserted.sql:15-41` (espelho vivo de 22/09) lê `NEW.reply_to_id` |
| O cliente envia? | Sim | `useDM.js:148-150` manda `replyToId: options.replyToId \|\| replyingTo?.id`; `dm.js:596` lê `body.reply_to_id` |
| A API valida a mesma coisa? | Sim, só no INSERT | `dm.js:599-611`: UUID + `GET direct_messages?id=eq.X&conversation_id=eq.Y` antes de gravar |
| O conserto de 29/09 mudou o desenho de reply? | Não | `DM_REMETENTE_DIAGNOSTICO_2026-09-29.md` trata de decifrar a própria mensagem (`replyPreview` segue igual); `dm.js` não tem commit desde 15/04 |
| Caminhos que contornam a API? | Sim | o worker grava com **service role** (`pg()` em `utils/pg.js`), e o inventário (`:243`) registra que a policy de INSERT de `direct_messages` deixa qualquer autenticado inserir em qualquer `conversation_id`. Nenhum UPDATE de `reply_to_id` é validado em lugar algum |

**Veredito:** o desenho não mudou, a coluna e o fluxo existem, a API valida só o INSERT e só no caminho do handler. A guarda cobre UPDATE e qualquer escrita fora do handler. **Restaurar conforme o espelho**, sem alteração de texto.

Triggers em `direct_messages` hoje (dump de 22/09, confirmado no pré-flight de 12/10): `archive_direct_message_trigger` é **BEFORE DELETE** (correção do Bob: o rascunho dizia AFTER; evento diferente, sem interação com a guarda), `broadcast_dm_delete_trigger`, `broadcast_dm_edit_trigger` e `broadcast_dm_insert_trigger` são AFTER. A guarda é BEFORE INSERT/UPDATE: um RAISE aborta a escrita antes de qualquer broadcast. Sem conflito.

## 3. Pré-flight — SQL para o Bob rodar (somente leitura)

```sql
-- V2 PRÉ-FLIGHT (somente leitura). Colar as 4 saídas no chat.

-- (1) Trigger e função ausentes?  (esperado: 0 e 0)
SELECT (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
         WHERE c.relname = 'direct_messages' AND t.tgname = 'validate_dm_reply_target_trigger') AS trigger_existe,
       (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname = 'validate_dm_reply_target_same_conversation') AS funcao_existe;

-- (2) Coluna presente?  (esperado: 1 linha, uuid, nullable)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'direct_messages' AND column_name IN ('reply_to_id', 'conversation_id');

-- (3) Linhas já existentes que a guarda rejeitaria (esperado: 0 e 0; se > 0, decidir antes de criar a trigger)
SELECT count(*) FILTER (WHERE r.id IS NULL)                                   AS reply_para_inexistente,
       count(*) FILTER (WHERE r.id IS NOT NULL AND r.conversation_id IS DISTINCT FROM m.conversation_id) AS reply_de_outra_conversa,
       count(*)                                                                AS total_com_reply
FROM public.direct_messages m
LEFT JOIN public.direct_messages r ON r.id = m.reply_to_id
WHERE m.reply_to_id IS NOT NULL;

-- (4) Triggers atuais da tabela (para o registro)
SELECT t.tgname, pg_get_triggerdef(t.oid)
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'direct_messages' AND NOT t.tgisinternal ORDER BY t.tgname;
```

## 4. Migração (V2b) — gated: só com (1) = 0/0, (2) presente, (3) = 0/0 e o seu OK

Texto **verbatim** de `database/DM_REPLY_CONVERSATION_GUARD_MIGRATION.sql`, envolto em transação e com verificação:

```sql
BEGIN;

CREATE OR REPLACE FUNCTION public.validate_dm_reply_target_same_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reply_conversation_id UUID;
BEGIN
  IF NEW.reply_to_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT dm.conversation_id
  INTO v_reply_conversation_id
  FROM public.direct_messages dm
  WHERE dm.id = NEW.reply_to_id;

  IF v_reply_conversation_id IS NULL THEN
    RAISE EXCEPTION 'reply_to_id references a non-existent message';
  END IF;

  IF v_reply_conversation_id IS DISTINCT FROM NEW.conversation_id THEN
    RAISE EXCEPTION 'reply_to_id must reference a message in the same conversation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_dm_reply_target_trigger ON public.direct_messages;

CREATE TRIGGER validate_dm_reply_target_trigger
  BEFORE INSERT OR UPDATE OF reply_to_id, conversation_id
  ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_dm_reply_target_same_conversation();

-- Verificação (esperado: 1 linha BEFORE … e secdef = true)
SELECT t.tgname, pg_get_triggerdef(t.oid) AS definicao, p.prosecdef AS secdef
FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'direct_messages' AND t.tgname = 'validate_dm_reply_target_trigger';

COMMIT;  -- ou ROLLBACK;
```

Nota: a função fica com o ACL padrão de `CREATE FUNCTION` (EXECUTE para PUBLIC). Para trigger isso é irrelevante (quem executa é o próprio gatilho), mas, se quiser alinhar à decisão de 06/10 (`confirm_reservation`: só `postgres` + `service_role`), acrescente antes do COMMIT: `REVOKE EXECUTE ON FUNCTION public.validate_dm_reply_target_same_conversation() FROM PUBLIC;`. Proponho **incluir**.

## 5. Prova funcional (após o COMMIT) — tudo desfeito por ROLLBACK

```sql
-- V2b PROVA: reply válida passa; reply de outra conversa é rejeitada; reply inexistente é rejeitada. ROLLBACK no fim.
BEGIN;
DO $$
DECLARE
  a  public.direct_messages%ROWTYPE;   -- mensagem de uma conversa
  b  public.direct_messages%ROWTYPE;   -- mensagem de OUTRA conversa
  v_id uuid;
BEGIN
  SELECT * INTO a FROM public.direct_messages ORDER BY created_at DESC LIMIT 1;
  SELECT * INTO b FROM public.direct_messages WHERE conversation_id <> a.conversation_id ORDER BY created_at DESC LIMIT 1;
  IF a.id IS NULL OR b.id IS NULL THEN RAISE EXCEPTION 'preciso de mensagens em 2 conversas distintas'; END IF;

  -- 1. válida: responde a uma mensagem da MESMA conversa
  INSERT INTO public.direct_messages (sender_id, recipient_id, conversation_id, message, reply_to_id)
  VALUES (a.sender_id, a.recipient_id, a.conversation_id, 'prova V2b válida', a.id) RETURNING id INTO v_id;
  RAISE NOTICE '1/3 reply na mesma conversa: inserida (%)', v_id;

  -- 2. inválida: responde a mensagem de OUTRA conversa
  BEGIN
    INSERT INTO public.direct_messages (sender_id, recipient_id, conversation_id, message, reply_to_id)
    VALUES (a.sender_id, a.recipient_id, a.conversation_id, 'prova V2b inválida', b.id);
    RAISE EXCEPTION 'FALHA: reply de outra conversa foi aceita';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%same conversation%' THEN
      RAISE NOTICE '2/3 reply de outra conversa: rejeitada (%)', SQLERRM;
    ELSE RAISE; END IF;
  END;

  -- 3. inválida: reply para id inexistente
  BEGIN
    INSERT INTO public.direct_messages (sender_id, recipient_id, conversation_id, message, reply_to_id)
    VALUES (a.sender_id, a.recipient_id, a.conversation_id, 'prova V2b inexistente', gen_random_uuid());
    RAISE EXCEPTION 'FALHA: reply inexistente foi aceita';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE '%non-existent%' THEN
      RAISE NOTICE '3/3 reply inexistente: rejeitada (%)', SQLERRM;
    ELSE RAISE; END IF;
  END;
END $$;
ROLLBACK;  -- nada fica; os 3 NOTICEs são a prova
```

Se `direct_messages` exigir outras colunas NOT NULL no INSERT (ex. `message_type`), a prova falha nomeando a coluna; me devolva a mensagem e eu ajusto.

## 6. Depois (V2c)

- Espelhos novos: `db/functions/validate_dm_reply_target_same_conversation.sql` e `db/triggers/public.direct_messages.validate_dm_reply_target_trigger.sql` (texto do banco, data da aplicação). `database/DM_REPLY_CONVERSATION_GUARD_MIGRATION.sql` ganha cabeçalho "APLICADA em 12/10/2026" e fica como história.
- Inventário `:182,189`: **RESOLVIDO 12/10**.
- Commit: `dm: guarda de reply restaurada no banco`.

## 7. Registro

| Passo | Data | Resultado |
|---|---|---|
| V2a análise + SQL | 12/10 | este arquivo; veredito: restaurar |
| Pré-flight rodado pelo Bob | — | — |
| OK do Bob no V2b (+ REVOKE?) | 13/10 | aprovado: restaurar verbatim COM o REVOKE EXECUTE FROM PUBLIC antes do COMMIT |
| Migração + verificação | — | — |
| Prova funcional | — | — |
| V2c espelhos + inventário + commit | — | — |
