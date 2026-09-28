-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.admin_grant_credits(p_user_id uuid, p_amount integer, p_type transaction_type, p_reason text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, new_total integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_new_total INTEGER;
BEGIN
  IF p_type NOT IN ('refund', 'promo') THEN
    RETURN QUERY SELECT false, 0, 'Invalid type - use refund or promo'::TEXT;
    RETURN;
  END IF;

  IF p_amount <= 0 THEN
    RETURN QUERY SELECT false, 0, 'Amount must be positive'::TEXT;
    RETURN;
  END IF;

  UPDATE public.credits
  SET purchased = purchased + p_amount, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING (purchased + free_remaining) INTO v_new_total;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  INSERT INTO public.credit_history (user_id, type, amount)
  VALUES (p_user_id, p_type, p_amount);

  RETURN QUERY SELECT true, v_new_total, NULL::TEXT;
END;
$function$
