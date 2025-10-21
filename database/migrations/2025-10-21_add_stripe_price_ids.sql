/**
 * ADD STRIPE PRICE IDs TO SUBSCRIPTION PLANS
 * Update subscription plans with Stripe product and price IDs
 * Run this AFTER creating products in Stripe Dashboard
 */

-- Add Stripe columns to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_price_id_monthly VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_price_id_yearly VARCHAR(255);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_product ON subscription_plans(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price_monthly ON subscription_plans(stripe_price_id_monthly);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price_yearly ON subscription_plans(stripe_price_id_yearly);

-- ============================================================================
-- UPDATE WITH YOUR STRIPE IDs (Replace with actual IDs from Stripe Dashboard)
-- ============================================================================

-- MERCHANT PLANS
UPDATE subscription_plans 
SET 
    stripe_product_id = 'prod_XXXXXXXXXXXXXXXX',  -- Replace with actual Stripe product ID
    stripe_price_id_monthly = 'price_XXXXXXXXXXXXXXXX',  -- Replace with monthly price ID
    stripe_price_id_yearly = 'price_XXXXXXXXXXXXXXXX'   -- Replace with yearly price ID
WHERE plan_slug = 'merchant-starter';

UPDATE subscription_plans 
SET 
    stripe_product_id = 'prod_XXXXXXXXXXXXXXXX',
    stripe_price_id_monthly = 'price_XXXXXXXXXXXXXXXX',
    stripe_price_id_yearly = 'price_XXXXXXXXXXXXXXXX'
WHERE plan_slug = 'merchant-growth';

UPDATE subscription_plans 
SET 
    stripe_product_id = 'prod_XXXXXXXXXXXXXXXX',
    stripe_price_id_monthly = 'price_XXXXXXXXXXXXXXXX',
    stripe_price_id_yearly = 'price_XXXXXXXXXXXXXXXX'
WHERE plan_slug = 'merchant-enterprise';

-- COURIER PLANS
UPDATE subscription_plans 
SET 
    stripe_product_id = 'prod_XXXXXXXXXXXXXXXX',
    stripe_price_id_monthly = 'price_XXXXXXXXXXXXXXXX',
    stripe_price_id_yearly = 'price_XXXXXXXXXXXXXXXX'
WHERE plan_slug = 'courier-individual';

UPDATE subscription_plans 
SET 
    stripe_product_id = 'prod_XXXXXXXXXXXXXXXX',
    stripe_price_id_monthly = 'price_XXXXXXXXXXXXXXXX',
    stripe_price_id_yearly = 'price_XXXXXXXXXXXXXXXX'
WHERE plan_slug = 'courier-professional';

UPDATE subscription_plans 
SET 
    stripe_product_id = 'prod_XXXXXXXXXXXXXXXX',
    stripe_price_id_monthly = 'price_XXXXXXXXXXXXXXXX',
    stripe_price_id_yearly = 'price_XXXXXXXXXXXXXXXX'
WHERE plan_slug = 'courier-fleet';

UPDATE subscription_plans 
SET 
    stripe_product_id = 'prod_XXXXXXXXXXXXXXXX',
    stripe_price_id_monthly = 'price_XXXXXXXXXXXXXXXX',
    stripe_price_id_yearly = 'price_XXXXXXXXXXXXXXXX'
WHERE plan_slug = 'courier-enterprise';

-- Verify updates
SELECT 
    plan_name,
    plan_slug,
    monthly_price,
    annual_price,
    stripe_product_id,
    stripe_price_id_monthly,
    stripe_price_id_yearly
FROM subscription_plans
ORDER BY user_type, tier;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================

/*
HOW TO USE THIS SCRIPT:

1. Create products in Stripe Dashboard first:
   - Go to https://dashboard.stripe.com/test/products
   - Click "Add product" for each plan
   - Set name, description, and pricing
   - Copy the product ID (prod_xxx) and price IDs (price_xxx)

2. Replace the XXXXXXXXXXXXXXXX placeholders above with your actual IDs

3. Run this script in Supabase

4. Verify the IDs are saved correctly

EXAMPLE:
UPDATE subscription_plans 
SET 
    stripe_product_id = 'prod_ABC123DEF456',
    stripe_price_id_monthly = 'price_1ABC123DEF456',
    stripe_price_id_yearly = 'price_2ABC123DEF456'
WHERE plan_slug = 'merchant-starter';
*/
