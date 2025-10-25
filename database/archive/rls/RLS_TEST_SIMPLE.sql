-- =====================================================
-- SIMPLE RLS TEST - RETURNS VISIBLE RESULTS
-- =====================================================

-- Step 1: Total orders baseline
SELECT 'BASELINE' as test, COUNT(*) as count FROM orders;

-- Step 2: Get test users
SELECT 'TEST USERS' as info, user_id, email, user_role 
FROM users 
WHERE user_role IN ('admin', 'merchant', 'courier', 'consumer')
ORDER BY user_role
LIMIT 10;

-- Step 3: Check RLS is enabled
SELECT 'RLS STATUS' as info, tablename, rowsecurity as enabled 
FROM pg_tables 
WHERE tablename = 'orders';

-- Step 4: Check policies exist
SELECT 'RLS POLICIES' as info, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'orders';

-- =====================================================
-- Now test each role manually
-- Copy a user_id from the results above and run these:
-- =====================================================

-- TEST ADMIN (replace with actual admin UUID)
-- SET app.user_id = 'paste-admin-uuid-here';
-- SET app.user_role = 'admin';
-- SELECT 'ADMIN TEST' as test, COUNT(*) as orders_visible FROM orders;
-- RESET app.user_id; RESET app.user_role;

-- TEST MERCHANT (replace with actual merchant UUID)
-- SET app.user_id = 'paste-merchant-uuid-here';
-- SET app.user_role = 'merchant';
-- SELECT 'MERCHANT TEST' as test, COUNT(*) as orders_visible FROM orders;
-- RESET app.user_id; RESET app.user_role;

-- TEST COURIER (replace with actual courier UUID)
-- SET app.user_id = 'paste-courier-uuid-here';
-- SET app.user_role = 'courier';
-- SELECT 'COURIER TEST' as test, COUNT(*) as orders_visible FROM orders;
-- RESET app.user_id; RESET app.user_role;

-- TEST CONSUMER (replace with actual consumer UUID)
-- SET app.user_id = 'paste-consumer-uuid-here';
-- SET app.user_role = 'consumer';
-- SELECT 'CONSUMER TEST' as test, COUNT(*) as orders_visible FROM orders;
-- RESET app.user_id; RESET app.user_role;
