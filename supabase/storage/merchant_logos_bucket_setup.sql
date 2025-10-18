-- Supabase Storage: Merchant Logos Bucket Setup
-- Created: October 18, 2025, 5:22 PM
-- Phase: B.2 - Storage Configuration

-- ============================================
-- STEP 1: Create Storage Bucket
-- ============================================
-- Note: Run this in Supabase Dashboard or via API
-- Bucket Configuration:
--   Name: merchant-logos
--   Public: false (requires authentication)
--   File Size Limit: 2MB (2097152 bytes)
--   Allowed MIME Types: image/png, image/jpeg, image/jpg, image/svg+xml

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-logos',
  'merchant-logos',
  false,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

-- ============================================
-- STEP 2: RLS Policies for Storage
-- ============================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICY 1: Merchants can upload to their own shop folder
-- ============================================
CREATE POLICY merchant_logos_upload ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'merchant-logos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
      SELECT shop_id::text 
      FROM stores 
      WHERE merchant_id = auth.uid()
    )
  );

-- ============================================
-- POLICY 2: Merchants can view their own logos
-- ============================================
CREATE POLICY merchant_logos_select_own ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'merchant-logos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
      SELECT shop_id::text 
      FROM stores 
      WHERE merchant_id = auth.uid()
    )
  );

-- ============================================
-- POLICY 3: Couriers can view all merchant logos
-- ============================================
CREATE POLICY merchant_logos_select_courier ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'merchant-logos' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE user_id = auth.uid() 
      AND user_role = 'courier'
    )
  );

-- ============================================
-- POLICY 4: Admins can view all merchant logos
-- ============================================
CREATE POLICY merchant_logos_select_admin ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'merchant-logos' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE user_id = auth.uid() 
      AND user_role = 'admin'
    )
  );

-- ============================================
-- POLICY 5: Merchants can update their own logos
-- ============================================
CREATE POLICY merchant_logos_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'merchant-logos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
      SELECT shop_id::text 
      FROM stores 
      WHERE merchant_id = auth.uid()
    )
  );

-- ============================================
-- POLICY 6: Merchants can delete their own logos
-- ============================================
CREATE POLICY merchant_logos_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'merchant-logos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
      SELECT shop_id::text 
      FROM stores 
      WHERE merchant_id = auth.uid()
    )
  );

-- ============================================
-- POLICY 7: Admins can delete any logo
-- ============================================
CREATE POLICY merchant_logos_delete_admin ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'merchant-logos' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE user_id = auth.uid() 
      AND user_role = 'admin'
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  -- Check if bucket exists
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'merchant-logos'
  ) THEN
    RAISE NOTICE 'Bucket "merchant-logos" created successfully';
  ELSE
    RAISE WARNING 'Bucket "merchant-logos" not found - create manually in Supabase Dashboard';
  END IF;

  -- Check if policies exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname LIKE 'merchant_logos_%'
  ) THEN
    RAISE NOTICE 'RLS policies created successfully';
  ELSE
    RAISE WARNING 'RLS policies not found';
  END IF;
END $$;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get signed URL for merchant logo
CREATE OR REPLACE FUNCTION get_merchant_logo_url(p_shop_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_logo_url TEXT;
BEGIN
  SELECT logo_url INTO v_logo_url
  FROM stores
  WHERE shop_id = p_shop_id;
  
  RETURN v_logo_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_merchant_logo_url(UUID) TO authenticated;

-- ============================================
-- CLEANUP FUNCTION (Optional)
-- ============================================

-- Function to clean up orphaned logos (logos without corresponding stores)
CREATE OR REPLACE FUNCTION cleanup_orphaned_merchant_logos()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- This would be implemented with Supabase Storage API
  -- For now, just return 0
  RETURN QUERY SELECT 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTES
-- ============================================
-- 1. Bucket must be created via Supabase Dashboard or API first
-- 2. Storage path format: merchant-logos/{shop_id}/logo.{ext}
-- 3. Max file size: 2MB
-- 4. Allowed types: PNG, JPG, JPEG, SVG
-- 5. RLS policies ensure merchants can only access their own logos
-- 6. Couriers and admins can view all logos
-- 7. Only merchants and admins can delete logos

-- ============================================
-- MANUAL STEPS REQUIRED
-- ============================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create new bucket: "merchant-logos"
-- 3. Set public: false
-- 4. Set file size limit: 2097152 (2MB)
-- 5. Set allowed MIME types: image/png, image/jpeg, image/jpg, image/svg+xml
-- 6. Run this SQL file to create RLS policies
