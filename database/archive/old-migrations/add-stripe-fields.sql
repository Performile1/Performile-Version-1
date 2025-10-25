-- =====================================================
-- Add Stripe Integration Fields
-- =====================================================
-- Adds Stripe customer ID to users table
-- Adds Stripe price ID to subscription plans
-- =====================================================

-- Add stripe_customer_id to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

-- Add stripe_price_id to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price ON subscription_plans(stripe_price_id) WHERE stripe_price_id IS NOT NULL;

-- Success message
SELECT 'Stripe fields added successfully!' as status;
