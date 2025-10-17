-- ============================================================================
-- VERIFY SUPABASE MIGRATION
-- Run these queries to confirm everything was created successfully
-- ============================================================================

-- 1. Check if notifications table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'notifications';
-- Expected: 1 row with table_name = 'notifications'

-- 2. Check notifications table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
-- Expected: 9 columns (notification_id, user_id, type, title, message, data, is_read, created_at, read_at)

-- 3. Check indexes on notifications
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'notifications'
ORDER BY indexname;
-- Expected: 5-6 indexes

-- 4. Check helper functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%'
ORDER BY routine_name;
-- Expected: 3 functions (create_notification, mark_notification_read, get_unread_notification_count)

-- 5. Check RLS policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;
-- Expected: 4 policies (select_own, update_own, delete_own, insert_system)

-- 6. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'notifications';
-- Expected: rowsecurity = true

-- 7. Check views
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE '%notification%'
ORDER BY table_name;
-- Expected: 2 views (v_unread_notifications_count, v_recent_notifications)

-- 8. Check if stripe_customer_id was added to users
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'stripe_customer_id';
-- Expected: 1 row if users table exists

-- 9. Count existing notifications (should be 0 for new install)
SELECT COUNT(*) as notification_count FROM notifications;
-- Expected: 0 (or more if you have data)

-- 10. Test creating a notification (OPTIONAL - only if you want to test)
-- Uncomment to test:
/*
SELECT create_notification(
  (SELECT user_id FROM users LIMIT 1), -- Replace with actual user_id
  'system',
  'Test Notification',
  'Migration successful! This is a test notification.',
  '{"test": true, "migration": "successful"}'::jsonb
);

-- Then check if it was created:
SELECT * FROM notifications WHERE type = 'system' ORDER BY created_at DESC LIMIT 1;
*/

-- ============================================================================
-- SUMMARY QUERY - Run this for a quick overview
-- ============================================================================
SELECT 
  'notifications table' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'indexes',
  '✅ ' || COUNT(*)::text || ' indexes' as status
FROM pg_indexes WHERE tablename = 'notifications'
UNION ALL
SELECT 
  'helper functions',
  '✅ ' || COUNT(*)::text || ' functions' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%notification%'
UNION ALL
SELECT 
  'RLS policies',
  '✅ ' || COUNT(*)::text || ' policies' as status
FROM pg_policies WHERE tablename = 'notifications'
UNION ALL
SELECT 
  'views',
  '✅ ' || COUNT(*)::text || ' views' as status
FROM information_schema.views 
WHERE table_schema = 'public' AND table_name LIKE '%notification%'
UNION ALL
SELECT 
  'RLS enabled',
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM pg_tables WHERE tablename = 'notifications';
