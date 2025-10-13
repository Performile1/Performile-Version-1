-- =====================================================
-- CHECK AND ENABLE RLS ON ORDERS TABLE
-- =====================================================
-- Run this to verify and enable RLS policies

-- =====================================================
-- STEP 1: Check if RLS is enabled
-- =====================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'orders';

-- =====================================================
-- STEP 2: Check existing policies
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'orders';

-- =====================================================
-- STEP 3: Enable RLS on orders table
-- =====================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Drop existing policies (if any)
-- =====================================================
DROP POLICY IF EXISTS orders_select ON orders;
DROP POLICY IF EXISTS orders_insert ON orders;
DROP POLICY IF EXISTS orders_update ON orders;
DROP POLICY IF EXISTS orders_delete ON orders;

-- =====================================================
-- STEP 5: Create RLS policies for orders
-- =====================================================

-- SELECT policy: Users can see orders based on their role
CREATE POLICY orders_select ON orders
  FOR SELECT
  USING (
    -- Admins see everything
    is_admin() OR
    -- Merchants see orders from their stores
    (is_merchant() AND store_id IN (
      SELECT store_id FROM stores WHERE owner_user_id = current_user_id()
    )) OR
    -- Couriers see orders assigned to them
    (is_courier() AND courier_id IN (
      SELECT courier_id FROM couriers WHERE user_id = current_user_id()
    )) OR
    -- Consumers see their own orders
    (is_consumer() AND customer_id = current_user_id())
  );

-- INSERT policy: Only merchants and admins can create orders
CREATE POLICY orders_insert ON orders
  FOR INSERT
  WITH CHECK (
    is_admin() OR
    (is_merchant() AND store_id IN (
      SELECT store_id FROM stores WHERE owner_user_id = current_user_id()
    ))
  );

-- UPDATE policy: Merchants can update their orders, couriers can update assigned orders
CREATE POLICY orders_update ON orders
  FOR UPDATE
  USING (
    is_admin() OR
    (is_merchant() AND store_id IN (
      SELECT store_id FROM stores WHERE owner_user_id = current_user_id()
    )) OR
    (is_courier() AND courier_id IN (
      SELECT courier_id FROM couriers WHERE user_id = current_user_id()
    ))
  );

-- DELETE policy: Only admins and merchants can delete orders
CREATE POLICY orders_delete ON orders
  FOR DELETE
  USING (
    is_admin() OR
    (is_merchant() AND store_id IN (
      SELECT store_id FROM stores WHERE owner_user_id = current_user_id()
    ))
  );

-- =====================================================
-- STEP 6: Verify policies were created
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read orders'
    WHEN cmd = 'INSERT' THEN 'Create orders'
    WHEN cmd = 'UPDATE' THEN 'Update orders'
    WHEN cmd = 'DELETE' THEN 'Delete orders'
  END as description
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY cmd;

-- =====================================================
-- STEP 7: Test RLS with different roles
-- =====================================================

-- Test as admin (should see all orders)
SET app.user_role = 'admin';
SELECT COUNT(*) as admin_can_see FROM orders;

-- Test as merchant (should see only their store's orders)
-- Replace with actual merchant user_id
SET app.user_id = (SELECT user_id FROM users WHERE user_role = 'merchant' LIMIT 1);
SET app.user_role = 'merchant';
SELECT COUNT(*) as merchant_can_see FROM orders;

-- Test as courier (should see only assigned orders)
SET app.user_id = (SELECT user_id FROM users WHERE user_role = 'courier' LIMIT 1);
SET app.user_role = 'courier';
SELECT COUNT(*) as courier_can_see FROM orders;

-- Reset
RESET app.user_id;
RESET app.user_role;

SELECT '
========================================
✅ RLS POLICIES ENABLED ON ORDERS TABLE
========================================

Policies Created:
1. orders_select - Controls who can view orders
2. orders_insert - Controls who can create orders
3. orders_update - Controls who can update orders
4. orders_delete - Controls who can delete orders

Role-Based Access:
- Admin: See ALL orders
- Merchant: See orders from THEIR stores
- Courier: See orders ASSIGNED to them
- Consumer: See THEIR OWN orders

Next Steps:
1. Clear browser localStorage
2. Logout and login again
3. Test Orders page with different roles
4. Verify each role sees correct data

========================================
' as status;
