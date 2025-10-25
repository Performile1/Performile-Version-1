-- Integration system tables for e-commerce callbacks and API management

-- Integrations table for API key management
CREATE TABLE IF NOT EXISTS integrations (
    integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    integration_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(128) UNIQUE NOT NULL,
    callback_url TEXT,
    webhook_secret VARCHAR(128) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add integration_id to orders table for tracking API submissions
ALTER TABLE orders ADD COLUMN IF NOT EXISTS integration_id UUID REFERENCES integrations(integration_id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS callback_url TEXT;

-- API usage logs for monitoring and analytics
CREATE TABLE IF NOT EXISTS api_usage_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES integrations(integration_id) ON DELETE CASCADE,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS webhook_logs (
    webhook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES integrations(integration_id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    callback_url TEXT NOT NULL,
    status_code INTEGER,
    response_body TEXT,
    attempts INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 3,
    next_retry TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integrations_api_key ON integrations(api_key);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_integration_id ON api_usage_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_integration_id ON webhook_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_id ON webhook_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_next_retry ON webhook_logs(next_retry) WHERE next_retry IS NOT NULL;

-- Function to update integration usage
CREATE OR REPLACE FUNCTION update_integration_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE integrations 
    SET usage_count = usage_count + 1, 
        last_used = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE integration_id = NEW.integration_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update usage when API logs are created
CREATE TRIGGER trigger_update_integration_usage
    AFTER INSERT ON api_usage_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_usage();

-- Function to clean up old logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_usage_logs 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM webhook_logs 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep
    AND delivered_at IS NOT NULL;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
