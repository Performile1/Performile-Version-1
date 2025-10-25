-- Shopify integration tables for automatic shipment tracking

-- Shopify store integrations
CREATE TABLE IF NOT EXISTS shopify_integrations (
    integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(store_id) ON DELETE SET NULL,
    shop_domain VARCHAR(255) UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    webhook_secret VARCHAR(128) NOT NULL,
    store_name VARCHAR(255),
    email VARCHAR(255),
    plan_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Shopify-specific columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shopify_order_id VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shopify_fulfillment_id VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS integration_source VARCHAR(50) DEFAULT 'manual';

-- Shopify webhook logs for debugging
CREATE TABLE IF NOT EXISTS shopify_webhook_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES shopify_integrations(integration_id) ON DELETE CASCADE,
    webhook_topic VARCHAR(100) NOT NULL,
    shopify_order_id VARCHAR(50),
    shopify_fulfillment_id VARCHAR(50),
    payload JSONB NOT NULL,
    signature_verified BOOLEAN DEFAULT false,
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processed, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Carrier mapping table for Shopify carriers to our couriers
CREATE TABLE IF NOT EXISTS carrier_mappings (
    mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_carrier_name VARCHAR(255) NOT NULL,
    courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- How confident we are in this mapping
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopify product sync for better order context
CREATE TABLE IF NOT EXISTS shopify_products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES shopify_integrations(integration_id) ON DELETE CASCADE,
    shopify_product_id VARCHAR(50) NOT NULL,
    shopify_variant_id VARCHAR(50),
    title VARCHAR(500),
    sku VARCHAR(255),
    vendor VARCHAR(255),
    product_type VARCHAR(255),
    weight_grams INTEGER,
    requires_shipping BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(integration_id, shopify_product_id, shopify_variant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopify_integrations_shop_domain ON shopify_integrations(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shopify_integrations_user_id ON shopify_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_shopify_order_id ON orders(shopify_order_id) WHERE shopify_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shopify_fulfillment_id ON orders(shopify_fulfillment_id) WHERE shopify_fulfillment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_integration_source ON orders(integration_source);
CREATE INDEX IF NOT EXISTS idx_shopify_webhook_logs_integration_id ON shopify_webhook_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_shopify_webhook_logs_created_at ON shopify_webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_carrier_mappings_shopify_carrier ON carrier_mappings(shopify_carrier_name);
CREATE INDEX IF NOT EXISTS idx_shopify_products_integration_id ON shopify_products(integration_id);
CREATE INDEX IF NOT EXISTS idx_shopify_products_shopify_id ON shopify_products(shopify_product_id);

-- Function to automatically link Shopify integration to store
CREATE OR REPLACE FUNCTION link_shopify_to_store()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to find existing store for this user
    UPDATE shopify_integrations 
    SET store_id = (
        SELECT store_id 
        FROM stores 
        WHERE user_id = NEW.user_id 
        ORDER BY created_at DESC 
        LIMIT 1
    )
    WHERE integration_id = NEW.integration_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically link Shopify integration to store
CREATE TRIGGER trigger_link_shopify_to_store
    AFTER INSERT ON shopify_integrations
    FOR EACH ROW
    EXECUTE FUNCTION link_shopify_to_store();

-- Function to update integration timestamps
CREATE OR REPLACE FUNCTION update_shopify_integration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE TRIGGER trigger_update_shopify_integration_timestamp
    BEFORE UPDATE ON shopify_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_shopify_integration_timestamp();

-- Insert default carrier mappings
INSERT INTO carrier_mappings (shopify_carrier_name, courier_id, confidence_score) 
SELECT 'FedEx', courier_id, 1.0 FROM couriers WHERE LOWER(courier_name) LIKE '%fedex%' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO carrier_mappings (shopify_carrier_name, courier_id, confidence_score) 
SELECT 'UPS', courier_id, 1.0 FROM couriers WHERE LOWER(courier_name) LIKE '%ups%' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO carrier_mappings (shopify_carrier_name, courier_id, confidence_score) 
SELECT 'USPS', courier_id, 1.0 FROM couriers WHERE LOWER(courier_name) LIKE '%usps%' OR LOWER(courier_name) LIKE '%postal%' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO carrier_mappings (shopify_carrier_name, courier_id, confidence_score) 
SELECT 'DHL', courier_id, 1.0 FROM couriers WHERE LOWER(courier_name) LIKE '%dhl%' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO carrier_mappings (shopify_carrier_name, courier_id, confidence_score) 
SELECT 'Canada Post', courier_id, 1.0 FROM couriers WHERE LOWER(courier_name) LIKE '%canada post%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Function to clean up old webhook logs
CREATE OR REPLACE FUNCTION cleanup_shopify_webhook_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM shopify_webhook_logs 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep
    AND processing_status = 'processed';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
