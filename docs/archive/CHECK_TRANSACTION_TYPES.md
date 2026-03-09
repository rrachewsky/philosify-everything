# Check Allowed Transaction Types

Run this query to see what values are allowed for transactions.type:

```sql
-- Get CHECK constraint definition
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'transactions_type_check'
  AND conrelid = 'transactions'::regclass;

-- Check existing transaction types in use
SELECT DISTINCT type, COUNT(*) as count
FROM transactions
GROUP BY type
ORDER BY count DESC;

-- Check the column definition
SELECT
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name = 'type';
```

This will tell us what values are allowed and what we should use instead of 'purchase'.
