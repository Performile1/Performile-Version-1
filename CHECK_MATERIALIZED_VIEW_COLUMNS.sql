-- Check what columns exist in the materialized views
-- Run this in Supabase SQL Editor

-- Check order_trends columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_trends'
ORDER BY ordinal_position;

-- Check claim_trends columns  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'claim_trends'
ORDER BY ordinal_position;

-- Also check what data is actually in order_trends
SELECT * FROM order_trends LIMIT 5;

-- And check claim_trends data
SELECT * FROM claim_trends LIMIT 5;
