-- Check if materialized views exist
-- Run this in Supabase SQL Editor

-- Check for order_trends materialized view
SELECT 
  schemaname,
  matviewname,
  matviewowner,
  ispopulated
FROM pg_matviews
WHERE matviewname IN ('order_trends', 'claim_trends');

-- If empty: Materialized views don't exist
-- The API will fall back to querying orders table directly (which should work)

-- Also check regular views
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name LIKE '%trend%';
