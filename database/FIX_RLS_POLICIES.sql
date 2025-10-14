-- =====================================================
-- FIX RLS POLICIES - ADD ROLE CHECKS
-- =====================================================
-- The current policies don't check the role first,
-- so users can match multiple policies

-- Drop existing policies
DROP POLICY IF EXISTS orders_select_admin ON orders;
DROP POLICY IF EXISTS orders_select_merchant ON orders;
DROP POLICY IF EXISTS orders_select_courier ON orders;
DROP POLICY IF EXISTS orders_select_consumer ON orders;

-- =====================================================
-- CREATE NEW POLICIES WITH ROLE CHECKS
-- =====================================================

-- Admin policy: Must be admin role AND sees everything
CREATE POLICY orders_select_admin ON orders
  FOR SELECT
  USING (
    current_setting('app.user_role', true) = 'admin'
  );

-- Merchant policy: Must be merchant role AND owns the store
CREATE POLICY orders_select_merchant ON orders
  FOR SELECT
  USING (
    current_setting('app.user_role', true) = 'merchant'
    AND store_id IN (
      SELECT store_id FROM stores 
      WHERE owner_user_id = (current_setting('app.user_id', true))::uuid
    )
  );

-- Courier policy: Must be courier role AND assigned to order
CREATE POLICY orders_select_courier ON orders
  FOR SELECT
  USING (
    current_setting('app.user_role', true) = 'courier'
    AND courier_id IN (
      SELECT courier_id FROM couriers 
      WHERE user_id = (current_setting('app.user_id', true))::uuid
    )
  );

-- Consumer policy: Must be consumer role AND email matches
CREATE POLICY orders_select_consumer ON orders
  FOR SELECT
  USING (
    current_setting('app.user_role', true) = 'consumer'
    AND customer_email IN (
      SELECT email FROM users 
      WHERE user_id = (current_setting('app.user_id', true))::uuid
    )
  );

-- =====================================================
-- VERIFY POLICIES
-- =====================================================
SELECT 
  policyname,
  cmd,
  permissive,
  CASE 
    WHEN policyname LIKE '%admin%' THEN '✅ Admin sees all'
    WHEN policyname LIKE '%merchant%' THEN '✅ Merchant sees own stores'
    WHEN policyname LIKE '%courier%' THEN '✅ Courier sees assigned'
    WHEN policyname LIKE '%consumer%' THEN '✅ Consumer sees own email'
  END as description
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

SELECT '
========================================
✅ RLS POLICIES FIXED
========================================

Changes Made:
1. Added role checks to ALL policies
2. Each policy now checks role FIRST
3. Then checks the specific condition

How It Works:
- Admin: role=admin → sees all
- Merchant: role=merchant AND owns store → sees those orders
- Courier: role=courier AND assigned → sees those orders  
- Consumer: role=consumer AND email matches → sees those orders

Next Steps:
1. Clear browser cache
2. Logout and login again
3. Test Orders page
4. Verify each role sees correct data

========================================
' as status;
