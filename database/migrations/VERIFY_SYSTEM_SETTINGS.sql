-- ============================================================================
-- VERIFY SYSTEM SETTINGS MIGRATION
-- Run these queries to confirm everything was created successfully
-- ============================================================================

-- 1. Check if all tables exist
SELECT 
  table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = t.table_name
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
  VALUES 
    ('system_settings'),
    ('system_settings_history'),
    ('system_settings_backups')
) AS t(table_name);

-- 2. Check system_settings table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'system_settings'
ORDER BY ordinal_position;
-- Expected: 14 columns

-- 3. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('system_settings', 'system_settings_history', 'system_settings_backups')
ORDER BY tablename, indexname;
-- Expected: 9 indexes total

-- 4. Check helper functions
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%system_setting%'
ORDER BY routine_name;
-- Expected: 5 functions

-- 5. Check RLS policies
SELECT 
  tablename,
  policyname,
  cmd as operation,
  qual as using_clause
FROM pg_policies 
WHERE tablename IN ('system_settings', 'system_settings_history', 'system_settings_backups')
ORDER BY tablename, policyname;
-- Expected: 5 policies

-- 6. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('system_settings', 'system_settings_history', 'system_settings_backups');
-- Expected: all TRUE

-- 7. Count settings by category
SELECT 
  setting_category,
  COUNT(*) as count
FROM system_settings
GROUP BY setting_category
ORDER BY setting_category;
-- Expected: email(7), api(4), security(5), features(5), maintenance(3)

-- 8. View all settings (non-sensitive)
SELECT 
  setting_key,
  CASE 
    WHEN is_sensitive THEN '***'
    ELSE setting_value
  END as setting_value,
  setting_category,
  description,
  data_type,
  is_public
FROM system_settings
ORDER BY setting_category, setting_key;

-- 9. Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('system_settings', 'system_settings_history', 'system_settings_backups')
ORDER BY event_object_table, trigger_name;
-- Expected: 2 triggers on system_settings

-- 10. Test get_system_setting function
SELECT get_system_setting('email.smtp_host') as smtp_host;
SELECT get_system_setting('api.rate_limit_per_hour') as rate_limit;
SELECT get_system_setting('features.enable_notifications') as notifications_enabled;

-- 11. Test get_settings_by_category function
SELECT * FROM get_settings_by_category('email');
SELECT * FROM get_settings_by_category('api');
SELECT * FROM get_settings_by_category('security');
SELECT * FROM get_settings_by_category('features');
SELECT * FROM get_settings_by_category('maintenance');

-- 12. Check for any settings history (should be empty initially)
SELECT COUNT(*) as history_count FROM system_settings_history;
-- Expected: 0 (no changes yet)

-- 13. Check for any backups (should be empty initially)
SELECT COUNT(*) as backup_count FROM system_settings_backups;
-- Expected: 0 (no backups yet)

-- ============================================================================
-- SUMMARY QUERY - Run this for a quick overview
-- ============================================================================
SELECT 
  'system_settings table' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'system_settings_history table',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings_history') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'system_settings_backups table',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings_backups') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'indexes',
  '✅ ' || COUNT(*)::text || ' indexes' as status
FROM pg_indexes 
WHERE tablename IN ('system_settings', 'system_settings_history', 'system_settings_backups')
UNION ALL
SELECT 
  'helper functions',
  '✅ ' || COUNT(*)::text || ' functions' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%system_setting%'
UNION ALL
SELECT 
  'RLS policies',
  '✅ ' || COUNT(*)::text || ' policies' as status
FROM pg_policies 
WHERE tablename IN ('system_settings', 'system_settings_history', 'system_settings_backups')
UNION ALL
SELECT 
  'triggers',
  '✅ ' || COUNT(*)::text || ' triggers' as status
FROM information_schema.triggers
WHERE event_object_table = 'system_settings'
UNION ALL
SELECT 
  'default settings',
  '✅ ' || COUNT(*)::text || ' settings' as status
FROM system_settings
UNION ALL
SELECT 
  'RLS enabled',
  CASE WHEN bool_and(rowsecurity) THEN '✅ ALL ENABLED' ELSE '❌ SOME DISABLED' END as status
FROM pg_tables 
WHERE tablename IN ('system_settings', 'system_settings_history', 'system_settings_backups');

-- ============================================================================
-- TEST QUERIES (OPTIONAL)
-- ============================================================================

-- Test updating a setting (uncomment to test)
/*
SELECT update_system_setting(
  'features.enable_notifications',
  'true',
  (SELECT user_id FROM users WHERE user_role = 'admin' LIMIT 1)
);

-- Check if history was logged
SELECT * FROM system_settings_history ORDER BY changed_at DESC LIMIT 5;
*/

-- Test creating a backup (uncomment to test)
/*
SELECT create_settings_backup(
  'Test Backup',
  (SELECT user_id FROM users WHERE user_role = 'admin' LIMIT 1)
) as backup_id;

-- View backups
SELECT 
  backup_id,
  backup_name,
  created_at,
  jsonb_object_keys(backup_data) as setting_keys
FROM system_settings_backups;
*/

-- Test restoring from backup (uncomment to test)
/*
-- First create a backup, then restore it
SELECT restore_settings_backup(
  'YOUR_BACKUP_ID_HERE'::UUID,
  (SELECT user_id FROM users WHERE user_role = 'admin' LIMIT 1)
);
*/
