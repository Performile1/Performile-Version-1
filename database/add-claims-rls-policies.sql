-- =====================================================
-- Claims RLS Policies
-- =====================================================
-- Requirements:
-- - Merchants: Can create claims and see their own
-- - Consumers: Can create claims and see their own  
-- - Couriers: Can see claims related to their deliveries
-- - Admin: Can create claims and see all claims
-- =====================================================
-- NOTE: Run fix-claims-add-claimant-id.sql first if you get
--       "column claimant_id does not exist" error
-- =====================================================

-- Enable RLS on claims table
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS claims_select_policy ON claims;
DROP POLICY IF EXISTS claims_insert_policy ON claims;
DROP POLICY IF EXISTS claims_update_policy ON claims;
DROP POLICY IF EXISTS claims_delete_policy ON claims;

-- =====================================================
-- SELECT Policy: Who can see which claims
-- =====================================================
CREATE POLICY claims_select_policy ON claims
FOR SELECT
USING (
  -- Admin can see all claims
  (current_setting('app.current_user_role', true) = 'admin')
  OR
  -- Users can see their own claims (merchant or consumer)
  (claimant_id::text = current_setting('app.current_user_id', true))
  OR
  -- Couriers can see claims for orders they delivered
  (
    current_setting('app.current_user_role', true) = 'courier'
    AND order_id IN (
      SELECT order_id 
      FROM orders 
      WHERE courier_id::text = current_setting('app.current_user_id', true)
    )
  )
);

-- =====================================================
-- INSERT Policy: Who can create claims
-- =====================================================
CREATE POLICY claims_insert_policy ON claims
FOR INSERT
WITH CHECK (
  -- Admin can create claims
  (current_setting('app.current_user_role', true) = 'admin')
  OR
  -- Merchants can create claims
  (current_setting('app.current_user_role', true) = 'merchant')
  OR
  -- Consumers can create claims
  (current_setting('app.current_user_role', true) = 'consumer')
  OR
  -- Couriers can create claims for their own deliveries
  (
    current_setting('app.current_user_role', true) = 'courier'
    AND order_id IN (
      SELECT order_id 
      FROM orders 
      WHERE courier_id::text = current_setting('app.current_user_id', true)
    )
  )
);

-- =====================================================
-- UPDATE Policy: Who can update claims
-- =====================================================
CREATE POLICY claims_update_policy ON claims
FOR UPDATE
USING (
  -- Admin can update all claims
  (current_setting('app.current_user_role', true) = 'admin')
  OR
  -- Users can update their own claims (if not submitted yet)
  (
    claimant_id::text = current_setting('app.current_user_id', true)
    AND claim_status IN ('draft', 'pending')
  )
  OR
  -- Couriers can update claims for their deliveries (add responses)
  (
    current_setting('app.current_user_role', true) = 'courier'
    AND order_id IN (
      SELECT order_id 
      FROM orders 
      WHERE courier_id::text = current_setting('app.current_user_id', true)
    )
  )
);

-- =====================================================
-- DELETE Policy: Who can delete claims
-- =====================================================
CREATE POLICY claims_delete_policy ON claims
FOR DELETE
USING (
  -- Admin can delete all claims
  (current_setting('app.current_user_role', true) = 'admin')
  OR
  -- Users can delete their own draft claims
  (
    claimant_id::text = current_setting('app.current_user_id', true)
    AND claim_status = 'draft'
  )
);

-- =====================================================
-- RLS for claim_timeline table
-- =====================================================
ALTER TABLE claim_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS claim_timeline_select_policy ON claim_timeline;
DROP POLICY IF EXISTS claim_timeline_insert_policy ON claim_timeline;

-- Timeline SELECT: Same as claims
CREATE POLICY claim_timeline_select_policy ON claim_timeline
FOR SELECT
USING (
  claim_id IN (
    SELECT claim_id FROM claims
    -- Inherits claims SELECT policy
  )
);

-- Timeline INSERT: Anyone who can see the claim can add timeline events
CREATE POLICY claim_timeline_insert_policy ON claim_timeline
FOR INSERT
WITH CHECK (
  claim_id IN (
    SELECT claim_id FROM claims
    -- Inherits claims SELECT policy
  )
);

-- =====================================================
-- RLS for claim_communications table
-- =====================================================
ALTER TABLE claim_communications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS claim_communications_select_policy ON claim_communications;
DROP POLICY IF EXISTS claim_communications_insert_policy ON claim_communications;

-- Communications SELECT: Same as claims
CREATE POLICY claim_communications_select_policy ON claim_communications
FOR SELECT
USING (
  claim_id IN (
    SELECT claim_id FROM claims
    -- Inherits claims SELECT policy
  )
);

-- Communications INSERT: Anyone who can see the claim can add messages
CREATE POLICY claim_communications_insert_policy ON claim_communications
FOR INSERT
WITH CHECK (
  claim_id IN (
    SELECT claim_id FROM claims
    -- Inherits claims SELECT policy
  )
);

-- =====================================================
-- Test Queries
-- =====================================================

-- Test as merchant
/*
SET app.current_user_id = 'merchant-uuid-here';
SET app.current_user_role = 'merchant';
SELECT * FROM claims; -- Should see only their claims
*/

-- Test as courier
/*
SET app.current_user_id = 'courier-uuid-here';
SET app.current_user_role = 'courier';
SELECT * FROM claims; -- Should see claims for their deliveries
*/

-- Test as admin
/*
SET app.current_user_id = 'admin-uuid-here';
SET app.current_user_role = 'admin';
SELECT * FROM claims; -- Should see all claims
*/

-- Test as consumer
/*
SET app.current_user_id = 'consumer-uuid-here';
SET app.current_user_role = 'consumer';
SELECT * FROM claims; -- Should see only their claims
*/

SELECT 'Claims RLS policies created successfully!' as status;
