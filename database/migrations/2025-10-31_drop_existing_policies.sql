-- =====================================================
-- Drop Existing Objects for merchant_courier_selections
-- Run this FIRST if you get "already exists" errors
-- Date: October 31, 2025
-- =====================================================

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_merchant_courier_selections_updated_at ON merchant_courier_selections;

-- Drop policies
DROP POLICY IF EXISTS merchant_courier_selections_select_own ON merchant_courier_selections;
DROP POLICY IF EXISTS merchant_courier_selections_insert_own ON merchant_courier_selections;
DROP POLICY IF EXISTS merchant_courier_selections_update_own ON merchant_courier_selections;
DROP POLICY IF EXISTS merchant_courier_selections_delete_own ON merchant_courier_selections;
DROP POLICY IF EXISTS merchant_courier_selections_admin_all ON merchant_courier_selections;

-- Verification
SELECT 
  'Objects dropped successfully' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'merchant_courier_selections') as remaining_policies,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trigger_merchant_courier_selections_updated_at') as remaining_triggers;
