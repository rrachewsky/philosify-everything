-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.search_songs(search_query text, search_language text DEFAULT 'en'::text, limit_count integer DEFAULT 20)
 RETURNS TABLE(id uuid, title text, artist text, album text, spotify_id text, spotify_album_cover_url text, final_score numeric, classification text, similarity real)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.artist,
    s.album,
    s.spotify_id,
    s.spotify_album_cover_url,
    a.final_score,
    a.classification,
    GREATEST(
      extensions.similarity(s.title, search_query),
      extensions.similarity(s.artist, search_query)
    ) AS similarity
  FROM public.songs s
  LEFT JOIN public.analyses a
    ON a.song_id = s.id
   AND a.language = search_language
   AND a.status = 'published'
  WHERE s.status = 'published'
    AND (
      s.title ILIKE '%' || search_query || '%'
      OR s.artist ILIKE '%' || search_query || '%'
    )
  ORDER BY similarity DESC, a.final_score DESC NULLS LAST
  LIMIT LEAST(COALESCE(limit_count, 20), 50);
END;
$function$
