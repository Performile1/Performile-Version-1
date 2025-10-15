-- Leads Management System Migration
-- Adds comprehensive leads functionality for courier marketplace

-- Create lead-related enums
DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('active', 'purchased', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_category AS ENUM ('ecommerce', 'retail', 'b2b', 'food_delivery', 'medical', 'automotive', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE follow_up_type AS ENUM ('call', 'email', 'meeting', 'proposal', 'contract');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Main Leads table
CREATE TABLE IF NOT EXISTS Leads (
    lead_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic lead information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lead_category lead_category NOT NULL DEFAULT 'other',
    lead_priority lead_priority NOT NULL DEFAULT 'medium',
    
    -- Creator information (can be merchant or system-generated)
    created_by_user_id UUID REFERENCES Users(user_id) ON DELETE SET NULL,
    created_by_store_id UUID REFERENCES Stores(store_id) ON DELETE SET NULL,
    
    -- Shipment details
    shipment_cost DECIMAL(10,2),
    order_value DECIMAL(10,2),
    estimated_weight DECIMAL(8,2), -- in kg
    estimated_dimensions VARCHAR(100), -- e.g., "30x20x15 cm"
    
    -- Location information
    pickup_postal_code VARCHAR(20),
    delivery_postal_code VARCHAR(20) NOT NULL,
    pickup_city VARCHAR(100),
    delivery_city VARCHAR(100) NOT NULL,
    pickup_country VARCHAR(3) DEFAULT 'SWE',
    delivery_country VARCHAR(3) DEFAULT 'SWE',
    pickup_address TEXT,
    delivery_address TEXT,
    
    -- Merchant contact information
    merchant_contact_name VARCHAR(255),
    merchant_contact_email VARCHAR(255),
    merchant_contact_phone VARCHAR(20),
    merchant_company_name VARCHAR(255),
    
    -- Lead scoring and analytics
    lead_score DECIMAL(5,2) DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    estimated_profit DECIMAL(10,2),
    competition_level INTEGER DEFAULT 1 CHECK (competition_level >= 1 AND competition_level <= 5),
    
    -- Customer history
    is_repeat_customer BOOLEAN DEFAULT FALSE,
    previous_orders_count INTEGER DEFAULT 0,
    total_previous_spend DECIMAL(12,2) DEFAULT 0,
    customer_rating DECIMAL(3,2) CHECK (customer_rating >= 1 AND customer_rating <= 5),
    
    -- Follow-up tracking
    next_follow_up TIMESTAMP WITH TIME ZONE,
    follow_up_type follow_up_type,
    follow_up_notes TEXT,
    last_contacted TIMESTAMP WITH TIME ZONE,
    
    -- Pricing and availability
    lead_price DECIMAL(10,2) NOT NULL DEFAULT 0, -- Price for courier to purchase lead
    is_premium BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status and metadata
    status lead_status DEFAULT 'active',
    view_count INTEGER DEFAULT 0,
    interest_count INTEGER DEFAULT 0, -- Number of couriers who showed interest
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_postal_codes CHECK (
        pickup_postal_code IS NULL OR pickup_postal_code ~ '^[0-9A-Za-z\\s-]{3,20}$'
    ),
    CONSTRAINT valid_delivery_postal_code CHECK (
        delivery_postal_code ~ '^[0-9A-Za-z\\s-]{3,20}$'
    ),
    CONSTRAINT valid_countries CHECK (
        LENGTH(pickup_country) = 3 AND LENGTH(delivery_country) = 3
    ),
    CONSTRAINT valid_email CHECK (
        merchant_contact_email IS NULL OR 
        merchant_contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT positive_amounts CHECK (
        (shipment_cost IS NULL OR shipment_cost >= 0) AND
        (order_value IS NULL OR order_value >= 0) AND
        (estimated_profit IS NULL OR estimated_profit >= 0) AND
        lead_price >= 0
    )
);

-- Lead Purchases table - tracks which couriers purchased which leads
CREATE TABLE IF NOT EXISTS LeadPurchases (
    purchase_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES Leads(lead_id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES Couriers(courier_id) ON DELETE CASCADE,
    purchased_by_user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    
    -- Purchase details
    purchase_price DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'credit',
    transaction_id VARCHAR(255),
    
    -- Status tracking
    is_converted BOOLEAN DEFAULT FALSE, -- Did this lead convert to actual business?
    conversion_value DECIMAL(12,2), -- Value of business generated from this lead
    conversion_date TIMESTAMP WITH TIME ZONE,
    
    -- Follow-up tracking
    first_contact_date TIMESTAMP WITH TIME ZONE,
    last_contact_date TIMESTAMP WITH TIME ZONE,
    contact_attempts INTEGER DEFAULT 0,
    
    -- Feedback and rating
    lead_quality_rating DECIMAL(3,2) CHECK (lead_quality_rating >= 1 AND lead_quality_rating <= 5),
    feedback_notes TEXT,
    
    -- Timestamps
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(lead_id, courier_id), -- Prevent duplicate purchases
    CONSTRAINT positive_purchase_price CHECK (purchase_price >= 0),
    CONSTRAINT valid_conversion_value CHECK (
        conversion_value IS NULL OR conversion_value >= 0
    )
);

-- Lead Views table - tracks lead visibility and interest
CREATE TABLE IF NOT EXISTS LeadViews (
    view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES Leads(lead_id) ON DELETE CASCADE,
    viewer_user_id UUID REFERENCES Users(user_id) ON DELETE SET NULL,
    courier_id UUID REFERENCES Couriers(courier_id) ON DELETE SET NULL,
    
    -- View details
    view_duration INTEGER, -- seconds spent viewing
    showed_interest BOOLEAN DEFAULT FALSE,
    contact_info_viewed BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    referrer_url VARCHAR(500),
    
    -- Timestamps
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for analytics
    INDEX (lead_id, viewed_at),
    INDEX (courier_id, viewed_at)
);

-- Lead Categories table - for flexible categorization
CREATE TABLE IF NOT EXISTS LeadCategories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_description TEXT,
    parent_category_id UUID REFERENCES LeadCategories(category_id),
    
    -- Display settings
    icon_name VARCHAR(50),
    color_code VARCHAR(7), -- hex color
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Tags table - for flexible tagging system
CREATE TABLE IF NOT EXISTS LeadTags (
    tag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_name VARCHAR(50) NOT NULL UNIQUE,
    tag_color VARCHAR(7) DEFAULT '#6B7280', -- hex color
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Tag Associations - many-to-many relationship
CREATE TABLE IF NOT EXISTS LeadTagAssociations (
    lead_id UUID NOT NULL REFERENCES Leads(lead_id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES LeadTags(tag_id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (lead_id, tag_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON Leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_category ON Leads(lead_category);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON Leads(lead_priority);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON Leads(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_store ON Leads(created_by_store_id);
CREATE INDEX IF NOT EXISTS idx_leads_delivery_location ON Leads(delivery_postal_code, delivery_country);
CREATE INDEX IF NOT EXISTS idx_leads_pickup_location ON Leads(pickup_postal_code, pickup_country);
CREATE INDEX IF NOT EXISTS idx_leads_score ON Leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_price ON Leads(lead_price);
CREATE INDEX IF NOT EXISTS idx_leads_expires ON Leads(expires_at);
CREATE INDEX IF NOT EXISTS idx_leads_featured ON Leads(is_featured, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_purchases_courier ON LeadPurchases(courier_id);
CREATE INDEX IF NOT EXISTS idx_lead_purchases_lead ON LeadPurchases(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_purchases_date ON LeadPurchases(purchased_at);
CREATE INDEX IF NOT EXISTS idx_lead_purchases_converted ON LeadPurchases(is_converted);

CREATE INDEX IF NOT EXISTS idx_lead_views_lead ON LeadViews(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_views_courier ON LeadViews(courier_id);
CREATE INDEX IF NOT EXISTS idx_lead_views_date ON LeadViews(viewed_at);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_leads_active_featured ON Leads(status, is_featured, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_leads_location_category ON Leads(delivery_country, delivery_postal_code, lead_category);
CREATE INDEX IF NOT EXISTS idx_leads_price_score ON Leads(lead_price, lead_score DESC) WHERE status = 'active';

-- Updated timestamp triggers
CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON Leads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_purchases_updated_at 
    BEFORE UPDATE ON LeadPurchases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_categories_updated_at 
    BEFORE UPDATE ON LeadCategories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default lead categories
INSERT INTO LeadCategories (category_name, category_description, icon_name, color_code, sort_order)
VALUES 
    ('E-commerce', 'Online retail and marketplace deliveries', 'shopping-cart', '#3B82F6', 1),
    ('Retail', 'Traditional retail store deliveries', 'store', '#10B981', 2),
    ('B2B', 'Business-to-business logistics', 'briefcase', '#8B5CF6', 3),
    ('Food Delivery', 'Restaurant and food service deliveries', 'utensils', '#F59E0B', 4),
    ('Medical', 'Healthcare and pharmaceutical deliveries', 'heart', '#EF4444', 5),
    ('Automotive', 'Auto parts and vehicle-related deliveries', 'car', '#6B7280', 6),
    ('Documents', 'Important document and mail delivery', 'file-text', '#14B8A6', 7),
    ('Furniture', 'Large item and furniture delivery', 'home', '#F97316', 8),
    ('Electronics', 'Technology and electronic device delivery', 'smartphone', '#06B6D4', 9),
    ('Other', 'Miscellaneous delivery services', 'package', '#84CC16', 10)
ON CONFLICT (category_name) DO NOTHING;

-- Insert default lead tags
INSERT INTO LeadTags (tag_name, tag_color)
VALUES 
    ('urgent', '#EF4444'),
    ('high-value', '#10B981'),
    ('recurring', '#3B82F6'),
    ('premium', '#8B5CF6'),
    ('same-day', '#F59E0B'),
    ('fragile', '#F97316'),
    ('bulk', '#6B7280'),
    ('international', '#14B8A6'),
    ('express', '#EC4899'),
    ('eco-friendly', '#84CC16')
ON CONFLICT (tag_name) DO NOTHING;
