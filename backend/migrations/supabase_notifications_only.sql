-- ============================================================================
-- PERFORMILE PLATFORM - NOTIFICATIONS MIGRATION (Safe Version)
-- Date: October 17, 2025
-- Purpose: Add notifications table only (works with existing schema)
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
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'order', 'review', 'claim', 'system', 'payment', 'subscription'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data related to the notification
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Add foreign key constraint if users table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE notifications 
    ADD CONSTRAINT fk_notification_user 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Foreign key constraint added to users table';
  ELSE
    RAISE NOTICE '⚠️ Users table not found - skipping foreign key constraint';
  END IF;
END $$;

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
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES (SAFE)
-- ============================================================================

-- Add stripe_customer_id to users table if exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
    ) THEN
      ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;
      CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
      COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';
      RAISE NOTICE '✅ Added stripe_customer_id to users table';
    ELSE
      RAISE NOTICE '⚠️ stripe_customer_id already exists in users table';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Users table not found - skipping stripe_customer_id';
  END IF;
END $$;

-- ============================================================================
-- 3. CREATE HELPER FUNCTIONS
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
-- 4. CREATE AUTOMATIC NOTIFICATION TRIGGERS (CONDITIONAL)
-- ============================================================================

-- Trigger to notify merchant when order is created (if orders table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    -- Create trigger function
    CREATE OR REPLACE FUNCTION notify_merchant_new_order()
    RETURNS TRIGGER AS $func$
    DECLARE
      v_merchant_user_id UUID;
    BEGIN
      -- Try to get merchant user_id (adjust based on your schema)
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants') THEN
        SELECT user_id INTO v_merchant_user_id
        FROM merchants
        WHERE merchant_id = NEW.merchant_id;
        
        IF v_merchant_user_id IS NOT NULL THEN
          PERFORM create_notification(
            v_merchant_user_id,
            'order',
            'New Order Received',
            'You have received a new order #' || NEW.order_id,
            jsonb_build_object('order_id', NEW.order_id)
          );
        END IF;
      END IF;
      
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    -- Create trigger
    DROP TRIGGER IF EXISTS trigger_notify_merchant_new_order ON orders;
    CREATE TRIGGER trigger_notify_merchant_new_order
      AFTER INSERT ON orders
      FOR EACH ROW
      EXECUTE FUNCTION notify_merchant_new_order();
      
    RAISE NOTICE '✅ Created trigger for new orders';
  ELSE
    RAISE NOTICE '⚠️ Orders table not found - skipping order trigger';
  END IF;
END $$;

-- Trigger to notify merchant when review is submitted (if reviews table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    -- Create trigger function
    CREATE OR REPLACE FUNCTION notify_merchant_new_review()
    RETURNS TRIGGER AS $func$
    DECLARE
      v_merchant_user_id UUID;
    BEGIN
      -- Try to get merchant user_id
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants') THEN
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
      END IF;
      
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    -- Create trigger
    DROP TRIGGER IF EXISTS trigger_notify_merchant_new_review ON reviews;
    CREATE TRIGGER trigger_notify_merchant_new_review
      AFTER INSERT ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION notify_merchant_new_review();
      
    RAISE NOTICE '✅ Created trigger for new reviews';
  ELSE
    RAISE NOTICE '⚠️ Reviews table not found - skipping review trigger';
  END IF;
END $$;

-- Trigger to notify user when claim status changes (if claims table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claims') THEN
    -- Create trigger function
    CREATE OR REPLACE FUNCTION notify_claim_status_change()
    RETURNS TRIGGER AS $func$
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
    $func$ LANGUAGE plpgsql;
    
    -- Create trigger
    DROP TRIGGER IF EXISTS trigger_notify_claim_status_change ON claims;
    CREATE TRIGGER trigger_notify_claim_status_change
      AFTER UPDATE ON claims
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION notify_claim_status_change();
      
    RAISE NOTICE '✅ Created trigger for claim status changes';
  ELSE
    RAISE NOTICE '⚠️ Claims table not found - skipping claim trigger';
  END IF;
END $$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
DROP POLICY IF EXISTS notifications_select_own ON notifications;
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS notifications_update_own ON notifications;
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
DROP POLICY IF EXISTS notifications_delete_own ON notifications;
CREATE POLICY notifications_delete_own ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: System can insert notifications for any user
DROP POLICY IF EXISTS notifications_insert_system ON notifications;
CREATE POLICY notifications_insert_system ON notifications
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 6. CREATE VIEWS FOR COMMON QUERIES
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
  n.*
FROM notifications n
WHERE n.created_at >= NOW() - INTERVAL '30 days'
ORDER BY n.created_at DESC;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;

-- ============================================================================
-- 8. VERIFICATION
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

DO $$
BEGIN
  RAISE NOTICE '
  ============================================================================
  ✅ PERFORMILE NOTIFICATIONS MIGRATION COMPLETE
  ============================================================================
  
  Created:
  - notifications table with 5 indexes
  - Helper functions (create_notification, mark_notification_read, etc.)
  - Automatic notification triggers (conditional on table existence)
  - Row Level Security policies
  - Views for common queries
  
  Added Columns (if tables exist):
  - users.stripe_customer_id
  
  Next Steps:
  1. Test notification creation
  2. Deploy backend API changes
  3. Test frontend integration
  
  ============================================================================
  ';
END $$;
