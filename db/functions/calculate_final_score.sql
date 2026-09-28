-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.calculate_final_score(p_metaphysics integer, p_epistemology integer, p_ethics integer, p_politics integer, p_aesthetics integer)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
    v_m DECIMAL := (p_metaphysics - 50) / 5.0;
    v_e DECIMAL := (p_epistemology - 50) / 5.0;
    v_eth DECIMAL := (p_ethics - 50) / 5.0;
    v_p DECIMAL := (p_politics - 50) / 5.0;
    v_a DECIMAL := (p_aesthetics - 50) / 5.0;
    v_score DECIMAL;
BEGIN
    -- Aplicar pesos
    v_score := (v_eth * 0.40) + (v_m * 0.20) + (v_e * 0.20) + (v_p * 0.10) + (v_a * 0.10);

    -- Bônus de diagonal
    IF v_eth > 0 AND v_e > 0 THEN
        v_score := v_score + (LEAST(v_eth, v_e) * 0.2);
    END IF;

    -- Limitar entre -10 e +10
    RETURN GREATEST(-10, LEAST(10, ROUND(v_score, 2)));
END;
$function$
