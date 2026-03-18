-- PHILOSIFY CINEMA - DATABASE MIGRATION
-- Creates: films, film_analyses, user_film_analysis_requests
-- Mirrors literature_tables.sql structure

-- FILMS: Film catalog with TMDB metadata
CREATE TABLE IF NOT EXISTS public.films (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  director TEXT NOT NULL,
  tmdb_id TEXT UNIQUE,
  imdb_id TEXT,
  overview TEXT,
  poster_url TEXT,
  release_year INTEGER,
  genres TEXT[],
  runtime_minutes INTEGER,
  production_countries TEXT[],
  original_language TEXT,
  tagline TEXT,
  vote_average NUMERIC(3,1),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.films IS 'Film catalog with TMDB metadata';

CREATE INDEX IF NOT EXISTS idx_films_tmdb_id ON public.films(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_films_title_director ON public.films(title, director);

-- FILM_ANALYSES: Philosophical evaluations of films
CREATE TABLE IF NOT EXISTS public.film_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  film_id UUID NOT NULL REFERENCES public.films(id),
  language TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT DEFAULT '3.0',
  ethics_score NUMERIC(4,2),
  metaphysics_score NUMERIC(4,2),
  epistemology_score NUMERIC(4,2),
  politics_score NUMERIC(4,2),
  aesthetics_score NUMERIC(4,2),
  final_score NUMERIC(4,2),
  philosophical_analysis TEXT,
  summary TEXT,
  ethics_analysis TEXT,
  metaphysics_analysis TEXT,
  epistemology_analysis TEXT,
  politics_analysis TEXT,
  aesthetics_analysis TEXT,
  classification TEXT,
  philosophical_note TEXT,
  historical_context TEXT,
  creative_process TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.film_analyses IS 'Philosophical evaluations of films (one per film+language+model)';

CREATE UNIQUE INDEX IF NOT EXISTS unique_film_analysis_by_model
  ON public.film_analyses(film_id, language, model)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_film_analyses_film_id ON public.film_analyses(film_id);
CREATE INDEX IF NOT EXISTS idx_film_analyses_model ON public.film_analyses(model);

-- USER_FILM_ANALYSIS_REQUESTS: Audit trail (who paid for what)
CREATE TABLE IF NOT EXISTS public.user_film_analysis_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_analysis_id UUID NOT NULL REFERENCES public.film_analyses(id),
  title TEXT,          -- Denormalized for quick history queries
  director TEXT,       -- Denormalized for quick history queries
  metadata JSONB,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.user_film_analysis_requests IS 'Audit trail linking users to film analyses they accessed';

CREATE INDEX IF NOT EXISTS idx_user_film_requests_user_id ON public.user_film_analysis_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_film_requests_analysis_id ON public.user_film_analysis_requests(film_analysis_id);

-- RLS: Enable Row Level Security
ALTER TABLE public.films ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.film_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_film_analysis_requests ENABLE ROW LEVEL SECURITY;

-- Films: public catalog
CREATE POLICY "Anyone can view films"
  ON public.films FOR SELECT
  USING (true);

CREATE POLICY "Service role full access on films"
  ON public.films FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Film analyses: users only see what they paid for
CREATE POLICY "Users can view paid film analyses"
  ON public.film_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_film_analysis_requests
      WHERE public.user_film_analysis_requests.film_analysis_id = public.film_analyses.id
      AND public.user_film_analysis_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on film_analyses"
  ON public.film_analyses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User film analysis requests: users see own requests
CREATE POLICY "Users can view own film requests"
  ON public.user_film_analysis_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on user_film_analysis_requests"
  ON public.user_film_analysis_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- GRANTS
GRANT SELECT ON public.films TO authenticated, anon;
GRANT SELECT ON public.film_analyses TO authenticated, anon;
GRANT ALL ON public.films TO service_role;
GRANT ALL ON public.film_analyses TO service_role;
GRANT ALL ON public.user_film_analysis_requests TO service_role;

-- RPC: Log film analysis request (for history tracking)
CREATE OR REPLACE FUNCTION public.log_film_analysis_request(
  p_user_id UUID,
  p_film_analysis_id UUID,
  p_title TEXT DEFAULT NULL,
  p_director TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_film_analysis_requests (user_id, film_analysis_id, title, director, metadata)
  VALUES (p_user_id, p_film_analysis_id, p_title, p_director, p_metadata)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_film_analysis_request TO authenticated, service_role;

SELECT 'Cinema tables created successfully' as status;
