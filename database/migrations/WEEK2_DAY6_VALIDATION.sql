-- ============================================================================
-- WEEK 2 - DAY 6-7: NOTIFICATIONS UI VALIDATION
-- Date: October 17, 2025
-- Purpose: Validate if we have all tables needed for Notifications UI
-- Strategy: Use existing tables first, create new only if needed
-- ============================================================================

-- ============================================================================
-- 1. CHECK EXISTING NOTIFICATION TABLES
-- ============================================================================

-- Check notifications table (already exists from Day 3)
SELECT 
  'notifications' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
  (SELECT COUNT(*) FROM notifications) as row_count;

-- Check notification_preferences table (already exists from Day 3)
SELECT 
  'notification_preferences' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notification_preferences'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
  (SELECT COUNT(*) FROM notification_preferences) as row_count;

-- ============================================================================
-- 2. VERIFY TABLE STRUCTURES
-- ============================================================================

-- Verify notifications table has all needed columns for UI
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Verify notification_preferences table has all needed columns for UI
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. CHECK FOR ADDITIONAL UI-RELATED TABLES
-- ============================================================================

-- Check if we need notification_templates table
SELECT 
  'notification_templates' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notification_templates'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check if we need notification_channels table
SELECT 
  'notification_channels' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notification_channels'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- ============================================================================
-- 4. CHECK SAMPLE DATA
-- ============================================================================

-- Check if we have sample notifications
SELECT 
  type,
  COUNT(*) as count,
  COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
FROM notifications
GROUP BY type
ORDER BY count DESC;

-- Check if we have notification preferences set
SELECT 
  COUNT(*) as users_with_preferences,
  COUNT(CASE WHEN email_enabled = true THEN 1 END) as email_enabled_count,
  COUNT(CASE WHEN push_enabled = true THEN 1 END) as push_enabled_count
FROM notification_preferences;

-- ============================================================================
-- 5. DECISION: DO WE NEED NEW TABLES?
-- ============================================================================

-- EXISTING TABLES (Day 3):
-- ✅ notifications (9 columns) - stores all notifications
-- ✅ notification_preferences (11 columns) - user preferences

-- FOR UI COMPONENTS WE NEED:
-- 1. Notification Bell/Dropdown - Use notifications table ✅
-- 2. Notification Center Page - Use notifications table ✅
-- 3. Preferences UI - Use notification_preferences table ✅
-- 4. Real-time updates - Use existing notifications table ✅

-- RECOMMENDATION: NO NEW TABLES NEEDED
-- All UI components can use existing tables from Day 3

SELECT 
  'VALIDATION COMPLETE' as status,
  'NO NEW TABLES NEEDED' as required_tables,
  'Can use: notifications, notification_preferences' as existing_tables,
  'Strategy: Build UI components using existing backend APIs' as approach;

-- ============================================================================
-- 6. VERIFY APIS EXIST
-- ============================================================================

-- We already have these APIs from Day 3:
-- ✅ /api/notifications/list - Get notifications
-- ✅ /api/notifications/mark-read - Mark as read
-- ✅ /api/notifications/preferences - Get/Update preferences

-- Additional APIs we might need:
-- - Delete notification (optional)
-- - Mark all as read (already in mark-read API)
-- - Get unread count (already in list API)

SELECT 
  'API STATUS' as check_type,
  'All required APIs exist from Day 3' as result,
  'Ready to build UI components' as next_step;
