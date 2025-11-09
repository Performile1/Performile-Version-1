-- =====================================================
-- VIPPS PAYMENT INTEGRATION
-- =====================================================
-- Date: November 9, 2025
-- Purpose: Add Vipps payment support for subscriptions
-- =====================================================

-- Create vipps_payments table (C2C and Returns only - Stripe handles subscriptions)
CREATE TABLE IF NOT EXISTS vipps_payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(order_id), -- For C2C shipments and returns
  payment_type VARCHAR(50) NOT NULL DEFAULT 'c2c_shipment', -- 'c2c_shipment' or 'return'
  amount INTEGER NOT NULL, -- Amount in øre (NOK cents)
  currency VARCHAR(3) NOT NULL DEFAULT 'NOK',
  status VARCHAR(50) NOT NULL DEFAULT 'INITIATED',
  vipps_payment_id VARCHAR(255),
  metadata JSONB, -- Additional payment data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vipps_payments_reference ON vipps_payments(reference);
CREATE INDEX IF NOT EXISTS idx_vipps_payments_user_id ON vipps_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_vipps_payments_status ON vipps_payments(status);
CREATE INDEX IF NOT EXISTS idx_vipps_payments_payment_type ON vipps_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_vipps_payments_order_id ON vipps_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_vipps_payments_created_at ON vipps_payments(created_at);

-- Add vipps_phone_number to users table (for future use)
ALTER TABLE users ADD COLUMN IF NOT EXISTS vipps_phone_number VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_users_vipps_phone_number ON users(vipps_phone_number);

-- Enable RLS
ALTER TABLE vipps_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS vipps_payments_user_select ON vipps_payments;
DROP POLICY IF EXISTS vipps_payments_user_insert ON vipps_payments;
DROP POLICY IF EXISTS vipps_payments_admin_all ON vipps_payments;

-- RLS Policies for vipps_payments
CREATE POLICY vipps_payments_user_select ON vipps_payments
  FOR SELECT
  USING (
    user_id = current_setting('app.user_id', true)::uuid
    OR current_setting('app.user_role', true) = 'admin'
  );

CREATE POLICY vipps_payments_user_insert ON vipps_payments
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('app.user_id', true)::uuid
  );

-- Admin can view all payments
CREATE POLICY vipps_payments_admin_all ON vipps_payments
  FOR ALL
  USING (current_setting('app.user_role', true) = 'admin');

-- Comments
COMMENT ON TABLE vipps_payments IS 'Stores Vipps payment transactions for C2C shipments and returns (Norway)';
COMMENT ON COLUMN vipps_payments.reference IS 'Unique reference: C2C-{user_id}-{timestamp} or RET-{user_id}-{timestamp}';
COMMENT ON COLUMN vipps_payments.amount IS 'Payment amount in øre (NOK cents)';
COMMENT ON COLUMN vipps_payments.status IS 'Payment status: INITIATED, AUTHORIZED, CAPTURED, CANCELLED, EXPIRED, REFUNDED';
COMMENT ON COLUMN vipps_payments.vipps_payment_id IS 'Vipps internal payment ID';
COMMENT ON COLUMN vipps_payments.payment_type IS 'Payment type: c2c_shipment or return (subscriptions use Stripe)';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'vipps_payments'
) AS vipps_payments_exists;

-- Check columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vipps_payments'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'vipps_payments';

-- Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'vipps_payments';

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get all Vipps payments for a user
-- SELECT * FROM vipps_payments WHERE user_id = 'user-uuid-here' ORDER BY created_at DESC;

-- Get payment status
-- SELECT reference, status, amount, currency, created_at 
-- FROM vipps_payments 
-- WHERE reference = 'SUB-xxx-xxx';

-- Get successful payments
-- SELECT * FROM vipps_payments WHERE status = 'CAPTURED' ORDER BY created_at DESC;

-- Get failed/cancelled payments
-- SELECT * FROM vipps_payments WHERE status IN ('CANCELLED', 'EXPIRED') ORDER BY created_at DESC;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- DROP TABLE IF EXISTS vipps_payments CASCADE;
-- ALTER TABLE users DROP COLUMN IF EXISTS vipps_customer_id;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS payment_method;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS payment_reference;
