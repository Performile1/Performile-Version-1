-- Check actual column names in existing integration tables

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ecommerce_integrations'
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'shopintegrations'
ORDER BY ordinal_position;
