-- Supabase Database Update Script
-- Run this in your Supabase SQL Editor to ensure schema compatibility

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
ALTER TABLE Users 
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_role user_role DEFAULT 'consumer',
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- Add constraints to Users table
DO $$ BEGIN
    ALTER TABLE Users ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE Users ADD CONSTRAINT users_email_unique UNIQUE (email);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing SubscriptionPlans table
ALTER TABLE SubscriptionPlans 
ADD COLUMN IF NOT EXISTS plan_id UUID DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS user_role user_role,
ADD COLUMN IF NOT EXISTS price_monthly DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_yearly DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS features_json JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS limits_json JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add primary key to SubscriptionPlans
DO $$ BEGIN
    ALTER TABLE SubscriptionPlans ADD CONSTRAINT subscriptionplans_pkey PRIMARY KEY (plan_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing Stores table
ALTER TABLE Stores 
ADD COLUMN IF NOT EXISTS store_id UUID DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS store_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS owner_user_id UUID,
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID,
ADD COLUMN IF NOT EXISTS website_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS custom_css TEXT,
ADD COLUMN IF NOT EXISTS market_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS integration_limits JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add primary key and foreign keys to Stores
DO $$ BEGIN
    ALTER TABLE Stores ADD CONSTRAINT stores_pkey PRIMARY KEY (store_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE Stores ADD CONSTRAINT stores_owner_fkey FOREIGN KEY (owner_user_id) REFERENCES Users(user_id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing Couriers table
ALTER TABLE Couriers 
ADD COLUMN IF NOT EXISTS courier_id UUID DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS courier_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS service_areas JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS market_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add primary key and foreign keys to Couriers
DO $$ BEGIN
    ALTER TABLE Couriers ADD CONSTRAINT couriers_pkey PRIMARY KEY (courier_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE Couriers ADD CONSTRAINT couriers_user_fkey FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create UserSubscriptions table (links users to subscription plans)
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

-- Create Orders table (required for delivery tracking)
CREATE TABLE IF NOT EXISTS Orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number VARCHAR(100) UNIQUE NOT NULL,
    store_id UUID NOT NULL REFERENCES Stores(store_id),
    courier_id UUID NOT NULL REFERENCES Couriers(courier_id),
    consumer_id UUID REFERENCES Users(user_id),
    
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

-- Create Reviews table (required for rating system)
CREATE TABLE IF NOT EXISTS Reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
    reviewer_user_id UUID REFERENCES Users(user_id),
    
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

-- Create CourierTrustScores table (for trust score calculations)
CREATE TABLE IF NOT EXISTS CourierTrustScores (
    courier_id UUID PRIMARY KEY REFERENCES Couriers(courier_id) ON DELETE CASCADE,
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

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_active ON Users(is_active);

CREATE INDEX IF NOT EXISTS idx_orders_tracking ON Orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_store ON Orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON Orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON Orders(order_status);

CREATE INDEX IF NOT EXISTS idx_couriers_user ON Couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_couriers_active ON Couriers(is_active);

CREATE INDEX IF NOT EXISTS idx_stores_owner ON Stores(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stores_active ON Stores(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON Users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON Users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stores_updated_at ON Stores;
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON Stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_couriers_updated_at ON Couriers;
CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON Couriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON Orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON Orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON Reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON Reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON UserSubscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON UserSubscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans if they don't exist
INSERT INTO SubscriptionPlans (plan_name, user_role, price_monthly, price_yearly, features_json, limits_json)
SELECT 'Basic Merchant', 'merchant', 29.99, 299.99, '{"analytics": true, "integrations": 3}', '{"monthly_orders": 1000}'
WHERE NOT EXISTS (SELECT 1 FROM SubscriptionPlans WHERE plan_name = 'Basic Merchant');

INSERT INTO SubscriptionPlans (plan_name, user_role, price_monthly, price_yearly, features_json, limits_json)
SELECT 'Pro Merchant', 'merchant', 79.99, 799.99, '{"analytics": true, "integrations": 10, "custom_branding": true}', '{"monthly_orders": 5000}'
WHERE NOT EXISTS (SELECT 1 FROM SubscriptionPlans WHERE plan_name = 'Pro Merchant');

INSERT INTO SubscriptionPlans (plan_name, user_role, price_monthly, price_yearly, features_json, limits_json)
SELECT 'Basic Courier', 'courier', 19.99, 199.99, '{"marketplace": true, "analytics": true}', '{"monthly_deliveries": 500}'
WHERE NOT EXISTS (SELECT 1 FROM SubscriptionPlans WHERE plan_name = 'Basic Courier');

INSERT INTO SubscriptionPlans (plan_name, user_role, price_monthly, price_yearly, features_json, limits_json)
SELECT 'Pro Courier', 'courier', 49.99, 499.99, '{"marketplace": true, "analytics": true, "priority_support": true}', '{"monthly_deliveries": 2000}'
WHERE NOT EXISTS (SELECT 1 FROM SubscriptionPlans WHERE plan_name = 'Pro Courier');
