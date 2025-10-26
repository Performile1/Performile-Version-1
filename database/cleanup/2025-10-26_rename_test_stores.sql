-- =====================================================
-- RENAME TEST STORES TO PRODUCTION NAMES
-- =====================================================
-- Purpose: Update test/demo store names to production-ready names
-- Date: October 26, 2025
-- Option: Minimal cleanup - keep all data, just rename
-- =====================================================

-- =====================================================
-- STEP 1: REVIEW CURRENT STORES
-- =====================================================

SELECT '📋 CURRENT STORES (Before Rename)' as section;

SELECT 
  store_id,
  store_name,
  owner_user_id,
  (SELECT email FROM users WHERE user_id = stores.owner_user_id) as owner_email,
  is_active,
  created_at
FROM stores
ORDER BY created_at;

-- =====================================================
-- STEP 2: RENAME STORES (OPTIONAL - UNCOMMENT TO RUN)
-- =====================================================

-- Example: Rename "Demo Store" to a production name
-- UPDATE stores 
-- SET 
--   store_name = 'My Store',
--   updated_at = NOW()
-- WHERE store_name = 'Demo Store';

-- Example: Rename "Test Store" to a production name
-- UPDATE stores 
-- SET 
--   store_name = 'Production Store',
--   updated_at = NOW()
-- WHERE store_name LIKE '%Test%';

-- =====================================================
-- STEP 3: VERIFY CHANGES
-- =====================================================

SELECT '✅ STORES AFTER RENAME (Run after uncommenting updates)' as section;

SELECT 
  store_id,
  store_name,
  owner_user_id,
  (SELECT email FROM users WHERE user_id = stores.owner_user_id) as owner_email,
  is_active,
  updated_at
FROM stores
ORDER BY created_at;

-- =====================================================
-- NOTES
-- =====================================================

/*
OPTION C: MINIMAL CLEANUP - SAFE APPROACH

✅ KEEP:
- All 42 users (including 18 test users)
- All 23 orders (including 3 test orders)
- All 3 stores (just rename if needed)
- All 12 couriers (including 2 test couriers)

📝 ACTIONS:
1. Review store names above
2. Uncomment UPDATE statements to rename
3. Run verification query
4. Document what's test vs production

⚠️ WHY KEEP TEST DATA:
- Test users useful for demos
- Test orders show system working
- Test stores may have real data
- Test couriers for testing integrations

🎯 PRODUCTION READINESS:
- System is functional with current data
- Can add real users/stores alongside test data
- Test data helps with onboarding
- Easy to identify (test/demo in names)

📚 NEXT STEPS:
1. Rename stores if desired
2. Document test vs production users
3. Add real production data
4. Keep test data for demos/testing
*/
