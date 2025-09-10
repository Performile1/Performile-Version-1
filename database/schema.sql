-- Performile Database Schema
-- Production-ready PostgreSQL schema with TrustScore system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'merchant', 'courier', 'consumer');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired');
CREATE TYPE integration_type AS ENUM ('payment', 'ecommerce', 'transport', 'analytics');
CREATE TYPE communication_channel AS ENUM ('email', 'sms', 'push');
CREATE TYPE rating_link_status AS ENUM ('sent', 'opened', 'completed', 'expired', 'unanswered');

-- Users table - Core authentication and user management
CREATE TABLE Users (
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

-- Subscription Plans - Defines available subscription tiers
CREATE TABLE SubscriptionPlans (
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

-- User Subscriptions - Links users to their subscription plans
CREATE TABLE UserSubscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES SubscriptionPlans(plan_id),
    status subscription_status DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, plan_id, status)
);

-- Stores - Merchant store information
CREATE TABLE Stores (
    store_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name VARCHAR(255) NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    subscription_plan_id UUID REFERENCES SubscriptionPlans(plan_id),
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

-- Couriers - Courier company information
CREATE TABLE Couriers (
    courier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courier_name VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    subscription_plan_id UUID REFERENCES SubscriptionPlans(plan_id),
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

-- Orders (Deliveries) - Core delivery tracking
CREATE TABLE Orders (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_postal_code CHECK (postal_code ~ '^[0-9A-Za-z\\s-]{3,20}$'),
    CONSTRAINT valid_country CHECK (LENGTH(country) = 3),
    CONSTRAINT delivery_after_order CHECK (delivery_date IS NULL OR delivery_date >= order_date)
);

-- Reviews - Customer feedback system
CREATE TABLE Reviews (
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

-- Rating Configurations - Flexible rating system
CREATE TABLE RatingConfigurations (
    config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    config_json JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Configurations - Links users to rating configurations
CREATE TABLE UserConfigurations (
    user_config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES RatingConfigurations(config_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Rating Links - Tracks rating link lifecycle
CREATE TABLE RatingLinks (
    link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
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

-- Integrations - External system connections
CREATE TABLE Integrations (
    integration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    integration_type integration_type NOT NULL,
    provider_name VARCHAR(100) NOT NULL,
    api_key_encrypted TEXT,
    settings_json JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kickbacks - Incentive system
CREATE TABLE Kickbacks (
    kickback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES Reviews(review_id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES Users(user_id),
    courier_id UUID REFERENCES Couriers(courier_id),
    description TEXT NOT NULL,
    value_amount DECIMAL(10,2),
    value_type VARCHAR(50) DEFAULT 'discount',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courier Trust Scores Cache - Performance optimization
CREATE TABLE CourierTrustScores (
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

-- Performance indexes
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_role ON Users(user_role);
CREATE INDEX idx_users_active ON Users(is_active);

CREATE INDEX idx_orders_tracking ON Orders(tracking_number);
CREATE INDEX idx_orders_store ON Orders(store_id);
CREATE INDEX idx_orders_courier ON Orders(courier_id);
CREATE INDEX idx_orders_consumer ON Orders(consumer_id);
CREATE INDEX idx_orders_status ON Orders(order_status);
CREATE INDEX idx_orders_date ON Orders(order_date);
CREATE INDEX idx_orders_postal ON Orders(postal_code);
CREATE INDEX idx_orders_country ON Orders(country);
CREATE INDEX idx_orders_reviewed ON Orders(is_reviewed);

CREATE INDEX idx_reviews_order ON Reviews(order_id);
CREATE INDEX idx_reviews_reviewer ON Reviews(reviewer_user_id);
CREATE INDEX idx_reviews_rating ON Reviews(rating);
CREATE INDEX idx_reviews_date ON Reviews(review_date);

CREATE INDEX idx_couriers_user ON Couriers(user_id);
CREATE INDEX idx_couriers_active ON Couriers(is_active);

CREATE INDEX idx_stores_owner ON Stores(owner_user_id);
CREATE INDEX idx_stores_active ON Stores(is_active);

CREATE INDEX idx_subscriptions_user ON UserSubscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON UserSubscriptions(status);

CREATE INDEX idx_integrations_user ON Integrations(user_id);
CREATE INDEX idx_integrations_type ON Integrations(integration_type);

-- Composite indexes for complex queries
CREATE INDEX idx_orders_courier_status ON Orders(courier_id, order_status);
CREATE INDEX idx_orders_store_date ON Orders(store_id, order_date);
CREATE INDEX idx_reviews_rating_date ON Reviews(rating, review_date);

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON Users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON Stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON Couriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON Orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON Reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON UserSubscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON Integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kickbacks_updated_at BEFORE UPDATE ON Kickbacks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rating_configs_updated_at BEFORE UPDATE ON RatingConfigurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rating_links_updated_at BEFORE UPDATE ON RatingLinks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
