-- ============================================================================
-- COMPARE NOTIFICATION PREFERENCES COLUMNS
-- ============================================================================
-- Date: October 23, 2025, 8:44 AM
-- Purpose: Compare column structures to determine if tables are duplicates
-- ============================================================================

-- notification_preferences (11 columns)
SELECT 
    'notification_preferences' as table_name,
    ordinal_position,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- notificationpreferences (21 columns)
SELECT 
    'notificationpreferences' as table_name,
    ordinal_position,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'notificationpreferences'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for overlapping column names
SELECT 
    'OVERLAPPING COLUMNS' as analysis,
    column_name
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
  AND table_schema = 'public'
  AND column_name IN (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'notificationpreferences'
      AND table_schema = 'public'
  )
ORDER BY column_name;

-- Check unique columns in notification_preferences
SELECT 
    'UNIQUE TO notification_preferences' as analysis,
    column_name
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
  AND table_schema = 'public'
  AND column_name NOT IN (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'notificationpreferences'
      AND table_schema = 'public'
  )
ORDER BY column_name;

-- Check unique columns in notificationpreferences
SELECT 
    'UNIQUE TO notificationpreferences' as analysis,
    column_name
FROM information_schema.columns
WHERE table_name = 'notificationpreferences'
  AND table_schema = 'public'
  AND column_name NOT IN (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'notification_preferences'
      AND table_schema = 'public'
  )
ORDER BY column_name;
