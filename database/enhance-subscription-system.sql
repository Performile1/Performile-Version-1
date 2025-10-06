-- =====================================================
-- Enhanced Subscription System
-- =====================================================
-- Adds trial tracking, plan change history, and cancellation policies
-- =====================================================

-- Add trial tracking fields to user_subscriptions
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS plan_changes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_plan_change_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS previous_plan_id INTEGER,
ADD COLUMN IF NOT EXISTS scheduled_plan_change_id INTEGER,
ADD COLUMN IF NOT EXISTS scheduled_plan_change_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_effective_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_policy VARCHAR(50) DEFAULT '30_days'; -- '30_days', 'immediate', 'end_of_period'

-- Create plan change history table
CREATE TABLE IF NOT EXISTS subscription_plan_changes (
  change_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES user_subscriptions(subscription_id) ON DELETE CASCADE,
  
  -- Change details
  from_plan_id INTEGER REFERENCES subscription_plans(plan_id),
  to_plan_id INTEGER REFERENCES subscription_plans(plan_id),
  change_type VARCHAR(50) NOT NULL, -- 'upgrade', 'downgrade', 'initial'
  
  -- Trial information
  had_trial BOOLEAN DEFAULT FALSE,
  trial_days INTEGER,
  
  -- Pricing
  old_price DECIMAL(10, 2),
  new_price DECIMAL(10, 2),
  prorated_amount DECIMAL(10, 2),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  effective_date TIMESTAMP,
  
  -- Metadata
  reason TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_change_type CHECK (change_type IN ('upgrade', 'downgrade', 'initial', 'reactivation')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Create cancellation requests table
CREATE TABLE IF NOT EXISTS subscription_cancellations (
  cancellation_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES user_subscriptions(subscription_id) ON DELETE CASCADE,
  
  -- Cancellation details
  requested_at TIMESTAMP DEFAULT NOW(),
  effective_date TIMESTAMP NOT NULL,
  policy_applied VARCHAR(50) NOT NULL, -- '30_days', 'immediate', 'end_of_period'
  
  -- Reason
  reason_category VARCHAR(100), -- 'too_expensive', 'not_using', 'missing_features', 'switching', 'other'
  reason_text TEXT,
  
  -- Retention
  retention_offer_made BOOLEAN DEFAULT FALSE,
  retention_offer_accepted BOOLEAN DEFAULT FALSE,
  retention_offer_details TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled', 'retained'
  completed_at TIMESTAMP,
  
  -- Metadata
  refund_amount DECIMAL(10, 2),
  refund_processed BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT valid_policy CHECK (policy_applied IN ('30_days', 'immediate', 'end_of_period')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'cancelled', 'retained'))
);

-- Function to check if user can get trial
CREATE OR REPLACE FUNCTION can_user_get_trial(p_user_id UUID)
RETURNS TABLE (
  can_get_trial BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_has_used_trial BOOLEAN;
  v_trial_used_at TIMESTAMP;
BEGIN
  -- Check if user has ever used a trial
  SELECT has_used_trial, trial_used_at
  INTO v_has_used_trial, v_trial_used_at
  FROM user_subscriptions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_has_used_trial THEN
    RETURN QUERY SELECT 
      FALSE,
      format('Trial already used on %s', v_trial_used_at::DATE);
  ELSE
    RETURN QUERY SELECT 
      TRUE,
      'Eligible for 14-day free trial';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate plan change type
CREATE OR REPLACE FUNCTION get_plan_change_type(
  p_from_plan_id INTEGER,
  p_to_plan_id INTEGER
)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_from_tier INTEGER;
  v_to_tier INTEGER;
  v_from_price DECIMAL(10, 2);
  v_to_price DECIMAL(10, 2);
BEGIN
  -- Get plan tiers and prices
  SELECT tier, monthly_price INTO v_from_tier, v_from_price
  FROM subscription_plans WHERE plan_id = p_from_plan_id;
  
  SELECT tier, monthly_price INTO v_to_tier, v_to_price
  FROM subscription_plans WHERE plan_id = p_to_plan_id;

  -- Determine change type
  IF v_to_tier > v_from_tier OR v_to_price > v_from_price THEN
    RETURN 'upgrade';
  ELSIF v_to_tier < v_from_tier OR v_to_price < v_from_price THEN
    RETURN 'downgrade';
  ELSE
    RETURN 'lateral';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate cancellation effective date
CREATE OR REPLACE FUNCTION calculate_cancellation_date(
  p_subscription_id INTEGER,
  p_policy VARCHAR(50)
)
RETURNS TIMESTAMP AS $$
DECLARE
  v_current_period_end TIMESTAMP;
BEGIN
  SELECT current_period_end INTO v_current_period_end
  FROM user_subscriptions
  WHERE subscription_id = p_subscription_id;

  CASE p_policy
    WHEN '30_days' THEN
      RETURN NOW() + INTERVAL '30 days';
    WHEN 'immediate' THEN
      RETURN NOW();
    WHEN 'end_of_period' THEN
      RETURN v_current_period_end;
    ELSE
      RETURN NOW() + INTERVAL '30 days'; -- Default to 30 days
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to process plan change
CREATE OR REPLACE FUNCTION process_plan_change(
  p_user_id UUID,
  p_new_plan_id INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  change_id INTEGER,
  requires_payment BOOLEAN,
  has_trial BOOLEAN
) AS $$
DECLARE
  v_current_subscription_id INTEGER;
  v_current_plan_id INTEGER;
  v_change_type VARCHAR(50);
  v_can_get_trial BOOLEAN;
  v_new_change_id INTEGER;
  v_requires_payment BOOLEAN;
  v_has_trial BOOLEAN;
BEGIN
  -- Get current subscription
  SELECT subscription_id, plan_id
  INTO v_current_subscription_id, v_current_plan_id
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Determine change type
  IF v_current_plan_id IS NULL THEN
    v_change_type := 'initial';
  ELSE
    v_change_type := get_plan_change_type(v_current_plan_id, p_new_plan_id);
  END IF;

  -- Check trial eligibility
  SELECT can_get_trial INTO v_can_get_trial
  FROM can_user_get_trial(p_user_id);

  -- Determine if payment is required
  v_requires_payment := (v_change_type = 'upgrade' OR v_change_type = 'initial') AND NOT v_can_get_trial;
  v_has_trial := v_can_get_trial AND v_change_type = 'initial';

  -- Create plan change record
  INSERT INTO subscription_plan_changes (
    user_id, subscription_id, from_plan_id, to_plan_id,
    change_type, had_trial, reason, status
  ) VALUES (
    p_user_id, v_current_subscription_id, v_current_plan_id, p_new_plan_id,
    v_change_type, v_has_trial, p_reason, 'pending'
  ) RETURNING change_id INTO v_new_change_id;

  RETURN QUERY SELECT 
    TRUE,
    format('Plan change to %s initiated', v_change_type),
    v_new_change_id,
    v_requires_payment,
    v_has_trial;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plan_changes_user ON subscription_plan_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_changes_subscription ON subscription_plan_changes(subscription_id);
CREATE INDEX IF NOT EXISTS idx_plan_changes_status ON subscription_plan_changes(status);
CREATE INDEX IF NOT EXISTS idx_cancellations_user ON subscription_cancellations(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_status ON subscription_cancellations(status);

-- Success message
SELECT 'Enhanced subscription system created successfully!' as status;
