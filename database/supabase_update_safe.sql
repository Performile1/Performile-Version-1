-- Supabase Database Update Script (SAFE VERSION)
-- Run this in your Supabase SQL Editor to ensure schema compatibility
-- This version only ADDS new elements, never removes existing ones

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'merchant', 'courier', 'consumer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE integration_type AS ENUM ('payment', 'ecommerce', 'transport', 'analytics');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE communication_channel AS ENUM ('email', 'sms', 'push');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rating_link_status AS ENUM ('sent', 'opened', 'completed', 'expired', 'unanswered');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing Users table (add missing columns if they don't exist)
DO $$ BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='user_id') THEN
        ALTER TABLE users ADD COLUMN user_id UUID DEFAULT uuid_generate_v4();
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email') THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='user_role') THEN
        ALTER TABLE users ADD COLUMN user_role user_role DEFAULT 'consumer';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='first_name') THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_name') THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='failed_login_attempts') THEN
        ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='locked_until') THEN
        ALTER TABLE users ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update existing SubscriptionPlans table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptionplans' AND column_name='plan_id') THEN
        ALTER TABLE subscriptionplans ADD COLUMN plan_id UUID DEFAULT uuid_generate_v4();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptionplans' AND column_name='plan_name') THEN
        ALTER TABLE subscriptionplans ADD COLUMN plan_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptionplans' AND column_name='user_role') THEN
        ALTER TABLE subscriptionplans ADD COLUMN user_role user_role;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptionplans' AND column_name='price_monthly') THEN
        ALTER TABLE subscriptionplans ADD COLUMN price_monthly DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptionplans' AND column_name='price_yearly') THEN
        ALTER TABLE subscriptionplans ADD COLUMN price_yearly DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptionplans' AND column_name='features_json') THEN
        ALTER TABLE subscriptionplans ADD COLUMN features_json JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptionplans' AND column_name='limits_json') THEN
        ALTER TABLE subscriptionplans ADD COLUMN limits_json JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptionplans' AND column_name='is_active') THEN
        ALTER TABLE subscriptionplans ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptionplans' AND column_name='created_at') THEN
        ALTER TABLE subscriptionplans ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptionplans' AND column_name='updated_at') THEN
        ALTER TABLE subscriptionplans ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update existing Stores table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='store_id') THEN
        ALTER TABLE stores ADD COLUMN store_id UUID DEFAULT uuid_generate_v4();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='store_name') THEN
        ALTER TABLE stores ADD COLUMN store_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='owner_user_id') THEN
        ALTER TABLE stores ADD COLUMN owner_user_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='subscription_plan_id') THEN
        ALTER TABLE stores ADD COLUMN subscription_plan_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='website_url') THEN
        ALTER TABLE stores ADD COLUMN website_url VARCHAR(500);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='description') THEN
        ALTER TABLE stores ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='logo_url') THEN
        ALTER TABLE stores ADD COLUMN logo_url VARCHAR(500);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='custom_css') THEN
        ALTER TABLE stores ADD COLUMN custom_css TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='market_settings') THEN
        ALTER TABLE stores ADD COLUMN market_settings JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='integration_limits') THEN
        ALTER TABLE stores ADD COLUMN integration_limits JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='is_active') THEN
        ALTER TABLE stores ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='created_at') THEN
        ALTER TABLE stores ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='updated_at') THEN
        ALTER TABLE stores ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update existing Couriers table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='courier_id') THEN
        ALTER TABLE couriers ADD COLUMN courier_id UUID DEFAULT uuid_generate_v4();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='courier_name') THEN
        ALTER TABLE couriers ADD COLUMN courier_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='user_id') THEN
        ALTER TABLE couriers ADD COLUMN user_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='subscription_plan_id') THEN
        ALTER TABLE couriers ADD COLUMN subscription_plan_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='description') THEN
        ALTER TABLE couriers ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='logo_url') THEN
        ALTER TABLE couriers ADD COLUMN logo_url VARCHAR(500);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='contact_email') THEN
        ALTER TABLE couriers ADD COLUMN contact_email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='contact_phone') THEN
        ALTER TABLE couriers ADD COLUMN contact_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='service_areas') THEN
        ALTER TABLE couriers ADD COLUMN service_areas JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='market_settings') THEN
        ALTER TABLE couriers ADD COLUMN market_settings JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='is_active') THEN
        ALTER TABLE couriers ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='created_at') THEN
        ALTER TABLE couriers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='couriers' AND column_name='updated_at') THEN
        ALTER TABLE couriers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create new tables (only if they don't exist)
CREATE TABLE IF NOT EXISTS UserSubscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    status subscription_status DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number VARCHAR(100) UNIQUE NOT NULL,
    store_id UUID NOT NULL,
    courier_id UUID NOT NULL,
    consumer_id UUID,
    
    -- Order details
    order_number VARCHAR(100),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_date TIMESTAMP WITH TIME ZONE,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    
    -- Delivery specifics
    level_of_service VARCHAR(100),
    type_of_delivery VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(3) DEFAULT 'SWE',
    delivery_address TEXT,
    
    -- Status tracking
    order_status order_status DEFAULT 'pending',
    is_reviewed BOOLEAN DEFAULT FALSE,
    review_link_token VARCHAR(255) UNIQUE,
    
    -- Enhanced TrustScore metrics
    first_response_time INTERVAL,
    issue_reported BOOLEAN DEFAULT FALSE,
    issue_resolved BOOLEAN DEFAULT FALSE,
    issue_resolution_time INTERVAL,
    delivery_attempts INTEGER DEFAULT 1,
    last_mile_duration INTERVAL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    reviewer_user_id UUID,
    
    -- Rating components
    rating DECIMAL(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    on_time_delivery_score DECIMAL(3,2) CHECK (on_time_delivery_score >= 1 AND on_time_delivery_score <= 5),
    package_condition_score DECIMAL(3,2) CHECK (package_condition_score >= 1 AND package_condition_score <= 5),
    communication_score DECIMAL(3,2) CHECK (communication_score >= 1 AND communication_score <= 5),
    delivery_person_score DECIMAL(3,2) CHECK (delivery_person_score >= 1 AND delivery_person_score <= 5),
    
    -- Additional feedback
    review_text TEXT,
    delay_minutes INTEGER DEFAULT 0,
    sentiment VARCHAR(20) DEFAULT 'neutral',
    needs_evaluation BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(order_id)
);

CREATE TABLE IF NOT EXISTS CourierTrustScores (
    courier_id UUID PRIMARY KEY,
    courier_name VARCHAR(255) NOT NULL,
    
    -- Basic metrics
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(4,2) DEFAULT 0,
    weighted_rating DECIMAL(4,2) DEFAULT 0,
    
    -- Performance metrics
    completion_rate DECIMAL(5,2) DEFAULT 0,
    on_time_rate DECIMAL(5,2) DEFAULT 0,
    response_time_avg DECIMAL(8,2) DEFAULT 0,
    customer_satisfaction_score DECIMAL(5,2) DEFAULT 0,
    issue_resolution_rate DECIMAL(5,2) DEFAULT 0,
    delivery_attempt_avg DECIMAL(4,2) DEFAULT 0,
    last_mile_performance DECIMAL(5,2) DEFAULT 0,
    
    -- Final score
    trust_score DECIMAL(5,2) DEFAULT 0,
    
    -- Order statistics
    total_orders BIGINT DEFAULT 0,
    completed_orders BIGINT DEFAULT 0,
    on_time_deliveries BIGINT DEFAULT 0,
    
    -- Cache metadata
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculation_duration INTERVAL
);

-- Create RatingConfigurations table (for flexible rating system)
CREATE TABLE IF NOT EXISTS RatingConfigurations (
    config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    config_json JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create UserConfigurations table (links users to rating configurations)
CREATE TABLE IF NOT EXISTS UserConfigurations (
    user_config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    config_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create RatingLinks table (tracks rating link lifecycle)
CREATE TABLE IF NOT EXISTS RatingLinks (
    link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
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

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_orders_tracking ON Orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_store ON Orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON Orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON Orders(order_status);

CREATE INDEX IF NOT EXISTS idx_couriers_user ON couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_couriers_active ON couriers(is_active);

CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);

-- Create updated_at trigger function (safe to recreate)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Insert default subscription plans (only if they don't exist)
INSERT INTO subscriptionplans (plan_name, user_role, price_monthly, price_yearly, features_json, limits_json)
SELECT 'Basic Merchant', 'merchant', 29.99, 299.99, '{"analytics": true, "integrations": 3}', '{"monthly_orders": 1000}'
WHERE NOT EXISTS (SELECT 1 FROM subscriptionplans WHERE plan_name = 'Basic Merchant');

INSERT INTO subscriptionplans (plan_name, user_role, price_monthly, price_yearly, features_json, limits_json)
SELECT 'Pro Merchant', 'merchant', 79.99, 799.99, '{"analytics": true, "integrations": 10, "custom_branding": true}', '{"monthly_orders": 5000}'
WHERE NOT EXISTS (SELECT 1 FROM subscriptionplans WHERE plan_name = 'Pro Merchant');

INSERT INTO subscriptionplans (plan_name, user_role, price_monthly, price_yearly, features_json, limits_json)
SELECT 'Basic Courier', 'courier', 19.99, 199.99, '{"marketplace": true, "analytics": true}', '{"monthly_deliveries": 500}'
WHERE NOT EXISTS (SELECT 1 FROM subscriptionplans WHERE plan_name = 'Basic Courier');

INSERT INTO subscriptionplans (plan_name, user_role, price_monthly, price_yearly, features_json, limits_json)
SELECT 'Pro Courier', 'courier', 49.99, 499.99, '{"marketplace": true, "analytics": true, "priority_support": true}', '{"monthly_deliveries": 2000}'
WHERE NOT EXISTS (SELECT 1 FROM subscriptionplans WHERE plan_name = 'Pro Courier');
