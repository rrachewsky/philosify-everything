-- ============================================================
-- CONSTELLATION OF IDEAS - PHASE 2 SCHEMA
-- Automatic Graph Enrichment from Philosify Analyses
-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================

-- ============================================================
-- NEW TABLES
-- ============================================================

-- Links between Philosify analyses and constellation nodes
-- This is the bridge: "Analysis X mentions Philosopher Y"
CREATE TABLE IF NOT EXISTS constellation_analysis_links (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id     UUID NOT NULL,                -- ID from the source analysis table
  analysis_type   TEXT NOT NULL CHECK (analysis_type IN (
    'music', 'literature', 'cinema', 'news'
  )),
  node_id         TEXT NOT NULL,                -- References constellation_nodes.id (text IDs like 'aristotle')
  mention_type    TEXT NOT NULL CHECK (mention_type IN (
    'direct_reference',       -- philosopher named explicitly
    'concept_invocation',     -- philosophical concept used without naming philosopher
    'historical_parallel',    -- historical event referenced as parallel
    'causal_chain',           -- analysis draws causal connection through this philosopher
    'opposition_cited',       -- philosopher's ideas cited as counter-example
    'influence_noted'         -- analysis notes this philosopher's influence on the subject
  )),
  evidence_text   TEXT NOT NULL,              -- the exact passage from the analysis
  confidence      REAL NOT NULL DEFAULT 0.8,  -- 0.0 to 1.0
  extraction_tier TEXT NOT NULL CHECK (extraction_tier IN ('rule_based', 'llm')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (analysis_id, analysis_type, node_id, mention_type)
);

-- Edge candidates discovered from analyses (before verification/merge)
CREATE TABLE IF NOT EXISTS constellation_edge_candidates (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_node_id    TEXT NOT NULL,              -- References constellation seed node id
  target_node_id    TEXT NOT NULL,              -- References constellation seed node id
  relationship_type TEXT NOT NULL,
  primary_battle    TEXT,
  weight            REAL NOT NULL DEFAULT 0.5,
  description       TEXT NOT NULL,
  evidence_text     TEXT NOT NULL,              -- passage that suggested this edge
  analysis_id       UUID NOT NULL,
  analysis_type     TEXT NOT NULL,
  extraction_tier   TEXT NOT NULL,
  confidence        REAL NOT NULL DEFAULT 0.7,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- awaiting review/auto-merge
    'merged',       -- merged into constellation_edges
    'rejected'      -- false positive, discarded
  )),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Node candidates: philosophers/thinkers discovered in analyses that aren't in seed data
CREATE TABLE IF NOT EXISTS constellation_node_candidates (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                TEXT NOT NULL,
  canonical_name      TEXT NOT NULL,           -- lowercase normalized
  birth_year          INTEGER,
  birth_city          TEXT,
  birth_country       TEXT,
  tradition           TEXT,
  school_of_thought   TEXT,
  evidence_text       TEXT NOT NULL,           -- passage where this thinker was found
  analysis_id         UUID NOT NULL,
  analysis_type       TEXT NOT NULL,
  extraction_tier     TEXT NOT NULL,
  confidence          REAL NOT NULL DEFAULT 0.6,
  mention_count       INTEGER DEFAULT 1,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',        -- not yet reviewed
    'promoted',       -- promoted to constellation_nodes
    'rejected'        -- false positive or not significant enough
  )),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (canonical_name)
);

-- Extraction tracking: which analyses have been processed by which tier
CREATE TABLE IF NOT EXISTS constellation_extraction_log (
  analysis_id     UUID NOT NULL,
  analysis_type   TEXT NOT NULL,
  extraction_tier TEXT NOT NULL CHECK (extraction_tier IN ('rule_based', 'llm')),
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN (
    'completed', 'failed', 'skipped'
  )),
  extracted_at    TIMESTAMPTZ DEFAULT NOW(),
  concepts_found  INTEGER DEFAULT 0,
  edges_found     INTEGER DEFAULT 0,
  error_message   TEXT,
  PRIMARY KEY (analysis_id, analysis_type, extraction_tier)
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE constellation_analysis_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE constellation_edge_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE constellation_node_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE constellation_extraction_log ENABLE ROW LEVEL SECURITY;

-- Public read for links (educational), service write
DROP POLICY IF EXISTS "analysis_links_public_read" ON constellation_analysis_links;
CREATE POLICY "analysis_links_public_read" ON constellation_analysis_links 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "analysis_links_service_write" ON constellation_analysis_links;
CREATE POLICY "analysis_links_service_write" ON constellation_analysis_links 
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "edge_candidates_service_only" ON constellation_edge_candidates;
CREATE POLICY "edge_candidates_service_only" ON constellation_edge_candidates 
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "node_candidates_service_only" ON constellation_node_candidates;
CREATE POLICY "node_candidates_service_only" ON constellation_node_candidates 
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "extraction_log_service_only" ON constellation_extraction_log;
CREATE POLICY "extraction_log_service_only" ON constellation_extraction_log 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_analysis_links_node ON constellation_analysis_links(node_id);
CREATE INDEX IF NOT EXISTS idx_analysis_links_analysis ON constellation_analysis_links(analysis_id, analysis_type);
CREATE INDEX IF NOT EXISTS idx_edge_candidates_status ON constellation_edge_candidates(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_node_candidates_status ON constellation_node_candidates(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_node_candidates_canonical ON constellation_node_candidates(canonical_name);
CREATE INDEX IF NOT EXISTS idx_extraction_log_analysis ON constellation_extraction_log(analysis_id, analysis_type);

-- ============================================================
-- ENRICHMENT STATS VIEW
-- ============================================================

CREATE OR REPLACE VIEW constellation_enrichment_stats AS
SELECT
  (SELECT COUNT(*) FROM constellation_analysis_links) AS total_analysis_links,
  (SELECT COUNT(*) FROM constellation_edge_candidates WHERE status = 'pending') AS pending_edge_candidates,
  (SELECT COUNT(*) FROM constellation_edge_candidates WHERE status = 'merged') AS merged_edges,
  (SELECT COUNT(*) FROM constellation_node_candidates WHERE status = 'pending') AS pending_node_candidates,
  (SELECT COUNT(*) FROM constellation_node_candidates WHERE status = 'promoted') AS promoted_nodes,
  (SELECT COUNT(*) FROM constellation_extraction_log WHERE extraction_tier = 'rule_based' AND status = 'completed') AS tier1_extractions,
  (SELECT COUNT(*) FROM constellation_extraction_log WHERE extraction_tier = 'llm' AND status = 'completed') AS tier2_extractions,
  (SELECT COUNT(*) FROM constellation_extraction_log WHERE analysis_type = 'music') AS music_analyses_processed,
  (SELECT COUNT(*) FROM constellation_extraction_log WHERE analysis_type = 'literature') AS literature_analyses_processed,
  (SELECT COUNT(*) FROM constellation_extraction_log WHERE analysis_type = 'cinema') AS cinema_analyses_processed,
  (SELECT COUNT(*) FROM constellation_extraction_log WHERE analysis_type = 'news') AS news_analyses_processed;

-- ============================================================
-- TOP MENTIONED PHILOSOPHERS VIEW
-- ============================================================

CREATE OR REPLACE VIEW constellation_top_mentioned AS
SELECT 
  node_id,
  COUNT(*) AS mention_count,
  COUNT(DISTINCT analysis_id) AS unique_analyses,
  MAX(created_at) AS last_mentioned_at
FROM constellation_analysis_links
GROUP BY node_id
ORDER BY mention_count DESC
LIMIT 50;
