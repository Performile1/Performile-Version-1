-- ============================================================================
-- WEEK 2 - DAY 3: REAL-TIME METRICS VALIDATION
-- Date: October 17, 2025
-- Purpose: Validate if we need new tables for real-time metrics
-- ============================================================================

-- ============================================================================
-- 1. CHECK EXISTING TABLES FOR REAL-TIME FEATURES
-- ============================================================================

-- Check for notifications table
SELECT 
  'notifications' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check for notification_preferences table
SELECT 
  'notification_preferences' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notification_preferences'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check for real-time events/metrics table
SELECT 
  'analytics_events' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'analytics_events'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check for websocket/realtime related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%event%' 
    OR table_name LIKE '%notification%'
    OR table_name LIKE '%realtime%'
    OR table_name LIKE '%websocket%'
  )
ORDER BY table_name;

-- ============================================================================
-- 2. CHECK IF NOTIFICATIONS TABLE EXISTS AND ITS STRUCTURE
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. CHECK EXISTING ANALYTICS TABLES FOR REAL-TIME CAPABILITY
-- ============================================================================

-- Check if platform_analytics has recent data
SELECT 
  'platform_analytics' as table_name,
  MAX(metric_date) as latest_date,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN metric_date >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as recent_rows
FROM platform_analytics;

-- Check if shopanalyticssnapshots has recent data
SELECT 
  'shopanalyticssnapshots' as table_name,
  MAX(snapshot_date) as latest_date,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN snapshot_date >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as recent_rows
FROM shopanalyticssnapshots;

-- Check if courier_analytics has recent data
SELECT 
  'courier_analytics' as table_name,
  MAX(last_calculated) as latest_calculation,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN last_calculated >= CURRENT_TIMESTAMP - INTERVAL '1 day' THEN 1 END) as recent_rows
FROM courier_analytics;

-- ============================================================================
-- 4. CHECK FOR ACTIVITY/AUDIT LOG TABLES
-- ============================================================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%activity%' 
    OR table_name LIKE '%audit%'
    OR table_name LIKE '%log%'
  )
ORDER BY table_name;

-- ============================================================================
-- 5. DECISION: DO WE NEED NEW TABLES?
-- ============================================================================

-- Summary of what we need for Day 3:
-- 1. Real-time metrics API (can use existing analytics tables)
-- 2. Notifications system (need to check if notifications table exists)
-- 3. Live updates (can use polling or websockets with existing data)

-- If notifications table doesn't exist, we'll need to create:
-- - notifications (main table)
-- - notification_preferences (user preferences)

-- If analytics_events doesn't exist, we MAY need it for:
-- - Tracking real-time events
-- - Activity feed
-- - Live metrics updates

SELECT 
  'VALIDATION COMPLETE' as status,
  'Check results above to determine if new tables needed' as next_step;
