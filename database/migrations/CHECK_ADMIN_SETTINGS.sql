-- ============================================================================
-- CHECK ADMIN SETTINGS & MANAGEMENT CAPABILITIES
-- Date: October 17, 2025
-- Purpose: Validate what admin management features exist
-- ============================================================================

-- ============================================================================
-- 1. CHECK SUBSCRIPTION MANAGEMENT TABLES
-- ============================================================================

-- Check subscription_plans table
SELECT 
  'subscription_plans' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'subscription_plans'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Show subscription_plans structure
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- Check if we have max_reports_per_month column
SELECT 
  'max_reports_per_month' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans'
    AND column_name = 'max_reports_per_month'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING - NEED TO ADD' END as status;

-- ============================================================================
-- 2. CHECK USER ROLES MANAGEMENT
-- ============================================================================

-- Check users table for role column
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name LIKE '%role%'
ORDER BY ordinal_position;

-- Check what roles exist in database
SELECT DISTINCT 
  user_role as role,
  COUNT(*) as user_count
FROM users
GROUP BY user_role
ORDER BY user_count DESC;

-- Check if we have a roles table
SELECT 
  'roles' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'roles'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check if we have a permissions table
SELECT 
  'permissions' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'permissions'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check if we have a role_permissions table
SELECT 
  'role_permissions' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'role_permissions'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- ============================================================================
-- 3. CHECK FEATURE FLAGS / PERMISSIONS
-- ============================================================================

-- Check if subscription_plans has features JSONB
SELECT 
  plan_name,
  features
FROM subscription_plans
LIMIT 3;

-- ============================================================================
-- 4. SUMMARY: WHAT'S MISSING?
-- ============================================================================

SELECT 
  'ADMIN SETTINGS VALIDATION' as check_type,
  'Check results above' as result;

-- NEEDED FOR FULL ADMIN CONTROL:
-- 1. Subscription Plan Management (EXISTS - SubscriptionManagement.tsx)
-- 2. User Role Management (MISSING - Need to create)
-- 3. Feature Flags Management (PARTIAL - features JSONB exists)
-- 4. Permissions Management (MISSING - Need to create)

SELECT 
  'RECOMMENDATION' as item,
  'Create: RoleManagement.tsx, FeatureFlagsSettings.tsx' as action,
  'Add: max_reports_per_month to subscription_plans' as database_change;
