-- =====================================================
-- SINGLE QUERY AUDIT - All checks in one result
-- =====================================================

SELECT 
  '1. RLS Enabled' as check_name,
  rowsecurity::text as result,
  'Should be: true' as expected
FROM pg_tables 
WHERE tablename = 'orders'

UNION ALL

SELECT 
  '2. RLS Policies Count',
  COUNT(*)::text,
  'Should be: 4 (admin, merchant, courier, consumer)'
FROM pg_policies 
WHERE tablename = 'orders'

UNION ALL

SELECT 
  '3. Total Stores',
  COUNT(*)::text,
  'Should be: 11'
FROM stores

UNION ALL

SELECT 
  '4. Total Orders',
  COUNT(*)::text,
  'Should be: 105'
FROM orders

UNION ALL

SELECT 
  '5. Unique Stores with Orders',
  COUNT(DISTINCT store_id)::text,
  'Should be: 11'
FROM orders

UNION ALL

SELECT 
  '6. Admin User Exists',
  CASE WHEN COUNT(*) > 0 THEN 'Yes' ELSE 'No' END,
  'Should be: Yes'
FROM users
WHERE email = 'admin@performile.com' AND user_role = 'admin'

UNION ALL

SELECT 
  '7. Admin Owns Stores',
  CASE WHEN COUNT(*) > 0 THEN 'Yes (' || COUNT(*)::text || ')' ELSE 'No' END,
  'Should be: No'
FROM stores s
JOIN users u ON s.owner_user_id = u.user_id
WHERE u.email = 'admin@performile.com'

UNION ALL

SELECT 
  '8. Old Demo Electronics Store Exists',
  CASE WHEN COUNT(*) > 0 THEN 'Yes (' || COUNT(*)::text || ')' ELSE 'No' END,
  'Should be: No'
FROM stores
WHERE store_name LIKE '%Electronics%' 
   OR store_name LIKE '%Merchant%Store%'
   OR store_name LIKE '%Rickard%Store%'

UNION ALL

SELECT 
  '9. Orders with NULL store_id',
  COUNT(*)::text,
  'Should be: 0'
FROM orders
WHERE store_id IS NULL

UNION ALL

SELECT 
  '10. Most Recent Order Date',
  MAX(created_at)::text,
  'Should be recent (2025-10-03 or later)'
FROM orders

ORDER BY check_name;
