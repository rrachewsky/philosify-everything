-- ============================================================
-- Migration: Ads Audience Targeting
-- ============================================================
-- Targeting system based on Philosify user behavior/preferences
-- ============================================================

-- ============================================================
-- USER PROFILE CACHE (for ad targeting)
-- ============================================================
-- Aggregated user behavior for efficient ad matching
-- Updated periodically from analysis history
CREATE TABLE ads.user_profiles (
  user_id UUID PRIMARY KEY,  -- References auth.users
  
  -- Music Genre Preferences (based on analysis history)
  -- Stored as JSONB: {"rock": 45, "pop": 30, "jazz": 15, ...} (percentage)
  genre_preferences JSONB DEFAULT '{}'::jsonb,
  top_genres TEXT[] DEFAULT '{}',  -- Top 3 genres for quick filtering
  
  -- Philosophical Alignment (based on high scores in analyses)
  -- Stored as JSONB: {"objectivism": 85, "stoicism": 60, ...} (avg affinity score)
  philosophy_affinities JSONB DEFAULT '{}'::jsonb,
  top_philosophies TEXT[] DEFAULT '{}',  -- Top 3 for quick filtering
  
  -- Language (from user settings or detected)
  language TEXT DEFAULT 'en',
  
  -- Geographic Location (from IP geolocation)
  country_code TEXT,        -- ISO 3166-1 alpha-2 (e.g., 'US', 'BR')
  country_name TEXT,        -- Full name for display
  region_code TEXT,         -- State/province code (e.g., 'CA', 'SP')
  region_name TEXT,         -- State/province name
  city TEXT,                -- City name
  timezone TEXT,            -- IANA timezone (e.g., 'America/New_York')
  geo_region TEXT,          -- Continent/area (e.g., 'north_america', 'europe')
  
  -- Engagement Level
  total_analyses INTEGER DEFAULT 0,
  analyses_last_30_days INTEGER DEFAULT 0,
  engagement_level TEXT DEFAULT 'casual' 
    CHECK (engagement_level IN ('casual', 'regular', 'power_user')),
  
  -- Content Preferences
  preferred_content_types TEXT[] DEFAULT '{}',  -- 'music', 'books', 'news', 'colloquium'
  
  -- Recency
  last_analysis_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  
  -- Premium status (for exclusion)
  is_premium BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_genres ON ads.user_profiles USING GIN (top_genres);
CREATE INDEX idx_user_profiles_philosophy ON ads.user_profiles USING GIN (top_philosophies);
CREATE INDEX idx_user_profiles_language ON ads.user_profiles(language);
CREATE INDEX idx_user_profiles_country ON ads.user_profiles(country_code);
CREATE INDEX idx_user_profiles_region ON ads.user_profiles(country_code, region_code);
CREATE INDEX idx_user_profiles_city ON ads.user_profiles(city) WHERE city IS NOT NULL;
CREATE INDEX idx_user_profiles_geo_region ON ads.user_profiles(geo_region);
CREATE INDEX idx_user_profiles_timezone ON ads.user_profiles(timezone);
CREATE INDEX idx_user_profiles_engagement ON ads.user_profiles(engagement_level);
CREATE INDEX idx_user_profiles_premium ON ads.user_profiles(is_premium);

-- ============================================================
-- TARGETING CRITERIA TABLE
-- ============================================================
-- Defines available targeting options for advertisers
CREATE TABLE ads.targeting_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  category TEXT NOT NULL,  -- 'genre', 'philosophy', 'language', 'engagement', 'geography'
  option_key TEXT NOT NULL,  -- 'rock', 'objectivism', 'en', 'power_user', 'US'
  option_label TEXT NOT NULL,  -- 'Rock Music', 'Objectivism', 'English', etc.
  
  -- Estimated reach (updated periodically)
  estimated_users INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(category, option_key)
);

-- Insert targeting options
INSERT INTO ads.targeting_options (category, option_key, option_label) VALUES
  -- Music Genres
  ('genre', 'rock', 'Rock'),
  ('genre', 'pop', 'Pop'),
  ('genre', 'hip_hop', 'Hip-Hop / Rap'),
  ('genre', 'electronic', 'Electronic / EDM'),
  ('genre', 'jazz', 'Jazz'),
  ('genre', 'classical', 'Classical'),
  ('genre', 'country', 'Country'),
  ('genre', 'r_and_b', 'R&B / Soul'),
  ('genre', 'metal', 'Metal'),
  ('genre', 'indie', 'Indie / Alternative'),
  ('genre', 'latin', 'Latin'),
  ('genre', 'k_pop', 'K-Pop'),
  ('genre', 'folk', 'Folk / Acoustic'),
  ('genre', 'reggae', 'Reggae'),
  ('genre', 'blues', 'Blues'),
  
  -- Philosophy Schools
  ('philosophy', 'objectivism', 'Objectivism'),
  ('philosophy', 'stoicism', 'Stoicism'),
  ('philosophy', 'existentialism', 'Existentialism'),
  ('philosophy', 'nihilism', 'Nihilism'),
  ('philosophy', 'marxism', 'Marxism'),
  ('philosophy', 'utilitarianism', 'Utilitarianism'),
  ('philosophy', 'virtue_ethics', 'Virtue Ethics'),
  ('philosophy', 'absurdism', 'Absurdism'),
  ('philosophy', 'pragmatism', 'Pragmatism'),
  ('philosophy', 'romanticism', 'Romanticism'),
  
  -- Languages
  ('language', 'en', 'English'),
  ('language', 'pt', 'Portuguese'),
  ('language', 'es', 'Spanish'),
  ('language', 'fr', 'French'),
  ('language', 'de', 'German'),
  ('language', 'it', 'Italian'),
  ('language', 'ja', 'Japanese'),
  ('language', 'ko', 'Korean'),
  ('language', 'zh', 'Chinese'),
  ('language', 'ru', 'Russian'),
  
  -- Engagement Levels
  ('engagement', 'casual', 'Casual Users (1-5 analyses/month)'),
  ('engagement', 'regular', 'Regular Users (6-20 analyses/month)'),
  ('engagement', 'power_user', 'Power Users (20+ analyses/month)'),
  
  -- Content Types
  ('content', 'music', 'Music Analyzers'),
  ('content', 'books', 'Book Readers'),
  ('content', 'news', 'News Followers'),
  ('content', 'colloquium', 'Colloquium Participants'),
  
  -- Countries (comprehensive list)
  ('country', 'US', 'United States'),
  ('country', 'BR', 'Brazil'),
  ('country', 'GB', 'United Kingdom'),
  ('country', 'CA', 'Canada'),
  ('country', 'AU', 'Australia'),
  ('country', 'DE', 'Germany'),
  ('country', 'FR', 'France'),
  ('country', 'ES', 'Spain'),
  ('country', 'MX', 'Mexico'),
  ('country', 'PT', 'Portugal'),
  ('country', 'JP', 'Japan'),
  ('country', 'KR', 'South Korea'),
  ('country', 'IT', 'Italy'),
  ('country', 'NL', 'Netherlands'),
  ('country', 'AR', 'Argentina'),
  ('country', 'CO', 'Colombia'),
  ('country', 'CL', 'Chile'),
  ('country', 'PE', 'Peru'),
  ('country', 'IN', 'India'),
  ('country', 'PH', 'Philippines'),
  ('country', 'ID', 'Indonesia'),
  ('country', 'TH', 'Thailand'),
  ('country', 'VN', 'Vietnam'),
  ('country', 'MY', 'Malaysia'),
  ('country', 'SG', 'Singapore'),
  ('country', 'ZA', 'South Africa'),
  ('country', 'NG', 'Nigeria'),
  ('country', 'EG', 'Egypt'),
  ('country', 'AE', 'United Arab Emirates'),
  ('country', 'SA', 'Saudi Arabia'),
  ('country', 'TR', 'Turkey'),
  ('country', 'PL', 'Poland'),
  ('country', 'SE', 'Sweden'),
  ('country', 'NO', 'Norway'),
  ('country', 'DK', 'Denmark'),
  ('country', 'FI', 'Finland'),
  ('country', 'BE', 'Belgium'),
  ('country', 'AT', 'Austria'),
  ('country', 'CH', 'Switzerland'),
  ('country', 'IE', 'Ireland'),
  ('country', 'NZ', 'New Zealand'),
  
  -- Regions (continents/areas for broader targeting)
  ('region', 'north_america', 'North America'),
  ('region', 'south_america', 'South America'),
  ('region', 'europe', 'Europe'),
  ('region', 'asia_pacific', 'Asia Pacific'),
  ('region', 'middle_east', 'Middle East'),
  ('region', 'africa', 'Africa'),
  ('region', 'latin_america', 'Latin America'),
  ('region', 'english_speaking', 'English-Speaking Countries'),
  ('region', 'spanish_speaking', 'Spanish-Speaking Countries'),
  ('region', 'portuguese_speaking', 'Portuguese-Speaking Countries'),
  
  -- US States (major markets)
  ('us_state', 'CA', 'California'),
  ('us_state', 'TX', 'Texas'),
  ('us_state', 'FL', 'Florida'),
  ('us_state', 'NY', 'New York'),
  ('us_state', 'IL', 'Illinois'),
  ('us_state', 'PA', 'Pennsylvania'),
  ('us_state', 'OH', 'Ohio'),
  ('us_state', 'GA', 'Georgia'),
  ('us_state', 'NC', 'North Carolina'),
  ('us_state', 'MI', 'Michigan'),
  ('us_state', 'NJ', 'New Jersey'),
  ('us_state', 'VA', 'Virginia'),
  ('us_state', 'WA', 'Washington'),
  ('us_state', 'AZ', 'Arizona'),
  ('us_state', 'MA', 'Massachusetts'),
  ('us_state', 'CO', 'Colorado'),
  
  -- Brazil States (major markets)
  ('br_state', 'SP', 'São Paulo'),
  ('br_state', 'RJ', 'Rio de Janeiro'),
  ('br_state', 'MG', 'Minas Gerais'),
  ('br_state', 'BA', 'Bahia'),
  ('br_state', 'RS', 'Rio Grande do Sul'),
  ('br_state', 'PR', 'Paraná'),
  ('br_state', 'PE', 'Pernambuco'),
  ('br_state', 'CE', 'Ceará'),
  ('br_state', 'SC', 'Santa Catarina'),
  ('br_state', 'GO', 'Goiás');

-- ============================================================
-- ORDER/PLAN TARGETING
-- ============================================================
-- Add targeting to ad_orders and ad_plans
ALTER TABLE ads.ad_orders ADD COLUMN IF NOT EXISTS targeting JSONB DEFAULT '{}'::jsonb;
ALTER TABLE ads.ad_plans ADD COLUMN IF NOT EXISTS targeting JSONB DEFAULT '{}'::jsonb;

-- Targeting structure:
-- {
--   "genres": ["rock", "pop"],
--   "philosophies": ["objectivism", "stoicism"],
--   "languages": ["en", "pt"],
--   "engagement": ["regular", "power_user"],
--   "content_types": ["music"],
--   "countries": ["US", "BR"],
--   "exclude_premium": true  // Always true for ads
-- }

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if a user matches targeting criteria
CREATE OR REPLACE FUNCTION ads.user_matches_targeting(
  p_user_id UUID,
  p_targeting JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile ads.user_profiles%ROWTYPE;
  v_arr TEXT[];
  v_regions TEXT[];
  v_region_countries JSONB := '{
    "north_america": ["US", "CA", "MX"],
    "south_america": ["BR", "AR", "CO", "CL", "PE", "VE", "EC", "UY", "PY", "BO"],
    "latin_america": ["MX", "BR", "AR", "CO", "CL", "PE", "VE", "EC", "UY", "PY", "BO", "CR", "PA", "DO", "CU", "GT", "HN", "SV", "NI"],
    "europe": ["GB", "DE", "FR", "IT", "ES", "PT", "NL", "BE", "AT", "CH", "SE", "NO", "DK", "FI", "PL", "IE", "GR", "CZ", "RO", "HU"],
    "asia_pacific": ["JP", "KR", "CN", "IN", "AU", "NZ", "SG", "MY", "TH", "PH", "ID", "VN", "TW", "HK"],
    "middle_east": ["AE", "SA", "IL", "TR", "EG", "QA", "KW", "BH", "OM", "JO", "LB"],
    "africa": ["ZA", "NG", "EG", "KE", "MA", "GH", "TZ", "ET"],
    "english_speaking": ["US", "GB", "CA", "AU", "NZ", "IE", "SG", "ZA", "PH", "IN"],
    "spanish_speaking": ["ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "DO", "HN", "SV", "NI", "CR", "PA", "UY", "PY", "BO"],
    "portuguese_speaking": ["BR", "PT", "AO", "MZ"]
  }'::jsonb;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM ads.user_profiles WHERE user_id = p_user_id;
  
  -- If no profile, no match (or match everyone if no targeting)
  IF NOT FOUND THEN
    RETURN p_targeting IS NULL OR p_targeting = '{}'::jsonb;
  END IF;
  
  -- Premium users never see ads
  IF v_profile.is_premium THEN
    RETURN FALSE;
  END IF;
  
  -- Check genres (if specified, user must have at least one)
  IF p_targeting ? 'genres' AND jsonb_array_length(p_targeting->'genres') > 0 THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_targeting->'genres')) INTO v_arr;
    IF NOT (v_profile.top_genres && v_arr) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check philosophies
  IF p_targeting ? 'philosophies' AND jsonb_array_length(p_targeting->'philosophies') > 0 THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_targeting->'philosophies')) INTO v_arr;
    IF NOT (v_profile.top_philosophies && v_arr) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check languages
  IF p_targeting ? 'languages' AND jsonb_array_length(p_targeting->'languages') > 0 THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_targeting->'languages')) INTO v_arr;
    IF NOT (v_profile.language = ANY(v_arr)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check engagement level
  IF p_targeting ? 'engagement' AND jsonb_array_length(p_targeting->'engagement') > 0 THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_targeting->'engagement')) INTO v_arr;
    IF NOT (v_profile.engagement_level = ANY(v_arr)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check countries (direct country targeting)
  IF p_targeting ? 'countries' AND jsonb_array_length(p_targeting->'countries') > 0 THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_targeting->'countries')) INTO v_arr;
    IF v_profile.country_code IS NULL OR NOT (v_profile.country_code = ANY(v_arr)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check regions (expand region to countries and check)
  IF p_targeting ? 'regions' AND jsonb_array_length(p_targeting->'regions') > 0 THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_targeting->'regions')) INTO v_regions;
    -- Build array of all countries in selected regions
    SELECT ARRAY(
      SELECT DISTINCT jsonb_array_elements_text(v_region_countries->r)
      FROM unnest(v_regions) AS r
      WHERE v_region_countries ? r
    ) INTO v_arr;
    
    IF v_profile.country_code IS NULL OR NOT (v_profile.country_code = ANY(v_arr)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check US states
  IF p_targeting ? 'us_states' AND jsonb_array_length(p_targeting->'us_states') > 0 THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_targeting->'us_states')) INTO v_arr;
    -- Must be in US and in one of the specified states
    IF v_profile.country_code != 'US' OR v_profile.region_code IS NULL OR NOT (v_profile.region_code = ANY(v_arr)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check Brazil states
  IF p_targeting ? 'br_states' AND jsonb_array_length(p_targeting->'br_states') > 0 THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_targeting->'br_states')) INTO v_arr;
    IF v_profile.country_code != 'BR' OR v_profile.region_code IS NULL OR NOT (v_profile.region_code = ANY(v_arr)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check cities (if targeting specific cities)
  IF p_targeting ? 'cities' AND jsonb_array_length(p_targeting->'cities') > 0 THEN
    SELECT ARRAY(SELECT LOWER(jsonb_array_elements_text(p_targeting->'cities'))) INTO v_arr;
    IF v_profile.city IS NULL OR NOT (LOWER(v_profile.city) = ANY(v_arr)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check timezone (for time-based targeting)
  IF p_targeting ? 'timezones' AND jsonb_array_length(p_targeting->'timezones') > 0 THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_targeting->'timezones')) INTO v_arr;
    IF v_profile.timezone IS NULL OR NOT (v_profile.timezone = ANY(v_arr)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- All criteria passed
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Get next ad for a specific user (with targeting)
CREATE OR REPLACE FUNCTION ads.get_targeted_ad(
  p_placement TEXT,
  p_user_id UUID
)
RETURNS TABLE (
  order_id UUID,
  advertiser_id UUID,
  creative_url TEXT,
  target_url TEXT,
  duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.advertiser_id,
    o.creative_url,
    o.target_url,
    o.duration
  FROM ads.ad_orders o
  JOIN ads.advertisers a ON a.id = o.advertiser_id
  WHERE o.placement = p_placement
    AND o.status = 'active'
    AND o.creative_status = 'ready'
    AND o.impressions_delivered < o.impressions_ordered
    AND a.status = 'approved'
    AND (
      o.schedule_type = 'asap'
      OR (
        o.schedule_type = 'scheduled'
        AND CURRENT_DATE BETWEEN o.start_date AND o.end_date
      )
    )
    -- Check targeting match
    AND ads.user_matches_targeting(p_user_id, o.targeting)
  ORDER BY 
    -- Priority: scheduled orders first, then ASAP by creation date
    CASE WHEN o.schedule_type = 'scheduled' THEN 0 ELSE 1 END,
    o.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Estimate reach for targeting criteria
CREATE OR REPLACE FUNCTION ads.estimate_reach(p_targeting JSONB)
RETURNS TABLE (
  total_users INTEGER,
  matching_users INTEGER,
  reach_percentage NUMERIC
) AS $$
DECLARE
  v_total INTEGER;
  v_matching INTEGER;
BEGIN
  -- Count total non-premium users
  SELECT COUNT(*) INTO v_total 
  FROM ads.user_profiles 
  WHERE is_premium = FALSE;
  
  -- Count matching users
  SELECT COUNT(*) INTO v_matching
  FROM ads.user_profiles up
  WHERE up.is_premium = FALSE
    AND ads.user_matches_targeting(up.user_id, p_targeting);
  
  RETURN QUERY SELECT 
    v_total,
    v_matching,
    CASE WHEN v_total > 0 THEN ROUND((v_matching::numeric / v_total) * 100, 2) ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- UPDATE USER PROFILES (Scheduled Job)
-- ============================================================
-- This function should be called periodically (daily) to update user profiles
CREATE OR REPLACE FUNCTION ads.refresh_user_profiles()
RETURNS void AS $$
BEGIN
  -- Insert/update profiles for all users with recent activity
  INSERT INTO ads.user_profiles (
    user_id,
    total_analyses,
    analyses_last_30_days,
    engagement_level,
    last_analysis_at,
    last_active_at,
    is_premium,
    updated_at
  )
  SELECT 
    u.id,
    COALESCE(ah.total_count, 0),
    COALESCE(ah.recent_count, 0),
    CASE 
      WHEN COALESCE(ah.recent_count, 0) >= 20 THEN 'power_user'
      WHEN COALESCE(ah.recent_count, 0) >= 6 THEN 'regular'
      ELSE 'casual'
    END,
    ah.last_analysis,
    GREATEST(ah.last_analysis, u.last_sign_in_at),
    COALESCE(u.is_premium, false),
    NOW()
  FROM auth.users u
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_count,
      MAX(created_at) as last_analysis
    FROM public.analysis_history
    GROUP BY user_id
  ) ah ON ah.user_id = u.id
  WHERE u.last_sign_in_at > NOW() - INTERVAL '90 days'
    OR ah.last_analysis > NOW() - INTERVAL '90 days'
  ON CONFLICT (user_id) DO UPDATE SET
    total_analyses = EXCLUDED.total_analyses,
    analyses_last_30_days = EXCLUDED.analyses_last_30_days,
    engagement_level = EXCLUDED.engagement_level,
    last_analysis_at = EXCLUDED.last_analysis_at,
    last_active_at = EXCLUDED.last_active_at,
    is_premium = EXCLUDED.is_premium,
    updated_at = NOW();

  -- Update genre preferences from analysis history
  UPDATE ads.user_profiles up
  SET 
    genre_preferences = genre_data.preferences,
    top_genres = genre_data.top_3
  FROM (
    SELECT 
      user_id,
      jsonb_object_agg(genre, pct) as preferences,
      ARRAY(
        SELECT genre 
        FROM jsonb_each_text(jsonb_object_agg(genre, pct)) 
        ORDER BY value::numeric DESC 
        LIMIT 3
      ) as top_3
    FROM (
      SELECT 
        ah.user_id,
        LOWER(COALESCE(ah.metadata->>'genre', 'unknown')) as genre,
        ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER (PARTITION BY ah.user_id) * 100, 1) as pct
      FROM public.analysis_history ah
      WHERE ah.created_at > NOW() - INTERVAL '180 days'
      GROUP BY ah.user_id, LOWER(COALESCE(ah.metadata->>'genre', 'unknown'))
    ) genre_counts
    GROUP BY user_id
  ) genre_data
  WHERE up.user_id = genre_data.user_id;

  -- Update philosophy affinities from analysis scores
  -- (This would require parsing analysis results - simplified version)
  UPDATE ads.user_profiles up
  SET 
    philosophy_affinities = philo_data.affinities,
    top_philosophies = philo_data.top_3
  FROM (
    SELECT 
      user_id,
      jsonb_object_agg(school, avg_score) as affinities,
      ARRAY(
        SELECT school 
        FROM jsonb_each_text(jsonb_object_agg(school, avg_score)) 
        ORDER BY value::numeric DESC 
        LIMIT 3
      ) as top_3
    FROM (
      SELECT 
        ah.user_id,
        LOWER(school.key) as school,
        ROUND(AVG((school.value->>'score')::numeric), 1) as avg_score
      FROM public.analysis_history ah,
           jsonb_each(ah.metadata->'schools') as school
      WHERE ah.created_at > NOW() - INTERVAL '180 days'
        AND school.value->>'score' IS NOT NULL
      GROUP BY ah.user_id, LOWER(school.key)
      HAVING AVG((school.value->>'score')::numeric) >= 60
    ) school_scores
    GROUP BY user_id
  ) philo_data
  WHERE up.user_id = philo_data.user_id;

  -- Update targeting option reach estimates
  UPDATE ads.targeting_options t
  SET estimated_users = counts.user_count
  FROM (
    -- Genre counts
    SELECT 'genre' as category, unnest(top_genres) as option_key, COUNT(*) as user_count
    FROM ads.user_profiles WHERE is_premium = FALSE
    GROUP BY unnest(top_genres)
    UNION ALL
    -- Philosophy counts
    SELECT 'philosophy', unnest(top_philosophies), COUNT(*)
    FROM ads.user_profiles WHERE is_premium = FALSE
    GROUP BY unnest(top_philosophies)
    UNION ALL
    -- Language counts
    SELECT 'language', language, COUNT(*)
    FROM ads.user_profiles WHERE is_premium = FALSE
    GROUP BY language
    UNION ALL
    -- Engagement counts
    SELECT 'engagement', engagement_level, COUNT(*)
    FROM ads.user_profiles WHERE is_premium = FALSE
    GROUP BY engagement_level
    UNION ALL
    -- Country counts
    SELECT 'geography', country_code, COUNT(*)
    FROM ads.user_profiles WHERE is_premium = FALSE AND country_code IS NOT NULL
    GROUP BY country_code
  ) counts
  WHERE t.category = counts.category AND t.option_key = counts.option_key;
END;
$$ LANGUAGE plpgsql;
