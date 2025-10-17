-- Check what the actual shop/store/merchant table is called

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND (
    table_name LIKE '%shop%' OR
    table_name LIKE '%store%' OR
    table_name LIKE '%merchant%'
  )
ORDER BY table_name;
