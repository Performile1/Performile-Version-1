-- =====================================================
-- STRIPE C2C PAYMENT INTEGRATION
-- =====================================================
-- Date: November 9, 2025
-- Purpose: Add Stripe as universal fallback for C2C shipments and returns
-- Note: Stripe handles both subscriptions AND C2C payments
-- =====================================================

-- Create stripe_c2c_payments table
CREATE TABLE IF NOT EXISTS stripe_c2c_payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(order_id),
  payment_type VARCHAR(50) NOT NULL DEFAULT 'c2c_shipment',
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  payment_method_type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stripe_c2c_payments_reference ON stripe_c2c_payments(reference);
CREATE INDEX IF NOT EXISTS idx_stripe_c2c_payments_user_id ON stripe_c2c_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_c2c_payments_order_id ON stripe_c2c_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_stripe_c2c_payments_status ON stripe_c2c_payments(status);
CREATE INDEX IF NOT EXISTS idx_stripe_c2c_payments_payment_type ON stripe_c2c_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_stripe_c2c_payments_payment_intent ON stripe_c2c_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_c2c_payments_created_at ON stripe_c2c_payments(created_at);

-- Enable RLS
ALTER TABLE stripe_c2c_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS stripe_c2c_payments_user_select ON stripe_c2c_payments;
DROP POLICY IF EXISTS stripe_c2c_payments_user_insert ON stripe_c2c_payments;
DROP POLICY IF EXISTS stripe_c2c_payments_admin_all ON stripe_c2c_payments;

-- RLS Policies for stripe_c2c_payments
CREATE POLICY stripe_c2c_payments_user_select ON stripe_c2c_payments
  FOR SELECT
  USING (
    user_id = current_setting('app.user_id', true)::uuid
    OR current_setting('app.user_role', true) = 'admin'
  );

CREATE POLICY stripe_c2c_payments_user_insert ON stripe_c2c_payments
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('app.user_id', true)::uuid
  );

CREATE POLICY stripe_c2c_payments_admin_all ON stripe_c2c_payments
  FOR ALL
  USING (current_setting('app.user_role', true) = 'admin');

-- Comments
COMMENT ON TABLE stripe_c2c_payments IS 'Stores Stripe payment transactions for C2C shipments and returns (Global fallback)';
COMMENT ON COLUMN stripe_c2c_payments.reference IS 'Unique reference: C2C-{user_id}-{timestamp} or RET-{user_id}-{timestamp}';
COMMENT ON COLUMN stripe_c2c_payments.amount IS 'Payment amount in cents (EUR/USD/etc)';
COMMENT ON COLUMN stripe_c2c_payments.status IS 'Payment status: pending, succeeded, failed, canceled';
COMMENT ON COLUMN stripe_c2c_payments.stripe_payment_intent_id IS 'Stripe PaymentIntent ID';
COMMENT ON COLUMN stripe_c2c_payments.payment_type IS 'Payment type: c2c_shipment or return';
