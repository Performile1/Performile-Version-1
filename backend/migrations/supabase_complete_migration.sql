-- ============================================================================
-- PERFORMILE PLATFORM - COMPLETE SUPABASE MIGRATION
-- Date: October 17, 2025
-- Purpose: Add missing tables and columns for new API features
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. NOTIFICATIONS TABLE
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'order', 'review', 'claim', 'system', 'payment', 'subscription'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data related to the notification
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Add comments
COMMENT ON TABLE notifications IS 'User notifications for orders, reviews, claims, and system messages';
COMMENT ON COLUMN notifications.type IS 'Type of notification: order, review, claim, system, payment, subscription';
COMMENT ON COLUMN notifications.data IS 'Additional JSON data related to the notification (order_id, review_id, etc.)';

-- ============================================================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add stripe_customer_id to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
    COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';
  END IF;
END $$;

-- Add updated_at to merchants table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE merchants ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    COMMENT ON COLUMN merchants.updated_at IS 'Last update timestamp';
  END IF;
END $$;

-- Add status to merchants table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'status'
  ) THEN
    ALTER TABLE merchants ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));
    CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
    COMMENT ON COLUMN merchants.status IS 'Merchant account status';
  END IF;
END $$;

-- ============================================================================
-- 3. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for merchants updated_at
DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. CREATE NOTIFICATION HELPER FUNCTIONS
-- ============================================================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING notification_id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE notification_id = p_notification_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = p_user_id AND is_read = FALSE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CREATE AUTOMATIC NOTIFICATION TRIGGERS
-- ============================================================================

-- Trigger to notify merchant when order is created
CREATE OR REPLACE FUNCTION notify_merchant_new_order()
RETURNS TRIGGER AS $$
DECLARE
  v_merchant_user_id UUID;
BEGIN
  -- Get merchant user_id
  SELECT user_id INTO v_merchant_user_id
  FROM merchants
  WHERE merchant_id = NEW.merchant_id;
  
  IF v_merchant_user_id IS NOT NULL THEN
    PERFORM create_notification(
      v_merchant_user_id,
      'order',
      'New Order Received',
      'You have received a new order #' || NEW.order_id,
      jsonb_build_object('order_id', NEW.order_id, 'tracking_number', NEW.tracking_number)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_merchant_new_order ON orders;
CREATE TRIGGER trigger_notify_merchant_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_merchant_new_order();

-- Trigger to notify merchant when review is submitted
CREATE OR REPLACE FUNCTION notify_merchant_new_review()
RETURNS TRIGGER AS $$
DECLARE
  v_merchant_user_id UUID;
BEGIN
  -- Get merchant user_id
  SELECT user_id INTO v_merchant_user_id
  FROM merchants
  WHERE merchant_id = NEW.merchant_id;
  
  IF v_merchant_user_id IS NOT NULL THEN
    PERFORM create_notification(
      v_merchant_user_id,
      'review',
      'New Review Received',
      'You have received a new review with ' || NEW.rating || ' stars',
      jsonb_build_object('review_id', NEW.review_id, 'rating', NEW.rating)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_merchant_new_review ON reviews;
CREATE TRIGGER trigger_notify_merchant_new_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_merchant_new_review();

-- Trigger to notify user when claim status changes
CREATE OR REPLACE FUNCTION notify_claim_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM create_notification(
      NEW.user_id,
      'claim',
      'Claim Status Updated',
      'Your claim status has been updated to: ' || NEW.status,
      jsonb_build_object('claim_id', NEW.claim_id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_claim_status_change ON claims;
CREATE TRIGGER trigger_notify_claim_status_change
  AFTER UPDATE ON claims
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_claim_status_change();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY notifications_delete_own ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: System can insert notifications for any user
CREATE POLICY notifications_insert_system ON notifications
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 7. CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Unread notifications count per user
CREATE OR REPLACE VIEW v_unread_notifications_count AS
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM notifications
WHERE is_read = FALSE
GROUP BY user_id;

-- View: Recent notifications (last 30 days)
CREATE OR REPLACE VIEW v_recent_notifications AS
SELECT 
  n.*,
  u.email,
  u.first_name,
  u.last_name
FROM notifications n
INNER JOIN users u ON n.user_id = u.user_id
WHERE n.created_at >= NOW() - INTERVAL '30 days'
ORDER BY n.created_at DESC;

-- ============================================================================
-- 8. SAMPLE DATA FOR TESTING (OPTIONAL - COMMENT OUT FOR PRODUCTION)
-- ============================================================================

-- Uncomment to insert sample notifications for testing
/*
-- Sample notification for testing
INSERT INTO notifications (user_id, type, title, message, data)
SELECT 
  user_id,
  'system',
  'Welcome to Performile!',
  'Thank you for joining Performile. Start tracking your deliveries today!',
  jsonb_build_object('welcome', true)
FROM users
WHERE email = 'admin@performile.com'
LIMIT 1;
*/

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT USAGE ON SEQUENCE notifications_notification_id_seq TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Verify notifications table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    RAISE NOTICE '✅ Notifications table created successfully';
  ELSE
    RAISE EXCEPTION '❌ Notifications table creation failed';
  END IF;
END $$;

-- Verify indexes exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_id') THEN
    RAISE NOTICE '✅ Notifications indexes created successfully';
  ELSE
    RAISE EXCEPTION '❌ Notifications indexes creation failed';
  END IF;
END $$;

-- Verify RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'notifications' AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ Row Level Security enabled on notifications';
  ELSE
    RAISE WARNING '⚠️ Row Level Security not enabled on notifications';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Display summary
DO $$
BEGIN
  RAISE NOTICE '
  ============================================================================
  ✅ PERFORMILE SUPABASE MIGRATION COMPLETE
  ============================================================================
  
  Created:
  - notifications table with indexes
  - Helper functions (create_notification, mark_notification_read, etc.)
  - Automatic notification triggers for orders, reviews, and claims
  - Row Level Security policies
  - Views for common queries
  
  Added Columns:
  - users.stripe_customer_id
  - merchants.updated_at
  - merchants.status
  
  Next Steps:
  1. Verify all tables and functions are created
  2. Test notification creation
  3. Deploy backend API changes
  4. Test frontend integration
  
  ============================================================================
  ';
END $$;
