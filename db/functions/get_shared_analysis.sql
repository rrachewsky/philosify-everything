-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 0 trigger(s) (I-1a).
-- ATENCAO: corpo vivo tem literais de string quebrados em duas linhas (ex.: 'Share link not\n  found'). E assim que esta no banco; as mensagens de erro saem com quebra de linha.

CREATE OR REPLACE FUNCTION public.get_shared_analysis(p_slug character varying, p_viewer_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(success boolean, analysis_id uuid, expired boolean, max_views_reached boolean, error_message text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
  DECLARE
    v_token RECORD;
    v_expired BOOLEAN :=
  FALSE;
    v_max_views_reached
  BOOLEAN := FALSE;
  BEGIN
    SELECT * INTO v_token FROM
   share_tokens WHERE slug =
  p_slug FOR UPDATE;

    IF NOT FOUND THEN
      RETURN QUERY SELECT
  FALSE, NULL::UUID, FALSE,
  FALSE, 'Share link not
  found'::TEXT;
      RETURN;
    END IF;

    IF v_token.expires_at IS
  NOT NULL AND
  v_token.expires_at < NOW()
  THEN
      v_expired := TRUE;
      RETURN QUERY SELECT
  FALSE, NULL::UUID, TRUE,
  FALSE, 'Share link
  expired'::TEXT;
      RETURN;
    END IF;

    IF v_token.max_views IS
  NOT NULL AND
  v_token.views_count >=
  v_token.max_views THEN
      v_max_views_reached :=
  TRUE;
      RETURN QUERY SELECT
  FALSE, NULL::UUID, FALSE,
  TRUE, 'Max views
  reached'::TEXT;
      RETURN;
    END IF;

    UPDATE share_tokens SET
  views_count = views_count +
  1, updated_at = NOW() WHERE
  slug = p_slug;

    RETURN QUERY SELECT TRUE,
  v_token.analysis_id, FALSE,
  FALSE, NULL::TEXT;

  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT
  FALSE, NULL::UUID, FALSE,
  FALSE, SQLERRM::TEXT;
  END;
  $function$
