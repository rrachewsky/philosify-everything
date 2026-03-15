-- Panel analysis history (for philosopher panel results in Music, Literature, News)
-- Stores metadata for history display. Full analysis text stored in KV.

CREATE TABLE IF NOT EXISTS panel_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    panel_id TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('music', 'literature', 'news')),
    title TEXT NOT NULL,
    artist TEXT,
    philosophers TEXT[] NOT NULL,
    lang TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE panel_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own panel analyses"
    ON panel_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can insert panel analyses"
    ON panel_analyses FOR INSERT
    WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_panel_analyses_user ON panel_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_panel_analyses_created ON panel_analyses(created_at DESC);

-- Grant service role access
GRANT ALL ON panel_analyses TO service_role;
GRANT SELECT ON panel_analyses TO authenticated;
