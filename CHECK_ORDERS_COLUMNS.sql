-- Check what columns exist in the orders table
-- Run this in Supabase SQL Editor

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- The API is trying to query these columns:
-- - created_at
-- - order_status
-- - package_value
-- - shipping_cost
-- - courier_id
-- - store_id

-- If any of these don't exist, the API will fail with 500 error
