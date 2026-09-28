-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada so em SQL/migrations do repo. Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.process_stripe_refund(p_stripe_session_id character varying, p_refund_amount numeric, p_original_credits integer, p_partial boolean DEFAULT false)
 RETURNS TABLE(success boolean, credits_deducted integer, went_negative boolean, error_message text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_purchased INTEGER;
  v_free INTEGER;
  v_total INTEGER;
  v_credits_to_deduct INTEGER;
  v_went_negative BOOLEAN := FALSE;
BEGIN
  -- Find user from original transaction
  SELECT user_id INTO v_user_id
  FROM webhooks
  WHERE stripe_session_id = p_stripe_session_id;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, FALSE, 'Original transaction not found'::TEXT;
    RETURN;
  END IF;

  -- Calculate credits to deduct
  IF p_partial THEN
    -- Partial refund: proportional credits
    v_credits_to_deduct := FLOOR(p_original_credits * p_refund_amount / 100.0);
  ELSE
    -- Full refund: all credits
    v_credits_to_deduct := p_original_credits;
  END IF;

  -- Lock and get current balance
  SELECT purchased, free_remaining, total
  INTO v_purchased, v_free, v_total
  FROM credits
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- Deduct from purchased credits only (don't touch free credits)
  IF v_purchased >= v_credits_to_deduct THEN
    -- Can deduct fully
    UPDATE credits
    SET purchased = purchased - v_credits_to_deduct,
        updated_at = NOW()
    WHERE user_id = v_user_id;
  ELSE
    -- Not enough purchased credits - deduct what we can, mark as negative scenario
    UPDATE credits
    SET purchased = 0,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    v_went_negative := TRUE;
  END IF;

  -- Log refund transaction in credit_history
  INSERT INTO credit_history (
    user_id,
    type,
    amount,
    purchased_before,
    purchased_after,
    free_before,
    free_after,
    total_before,
    total_after,
    stripe_session_id,
    status,
    metadata
  ) VALUES (
    v_user_id,
    'refund',
    -v_credits_to_deduct,
    v_purchased,
    GREATEST(0, v_purchased - v_credits_to_deduct),
    v_free,
    v_free,
    v_total,
    GREATEST(v_free, v_total - v_credits_to_deduct),
    p_stripe_session_id,
    'completed',
    jsonb_build_object(
      'partial', p_partial,
      'refund_amount', p_refund_amount,
      'went_negative', v_went_negative
    )
  );

  RETURN QUERY SELECT TRUE, v_credits_to_deduct, v_went_negative, NULL::TEXT;
END;
$function$
