-- ============================================================================
-- UPDATE TEST USER NAMES
-- ============================================================================
-- Purpose: Update test user names to be clearly identifiable as test accounts
-- Date: November 7, 2025
-- ============================================================================
-- 
-- Changes:
-- - Merchant: "Merchant Demo" → "Test Merchant"
-- - Courier: "Courier Driver" → "Test Courier"
-- - Consumer: "Consumer User" → "Test Consumer"
-- - Admin: "Admin User" → "Test Admin" (for consistency)
--
-- ⚠️  IMPORTANT: Run this in your Supabase SQL Editor
-- ============================================================================

-- Update Merchant user
UPDATE Users
SET 
    first_name = 'Test',
    last_name = 'Merchant',
    updated_at = NOW()
WHERE email = 'merchant@performile.com';

-- Update Courier user
UPDATE Users
SET 
    first_name = 'Test',
    last_name = 'Courier',
    updated_at = NOW()
WHERE email = 'courier@performile.com';

-- Update Consumer user
UPDATE Users
SET 
    first_name = 'Test',
    last_name = 'Consumer',
    updated_at = NOW()
WHERE email = 'consumer@performile.com';

-- Update Admin user (for consistency)
UPDATE Users
SET 
    first_name = 'Test',
    last_name = 'Admin',
    updated_at = NOW()
WHERE email = 'admin@performile.com';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that users were updated successfully
SELECT 
    '✅ UPDATED TEST USERS' as section,
    email,
    user_role,
    first_name,
    last_name,
    CONCAT(first_name, ' ', last_name) as full_name,
    updated_at
FROM Users
WHERE email IN (
    'admin@performile.com',
    'merchant@performile.com',
    'courier@performile.com',
    'consumer@performile.com'
)
ORDER BY user_role;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ TEST USER NAMES UPDATED SUCCESSFULLY!                      ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📧 UPDATED USER NAMES:';
    RAISE NOTICE '   ┌─────────────────────────────────────────────────────────┐';
    RAISE NOTICE '   │ Admin:                                                  │';
    RAISE NOTICE '   │   Email: admin@performile.com                           │';
    RAISE NOTICE '   │   Name: Test Admin                                      │';
    RAISE NOTICE '   └─────────────────────────────────────────────────────────┘';
    RAISE NOTICE '';
    RAISE NOTICE '   ┌─────────────────────────────────────────────────────────┐';
    RAISE NOTICE '   │ Merchant:                                               │';
    RAISE NOTICE '   │   Email: merchant@performile.com                        │';
    RAISE NOTICE '   │   Name: Test Merchant                                   │';
    RAISE NOTICE '   └─────────────────────────────────────────────────────────┘';
    RAISE NOTICE '';
    RAISE NOTICE '   ┌─────────────────────────────────────────────────────────┐';
    RAISE NOTICE '   │ Courier:                                                │';
    RAISE NOTICE '   │   Email: courier@performile.com                         │';
    RAISE NOTICE '   │   Name: Test Courier                                    │';
    RAISE NOTICE '   └─────────────────────────────────────────────────────────┘';
    RAISE NOTICE '';
    RAISE NOTICE '   ┌─────────────────────────────────────────────────────────┐';
    RAISE NOTICE '   │ Consumer:                                               │';
    RAISE NOTICE '   │   Email: consumer@performile.com                        │';
    RAISE NOTICE '   │   Name: Test Consumer                                   │';
    RAISE NOTICE '   └─────────────────────────────────────────────────────────┘';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 RESULT:';
    RAISE NOTICE '   ✅ All test users now have "Test" prefix';
    RAISE NOTICE '   ✅ Clearly identifiable as test accounts';
    RAISE NOTICE '   ✅ No more "Demo" references';
    RAISE NOTICE '';
    RAISE NOTICE '📝 NEXT STEPS:';
    RAISE NOTICE '   1. Verify names in production UI';
    RAISE NOTICE '   2. Test login still works';
    RAISE NOTICE '   3. Check dashboard displays correct names';
    RAISE NOTICE '';
END $$;
