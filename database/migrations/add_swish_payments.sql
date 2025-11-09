-- =====================================================
-- SWISH PAYMENT INTEGRATION (Sweden)
-- =====================================================
-- Date: November 9, 2025
-- Purpose: Add Swish payment support for C2C shipments and returns
-- =====================================================

-- Create swish_payments table (C2C and Returns only - Stripe handles subscriptions)
CREATE TABLE IF NOT EXISTS swish_payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(order_id), -- For C2C shipments and returns
  payment_type VARCHAR(50) NOT NULL DEFAULT 'c2c_shipment', -- 'c2c_shipment' or 'return'
  amount INTEGER NOT NULL, -- Amount in öre (SEK cents)
  currency VARCHAR(3) NOT NULL DEFAULT 'SEK',
  status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
  swish_payment_id VARCHAR(255),
  swish_payment_request_token VARCHAR(255),
  payer_phone_number VARCHAR(20), -- Swedish phone number
  payee_phone_number VARCHAR(20), -- Merchant/Performile phone number
  message TEXT, -- Payment message shown to user
  metadata JSONB, -- Additional payment data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_swish_payments_reference ON swish_payments(reference);
CREATE INDEX IF NOT EXISTS idx_swish_payments_user_id ON swish_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_swish_payments_status ON swish_payments(status);
CREATE INDEX IF NOT EXISTS idx_swish_payments_payment_type ON swish_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_swish_payments_order_id ON swish_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_swish_payments_swish_payment_id ON swish_payments(swish_payment_id);
CREATE INDEX IF NOT EXISTS idx_swish_payments_created_at ON swish_payments(created_at);

-- Add swish_customer_id to users table (for future use)
ALTER TABLE users ADD COLUMN IF NOT EXISTS swish_phone_number VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_users_swish_phone_number ON users(swish_phone_number);

-- Enable RLS
ALTER TABLE swish_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS swish_payments_user_select ON swish_payments;
DROP POLICY IF EXISTS swish_payments_user_insert ON swish_payments;
DROP POLICY IF EXISTS swish_payments_admin_all ON swish_payments;

-- RLS Policies for swish_payments
CREATE POLICY swish_payments_user_select ON swish_payments
  FOR SELECT
  USING (
    user_id = current_setting('app.user_id', true)::uuid
    OR current_setting('app.user_role', true) = 'admin'
  );

CREATE POLICY swish_payments_user_insert ON swish_payments
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('app.user_id', true)::uuid
  );

-- Admin can view all payments
CREATE POLICY swish_payments_admin_all ON swish_payments
  FOR ALL
  USING (current_setting('app.user_role', true) = 'admin');

-- Comments
COMMENT ON TABLE swish_payments IS 'Stores Swish payment transactions for C2C shipments and returns (Sweden)';
COMMENT ON COLUMN swish_payments.reference IS 'Unique reference: C2C-{user_id}-{timestamp} or RET-{user_id}-{timestamp}';
COMMENT ON COLUMN swish_payments.amount IS 'Payment amount in öre (SEK cents)';
COMMENT ON COLUMN swish_payments.status IS 'Payment status: CREATED, PENDING, PAID, DECLINED, ERROR, CANCELLED';
COMMENT ON COLUMN swish_payments.swish_payment_id IS 'Swish internal payment ID';
COMMENT ON COLUMN swish_payments.payment_type IS 'Payment type: c2c_shipment or return (subscriptions use Stripe)';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'swish_payments'
) AS swish_payments_exists;

-- Check columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'swish_payments'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'swish_payments';

-- Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'swish_payments';

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get all Swish payments for a user
-- SELECT * FROM swish_payments WHERE user_id = 'user-uuid-here' ORDER BY created_at DESC;

-- Get C2C shipment payments
-- SELECT * FROM swish_payments WHERE payment_type = 'c2c_shipment' ORDER BY created_at DESC;

-- Get return payments
-- SELECT * FROM swish_payments WHERE payment_type = 'return' ORDER BY created_at DESC;

-- Get successful payments
-- SELECT * FROM swish_payments WHERE status = 'PAID' ORDER BY created_at DESC;

-- Get failed/cancelled payments
-- SELECT * FROM swish_payments WHERE status IN ('DECLINED', 'ERROR', 'CANCELLED') ORDER BY created_at DESC;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- DROP TABLE IF EXISTS swish_payments CASCADE;
-- ALTER TABLE users DROP COLUMN IF EXISTS swish_phone_number;
