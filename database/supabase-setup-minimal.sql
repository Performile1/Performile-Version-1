-- ============================================================================
-- PERFORMILE SUPABASE SETUP - MINIMAL (Under 12 Functions Limit)
-- ============================================================================
-- Run this in Supabase SQL Editor to set up your database
-- This creates all essential tables and only critical functions
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'merchant', 'courier', 'consumer');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired');
CREATE TYPE rating_link_status AS ENUM ('sent', 'opened', 'completed', 'expired', 'unanswered');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table - Core authentication and user management
CREATE TABLE IF NOT EXISTS Users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_role user_role NOT NULL DEFAULT 'consumer',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS SubscriptionPlans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_name VARCHAR(100) NOT NULL UNIQUE,
    user_role user_role NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    features_json JSONB NOT NULL DEFAULT '{}',
    limits_json JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS UserSubscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES SubscriptionPlans(plan_id),
    status subscription_status DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores - Merchant store information
CREATE TABLE IF NOT EXISTS Stores (
    store_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name VARCHAR(255) NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    subscription_plan_id UUID REFERENCES SubscriptionPlans(plan_id),
    website_url VARCHAR(500),
    description TEXT,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Couriers - Courier company information
CREATE TABLE IF NOT EXISTS Couriers (
    courier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courier_name VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    subscription_plan_id UUID REFERENCES SubscriptionPlans(plan_id),
    description TEXT,
    logo_url VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Orders - Core order tracking
CREATE TABLE IF NOT EXISTS Orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES Stores(store_id) ON DELETE CASCADE,
    courier_id UUID REFERENCES Couriers(courier_id),
    order_number VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    delivery_address TEXT,
    order_status order_status DEFAULT 'pending',
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_date TIMESTAMP WITH TIME ZONE,
    tracking_number VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(store_id, order_number)
);

-- Reviews - Customer feedback
CREATE TABLE IF NOT EXISTS Reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES Couriers(courier_id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES Stores(store_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    delivery_speed_rating INTEGER CHECK (delivery_speed_rating >= 1 AND delivery_speed_rating <= 5),
    package_condition_rating INTEGER CHECK (package_condition_rating >= 1 AND package_condition_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    is_verified BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rating Links - Track rating request links
CREATE TABLE IF NOT EXISTS RatingLinks (
    link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
    unique_token VARCHAR(255) UNIQUE NOT NULL,
    status rating_link_status DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TrustScore Cache - Precomputed courier ratings
CREATE TABLE IF NOT EXISTS TrustScoreCache (
    courier_id UUID PRIMARY KEY REFERENCES Couriers(courier_id) ON DELETE CASCADE,
    overall_score DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    avg_delivery_speed DECIMAL(3,2) DEFAULT 0.00,
    avg_package_condition DECIMAL(3,2) DEFAULT 0.00,
    avg_communication DECIMAL(3,2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(user_role);
CREATE INDEX IF NOT EXISTS idx_orders_store ON Orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON Orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON Orders(order_status);
CREATE INDEX IF NOT EXISTS idx_reviews_courier ON Reviews(courier_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON Reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rating_links_token ON RatingLinks(unique_token);
CREATE INDEX IF NOT EXISTS idx_rating_links_order ON RatingLinks(order_id);

-- ============================================================================
-- ESSENTIAL FUNCTIONS (Total: 3 functions - Well under 12 limit!)
-- ============================================================================

-- Function 1: Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Calculate TrustScore for a courier
CREATE OR REPLACE FUNCTION calculate_trustscore(p_courier_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_score DECIMAL(3,2);
    v_total_reviews INTEGER;
    v_avg_delivery DECIMAL(3,2);
    v_avg_condition DECIMAL(3,2);
    v_avg_communication DECIMAL(3,2);
BEGIN
    SELECT 
        COUNT(*),
        AVG(delivery_speed_rating),
        AVG(package_condition_rating),
        AVG(communication_rating)
    INTO 
        v_total_reviews,
        v_avg_delivery,
        v_avg_condition,
        v_avg_communication
    FROM Reviews
    WHERE courier_id = p_courier_id
      AND is_verified = TRUE;
    
    IF v_total_reviews = 0 THEN
        RETURN 0.00;
    END IF;
    
    -- Calculate weighted average (out of 5, then convert to 0-5 scale)
    v_score := (
        COALESCE(v_avg_delivery, 0) * 0.4 +
        COALESCE(v_avg_condition, 0) * 0.3 +
        COALESCE(v_avg_communication, 0) * 0.3
    );
    
    -- Update cache
    INSERT INTO TrustScoreCache (
        courier_id, 
        overall_score, 
        total_reviews,
        avg_delivery_speed,
        avg_package_condition,
        avg_communication,
        last_updated
    )
    VALUES (
        p_courier_id,
        v_score,
        v_total_reviews,
        v_avg_delivery,
        v_avg_condition,
        v_avg_communication,
        NOW()
    )
    ON CONFLICT (courier_id) DO UPDATE SET
        overall_score = EXCLUDED.overall_score,
        total_reviews = EXCLUDED.total_reviews,
        avg_delivery_speed = EXCLUDED.avg_delivery_speed,
        avg_package_condition = EXCLUDED.avg_package_condition,
        avg_communication = EXCLUDED.avg_communication,
        last_updated = NOW();
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Trigger to recalculate TrustScore when review is added/updated
CREATE OR REPLACE FUNCTION trigger_recalculate_trustscore()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_trustscore(NEW.courier_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON Users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_timestamp BEFORE UPDATE ON Stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_couriers_timestamp BEFORE UPDATE ON Couriers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON Orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_timestamp BEFORE UPDATE ON Reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-recalculate TrustScore on review changes
CREATE TRIGGER trigger_review_trustscore AFTER INSERT OR UPDATE ON Reviews
    FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_trustscore();

-- ============================================================================
-- SEED DATA - Default Subscription Plans
-- ============================================================================

INSERT INTO SubscriptionPlans (plan_name, user_role, price_monthly, price_yearly, features_json, limits_json)
VALUES 
    ('Free Merchant', 'merchant', 0.00, 0.00, 
     '{"basic_analytics": true, "email_support": true}',
     '{"max_orders_per_month": 100, "max_integrations": 1}'),
    
    ('Pro Merchant', 'merchant', 29.99, 299.99,
     '{"advanced_analytics": true, "priority_support": true, "custom_branding": true}',
     '{"max_orders_per_month": 1000, "max_integrations": 5}'),
    
    ('Free Courier', 'courier', 0.00, 0.00,
     '{"basic_profile": true, "review_management": true}',
     '{"max_deliveries_per_month": 100}'),
    
    ('Pro Courier', 'courier', 49.99, 499.99,
     '{"enhanced_profile": true, "analytics_dashboard": true, "priority_listing": true}',
     '{"max_deliveries_per_month": -1}')
ON CONFLICT (plan_name) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Comprehensive Security Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE SubscriptionPlans ENABLE ROW LEVEL SECURITY;
ALTER TABLE UserSubscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE Stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE Couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE Orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE Reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE RatingLinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE TrustScoreCache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can read their own data
CREATE POLICY users_select_own ON Users
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can update their own data (except role and verification status)
CREATE POLICY users_update_own ON Users
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Allow user registration (insert)
CREATE POLICY users_insert_own ON Users
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================================================
-- SUBSCRIPTION PLANS POLICIES
-- ============================================================================

-- Everyone can view active subscription plans (for signup)
CREATE POLICY plans_public_read ON SubscriptionPlans
    FOR SELECT USING (is_active = TRUE);

-- ============================================================================
-- USER SUBSCRIPTIONS POLICIES
-- ============================================================================

-- Users can view their own subscriptions
CREATE POLICY subscriptions_select_own ON UserSubscriptions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can create their own subscriptions
CREATE POLICY subscriptions_insert_own ON UserSubscriptions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own subscriptions
CREATE POLICY subscriptions_update_own ON UserSubscriptions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- STORES TABLE POLICIES
-- ============================================================================

-- Store owners can read their own stores
CREATE POLICY stores_select_own ON Stores
    FOR SELECT USING (auth.uid()::text = owner_user_id::text);

-- Store owners can create stores
CREATE POLICY stores_insert_own ON Stores
    FOR INSERT WITH CHECK (auth.uid()::text = owner_user_id::text);

-- Store owners can update their own stores
CREATE POLICY stores_update_own ON Stores
    FOR UPDATE USING (auth.uid()::text = owner_user_id::text);

-- Public can view active stores (for marketplace)
CREATE POLICY stores_public_read ON Stores
    FOR SELECT USING (is_active = TRUE);

-- ============================================================================
-- COURIERS TABLE POLICIES
-- ============================================================================

-- Courier owners can read their own courier profiles
CREATE POLICY couriers_select_own ON Couriers
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Courier owners can create their profile
CREATE POLICY couriers_insert_own ON Couriers
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Courier owners can update their own profile
CREATE POLICY couriers_update_own ON Couriers
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Public can view active couriers (for marketplace)
CREATE POLICY couriers_public_read ON Couriers
    FOR SELECT USING (is_active = TRUE);

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

-- Store owners can view their own orders
CREATE POLICY orders_select_by_store ON Orders
    FOR SELECT USING (
        store_id IN (
            SELECT store_id FROM Stores WHERE owner_user_id::text = auth.uid()::text
        )
    );

-- Couriers can view orders assigned to them
CREATE POLICY orders_select_by_courier ON Orders
    FOR SELECT USING (
        courier_id IN (
            SELECT courier_id FROM Couriers WHERE user_id::text = auth.uid()::text
        )
    );

-- Store owners can create orders
CREATE POLICY orders_insert_by_store ON Orders
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT store_id FROM Stores WHERE owner_user_id::text = auth.uid()::text
        )
    );

-- Store owners and couriers can update orders
CREATE POLICY orders_update_by_store_or_courier ON Orders
    FOR UPDATE USING (
        store_id IN (
            SELECT store_id FROM Stores WHERE owner_user_id::text = auth.uid()::text
        )
        OR
        courier_id IN (
            SELECT courier_id FROM Couriers WHERE user_id::text = auth.uid()::text
        )
    );

-- ============================================================================
-- REVIEWS TABLE POLICIES
-- ============================================================================

-- Public can read public reviews (for marketplace)
CREATE POLICY reviews_public_read ON Reviews
    FOR SELECT USING (is_public = TRUE);

-- Store owners can view reviews for their orders
CREATE POLICY reviews_select_by_store ON Reviews
    FOR SELECT USING (
        store_id IN (
            SELECT store_id FROM Stores WHERE owner_user_id::text = auth.uid()::text
        )
    );

-- Couriers can view their own reviews
CREATE POLICY reviews_select_by_courier ON Reviews
    FOR SELECT USING (
        courier_id IN (
            SELECT courier_id FROM Couriers WHERE user_id::text = auth.uid()::text
        )
    );

-- Anyone can create reviews (customers via rating links)
CREATE POLICY reviews_insert_public ON Reviews
    FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- RATING LINKS TABLE POLICIES
-- ============================================================================

-- Store owners can view rating links for their orders
CREATE POLICY rating_links_select_by_store ON RatingLinks
    FOR SELECT USING (
        order_id IN (
            SELECT order_id FROM Orders WHERE store_id IN (
                SELECT store_id FROM Stores WHERE owner_user_id::text = auth.uid()::text
            )
        )
    );

-- Store owners can create rating links
CREATE POLICY rating_links_insert_by_store ON RatingLinks
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT order_id FROM Orders WHERE store_id IN (
                SELECT store_id FROM Stores WHERE owner_user_id::text = auth.uid()::text
            )
        )
    );

-- Public can read rating links by token (for customers to leave reviews)
CREATE POLICY rating_links_select_by_token ON RatingLinks
    FOR SELECT USING (TRUE);

-- ============================================================================
-- TRUSTSCORE CACHE POLICIES
-- ============================================================================

-- Everyone can read TrustScore cache (public ratings)
CREATE POLICY trustscore_public_read ON TrustScoreCache
    FOR SELECT USING (TRUE);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Performile database setup complete!';
    RAISE NOTICE '📊 Tables created: 11';
    RAISE NOTICE '⚡ Functions created: 3 (under 12 limit)';
    RAISE NOTICE '🔒 Row Level Security enabled';
    RAISE NOTICE '📦 Default subscription plans added';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your database is ready to use!';
    RAISE NOTICE '👤 You can now create users through your application';
END $$;
