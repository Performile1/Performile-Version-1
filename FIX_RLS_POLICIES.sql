-- ============================================================================
-- FIX RLS POLICIES FOR NOTIFICATIONS
-- Run this if you only see 1 policy instead of 4
-- ============================================================================

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS notifications_select_own ON notifications;
DROP POLICY IF EXISTS notifications_update_own ON notifications;
DROP POLICY IF EXISTS notifications_delete_own ON notifications;
DROP POLICY IF EXISTS notifications_insert_system ON notifications;

-- Policy 1: Users can view their own notifications
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can delete their own notifications
CREATE POLICY notifications_delete_own ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy 4: System can insert notifications for any user
CREATE POLICY notifications_insert_system ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Verify policies were created
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Expected output: 4 rows
-- notifications_delete_own | DELETE | Has USING clause | No WITH CHECK clause
-- notifications_insert_system | INSERT | No USING clause | Has WITH CHECK clause
-- notifications_select_own | SELECT | Has USING clause | No WITH CHECK clause
-- notifications_update_own | UPDATE | Has USING clause | Has WITH CHECK clause
