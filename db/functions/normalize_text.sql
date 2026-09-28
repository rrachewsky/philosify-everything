-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 0 trigger(s) (I-1a).
-- ATENCAO: o export markdown do SQL Editor escapa barras; "\\s" foi lido como "\s". Confirmar no banco antes de reaplicar.

CREATE OR REPLACE FUNCTION public.normalize_text(text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN lower(
    regexp_replace(
      translate(text,
        'áàâãäåāăąèéêëēĕėęěìíîïīĭįıòóôõöøōŏőùúûüūŭůűųñçćčĉċďđĝğġģĥħĵķĺļľŀłńņňŉŋŕŗřśŝşšţťŧŵŷýÿźżž',
        'aaaaaaaaaeeeeeeeeeiiiiiiiioooooooooouuuuuuuuuncccccdđgggghhĵķlllllnnnnŋrrrssssţttŵyyyzzzz'
      ),
      '[^a-z0-9\s]', '', 'g'
    )
  );
END;
$function$
