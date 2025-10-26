-- =====================================================
-- REMOVE DUPLICATE ACTIONS
-- =====================================================
-- Purpose: Remove duplicate Create Task and Webhook Call entries
-- Date: October 26, 2025
-- =====================================================

-- Remove duplicate "Create Task" (keep only one)
DELETE FROM rule_engine_actions 
WHERE action_id IN (
  SELECT action_id 
  FROM (
    SELECT action_id, 
           ROW_NUMBER() OVER (PARTITION BY action_name, action_type ORDER BY created_at) as rn
    FROM rule_engine_actions
    WHERE action_name = 'Create Task' AND action_type = 'custom'
  ) t
  WHERE rn > 1
);

-- Remove duplicate "Webhook Call" (keep only one)
DELETE FROM rule_engine_actions 
WHERE action_id IN (
  SELECT action_id 
  FROM (
    SELECT action_id, 
           ROW_NUMBER() OVER (PARTITION BY action_name, action_type ORDER BY created_at) as rn
    FROM rule_engine_actions
    WHERE action_name = 'Webhook Call' AND action_type = 'custom'
  ) t
  WHERE rn > 1
);

-- Verify final count
SELECT 
  action_type,
  COUNT(*) as action_count,
  STRING_AGG(action_name, ', ' ORDER BY action_name) as actions
FROM rule_engine_actions
GROUP BY action_type
ORDER BY action_type;

-- Total count
SELECT COUNT(*) as total_actions FROM rule_engine_actions;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_count FROM rule_engine_actions;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'DUPLICATE ACTIONS REMOVED';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Removed duplicates:';
  RAISE NOTICE '  - Create Task (duplicate)';
  RAISE NOTICE '  - Webhook Call (duplicate)';
  RAISE NOTICE '';
  RAISE NOTICE 'Final action count: %', v_total_count;
  RAISE NOTICE 'Expected: 30 unique actions';
  RAISE NOTICE '==============================================';
END $$;
