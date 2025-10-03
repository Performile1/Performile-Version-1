-- ============================================================================
-- ADMIN FEATURES - Database Schema Updates
-- ============================================================================
-- Adds reference numbers, admin views, and analytics support
-- ============================================================================

-- Add reference_number column to Orders (merchant prefix + order number)
ALTER TABLE Orders 
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_reference_number ON Orders(reference_number);

-- Add merchant_prefix to Stores table
ALTER TABLE Stores
ADD COLUMN IF NOT EXISTS merchant_prefix VARCHAR(3);

-- Update existing stores with prefixes (first 3 letters of store name)
UPDATE Stores 
SET merchant_prefix = UPPER(LEFT(REGEXP_REPLACE(store_name, '[^A-Za-z]', '', 'g'), 3))
WHERE merchant_prefix IS NULL;

-- ============================================================================
-- ADMIN VIEW: All Users with Subscription Details
-- ============================================================================

CREATE OR REPLACE VIEW admin_users_overview AS
WITH user_stats AS (
    SELECT 
        u.user_id,
        COALESCE(store_counts.store_count, 0) as entity_count,
        COALESCE(order_counts.order_count, 0) as total_orders
    FROM Users u
    LEFT JOIN (
        SELECT owner_user_id, COUNT(*) as store_count
        FROM Stores
        GROUP BY owner_user_id
    ) store_counts ON u.user_id = store_counts.owner_user_id AND u.user_role = 'merchant'
    LEFT JOIN (
        SELECT s.owner_user_id, COUNT(o.order_id) as order_count
        FROM Orders o
        JOIN Stores s ON o.store_id = s.store_id
        GROUP BY s.owner_user_id
    ) order_counts ON u.user_id = order_counts.owner_user_id AND u.user_role = 'merchant'
    
    UNION ALL
    
    SELECT 
        u.user_id,
        COALESCE(courier_counts.courier_count, 0) as entity_count,
        COALESCE(courier_order_counts.order_count, 0) as total_orders
    FROM Users u
    LEFT JOIN (
        SELECT user_id, COUNT(*) as courier_count
        FROM Couriers
        GROUP BY user_id
    ) courier_counts ON u.user_id = courier_counts.user_id AND u.user_role = 'courier'
    LEFT JOIN (
        SELECT c.user_id, COUNT(o.order_id) as order_count
        FROM Orders o
        JOIN Couriers c ON o.courier_id = c.courier_id
        GROUP BY c.user_id
    ) courier_order_counts ON u.user_id = courier_order_counts.user_id AND u.user_role = 'courier'
    
    UNION ALL
    
    SELECT 
        user_id,
        0 as entity_count,
        0 as total_orders
    FROM Users
    WHERE user_role NOT IN ('merchant', 'courier')
)
SELECT 
    u.user_id,
    u.email,
    u.user_role,
    u.first_name,
    u.last_name,
    u.phone,
    u.is_verified,
    u.is_active,
    u.created_at,
    u.last_login,
    
    -- Subscription details
    sp.plan_name,
    sp.price_monthly,
    sp.price_yearly,
    us.status as subscription_status,
    us.start_date as subscription_start,
    us.end_date as subscription_end,
    us.auto_renew,
    
    -- Role-specific counts
    COALESCE(MAX(stats.entity_count), 0) as entity_count,
    COALESCE(MAX(stats.total_orders), 0) as total_orders

FROM Users u
LEFT JOIN UserSubscriptions us ON u.user_id = us.user_id AND us.status = 'active'
LEFT JOIN SubscriptionPlans sp ON us.plan_id = sp.plan_id
LEFT JOIN user_stats stats ON u.user_id = stats.user_id
GROUP BY u.user_id, u.email, u.user_role, u.first_name, u.last_name, u.phone, 
         u.is_verified, u.is_active, u.created_at, u.last_login,
         sp.plan_name, sp.price_monthly, sp.price_yearly, us.status, 
         us.start_date, us.end_date, us.auto_renew;

-- ============================================================================
-- ADMIN VIEW: Review Validation (Reviews without valid tracking)
-- ============================================================================

CREATE OR REPLACE VIEW admin_invalid_reviews AS
SELECT 
    r.review_id,
    r.rating,
    r.comment,
    r.created_at,
    r.is_verified,
    r.is_public,
    
    o.order_id,
    o.order_number,
    o.tracking_number,
    o.reference_number,
    o.customer_email,
    
    c.courier_name,
    s.store_name,
    
    -- Validation flags
    CASE WHEN o.tracking_number IS NULL OR o.tracking_number = '' THEN TRUE ELSE FALSE END as missing_tracking,
    CASE WHEN o.order_id IS NULL THEN TRUE ELSE FALSE END as orphaned_review
    
FROM Reviews r
LEFT JOIN Orders o ON r.order_id = o.order_id
LEFT JOIN Couriers c ON r.courier_id = c.courier_id
LEFT JOIN Stores s ON r.store_id = s.store_id
WHERE o.tracking_number IS NULL 
   OR o.tracking_number = ''
   OR o.order_id IS NULL
ORDER BY r.created_at DESC;

-- ============================================================================
-- ADMIN VIEW: Courier Performance Analytics Base
-- ============================================================================

CREATE OR REPLACE VIEW admin_courier_performance AS
SELECT 
    c.courier_id,
    c.courier_name,
    c.is_active,
    
    -- Order statistics
    COUNT(DISTINCT o.order_id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
    COUNT(DISTINCT CASE WHEN o.order_status = 'cancelled' THEN o.order_id END) as cancelled_orders,
    
    -- Delivery time statistics (in hours)
    AVG(EXTRACT(EPOCH FROM (o.delivery_date - o.order_date)) / 3600) FILTER (WHERE o.delivery_date IS NOT NULL) as avg_delivery_hours,
    MIN(EXTRACT(EPOCH FROM (o.delivery_date - o.order_date)) / 3600) FILTER (WHERE o.delivery_date IS NOT NULL) as min_delivery_hours,
    MAX(EXTRACT(EPOCH FROM (o.delivery_date - o.order_date)) / 3600) FILTER (WHERE o.delivery_date IS NOT NULL) as max_delivery_hours,
    
    -- Review statistics
    COUNT(DISTINCT r.review_id) as total_reviews,
    AVG(r.rating) as avg_rating,
    AVG(r.delivery_speed_rating) as avg_delivery_speed,
    AVG(r.package_condition_rating) as avg_package_condition,
    AVG(r.communication_rating) as avg_communication,
    
    -- Geographic distribution
    jsonb_object_agg(
        COALESCE(SUBSTRING(o.delivery_address FROM '([A-Z]{2})$'), 'Unknown'),
        COUNT(DISTINCT o.order_id)
    ) FILTER (WHERE o.delivery_address IS NOT NULL) as orders_by_country,
    
    -- Time period
    MIN(o.order_date) as first_order_date,
    MAX(o.order_date) as last_order_date
    
FROM Couriers c
LEFT JOIN Orders o ON c.courier_id = o.courier_id
LEFT JOIN Reviews r ON c.courier_id = r.courier_id
GROUP BY c.courier_id, c.courier_name, c.is_active;

-- ============================================================================
-- FUNCTION: Generate Reference Number for Order
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_reference_number(p_store_id UUID, p_order_number VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(3);
    v_reference VARCHAR(50);
BEGIN
    -- Get merchant prefix from store
    SELECT merchant_prefix INTO v_prefix
    FROM Stores
    WHERE store_id = p_store_id;
    
    -- If no prefix, use first 3 letters of store name
    IF v_prefix IS NULL THEN
        SELECT UPPER(LEFT(REGEXP_REPLACE(store_name, '[^A-Za-z]', '', 'g'), 3))
        INTO v_prefix
        FROM Stores
        WHERE store_id = p_store_id;
    END IF;
    
    -- Generate reference: PREFIX-ORDERNUMBER
    v_reference := v_prefix || '-' || p_order_number;
    
    RETURN v_reference;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-generate reference number on order insert
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_generate_reference_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL THEN
        NEW.reference_number := generate_reference_number(NEW.store_id, NEW.order_number);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_generate_reference ON Orders;
CREATE TRIGGER orders_generate_reference
    BEFORE INSERT ON Orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_reference_number();

-- ============================================================================
-- Update existing orders with reference numbers
-- ============================================================================

UPDATE Orders o
SET reference_number = generate_reference_number(o.store_id, o.order_number)
WHERE reference_number IS NULL;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ADMIN FEATURES INSTALLED SUCCESSFULLY!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'New Features:';
    RAISE NOTICE '- Reference numbers added to orders';
    RAISE NOTICE '- Admin user overview view created';
    RAISE NOTICE '- Invalid reviews view created';
    RAISE NOTICE '- Courier performance analytics view created';
    RAISE NOTICE '';
    RAISE NOTICE 'Views Available:';
    RAISE NOTICE '- admin_users_overview';
    RAISE NOTICE '- admin_invalid_reviews';
    RAISE NOTICE '- admin_courier_performance';
END $$;
