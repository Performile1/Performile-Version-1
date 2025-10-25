-- =====================================================
-- Subscription System - Complete Implementation
-- =====================================================
-- Allows admin to create/manage subscription plans
-- Tracks user subscriptions and usage
-- Enforces limits based on plan
-- =====================================================

-- Drop existing tables if they exist (for clean install)
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS ecommerce_integrations CASCADE;

-- =====================================================
-- Subscription Plans Table
-- =====================================================
CREATE TABLE subscription_plans (
  plan_id SERIAL PRIMARY KEY,
  plan_name VARCHAR(100) NOT NULL,
  plan_slug VARCHAR(50) NOT NULL UNIQUE, -- 'starter', 'professional', 'enterprise'
  user_type VARCHAR(20) NOT NULL, -- 'merchant' or 'courier'
  tier INTEGER NOT NULL, -- 1, 2, or 3
  
  -- Pricing
  monthly_price DECIMAL(10,2) NOT NULL,
  annual_price DECIMAL(10,2), -- Optional annual pricing
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Limits
  max_orders_per_month INTEGER,
  max_emails_per_month INTEGER,
  max_sms_per_month INTEGER,
  max_push_notifications_per_month INTEGER, -- NULL = unlimited
  max_couriers INTEGER, -- For merchants
  max_team_members INTEGER, -- For couriers
  max_shops INTEGER, -- For merchants
  
  -- Features (JSON for flexibility)
  features JSONB DEFAULT '{}',
  -- Example: {"custom_templates": true, "api_access": true, "white_label": false}
  
  -- Display
  description TEXT,
  is_popular BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE, -- Show in pricing page
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_user_type CHECK (user_type IN ('merchant', 'courier')),
  CONSTRAINT valid_tier CHECK (tier IN (1, 2, 3)),
  CONSTRAINT positive_price CHECK (monthly_price >= 0)
);

-- =====================================================
-- User Subscriptions Table
-- =====================================================
CREATE TABLE user_subscriptions (
  subscription_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES subscription_plans(plan_id),
  
  -- Billing
  status VARCHAR(50) DEFAULT 'active', 
  -- active, cancelled, expired, past_due, trialing
  current_period_start TIMESTAMP DEFAULT NOW(),
  current_period_end TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
  
  -- Stripe integration
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  
  -- Usage tracking (resets monthly)
  orders_used_this_month INTEGER DEFAULT 0,
  emails_sent_this_month INTEGER DEFAULT 0,
  sms_sent_this_month INTEGER DEFAULT 0,
  push_notifications_sent_this_month INTEGER DEFAULT 0,
  last_usage_reset TIMESTAMP DEFAULT NOW(),
  
  -- Trial
  trial_end TIMESTAMP,
  trial_days INTEGER DEFAULT 14,
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
  CONSTRAINT unique_active_subscription UNIQUE (user_id, status) 
    DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================
-- Usage Logs Table (for analytics)
-- =====================================================
CREATE TABLE usage_logs (
  log_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES user_subscriptions(subscription_id) ON DELETE SET NULL,
  
  -- Usage details
  usage_type VARCHAR(50) NOT NULL, -- 'order', 'email', 'sms', 'push', 'api_call'
  quantity INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}', -- Additional context
  
  -- Timestamps
  logged_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_usage_type CHECK (usage_type IN ('order', 'email', 'sms', 'push', 'api_call'))
);

-- =====================================================
-- Email Templates Table (Custom per merchant)
-- =====================================================
CREATE TABLE email_templates (
  template_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Template info
  template_name VARCHAR(100) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- 'review_request', 'review_reminder', 'welcome', 'notification'
  
  -- Customization
  subject_line VARCHAR(255),
  custom_text TEXT,
  logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#667eea', -- Hex color
  secondary_color VARCHAR(7) DEFAULT '#764ba2',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_template_type CHECK (template_type IN ('review_request', 'review_reminder', 'welcome', 'notification', 'password_reset')),
  CONSTRAINT unique_user_template UNIQUE (user_id, template_type)
);

-- =====================================================
-- E-commerce Integrations Table
-- =====================================================
CREATE TABLE ecommerce_integrations (
  integration_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Platform
  platform VARCHAR(50) NOT NULL, -- 'shopify', 'woocommerce', etc.
  
  -- Connection details (encrypted in application)
  store_url VARCHAR(255),
  store_name VARCHAR(255),
  api_key TEXT, -- Encrypted
  api_secret TEXT, -- Encrypted
  webhook_secret VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, error, disconnected
  last_sync_at TIMESTAMP,
  last_error TEXT,
  
  -- Settings
  auto_send_review_requests BOOLEAN DEFAULT TRUE,
  review_delay_days INTEGER DEFAULT 0, -- Days after delivery to send review
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_platform CHECK (platform IN ('shopify', 'woocommerce', 'opencart', 'prestashop', 'magento', 'wix', 'squarespace')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'error', 'disconnected'))
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Subscription plans
CREATE INDEX idx_subscription_plans_user_type ON subscription_plans(user_type, is_active);
CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier, user_type);

-- User subscriptions
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_period ON user_subscriptions(current_period_end);
CREATE INDEX idx_user_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);

-- Usage logs
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id, logged_at DESC);
CREATE INDEX idx_usage_logs_type ON usage_logs(usage_type, logged_at DESC);
CREATE INDEX idx_usage_logs_subscription ON usage_logs(subscription_id);

-- Email templates
CREATE INDEX idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);

-- E-commerce integrations
CREATE INDEX idx_ecommerce_integrations_user_id ON ecommerce_integrations(user_id);
CREATE INDEX idx_ecommerce_integrations_platform ON ecommerce_integrations(platform);
CREATE INDEX idx_ecommerce_integrations_status ON ecommerce_integrations(status);

-- =====================================================
-- Seed Default Subscription Plans
-- =====================================================

-- Merchant Plans
INSERT INTO subscription_plans (
  plan_name, plan_slug, user_type, tier, monthly_price, annual_price,
  max_orders_per_month, max_emails_per_month, max_sms_per_month, 
  max_push_notifications_per_month, max_couriers, max_shops,
  description, features, is_popular, display_order
) VALUES
-- Tier 1: Starter
(
  'Starter', 'merchant-starter', 'merchant', 1, 29.00, 290.00,
  100, 500, 0, NULL, 5, 1,
  'Perfect for small businesses getting started with delivery management',
  '{"custom_templates": false, "api_access": false, "white_label": false, "priority_support": false, "advanced_analytics": false}',
  FALSE, 1
),
-- Tier 2: Professional
(
  'Professional', 'merchant-professional', 'merchant', 2, 79.00, 790.00,
  500, 2000, 100, NULL, 20, 3,
  'Ideal for growing businesses with multiple locations',
  '{"custom_templates": true, "api_access": true, "white_label": false, "priority_support": true, "advanced_analytics": true}',
  TRUE, 2
),
-- Tier 3: Enterprise
(
  'Enterprise', 'merchant-enterprise', 'merchant', 3, 199.00, 1990.00,
  NULL, NULL, 500, NULL, NULL, NULL,
  'Complete solution for large enterprises with unlimited needs',
  '{"custom_templates": true, "api_access": true, "white_label": true, "priority_support": true, "advanced_analytics": true, "dedicated_manager": true}',
  FALSE, 3
);

-- Courier Plans
INSERT INTO subscription_plans (
  plan_name, plan_slug, user_type, tier, monthly_price, annual_price,
  max_orders_per_month, max_emails_per_month, max_sms_per_month,
  max_push_notifications_per_month, max_team_members,
  description, features, is_popular, display_order
) VALUES
-- Tier 1: Individual
(
  'Individual', 'courier-individual', 'courier', 1, 19.00, 190.00,
  50, 200, 0, NULL, 1,
  'Perfect for independent couriers starting out',
  '{"enhanced_profile": false, "priority_listing": false, "team_management": false, "advanced_analytics": false}',
  FALSE, 1
),
-- Tier 2: Professional
(
  'Professional', 'courier-professional', 'courier', 2, 49.00, 490.00,
  200, 1000, 50, NULL, 3,
  'Ideal for professional couriers with small teams',
  '{"enhanced_profile": true, "priority_listing": true, "team_management": true, "advanced_analytics": true}',
  TRUE, 2
),
-- Tier 3: Fleet
(
  'Fleet', 'courier-fleet', 'courier', 3, 149.00, 1490.00,
  NULL, NULL, 200, NULL, NULL,
  'Complete solution for courier fleets and agencies',
  '{"enhanced_profile": true, "priority_listing": true, "team_management": true, "advanced_analytics": true, "fleet_dashboard": true, "api_access": true}',
  FALSE, 3
);

-- =====================================================
-- Functions for Usage Tracking
-- =====================================================

-- Function to check if user has exceeded limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_usage_type VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_current_usage INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get active subscription
  SELECT us.*, sp.*
  INTO v_subscription
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.plan_id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
  LIMIT 1;
  
  -- No subscription = no limits (free tier or admin)
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  -- Get current usage based on type
  CASE p_usage_type
    WHEN 'order' THEN
      v_current_usage := v_subscription.orders_used_this_month;
      v_limit := v_subscription.max_orders_per_month;
    WHEN 'email' THEN
      v_current_usage := v_subscription.emails_sent_this_month;
      v_limit := v_subscription.max_emails_per_month;
    WHEN 'sms' THEN
      v_current_usage := v_subscription.sms_sent_this_month;
      v_limit := v_subscription.max_sms_per_month;
    WHEN 'push' THEN
      v_current_usage := v_subscription.push_notifications_sent_this_month;
      v_limit := v_subscription.max_push_notifications_per_month;
    ELSE
      RETURN TRUE; -- Unknown type, allow
  END CASE;
  
  -- NULL limit = unlimited
  IF v_limit IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if under limit
  RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to log usage
CREATE OR REPLACE FUNCTION log_usage(
  p_user_id UUID,
  p_usage_type VARCHAR(50),
  p_quantity INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
DECLARE
  v_subscription_id INTEGER;
BEGIN
  -- Get active subscription ID
  SELECT subscription_id INTO v_subscription_id
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  LIMIT 1;
  
  -- Log usage
  INSERT INTO usage_logs (user_id, subscription_id, usage_type, quantity, metadata)
  VALUES (p_user_id, v_subscription_id, p_usage_type, p_quantity, p_metadata);
  
  -- Update subscription usage counter
  IF v_subscription_id IS NOT NULL THEN
    CASE p_usage_type
      WHEN 'order' THEN
        UPDATE user_subscriptions 
        SET orders_used_this_month = orders_used_this_month + p_quantity
        WHERE subscription_id = v_subscription_id;
      WHEN 'email' THEN
        UPDATE user_subscriptions 
        SET emails_sent_this_month = emails_sent_this_month + p_quantity
        WHERE subscription_id = v_subscription_id;
      WHEN 'sms' THEN
        UPDATE user_subscriptions 
        SET sms_sent_this_month = sms_sent_this_month + p_quantity
        WHERE subscription_id = v_subscription_id;
      WHEN 'push' THEN
        UPDATE user_subscriptions 
        SET push_notifications_sent_this_month = push_notifications_sent_this_month + p_quantity
        WHERE subscription_id = v_subscription_id;
    END CASE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly usage (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS INTEGER AS $$
DECLARE
  v_reset_count INTEGER;
BEGIN
  UPDATE user_subscriptions
  SET 
    orders_used_this_month = 0,
    emails_sent_this_month = 0,
    sms_sent_this_month = 0,
    push_notifications_sent_this_month = 0,
    last_usage_reset = NOW()
  WHERE status = 'active'
    AND current_period_end < NOW();
  
  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  RETURN v_reset_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE subscription_plans IS 'Subscription plans managed by admin';
COMMENT ON TABLE user_subscriptions IS 'Active user subscriptions with usage tracking';
COMMENT ON TABLE usage_logs IS 'Detailed usage logs for analytics';
COMMENT ON TABLE email_templates IS 'Custom email templates per merchant';
COMMENT ON TABLE ecommerce_integrations IS 'E-commerce platform connections';

COMMENT ON COLUMN subscription_plans.features IS 'JSON object with feature flags';
COMMENT ON COLUMN user_subscriptions.cancel_at_period_end IS 'Cancel subscription at end of current period';
COMMENT ON COLUMN usage_logs.metadata IS 'Additional context (order_id, email_to, etc.)';

-- =====================================================
-- Verification
-- =====================================================
SELECT 
  'Subscription system created successfully!' as status,
  COUNT(*) as plans_created
FROM subscription_plans;

-- Show created plans
SELECT 
  plan_name,
  user_type,
  tier,
  monthly_price,
  max_orders_per_month,
  max_emails_per_month
FROM subscription_plans
ORDER BY user_type, tier;
