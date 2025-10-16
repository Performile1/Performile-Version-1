-- =====================================================
-- CHECK AND CREATE MISSING TABLES
-- =====================================================
-- This script checks what exists and creates missing tables/columns
-- Safe to run multiple times - only creates what's missing
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 1: CREATE CUSTOM TYPES (IF NOT EXISTS)
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT 'STEP 1: CREATING CUSTOM TYPES' as "SECTION";
SELECT '=====================================================' as "INFO";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'merchant', 'courier', 'consumer');
    RAISE NOTICE '✅ Created user_role type';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '✓ user_role type already exists';
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed');
    RAISE NOTICE '✅ Created order_status type';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '✓ order_status type already exists';
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired');
    RAISE NOTICE '✅ Created subscription_status type';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '✓ subscription_status type already exists';
END $$;

DO $$ BEGIN
    CREATE TYPE integration_type AS ENUM ('payment', 'ecommerce', 'transport', 'analytics');
    RAISE NOTICE '✅ Created integration_type type';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '✓ integration_type type already exists';
END $$;

DO $$ BEGIN
    CREATE TYPE communication_channel AS ENUM ('email', 'sms', 'push');
    RAISE NOTICE '✅ Created communication_channel type';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '✓ communication_channel type already exists';
END $$;

DO $$ BEGIN
    CREATE TYPE rating_link_status AS ENUM ('sent', 'opened', 'completed', 'expired', 'unanswered');
    RAISE NOTICE '✅ Created rating_link_status type';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '✓ rating_link_status type already exists';
END $$;

-- =====================================================
-- STEP 2: CREATE/UPDATE CORE TABLES
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT 'STEP 2: CREATING/UPDATING CORE TABLES' as "SECTION";
SELECT '=====================================================' as "INFO";

-- USERS TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        CREATE TABLE users (
            user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
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
            locked_until TIMESTAMP WITH TIME ZONE
        );
        RAISE NOTICE '✅ Created users table';
    ELSE
        RAISE NOTICE '✓ users table already exists';
    END IF;
END $$;

-- COURIERS TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'couriers') THEN
        CREATE TABLE couriers (
            courier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            courier_name VARCHAR(255) NOT NULL,
            user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            subscription_plan_id UUID,
            description TEXT,
            logo_url VARCHAR(500),
            contact_email VARCHAR(255),
            contact_phone VARCHAR(20),
            service_areas JSONB DEFAULT '[]',
            market_settings JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        RAISE NOTICE '✅ Created couriers table';
    ELSE
        RAISE NOTICE '✓ couriers table already exists';
    END IF;
END $$;

-- STORES TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') THEN
        CREATE TABLE stores (
            store_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            store_name VARCHAR(255) NOT NULL,
            owner_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            subscription_plan_id UUID,
            website_url VARCHAR(500),
            description TEXT,
            logo_url VARCHAR(500),
            custom_css TEXT,
            market_settings JSONB DEFAULT '{}',
            integration_limits JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created stores table';
    ELSE
        RAISE NOTICE '✓ stores table already exists';
    END IF;
END $$;

-- SUBSCRIPTION_PLANS TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_plans') THEN
        CREATE TABLE subscription_plans (
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
        RAISE NOTICE '✅ Created subscription_plans table';
    ELSE
        RAISE NOTICE '✓ subscription_plans table already exists';
    END IF;
END $$;

-- USER_SUBSCRIPTIONS TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions') THEN
        CREATE TABLE user_subscriptions (
            subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            plan_id UUID NOT NULL REFERENCES subscription_plans(plan_id),
            status subscription_status DEFAULT 'active',
            start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            end_date TIMESTAMP WITH TIME ZONE,
            auto_renew BOOLEAN DEFAULT TRUE,
            payment_method_id VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, plan_id, status)
        );
        RAISE NOTICE '✅ Created user_subscriptions table';
    ELSE
        RAISE NOTICE '✓ user_subscriptions table already exists';
    END IF;
END $$;

-- ORDERS TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        CREATE TABLE orders (
            order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tracking_number VARCHAR(100) UNIQUE NOT NULL,
            store_id UUID NOT NULL REFERENCES stores(store_id),
            courier_id UUID NOT NULL REFERENCES couriers(courier_id),
            consumer_id UUID REFERENCES users(user_id),
            order_number VARCHAR(100),
            order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            delivery_date TIMESTAMP WITH TIME ZONE,
            estimated_delivery TIMESTAMP WITH TIME ZONE,
            level_of_service VARCHAR(100),
            type_of_delivery VARCHAR(100),
            postal_code VARCHAR(20),
            country VARCHAR(3) DEFAULT 'SWE',
            delivery_address TEXT,
            order_status order_status DEFAULT 'pending',
            review_link_token VARCHAR(255) UNIQUE,
            first_response_time INTERVAL,
            issue_reported BOOLEAN DEFAULT FALSE,
            issue_resolved BOOLEAN DEFAULT FALSE,
            issue_resolution_time INTERVAL,
            delivery_attempts INTEGER DEFAULT 1,
            last_mile_duration INTERVAL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created orders table';
    ELSE
        RAISE NOTICE '✓ orders table already exists';
    END IF;
END $$;

-- REVIEWS TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        CREATE TABLE reviews (
            review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
            reviewer_user_id UUID REFERENCES users(user_id),
            rating DECIMAL(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
            on_time_delivery_score DECIMAL(3,2) CHECK (on_time_delivery_score >= 1 AND on_time_delivery_score <= 5),
            package_condition_score DECIMAL(3,2) CHECK (package_condition_score >= 1 AND package_condition_score <= 5),
            communication_score DECIMAL(3,2) CHECK (communication_score >= 1 AND communication_score <= 5),
            delivery_person_score DECIMAL(3,2) CHECK (delivery_person_score >= 1 AND delivery_person_score <= 5),
            review_text TEXT,
            delay_minutes INTEGER DEFAULT 0,
            sentiment VARCHAR(20) DEFAULT 'neutral',
            needs_evaluation BOOLEAN DEFAULT FALSE,
            review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(order_id)
        );
        RAISE NOTICE '✅ Created reviews table';
    ELSE
        RAISE NOTICE '✓ reviews table already exists';
    END IF;
END $$;

-- RATINGLINKS TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ratinglinks') THEN
        CREATE TABLE ratinglinks (
            link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
            link_token VARCHAR(255) NOT NULL UNIQUE,
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_reminded_at TIMESTAMP WITH TIME ZONE,
            status rating_link_status DEFAULT 'sent',
            completion_time_minutes INTEGER,
            communication_channel communication_channel DEFAULT 'email',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(order_id)
        );
        RAISE NOTICE '✅ Created ratinglinks table';
    ELSE
        RAISE NOTICE '✓ ratinglinks table already exists';
    END IF;
END $$;

-- TRUSTSCORECACHE TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trustscorecache') THEN
        CREATE TABLE trustscorecache (
            courier_id UUID PRIMARY KEY REFERENCES couriers(courier_id) ON DELETE CASCADE,
            courier_name VARCHAR(255) NOT NULL,
            total_reviews INTEGER DEFAULT 0,
            average_rating DECIMAL(4,2) DEFAULT 0,
            weighted_rating DECIMAL(4,2) DEFAULT 0,
            completion_rate DECIMAL(5,2) DEFAULT 0,
            on_time_rate DECIMAL(5,2) DEFAULT 0,
            response_time_avg DECIMAL(8,2) DEFAULT 0,
            customer_satisfaction_score DECIMAL(5,2) DEFAULT 0,
            issue_resolution_rate DECIMAL(5,2) DEFAULT 0,
            delivery_attempt_avg DECIMAL(4,2) DEFAULT 0,
            last_mile_performance DECIMAL(5,2) DEFAULT 0,
            trust_score DECIMAL(5,2) DEFAULT 0,
            total_orders BIGINT DEFAULT 0,
            completed_orders BIGINT DEFAULT 0,
            on_time_deliveries BIGINT DEFAULT 0,
            last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            calculation_duration INTERVAL
        );
        RAISE NOTICE '✅ Created trustscorecache table';
    ELSE
        RAISE NOTICE '✓ trustscorecache table already exists';
    END IF;
END $$;

-- MERCHANTSHOPS TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchantshops') THEN
        CREATE TABLE merchantshops (
            shop_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            shop_name VARCHAR(255) NOT NULL,
            platform VARCHAR(100),
            shop_url VARCHAR(500),
            api_key_encrypted TEXT,
            api_secret_encrypted TEXT,
            access_token_encrypted TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            last_sync TIMESTAMP WITH TIME ZONE,
            sync_status VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created merchantshops table';
    ELSE
        RAISE NOTICE '✓ merchantshops table already exists';
    END IF;
END $$;

-- SERVICETYPES TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'servicetypes') THEN
        CREATE TABLE servicetypes (
            service_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
            service_name VARCHAR(255) NOT NULL,
            service_code VARCHAR(100),
            description TEXT,
            estimated_delivery_days INTEGER,
            price_info JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created servicetypes table';
    ELSE
        RAISE NOTICE '✓ servicetypes table already exists';
    END IF;
END $$;

-- MERCHANTCOURIERCHECKOUT TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchantcouriercheckout') THEN
        CREATE TABLE merchantcouriercheckout (
            checkout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
            shop_id UUID REFERENCES merchantshops(shop_id) ON DELETE CASCADE,
            is_active BOOLEAN DEFAULT TRUE,
            display_order INTEGER DEFAULT 0,
            custom_settings JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(merchant_id, courier_id, shop_id)
        );
        RAISE NOTICE '✅ Created merchantcouriercheckout table';
    ELSE
        RAISE NOTICE '✓ merchantcouriercheckout table already exists';
    END IF;
END $$;

-- CONVERSATIONS TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        CREATE TABLE conversations (
            conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255),
            created_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            is_group BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created conversations table';
    ELSE
        RAISE NOTICE '✓ conversations table already exists';
    END IF;
END $$;

-- MESSAGES TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        CREATE TABLE messages (
            message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
            sender_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            message_text TEXT NOT NULL,
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_edited BOOLEAN DEFAULT FALSE,
            is_deleted BOOLEAN DEFAULT FALSE,
            edited_at TIMESTAMP WITH TIME ZONE,
            deleted_at TIMESTAMP WITH TIME ZONE
        );
        RAISE NOTICE '✅ Created messages table';
    ELSE
        RAISE NOTICE '✓ messages table already exists';
    END IF;
END $$;

-- ECOMMERCE_INTEGRATIONS TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ecommerce_integrations') THEN
        CREATE TABLE ecommerce_integrations (
            integration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            platform VARCHAR(100) NOT NULL,
            shop_url VARCHAR(500),
            api_credentials_encrypted TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            last_sync TIMESTAMP WITH TIME ZONE,
            sync_frequency VARCHAR(50) DEFAULT 'daily',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created ecommerce_integrations table';
    ELSE
        RAISE NOTICE '✓ ecommerce_integrations table already exists';
    END IF;
END $$;

-- PAYMENTHISTORY TABLE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'paymenthistory') THEN
        CREATE TABLE paymenthistory (
            payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            subscription_id UUID REFERENCES user_subscriptions(subscription_id),
            amount DECIMAL(10,2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'SEK',
            payment_method VARCHAR(50),
            status VARCHAR(50) DEFAULT 'pending',
            transaction_id VARCHAR(255),
            payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created paymenthistory table';
    ELSE
        RAISE NOTICE '✓ paymenthistory table already exists';
    END IF;
END $$;

-- =====================================================
-- STEP 3: CREATE INDEXES
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT 'STEP 3: CREATING INDEXES' as "SECTION";
SELECT '=====================================================' as "INFO";

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_consumer ON orders(consumer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_postal ON orders(postal_code);
CREATE INDEX IF NOT EXISTS idx_orders_country ON orders(country);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(review_date);

-- Couriers indexes
CREATE INDEX IF NOT EXISTS idx_couriers_user ON couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_couriers_active ON couriers(is_active);

-- Stores indexes
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON user_subscriptions(status);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_orders_courier_status ON orders(courier_id, order_status);
CREATE INDEX IF NOT EXISTS idx_orders_store_date ON orders(store_id, order_date);
CREATE INDEX IF NOT EXISTS idx_reviews_rating_date ON reviews(rating, review_date);

SELECT '✅ Indexes created successfully' as "STATUS";

-- =====================================================
-- STEP 4: CREATE TRIGGERS
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT 'STEP 4: CREATING TRIGGERS' as "SECTION";
SELECT '=====================================================' as "INFO";

-- Updated timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
    CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_couriers_updated_at ON couriers;
    CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON couriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
    CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
    CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON user_subscriptions;
    CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE '✅ Triggers created successfully';
END $$;

-- =====================================================
-- STEP 5: FINAL VERIFICATION
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT 'STEP 5: FINAL VERIFICATION' as "SECTION";
SELECT '=====================================================' as "INFO";

SELECT 'All Tables in Database:' as "INFO";
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'couriers', 'stores', 'orders', 'reviews', 
                           'subscription_plans', 'user_subscriptions', 'ratinglinks',
                           'trustscorecache', 'merchantshops', 'servicetypes',
                           'merchantcouriercheckout', 'conversations', 'messages',
                           'ecommerce_integrations', 'paymenthistory')
        THEN '✅ Core Table'
        ELSE '📋 Additional Table'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT '=====================================================' as "INFO";
SELECT 'SETUP COMPLETE!' as "STATUS";
SELECT '=====================================================' as "INFO";
SELECT 'All required tables have been created or verified.' as "INFO";
SELECT 'You can now run CHECK_COMPLETE_DATABASE_CONTENT.sql to view all data.' as "INFO";
SELECT '=====================================================' as "INFO";
