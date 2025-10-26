-- =====================================================
-- STANDARDIZE ACTION TYPES
-- =====================================================
-- Purpose: Fix inconsistent action_type values
-- Date: October 26, 2025
-- =====================================================

-- Update Create Refund (should be 'return' not 'create_refund')
UPDATE rule_engine_actions 
SET action_type = 'return'
WHERE action_name = 'Create Refund' 
AND action_type = 'create_refund';

-- Update Create Task (should be 'custom' not 'create_task')
UPDATE rule_engine_actions 
SET action_type = 'custom'
WHERE action_name = 'Create Task' 
AND action_type = 'create_task';

-- Update Update Field (should be 'order' not 'update_field')
UPDATE rule_engine_actions 
SET action_type = 'order'
WHERE action_name = 'Update Field' 
AND action_type = 'update_field';

-- Update Webhook Call (should be 'custom' not 'webhook')
UPDATE rule_engine_actions 
SET action_type = 'custom'
WHERE action_name = 'Webhook Call' 
AND action_type = 'webhook';

-- Remove duplicate "Create Task" entry (keep the 'custom' one)
DELETE FROM rule_engine_actions 
WHERE action_name = 'Create Task' 
AND action_type = 'create_task';

-- Verify standardization
SELECT action_name, action_type 
FROM rule_engine_actions
ORDER BY action_type, action_name;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'ACTION TYPES STANDARDIZED';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Updated action types:';
  RAISE NOTICE '  - Create Refund: create_refund → return';
  RAISE NOTICE '  - Create Task: create_task → custom';
  RAISE NOTICE '  - Update Field: update_field → order';
  RAISE NOTICE '  - Webhook Call: webhook → custom';
  RAISE NOTICE '';
  RAISE NOTICE 'Removed duplicate Create Task entry';
  RAISE NOTICE '==============================================';
END $$;
