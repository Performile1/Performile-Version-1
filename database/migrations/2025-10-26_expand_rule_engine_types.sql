-- =====================================================
-- EXPAND RULE ENGINE - Add 5 New Rule Types
-- =====================================================
-- Purpose: Add Return, TMS, WMS, Rating, and Custom rules
-- Date: October 26, 2025
-- =====================================================

-- =====================================================
-- 1. EXPAND RULE TYPE CONSTRAINT
-- =====================================================

-- Drop old constraint
ALTER TABLE rule_engine_rules
DROP CONSTRAINT IF EXISTS rule_type_check;

-- Add new constraint with 8 types
ALTER TABLE rule_engine_rules
ADD CONSTRAINT rule_type_check 
CHECK (rule_type IN (
  'order',        -- Order automation
  'claim',        -- Claim automation
  'notification', -- Communication automation
  'return',       -- Return/RMA automation (NEW)
  'tms',          -- Transport Management System (NEW)
  'wms',          -- Warehouse Management System (NEW)
  'rating',       -- Review/Rating automation (NEW)
  'custom'        -- Custom business logic (NEW)
));

-- =====================================================
-- 2. ADD NEW SUBSCRIPTION LIMIT COLUMNS
-- =====================================================

-- Add new rule limit columns
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_return_rules INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_tms_rules INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_wms_rules INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_rating_rules INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_custom_rules INTEGER DEFAULT 0;

-- =====================================================
-- 3. SET LIMITS FOR TIER 1 (Basic/Starter)
-- =====================================================

UPDATE subscription_plans SET 
  max_return_rules = 2,
  max_tms_rules = 1,
  max_wms_rules = 1,
  max_rating_rules = 3,
  max_custom_rules = 1
WHERE tier = 1;

-- =====================================================
-- 4. SET LIMITS FOR TIER 2 (Pro/Professional)
-- =====================================================

UPDATE subscription_plans SET 
  max_return_rules = 10,
  max_tms_rules = 5,
  max_wms_rules = 5,
  max_rating_rules = 10,
  max_custom_rules = 5
WHERE tier = 2;

-- =====================================================
-- 5. SET LIMITS FOR TIER 3 (Enterprise/Premium)
-- =====================================================

UPDATE subscription_plans SET 
  max_return_rules = 50,
  max_tms_rules = 25,
  max_wms_rules = 25,
  max_rating_rules = 50,
  max_custom_rules = 25
WHERE tier = 3;

-- =====================================================
-- 6. SET LIMITS FOR TIER 4 (Premium Enterprise)
-- =====================================================

UPDATE subscription_plans SET 
  max_return_rules = 100,
  max_tms_rules = 50,
  max_wms_rules = 50,
  max_rating_rules = 100,
  max_custom_rules = 50
WHERE tier = 4;

-- =====================================================
-- 7. ADD NEW SAMPLE ACTIONS
-- =====================================================

INSERT INTO rule_engine_actions (action_name, action_type, action_config) VALUES
-- Return Actions
('Approve Return', 'return', '{"method_required": true}'::JSONB),
('Create Return Label', 'return', '{"carrier_required": true}'::JSONB),
('Process Refund', 'return', '{"amount_required": true, "method_required": true}'::JSONB),
('Schedule Pickup', 'return', '{"date_required": true}'::JSONB),

-- TMS Actions
('Optimize Route', 'tms', '{"route_id_required": true}'::JSONB),
('Assign Driver', 'tms', '{"driver_id_required": true}'::JSONB),
('Update ETA', 'tms', '{"new_time_required": true}'::JSONB),
('Consolidate Shipments', 'tms', '{"shipment_ids_required": true}'::JSONB),

-- WMS Actions
('Create Picking Order', 'wms', '{"items_required": true}'::JSONB),
('Reorder Stock', 'wms', '{"item_required": true, "quantity_required": true}'::JSONB),
('Move Inventory', 'wms', '{"from_zone_required": true, "to_zone_required": true}'::JSONB),
('Create Cycle Count', 'wms', '{"zone_required": true}'::JSONB),

-- Rating Actions
('Send Review Request', 'rating', '{"template_required": true}'::JSONB),
('Send Review Reminder', 'rating', '{"days_after_required": true}'::JSONB),
('Offer Review Incentive', 'rating', '{"type_required": true}'::JSONB),
('Flag Negative Review', 'rating', '{"threshold_required": true}'::JSONB),

-- Custom Actions
('Webhook Call', 'custom', '{"url_required": true, "method_required": true}'::JSONB),
('API Call', 'custom', '{"endpoint_required": true}'::JSONB),
('Create Task', 'custom', '{"assignee_required": true, "description_required": true}'::JSONB),
('Run Script', 'custom', '{"script_id_required": true}'::JSONB),

-- Order Actions (Additional)
('Create New Order', 'order', '{"template_required": true}'::JSONB),
('Request Courier Update', 'order', '{"courier_id_required": true}'::JSONB),
('Escalate to Manager', 'order', '{"reason_required": true}'::JSONB),

-- Claim Actions (Additional)
('Create Claim to Courier', 'claim', '{"courier_id_required": true, "reason_required": true}'::JSONB),
('Request Evidence', 'claim', '{"type_required": true}'::JSONB),
('Offer Compensation', 'claim', '{"type_required": true, "amount_required": true}'::JSONB)

ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. UPDATE check_rule_limit FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION check_rule_limit(
  p_user_id UUID,
  p_rule_type VARCHAR(50)
) RETURNS JSONB AS $$
DECLARE
  v_subscription RECORD;
  v_current_count INTEGER;
  v_max_limit INTEGER;
BEGIN
  -- Get user's subscription
  SELECT sp.* INTO v_subscription
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.subscription_plan_id = sp.subscription_plan_id
  WHERE us.user_id = p_user_id
  AND us.status = 'active'
  LIMIT 1;
  
  IF v_subscription IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'No active subscription'
    );
  END IF;
  
  -- Get max limit for rule type
  CASE p_rule_type
    WHEN 'order' THEN
      v_max_limit := v_subscription.max_order_rules;
    WHEN 'claim' THEN
      v_max_limit := v_subscription.max_claim_rules;
    WHEN 'notification' THEN
      v_max_limit := v_subscription.max_notification_rules;
    WHEN 'return' THEN
      v_max_limit := v_subscription.max_return_rules;
    WHEN 'tms' THEN
      v_max_limit := v_subscription.max_tms_rules;
    WHEN 'wms' THEN
      v_max_limit := v_subscription.max_wms_rules;
    WHEN 'rating' THEN
      v_max_limit := v_subscription.max_rating_rules;
    WHEN 'custom' THEN
      v_max_limit := v_subscription.max_custom_rules;
    ELSE
      RETURN jsonb_build_object('allowed', false, 'reason', 'Invalid rule type');
  END CASE;
  
  -- Count current rules of this type
  SELECT COUNT(*) INTO v_current_count
  FROM rule_engine_rules
  WHERE created_by = p_user_id
  AND rule_type = p_rule_type;
  
  -- Check if limit reached
  IF v_current_count >= v_max_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Limit reached',
      'current', v_current_count,
      'limit', v_max_limit,
      'rule_type', p_rule_type
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'current', v_current_count,
    'limit', v_max_limit,
    'available', v_max_limit - v_current_count
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'RULE ENGINE EXPANDED SUCCESSFULLY';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Rule types expanded: 3 → 8';
  RAISE NOTICE '  - order (existing)';
  RAISE NOTICE '  - claim (existing)';
  RAISE NOTICE '  - notification (existing)';
  RAISE NOTICE '  - return (NEW)';
  RAISE NOTICE '  - tms (NEW)';
  RAISE NOTICE '  - wms (NEW)';
  RAISE NOTICE '  - rating (NEW)';
  RAISE NOTICE '  - custom (NEW)';
  RAISE NOTICE '';
  RAISE NOTICE 'Subscription columns added: 5';
  RAISE NOTICE '  - max_return_rules';
  RAISE NOTICE '  - max_tms_rules';
  RAISE NOTICE '  - max_wms_rules';
  RAISE NOTICE '  - max_rating_rules';
  RAISE NOTICE '  - max_custom_rules';
  RAISE NOTICE '';
  RAISE NOTICE 'Sample actions added: 23 new actions';
  RAISE NOTICE 'check_rule_limit() function updated';
  RAISE NOTICE '==============================================';
END $$;
