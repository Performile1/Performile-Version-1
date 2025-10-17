-- Check stores table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stores'
ORDER BY ordinal_position;

-- Check merchantshops table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'merchantshops'
ORDER BY ordinal_position;
