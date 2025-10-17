-- Quick check for notifications table
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%notif%'
ORDER BY table_name;

-- If exists, show structure
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
