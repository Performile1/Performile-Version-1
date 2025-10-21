/**
 * PAYMENT INTEGRATION SCHEMA
 * Stripe payment integration tables
 * Created: October 21, 2025
 */

-- ============================================================================
-- PAYMENT METHODS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_methods (
    payment_method_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- card, bank_account, etc.
    
    -- Card details (if type = 'card')
    card_brand VARCHAR(50), -- visa, mastercard, amex, etc.
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    card_fingerprint VARCHAR(255),
    
    -- Bank account details (if type = 'bank_account')
    bank_name VARCHAR(255),
    bank_last4 VARCHAR(4),
    
    -- Status
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    billing_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_address JSONB, -- {line1, line2, city, state, postal_code, country}
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES user_subscriptions(subscription_id) ON DELETE SET NULL,
    
    -- Stripe references
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    
    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- pending, succeeded, failed, refunded, canceled
    payment_method_id UUID REFERENCES payment_methods(payment_method_id),
    
    -- Description
    description TEXT,
    metadata JSONB, -- Additional payment metadata
    
    -- Failure details
    failure_code VARCHAR(255),
    failure_message TEXT,
    
    -- Refund details
    refunded_amount DECIMAL(10, 2) DEFAULT 0,
    refunded_at TIMESTAMP,
    refund_reason TEXT,
    
    -- Timestamps
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES user_subscriptions(subscription_id) ON DELETE SET NULL,
    
    -- Stripe reference
    stripe_invoice_id VARCHAR(255) UNIQUE,
    
    -- Invoice details
    invoice_number VARCHAR(100) UNIQUE,
    amount_due DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- draft, open, paid, void, uncollectible
    
    -- Billing period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    
    -- Line items
    line_items JSONB, -- Array of {description, amount, quantity}
    
    -- Dates
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    
    -- PDF
    invoice_pdf_url TEXT,
    hosted_invoice_url TEXT,
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_stripe_id ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_period ON invoices(period_start, period_end);

-- ============================================================================
-- WEBHOOK EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Event details
    event_type VARCHAR(255) NOT NULL, -- payment_intent.succeeded, etc.
    event_data JSONB NOT NULL,
    
    -- Processing
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    processing_error TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    received_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed, received_at);

-- ============================================================================
-- UPDATE USER_SUBSCRIPTIONS TABLE
-- ============================================================================

-- Add Stripe-related columns to existing user_subscriptions table
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(payment_method_id),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Payment Methods Policies
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
ON payment_methods FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payment methods"
ON payment_methods FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payment methods"
ON payment_methods FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own payment methods"
ON payment_methods FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Payments Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
ON payments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin can view all payments"
ON payments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.user_id = auth.uid() 
        AND users.user_role = 'admin'
    )
);

-- Invoices Policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
ON invoices FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin can view all invoices"
ON invoices FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.user_id = auth.uid() 
        AND users.user_role = 'admin'
    )
);

-- Webhook Events (admin only)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view webhook events"
ON webhook_events FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.user_id = auth.uid() 
        AND users.user_role = 'admin'
    )
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to set default payment method
CREATE OR REPLACE FUNCTION set_default_payment_method(
    p_user_id UUID,
    p_payment_method_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Unset all other payment methods as default
    UPDATE payment_methods 
    SET is_default = false, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Set the specified payment method as default
    UPDATE payment_methods 
    SET is_default = true, updated_at = NOW()
    WHERE payment_method_id = p_payment_method_id 
    AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's payment summary
CREATE OR REPLACE FUNCTION get_payment_summary(p_user_id UUID)
RETURNS TABLE (
    total_paid DECIMAL,
    total_invoices INTEGER,
    pending_amount DECIMAL,
    last_payment_date TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE 0 END), 0) as total_paid,
        COUNT(DISTINCT i.invoice_id)::INTEGER as total_invoices,
        COALESCE(SUM(CASE WHEN i.status = 'open' THEN i.amount_due ELSE 0 END), 0) as pending_amount,
        MAX(p.paid_at) as last_payment_date
    FROM payments p
    LEFT JOIN invoices i ON i.user_id = p.user_id
    WHERE p.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE payment_methods IS 'Stores user payment methods (cards, bank accounts)';
COMMENT ON TABLE payments IS 'Records all payment transactions';
COMMENT ON TABLE invoices IS 'Stores subscription invoices';
COMMENT ON TABLE webhook_events IS 'Logs Stripe webhook events for processing';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON payment_methods TO authenticated;
GRANT SELECT ON payments TO authenticated;
GRANT SELECT ON invoices TO authenticated;
GRANT SELECT ON webhook_events TO authenticated;
