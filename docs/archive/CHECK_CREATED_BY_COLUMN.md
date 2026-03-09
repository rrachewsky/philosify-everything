# Check created_by Column in songs/analyses Tables

Run this query to see if these columns exist and what constraints they have:

```sql
-- Check if created_by exists and its constraints
SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_name IN ('songs', 'analyses')
  AND c.column_name = 'created_by'
ORDER BY c.table_name;

-- Check if there are any existing records without created_by
SELECT
    'songs' AS table_name,
    COUNT(*) AS total_records,
    COUNT(created_by) AS with_created_by,
    COUNT(*) - COUNT(created_by) AS without_created_by
FROM songs
UNION ALL
SELECT
    'analyses',
    COUNT(*),
    COUNT(created_by),
    COUNT(*) - COUNT(created_by)
FROM analyses;
```

**If created_by exists:**
- We need to either set it in our INSERT statements OR
- Make the column nullable OR
- Relax the RLS policy

**If created_by doesn't exist:**
- RLS policies are misconfigured (they reference a non-existent column)
- We can ignore this issue
