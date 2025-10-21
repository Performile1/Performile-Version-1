/**
 * AUTO-SYNC STRIPE WHEN SUBSCRIPTION PLANS CHANGE
 * This creates a trigger that marks plans as needing sync
 * Then a background job can sync them to Stripe
 */

-- Add sync tracking columns
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS needs_stripe_sync BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- Create sync log table
CREATE TABLE IF NOT EXISTS stripe_sync_log (
    sync_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_plan_id INTEGER REFERENCES subscription_plans(subscription_plan_id),
    action VARCHAR(50) NOT NULL, -- 'create', 'update_product', 'update_price'
    old_values JSONB,
    new_values JSONB,
    stripe_product_id VARCHAR(255),
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    synced_at TIMESTAMP DEFAULT NOW()
);

-- Index for sync log
CREATE INDEX idx_stripe_sync_log_plan ON stripe_sync_log(subscription_plan_id);
CREATE INDEX idx_stripe_sync_log_synced_at ON stripe_sync_log(synced_at DESC);

-- Function to mark plan as needing sync
CREATE OR REPLACE FUNCTION mark_plan_for_stripe_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if relevant fields changed
    IF (TG_OP = 'INSERT') OR
       (OLD.plan_name IS DISTINCT FROM NEW.plan_name) OR
       (OLD.plan_description IS DISTINCT FROM NEW.plan_description) OR
       (OLD.monthly_price IS DISTINCT FROM NEW.monthly_price) OR
       (OLD.annual_price IS DISTINCT FROM NEW.annual_price) OR
       (OLD.features IS DISTINCT FROM NEW.features) OR
       (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
        
        -- Mark as needing sync
        NEW.needs_stripe_sync = true;
        
        -- Log the change
        INSERT INTO stripe_sync_log (
            subscription_plan_id,
            action,
            old_values,
            new_values
        ) VALUES (
            NEW.subscription_plan_id,
            CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
            CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END,
            row_to_json(NEW)
        );
        
        RAISE NOTICE 'Plan % marked for Stripe sync', NEW.plan_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_stripe_sync ON subscription_plans;
CREATE TRIGGER trigger_stripe_sync
    BEFORE INSERT OR UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION mark_plan_for_stripe_sync();

-- Function to get plans needing sync
CREATE OR REPLACE FUNCTION get_plans_needing_sync()
RETURNS TABLE (
    subscription_plan_id INTEGER,
    plan_name VARCHAR,
    plan_slug VARCHAR,
    monthly_price DECIMAL,
    annual_price DECIMAL,
    stripe_product_id VARCHAR,
    stripe_price_id_monthly VARCHAR,
    stripe_price_id_yearly VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.subscription_plan_id,
        sp.plan_name,
        sp.plan_slug,
        sp.monthly_price,
        sp.annual_price,
        sp.stripe_product_id,
        sp.stripe_price_id_monthly,
        sp.stripe_price_id_yearly
    FROM subscription_plans sp
    WHERE sp.needs_stripe_sync = true
    ORDER BY sp.updated_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark plan as synced
CREATE OR REPLACE FUNCTION mark_plan_synced(
    p_plan_id INTEGER,
    p_product_id VARCHAR,
    p_monthly_price_id VARCHAR,
    p_yearly_price_id VARCHAR,
    p_success BOOLEAN DEFAULT true,
    p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE subscription_plans
    SET 
        needs_stripe_sync = false,
        last_synced_at = NOW(),
        stripe_product_id = p_product_id,
        stripe_price_id_monthly = p_monthly_price_id,
        stripe_price_id_yearly = p_yearly_price_id,
        sync_error = p_error,
        updated_at = NOW()
    WHERE subscription_plan_id = p_plan_id;
    
    -- Update sync log
    UPDATE stripe_sync_log
    SET 
        success = p_success,
        error_message = p_error,
        stripe_product_id = p_product_id,
        stripe_price_id_monthly = p_monthly_price_id,
        stripe_price_id_yearly = p_yearly_price_id
    WHERE subscription_plan_id = p_plan_id
    AND synced_at = (
        SELECT MAX(synced_at) 
        FROM stripe_sync_log 
        WHERE subscription_plan_id = p_plan_id
    );
END;
$$ LANGUAGE plpgsql;

-- View for sync status
CREATE OR REPLACE VIEW stripe_sync_status AS
SELECT 
    sp.subscription_plan_id,
    sp.plan_name,
    sp.plan_slug,
    sp.monthly_price,
    sp.annual_price,
    sp.needs_stripe_sync,
    sp.last_synced_at,
    sp.sync_error,
    sp.stripe_product_id IS NOT NULL as has_stripe_product,
    sp.stripe_price_id_monthly IS NOT NULL as has_monthly_price,
    sp.stripe_price_id_yearly IS NOT NULL as has_yearly_price,
    (
        SELECT COUNT(*) 
        FROM stripe_sync_log 
        WHERE subscription_plan_id = sp.subscription_plan_id
    ) as sync_attempts,
    (
        SELECT COUNT(*) 
        FROM stripe_sync_log 
        WHERE subscription_plan_id = sp.subscription_plan_id 
        AND success = true
    ) as successful_syncs
FROM subscription_plans sp
ORDER BY sp.needs_stripe_sync DESC, sp.updated_at DESC;

-- Comments
COMMENT ON COLUMN subscription_plans.needs_stripe_sync IS 'Flag indicating plan needs to be synced to Stripe';
COMMENT ON COLUMN subscription_plans.last_synced_at IS 'Last time plan was successfully synced to Stripe';
COMMENT ON COLUMN subscription_plans.sync_error IS 'Last sync error message if sync failed';
COMMENT ON TABLE stripe_sync_log IS 'Log of all Stripe sync attempts';
COMMENT ON VIEW stripe_sync_status IS 'View showing sync status of all plans';

-- Initial sync - mark all existing plans for sync
UPDATE subscription_plans 
SET needs_stripe_sync = true 
WHERE stripe_product_id IS NULL;

-- Display sync status
SELECT * FROM stripe_sync_status;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*
-- Check which plans need syncing:
SELECT * FROM get_plans_needing_sync();

-- View sync status:
SELECT * FROM stripe_sync_status;

-- View sync history:
SELECT 
    sl.synced_at,
    sp.plan_name,
    sl.action,
    sl.success,
    sl.error_message
FROM stripe_sync_log sl
JOIN subscription_plans sp ON sp.subscription_plan_id = sl.subscription_plan_id
ORDER BY sl.synced_at DESC
LIMIT 20;

-- Mark a plan as synced (called by sync script):
SELECT mark_plan_synced(
    1, -- plan_id
    'prod_ABC123', -- product_id
    'price_1ABC123', -- monthly_price_id
    'price_2ABC123', -- yearly_price_id
    true, -- success
    NULL -- error
);

-- Test: Update a price (will trigger sync flag)
UPDATE subscription_plans 
SET monthly_price = 39 
WHERE plan_slug = 'merchant-starter';

-- Check if it was marked for sync:
SELECT plan_name, needs_stripe_sync FROM subscription_plans WHERE plan_slug = 'merchant-starter';
*/
