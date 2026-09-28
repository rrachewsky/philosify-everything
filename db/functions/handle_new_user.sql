-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 1 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  BEGIN
    -- Create profile (with display_name from auth metadata)
    INSERT INTO public.profiles (user_id, email, display_name, preferred_language)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.email
      ),
      COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    )
    ON CONFLICT (user_id) DO UPDATE SET
      display_name = COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.email
      ),
      updated_at = NOW();

    -- Create credits record (2 free credits for new users)
    INSERT INTO public.credits (user_id, purchased, free_remaining)
    VALUES (NEW.id, 0, 2)
    ON CONFLICT (user_id) DO NOTHING;

    -- Log signup bonus
    INSERT INTO public.credit_history (
      user_id,
      type,
      amount,
      purchased_before, purchased_after,
      free_before, free_after,
      total_before, total_after,
      status
    ) VALUES (
      NEW.id,
      'signup_bonus',
      2,
      0, 0,
      0, 2,
      0, 2,
      'completed'
    );

    RETURN NEW;
  END;
  $function$
