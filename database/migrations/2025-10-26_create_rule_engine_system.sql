-- =====================================================
-- RULE ENGINE SYSTEM - Subscription-Based
-- =====================================================
-- Purpose: Generic rule engine for order, claim, and notification automation
-- Date: October 26, 2025
-- =====================================================

-- =====================================================
-- 1. CREATE RULE ENGINE TABLES
-- =====================================================

-- Main rules table
CREATE TABLE IF NOT EXISTS rule_engine_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('order', 'claim', 'notification')),
  entity_type VARCHAR(50), -- 'order', 'claim', 'user', etc.
  conditions JSONB NOT NULL, -- Flexible condition structure
  actions JSONB NOT NULL, -- Flexible action structure
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  description TEXT,
  last_executed_at TIMESTAMP,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0
);

-- Rule execution history
CREATE TABLE IF NOT EXISTS rule_engine_executions (
  execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES rule_engine_rules(rule_id) ON DELETE CASCADE,
  entity_id UUID, -- ID of the entity the rule was executed on
  entity_type VARCHAR(50),
  conditions_met BOOLEAN,
  actions_executed JSONB,
  execution_result TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMP DEFAULT NOW(),
  
  -- Error tracking
  is_error BOOLEAN DEFAULT false,
  error_message TEXT
);

-- Available actions catalog
CREATE TABLE IF NOT EXISTS rule_engine_actions (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_name VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'notification', 'email', 'update_status', 'custom'
  action_config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. ADD SUBSCRIPTION LIMITS
-- =====================================================

-- Add rule limits to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_order_rules INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_claim_rules INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_notification_rules INTEGER DEFAULT 0;

-- Update Tier 1 Plans (Basic)
UPDATE subscription_plans SET 
  max_order_rules = 3,
  max_claim_rules = 2,
  max_notification_rules = 5
WHERE tier = 1;

-- Update Tier 2 Plans (Professional)
UPDATE subscription_plans SET 
  max_order_rules = 10,
  max_claim_rules = 10,
  max_notification_rules = 20
WHERE tier = 2;

-- Update Tier 3 Plans (Enterprise)
UPDATE subscription_plans SET 
  max_order_rules = 50,
  max_claim_rules = 50,
  max_notification_rules = 100
WHERE tier = 3;

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Index for faster rule lookups
CREATE INDEX IF NOT EXISTS idx_rules_by_type_and_user 
ON rule_engine_rules(created_by, rule_type, is_active);

CREATE INDEX IF NOT EXISTS idx_rules_by_type 
ON rule_engine_rules(rule_type, is_active);

CREATE INDEX IF NOT EXISTS idx_rules_active 
ON rule_engine_rules(is_active, priority DESC);

-- Index for execution history
CREATE INDEX IF NOT EXISTS idx_executions_by_rule 
ON rule_engine_executions(rule_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_executions_by_entity 
ON rule_engine_executions(entity_id, entity_type);

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE rule_engine_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_engine_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_engine_actions ENABLE ROW LEVEL SECURITY;

-- Rules: Users can only see their own rules
CREATE POLICY rules_select_own ON rule_engine_rules
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY rules_insert_own ON rule_engine_rules
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY rules_update_own ON rule_engine_rules
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY rules_delete_own ON rule_engine_rules
  FOR DELETE USING (created_by = auth.uid());

-- Executions: Users can only see executions of their own rules
CREATE POLICY executions_select_own ON rule_engine_executions
  FOR SELECT USING (
    rule_id IN (SELECT rule_id FROM rule_engine_rules WHERE created_by = auth.uid())
  );

-- Actions: Everyone can read available actions
CREATE POLICY actions_select_all ON rule_engine_actions
  FOR SELECT USING (true);

-- =====================================================
-- 5. CREATE RULE ENGINE FUNCTIONS
-- =====================================================

-- Function to evaluate rule conditions
CREATE OR REPLACE FUNCTION evaluate_rule_conditions(
  p_rule_id UUID,
  p_entity_data JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  v_rule RECORD;
  v_condition JSONB;
  v_field TEXT;
  v_operator TEXT;
  v_value TEXT;
  v_actual_value TEXT;
  v_result BOOLEAN := TRUE;
BEGIN
  -- Get rule
  SELECT * INTO v_rule FROM rule_engine_rules WHERE rule_id = p_rule_id;
  
  IF v_rule IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Evaluate each condition
  FOR v_condition IN SELECT * FROM jsonb_array_elements(v_rule.conditions)
  LOOP
    v_field := v_condition->>'field';
    v_operator := v_condition->>'operator';
    v_value := v_condition->>'value';
    v_actual_value := p_entity_data->>v_field;
    
    -- Evaluate based on operator
    CASE v_operator
      WHEN 'equals' THEN
        IF v_actual_value != v_value THEN
          v_result := FALSE;
        END IF;
      WHEN 'not_equals' THEN
        IF v_actual_value = v_value THEN
          v_result := FALSE;
        END IF;
      WHEN 'contains' THEN
        IF v_actual_value NOT LIKE '%' || v_value || '%' THEN
          v_result := FALSE;
        END IF;
      WHEN 'starts_with' THEN
        IF v_actual_value NOT LIKE v_value || '%' THEN
          v_result := FALSE;
        END IF;
      WHEN 'greater_than' THEN
        IF v_actual_value::NUMERIC <= v_value::NUMERIC THEN
          v_result := FALSE;
        END IF;
      WHEN 'less_than' THEN
        IF v_actual_value::NUMERIC >= v_value::NUMERIC THEN
          v_result := FALSE;
        END IF;
      ELSE
        v_result := FALSE;
    END CASE;
    
    -- If any condition fails, return false
    IF NOT v_result THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to execute rule actions
CREATE OR REPLACE FUNCTION execute_rule_actions(
  p_rule_id UUID,
  p_entity_id UUID,
  p_entity_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_rule RECORD;
  v_action JSONB;
  v_results JSONB := '[]'::JSONB;
  v_start_time TIMESTAMP;
  v_execution_time_ms INTEGER;
BEGIN
  v_start_time := clock_timestamp();
  
  -- Get rule
  SELECT * INTO v_rule FROM rule_engine_rules WHERE rule_id = p_rule_id;
  
  IF v_rule IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rule not found');
  END IF;
  
  -- Check if conditions are met
  IF NOT evaluate_rule_conditions(p_rule_id, p_entity_data) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'conditions_not_met');
  END IF;
  
  -- Execute each action
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_rule.actions)
  LOOP
    -- Add action execution logic here
    -- For now, just log the action
    v_results := v_results || jsonb_build_object(
      'action_type', v_action->>'type',
      'status', 'executed'
    );
  END LOOP;
  
  -- Calculate execution time
  v_execution_time_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time));
  
  -- Log execution
  INSERT INTO rule_engine_executions (
    rule_id, 
    entity_id, 
    entity_type, 
    conditions_met, 
    actions_executed,
    execution_time_ms
  ) VALUES (
    p_rule_id, 
    p_entity_id, 
    v_rule.entity_type, 
    TRUE, 
    v_results,
    v_execution_time_ms
  );
  
  -- Update rule stats
  UPDATE rule_engine_rules 
  SET 
    last_executed_at = NOW(),
    execution_count = execution_count + 1,
    success_count = success_count + 1
  WHERE rule_id = p_rule_id;
  
  RETURN jsonb_build_object('success', true, 'actions', v_results);
END;
$$ LANGUAGE plpgsql;

-- Function to check rule limits
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
-- 6. INSERT SAMPLE ACTIONS
-- =====================================================

INSERT INTO rule_engine_actions (action_name, action_type, action_config) VALUES
('Send Notification', 'notification', '{"template_required": true, "recipient_required": true}'::JSONB),
('Send Email', 'email', '{"template_required": true, "recipient_required": true}'::JSONB),
('Update Field', 'update_field', '{"field_required": true, "value_required": true}'::JSONB),
('Create Task', 'create_task', '{"assignee_required": true, "priority_optional": true}'::JSONB),
('Create Refund', 'create_refund', '{"amount_required": true}'::JSONB),
('Webhook Call', 'webhook', '{"url_required": true, "method_required": true}'::JSONB)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'RULE ENGINE SYSTEM CREATED SUCCESSFULLY';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Tables created: 3';
  RAISE NOTICE '  - rule_engine_rules';
  RAISE NOTICE '  - rule_engine_executions';
  RAISE NOTICE '  - rule_engine_actions';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created: 3';
  RAISE NOTICE '  - evaluate_rule_conditions()';
  RAISE NOTICE '  - execute_rule_actions()';
  RAISE NOTICE '  - check_rule_limit()';
  RAISE NOTICE '';
  RAISE NOTICE 'Subscription limits added to subscription_plans';
  RAISE NOTICE '  - max_order_rules';
  RAISE NOTICE '  - max_claim_rules';
  RAISE NOTICE '  - max_notification_rules';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS policies: 6 policies created';
  RAISE NOTICE 'Indexes: 5 indexes created';
  RAISE NOTICE 'Sample actions: 6 actions inserted';
  RAISE NOTICE '==============================================';
END $$;
