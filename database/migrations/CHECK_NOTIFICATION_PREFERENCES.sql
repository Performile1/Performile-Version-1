-- Check for notification_preferences table
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notification_preferences'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- If exists, show structure
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;
