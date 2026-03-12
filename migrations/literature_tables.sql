-- PHILOSIFY LITERATURE - DATABASE MIGRATION
-- Creates: books, book_analyses, user_book_analysis_requests

-- BOOKS: Book catalog with Google Books metadata
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  google_books_id TEXT UNIQUE,
  isbn TEXT,
  description TEXT,
  cover_url TEXT,
  published_date TEXT,
  categories TEXT[],
  page_count INTEGER,
  publisher TEXT,
  language TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE books IS 'Book catalog with Google Books metadata';

CREATE INDEX IF NOT EXISTS idx_books_google_books_id ON books(google_books_id);
CREATE INDEX IF NOT EXISTS idx_books_title_author ON books(title, author);

-- BOOK_ANALYSES: Philosophical evaluations of books
CREATE TABLE IF NOT EXISTS book_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id),
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

COMMENT ON TABLE book_analyses IS 'Philosophical evaluations of books (one per book+language+model)';

CREATE UNIQUE INDEX IF NOT EXISTS unique_book_analysis_by_model
  ON book_analyses(book_id, language, model)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_book_analyses_book_id ON book_analyses(book_id);
CREATE INDEX IF NOT EXISTS idx_book_analyses_model ON book_analyses(model);

-- USER_BOOK_ANALYSIS_REQUESTS: Audit trail (who paid for what)
CREATE TABLE IF NOT EXISTS user_book_analysis_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_analysis_id UUID NOT NULL REFERENCES book_analyses(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_book_analysis_requests IS 'Audit trail linking users to book analyses they accessed';

CREATE INDEX IF NOT EXISTS idx_user_book_requests_user_id ON user_book_analysis_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_book_requests_analysis_id ON user_book_analysis_requests(book_analysis_id);

-- RLS: Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_book_analysis_requests ENABLE ROW LEVEL SECURITY;

-- Books: public catalog
CREATE POLICY "Anyone can view books"
  ON books FOR SELECT
  USING (true);

CREATE POLICY "Service role full access on books"
  ON books FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Book analyses: users only see what they paid for
CREATE POLICY "Users can view paid book analyses"
  ON book_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_book_analysis_requests
      WHERE user_book_analysis_requests.book_analysis_id = book_analyses.id
      AND user_book_analysis_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on book_analyses"
  ON book_analyses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User book analysis requests: users see own requests
CREATE POLICY "Users can view own book requests"
  ON user_book_analysis_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on user_book_analysis_requests"
  ON user_book_analysis_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- GRANTS
GRANT SELECT ON books TO authenticated, anon;
GRANT SELECT ON book_analyses TO authenticated, anon;
GRANT ALL ON books TO service_role;
GRANT ALL ON book_analyses TO service_role;
GRANT ALL ON user_book_analysis_requests TO service_role;

-- RPC: Log book analysis request
CREATE OR REPLACE FUNCTION log_book_analysis_request(
  p_user_id UUID,
  p_book_analysis_id UUID,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_book_analysis_requests (user_id, book_analysis_id, metadata)
  VALUES (p_user_id, p_book_analysis_id, p_metadata)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Literature tables created successfully' as status;
