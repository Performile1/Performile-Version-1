-- ============================================================================
-- PERFORMILE PLATFORM - ORDERS SYSTEM TABLES
-- ============================================================================
-- This script creates all tables required for the Orders API
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS TABLE (Core user management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    user_role VARCHAR(50) DEFAULT 'customer', -- admin, merchant, courier, customer
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    company_name VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 2. STORES TABLE (Merchant stores)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stores (
    store_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name VARCHAR(255) NOT NULL,
    store_description TEXT,
    owner_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    store_type VARCHAR(50), -- retail, wholesale, ecommerce, etc.
    store_url VARCHAR(255),
    store_email VARCHAR(255),
    store_phone VARCHAR(20),
    
    -- Address information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Business information
    tax_id VARCHAR(100),
    business_registration VARCHAR(100),
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    logo_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for stores
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(store_name);

-- ============================================================================
-- 3. COURIERS TABLE (Delivery service providers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS couriers (
    courier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courier_name VARCHAR(255) NOT NULL,
    courier_code VARCHAR(50) UNIQUE, -- DHL, FEDEX, UPS, etc.
    courier_description TEXT,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Contact information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    website_url VARCHAR(255),
    
    -- Service information
    service_types VARCHAR(255)[], -- standard, express, overnight, international
    coverage_countries VARCHAR(100)[], -- Countries they serve
    
    -- Tracking
    tracking_url_template TEXT, -- e.g., https://track.courier.com/?id={tracking_number}
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    logo_url TEXT,
    
    -- Performance metrics
    average_delivery_time_days DECIMAL(5,2),
    on_time_delivery_rate DECIMAL(5,2), -- Percentage
    customer_rating DECIMAL(3,2), -- 0-5 stars
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for couriers
CREATE INDEX IF NOT EXISTS idx_couriers_code ON couriers(courier_code);
CREATE INDEX IF NOT EXISTS idx_couriers_active ON couriers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_couriers_user ON couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_couriers_name ON couriers(courier_name);

-- ============================================================================
-- 4. ORDERS TABLE (Main orders/shipments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Order identification
    tracking_number VARCHAR(255) UNIQUE NOT NULL,
    order_number VARCHAR(255),
    
    -- Relationships
    store_id UUID REFERENCES stores(store_id) ON DELETE SET NULL,
    courier_id UUID REFERENCES couriers(courier_id) ON DELETE SET NULL,
    customer_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    consumer_id UUID, -- Alternative customer reference (if not in users table)
    
    -- Order status
    order_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, in_transit, delivered, cancelled, returned
    
    -- Dates
    order_date DATE DEFAULT CURRENT_DATE,
    ship_date DATE,
    estimated_delivery DATE,
    delivery_date DATE,
    
    -- Delivery information
    delivery_address TEXT,
    postal_code VARCHAR(20),
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100),
    
    -- Service details
    level_of_service VARCHAR(100), -- standard, express, overnight, etc.
    type_of_delivery VARCHAR(100), -- home, pickup_point, locker, etc.
    
    -- Package information
    package_weight DECIMAL(10,2), -- in kg
    package_dimensions VARCHAR(50), -- e.g., "30x20x15 cm"
    package_value DECIMAL(10,2),
    package_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Tracking
    current_location VARCHAR(255),
    last_scan_time TIMESTAMPTZ,
    delivery_signature TEXT,
    delivery_photo_url TEXT,
    
    -- Additional information
    special_instructions TEXT,
    reference_number VARCHAR(255),
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_country ON orders(country);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ============================================================================
-- 5. ORDER STATUS HISTORY (Track status changes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_status_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    changed_by UUID REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for order status history
CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_created ON order_status_history(created_at DESC);

-- ============================================================================
-- 6. ORDER ITEMS (Optional - if orders contain multiple items)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    weight DECIMAL(10,2),
    dimensions VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for order items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============================================================================
-- 7. TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at 
    BEFORE UPDATE ON stores
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_couriers_updated_at ON couriers;
CREATE TRIGGER update_couriers_updated_at 
    BEFORE UPDATE ON couriers
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to track order status changes
CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
        INSERT INTO order_status_history (
            order_id,
            old_status,
            new_status,
            notes
        ) VALUES (
            NEW.order_id,
            OLD.order_status,
            NEW.order_status,
            'Status changed automatically'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track status changes
DROP TRIGGER IF EXISTS track_order_status ON orders;
CREATE TRIGGER track_order_status
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION track_order_status_change();

-- ============================================================================
-- 8. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample admin user (password: admin123 - CHANGE THIS!)
INSERT INTO users (email, password_hash, first_name, last_name, user_role, email_verified)
VALUES (
    'admin@performile.com',
    '$2b$10$rKZqGqZqGqZqGqZqGqZqGOYxYxYxYxYxYxYxYxYxYxYxYxYxYxY', -- Placeholder hash
    'Admin',
    'User',
    'admin',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample courier (only if courier_code column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'courier_code'
    ) THEN
        INSERT INTO couriers (courier_name, courier_code, contact_email, is_active)
        VALUES 
            ('DHL Express', 'DHL', 'support@dhl.com', TRUE),
            ('FedEx', 'FEDEX', 'support@fedex.com', TRUE),
            ('UPS', 'UPS', 'support@ups.com', TRUE),
            ('USPS', 'USPS', 'support@usps.com', TRUE)
        ON CONFLICT (courier_code) DO NOTHING;
        RAISE NOTICE 'Sample couriers inserted';
    ELSE
        RAISE WARNING 'Skipping courier insert - courier_code column does not exist. Run fix-couriers-table.sql first.';
    END IF;
END $$;

-- ============================================================================
-- 9. VERIFICATION QUERY
-- ============================================================================

-- Run this to verify all tables were created
DO $$
DECLARE
    table_count INTEGER;
    missing_tables TEXT[];
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'users',
        'stores',
        'couriers',
        'orders',
        'order_status_history',
        'order_items'
    );
    
    -- Check for missing tables
    SELECT ARRAY_AGG(t.table_name)
    INTO missing_tables
    FROM (
        VALUES 
            ('users'),
            ('stores'),
            ('couriers'),
            ('orders'),
            ('order_status_history'),
            ('order_items')
    ) AS t(table_name)
    WHERE NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = t.table_name
    );
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ORDERS SYSTEM SETUP COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables Created: % / 6', table_count;
    RAISE NOTICE '';
    
    IF missing_tables IS NOT NULL THEN
        RAISE WARNING 'Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ All required tables created successfully!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Core Tables:';
    RAISE NOTICE '  - users (customer and user management)';
    RAISE NOTICE '  - stores (merchant stores)';
    RAISE NOTICE '  - couriers (delivery providers)';
    RAISE NOTICE '  - orders (shipments and tracking)';
    RAISE NOTICE '  - order_status_history (status tracking)';
    RAISE NOTICE '  - order_items (order line items)';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for Orders API!';
    RAISE NOTICE '';
END $$;

-- Display table statistics
SELECT 
    t.table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = t.table_name 
     AND table_schema = 'public') as column_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as size
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_name IN (
    'users',
    'stores',
    'couriers',
    'orders',
    'order_status_history',
    'order_items'
)
ORDER BY t.table_name;
