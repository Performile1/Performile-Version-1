-- =====================================================
-- CHECK IF POSTNORD COURIER EXISTS
-- =====================================================

-- Check if PostNord courier exists
SELECT 
  courier_id,
  courier_name,
  courier_code,
  is_active,
  user_id
FROM couriers 
WHERE courier_code = 'POSTNORD' OR courier_name ILIKE '%postnord%';

-- If no results, PostNord doesn't exist yet
-- You'll need to create it first
