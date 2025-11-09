-- =====================================================
-- RETURNS SYSTEM (RMA - Return Merchandise Authorization)
-- =====================================================
-- Purpose: Handle product returns and refunds
-- Created: November 9, 2025
-- =====================================================

-- Create returns table
CREATE TABLE IF NOT EXISTS returns (
  return_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Return details
  return_number VARCHAR(50) UNIQUE NOT NULL,
  return_reason VARCHAR(50) NOT NULL, -- 'defective', 'wrong_item', 'not_as_described', 'changed_mind', 'other'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'picked_up', 'received', 'refunded', 'cancelled'
  
  -- Description and evidence
  description TEXT NOT NULL,
  photos JSONB DEFAULT '[]'::jsonb, -- Array of photo URLs
  
  -- Refund information
  refund_amount DECIMAL(10, 2),
  refund_method VARCHAR(20), -- 'original_payment', 'store_credit', 'bank_transfer'
  refund_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  
  -- Pickup/shipping details
  pickup_address TEXT,
  pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
  pickup_completed_at TIMESTAMP WITH TIME ZONE,
  tracking_number VARCHAR(100),
  
  -- Admin notes
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_return_number ON returns(return_number);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at DESC);

-- Enable RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own returns" ON returns;
DROP POLICY IF EXISTS "Users can create returns" ON returns;
DROP POLICY IF EXISTS "Admins can view all returns" ON returns;
DROP POLICY IF EXISTS "Admins can update returns" ON returns;

-- RLS Policies
CREATE POLICY "Users can view their own returns"
  ON returns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create returns"
  ON returns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all returns"
  ON returns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

CREATE POLICY "Admins can update returns"
  ON returns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- Create return items table (for partial returns)
CREATE TABLE IF NOT EXISTS return_items (
  return_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(return_id) ON DELETE CASCADE,
  
  -- Item details
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  
  -- Item condition
  condition VARCHAR(20), -- 'unopened', 'opened', 'damaged', 'defective'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for return items
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);

-- Enable RLS on return items
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their return items" ON return_items;
DROP POLICY IF EXISTS "Users can create return items" ON return_items;
DROP POLICY IF EXISTS "Admins can view all return items" ON return_items;

-- RLS Policies for return items
CREATE POLICY "Users can view their return items"
  ON return_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM returns
      WHERE returns.return_id = return_items.return_id
      AND returns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create return items"
  ON return_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM returns
      WHERE returns.return_id = return_items.return_id
      AND returns.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all return items"
  ON return_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- Function to generate return number
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate format: RMA-YYYYMMDD-XXXX
    new_number := 'RMA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM returns WHERE return_number = new_number) INTO exists_check;
    
    -- Exit loop if unique
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate return number
CREATE OR REPLACE FUNCTION set_return_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.return_number IS NULL OR NEW.return_number = '' THEN
    NEW.return_number := generate_return_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_return_number ON returns;
CREATE TRIGGER trigger_set_return_number
  BEFORE INSERT ON returns
  FOR EACH ROW
  EXECUTE FUNCTION set_return_number();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_returns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_returns_updated_at ON returns;
CREATE TRIGGER trigger_update_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION update_returns_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE returns IS 'Return Merchandise Authorization (RMA) system for handling product returns and refunds';
COMMENT ON COLUMN returns.return_reason IS 'Reason for return: defective, wrong_item, not_as_described, changed_mind, other';
COMMENT ON COLUMN returns.status IS 'Return status: pending, approved, rejected, picked_up, received, refunded, cancelled';
COMMENT ON COLUMN returns.refund_method IS 'How refund will be processed: original_payment, store_credit, bank_transfer';
COMMENT ON COLUMN returns.photos IS 'Array of photo URLs showing product condition';

COMMENT ON TABLE return_items IS 'Individual items being returned (supports partial returns)';
COMMENT ON COLUMN return_items.condition IS 'Item condition: unopened, opened, damaged, defective';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('returns', 'return_items')
ORDER BY table_name;

-- Verify indexes
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('returns', 'return_items')
ORDER BY tablename, indexname;

-- Verify RLS policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('returns', 'return_items')
ORDER BY tablename, policyname;

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get all returns for a user
-- SELECT * FROM returns WHERE user_id = 'user-uuid' ORDER BY created_at DESC;

-- Get return with items
-- SELECT 
--   r.*,
--   json_agg(ri.*) as items
-- FROM returns r
-- LEFT JOIN return_items ri ON r.return_id = ri.return_id
-- WHERE r.return_id = 'return-uuid'
-- GROUP BY r.return_id;

-- Get pending returns (admin view)
-- SELECT 
--   r.*,
--   u.full_name,
--   u.email,
--   o.order_number
-- FROM returns r
-- JOIN users u ON r.user_id = u.user_id
-- JOIN orders o ON r.order_id = o.order_id
-- WHERE r.status = 'pending'
-- ORDER BY r.created_at DESC;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- DROP TRIGGER IF EXISTS trigger_update_returns_updated_at ON returns;
-- DROP TRIGGER IF EXISTS trigger_set_return_number ON returns;
-- DROP FUNCTION IF EXISTS update_returns_updated_at();
-- DROP FUNCTION IF EXISTS set_return_number();
-- DROP FUNCTION IF EXISTS generate_return_number();
-- DROP TABLE IF EXISTS return_items CASCADE;
-- DROP TABLE IF EXISTS returns CASCADE;
