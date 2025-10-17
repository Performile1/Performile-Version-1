-- ============================================================================
-- CREATE GENERATED_REPORTS TABLE
-- Date: October 17, 2025
-- Purpose: Store report generation metadata (Week 2 Day 4-5)
-- Rule #2: Only ADD - no changes to existing tables
-- Strategy: Store metadata, query data from existing analytics tables
-- ============================================================================

-- ============================================================================
-- 1. CREATE GENERATED_REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS generated_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Report configuration
  report_type VARCHAR(50) NOT NULL,
  -- Types: 'platform_overview', 'shop_performance', 'courier_performance', 
  --        'order_details', 'revenue_summary', 'delivery_analytics'
  
  report_format VARCHAR(20) DEFAULT 'pdf',
  -- Formats: 'pdf', 'csv', 'xlsx', 'json'
  
  -- Date range
  date_from TIMESTAMP WITH TIME ZONE,
  date_to TIMESTAMP WITH TIME ZONE,
  
  -- Filters (JSONB for flexibility)
  filters JSONB DEFAULT '{}'::jsonb,
  -- Example: {"shop_id": "uuid", "courier_id": "uuid", "status": "delivered"}
  
  -- File information
  file_url TEXT,
  file_size_bytes INTEGER,
  file_name VARCHAR(255),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending',
  -- Status: 'pending', 'processing', 'completed', 'failed', 'expired'
  
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0,
  
  -- Constraints
  CONSTRAINT valid_report_type CHECK (
    report_type IN (
      'platform_overview',
      'shop_performance', 
      'courier_performance',
      'order_details',
      'revenue_summary',
      'delivery_analytics',
      'review_summary',
      'proximity_analysis'
    )
  ),
  CONSTRAINT valid_report_format CHECK (
    report_format IN ('pdf', 'csv', 'xlsx', 'json')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'expired')
  ),
  CONSTRAINT valid_date_range CHECK (
    date_from IS NULL OR date_to IS NULL OR date_from <= date_to
  )
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_generated_reports_user 
  ON generated_reports(user_id);

CREATE INDEX IF NOT EXISTS idx_generated_reports_status 
  ON generated_reports(status);

CREATE INDEX IF NOT EXISTS idx_generated_reports_type 
  ON generated_reports(report_type);

CREATE INDEX IF NOT EXISTS idx_generated_reports_created 
  ON generated_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_reports_expires 
  ON generated_reports(expires_at) 
  WHERE expires_at IS NOT NULL;

-- Composite index for user's recent reports
CREATE INDEX IF NOT EXISTS idx_generated_reports_user_created 
  ON generated_reports(user_id, created_at DESC);

-- ============================================================================
-- 3. CREATE TRIGGER FOR AUTO-EXPIRATION
-- ============================================================================

-- Function to set expiration date (7 days after completion)
CREATE OR REPLACE FUNCTION set_report_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.expires_at = NEW.completed_at + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_report_expiration
  BEFORE UPDATE ON generated_reports
  FOR EACH ROW
  EXECUTE FUNCTION set_report_expiration();

-- Function to mark expired reports
CREATE OR REPLACE FUNCTION mark_expired_reports()
RETURNS void AS $$
BEGIN
  UPDATE generated_reports
  SET status = 'expired'
  WHERE status = 'completed'
    AND expires_at < NOW()
    AND status != 'expired';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREATE RLS POLICIES
-- ============================================================================

ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY generated_reports_select_own ON generated_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own reports
CREATE POLICY generated_reports_insert_own ON generated_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports (for download tracking)
CREATE POLICY generated_reports_update_own ON generated_reports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reports
CREATE POLICY generated_reports_delete_own ON generated_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can see all reports
CREATE POLICY generated_reports_admin_all ON generated_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON generated_reports TO authenticated;

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function: Get user's report quota usage
CREATE OR REPLACE FUNCTION get_report_quota_usage(p_user_id UUID)
RETURNS TABLE (
  reports_this_month INTEGER,
  reports_limit INTEGER,
  can_generate BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_sub AS (
    SELECT 
      sp.max_reports_per_month,
      COALESCE(us.reports_used_this_month, 0) as used
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.plan_id = us.plan_id
    WHERE us.user_id = p_user_id
      AND us.status = 'active'
    LIMIT 1
  )
  SELECT 
    COALESCE(used, 0)::INTEGER,
    COALESCE(max_reports_per_month, 10)::INTEGER,
    COALESCE(used, 0) < COALESCE(max_reports_per_month, 10) as can_generate
  FROM user_sub;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Clean up expired reports
CREATE OR REPLACE FUNCTION cleanup_expired_reports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired reports older than 30 days
  DELETE FROM generated_reports
  WHERE status = 'expired'
    AND expires_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================

SELECT 
  'generated_reports' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'generated_reports'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
  (SELECT COUNT(*) FROM generated_reports) as row_count;

-- Show structure
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'generated_reports'
ORDER BY ordinal_position;

-- Show indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'generated_reports'
ORDER BY indexname;
