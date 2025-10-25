-- Check the actual structure of the materialized views
-- Run this in Supabase SQL Editor

-- Method 1: Check if views have any data
SELECT COUNT(*) as order_trends_count FROM order_trends;
SELECT COUNT(*) as claim_trends_count FROM claim_trends;

-- Method 2: Try to select everything
SELECT * FROM order_trends LIMIT 1;
SELECT * FROM claim_trends LIMIT 1;

-- Method 3: Get the view definition
SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE matviewname IN ('order_trends', 'claim_trends');
