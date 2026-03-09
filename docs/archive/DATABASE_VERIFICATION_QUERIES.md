# Database Verification Queries
# Run these in Supabase SQL Editor to check indexes, triggers, functions

---

## STEP 1: Check All Indexes

```sql
-- List all indexes on our tables
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('songs', 'analyses', 'user_profiles', 'transactions')
ORDER BY tablename, indexname;
```

**What we need:**
- `songs`: Index on `(title_normalized, artist_normalized)` for fast lookups
- `analyses`: Index on `(song_id, language)` for cache lookups
- `user_profiles`: Primary key on `id`
- `transactions`: Index on `user_id` for history queries

---

## STEP 2: Check All Triggers

```sql
-- List all triggers
SELECT
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS event,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('songs', 'analyses', 'user_profiles', 'transactions')
ORDER BY event_object_table, trigger_name;
```

**Verify:**
- No triggers that will break our INSERT/UPDATE operations
- `ensure_user_profile()` trigger exists on auth.users (from migration STEP 9)

---

## STEP 3: Check All Functions

```sql
-- List all custom functions
SELECT
    n.nspname AS schema,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- Only functions, not procedures
ORDER BY function_name;
```

**Verify:**
- `ensure_user_profile()` exists (auto-creates profiles)
- No `create_analysis_revision()` (we dropped it)

---

## STEP 4: Check Foreign Keys

```sql
-- List all foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('songs', 'analyses', 'user_profiles', 'transactions')
ORDER BY tc.table_name;
```

**Expected:**
- `analyses.song_id` → `songs.id`
- `transactions.user_id` → `user_profiles.id` (or auth.users.id)

---

## STEP 5: Check Unique Constraints

```sql
-- List all unique constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name IN ('songs', 'analyses', 'user_profiles', 'transactions')
ORDER BY tc.table_name, tc.constraint_name;
```

**Critical for deduplication:**
- `songs`: Unique on `(title_normalized, artist_normalized)` - prevents duplicate songs
- `analyses`: Unique on `(song_id, language, version)` - prevents duplicate analyses

---

## STEP 6: Create Missing Indexes (if needed)

```sql
-- Index for fast song lookups by normalized title/artist
CREATE INDEX IF NOT EXISTS idx_songs_normalized
ON songs (title_normalized, artist_normalized);

-- Index for fast analysis lookups by song + language
CREATE INDEX IF NOT EXISTS idx_analyses_song_language
ON analyses (song_id, language, status);

-- Index for version ordering
CREATE INDEX IF NOT EXISTS idx_analyses_version
ON analyses (song_id, language, version DESC);

-- Index for user transaction history
CREATE INDEX IF NOT EXISTS idx_transactions_user
ON transactions (user_id, created_at DESC);

-- Index for Stripe deduplication
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment
ON transactions ((metadata->>'stripe_payment_intent_id'))
WHERE metadata->>'stripe_payment_intent_id' IS NOT NULL;
```

---

## STEP 7: Add Unique Constraint for Song Deduplication

```sql
-- Prevent duplicate songs (if not already exists)
ALTER TABLE songs
ADD CONSTRAINT songs_normalized_unique
UNIQUE (title_normalized, artist_normalized);
```

---

## STEP 8: Add Unique Constraint for Analysis Deduplication

```sql
-- Prevent duplicate analyses for same song+language+version
ALTER TABLE analyses
ADD CONSTRAINT analyses_song_lang_version_unique
UNIQUE (song_id, language, version);
```

---

## STEP 9: Verify Row Level Security (RLS)

```sql
-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('songs', 'analyses', 'user_profiles', 'transactions');

-- List all RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('songs', 'analyses', 'user_profiles', 'transactions')
ORDER BY tablename, policyname;
```

**Verify:**
- Service role can access everything
- Users can only read their own profiles/transactions
- Analyses and songs are public read

---

## STEP 10: Check Current Data State

```sql
-- Summary of current data
SELECT
    'songs' AS table_name,
    COUNT(*) AS record_count,
    COUNT(DISTINCT title_normalized) AS unique_titles,
    COUNT(DISTINCT artist_normalized) AS unique_artists
FROM songs
UNION ALL
SELECT
    'analyses',
    COUNT(*),
    COUNT(DISTINCT song_id),
    COUNT(DISTINCT language)
FROM analyses
UNION ALL
SELECT
    'user_profiles',
    COUNT(*),
    COUNT(DISTINCT CASE WHEN balance > 0 THEN id END) AS with_balance,
    COUNT(DISTINCT CASE WHEN free_analyses_used > 0 THEN id END) AS used_free
FROM user_profiles
UNION ALL
SELECT
    'transactions',
    COUNT(*),
    COUNT(DISTINCT user_id),
    COUNT(DISTINCT type)
FROM transactions;
```

---

**Run these queries in order and report back the results.**
