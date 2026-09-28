-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.process_stripe_payment(p_stripe_session_id character varying, p_stripe_price_id character varying, p_user_id uuid, p_credits integer, p_event_type character varying DEFAULT 'checkout.session.completed'::character varying, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(success boolean, already_processed boolean, transaction_id uuid, new_balance integer, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_webhook_exists BOOLEAN;
  v_webhook_status VARCHAR(20);
  v_purchased INTEGER;
  v_free INTEGER;
  v_total INTEGER;
  v_transaction_id UUID;
BEGIN
  SELECT EXISTS(SELECT 1 FROM webhooks WHERE stripe_session_id = p_stripe_session_id),
         (SELECT status FROM webhooks WHERE stripe_session_id = p_stripe_session_id)
  INTO v_webhook_exists, v_webhook_status;

  IF v_webhook_exists THEN
    IF v_webhook_status = 'completed' OR v_webhook_status = 'processed' THEN
      SELECT total INTO v_total FROM credits WHERE user_id = p_user_id;
      RETURN QUERY SELECT TRUE, TRUE, NULL::UUID, COALESCE(v_total, 0), NULL::TEXT;
      RETURN;
    ELSIF v_webhook_status = 'processing' THEN
      RETURN QUERY SELECT FALSE, TRUE, NULL::UUID, 0, 'Already processing'::TEXT;
      RETURN;
    END IF;
  END IF;

  INSERT INTO webhooks (
    stripe_session_id,
    stripe_price_id,
    event_type,
    user_id,
    status,
    metadata
  ) VALUES (
    p_stripe_session_id,
    p_stripe_price_id,
    p_event_type,
    p_user_id,
    'processing',
    p_metadata
  )
  ON CONFLICT (stripe_session_id) DO UPDATE
  SET status = 'processing',
      attempts = webhooks.attempts + 1;

  INSERT INTO credits (user_id, purchased, free_remaining)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT purchased, free_remaining, total
  INTO v_purchased, v_free, v_total
  FROM credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_purchased IS NULL THEN
    v_purchased := 0;
    v_free := 0;
    v_total := 0;
  END IF;

  UPDATE credits
  SET purchased = purchased + p_credits,
      updated_at = NOW()
  WHERE user_id = p_user_id;

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
    stripe_price_id,
    status,
    metadata
  ) VALUES (
    p_user_id,
    'purchase',
    p_credits,
    v_purchased,
    v_purchased + p_credits,
    v_free,
    v_free,
    v_total,
    v_total + p_credits,
    p_stripe_session_id,
    p_stripe_price_id,
    'completed',
    p_metadata
  ) RETURNING id INTO v_transaction_id;

  UPDATE webhooks
  SET status = 'completed',
      credits_granted = p_credits,
      transaction_id = v_transaction_id,
      processed_at = NOW()
  WHERE stripe_session_id = p_stripe_session_id;

  RETURN QUERY SELECT TRUE, FALSE, v_transaction_id, v_total + p_credits, NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    UPDATE webhooks
    SET status = 'failed',
        error_message = SQLERRM
    WHERE stripe_session_id = p_stripe_session_id;

    RETURN QUERY SELECT FALSE, FALSE, NULL::UUID, 0, SQLERRM::TEXT;
END;
$function$
