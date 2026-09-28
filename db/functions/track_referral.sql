-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 0 trigger(s) (I-1a).
-- ATENCAO: corpo vivo tem literais de string quebrados em duas linhas (ex.: 'Share link not\n  found'). E assim que esta no banco; as mensagens de erro saem com quebra de linha.

CREATE OR REPLACE FUNCTION public.track_referral(p_slug character varying, p_new_user_id uuid, p_bonus_credits integer DEFAULT 0)
 RETURNS TABLE(success boolean, referrer_user_id uuid, already_referred boolean, error_message text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
  DECLARE
    v_referrer_id UUID;
    v_already_referred BOOLEAN
   := FALSE;
  BEGIN
    SELECT
  st.created_by_user_id INTO
  v_referrer_id FROM
  share_tokens st WHERE
  st.slug = p_slug;

    IF v_referrer_id IS NULL
  THEN
      RETURN QUERY SELECT
  FALSE, NULL::UUID, FALSE,
  'Share link not
  found'::TEXT;
      RETURN;
    END IF;

    IF v_referrer_id =
  p_new_user_id THEN
      RETURN QUERY SELECT
  FALSE, v_referrer_id, FALSE,
   'Cannot refer
  yourself'::TEXT;
      RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM
  referrals WHERE
  referred_user_id =
  p_new_user_id AND
  share_token_slug = p_slug)
  THEN
      v_already_referred :=
  TRUE;
      RETURN QUERY SELECT
  TRUE, v_referrer_id, TRUE,
  NULL::TEXT;
      RETURN;
    END IF;

    INSERT INTO referrals
  (referrer_user_id,
  referred_user_id,
  share_token_slug,
  bonus_credits_granted)
    VALUES (v_referrer_id,
  p_new_user_id, p_slug, 0);

    RETURN QUERY SELECT TRUE,
  v_referrer_id, FALSE,
  NULL::TEXT;

  EXCEPTION
    WHEN unique_violation THEN
      RETURN QUERY SELECT
  TRUE, v_referrer_id, TRUE,
  NULL::TEXT;
    WHEN OTHERS THEN
      RETURN QUERY SELECT
  FALSE, v_referrer_id, FALSE,
   SQLERRM::TEXT;
  END;
  $function$
