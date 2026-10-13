-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.forum_replies · tgenabled = 'O' (O = habilitada) · funcao: db/functions/update_thread_reply_stats.sql
-- Cruzamento com o repo (28/09): nenhum CREATE TRIGGER versionado para esta trigger. So existia no banco.
-- 12/10/2026 (VASSOURA V1): esta e a UNICA trigger de forum_replies. A gemea trigger_update_thread_stats
-- (oid 137391, a original; esta, oid 142867, foi colada depois) foi DROPADA pelo Bob no SQL Editor e os contadores
-- forum_threads.reply_count foram recalculados pela contagem real na mesma transacao (384 threads: 282 iguais,
-- 86 em dobro exato, 16 mistas; somas 712 -> 608). Verificacao: triggers_restantes=1, divergentes=0. Prova funcional
-- (INSERT +1 exato, DELETE devolve, ROLLBACK) OK. Relatorio: new_design/VASSOURA_2026-10-12_V1_FORUM_REPLY_COUNT.md.
-- Sobreviveu a trigger cujo nome e o da funcao (decisao do Bob, 13/10).

CREATE TRIGGER trg_update_thread_reply_stats AFTER INSERT OR DELETE ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION update_thread_reply_stats();
