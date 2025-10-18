-- Check the actual schema of the stores table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY ordinal_position;
