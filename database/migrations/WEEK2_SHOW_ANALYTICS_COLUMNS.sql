-- Show all columns for analytics tables

-- shopanalyticssnapshots columns
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'shopanalyticssnapshots'
ORDER BY ordinal_position;

-- platform_analytics columns  
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'platform_analytics'
ORDER BY ordinal_position;

-- courier_analytics columns
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'courier_analytics'
ORDER BY ordinal_position;
