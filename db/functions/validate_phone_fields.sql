-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 1 trigger(s) (I-1a).
-- ATENCAO: o export markdown do SQL Editor escapa barras; "\\d" foi lido como "\d". Confirmar no banco antes de reaplicar.

CREATE OR REPLACE FUNCTION public.validate_phone_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If any phone field is set, country_code must be set
  IF (NEW.phone_area_code IS NOT NULL OR NEW.phone_number IS NOT NULL)
     AND NEW.phone_country_code IS NULL THEN
    RAISE EXCEPTION 'phone_country_code is required when phone number is provided';
  END IF;
  -- If phone_number is set, it must contain only digits
  IF NEW.phone_number IS NOT NULL AND NEW.phone_number !~ '^\d+$' THEN
    RAISE EXCEPTION 'phone_number must contain only digits';
  END IF;
  -- Country code must start with + and contain digits
  IF NEW.phone_country_code IS NOT NULL AND NEW.phone_country_code !~ '^\+\d{1,4}$' THEN
    RAISE EXCEPTION 'phone_country_code must be in format +N (e.g. +1, +55, +44)';
  END IF;
  -- Area code must be digits only if provided
  IF NEW.phone_area_code IS NOT NULL AND NEW.phone_area_code !~ '^\d{1,5}$' THEN
    RAISE EXCEPTION 'phone_area_code must contain only digits (1-5 digits)';
  END IF;
  RETURN NEW;
END;
$function$
