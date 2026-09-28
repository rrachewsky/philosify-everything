-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.create_share_token(p_analysis_id uuid, p_user_id uuid, p_slug character varying)
 RETURNS TABLE(id uuid, slug character varying, success boolean, error_message text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_token_id UUID;
  v_slug VARCHAR(10);
BEGIN
  -- Check if analysis exists
  IF NOT EXISTS (SELECT 1 FROM analyses WHERE analyses.id = p_analysis_id) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(10), FALSE, 'Analysis not found'::TEXT;
    RETURN;
  END IF;

  -- Create share token
  INSERT INTO share_tokens (slug, analysis_id, created_by_user_id)
  VALUES (p_slug, p_analysis_id, p_user_id)
  RETURNING share_tokens.id, share_tokens.slug INTO v_token_id, v_slug;

  -- Fixed: Added explicit column aliases to avoid ambiguous column reference
  RETURN QUERY SELECT v_token_id AS id, v_slug AS slug, TRUE AS success, NULL::TEXT AS error_message;

EXCEPTION
  WHEN unique_violation THEN
    -- Slug collision - caller should retry with new slug
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(10), FALSE, 'Slug collision'::TEXT;
  WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(10), FALSE, SQLERRM::TEXT;
END;
$function$
